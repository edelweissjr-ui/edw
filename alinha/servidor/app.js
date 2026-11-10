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
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { criarArmazenamento } from "./armazenamento.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(here, "..");              // alinha/
const ASSETS_DIR = path.resolve(APP_DIR, "../assets");   // logotipo do site

const env = process.env;
const CFG = {
  porta: Number(env.PORT || 3000),
  senha: env.SENHA_ACESSO || "",          // senha da equipe (usuário: equipe)
  senhaAdmin: env.SENHA_ADMIN || "",      // senha do administrador (usuário: admin)
  // chave que assina o login: estável entre reinícios e entre as cópias da função na Vercel
  segredo: env.SEGREDO_SESSAO || crypto.createHash("sha256").update("alinha|" + (env.SENHA_ADMIN || "") + "|" + (env.SENHA_ACESSO || "") + "|" + (env.ANTHROPIC_API_KEY || "")).digest("hex"),
  kommoSub: env.KOMMO_SUBDOMINIO || "",
  kommoBase: env.KOMMO_URL_BASE || "",
  kommoChaveWebhook: env.KOMMO_CHAVE_WEBHOOK || "",   // chave no endereço do webhook de mensagens
  // Celular por QR code (Evolution API — conector de WhatsApp Web, não oficial)
  evoUrl: (env.EVOLUTION_URL || "").replace(/\/$/, ""),
  evoKey: env.EVOLUTION_API_KEY || "",
  evoInst: env.EVOLUTION_INSTANCIA || "alinha",
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
async function guardarMensagensEvo(lista) {
  const porLead = {};
  lista.forEach((m) => (porLead[m.lead] = porLead[m.lead] || []).push(m));
  for (const [lead, msgs] of Object.entries(porLead)) {
    const C = (await STORE.conversa(lead)) || { lista: [], nome: "", atualizado: 0, origem: "celular" };
    let mudou = false;
    for (const m of msgs) {
      if (!m.deMim && m.nome && !C.nome) C.nome = m.nome.slice(0, 60);
      C.telefone = C.telefone || "+" + m.tel; C.origem = "celular";
      if (C.lista.some((x) => x.id === m.id)) continue;
      C.lista.push({ id: m.id, ts: m.ts, autor: m.deMim ? "clinica" : "cliente", texto: m.texto }); mudou = true;
    }
    if (!mudou) continue;
    C.lista.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)); C.lista = C.lista.slice(-200); C.atualizado = Date.now();
    await STORE.salvarConversa(lead, C);
  }
}
const baseDaRequisicao = (req) => `${(req.headers["x-forwarded-proto"] || "http").split(",")[0]}://${req.headers["x-forwarded-host"] || req.headers.host}`;

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
    const C = (await STORE.conversa(lead)) || { lista: [], nome: "", atualizado: 0 };
    let mudou = false;
    for (const msg of msgs) {
      const anexo = msg.attachment && msg.attachment.link ? String(msg.attachment.link) : "";
      const ehAudio = !!anexo && /voice|audio/i.test(String((msg.attachment && msg.attachment.type) || "") + anexo);
      if (!msg.text && !anexo) continue;
      const ts = msg.created_at ? new Date(Number(msg.created_at) * 1000).toISOString() : new Date().toISOString();
      const id = String(msg.id || lead + "-" + ts);
      const autorInfo = JSON.stringify(msg.author || {}).toLowerCase();
      if (msg.type !== "outgoing" && msg.author && msg.author.name && !C.nome) C.nome = String(msg.author.name).slice(0, 60);
      if (C.lista.some((x) => x.id === id)) continue;
      C.lista.push({ id, ts, autor: msg.type === "outgoing" ? "clinica" : "cliente", ia: msg.type === "outgoing" && /bot|robo|\bia\b|assistente|salesbot|n8n|gpt|claude/.test(autorInfo),
        texto: String(msg.text || (ehAudio ? "🎧 [áudio]" : "📎 [anexo]")), anexo: anexo || null });
      mudou = true;
    }
    if (!mudou) continue;
    C.lista.sort((a, b) => (a.ts > b.ts ? 1 : a.ts < b.ts ? -1 : 0)); // estável: mesma hora mantém a ordem de chegada
    C.lista = C.lista.slice(-200); C.atualizado = Date.now();
    await STORE.salvarConversa(lead, C);
  }
}

