/* =====================================================================
   COPILOTO WEISS — PLATAFORMA ÚNICA
   Um só endereço com senha que:
     • serve a tela do copiloto;
     • registra consultas direto no Kommo (contato, lead, nota, tarefa);
     • pede sugestões e avaliações à IA (Claude);
     • transcreve áudios (OpenAI Whisper, opcional);
     • recebe do Kommo as mensagens de WhatsApp para o "ao vivo".
   Sem n8n. Configuração por variáveis de ambiente (veja .env.exemplo).
   ===================================================================== */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(here, "..");            // consulta/
const ASSETS_DIR = path.resolve(APP_DIR, "../assets"); // logotipo do site

const env = process.env;
const CFG = {
  porta: Number(env.PORT || 3000),
  senha: env.SENHA_ACESSO || "",
  segredo: env.SEGREDO_SESSAO || crypto.randomBytes(32).toString("hex"),
  kommoSub: env.KOMMO_SUBDOMINIO || "",
  kommoBase: env.KOMMO_URL_BASE || "", // opcional (testes/domínio próprio); padrão https://SUBDOMINIO.kommo.com
  kommoToken: env.KOMMO_TOKEN || "",
  kommoPipeline: env.KOMMO_FUNIL_ID ? Number(env.KOMMO_FUNIL_ID) : null,
  kommoStatus: {
    negociacao: env.KOMMO_ETAPA_NEGOCIACAO ? Number(env.KOMMO_ETAPA_NEGOCIACAO) : null,
    fechado: Number(env.KOMMO_ETAPA_FECHADO || 142),
    perdido: Number(env.KOMMO_ETAPA_PERDIDO || 143)
  },
  kommoResponsavel: env.KOMMO_RESPONSAVEL_ID ? Number(env.KOMMO_RESPONSAVEL_ID) : null,
  kommoChaveWebhook: env.KOMMO_CHAVE_WEBHOOK || "",
  anthropicKey: env.ANTHROPIC_API_KEY || "",
  modelo: env.MODELO_IA || "claude-opus-5-5",
  openaiKey: env.OPENAI_API_KEY || "",
  openaiBase: env.OPENAI_URL_BASE || "https://api.openai.com",
  dados: env.PASTA_DADOS || path.join(APP_DIR, "dados")
};
if (!CFG.senha) console.warn("⚠️  SENHA_ACESSO não definida: defina antes de publicar.");

const anthropic = CFG.anthropicKey ? new Anthropic({ apiKey: CFG.anthropicKey }) : null;

/* ------------------------------------------------------------------ */
/* utilidades HTTP                                                     */
/* ------------------------------------------------------------------ */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".css": "text/css" };

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}
function lerCorpo(req, limite = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const partes = []; let total = 0;
    req.on("data", (c) => { total += c.length; if (total > limite) { reject(new Error("Arquivo grande demais")); req.destroy(); } else partes.push(c); });
    req.on("end", () => resolve(Buffer.concat(partes)));
    req.on("error", reject);
  });
}
async function lerJSON(req) { const b = await lerCorpo(req); return b.length ? JSON.parse(b.toString("utf8")) : {}; }

/* ------------------------------------------------------------------ */
/* sessão (cookie assinado)                                            */
/* ------------------------------------------------------------------ */
const assinar = (v) => crypto.createHmac("sha256", CFG.segredo).update(v).digest("hex");
function cookieSessao() {
  const exp = Date.now() + 12 * 3600 * 1000; // 12 horas
  return `${exp}.${assinar(String(exp))}`;
}
function sessaoValida(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)copiloto=([^;]+)/);
  if (!m) return false;
  const [exp, sig] = decodeURIComponent(m[1]).split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const esperado = assinar(exp);
  return sig.length === esperado.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado));
}
const ehHttps = (req) => (req.headers["x-forwarded-proto"] || "").includes("https");

const tentativas = new Map(); // proteção simples contra força bruta
function bloqueado(ip) { const t = tentativas.get(ip); return t && t.n >= 8 && Date.now() - t.em < 15 * 60 * 1000; }
function falhou(ip) { const t = tentativas.get(ip) || { n: 0, em: Date.now() }; t.n++; t.em = Date.now(); tentativas.set(ip, t); }

