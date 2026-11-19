/* =====================================================================
   ALINHA — copiloto de fechamento da Weiss Odontologia
   Um endereço com senha que serve a tela e guarda os dados da equipe:
     • dicas em tempo real durante a consulta (IA);
     • briefing pós-consulta (IA);
     • mensagem pronta com as palavras do paciente (IA);
     • follow-up D0 a D30 (pacientes guardados no servidor);
     • envio opcional do resumo ao Kommo.
   Configuração por variáveis de ambiente (veja .env.exemplo).
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { criarArmazenamento } from "./armazenamento.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(here, "..");              // alinha/
const ASSETS_DIR = path.resolve(APP_DIR, "../assets");   // logotipo do site

const env = process.env;
const CFG = {
  porta: Number(env.PORT || 3000),
  senha: env.SENHA_OPERACIONAL || env.SENHA_ACESSO || "", // senha do perfil Operacional (usuário: operacional; "equipe" também vale)
  senhaCrc: env.SENHA_CRC || "",          // senha do perfil CRC (usuário: crc)
  senhaAdmin: env.SENHA_ADMIN || "",      // senha do administrador (usuário: admin)
  // chave que assina o login: estável entre reinícios e entre as cópias da função na Vercel
  segredo: env.SEGREDO_SESSAO || crypto.createHash("sha256").update("alinha|" + (env.SENHA_ADMIN || "") + "|" + (env.SENHA_OPERACIONAL || env.SENHA_ACESSO || "") + "|" + (env.SENHA_CRC || "") + "|" + (env.ANTHROPIC_API_KEY || "")).digest("hex"),
  kommoSub: env.KOMMO_SUBDOMINIO || "",
  kommoBase: env.KOMMO_URL_BASE || "",
  kommoChaveWebhook: env.KOMMO_CHAVE_WEBHOOK || "",   // chave no endereço do webhook de mensagens
  // Celular por QR code (Evolution API — conector de WhatsApp Web, não oficial)
  evoUrl: (env.EVOLUTION_URL || "").replace(/\/$/, ""),
  evoKey: env.EVOLUTION_API_KEY || "",
  evoInst: env.EVOLUTION_INSTANCIA || "alinha",
  // endereço público oficial (domínio próprio), ex.: https://alinha.odontoweiss.com.br
  appUrl: (env.APP_URL || "").trim().replace(/\/$/, "").replace(/^(?!https?:\/\/)(.+)$/, "https://$1"),
  kommoToken: env.KOMMO_TOKEN || "",
  kommoStatus: { negociacao: null, fechado: 142, perdido: 143 },
  kommoResponsavel: env.KOMMO_RESPONSAVEL_ID ? Number(env.KOMMO_RESPONSAVEL_ID) : null,
  anthropicKey: env.ANTHROPIC_API_KEY || "",
  modelo: env.MODELO_IA || "claude-opus-5-5",
  modeloDicas: env.MODELO_DICAS || env.MODELO_IA || "claude-opus-5-5", // dicas ao vivo (pode usar um modelo mais rápido/barato)
  dados: env.PASTA_DADOS || path.join(APP_DIR, "dados")
};
if (!CFG.senha && !process.env.VERCEL) console.warn("⚠️  SENHA_ACESSO não definida: defina antes de publicar.");
if (!CFG.senhaAdmin) console.warn("ℹ️  SENHA_ADMIN não definida: a senha da equipe terá acesso de administrador.");
const anthropic = CFG.anthropicKey ? new Anthropic({ apiKey: CFG.anthropicKey }) : null;

/* ------------------------------------------------------------------ */
/* dados                                                               */
/* ------------------------------------------------------------------ */
export const VERSAO = JSON.parse(fs.readFileSync(path.join(APP_DIR, "package.json"), "utf8")).version;

/* Estrutura dos dados: quando uma atualização muda o formato, uma migração converte os dados
   antigos automaticamente (com cópia de segurança antes). Para criar uma nova: adicione ao fim da lista. */
const MIGRACOES = [
  // 1: versão inicial do formato (pacientes + ajustes)
  (db) => { db.pacientes = db.pacientes || []; db.ajustes = db.ajustes || {}; }
];
export const STORE = criarArmazenamento({ dados: CFG.dados, prefixo: env.ALINHA_PREFIXO || "alinha" });

// ajustes em memória (funis, etiqueta), recarregados nas rotas que usam o Kommo
let AJC = {};
const AJ = new Proxy({}, { get: (_, k) => AJC[k] ?? ({ etapaPerdido: 143, etapaClientePerdido: 143, etiquetaHumano: "Atendimento humano" })[k] ?? null });

let pronto = null;
export function iniciar() {
  if (!pronto) pronto = (async () => {
    const m = await STORE.meta();
    if ((m.esquema || 0) < MIGRACOES.length || m.versao !== VERSAO) {
      const antes = m.versao;
      if (antes && antes !== VERSAO) await STORE.backup(`antes-da-v${VERSAO}`);
      await STORE.migrar((db) => { for (let i = m.esquema || 0; i < MIGRACOES.length; i++) MIGRACOES[i](db); });
      await STORE.salvarMeta({ esquema: MIGRACOES.length, versao: VERSAO });
      if (antes && antes !== VERSAO) console.log(`Atualizado: v${antes} → v${VERSAO} (dados preservados, cópia de segurança criada)`);
    }
    AJC = await STORE.ajustes();
  })().catch((e) => { pronto = null; throw e; });
  return pronto;
}

/* ------------------------------------------------------------------ */
/* Celular conectado por QR code (Evolution API)                       */
/* ------------------------------------------------------------------ */
const evoOk = () => !!(CFG.evoUrl && CFG.evoKey);
const chaveWebhookEvo = () => crypto.createHash("sha256").update("evo|" + CFG.segredo).digest("hex").slice(0, 32);
async function evo(metodo, rota, corpo) {
  const r = await fetch(CFG.evoUrl + rota, { method: metodo, headers: { apikey: CFG.evoKey, "Content-Type": "application/json" }, body: corpo ? JSON.stringify(corpo) : undefined });
  const txt = await r.text(); let d = null; try { d = txt ? JSON.parse(txt) : null; } catch { d = { texto: txt }; }
  if (!r.ok) { const e = new Error(`Conector do WhatsApp respondeu ${r.status}: ${(d && (d.message || d.error || (d.response && JSON.stringify(d.response.message)))) || txt.slice(0, 160)}`); e.status = r.status; throw e; }
  return d;
}
// foto do perfil do WhatsApp do paciente (pelo celular conectado)
async function fotoEvo(telefone) {
  const n = String(telefone || "").replace(/\D/g, ""); if (!n || !evoOk()) return "";
  const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(`${CFG.evoUrl}/chat/fetchProfilePictureUrl/${encodeURIComponent(CFG.evoInst)}`, { method: "POST", signal: ctrl.signal, headers: { apikey: CFG.evoKey, "Content-Type": "application/json" }, body: JSON.stringify({ number: n }) });
    const d = await r.json().catch(() => ({})); const u = d && (d.profilePictureUrl || d.picture || d.url) || "";
    return /^https:\/\//.test(u) ? String(u).slice(0, 600) : "";
  } finally { clearTimeout(tm); }
}
async function evoEstado() {
  try {
    const d = await evo("GET", `/instance/connectionState/${encodeURIComponent(CFG.evoInst)}`);
    const st = (d && (d.instance ? d.instance.state : d.state)) || "close";
    let numero = "";
    if (st === "open") { try { const f = await evo("GET", `/instance/fetchInstances?instanceName=${encodeURIComponent(CFG.evoInst)}`); const it = Array.isArray(f) ? f[0] : f; numero = String((it && (it.ownerJid || (it.instance && it.instance.owner) || it.owner)) || "").split("@")[0]; } catch { /* sem número */ } }
    return { estado: st === "open" ? "conectado" : st === "connecting" ? "aguardando" : "desconectado", numero };
  } catch (e) { if (e.status === 404) return { estado: "desconectado", numero: "" }; throw e; }
}
async function evoConectar(baseUrl) {
  // cria a instância (se ainda não existir), aponta o webhook para o Alinha e pede o QR code
  try { await evo("POST", "/instance/create", { instanceName: CFG.evoInst, qrcode: true, integration: "WHATSAPP-BAILEYS" }); }
  catch (e) { if (![403, 409].includes(e.status) && !/already|exist|em uso|in use/i.test(e.message)) throw e; }
  const urlWebhook = `${baseUrl}/webhooks/evolution/${chaveWebhookEvo()}`;
  try { await evo("POST", `/webhook/set/${encodeURIComponent(CFG.evoInst)}`, { webhook: { enabled: true, url: urlWebhook, webhookByEvents: false, webhookBase64: false, events: ["MESSAGES_UPSERT"] } }); }
  catch { await evo("POST", `/webhook/set/${encodeURIComponent(CFG.evoInst)}`, { enabled: true, url: urlWebhook, webhook_by_events: false, events: ["MESSAGES_UPSERT"] }); } // formato da v1
  const d = await evo("GET", `/instance/connect/${encodeURIComponent(CFG.evoInst)}`);
  let qr = (d && (d.base64 || (d.qrcode && d.qrcode.base64))) || "";
  if (qr && !qr.startsWith("data:")) qr = "data:image/png;base64," + qr;
  return { qr, codigo: (d && d.pairingCode) || "", estado: qr ? "aguardando" : "conectado" };
}
// mensagem da Evolution → formato de conversa do Alinha (lead = "tel-" + número)
function lerMensagemEvo(corpo) {
  const ev = String(corpo.event || "").toLowerCase().replace(/_/g, ".");
  if (ev && ev !== "messages.upsert") return [];
  const itens = Array.isArray(corpo.data) ? corpo.data : corpo.data && corpo.data.messages ? corpo.data.messages : [corpo.data];
  const out = [];
  for (const m of itens) {
    if (!m || !m.key) continue;
    const jid = String(m.key.remoteJid || "");
    if (!jid.endsWith("@s.whatsapp.net") && !jid.endsWith("@c.us")) continue; // ignora grupos e status
    const msg = m.message || {};
    const texto = msg.conversation || (msg.extendedTextMessage && msg.extendedTextMessage.text) || (msg.imageMessage && (msg.imageMessage.caption || "📷 [imagem]")) || (msg.videoMessage && (msg.videoMessage.caption || "🎬 [vídeo]")) || (msg.audioMessage && "🎧 [áudio]") || (msg.documentMessage && "📎 [documento]") || "";
    if (!texto) continue;
    const tel = jid.split("@")[0];
    out.push({ lead: "tel-" + tel, tel, id: String(m.key.id || ""), deMim: !!m.key.fromMe, nome: m.pushName || "", texto, ts: new Date(Number(m.messageTimestamp || Date.now() / 1000) * 1000).toISOString() });
  }
  return out;
}
// conversa nova no WhatsApp → lead novo no CRM (Ajustes › Permissões: pode desligar)
async function leadAutomatico(lead, C) {
  if (AJ.leadsAutomaticos === false) return;
  const primeira = C.lista.find((m) => m.autor === "cliente"); if (!primeira) return;
  const todos = await STORE.pacientes();
  if (todos.some((x) => String(x.leadId) === String(lead))) return;
  const novo = { id: "l" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex"), leadId: lead, nome: C.nome || (C.telefone ? "WhatsApp " + C.telefone : "Lead " + lead),
    telefone: C.telefone || "", unidade: C.unidade || "", origem: C.origem === "celular" ? "WhatsApp (celular)" : C.origem === "api" ? "API" : "WhatsApp (Kommo)", status: "lead", etapa: "novo", entradaEm: primeira.ts, auto: true, toques: {} };
  await STORE.salvarPaciente(novo);
  await emitir(null, novo, "whatsapp");
}
async function guardarMensagensEvo(lista) {
  const porLead = {};
  lista.forEach((m) => (porLead[m.lead] = porLead[m.lead] || []).push(m));
  for (const [lead, msgs] of Object.entries(porLead)) {
    const existia = await STORE.conversa(lead);
    const C = existia || { lista: [], nome: "", atualizado: 0, origem: "celular" };
    const idsAntes = new Set(C.lista.map((x) => x.id));
    let mudou = false;
    for (const m of msgs) {
      if (!m.deMim && m.nome && !C.nome) C.nome = m.nome.slice(0, 60);
      C.telefone = C.telefone || "+" + m.tel; C.origem = "celular";
      if (C.lista.some((x) => x.id === m.id)) continue;
      C.lista.push({ id: m.id, ts: m.ts, autor: m.deMim ? "clinica" : "cliente", texto: m.texto }); mudou = true;
    }
    if (!mudou) continue;
    C.lista.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)); C.lista = C.lista.slice(-200); C.atualizado = Date.now();
    if (!C.foto && (!C.fotoEm || Date.now() - C.fotoEm > 86400000)) { C.fotoEm = Date.now(); C.foto = await fotoEvo(C.telefone).catch(() => "") || ""; } // foto do perfil do WhatsApp
    await STORE.salvarConversa(lead, C);
    if (!existia) await leadAutomatico(lead, C).catch(() => {});
    for (const m of C.lista.filter((x) => !idsAntes.has(x.id) && x.autor === "cliente")) {
      const pr = disparar("mensagem.recebida", { origem: C.origem === "celular" ? "celular" : "kommo", lead, nome: C.nome || "", telefone: C.telefone || "", texto: m.texto }).catch(() => {});
      if (process.env.VERCEL) await pr;
    }
  }
}
const hostDaRequisicao = (req) => String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
const baseDaRequisicao = (req) => CFG.appUrl || `${(req.headers["x-forwarded-proto"] || "http").split(",")[0]}://${hostDaRequisicao(req)}`;
const hostOficial = () => { try { return CFG.appUrl ? new URL(CFG.appUrl).host.toLowerCase() : ""; } catch { return ""; } };
// só redireciona para o domínio oficial depois que ele já aponta para algum lugar (evita ficar sem acesso antes do DNS)
let dominioPronto = { valor: false, em: 0 };
async function dominioJaAponta() {
  const host = hostOficial(); if (!host) return false;
  if (Date.now() - dominioPronto.em < (dominioPronto.valor ? 3600000 : 300000)) return dominioPronto.valor;
  let ok = false;
  try { const dnsP = await import("node:dns/promises"); const r = await dnsP.lookup(host.split(":")[0]); ok = !!(r && r.address); } catch { ok = false; }
  dominioPronto = { valor: ok, em: Date.now() };
  return ok;
}