/* ------------------------------------------------------------------ */
/* utilidades HTTP e sessão                                            */
/* ------------------------------------------------------------------ */
const TIPOS = { ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".css": "text/css" };

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
// devolve o papel da sessão ("admin" ou "equipe") ou null
function sessaoValida(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)alinha=([^;]+)/);
  if (!m) return null;
  const [exp, papel, sig] = decodeURIComponent(m[1]).split(".");
  if (!exp || !papel || !sig || Number(exp) < Date.now() || !["admin", "equipe"].includes(papel)) return null;
  const esperado = assinar(exp + "." + papel);
  return sig.length === esperado.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado)) ? papel : null;
}
const igual = (a, b) => !!b && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
function autenticar(usuario, senha) {
  const u = String(usuario || "").trim().toLowerCase();
  if (u === "admin") return igual(senha, CFG.senhaAdmin) ? "admin" : null;
  if (u === "equipe" || u === "") {
    if (igual(senha, CFG.senha)) return CFG.senhaAdmin ? "equipe" : "admin"; // sem senha de admin, a senha única dá acesso total
  }
  return null;
}
const ehHttps = (req) => (req.headers["x-forwarded-proto"] || "").includes("https");

const tentativas = new Map(); // proteção simples contra força bruta
function bloqueado(ip) { const t = tentativas.get(ip); return t && t.n >= 8 && Date.now() - t.em < 15 * 60 * 1000; }
function falhou(ip) { const t = tentativas.get(ip) || { n: 0, em: Date.now() }; t.n++; t.em = Date.now(); tentativas.set(ip, t); }