function paginaLogin(erro = "") {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Copiloto Weiss</title><style>
:root{--bg:#F5F5F7;--card:#fff;--fg:#0C3346;--dim:#4F6873;--accent:#1F9A8B;--line:rgba(24,88,120,.16);--bad:#C0392B}
@media (prefers-color-scheme:dark){:root{--bg:#0B1A22;--card:#11252F;--fg:#E6F1F4;--dim:#9DB4BD;--line:rgba(160,210,220,.16);color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:28px;width:100%;max-width:360px;display:grid;gap:12px}
img{width:44px;height:44px;object-fit:contain}h1{font-size:20px;margin:0}p{margin:0;color:var(--dim);font-size:14px}
input{font:inherit;color:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
button{font:inherit;font-weight:700;padding:11px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}.err{color:var(--bad);font-weight:600}
</style></head><body><form method="post" action="login">
<img src="assets/escudo.png" alt=""><h1>Copiloto de Consulta</h1><p>Weiss Odontologia · Caruaru e Recife</p>
${erro ? `<p class="err">${erro}</p>` : ""}
<label for="senha" style="font-size:13px;font-weight:600">Senha de acesso</label>
<input id="senha" name="senha" type="password" autocomplete="current-password" required autofocus>
<button type="submit">Entrar</button></form></body></html>`;
}

/* ------------------------------------------------------------------ */
/* KOMMO                                                               */
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

async function registrarNoKommo(b) {
  const p = b.paciente || {}, c = b.consulta || {}, o = b.orcamento || {};
  const tel = String(p.telefone || "").replace(/\D/g, "");
  if (!tel) throw new Error("Telefone do paciente ausente");
  const telNacional = tel.startsWith("55") && tel.length > 11 ? tel.slice(2) : tel;
  const resultado = b.resultado || "negociacao";
  const statusId = CFG.kommoStatus[resultado] || null;
  const canal = c.canal === "presencial" ? "Presencial" : "WhatsApp";
  const tags = ["Copiloto", canal, c.unidade, o.tratamento].filter(Boolean).map((name) => ({ name }));
  if ((b.temperatura || 0) >= 70) tags.push({ name: "Lead quente" });

  const lead = { price: Math.round(o.valor || 0) };
  if (statusId) lead.status_id = statusId;
  if (CFG.kommoPipeline) lead.pipeline_id = CFG.kommoPipeline;
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
const SISTEMA = `Você é o copiloto comercial da Weiss Odontologia (Caruaru e Recife), clínica de Ortodontia do Dr. Edelweiss Jr, especialista e mestre em Ortodontia. Diferenciais: check-up digital e escaneamento com o scanner iTero (sorriso em 3D, sem massinha, com simulação do resultado), pioneiros do Invisalign em Caruaru, alinhadores transparentes e aparelhos fixos.
Endereços: Caruaru — R. dos Expedicionários, 104, 1º andar, Nossa Sra. das Dores, WhatsApp (81) 99836-8491. Recife — Av. República do Líbano, 251, Torre 1, Sala 1614, Pina, WhatsApp (81) 97318-5005.

Sua função: ler a conversa e ajudar o profissional a conduzir o paciente, com empatia, para o agendamento do check-up digital ou para o fechamento do orçamento.
Regras:
- Português do Brasil, tom acolhedor e seguro. No WhatsApp: mensagem curta (até 3 frases), no máximo 1 emoji.
- Termine com uma pergunta que faça a conversa avançar (de preferência com duas opções).
- Não passe preço antes do diagnóstico: convide para o check-up digital.
- Diante de objeção: valide o sentimento, descubra a objeção real e responda.
- Nunca prometa ou garanta resultado; fale em planejamento e simulação. Não invente valores, prazos ou condições que não estejam no contexto.
- Só mencione condição especial ou garantia se ela estiver no contexto como vigente.
- Não dê diagnóstico clínico pelo WhatsApp.
Responda SOMENTE com um JSON válido, sem texto fora dele, no formato:
{"orientacao": "uma frase dizendo ao profissional o que fazer agora", "mensagem": "o texto pronto para falar ou enviar ao paciente"}`;

function montarPrompt(b) {
  const conversa = (b.conversa || []).map((m) => `${m.quem === "cliente" ? "PACIENTE" : "CLÍNICA"}: ${m.texto}`).join("\n");
  const o = b.orcamento || {}, n = b.notas || {};
  const contexto = `Canal: ${b.canal === "presencial" ? "consulta presencial" : "WhatsApp"} · Unidade: ${b.unidade}
Etapa atual do roteiro: ${b.etapa}${b.objetivo_etapa ? " — objetivo: " + b.objetivo_etapa : ""}
Paciente: ${(b.paciente && b.paciente.nome) || "não informado"}
Dor principal: ${n.dor || "-"} · Evento/prazo: ${n.evento || "-"} · Notas: ${n.livre || "-"}
Orçamento: ${o.tratamento || "-"} · valor ${o.valor || "-"} · entrada ${o.entrada || "-"} · parcelas ${o.parcelas || "-"}
Condição especial vigente: ${b.condicao || "nenhuma"} · Segurança oferecida: ${b.garantia || "nenhuma"}
Temperatura (0-100): ${b.temperatura} · Objeções detectadas: ${(b.objecoes || []).join(", ") || "nenhuma"}

CONVERSA (mais recente por último):
${conversa || "(sem mensagens)"}`;
  if (b.evento === "avaliar_consulta") {
    return `TAREFA: AVALIAR a condução desta consulta (não sugerir fala). Resultado: ${b.resultado || "não registrado"} · Nota calculada pelo roteiro: ${b.nota_local}/100
${contexto}

Avalie de 0 a 10: acolhimento, descoberta da dor, uso do iTero/simulação, apresentação da solução, apresentação do investimento, tratamento das objeções, fechamento e próximo passo.
Use o MESMO formato JSON: em "orientacao" coloque "Nota geral X/10 — frase-resumo"; em "mensagem" coloque, em tópicos curtos: notas por critério, 3 pontos fortes, 3 pontos a melhorar (com a frase exata que poderia ter sido dita) e a próxima ação recomendada com esse paciente.`;
  }
  return contexto + "\n\nQual a melhor próxima resposta da clínica?";
}

async function perguntarIA(b) {
  const avaliar = b.evento === "avaliar_consulta";
  const resp = await anthropic.beta.messages.create({
    model: CFG.modelo,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: avaliar ? "medium" : "low" },
    system: SISTEMA,
    messages: [{ role: "user", content: montarPrompt(b) }]
  });
  if (resp.stop_reason === "refusal") throw new Error("A IA não respondeu a este pedido. Reformule a conversa e tente de novo.");
  const texto = resp.content.filter((x) => x.type === "text").map((x) => x.text).join("").trim();
  let r = { orientacao: "", mensagem: texto };
  try {
    const m = texto.match(/\{[\s\S]*\}/);
    if (m) { const j = JSON.parse(m[0]); r = { orientacao: j.orientacao || "", mensagem: j.mensagem || texto }; }
  } catch { /* resposta fora do formato: devolve o texto */ }
  return r;
}

/* ------------------------------------------------------------------ */
/* ÁUDIO (OpenAI Whisper)                                              */
/* ------------------------------------------------------------------ */
async function transcrever(buffer, tipo, nome) {
  const fd = new FormData();
  fd.append("file", new Blob([buffer], { type: tipo || "audio/ogg" }), nome || "audio.ogg");
  fd.append("model", "whisper-1");
  fd.append("language", "pt");
  fd.append("prompt", "Conversa entre clínica odontológica Weiss e paciente sobre ortodontia, Invisalign, alinhadores, iTero, orçamento e parcelamento.");
  const r = await fetch(`${CFG.openaiBase}/v1/audio/transcriptions`, { method: "POST", headers: { Authorization: `Bearer ${CFG.openaiKey}` }, body: fd });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d.error && d.error.message) || `Transcrição falhou (${r.status})`);
  return d.text || "";
}
const extensao = (tipo) => ({ "audio/ogg": "ogg", "audio/opus": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav", "audio/webm": "webm" }[(tipo || "").split(";")[0]] || "ogg");

/* ------------------------------------------------------------------ */
/* MENSAGENS DO WHATSAPP (via webhook do Kommo)                        */
/* ------------------------------------------------------------------ */
fs.mkdirSync(CFG.dados, { recursive: true });
const ARQ_MSG = path.join(CFG.dados, "mensagens.json");
let mensagens = {};
try { mensagens = JSON.parse(fs.readFileSync(ARQ_MSG, "utf8")); } catch { mensagens = {}; }
let salvarTimer = null;
function salvarMensagens() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => fs.writeFile(ARQ_MSG, JSON.stringify(mensagens), () => {}), 1000);
}

function lerMensagensKommo(corpo) {
  // O Kommo envia application/x-www-form-urlencoded com chaves como message[add][0][text]
  const acc = {};
  for (const [k, v] of new URLSearchParams(corpo)) {
    const m = k.match(/^message\[add\]\[(\d+)\]\[([^\]]+)\](?:\[([^\]]+)\])?$/);
    if (!m) continue;
    acc[m[1]] = acc[m[1]] || {};
    if (m[3]) { acc[m[1]][m[2]] = acc[m[1]][m[2]] || {}; acc[m[1]][m[2]][m[3]] = v; }
    else acc[m[1]][m[2]] = v;
  }
  return Object.values(acc);
}
function guardarMensagens(lista) {
  const agora = Date.now();
  for (const msg of lista) {
    const lead = String(msg.entity_id || msg.element_id || "");
    const anexo = msg.attachment && msg.attachment.link ? String(msg.attachment.link) : "";
    const ehAudio = !!anexo && /voice|audio/i.test(String((msg.attachment && msg.attachment.type) || "") + anexo);
    if (!lead || (!msg.text && !anexo)) continue;
    const ts = msg.created_at ? new Date(Number(msg.created_at) * 1000).toISOString() : new Date().toISOString();
    const L = mensagens[lead] = mensagens[lead] || { atualizado: agora, lista: [] };
    const id = String(msg.id || lead + "-" + ts);
    if (!L.lista.some((x) => x.id === id)) {
      L.lista.push({ id, texto: String(msg.text || (ehAudio ? "[áudio]" : "[anexo]")), autor: msg.type === "outgoing" ? "clinica" : "cliente", ts, anexo: anexo || null, audio: ehAudio });
    }
    L.lista = L.lista.slice(-150);
    L.atualizado = agora;
  }
  for (const [k, L] of Object.entries(mensagens)) if (agora - L.atualizado > 7 * 24 * 3600 * 1000) delete mensagens[k];
  salvarMensagens();
}

/* ------------------------------------------------------------------ */
/* rotas                                                               */
/* ------------------------------------------------------------------ */
async function rotas(req, res) {
  const url = new URL(req.url, "http://local");
  const p = url.pathname;
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();

  // saúde (para a hospedagem)
  if (p === "/saude") return json(res, 200, { ok: true });

  // webhook do Kommo (sem sessão; protegido pela chave na URL)
  if (p.startsWith("/webhooks/kommo/") && req.method === "POST") {
    const chave = p.split("/").pop();
    if (!CFG.kommoChaveWebhook || chave !== CFG.kommoChaveWebhook) return json(res, 403, { ok: false });
    const corpo = (await lerCorpo(req)).toString("utf8");
    guardarMensagens(lerMensagensKommo(corpo));
    return json(res, 200, { ok: true });
  }

  // logotipo (também na tela de login)
  if (p.startsWith("/assets/")) return servirArquivo(res, ASSETS_DIR, p.slice("/assets/".length));

  // login / logout
  if (p === "/login" && req.method === "POST") {
    if (bloqueado(ip)) { res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Muitas tentativas. Aguarde 15 minutos.")); }
    const senha = new URLSearchParams((await lerCorpo(req)).toString("utf8")).get("senha") || "";
    const ok = CFG.senha && senha.length === CFG.senha.length && crypto.timingSafeEqual(Buffer.from(senha), Buffer.from(CFG.senha));
    if (!ok) { falhou(ip); res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Senha incorreta.")); }
    tentativas.delete(ip);
    res.writeHead(303, { Location: "./", "Set-Cookie": `copiloto=${encodeURIComponent(cookieSessao())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${ehHttps(req) ? "; Secure" : ""}` });
    return res.end();
  }
  if (p === "/sair") { res.writeHead(303, { Location: "login", "Set-Cookie": "copiloto=; Path=/; Max-Age=0" }); return res.end(); }
  if (p === "/login") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin()); }

  // daqui para baixo, só com sessão
  if (!sessaoValida(req)) {
    if (p.startsWith("/api/")) return json(res, 401, { erro: "Sessão expirada. Entre novamente." });
    res.writeHead(303, { Location: "login" }); return res.end();
  }

  if (p === "/api/config" && req.method === "GET") {
    return json(res, 200, { plataforma: true, kommo: kommoOk(), ia: !!anthropic, audio: !!CFG.openaiKey, whatsapp: !!CFG.kommoChaveWebhook });
  }

  if (p === "/api/consulta" && req.method === "POST") {
    const b = await lerJSON(req);
    if (b.evento === "teste") return json(res, kommoOk() ? 200 : 503, kommoOk() ? { ok: true } : { erro: "Kommo não configurado" });
    if (!kommoOk()) return json(res, 503, { erro: "Kommo não configurado na plataforma" });
    const leadId = await registrarNoKommo(b);
    return json(res, 200, { ok: true, lead_id: leadId });
  }

  if (p === "/api/sugestao" && req.method === "POST") {
    const b = await lerJSON(req);
    if (!anthropic) return json(res, 503, { erro: "IA não configurada na plataforma" });
    if (b.evento === "teste") return json(res, 200, { ok: true, sugestao: "Conexão com a IA funcionando." });
    const r = await perguntarIA(b);
    return json(res, 200, { ok: true, sugestao: r.mensagem, orientacao: r.orientacao });
  }

  if (p === "/api/audio" && req.method === "POST") {
    if (!CFG.openaiKey) return json(res, 503, { erro: "Transcrição não configurada na plataforma" });
    const tipo = String(req.headers["content-type"] || "");
    let buffer, tipoAudio = tipo;
    if (tipo.startsWith("application/json")) {
      const b = await lerJSON(req);
      if (!b.url) return json(res, 400, { erro: "Envie um áudio ou uma URL" });
      const r = await fetch(b.url);
      if (!r.ok) return json(res, 502, { erro: `Não foi possível baixar o áudio (${r.status})` });
      buffer = Buffer.from(await r.arrayBuffer());
      tipoAudio = r.headers.get("content-type") || "audio/ogg";
    } else {
      buffer = await lerCorpo(req, 25 * 1024 * 1024);
    }
    if (!buffer.length) return json(res, 400, { erro: "Áudio vazio" });
    const texto = await transcrever(buffer, tipoAudio, "audio." + extensao(tipoAudio));
    return json(res, 200, { ok: true, texto });
  }

  if (p === "/api/mensagens" && req.method === "GET") {
    const L = mensagens[String(url.searchParams.get("lead") || "")];
    const desde = url.searchParams.get("desde") || "1970-01-01T00:00:00.000Z";
    return json(res, 200, { ok: true, mensagens: L ? L.lista.filter((m) => m.ts > desde) : [] });
  }

  // arquivos da tela
  const arq = p === "/" ? "index.html" : p.slice(1);
  if (["index.html", "app.js", "roteiro.js"].includes(arq)) return servirArquivo(res, APP_DIR, arq);
  json(res, 404, { erro: "Não encontrado" });
}

function servirArquivo(res, base, rel) {
  const alvo = path.resolve(base, rel);
  if (!alvo.startsWith(base + path.sep)) return json(res, 403, { erro: "Proibido" });
  fs.readFile(alvo, (err, buf) => {
    if (err) return json(res, 404, { erro: "Não encontrado" });
    res.writeHead(200, { "Content-Type": TIPOS[path.extname(alvo)] || "application/octet-stream", "Cache-Control": "no-cache", "X-Robots-Tag": "noindex" });
    res.end(buf);
  });
}

http.createServer((req, res) => {
  rotas(req, res).catch((e) => {
    console.error(new Date().toISOString(), req.method, req.url, e);
    let msg = e.message || "Erro inesperado";
    if (e instanceof Anthropic.AuthenticationError) msg = "Chave da IA inválida (ANTHROPIC_API_KEY)";
    else if (e instanceof Anthropic.RateLimitError) msg = "IA ocupada no momento. Tente de novo em alguns segundos.";
    else if (e instanceof Anthropic.APIError) msg = `IA indisponível (${e.status})`;
    if (!res.headersSent) json(res, 500, { erro: msg }); else res.end();
  });
}).listen(CFG.porta, () => {
  console.log(`Copiloto Weiss rodando na porta ${CFG.porta}`);
  console.log(`  Kommo: ${kommoOk() ? "✓" : "não configurado"} · IA: ${anthropic ? "✓ " + CFG.modelo : "não configurada"} · Áudio: ${CFG.openaiKey ? "✓" : "não configurado"} · WhatsApp ao vivo: ${CFG.kommoChaveWebhook ? "✓" : "não configurado"}`);
});