/* WhatsApp: mensagens recebidas e enviadas, entregues pelo webhook do Kommo */
function lerMensagensKommo(corpo) {
  // o Kommo envia application/x-www-form-urlencoded com chaves como message[add][0][text]
  const acc = {};
  for (const [k, v] of new URLSearchParams(corpo)) {
    const m = k.match(/^message\[add\]\[(\d+)\]\[([^\]]+)\](?:\[([^\]]+)\])?$/);
    if (!m) continue;
    acc[m[1]] = acc[m[1]] || {};
    if (m[3]) { acc[m[1]][m[2]] = acc[m[1]][m[2]] || {}; acc[m[1]][m[2]][m[3]] = v; } else acc[m[1]][m[2]] = v;
  }
  return Object.values(acc);
}
async function guardarWhatsApp(lista) {
  const porLead = {};
  for (const msg of lista) { const lead = String(msg.entity_id || msg.element_id || ""); if (lead) (porLead[lead] = porLead[lead] || []).push(msg); }
  for (const [lead, msgs] of Object.entries(porLead)) {
    const existia = await STORE.conversa(lead);
    const C = existia || { lista: [], nome: "", atualizado: 0 };
    const idsAntes = new Set(C.lista.map((x) => x.id));
    let mudou = false;
    for (const msg of msgs) {
      const anexo = msg.attachment && msg.attachment.link ? String(msg.attachment.link) : "";
      const ehAudio = !!anexo && /voice|audio/i.test(String((msg.attachment && msg.attachment.type) || "") + anexo);
      if (!msg.text && !anexo) continue;
      const ts = msg.created_at ? new Date(Number(msg.created_at) * 1000).toISOString() : new Date().toISOString();
      const id = String(msg.id || lead + "-" + ts);
      const autorInfo = JSON.stringify(msg.author || {}).toLowerCase();
      if (msg.type !== "outgoing" && msg.author && msg.author.name && !C.nome) C.nome = String(msg.author.name).slice(0, 60);
      if (msg.type !== "outgoing" && msg.author && /^https:\/\//.test(msg.author.avatar_url || "")) C.foto = String(msg.author.avatar_url).slice(0, 600); // foto do perfil do WhatsApp
      if (C.lista.some((x) => x.id === id)) continue;
      C.lista.push({ id, ts, autor: msg.type === "outgoing" ? "clinica" : "cliente", ia: msg.type === "outgoing" && /bot|robo|\bia\b|assistente|salesbot|n8n|gpt|claude/.test(autorInfo),
        texto: String(msg.text || (ehAudio ? "🎧 [áudio]" : "📎 [anexo]")), anexo: anexo || null });
      mudou = true;
    }
    if (!mudou) continue;
    C.lista.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)); // estável: mesma hora mantém a ordem de chegada
    C.lista = C.lista.slice(-200); C.atualizado = Date.now();
    await STORE.salvarConversa(lead, C);
    if (!existia) await leadAutomatico(lead, C).catch(() => {});
    for (const m of C.lista.filter((x) => !idsAntes.has(x.id) && x.autor === "cliente")) {
      const pr = disparar("mensagem.recebida", { origem: C.origem === "celular" ? "celular" : "kommo", lead, nome: C.nome || "", telefone: C.telefone || "", texto: m.texto }).catch(() => {});
      if (process.env.VERCEL) await pr;
    }
  }
}

/* ------------------------------------------------------------------ */
/* utilidades HTTP e sessão                                            */
/* ------------------------------------------------------------------ */
const TIPOS = { ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".css": "text/css" };

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function lerCorpo(req, limite = 2 * 1024 * 1024) {
  if (req.readableEnded && req.body !== undefined) { // corpo já lido pela hospedagem (ex.: Vercel)
    const b = req.body;
    if (Buffer.isBuffer(b)) return Promise.resolve(b);
    if (typeof b === "string") return Promise.resolve(Buffer.from(b));
    const tipo = String(req.headers["content-type"] || "");
    return Promise.resolve(Buffer.from(tipo.includes("json") ? JSON.stringify(b || {}) : new URLSearchParams(b || {}).toString()));
  }
  return new Promise((resolve, reject) => {
    const partes = []; let total = 0;
    req.on("data", (c) => { total += c.length; if (total > limite) { reject(new Error("Arquivo grande demais")); req.destroy(); } else partes.push(c); });
    req.on("end", () => resolve(Buffer.concat(partes)));
    req.on("error", reject);
  });
}
async function lerJSON(req) { const b = await lerCorpo(req); return b.length ? JSON.parse(b.toString("utf8")) : {}; }


const assinar = (v) => crypto.createHmac("sha256", CFG.segredo).update(v).digest("hex");
function cookieSessao(papel) {
  const exp = Date.now() + 12 * 3600 * 1000; // 12 horas
  return `${exp}.${papel}.${assinar(exp + "." + papel)}`;
}
// devolve o papel da sessão ("admin", "operacional" ou "crc") ou null
function sessaoValida(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)alinha=([^;]+)/);
  if (!m) return null;
  const [exp, papel, sig] = decodeURIComponent(m[1]).split(".");
  if (!exp || !papel || !sig || Number(exp) < Date.now() || !["admin", "operacional", "crc", "equipe"].includes(papel)) return null;
  const esperado = assinar(exp + "." + papel);
  return sig.length === esperado.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado)) ? (papel === "equipe" ? "operacional" : papel) : null;
}
const igual = (a, b) => !!b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function autenticar(usuario, senha) {
  const u = String(usuario || "").trim().toLowerCase();
  if (u === "admin") return igual(senha, CFG.senhaAdmin) ? "admin" : null;
  if (u === "crc") return igual(senha, CFG.senhaCrc) ? "crc" : null;
  if (u === "operacional" || u === "equipe" || u === "") {
    if (igual(senha, CFG.senha)) return CFG.senhaAdmin ? "operacional" : "admin"; // sem senha de admin, a senha única dá acesso total
  }
  return null;
}
/* permissões por perfil (o administrador ajusta em Ajustes › Permissões) */
const TELAS = ["hoje", "whatsapp", "crm", "consulta", "briefings", "followup", "comercial", "tratamentos", "resultados", "campanhas"];
const ACOES_CONFIG = ["enviar_whatsapp", "exportar"];
const PERM_PADRAO = {
  operacional: { telas: ["hoje", "crm", "consulta", "briefings", "followup", "comercial", "tratamentos"], acoes: [] },
  crc: { telas: ["hoje", "whatsapp", "crm", "briefings", "followup", "comercial", "tratamentos"], acoes: ["enviar_whatsapp"] }
};
function permissoes(papel) {
  if (papel === "admin") return { telas: [...TELAS, "suporte", "ajustes"], acoes: [...ACOES_CONFIG, "apagar", "configurar"] };
  const c = (AJC.permissoes && AJC.permissoes[papel]) || PERM_PADRAO[papel] || { telas: [], acoes: [] };
  const telas = [...(c.telas || [])];
  if (c.v !== 2 && telas.includes("comercial")) telas.push("crm", "tratamentos"); // permissões salvas antes do CRM e dos Tratamentos
  return { telas: [...new Set(telas.filter((t) => TELAS.includes(t)))].concat("suporte", "ajustes"), acoes: (c.acoes || []).filter((a) => ACOES_CONFIG.includes(a)) };
}
const pode = (papel, k) => { const P = permissoes(papel); return P.telas.includes(k) || P.acoes.includes(k); };
const ehHttps = (req) => (req.headers["x-forwarded-proto"] || "").includes("https");

/* verificação em duas etapas: código de 6 números do Google Authenticator (TOTP, RFC 6238) */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(buf) { let bits = "", out = ""; for (const b of buf) bits += b.toString(2).padStart(8, "0"); for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)]; return out; }
function deBase32(s) { let bits = ""; for (const c of String(s).replace(/=+$/, "").toUpperCase()) { const v = B32.indexOf(c); if (v >= 0) bits += v.toString(2).padStart(5, "0"); } const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); }
function totp(segredo, passo) {
  const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(passo));
  const h = crypto.createHmac("sha1", deBase32(segredo)).update(b).digest(), o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1000000).padStart(6, "0");
}
const usadosTotp = new Map(); // impede reaproveitar o mesmo código
function totpConfere(segredo, codigo, chave) {
  const c = String(codigo || "").replace(/\D/g, ""); if (c.length !== 6 || !segredo) return false;
  const agora = Math.floor(Date.now() / 30000);
  for (const k of [0, -1, 1]) {
    const passo = agora + k;
    if (crypto.timingSafeEqual(Buffer.from(totp(segredo, passo)), Buffer.from(c))) {
      if (chave) { if ((usadosTotp.get(chave) || -1) >= passo) return false; usadosTotp.set(chave, passo); }
      return true;
    }
  }
  return false;
}
const cookie2fa = (papel) => { const exp = Date.now() + 5 * 60 * 1000; return `${exp}.${papel}.${assinar("2fa." + exp + "." + papel)}`; };
function pendente2fa(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)alinha2fa=([^;]+)/); if (!m) return null;
  const [exp, papel, sig] = decodeURIComponent(m[1]).split(".");
  if (!exp || !papel || !sig || Number(exp) < Date.now()) return null;
  const esp = assinar("2fa." + exp + "." + papel);
  return sig.length === esp.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esp)) ? papel : null;
}

const tentativas = new Map(); // proteção simples contra força bruta
function bloqueado(ip) { const t = tentativas.get(ip); return t && t.n >= 8 && Date.now() - t.em < 15 * 60 * 1000; }
function falhou(ip) { const t = tentativas.get(ip) || { n: 0, em: Date.now() }; t.n++; t.em = Date.now(); tentativas.set(ip, t); }