function paginaLogin(erro = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Alinha</title><link rel="icon" href="logo.svg"><style>
:root{--bg:#0A0A1C;--card:#13122B;--fg:#EEEDFF;--dim:#CDCAF2;--accent:#7C6CF6;--line:rgba(167,158,255,.18);--bad:#FF7A72;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg) radial-gradient(900px 500px at 70% -10%,rgba(124,108,246,.25),transparent 60%);color:var(--fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:30px;width:100%;max-width:360px;display:grid;gap:12px}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:24px;letter-spacing:-.02em}.logo svg{width:36px;height:36px}p{margin:0;color:var(--dim);font-size:15px}
input{font:inherit;color:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}.err{color:var(--bad);font-weight:600}.lema{color:var(--fg);font-size:14.5px;line-height:1.5}.lema b{color:#A79BFF}.small{font-size:12px}
</style></head><body><form method="post" action="login">
<div class="logo"><svg aria-hidden="true" viewBox="0 0 32 32"><defs><linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6A5AF0"/><stop offset="1" stop-color="#A193FF"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#gA)"/><path d="M10 24 16 8l6 16" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.9 18.6q4.1 3 8.2 0" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>Alinha</div><p class="lema">Alinha a conversa, o orçamento, o fechamento e o tratamento.<br><b>Do primeiro contato ao sorriso alinhado.</b></p><p class="small">Weiss Odontologia</p>
${erro ? `<p class="err">${erro}</p>` : ""}
<label for="usuario" style="font-size:13px;font-weight:600">Usuário</label>
<input id="usuario" name="usuario" autocomplete="username" placeholder="equipe ou admin" value="equipe" autocapitalize="none" spellcheck="false">
<label for="senha" style="font-size:13px;font-weight:600">Senha</label>
<input id="senha" name="senha" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Entrar</button></form></body></html>`;
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

const MOMENTOS = ["Acolhimento", "Investigação", "Diagnóstico", "Apresentação", "Negociação", "Fechamento"];

function promptDica(b) {
  return {
    sistema: `Você é o Alinha, copiloto que acompanha AO VIVO uma consulta de Ortodontia da ${CLINICA}
Você lê o trecho mais recente da conversa e decide se o profissional precisa de uma dica AGORA.
${METODO}
Quando fizer sentido, a dica pode ser a próxima pergunta SPIN que falta, o próximo item N.E.A.T. a descobrir (ex.: quem decide, prazo) ou um insight da venda desafiadora. Indique a técnica no rótulo quando for o caso (ex.: "SPIN · Implicação", "N.E.A.T. · Prazo", "Sandler · Contrato"). A dica aparece na tela por poucos segundos, então ela tem de ser lida num relance.
- Dica: 1 ou 2 frases curtas, no imperativo, específicas para o que o paciente acabou de dizer (ex.: "Segure o desconto. Descubra com o que ela está comparando e traduza o valor em parcela mensal.").
- Se não houver nada importante a dizer, responda com "dica": "".
- Momentos possíveis: ${MOMENTOS.join(", ")}.
Responda SOMENTE com JSON: {"momento": "...", "tipo": "objecao|sinal_compra|oportunidade|alerta", "rotulo": "2 a 4 palavras, ex.: Objeção de preço", "dica": "...", "citacao": "a frase do paciente que motivou a dica, literal e curta", "prontidao": número de 0 a 100 indicando o quanto o paciente está pronto para fechar agora (desejo, sinais de compra, objeções pendentes, decisor presente)}`,
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
Regras: mensagem curta (até 3 frases), no máximo 1 emoji, termine com uma pergunta fácil (de preferência com duas opções). Se faltar algo do N.E.A.T. (ex.: quem decide, prazo), use a pergunta para descobrir. Não passe preço antes do diagnóstico: convide para o check-up digital. Diante de objeção: valide, descubra a objeção real e responda. Nunca prometa resultado; não invente valores, prazos ou condições. Não dê diagnóstico pelo WhatsApp. Só use condição especial se estiver no contexto.
Responda SOMENTE com JSON: {"orientacao": "1 frase para o atendente: o que está acontecendo e o que fazer", "mensagem": "texto pronto para enviar", "rotulo": "2 a 4 palavras, ex.: Objeção de preço", "prontidao": número de 0 a 100 (quão pronto para agendar/fechar)}`,
    prompt: `Unidade: ${b.unidade || "-"} · Paciente: ${b.nome || "-"}
Condição especial vigente: ${b.condicao || "nenhuma"}
${b.versao_anterior ? "Escreva uma versão DIFERENTE desta: " + b.versao_anterior + "\n" : ""}
CONVERSA (a mais recente por último):
${(b.conversa || []).slice(-30).map((m) => `${m.autor === "cliente" ? "PACIENTE" : m.ia ? "IA DE ATENDIMENTO" : "CLÍNICA"}: ${m.texto}`).join("\n")}`,
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
Não invente desconto, prazo ou condição. Responda SOMENTE com JSON: {"mensagem": "..."}`,
    prompt: `Toque: ${b.toque} (${String(b.dia).startsWith("R") ? b.dia + " — reativação" : "D" + b.dia})
Paciente: ${p.nome || "-"} · Unidade: ${p.unidade || "-"} · Tratamento: ${p.tratamento || "-"} · Valor apresentado: ${p.valorApresentado || "-"}
Dor: ${p.dor || "-"} · Evento: ${p.evento || "-"} · Decisor: ${p.decisor || "-"}
Objeções: ${(p.objecoes || []).join(", ") || "-"} · O que travou: ${p.oQueTravou || "-"}
Palavras do paciente: ${(p.palavras || []).join(" | ") || "-"}
Profissional que atendeu: ${p.profissional || "-"}
Condição especial vigente informada pela clínica: ${b.condicao || "nenhuma"}
${b.versao_anterior ? "Escreva uma versão DIFERENTE desta: " + b.versao_anterior : ""}`
  };
}

/* ------------------------------------------------------------------ */
/* rotas                                                               */
/* ------------------------------------------------------------------ */
async function rotas(req, res) {
  const url = new URL(req.url, "http://local");
  const p = url.pathname;
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  if (p === "/saude") return json(res, 200, { ok: true });
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
    await guardarWhatsApp(lerMensagensKommo((await lerCorpo(req)).toString("utf8")));
    return json(res, 200, { ok: true });
  }
  if (p.startsWith("/assets/")) return servirArquivo(res, ASSETS_DIR, p.slice("/assets/".length));
  if (p === "/logo.svg") return servirArquivo(res, APP_DIR, "logo.svg");

  if (p === "/login" && req.method === "POST") {
    if (bloqueado(ip)) { res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Muitas tentativas. Aguarde 15 minutos.")); }
    const form = new URLSearchParams((await lerCorpo(req)).toString("utf8"));
    const papel = autenticar(form.get("usuario"), form.get("senha") || "");
    if (!papel) { falhou(ip); res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Usuário ou senha incorretos.")); }
    tentativas.delete(ip);
    res.writeHead(303, { Location: "./", "Set-Cookie": `alinha=${encodeURIComponent(cookieSessao(papel))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${ehHttps(req) ? "; Secure" : ""}` });
    return res.end();
  }
  if (p === "/sair") { res.writeHead(303, { Location: "login", "Set-Cookie": "alinha=; Path=/; Max-Age=0" }); return res.end(); }
  if (p === "/login") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin()); }

  const papel = sessaoValida(req);
  const soAdmin = () => { if (papel === "admin") return false; json(res, 403, { erro: "Somente o administrador pode fazer isso." }); return true; };
  if (!papel) {
    if (p.startsWith("/api/")) return json(res, 401, { erro: "Sessão expirada. Entre novamente." });
    res.writeHead(303, { Location: "login" }); return res.end();
  }

  if (p === "/api/config" && req.method === "GET") return json(res, 200, { plataforma: true, versao: VERSAO, papel, ia: !!anthropic, kommo: kommoOk(), whatsapp: !!CFG.kommoChaveWebhook || evoOk(), celular: evoOk(), armazenamento: STORE.tipo, dadosPersistentes: STORE.persistente, kommoUrl: CFG.kommoSub ? `https://${CFG.kommoSub}.kommo.com` : "" });
  if (p === "/api/backup" && req.method === "GET") {
    if (soAdmin()) return;
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="alinha-dados-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" });
    return res.end(JSON.stringify(await STORE.exportar(), null, 2));
  }

  // pacientes (follow-up)
  if (p === "/api/pacientes" && req.method === "GET") return json(res, 200, { ok: true, pacientes: await STORE.pacientes() });
  if (p === "/api/pacientes" && req.method === "POST") {
    const b = await lerJSON(req);
    if (!b.id) b.id = "p" + Date.now().toString(36) + crypto.randomBytes(2).toString("hex");
    await STORE.salvarPaciente(b);
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
    if (!anthropic) return json(res, 503, { erro: "IA não configurada (ANTHROPIC_API_KEY)" });
    const b = await lerJSON(req);
    const tipo = p.split("/").pop();
    const montar = { dica: promptDica, briefing: promptBriefing, mensagem: promptMensagem, whatsapp: promptWhatsApp }[tipo];
    if (!montar) return json(res, 404, { erro: "Não encontrado" });
    return json(res, 200, { ok: true, ...(await chamarIA(montar(b))) });
  }

  // WhatsApp
  if (p === "/api/whatsapp/conversas" && req.method === "GET") {
    const r = await STORE.resumoWA();
    if (url.searchParams.get("ver") === String(r.ver)) return json(res, 200, { ok: true, mudou: false, ver: r.ver }); // nada novo: resposta leve
    const lista = r.itens.sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 100);
    return json(res, 200, { ok: true, mudou: true, ver: r.ver, conversas: lista });
  }
  if (p === "/api/whatsapp/mensagens" && req.method === "GET") {
    const C = await STORE.conversa(String(url.searchParams.get("lead") || ""));
    const desde = url.searchParams.get("desde") || "";
    return json(res, 200, { ok: true, mensagens: C ? C.lista.filter((m) => !desde || m.ts >= desde) : [] }); // >= e o navegador ignora repetidas
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
  if (["index.html", "app.js", "biblioteca.js", "demo.js", "voz.js", "qrcode.js"].includes(arq)) return servirArquivo(res, APP_DIR, arq);
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