function paginaLogin(erro = "", etapaCodigo = false) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Alinha · Gestão Infinity</title><link rel="icon" href="logo.svg"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&display=swap"><style>
:root{--bg:#0A0A1C;--card:#13122B;--fg:#EEEDFF;--dim:#CDCAF2;--accent:#7C6CF6;--line:rgba(167,158,255,.18);--bad:#FF7A72;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg) radial-gradient(900px 500px at 70% -10%,rgba(124,108,246,.25),transparent 60%);color:var(--fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:30px;width:100%;max-width:360px;display:grid;gap:12px}
.logo{display:flex;flex-direction:column;align-items:center;text-align:center;gap:2px;margin-bottom:4px}.logo svg{width:96px;height:51px}.logo b{font-family:Cinzel,Georgia,serif;font-weight:600;font-size:38px;letter-spacing:.03em;line-height:1;background:linear-gradient(180deg,#F3EEFF,#B9A2F5);-webkit-background-clip:text;background-clip:text;color:transparent}.logo span{font-family:Cinzel,Georgia,serif;font-size:14px;letter-spacing:.14em;color:#D9CFF8}p{margin:0;color:var(--dim);font-size:15px}
input{font:inherit;color:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}.err{color:var(--bad);font-weight:600}.lema{color:var(--fg);font-size:14.5px;line-height:1.5}.lema b{color:#A79BFF}.small{font-size:12px}
</style></head><body><form method="post" action="${etapaCodigo ? "login/2fa" : "login"}">
<div class="logo"><svg aria-hidden="true" viewBox="0 0 120 64"><defs><linearGradient id="mkA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B9A0EE"/><stop offset=".4" stop-color="#6A3FBF"/><stop offset="1" stop-color="#2A1150"/></linearGradient><linearGradient id="mkB" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2A1150"/><stop offset=".55" stop-color="#5E35B1"/><stop offset="1" stop-color="#CDB9F7"/></linearGradient><linearGradient id="mkC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#341869"/><stop offset=".5" stop-color="#7A50CF"/><stop offset="1" stop-color="#341869"/></linearGradient></defs><g fill="none" stroke-linecap="round"><path d="M60 32C50 18 39 9 27 9 14 9 6 19 6 32s8 23 21 23c12 0 23-9 33-23" stroke="url(#mkA)" stroke-width="10"/><path d="M60 32c10 14 21 23 33 23 13 0 21-10 21-23S106 9 93 9C81 9 70 18 60 32" stroke="url(#mkB)" stroke-width="10"/><path d="M47 18c5 4 9 9 13 14s8 10 13 14" stroke="url(#mkC)" stroke-width="10.5"/><path d="M14 22c3-6 8-8 13-8" stroke="#fff" stroke-opacity=".38" stroke-width="2"/><path d="M93 14c6 0 11 3 13 9" stroke="#fff" stroke-opacity=".38" stroke-width="2"/></g></svg><b>ALINHA</b><span>GESTÃO INFINITY</span></div><p class="lema">Alinha a conversa, o orçamento, o fechamento e o tratamento.<br><b>Do primeiro contato ao sorriso alinhado.</b></p><p class="small">Weiss Odontologia</p>
${erro ? `<p class="err">${erro}</p>` : ""}
${etapaCodigo ? `<label for="codigo" style="font-size:13px;font-weight:600">Código do Google Authenticator</label>
<input id="codigo" name="codigo" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" maxlength="7" placeholder="000 000" required autofocus style="letter-spacing:.3em;font-size:20px;text-align:center">
<p class="small">Abra o Google Authenticator no celular e digite os 6 números de "Alinha".</p>
<button type="submit">Confirmar</button><a href="sair" style="color:var(--dim);font-size:13px;text-align:center">Voltar</a>` : `<label for="usuario" style="font-size:13px;font-weight:600">Usuário</label>
<input id="usuario" name="usuario" autocomplete="username" placeholder="admin, operacional ou crc" value="" autocapitalize="none" spellcheck="false">
<label for="senha" style="font-size:13px;font-weight:600">Senha</label>
<input id="senha" name="senha" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Entrar</button>`}</form></body></html>`;
}

/* ------------------------------------------------------------------ */
/* KOMMO (opcional)                                                    */
/* ------------------------------------------------------------------ */
const kommoOk = () => !!((CFG.kommoSub || CFG.kommoBase) && CFG.kommoToken);
async function kommo(metodo, rota, corpo) {
  const r = await fetch(`${CFG.kommoBase || `https://${CFG.kommoSub}.kommo.com`}${rota}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${CFG.kommoToken}`, "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  if (r.status === 204) return null;
  const txt = await r.text();
  let d = null; try { d = txt ? JSON.parse(txt) : null; } catch { d = { texto: txt }; }
  if (!r.ok) {
    const det = d && (d.detail || d.title || (d["validation-errors"] && JSON.stringify(d["validation-errors"]))) || txt.slice(0, 200);
    throw new Error(`Kommo respondeu ${r.status}: ${det}`);
  }
  return d;
}

/* Regra da Weiss: o card só vai para o FUNIL DE CLIENTES quando o paciente COMPARECE na clínica.
   Enquanto não comparece (conversa só pelo WhatsApp), ele continua no FUNIL DE LEADS. */
function destinoNoFunil(resultado, compareceu) {
  if (compareceu && AJ.funilCliente) {
    const st = resultado === "fechado" ? (AJ.etapaClienteFechou || AJ.etapaCliente)
      : resultado === "perdido" ? (AJ.etapaClientePerdido || 143)
      : AJ.etapaCliente;
    return st ? { pipeline_id: AJ.funilCliente, status_id: st } : { pipeline_id: AJ.funilCliente };
  }
  if (resultado === "perdido") {
    const st = AJ.etapaPerdido || 143;
    return AJ.funilLead ? { pipeline_id: AJ.funilLead, status_id: st } : { status_id: st };
  }
  // em negociação, ou fechou pelo WhatsApp sem ter vindo: segue no funil de leads
  if (AJ.funilLead && AJ.etapaNegociacao) return { pipeline_id: AJ.funilLead, status_id: AJ.etapaNegociacao };
  return {};
}

const UNIDADES = { Caruaru: ["caruaru", "998368491", "37212866"], Recife: ["recife", "973185005", "30911895"] };
function detectarUnidade(...fontes) {
  const t = JSON.stringify(fontes).toLowerCase().replace(/[\s()+-]/g, "");
  for (const [u, pistas] of Object.entries(UNIDADES)) if (pistas.some((x) => t.includes(x))) return u;
  return "";
}
function detectarOrigem(...fontes) {
  const t = JSON.stringify(fontes).toLowerCase();
  if (/facebook|instagram|meta|fb_|\bfb\b|ig_|utm_source.{0,6}(fb|ig)/.test(t)) return "Anúncio Meta";
  if (/google/.test(t)) return "Google";
  if (/indica/.test(t)) return "Indicação";
  return "";
}

/* Lê um lead do Kommo (por ID ou telefone) com contato, funil, etapa, unidade e situação da IA */
async function lerLeadKommo({ id, telefone }) {
  let leadId = id ? Number(id) : null;
  if (!leadId && telefone) {
    const tel = String(telefone).replace(/\D/g, "");
    const nac = tel.startsWith("55") && tel.length > 11 ? tel.slice(2) : tel;
    const busca = await kommo("GET", `/api/v4/contacts?query=${encodeURIComponent(nac)}&with=leads`);
    const ct = busca && busca._embedded && busca._embedded.contacts && busca._embedded.contacts[0];
    const leads = ct && ct._embedded && ct._embedded.leads || [];
    if (leads.length) leadId = Math.max(...leads.map((l) => l.id));
  }
  if (!leadId) return null;
  const lead = await kommo("GET", `/api/v4/leads/${leadId}?with=contacts,source`);
  if (!lead) return null;
  const ctRef = lead._embedded && lead._embedded.contacts && (lead._embedded.contacts.find((c) => c.is_main) || lead._embedded.contacts[0]);
  const contato = ctRef ? await kommo("GET", `/api/v4/contacts/${ctRef.id}`) : null;
  const campoTel = contato && (contato.custom_fields_values || []).find((f) => f.field_code === "PHONE");
  const tags = (lead._embedded && lead._embedded.tags || []).map((t) => t.name);
  let funil = "", etapa = "";
  try {
    const pl = await kommo("GET", `/api/v4/leads/pipelines/${lead.pipeline_id}`);
    funil = pl ? pl.name : "";
    const st = pl && pl._embedded && pl._embedded.statuses.find((x) => x.id === lead.status_id);
    etapa = st ? st.name : "";
  } catch { /* sem permissão para funis */ }
  const fontes = [tags, lead._embedded && lead._embedded.source, lead.custom_fields_values, contato && contato.custom_fields_values, funil];
  return {
    lead_id: lead.id,
    nome: (contato && contato.name) || lead.name || "",
    telefone: campoTel && campoTel.values && campoTel.values[0] ? campoTel.values[0].value : "",
    unidade: detectarUnidade(...fontes),
    origem: detectarOrigem(...fontes),
    funil, etapa, valor: lead.price || 0, tags,
    humano: tags.some((t) => t.toLowerCase() === String(AJ.etiquetaHumano).toLowerCase())
  };
}

async function registrarNoKommo(b) {
  const p = b.paciente || {}, c = b.consulta || {}, o = b.orcamento || {};
  const tel = String(p.telefone || "").replace(/\D/g, "");
  if (!tel) throw new Error("Telefone do paciente ausente");
  const telNacional = tel.startsWith("55") && tel.length > 11 ? tel.slice(2) : tel;
  const resultado = b.resultado || "negociacao";
  const canal = c.canal === "presencial" ? "Presencial" : "WhatsApp";
  const tags = ["Copiloto", canal, c.unidade, o.tratamento].filter(Boolean).map((name) => ({ name }));
  if (c.compareceu) tags.push({ name: "Compareceu" });
  else if (resultado === "fechado") tags.push({ name: "Fechou — aguardando comparecimento" });
  if ((b.temperatura || 0) >= 70) tags.push({ name: "Lead quente" });

  const lead = { price: Math.round(o.valor || 0), ...destinoNoFunil(resultado, !!c.compareceu) };
  if (CFG.kommoResponsavel) lead.responsible_user_id = CFG.kommoResponsavel;

  // 1) encontra o lead: o informado na tela ou o mais recente do contato com esse telefone
  let leadId = p.lead_id ? Number(p.lead_id) : null;
  let contato = null;
  if (!leadId) {
    const busca = await kommo("GET", `/api/v4/contacts?query=${encodeURIComponent(telNacional)}&with=leads`);
    contato = busca && busca._embedded && busca._embedded.contacts && busca._embedded.contacts[0] || null;
    const leads = contato && contato._embedded && contato._embedded.leads || [];
    if (leads.length) leadId = Math.max(...leads.map((l) => l.id));
  }

  // 2) atualiza ou cria
  if (leadId) {
    await kommo("PATCH", `/api/v4/leads/${leadId}`, { ...lead, tags_to_add: tags });
  } else {
    const novo = await kommo("POST", "/api/v4/leads/complex", [{
      name: `${p.nome || "Paciente"} — Copiloto`, ...lead,
      _embedded: {
        tags,
        contacts: [contato ? { id: contato.id } : {
          first_name: p.nome || "Paciente",
          custom_fields_values: [{ field_code: "PHONE", values: [{ value: "+" + tel, enum_code: "MOB" }] }]
        }]
      }
    }]);
    leadId = novo && novo[0] && novo[0].id;
    if (!leadId) throw new Error("O Kommo não devolveu o ID do lead criado");
  }

  // 3) nota com resumo + transcrição
  let transcricao = (b.transcricao || []).map((m) => `${m.quem === "cliente" ? "Paciente" : "Clínica"}: ${m.texto}`).join("\n");
  if (transcricao.length > 12000) transcricao = "…\n" + transcricao.slice(-12000);
  const nota = (b.resumo || "Consulta registrada pelo copiloto") + (transcricao ? "\n\n— TRANSCRIÇÃO —\n" + transcricao : "");
  await kommo("POST", `/api/v4/leads/${leadId}/notes`, [{ note_type: "common", params: { text: nota } }]);

  // 4) tarefa de retorno
  if (b.proximo_contato) {
    await kommo("POST", "/api/v4/tasks", [{
      text: `Retornar contato com ${p.nome || "paciente"} (combinado na consulta — copiloto)`,
      complete_till: Math.floor(new Date(b.proximo_contato).getTime() / 1000),
      entity_id: leadId, entity_type: "leads", task_type_id: 1
    }]);
  }
  return leadId;
}


/* ------------------------------------------------------------------ */
/* IA (Claude)                                                         */
/* ------------------------------------------------------------------ */
const CLINICA = `Weiss Odontologia (Caruaru e Recife), clínica de Ortodontia do Dr. Edelweiss Jr, especialista e mestre em Ortodontia. Diferenciais: check-up digital com o scanner iTero (sorriso em 3D, sem massinha, com simulação do resultado), pioneiros do Invisalign em Caruaru, alinhadores transparentes e aparelhos fixos.
Caruaru: R. dos Expedicionários, 104, 1º andar, Nossa Sra. das Dores · WhatsApp (81) 99836-8491. Recife: Av. República do Líbano, 251, Torre 1, Sala 1614, Pina · WhatsApp (81) 97318-5005.
Regras éticas: nunca prometer ou garantir resultado clínico; não inventar valores, descontos, prazos ou condições; urgência só se for real; não falar mal de concorrentes; não dar diagnóstico pelo WhatsApp.`;

async function chamarIA({ sistema, prompt, esforco = "low", modelo }) {
  const resp = await anthropic.beta.messages.create({
    model: modelo || CFG.modelo,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: esforco },
    system: sistema,
    messages: [{ role: "user", content: prompt }]
  });
  if (resp.stop_reason === "refusal") throw new Error("A IA não respondeu a este pedido.");
  const texto = resp.content.filter((x) => x.type === "text").map((x) => x.text).join("").trim();
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Resposta da IA fora do formato");
  return JSON.parse(m[0]);
}
const fmtTranscricao = (lista = []) => lista.map((m) => `${m.quem === "paciente" ? "PACIENTE" : m.quem === "acompanhante" ? "ACOMPANHANTE" : "PROFISSIONAL"}: ${m.texto}`).join("\n");

const METODO = `MÉTODO DE VENDAS (use de forma natural, sem citar nomes de técnicas ao paciente):
- SPIN: conduza por perguntas de Situação, Problema, Implicação e Necessidade de solução; o paciente deve dizer com as palavras dele o que incomoda e o que mudaria.
- N.E.A.T.: qualifique Necessidade real, impacto Econômico (o que cabe no mês e o valor de resolver), Acesso a quem decide (cônjuge, pais) e Tempo (prazo/evento).
- Venda conceitual: descubra como o paciente imagina o resultado ideal e confirme esse "conceito" com as palavras dele.
- SNAP (principalmente no WhatsApp): mensagens Simples, que tragam algo de Valor, Alinhadas ao objetivo do paciente e que ajudem a Priorizar a decisão.
- Venda desafiadora: ensine algo novo e relevante (ex.: alinhar facilita a higiene; o planejamento digital mostra o resultado antes), adapte ao caso e conduza ao próximo passo com segurança.
- Sandler: faça o "contrato inicial" (no fim, o paciente diz com sinceridade se faz sentido ou não), aprofunde a dor com perguntas e deixe o paciente à vontade para dizer não.
- Venda centrada no cliente: mais perguntas que apresentação; fale do resultado, não do aparelho; recomende uma solução para o caso dele.
PRINCÍPIOS DE ATENDIMENTO (funis de clínica):
- Acolha antes de vender; nunca responda com catálogo frio. O objetivo da avaliação é entender o caso e indicar o melhor caminho.
- O check-up digital com o iTero é o "diagnóstico que mostra valor": conduza o lead até ele com um convite suave ("Quer que eu veja os horários?").
- Escassez só se for real. Faça o próximo agendamento antes de o paciente sair. Use prova social (casos parecidos, depoimentos) com autorização e dentro das normas do CFO.
- Quem não fechou é reativado com 30, 60 e 90 dias, sempre com algo de valor e sem pressão.`;

const DISC_TXT = `PERFIL DISC (leitura indicativa do jeito de se comunicar, nunca um rótulo para o paciente; não mencione "DISC" na mensagem):
- D (Dominante): direto, quer resultado, prazo e valor; mensagens curtas. Fale objetivo, dê opções e deixe decidir.
- I (Influente): caloroso, emocional, fala de fotos, eventos, pessoas; usa emojis. Fale do sorriso e da experiência, com entusiasmo.
- S (Estável): cauteloso, busca segurança, medo de dor, decide com a família. Passe segurança, explique passo a passo, sem pressa.
- C (Analítico): pergunta como funciona, etapas, garantia, diferenças. Seja preciso, mostre o que está incluído e a tecnologia.
Os números D, I, S e C somam 100.`;
const JSON_DISC = `"disc": {"D": número, "I": número, "S": número, "C": número, "perfil": "D|I|S|C", "como_falar": "1 frase de como falar com este paciente"}`;
const ASSUNTOS_IDS = "preco, agenda, tratamento, medo, tempo, estetica, decisor, local, convenio";

// manual de ajuda: o mesmo arquivo usado na tela Suporte
function carregarAjuda() {
  try { const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(APP_DIR, "ajuda.js"), "utf8"), ctx, { timeout: 1000 }); return ctx.window.AJUDA || []; }
  catch (e) { console.warn("Manual de ajuda não carregado:", e.message); return []; }
}
const AJUDA = carregarAjuda();
const MANUAL_TXT = AJUDA.map((t) => `## ${t.titulo} [tela: ${t.tela}]\n${t.texto}\nComo fazer: ${(t.passos || []).join(" ")}`).join("\n\n");
const NOME_TELA = { hoje: "Hoje", whatsapp: "WhatsApp", comercial: "Comercial", consulta: "Consulta", briefings: "Briefings", followup: "Follow-up", tratamentos: "Tratamentos", resultados: "Resultados", campanhas: "Campanhas", suporte: "Suporte", ajustes: "Ajustes" };

const MOMENTOS = ["Acolhimento", "Investigação", "Diagnóstico", "Apresentação", "Negociação", "Fechamento"];

function promptDica(b) {
  return {
    sistema: `Você é o Alinha, copiloto que acompanha AO VIVO uma consulta de Ortodontia da ${CLINICA}
Você lê o trecho mais recente da conversa e decide se o profissional precisa de uma dica AGORA.
${METODO}
${DISC_TXT}
Leia também o perfil DISC do PACIENTE pelas falas dele e adapte a dica ao perfil.
Quando fizer sentido, a dica pode ser a próxima pergunta SPIN que falta, o próximo item N.E.A.T. a descobrir (ex.: quem decide, prazo) ou um insight da venda desafiadora. Indique a técnica no rótulo quando for o caso (ex.: "SPIN · Implicação", "N.E.A.T. · Prazo", "Sandler · Contrato"). A dica aparece na tela por poucos segundos, então ela tem de ser lida num relance.
- Dica: 1 ou 2 frases curtas, no imperativo, específicas para o que o paciente acabou de dizer (ex.: "Segure o desconto. Descubra com o que ela está comparando e traduza o valor em parcela mensal.").
- Se não houver nada importante a dizer, responda com "dica": "".
- Momentos possíveis: ${MOMENTOS.join(", ")}.
Responda SOMENTE com JSON: {"momento": "...", "tipo": "objecao|sinal_compra|oportunidade|alerta", "rotulo": "2 a 4 palavras, ex.: Objeção de preço", "dica": "...", "citacao": "a frase do paciente que motivou a dica, literal e curta", "prontidao": número de 0 a 100 indicando o quanto o paciente está pronto para fechar agora (desejo, sinais de compra, objeções pendentes, decisor presente), ${JSON_DISC}}`,
    prompt: `Momento atual na tela: ${b.momento || "Acolhimento"}
Dicas já mostradas (não repita): ${(b.ja_mostradas || []).join(" | ") || "nenhuma"}

CONVERSA ATÉ AGORA (o final é o mais recente):
${fmtTranscricao((b.transcricao || []).slice(-40))}`,
    modelo: CFG.modeloDicas
  };
}

function promptBriefing(b) {
  return {
    sistema: `Você é o Alinha, copiloto comercial da ${CLINICA}
Você recebe a transcrição de uma consulta que acabou de terminar e produz o BRIEFING para o profissional e a equipe comercial. Os rótulos PROFISSIONAL/PACIENTE vêm de reconhecimento automático de voz e podem ter erros: use o conteúdo das falas para corrigir quem disse o quê.
${METODO}
${DISC_TXT}
Avalie também a consulta por essas técnicas e se o próximo passo ficou agendado antes de o paciente sair. Seja concreto, use as palavras do paciente, e não invente números: use somente valores ditos na conversa.
Responda SOMENTE com JSON neste formato:
{
 "paciente": "primeiro nome se dito, senão ''",
 "manchete": "1 frase: o que aconteceu e o que importa (ex.: 'Saiu animada com a simulação, mas travou no valor: decide com o noivo na quinta')",
 "desfecho": "fechado|negociacao|perdido",
 "desfecho_detalhe": "ex.: '2 itens no plano' ou 'vai conversar com o marido'",
 "valor_apresentado": número ou null,
 "valor_fechado": número ou null,
 "tratamento": "ex.: Invisalign",
 "o_que_travou": "a principal trava, em poucas palavras",
 "o_que_travou_detalhe": "1 frase",
 "proximo_passo": "ação concreta",
 "proximo_passo_quem": "papel sugerido: Comercial, Recepção ou Dentista",
 "proximo_passo_prazo_dias": número (0 = hoje),
 "aconteceu": {"por_que_veio": "...", "o_que_o_exame_mostrou": "...", "o_que_foi_proposto": "...", "como_terminou": "..."},
 "avaliacao": [
   {"etapa": "Investigação", "nivel": "bem|atencao|melhorar", "resumo": "1 frase", "por_que_pesa": "1 frase", "como_fazer": "a frase exata que poderia ter sido dita"},
   {"etapa": "Apresentação", ...}, {"etapa": "Objeções", ...}, {"etapa": "Fechamento", ...}
 ],
 "objecoes": ["preco", "decisor", "pensar", "medo", "tempo", "concorrente", ...],
 "palavras_do_paciente": ["2 a 4 frases curtas e literais do paciente que mostram dor, desejo ou objeção"],
 "dor": "a dor principal nas palavras do paciente",
 "evento": "prazo ou evento citado, ou ''",
 "decisor": "quem decide junto, ou ''",
 "temperatura": "quente|morno|frio",
 "nota": número de 0 a 10,
 ${JSON_DISC},
 "metodos": {
   "spin": {"S": true|false, "P": true|false, "I": true|false, "N": true|false},
   "neat": {"N": true|false, "E": true|false, "A": true|false, "T": true|false},
   "conceito": "como o paciente imagina o resultado ideal, ou ''",
   "contrato_inicial": true|false,
   "insight": true|false,
   "pergunta_que_faltou": "a pergunta mais importante que não foi feita (literal, pronta para usar no retorno)"
 }
}`,
    prompt: `Profissional: ${b.profissional || "-"} · Unidade: ${b.unidade || "-"} · Duração: ${b.duracao_min || "?"} min
Anotações do profissional: ${b.notas || "-"}

TRANSCRIÇÃO:
${fmtTranscricao(b.transcricao) || "(vazia)"}`,
    esforco: "medium"
  };
}

function promptWhatsApp(b) {
  return {
    sistema: `Você é o Alinha, copiloto comercial da ${CLINICA}
Você acompanha uma conversa de WhatsApp em andamento com um paciente (lead que pode ter vindo de anúncio no Meta e sido atendido antes pela IA de atendimento). Sugira a PRÓXIMA mensagem da clínica para conduzir, com empatia, ao agendamento do check-up digital (iTero) ou ao fechamento.
${METODO}
${DISC_TXT}
Social Selling no WhatsApp: conduza com perguntas SPIN (situação → problema → implicação → necessidade) e descubra o N.E.A.T. (necessidade, impacto econômico, quem decide, prazo), uma pergunta por vez. Adapte o tom ao perfil DISC do paciente.
Regras: mensagem curta (até 3 frases), no máximo 1 emoji, termine com uma pergunta fácil (de preferência com duas opções). Se faltar algo do N.E.A.T. (ex.: quem decide, prazo), use a pergunta para descobrir. Não passe preço antes do diagnóstico: convide para o check-up digital. Diante de objeção: valide, descubra a objeção real e responda. Nunca prometa resultado; não invente valores, prazos ou condições. Não dê diagnóstico pelo WhatsApp. Só use condição especial se estiver no contexto.
Responda SOMENTE com JSON: {"orientacao": "1 frase para o atendente: o que está acontecendo e o que fazer", "mensagem": "texto pronto para enviar", "rotulo": "2 a 4 palavras, ex.: Objeção de preço", "prontidao": número de 0 a 100 (quão pronto para agendar/fechar), ${JSON_DISC}, "assuntos": ["ids entre: ${ASSUNTOS_IDS}"], "tratamento_interesse": "tratamento que o paciente quer, ex.: Invisalign, Aparelho fixo, Aparelho estético, Clareamento, ou ''"}`,
    prompt: `Unidade: ${b.unidade || "-"} · Paciente: ${b.nome || "-"}
Condição especial vigente: ${b.condicao || "nenhuma"}
Leitura DISC prévia (pelas palavras-chave): ${b.disc && b.disc.perfil ? `D ${b.disc.D} · I ${b.disc.I} · S ${b.disc.S} · C ${b.disc.C}` : "-"}
${b.versao_anterior ? "Escreva uma versão DIFERENTE desta: " + b.versao_anterior + "\n" : ""}
CONVERSA (a mais recente por último):
${(b.conversa || []).slice(-30).map((m) => `${m.autor === "cliente" ? "PACIENTE" : m.ia ? "IA DE ATENDIMENTO" : "CLÍNICA"}: ${m.texto}`).join("\n")}`,
    modelo: CFG.modeloDicas
  };
}

function promptSuporte(b, papel) {
  const P = permissoes(papel);
  return {
    sistema: `Você é o Suporte do Alinha, o sistema comercial e clínico da ${CLINICA}
Responda dúvidas de quem usa o sistema (recepção, CRC, dentistas, administrador) sobre COMO USAR o Alinha, em português do Brasil, de forma curta e prática: no máximo 6 frases ou passos numerados. Baseie-se SOMENTE no manual abaixo. Se a resposta não estiver no manual, diga que não sabe e sugira falar com o administrador. Não invente telas, botões ou funções.
O perfil desta pessoa é "${papel}" e ela tem acesso às telas: ${P.telas.map((t) => NOME_TELA[t] || t).join(", ")}. Se a função pedida estiver numa tela que ela não acessa, diga que é preciso pedir ao administrador (Ajustes › Permissões).
Nunca peça nem mostre senhas, chaves ou tokens. Dúvidas clínicas ou de diagnóstico não são do suporte: oriente a conversar com o dentista responsável.

MANUAL DO ALINHA:
${MANUAL_TXT}

Responda SOMENTE com JSON: {"resposta": "texto da resposta (pode ter passos numerados com quebras de linha)", "tela": "id da tela mais relacionada entre: ${Object.keys(NOME_TELA).join(", ")}, ou ''", "topico": "id do tópico do manual mais relacionado, ou ''"}`,
    prompt: `Conversa até agora:
${(b.historico || []).slice(-8).map((m) => `${m.autor === "eu" ? "USUÁRIO" : "SUPORTE"}: ${String(m.texto || "").slice(0, 800)}`).join("\n")}
USUÁRIO: ${String(b.pergunta || "").slice(0, 1200)}`,
    modelo: CFG.modeloDicas
  };
}

function promptMensagem(b) {
  const p = b.paciente || {};
  return {
    sistema: `Você é o Alinha, copiloto comercial da ${CLINICA}
Escreva UMA mensagem de WhatsApp de follow-up para um paciente que fez consulta e ainda não fechou (ou fechou e falta um passo). Siga o SNAP (simples, valiosa, alinhada ao objetivo dele, ajuda a priorizar) e, se couber, um insight da venda desafiadora. A mensagem deve:
- usar as palavras do próprio paciente quando possível (dor, desejo, evento);
- tratar a objeção dele de forma leve, sem pressão;
- ser curta (até 4 linhas), calorosa, no máximo 1 emoji, terminar com uma pergunta fácil de responder;
- respeitar o momento da cadência: D0 = resumo do plano no mesmo dia; D1 = tirar dúvidas; D3 = reforçar valor (simulação, vídeo do dentista, caso parecido); D7 = pergunta direta sobre o que impede; D15 = porta aberta / condição real se houver; D30 = encerramento gentil; R30/R60/R90 = REATIVAÇÃO de quem não fechou, 30/60/90 dias depois (saber como está, oferecer algo de valor como a simulação, convidar sem pressão).
${METODO}
${DISC_TXT}
Se o perfil DISC do paciente for informado, adapte o tom a ele.
Não invente desconto, prazo ou condição. Responda SOMENTE com JSON: {"mensagem": "..."}`,
    prompt: `Toque: ${b.toque} (${String(b.dia).startsWith("R") ? b.dia + " — reativação" : "D" + b.dia})
Paciente: ${p.nome || "-"} · Unidade: ${p.unidade || "-"} · Tratamento: ${p.tratamento || "-"} · Valor apresentado: ${p.valorApresentado || "-"}
Dor: ${p.dor || "-"} · Evento: ${p.evento || "-"} · Decisor: ${p.decisor || "-"}
Objeções: ${(p.objecoes || []).join(", ") || "-"} · O que travou: ${p.oQueTravou || "-"}
Palavras do paciente: ${(p.palavras || []).join(" | ") || "-"}
Profissional que atendeu: ${p.profissional || "-"}
Perfil DISC: ${p.disc && p.disc.perfil ? `${p.disc.perfil} (D ${p.disc.D} · I ${p.disc.I} · S ${p.disc.S} · C ${p.disc.C})` : "-"}
Condição especial vigente informada pela clínica: ${b.condicao || "nenhuma"}
${b.versao_anterior ? "Escreva uma versão DIFERENTE desta: " + b.versao_anterior : ""}`
  };
}

/* ------------------------------------------------------------------ */
/* rotas                                                               */
/* ------------------------------------------------------------------ */
/* CRM: funil Lead e funil Cliente (as mesmas regras da tela)          */
/* ------------------------------------------------------------------ */
const ETAPAS_LEAD = ["novo", "contato", "agendado", "faltou", "perdido"];
const ETAPAS_CLIENTE = ["orcamento", "fechado", "nao_fechou"];
const NOME_ETAPA = { novo: "Lead novo", contato: "Em contato", agendado: "Agendou", faltou: "Faltou", perdido: "Perdido", orcamento: "Compareceu · orçamento", fechado: "Fechou", nao_fechou: "Não fechou" };
const ehClienteSrv = (p) => ["aberto", "fechado", "perdido"].includes(p.status);
function etapaSrv(p) {
  if (p.status === "lead") return ETAPAS_LEAD.includes(p.etapa) ? p.etapa : "novo";
  return p.status === "fechado" ? "fechado" : p.status === "perdido" ? "nao_fechou" : "orcamento";
}
const funilDe = (e) => (ETAPAS_CLIENTE.includes(e) ? "cliente" : "lead");
function aplicarEtapa(p, etapa) {
  const agora = new Date().toISOString();
  if (ETAPAS_LEAD.includes(etapa)) {
    p.status = "lead"; p.etapa = etapa;
    if (etapa === "agendado") p.agendadoEm = p.agendadoEm || agora;
    if (etapa === "faltou") { p.faltouEm = agora; p.faltas = (p.faltas || 0) + 1; p.agendadoEm = p.agendadoEm || agora; }
    if (etapa === "perdido") p.perdidoEm = agora;
    return;
  }
  if (!ehClienteSrv(p)) { p.compareceuEm = agora; p.consultaEm = agora; p.agendadoEm = p.agendadoEm || agora; p.toques = p.toques || {}; }
  p.compareceuEm = p.compareceuEm || p.consultaEm || agora;
  if (etapa === "orcamento") { p.status = "aberto"; delete p.fechadoEm; }
  if (etapa === "fechado") { p.status = "fechado"; p.fechadoEm = agora; p.valorFechado = p.valorFechado || p.valorApresentado || 0; }
  if (etapa === "nao_fechou") { p.status = "perdido"; p.encerradoEm = agora; }
}
// fases padrão (os tratamentos novos guardam a própria lista em t.fases, com o papel de cada fase)
const FASES_PADRAO = (() => {
  const F = (id, papel = "") => ({ id, papel });
  const prot = [F("orcamento"), F("aprovado", "aprovacao"), F("preparo"), F("moldagem", "moldagem"), F("enviado", "lab_envio"), F("recebido", "lab_recebido"), F("agendado", "agendamento"), F("instalado"), F("finalizado")];
  return { "Coroa em porcelana": prot, "Prótese sobre implante": prot, "Coroa sobre implante": prot,
    Invisalign: [F("consulta"), F("orcamento"), F("pagamento", "aprovacao"), F("escaneamento", "moldagem"), F("fotografias"), F("radiografias"), F("clincheck_mod"), F("clincheck_ok", "lab_envio"), F("alinhadores", "lab_recebido"), F("agendado", "agendamento"), F("instalacao"), F("finalizado")],
    "Aparelho fixo": [F("orcamento"), F("aprovado", "aprovacao"), F("documentacao"), F("agendado", "agendamento"), F("instalado"), F("manutencao"), F("remocao"), F("contencao"), F("finalizado")],
    "Outro procedimento": [F("orcamento"), F("aprovado", "aprovacao"), F("agendado", "agendamento"), F("execucao"), F("finalizado")] };
})();
function recursoTrabalho(t) {
  const fases = (t.fases && t.fases.length ? t.fases : ((AJC.procedimentos || {})[t.tipo] || FASES_PADRAO[t.tipo] || FASES_PADRAO["Outro procedimento"]));
  const feitas = fases.filter((f) => (t.etapas || {})[f.id]), atual = feitas[feitas.length - 1] || null;
  const prox = fases.find((f) => !(t.etapas || {})[f.id]) || null, fim = fases[fases.length - 1];
  return { id: t.id, tipo: t.tipo, dente: t.dente || "", doutor: t.dr || "", etapa_atual: atual ? atual.id : null, etapa_atual_papel: atual ? atual.papel || "" : "", proxima_etapa: prox ? prox.id : null,
    concluido: !!(fim && (t.etapas || {})[fim.id]),
    fases: fases.map((f) => ({ id: f.id, nome: f.nome || f.id, papel: f.papel || "", data: ((t.etapas || {})[f.id] || {}).em || null })),
    etapas: Object.fromEntries(Object.entries(t.etapas || {}).map(([k, v]) => [k, v && v.em])),
    laboratorio: t.lab ? { nome: t.lab.nome || "", enviado_em: t.lab.enviadoEm || null, entrega_combinada: t.lab.entrega || null, recebido_em: t.lab.recebidoEm || null } : null,
    consulta: t.consulta || null };
}
function recursoPaciente(p) {
  const e = etapaSrv(p);
  return { id: p.id, nome: p.nome || "", telefone: p.telefone || "", unidade: p.unidade || "", origem: p.origem || "", tratamento: p.tratamento || p.interesse || "",
    funil: funilDe(e), etapa: e, etapa_nome: NOME_ETAPA[e], valor_apresentado: p.valorApresentado ?? null, valor_fechado: p.valorFechado ?? null,
    email: p.email || "", termometro: p.temp || null, decisor: p.decisor || "", decisor_telefone: p.decisorTel || "", melhor_horario: p.melhorHorario || "",
    crc: p.crc || "", doutor_avaliacao: p.drAvaliacao || p.profissional || "", entrada_em: p.entradaEm || p.consultaEm || null, agendado_em: p.agendadoEm || null, compareceu_em: p.compareceuEm || null, fechado_em: p.fechadoEm || null,
    kommo_lead_id: p.leadId || null, responsavel: p.responsavel || "", obs: p.obs || "", tratamentos: (p.trabalhos || []).map(recursoTrabalho) };
}
function numerosMes(pacs, mes, unidade) {
  const noMes = (iso) => { try { return !!iso && new Date(iso).toISOString().slice(0, 7) === mes; } catch { return false; } };
  const coorte = pacs.filter((p) => (!unidade || p.unidade === unidade) && noMes(p.entradaEm || p.consultaEm));
  const c = { mes, unidade: unidade || "todas", entraram: coorte.length, agendaram: 0, compareceram: 0, faltaram: 0, fecharam: 0, nao_fecharam: 0, em_followup: 0, no_funil_lead: 0, perdidos: 0, valor_fechado: 0 };
  coorte.forEach((p) => { const e = etapaSrv(p);
    if (ehClienteSrv(p) || ["agendado", "faltou"].includes(e) || p.agendadoEm) c.agendaram++;
    if (ehClienteSrv(p)) c.compareceram++;
    if (e === "faltou") c.faltaram++; if (e === "perdido") c.perdidos++;
    if (e === "fechado") { c.fecharam++; c.valor_fechado += Number(p.valorFechado || 0); }
    if (e === "nao_fechou") c.nao_fecharam++; if (e === "orcamento") c.em_followup++;
    if (["novo", "contato", "agendado"].includes(e)) c.no_funil_lead++; });
  return c;
}

/* ------------------------------------------------------------------ */
/* Integrações: tokens da API e webhooks de saída                      */
/* ------------------------------------------------------------------ */
const EVENTOS = {
  "lead.criado": "Lead novo no CRM",
  "lead.etapa": "Mudou de etapa (funil Lead ou Cliente)",
  "cliente.compareceu": "Compareceu: passou para o funil Cliente",
  "cliente.fechou": "Fechou o tratamento",
  "cliente.nao_fechou": "Não fechou",
  "tratamento.etapa": "Etapa de tratamento registrada (inclui laboratório)",
  "mensagem.recebida": "Mensagem recebida do paciente",
  "conversa.transferida": "Conversa do WhatsApp transferida de setor"
};
async function integ() { const x = await STORE.integracoes(); return { tokens: [], webhooks: [], entregas: [], seg: {}, ...(x || {}) }; }
const hashTk = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
function ipPrivado(ip) {
  const l = String(ip).toLowerCase();
  if (l.includes(":")) return l === "::1" || l === "::" || l.startsWith("fc") || l.startsWith("fd") || l.startsWith("fe80") || (l.startsWith("::ffff:") && ipPrivado(l.slice(7)));
  const [a, b] = l.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
// webhooks só para endereços públicos em https (evita que o servidor seja usado para acessar a rede interna)
async function urlSegura(u) {
  let x; try { x = new URL(String(u)); } catch { return { ok: false, erro: "endereço inválido" }; }
  const local = env.WEBHOOK_PERMITIR_LOCAL === "1";
  if (x.protocol !== "https:" && !(local && x.protocol === "http:")) return { ok: false, erro: "use um endereço https://" };
  if (x.username || x.password) return { ok: false, erro: "o endereço não pode ter usuário e senha" };
  if (local) return { ok: true };
  try { const dnsP = await import("node:dns/promises"); const ips = (await dnsP.lookup(x.hostname, { all: true })).map((a) => a.address); if (!ips.length || ips.some(ipPrivado)) return { ok: false, erro: "endereço interno não é permitido" }; }
  catch { return { ok: false, erro: "domínio não encontrado" }; }
  return { ok: true };
}
async function enviarWebhook(w, evento, dados) {
  const corpo = JSON.stringify({ id: "ev_" + crypto.randomBytes(8).toString("hex"), evento, criado_em: new Date().toISOString(), dados });
  const ent = { id: crypto.randomBytes(4).toString("hex"), webhook: w.id, url: w.url, evento, em: new Date().toISOString() };
  try {
    const chk = await urlSegura(w.url); if (!chk.ok) throw new Error(chk.erro);
    const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(w.url, { method: "POST", redirect: "manual", signal: ctrl.signal, body: corpo,
      headers: { "Content-Type": "application/json", "User-Agent": "Alinha-Webhook/1", "X-Alinha-Evento": evento, "X-Alinha-Assinatura": "sha256=" + crypto.createHmac("sha256", w.segredo).update(corpo).digest("hex") } });
    clearTimeout(tm); ent.status = r.status; ent.ok = r.status >= 200 && r.status < 300;
  } catch (e) { ent.ok = false; ent.erro = e.name === "AbortError" ? "sem resposta em 5 segundos" : String(e.message).slice(0, 160); }
  return ent;
}
async function disparar(evento, dados) {
  const I = await integ();
  const alvos = I.webhooks.filter((w) => w.ativo !== false && (w.eventos || []).includes(evento));
  if (!alvos.length) return;
  const ents = await Promise.all(alvos.map((w) => enviarWebhook(w, evento, dados)));
  const J = await integ(); J.entregas = ents.concat(J.entregas || []).slice(0, 40); await STORE.salvarIntegracoes(J);
}
// compara o antes e o depois de um paciente e avisa os webhooks (e o Kommo, se a sincronização estiver ligada)
async function emitirMudancas(antes, depois, origem) {
  const r = recursoPaciente(depois), ev = [];
  const ea = antes ? etapaSrv(antes) : null, ed = etapaSrv(depois);
  if (!antes) ev.push(["lead.criado", { paciente: r }]);
  if (antes && ea !== ed) ev.push(["lead.etapa", { paciente: r, de: ea, para: ed }]);
  if (ea !== ed) {
    if (funilDe(ed) === "cliente" && (!ea || funilDe(ea) === "lead")) ev.push(["cliente.compareceu", { paciente: r }]);
    if (ed === "fechado") ev.push(["cliente.fechou", { paciente: r }]);
    if (ed === "nao_fechou") ev.push(["cliente.nao_fechou", { paciente: r }]);
  }
  const velhas = new Map(((antes && antes.trabalhos) || []).map((t) => [t.id, Object.keys(t.etapas || {})]));
  (depois.trabalhos || []).forEach((t) => Object.keys(t.etapas || {}).filter((k) => !(velhas.get(t.id) || []).includes(k))
    .forEach((k) => ev.push(["tratamento.etapa", { paciente: { id: r.id, nome: r.nome }, tratamento: recursoTrabalho(t), etapa: k }])));
  for (const [e, d] of ev) await disparar(e, { origem, ...d });
  // Kommo: o card vai para o funil Cliente quando o paciente comparece (e marca fechou / não fechou)
  if (origem !== "kommo" && AJ.kommoSincronizar && kommoOk() && /^\d+$/.test(String(depois.leadId || "")) && ea !== ed && funilDe(ed) === "cliente") {
    const destino = destinoNoFunil(ed === "fechado" ? "fechado" : ed === "nao_fechou" ? "perdido" : "negociacao", true);
    if (Object.keys(destino).length) { try { await kommo("PATCH", `/api/v4/leads/${depois.leadId}`, destino); } catch (e) { console.warn("Kommo (funil):", e.message); } }
  }
}
// no Render o aviso segue em segundo plano; na Vercel a função precisa esperar terminar
function emitir(antes, depois, origem) { const pr = emitirMudancas(antes, depois, origem).catch((e) => console.warn("Eventos:", e.message)); return process.env.VERCEL ? pr : Promise.resolve(); }

/* Kommo → Alinha: lead novo e mudança de funil/etapa (webhook do Kommo) */
function lerLeadsKommo(corpo) {
  const acc = {};
  for (const [k, v] of new URLSearchParams(corpo)) {
    const m = k.match(/^leads\[(add|status|update)\]\[(\d+)\]\[([^\]]+)\]$/);
    if (!m) continue;
    const ch = m[1] + m[2]; acc[ch] = acc[ch] || { tipo: m[1] }; acc[ch][m[3]] = v;
  }
  return Object.values(acc);
}
async function aplicarLeadsKommo(itens) {
  if (!itens.length) return;
  const pacs = await STORE.pacientes();
  for (const it of itens) {
    const id = String(it.id || ""); if (!/^\d+$/.test(id)) continue;
    const pipe = String(it.pipeline_id || ""), st = String(it.status_id || "");
    const noCliente = !!AJ.funilCliente && pipe === String(AJ.funilCliente), noLead = !!AJ.funilLead && pipe === String(AJ.funilLead);
    let p = pacs.find((x) => String(x.leadId) === id);
    const antes = p ? JSON.parse(JSON.stringify(p)) : null;
    if (!p) {
      if (AJ.kommoImportarLeads === false) continue;
      if (it.tipo === "update" && !noCliente && !noLead) continue;
      p = { id: "k" + id, leadId: id, nome: String(it.name || "Lead " + id).slice(0, 120), telefone: "", unidade: "", origem: "Kommo", status: "lead", etapa: "novo",
        entradaEm: it.created_at ? new Date(Number(it.created_at) * 1000).toISOString() : new Date().toISOString(), toques: {} };
      pacs.push(p);
    } else if (it.name && /^(Lead|WhatsApp) /.test(p.nome)) p.nome = String(it.name).slice(0, 120);
    let alvo = null;
    if (noCliente) alvo = st === "142" ? "fechado" : st === "143" ? "nao_fechou" : (ehClienteSrv(p) ? null : "orcamento");
    else if (st === "143") alvo = ehClienteSrv(p) ? "nao_fechou" : "perdido";
    else if (st === "142") alvo = "fechado";
    if (alvo && alvo !== etapaSrv(p)) aplicarEtapa(p, alvo);
    if (!antes || JSON.stringify(antes) !== JSON.stringify(p)) { await STORE.salvarPaciente(p); await emitir(antes, p, "kommo"); }
  }
}

/* ------------------------------------------------------------------ */
/* API aberta (v1): Authorization: Bearer <token>                       */
/* ------------------------------------------------------------------ */
const usoApi = new Map();
async function autenticarToken(req) {
  const h = String(req.headers.authorization || "");
  const t = h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : String(req.headers["x-api-key"] || "").trim();
  if (!t || t.length > 200) return null;
  const hh = hashTk(t), I = await integ();
  const tk = I.tokens.find((x) => x.hash && x.hash.length === hh.length && crypto.timingSafeEqual(Buffer.from(x.hash), Buffer.from(hh)));
  if (!tk) return null;
  if (!tk.usadoEm || Date.now() - new Date(tk.usadoEm).getTime() > 60000) { tk.usadoEm = new Date().toISOString(); await STORE.salvarIntegracoes(I); }
  return tk;
}
const texto = (v, max) => (v == null ? "" : String(v).trim().slice(0, max));
const digitosTel = (t) => String(t || "").replace(/\D/g, "");
function indiceApi(base) {
  return { nome: "API do Alinha", versao: VERSAO, base: base + "/api/v1", autenticacao: "Authorization: Bearer <token> (ou X-Api-Key). Gere o token em Ajustes › API e webhooks.",
    limite: "120 requisições por minuto por token",
    rotas: [
      "GET    /api/v1/leads?funil=lead|cliente&etapa=&unidade=&desde=AAAA-MM-DD&limite=100",
      "GET    /api/v1/leads/{id ou kommo_lead_id}",
      "POST   /api/v1/leads  { nome*, telefone, email, unidade, origem, tratamento, etapa, kommo_lead_id, valor_apresentado, obs }",
      "PATCH  /api/v1/leads/{id}  { etapa, nome, telefone, unidade, tratamento, valor_apresentado, valor_fechado, obs }",
      "GET    /api/v1/tratamentos?situacao=andamento|laboratorio|concluido",
      "GET    /api/v1/funil?mes=AAAA-MM&unidade=",
      "POST   /api/v1/mensagens  { telefone* ou lead, nome, texto*, autor: cliente|clinica, unidade }"
    ],
    etapas: { funil_lead: ETAPAS_LEAD, funil_cliente: ETAPAS_CLIENTE }, eventos_webhook: EVENTOS,
    assinatura_webhook: "X-Alinha-Assinatura: sha256=HMAC-SHA256(segredo do webhook, corpo da requisição)" };
}
async function apiV1(req, res, url, p) {
  const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Api-Key", "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS", "Access-Control-Max-Age": "600" };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const out = (st, obj) => { res.writeHead(st, { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };
  const tk = await autenticarToken(req);
  if (!tk) return out(401, { erro: "Token ausente ou inválido. Envie o cabeçalho Authorization: Bearer <token>." });
  const u = usoApi.get(tk.id) || { n: 0, desde: Date.now() };
  if (Date.now() - u.desde > 60000) { u.n = 0; u.desde = Date.now(); }
  u.n++; usoApi.set(tk.id, u);
  if (u.n > 120) return out(429, { erro: "Limite de 120 requisições por minuto atingido. Tente de novo em instantes." });
  if (req.method !== "GET" && tk.escopo !== "escrita") return out(403, { erro: "Este token é só de leitura." });
  const partes = p.split("/").filter(Boolean).slice(2);
  try {
    if (!partes.length && req.method === "GET") return out(200, indiceApi(baseDaRequisicao(req)));
    if (partes[0] === "leads") {
      const pacs = await STORE.pacientes();
      if (req.method === "GET" && partes.length === 1) {
        const f = url.searchParams, desde = f.get("desde") || "", lim = Math.min(500, Math.max(1, Number(f.get("limite")) || 100));
        let l = pacs.map(recursoPaciente).filter((r) => (!f.get("funil") || r.funil === f.get("funil")) && (!f.get("etapa") || r.etapa === f.get("etapa")) && (!f.get("unidade") || r.unidade === f.get("unidade")) && (!desde || (r.entrada_em || "") >= desde));
        l.sort((a, b) => ((b.entrada_em || "") > (a.entrada_em || "") ? 1 : -1));
        return out(200, { total: l.length, dados: l.slice(0, lim) });
      }
      const achar = (id) => pacs.find((x) => x.id === id || String(x.leadId) === id);
      if (req.method === "GET" && partes[1]) { const x = achar(partes[1]); return x ? out(200, { dados: recursoPaciente(x) }) : out(404, { erro: "Lead não encontrado." }); }
      const b = await lerJSON(req);
      if (b === null || typeof b !== "object" || Array.isArray(b)) return out(400, { erro: "Envie um objeto JSON." });
      if (b.etapa && ![...ETAPAS_LEAD, ...ETAPAS_CLIENTE].includes(b.etapa)) return out(400, { erro: "Etapa inválida.", etapas: [...ETAPAS_LEAD, ...ETAPAS_CLIENTE] });
      if (b.unidade && !["Caruaru", "Recife"].includes(b.unidade)) return out(400, { erro: "Unidade inválida (Caruaru ou Recife)." });
      const aplicarCampos = (x) => {
        if (b.nome != null) x.nome = texto(b.nome, 120);
        if (b.telefone != null) x.telefone = texto(b.telefone, 30);
        if (b.email != null) { const em = texto(b.email, 120); if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) throw new Error("e-mail inválido"); x.email = em; }
        if (b.unidade != null) x.unidade = b.unidade;
        if (b.origem != null) x.origem = texto(b.origem, 60);
        if (b.tratamento != null) { x.tratamento = texto(b.tratamento, 80); x.interesse = x.tratamento; }
        if (b.obs != null) x.obs = texto(b.obs, 500);
        if (b.decisor != null) x.decisor = texto(b.decisor, 80);
        if (b.decisor_telefone != null) x.decisorTel = texto(b.decisor_telefone, 30);
        if (b.melhor_horario != null) x.melhorHorario = texto(b.melhor_horario, 60);
        if (b.crc != null) x.crc = texto(b.crc, 60);
        if (b.doutor_avaliacao != null) x.drAvaliacao = texto(b.doutor_avaliacao, 60);
        if (b.valor_apresentado != null && Number.isFinite(Number(b.valor_apresentado))) x.valorApresentado = Number(b.valor_apresentado);
        if (b.valor_fechado != null && Number.isFinite(Number(b.valor_fechado))) x.valorFechado = Number(b.valor_fechado);
        if (b.kommo_lead_id != null && /^\d{1,15}$/.test(String(b.kommo_lead_id))) x.leadId = String(b.kommo_lead_id);
      };
      if (req.method === "POST" && partes.length === 1) {
        if (!texto(b.nome, 120)) return out(400, { erro: "Informe o nome." });
        const tel = digitosTel(b.telefone).slice(-9);
        const existe = pacs.find((x) => (b.kommo_lead_id && String(x.leadId) === String(b.kommo_lead_id)) || (tel.length >= 8 && digitosTel(x.telefone).slice(-9) === tel));
        if (existe) return out(200, { existente: true, dados: recursoPaciente(existe) });
        const novo = { id: "p" + Date.now().toString(36) + crypto.randomBytes(2).toString("hex"), status: "lead", etapa: "novo", origem: "API", entradaEm: new Date().toISOString(), toques: {} };
        aplicarCampos(novo);
        if (b.etapa && b.etapa !== "novo") aplicarEtapa(novo, b.etapa);
        await STORE.salvarPaciente(novo); await emitir(null, novo, "api");
        return out(201, { dados: recursoPaciente(novo) });
      }
      if (req.method === "PATCH" && partes[1]) {
        const x = achar(partes[1]); if (!x) return out(404, { erro: "Lead não encontrado." });
        const antes = JSON.parse(JSON.stringify(x));
        aplicarCampos(x);
        if (b.etapa && b.etapa !== etapaSrv(x)) aplicarEtapa(x, b.etapa);
        await STORE.salvarPaciente(x); await emitir(antes, x, "api");
        return out(200, { dados: recursoPaciente(x) });
      }
    }
    if (partes[0] === "tratamentos" && req.method === "GET") {
      const sit = url.searchParams.get("situacao") || "";
      const l = (await STORE.pacientes()).flatMap((x) => (x.trabalhos || []).map((t) => ({ paciente: { id: x.id, nome: x.nome, unidade: x.unidade || "" }, ...recursoTrabalho(t) })))
        .filter((t) => !sit || (sit === "concluido" ? t.concluido : sit === "laboratorio" ? !t.concluido && ["lab_envio", "lab_recebido", "agendamento"].includes(t.etapa_atual_papel) && t.laboratorio : !t.concluido));
      return out(200, { total: l.length, dados: l });
    }
    if (partes[0] === "funil" && req.method === "GET") {
      const mes = /^\d{4}-\d{2}$/.test(url.searchParams.get("mes") || "") ? url.searchParams.get("mes") : new Date().toISOString().slice(0, 7);
      return out(200, { dados: numerosMes(await STORE.pacientes(), mes, url.searchParams.get("unidade") || "") });
    }
    if (partes[0] === "mensagens" && req.method === "POST") {
      const b = await lerJSON(req);
      const txt = texto(b && b.texto, 4000), tel = digitosTel(b && b.telefone);
      if (!txt) return out(400, { erro: "Informe o texto." });
      const lead = b.lead ? texto(b.lead, 60).replace(/[^\w.-]/g, "") : tel.length >= 8 ? "api-" + tel : "";
      if (!lead) return out(400, { erro: "Informe o telefone (ou o lead)." });
      const existia = await STORE.conversa(lead);
      const C = existia || { lista: [], nome: "", atualizado: 0, origem: "api" };
      if (b.nome && !C.nome) C.nome = texto(b.nome, 60);
      if (tel && !C.telefone) C.telefone = "+" + tel;
      if (b.unidade && !C.unidade) C.unidade = texto(b.unidade, 20);
      if (/^https:\/\//.test(b.foto || "")) C.foto = texto(b.foto, 600);
      const autor = b.autor === "clinica" ? "clinica" : "cliente";
      const m = { id: "api" + Date.now().toString(36) + crypto.randomBytes(2).toString("hex"), ts: new Date().toISOString(), autor, texto: txt };
      C.lista.push(m); C.lista = C.lista.slice(-200); C.atualizado = Date.now();
      await STORE.salvarConversa(lead, C);
      if (!existia) await leadAutomatico(lead, C).catch(() => {});
      if (autor === "cliente") { const pr = disparar("mensagem.recebida", { origem: "api", lead, nome: C.nome || "", telefone: C.telefone || "", texto: txt }).catch(() => {}); if (process.env.VERCEL) await pr; }
      return out(201, { dados: { lead, mensagem: m } });
    }
    return out(404, { erro: "Rota não encontrada. Veja GET /api/v1 para a lista de rotas." });
  } catch (e) { return out(400, { erro: "Requisição inválida: " + String(e.message).slice(0, 160) }); }
}

/* ------------------------------------------------------------------ */
async function rotas(req, res) {
  const url = new URL(req.url, "http://local");
  const p = url.pathname;
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  if (p === "/saude") return json(res, 200, { ok: true });
  const oficial = hostOficial(), hostAtual = hostDaRequisicao(req);
  if (oficial && hostAtual && hostAtual !== oficial && !/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(hostAtual)
      && (req.method === "GET" || req.method === "HEAD") && !p.startsWith("/webhooks/") && !p.startsWith("/api/v1") && p !== "/versao" && (env.APP_URL_FORCAR === "1" || await dominioJaAponta())) {
    res.writeHead(301, { Location: CFG.appUrl + req.url }); return res.end(); // ex.: projeto.vercel.app → domínio próprio
  }
  if (p === "/versao") return json(res, 200, { versao: VERSAO }); // público: só o número da versão

  // webhook do Kommo (sem login; protegido pela chave no endereço)
  if (p.startsWith("/webhooks/evolution/") && req.method === "POST") {
    if (!evoOk() || p.split("/").pop() !== chaveWebhookEvo()) return json(res, 403, { ok: false });
    let corpo = {}; try { corpo = JSON.parse((await lerCorpo(req, 8 * 1024 * 1024)).toString("utf8") || "{}"); } catch { /* ignora */ }
    await guardarMensagensEvo(lerMensagemEvo(corpo));
    return json(res, 200, { ok: true });
  }
  if (p.startsWith("/webhooks/kommo/") && req.method === "POST") {
    if (!CFG.kommoChaveWebhook || p.split("/").pop() !== CFG.kommoChaveWebhook) return json(res, 403, { ok: false });
    const corpoK = (await lerCorpo(req)).toString("utf8");
    await guardarWhatsApp(lerMensagensKommo(corpoK));
    await aplicarLeadsKommo(lerLeadsKommo(corpoK)).catch((e) => console.warn("Kommo (leads):", e.message));
    return json(res, 200, { ok: true });
  }
  if (p.startsWith("/assets/")) return servirArquivo(res, ASSETS_DIR, p.slice("/assets/".length));
  if (p === "/logo.svg") return servirArquivo(res, APP_DIR, "logo.svg");
  if (p === "/manifest.webmanifest") return servirArquivo(res, APP_DIR, "manifest.webmanifest");

  if (p === "/login" && req.method === "POST") {
    if (bloqueado(ip)) { res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Muitas tentativas. Aguarde 15 minutos.")); }
    const form = new URLSearchParams((await lerCorpo(req)).toString("utf8"));
    const papel = autenticar(form.get("usuario"), form.get("senha") || "");
    if (!papel) { falhou(ip); res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Usuário ou senha incorretos.")); }
    tentativas.delete(ip);
    const seg = ((await integ()).seg || {})[papel];
    if (seg && seg.ativo && seg.segredo) { // segunda etapa: código do Google Authenticator
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Set-Cookie": `alinha2fa=${encodeURIComponent(cookie2fa(papel))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${ehHttps(req) ? "; Secure" : ""}` });
      return res.end(paginaLogin("", true));
    }
    res.writeHead(303, { Location: "./", "Set-Cookie": `alinha=${encodeURIComponent(cookieSessao(papel))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${ehHttps(req) ? "; Secure" : ""}` });
    return res.end();
  }
  if (p === "/login/2fa" && req.method === "POST") {
    if (bloqueado(ip)) { res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Muitas tentativas. Aguarde 15 minutos.")); }
    const papel = pendente2fa(req);
    if (!papel) { res.writeHead(303, { Location: "login" }); return res.end(); }
    const form = new URLSearchParams((await lerCorpo(req)).toString("utf8"));
    const seg = ((await integ()).seg || {})[papel];
    if (!seg || !totpConfere(seg.segredo, form.get("codigo"), "login:" + papel)) { falhou(ip); res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Código incorreto ou expirado. Tente o código atual.", true)); }
    tentativas.delete(ip);
    res.writeHead(303, { Location: "./", "Set-Cookie": [`alinha=${encodeURIComponent(cookieSessao(papel))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${ehHttps(req) ? "; Secure" : ""}`, "alinha2fa=; Path=/; Max-Age=0"] });
    return res.end();
  }
  if (p === "/sair") { res.writeHead(303, { Location: "login", "Set-Cookie": ["alinha=; Path=/; Max-Age=0", "alinha2fa=; Path=/; Max-Age=0"] }); return res.end(); }
  if (p === "/login") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin()); }

  if (p === "/api/v1" || p.startsWith("/api/v1/")) return apiV1(req, res, url, p); // API aberta: autenticação por token
  const papel = sessaoValida(req);
  const soAdmin = () => { if (papel === "admin") return false; json(res, 403, { erro: "Somente o administrador pode fazer isso." }); return true; };
  const exige = (...ks) => { if (ks.some((k) => pode(papel, k))) return false; json(res, 403, { erro: "Seu perfil não tem permissão para isso." }); return true; };
  if (!papel) {
    if (p.startsWith("/api/")) return json(res, 401, { erro: "Sessão expirada. Entre novamente." });
    res.writeHead(303, { Location: "login" }); return res.end();
  }

  if (p === "/api/dominio" && req.method === "GET") {
    if (soAdmin()) return;
    const base = baseDaRequisicao(req), host = (() => { try { return new URL(base).host; } catch { return hostDaRequisicao(req); } })();
    const dnsP = await import("node:dns/promises");
    const tentar = async (fn) => { try { return await fn(); } catch { return []; } };
    const [a, cname] = await Promise.all([tentar(() => dnsP.resolve4(host.split(":")[0])), tentar(() => dnsP.resolveCname(host.split(":")[0]))]);
    dominioPronto.em = 0; const redirecionando = CFG.appUrl ? await dominioJaAponta() : false;
    return json(res, 200, { ok: true, endereco: base, host, configurado: !!CFG.appUrl, redirecionando, acessoAtual: hostDaRequisicao(req), dns: { a, cname },
      webhooks: { kommo: CFG.kommoChaveWebhook ? `${base}/webhooks/kommo/${CFG.kommoChaveWebhook}` : "", evolution: evoOk() ? `${base}/webhooks/evolution/${chaveWebhookEvo()}` : "" } });
  }
  if (p === "/api/config" && req.method === "GET") { try { AJC = await STORE.ajustes(); } catch { /* usa o que já tem */ } }
  if (p === "/api/config" && req.method === "GET") return json(res, 200, { plataforma: true, endereco: baseDaRequisicao(req), versao: VERSAO, papel, permissoes: permissoes(papel), ia: !!anthropic, kommo: kommoOk(), whatsapp: !!CFG.kommoChaveWebhook || evoOk(), celular: evoOk(), armazenamento: STORE.tipo, dadosPersistentes: STORE.persistente, kommoUrl: CFG.kommoSub ? `https://${CFG.kommoSub}.kommo.com` : "" });
  if (p === "/api/backup" && req.method === "GET") {
    if (exige("exportar")) return;
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="alinha-dados-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" });
    const dump = { ...(await STORE.exportar()) }; delete dump.integracoes; // tokens e segredos de webhook ficam fora da cópia
    return res.end(JSON.stringify(dump, null, 2));
  }

  // segurança: verificação em duas etapas (Google Authenticator)
  if (p.startsWith("/api/seguranca")) {
    const I = await integ(); I.seg = I.seg || {};
    const estado = () => ({ ok: true, papel, ativo: !!(I.seg[papel] && I.seg[papel].ativo), perfis: papel === "admin" ? Object.fromEntries(["admin", "operacional", "crc"].map((r) => [r, !!(I.seg[r] && I.seg[r].ativo)])) : undefined });
    if (req.method === "GET" && p === "/api/seguranca") return json(res, 200, estado());
    if (req.method === "POST" && p === "/api/seguranca/2fa/iniciar") {
      const segredo = base32(crypto.randomBytes(20));
      I.seg[papel] = Object.assign({}, I.seg[papel], { pendente: segredo }); await STORE.salvarIntegracoes(I);
      const rotulo = encodeURIComponent(`Alinha:${papel}`), emissor = encodeURIComponent("Alinha Gestão Infinity");
      return json(res, 200, { ok: true, segredo, uri: `otpauth://totp/${rotulo}?secret=${segredo}&issuer=${emissor}&algorithm=SHA1&digits=6&period=30` });
    }
    if (req.method === "POST" && p === "/api/seguranca/2fa/ativar") {
      const b = await lerJSON(req), pend = I.seg[papel] && I.seg[papel].pendente;
      if (!pend) return json(res, 400, { erro: "Gere o QR code primeiro." });
      if (!totpConfere(pend, b.codigo, "ativar:" + papel)) return json(res, 400, { erro: "Código incorreto. Confira o horário do celular e digite o código atual." });
      I.seg[papel] = { segredo: pend, ativo: true, ativadoEm: new Date().toISOString() }; await STORE.salvarIntegracoes(I);
      return json(res, 200, estado());
    }
    if (req.method === "POST" && p === "/api/seguranca/2fa/desativar") {
      const b = await lerJSON(req), alvo = papel === "admin" && b.papel ? b.papel : papel;
      if (!["admin", "operacional", "crc"].includes(alvo)) return json(res, 400, { erro: "Perfil inválido." });
      if (alvo === papel && !(papel === "admin" && b.papel && b.papel !== "admin") && !totpConfere(I.seg[papel] && I.seg[papel].segredo, b.codigo, "desativar:" + papel)) return json(res, 400, { erro: "Digite o código atual do Google Authenticator para desativar." });
      I.seg[alvo] = { ativo: false }; await STORE.salvarIntegracoes(I);
      return json(res, 200, estado());
    }
    return json(res, 404, { erro: "Não encontrado" });
  }

  // integrações (administrador): tokens da API, webhooks de saída e Kommo
  if (p.startsWith("/api/integracoes")) {
    if (soAdmin()) return;
    const I = await integ(), base = baseDaRequisicao(req), seg = p.split("/").filter(Boolean); // ["api","integracoes",tipo,id,acao]
    const visao = () => ({ ok: true, base, api: base + "/api/v1", eventos: EVENTOS,
      tokens: I.tokens.map(({ hash, ...t }) => t), webhooks: I.webhooks, entregas: (I.entregas || []).slice(0, 20),
      kommo: { conectado: kommoOk(), webhook: CFG.kommoChaveWebhook ? `${base}/webhooks/kommo/${CFG.kommoChaveWebhook}` : "", funilLead: AJ.funilLead || "", funilCliente: AJ.funilCliente || "", etapaCliente: AJ.etapaCliente || "", etapaClienteFechou: AJ.etapaClienteFechou || "", sincronizar: !!AJ.kommoSincronizar, importar: AJ.kommoImportarLeads !== false } });
    if (req.method === "GET" && seg.length === 2) return json(res, 200, visao());
    if (seg[2] === "tokens" && req.method === "POST" && seg.length === 3) {
      const b = await lerJSON(req), nome = texto(b.nome, 60) || "Integração";
      if (I.tokens.length >= 20) return json(res, 400, { erro: "Limite de 20 tokens. Revogue um antes de criar outro." });
      const token = "alinha_" + crypto.randomBytes(24).toString("base64url");
      I.tokens.push({ id: crypto.randomBytes(6).toString("hex"), nome, escopo: b.escopo === "leitura" ? "leitura" : "escrita", hash: hashTk(token), prefixo: token.slice(0, 13), criadoEm: new Date().toISOString(), usadoEm: null });
      await STORE.salvarIntegracoes(I);
      return json(res, 200, { ...visao(), token }); // o token aparece uma única vez
    }
    if (seg[2] === "tokens" && req.method === "DELETE" && seg[3]) { I.tokens = I.tokens.filter((t) => t.id !== seg[3]); await STORE.salvarIntegracoes(I); return json(res, 200, visao()); }
    if (seg[2] === "webhooks" && req.method === "POST" && seg.length === 3) {
      const b = await lerJSON(req), urlW = texto(b.url, 500), evs = (Array.isArray(b.eventos) ? b.eventos : []).filter((e) => EVENTOS[e]);
      const chk = await urlSegura(urlW); if (!chk.ok) return json(res, 400, { erro: "Endereço do webhook: " + chk.erro });
      if (!evs.length) return json(res, 400, { erro: "Escolha ao menos um evento." });
      if (I.webhooks.length >= 20) return json(res, 400, { erro: "Limite de 20 webhooks." });
      I.webhooks.push({ id: crypto.randomBytes(6).toString("hex"), nome: texto(b.nome, 60) || new URL(urlW).hostname, url: urlW, eventos: evs, segredo: "whsec_" + crypto.randomBytes(20).toString("hex"), ativo: true, criadoEm: new Date().toISOString() });
      await STORE.salvarIntegracoes(I); return json(res, 200, visao());
    }
    const w = seg[2] === "webhooks" && I.webhooks.find((x) => x.id === seg[3]);
    if (w && req.method === "PATCH") { const b = await lerJSON(req); if (typeof b.ativo === "boolean") w.ativo = b.ativo; if (Array.isArray(b.eventos)) { const evs = b.eventos.filter((e) => EVENTOS[e]); if (evs.length) w.eventos = evs; } await STORE.salvarIntegracoes(I); return json(res, 200, visao()); }
    if (w && req.method === "DELETE") { I.webhooks = I.webhooks.filter((x) => x.id !== w.id); await STORE.salvarIntegracoes(I); return json(res, 200, visao()); }
    if (w && req.method === "POST" && seg[4] === "teste") {
      const ent = await enviarWebhook(w, "teste", { mensagem: "Teste de conexão do Alinha", webhook: w.nome });
      const J = await integ(); J.entregas = [ent].concat(J.entregas || []).slice(0, 40); await STORE.salvarIntegracoes(J);
      return json(res, 200, { ...visao(), teste: ent, entregas: J.entregas.slice(0, 20) });
    }
    return json(res, 404, { erro: "Não encontrado" });
  }

  // pacientes (follow-up)
  if (p === "/api/pacientes" && req.method === "GET") return json(res, 200, { ok: true, pacientes: await STORE.pacientes() });
  if (p === "/api/pacientes" && req.method === "POST") {
    const b = await lerJSON(req);
    if (!b.id) b.id = "p" + Date.now().toString(36) + crypto.randomBytes(2).toString("hex");
    const antes = (await STORE.pacientes()).find((x) => x.id === b.id) || null;
    await STORE.salvarPaciente(b);
    await emitir(antes, b, "alinha");
    return json(res, 200, { ok: true, paciente: b });
  }
  if (p.startsWith("/api/pacientes/") && req.method === "DELETE") {
    if (soAdmin()) return;
    const id = decodeURIComponent(p.split("/").pop());
    await STORE.apagarPaciente(id);
    return json(res, 200, { ok: true });
  }
  if (p === "/api/ajustes" && req.method === "GET") return json(res, 200, { ok: true, ajustes: await STORE.ajustes() });
  if (p === "/api/ajustes" && req.method === "POST") {
    const b = await lerJSON(req);
    // a equipe só pode cadastrar a própria voz; o resto dos ajustes é do administrador
    if (papel !== "admin" && Object.keys(b).some((k) => k !== "vozes")) return json(res, 403, { erro: "Somente o administrador pode alterar os ajustes." });
    AJC = await STORE.salvarAjustes(b);
    return json(res, 200, { ok: true, ajustes: AJC });
  }

  // IA
  if (p.startsWith("/api/ia/") && req.method === "POST") {
    const tipo = p.split("/").pop();
    if (exige(...({ dica: ["consulta"], briefing: ["consulta"], whatsapp: ["whatsapp"], mensagem: ["hoje", "followup", "comercial"], suporte: ["suporte"] }[tipo] || ["configurar"]))) return;
    if (!anthropic) return json(res, 503, { erro: "IA não configurada (ANTHROPIC_API_KEY)" });
    const b = await lerJSON(req);
    if (tipo === "suporte") return json(res, 200, { ok: true, ...(await chamarIA(promptSuporte(b, papel))) });
    const montar = { dica: promptDica, briefing: promptBriefing, mensagem: promptMensagem, whatsapp: promptWhatsApp }[tipo];
    if (!montar) return json(res, 404, { erro: "Não encontrado" });
    return json(res, 200, { ok: true, ...(await chamarIA(montar(b))) });
  }

  // WhatsApp
  if ((p.startsWith("/api/whatsapp/") || p === "/api/kommo/registrar") && exige(p === "/api/kommo/registrar" ? "consulta" : "whatsapp", ...(p === "/api/kommo/registrar" ? ["briefings"] : []))) return;
  if (p === "/api/whatsapp/enviar" && exige("enviar_whatsapp")) return;
  if (p === "/api/whatsapp/conversas" && req.method === "GET") {
    const r = await STORE.resumoWA();
    if (url.searchParams.get("ver") === String(r.ver)) return json(res, 200, { ok: true, mudou: false, ver: r.ver }); // nada novo: resposta leve
    const lista = r.itens.sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 100);
    return json(res, 200, { ok: true, mudou: true, ver: r.ver, conversas: lista });
  }
  if (p === "/api/whatsapp/mensagens" && req.method === "GET") {
    const C = await STORE.conversa(String(url.searchParams.get("lead") || ""));
    const desde = url.searchParams.get("desde") || "";
    return json(res, 200, { ok: true, mensagens: C ? C.lista.filter((m) => !desde || m.ts >= desde) : [], transferencias: (C && C.transf) || [] }); // >= e o navegador ignora repetidas
  }
  if (p === "/api/whatsapp/lead" && req.method === "GET") {
    if (!kommoOk()) return json(res, 503, { erro: "Kommo não configurado" });
    const d = await lerLeadKommo({ id: url.searchParams.get("id") });
    if (!d) return json(res, 404, { erro: "Lead não encontrado no Kommo" });
    const C = await STORE.conversa(String(d.lead_id));
    if (C) { if (d.nome) C.nome = d.nome; if (d.unidade) C.unidade = d.unidade; if (d.telefone) C.telefone = d.telefone; await STORE.salvarConversa(String(d.lead_id), C); }
    return json(res, 200, { ok: true, ...d });
  }
  // celular por QR code
  if (p === "/api/celular/estado" && req.method === "GET") {
    if (!evoOk()) return json(res, 200, { ok: true, configurado: false });
    return json(res, 200, { ok: true, configurado: true, ...(await evoEstado()) });
  }
  if (p === "/api/celular/conectar" && req.method === "POST") {
    if (soAdmin()) return;
    if (!evoOk()) return json(res, 503, { erro: "Conector do WhatsApp não configurado (EVOLUTION_URL e EVOLUTION_API_KEY)" });
    return json(res, 200, { ok: true, ...(await evoConectar(baseDaRequisicao(req))) });
  }
  if (p === "/api/celular/desconectar" && req.method === "POST") {
    if (soAdmin()) return;
    if (!evoOk()) return json(res, 503, { erro: "Conector do WhatsApp não configurado" });
    await evo("DELETE", `/instance/logout/${encodeURIComponent(CFG.evoInst)}`);
    return json(res, 200, { ok: true });
  }
  if (p === "/api/whatsapp/enviar" && req.method === "POST") {
    const b = await lerJSON(req);
    const lead = String(b.lead || ""), texto = String(b.texto || "").trim();
    if (!lead.startsWith("tel-") || !texto) return json(res, 400, { erro: "Envio direto só para conversas do celular conectado" });
    if (!evoOk()) return json(res, 503, { erro: "Conector do WhatsApp não configurado" });
    const numero = lead.slice(4);
    let d;
    try { d = await evo("POST", `/message/sendText/${encodeURIComponent(CFG.evoInst)}`, { number: numero, text: texto }); }
    catch (e) { if (e.status !== 400) throw e; d = await evo("POST", `/message/sendText/${encodeURIComponent(CFG.evoInst)}`, { number: numero, textMessage: { text: texto } }); } // v1
    const id = String((d && d.key && d.key.id) || "env-" + Date.now());
    await guardarMensagensEvo([{ lead, tel: numero, id, deMim: true, nome: "", texto, ts: new Date().toISOString() }]);
    return json(res, 200, { ok: true, id });
  }
  if (p === "/api/whatsapp/transferir" && req.method === "POST") {
    const b = await lerJSON(req), lead = String(b.lead || "");
    const C = await STORE.conversa(lead);
    if (!C) return json(res, 404, { erro: "Conversa não encontrada" });
    const setor = String(b.setor || "").trim().slice(0, 40);
    if (!setor) return json(res, 400, { erro: "Escolha o setor" });
    const t = { setor, pessoa: String(b.pessoa || "").trim().slice(0, 60), de: C.setor || "", deP: C.responsavel || "", por: String(b.por || "").trim().slice(0, 60), nota: String(b.nota || "").trim().slice(0, 500), ts: new Date().toISOString() };
    C.setor = t.setor; C.responsavel = t.pessoa; C.transf = (C.transf || []).concat(t).slice(-50);
    await STORE.salvarConversa(lead, C);
    const pr = disparar("conversa.transferida", { lead, nome: C.nome || "", telefone: C.telefone || "", setor: t.setor, pessoa: t.pessoa, de: t.de, por: t.por, nota: t.nota }).catch(() => {});
    if (process.env.VERCEL) await pr;
    return json(res, 200, { ok: true, transferencia: t });
  }
  if (p === "/api/whatsapp/atendimento" && req.method === "POST") {
    if (!kommoOk()) return json(res, 503, { erro: "Kommo não configurado" });
    const b = await lerJSON(req);
    if (!b.lead_id) return json(res, 400, { erro: "Informe o lead" });
    AJC = await STORE.ajustes();
    const tag = [{ name: AJ.etiquetaHumano || "Atendimento humano" }];
    await kommo("PATCH", `/api/v4/leads/${Number(b.lead_id)}`, b.humano ? { tags_to_add: tag } : { tags_to_delete: tag });
    return json(res, 200, { ok: true, humano: !!b.humano, etiqueta: tag[0].name });
  }

  // Kommo (opcional): registra o briefing no lead
  if (p === "/api/kommo/registrar" && req.method === "POST") {
    if (!kommoOk()) return json(res, 503, { erro: "Kommo não configurado" });
    AJC = await STORE.ajustes();
    const leadId = await registrarNoKommo(await lerJSON(req));
    return json(res, 200, { ok: true, lead_id: leadId });
  }

  const arq = p === "/" ? "index.html" : p.slice(1);
  if (["index.html", "app.js", "biblioteca.js", "demo.js", "voz.js", "qrcode.js", "ajuda.js"].includes(arq)) return servirArquivo(res, APP_DIR, arq);
  json(res, 404, { erro: "Não encontrado" });
}

function servirArquivo(res, base, rel) {
  const alvo = path.resolve(base, rel);
  if (!alvo.startsWith(base + path.sep)) return json(res, 403, { erro: "Proibido" });
  let buf;
  try { buf = fs.readFileSync(alvo); } catch { return json(res, 404, { erro: "Não encontrado" }); }
  res.writeHead(200, { "Content-Type": TIPOS[path.extname(alvo)] || "application/octet-stream", "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" });
  res.end(buf);
}

// tratador único: usado pelo servidor (Render/computador) e pela função da Vercel
export async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  if (String(req.headers["x-forwarded-proto"] || "").startsWith("https")) res.setHeader("Strict-Transport-Security", "max-age=31536000");
  try {
    await iniciar();
    await rotas(req, res);
  } catch (e) {
    console.error(new Date().toISOString(), req.method, req.url, e);
    let msg = e.message || "Erro inesperado";
    if (e instanceof Anthropic.AuthenticationError) msg = "Chave da IA inválida (ANTHROPIC_API_KEY)";
    else if (e instanceof Anthropic.RateLimitError) msg = "IA ocupada no momento. Tente de novo em alguns segundos.";
    else if (e instanceof Anthropic.APIError) msg = `IA indisponível (${e.status})`;
    if (!res.headersSent) json(res, 500, { erro: msg }); else res.end();
  }
}
export const resumoInicial = () => `Alinha v${VERSAO} · IA: ${anthropic ? "✓ " + CFG.modelo : "não configurada"} · Kommo: ${kommoOk() ? "✓" : "não configurado"} · dados: ${STORE.tipo}${STORE.persistente ? "" : " (TEMPORÁRIO)"}`;
export const PORTA = CFG.porta;
