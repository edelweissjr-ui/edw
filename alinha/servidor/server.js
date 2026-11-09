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
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(here, "..");              // alinha/
const ASSETS_DIR = path.resolve(APP_DIR, "../assets");   // logotipo do site

const env = process.env;
const CFG = {
  porta: Number(env.PORT || 3000),
  senha: env.SENHA_ACESSO || "",
  segredo: env.SEGREDO_SESSAO || crypto.randomBytes(32).toString("hex"),
  kommoSub: env.KOMMO_SUBDOMINIO || "",
  kommoBase: env.KOMMO_URL_BASE || "",
  kommoToken: env.KOMMO_TOKEN || "",
  kommoStatus: { negociacao: null, fechado: 142, perdido: 143 },
  kommoResponsavel: env.KOMMO_RESPONSAVEL_ID ? Number(env.KOMMO_RESPONSAVEL_ID) : null,
  anthropicKey: env.ANTHROPIC_API_KEY || "",
  modelo: env.MODELO_IA || "claude-opus-5-5",
  dados: env.PASTA_DADOS || path.join(APP_DIR, "dados")
};
if (!CFG.senha) console.warn("⚠️  SENHA_ACESSO não definida: defina antes de publicar.");
const anthropic = CFG.anthropicKey ? new Anthropic({ apiKey: CFG.anthropicKey }) : null;

/* ------------------------------------------------------------------ */
/* dados (arquivo JSON na pasta de dados)                              */
/* ------------------------------------------------------------------ */
fs.mkdirSync(CFG.dados, { recursive: true });
const ARQ_DB = path.join(CFG.dados, "alinha.json");
let DB = { pacientes: [], ajustes: {} };
try { DB = { ...DB, ...JSON.parse(fs.readFileSync(ARQ_DB, "utf8")) }; } catch { /* primeiro uso */ }
let salvarTimer = null;
function salvarDB() {
  clearTimeout(salvarTimer);
  salvarTimer = setTimeout(() => {
    const tmp = ARQ_DB + ".tmp";
    fs.writeFile(tmp, JSON.stringify(DB), (err) => { if (!err) fs.rename(tmp, ARQ_DB, () => {}); });
  }, 300);
}
// ajustes de funil usados pelo bloco do Kommo
const AJ = new Proxy({}, { get: (_, k) => (DB.ajustes || {})[k] ?? ({ etapaPerdido: 143, etapaClientePerdido: 143, etiquetaHumano: "Atendimento humano" })[k] ?? null });

/* ------------------------------------------------------------------ */
/* utilidades HTTP e sessão                                            */
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


const assinar = (v) => crypto.createHmac("sha256", CFG.segredo).update(v).digest("hex");
function cookieSessao() {
  const exp = Date.now() + 12 * 3600 * 1000; // 12 horas
  return `${exp}.${assinar(String(exp))}`;
}
function sessaoValida(req) {
  const m = (req.headers.cookie || "").match(/(?:^|;\s*)alinha=([^;]+)/);
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
<title>Alinha</title><style>
:root{--bg:#0A0A1C;--card:#13122B;--fg:#EEEDFF;--dim:#ADAAD8;--accent:#7C6CF6;--line:rgba(167,158,255,.18);--bad:#FF7A72;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg) radial-gradient(900px 500px at 70% -10%,rgba(124,108,246,.25),transparent 60%);color:var(--fg);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:16px}
form{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:30px;width:100%;max-width:360px;display:grid;gap:12px}
.logo{font-weight:800;font-size:26px;letter-spacing:-.02em}.logo b{color:var(--accent)}p{margin:0;color:var(--dim);font-size:14px}
input{font:inherit;color:inherit;padding:11px 12px;border:1px solid var(--line);border-radius:10px;background:var(--bg)}
button{font:inherit;font-weight:700;padding:12px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}.err{color:var(--bad);font-weight:600}
</style></head><body><form method="post" action="login">
<div class="logo">alinha<b>.</b></div><p>Weiss Odontologia · do diagnóstico ao fechamento</p>
${erro ? `<p class="err">${erro}</p>` : ""}
<label for="senha" style="font-size:13px;font-weight:600">Senha da equipe</label>
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

async function chamarIA({ sistema, prompt, esforco = "low" }) {
  const resp = await anthropic.beta.messages.create({
    model: CFG.modelo,
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

const MOMENTOS = ["Acolhimento", "Investigação", "Diagnóstico", "Apresentação", "Negociação", "Fechamento"];

function promptDica(b) {
  return {
    sistema: `Você é o Alinha, copiloto que acompanha AO VIVO uma consulta de Ortodontia da ${CLINICA}
Você lê o trecho mais recente da conversa e decide se o profissional precisa de uma dica AGORA. A dica aparece na tela por poucos segundos, então ela tem de ser lida num relance.
- Dica: 1 ou 2 frases curtas, no imperativo, específicas para o que o paciente acabou de dizer (ex.: "Segure o desconto. Descubra com o que ela está comparando e traduza o valor em parcela mensal.").
- Se não houver nada importante a dizer, responda com "dica": "".
- Momentos possíveis: ${MOMENTOS.join(", ")}.
Responda SOMENTE com JSON: {"momento": "...", "tipo": "objecao|sinal_compra|oportunidade|alerta", "rotulo": "2 a 4 palavras, ex.: Objeção de preço", "dica": "...", "citacao": "a frase do paciente que motivou a dica, literal e curta", "prontidao": número de 0 a 100 indicando o quanto o paciente está pronto para fechar agora (desejo, sinais de compra, objeções pendentes, decisor presente)}`,
    prompt: `Momento atual na tela: ${b.momento || "Acolhimento"}
Dicas já mostradas (não repita): ${(b.ja_mostradas || []).join(" | ") || "nenhuma"}

CONVERSA ATÉ AGORA (o final é o mais recente):
${fmtTranscricao((b.transcricao || []).slice(-40))}`
  };
}

function promptBriefing(b) {
  return {
    sistema: `Você é o Alinha, copiloto comercial da ${CLINICA}
Você recebe a transcrição de uma consulta que acabou de terminar e produz o BRIEFING para o profissional e a equipe comercial. Seja concreto, use as palavras do paciente, e não invente números: use somente valores ditos na conversa.
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
 "nota": número de 0 a 10
}`,
    prompt: `Profissional: ${b.profissional || "-"} · Unidade: ${b.unidade || "-"} · Duração: ${b.duracao_min || "?"} min
Anotações do profissional: ${b.notas || "-"}

TRANSCRIÇÃO:
${fmtTranscricao(b.transcricao) || "(vazia)"}`,
    esforco: "medium"
  };
}

function promptMensagem(b) {
  const p = b.paciente || {};
  return {
    sistema: `Você é o Alinha, copiloto comercial da ${CLINICA}
Escreva UMA mensagem de WhatsApp de follow-up para um paciente que fez consulta e ainda não fechou (ou fechou e falta um passo). A mensagem deve:
- usar as palavras do próprio paciente quando possível (dor, desejo, evento);
- tratar a objeção dele de forma leve, sem pressão;
- ser curta (até 4 linhas), calorosa, no máximo 1 emoji, terminar com uma pergunta fácil de responder;
- respeitar o momento da cadência: D0 = resumo do plano no mesmo dia; D1 = tirar dúvidas; D3 = reforçar valor (simulação, vídeo do dentista, caso parecido); D7 = pergunta direta sobre o que impede; D15 = porta aberta / condição real se houver; D30 = encerramento gentil.
Não invente desconto, prazo ou condição. Responda SOMENTE com JSON: {"mensagem": "..."}`,
    prompt: `Toque: ${b.toque} (D${b.dia})
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
  if (p.startsWith("/assets/")) return servirArquivo(res, ASSETS_DIR, p.slice("/assets/".length));

  if (p === "/login" && req.method === "POST") {
    if (bloqueado(ip)) { res.writeHead(429, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Muitas tentativas. Aguarde 15 minutos.")); }
    const senha = new URLSearchParams((await lerCorpo(req)).toString("utf8")).get("senha") || "";
    const ok = CFG.senha && senha.length === CFG.senha.length && crypto.timingSafeEqual(Buffer.from(senha), Buffer.from(CFG.senha));
    if (!ok) { falhou(ip); res.writeHead(401, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin("Senha incorreta.")); }
    tentativas.delete(ip);
    res.writeHead(303, { Location: "./", "Set-Cookie": `alinha=${encodeURIComponent(cookieSessao())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${ehHttps(req) ? "; Secure" : ""}` });
    return res.end();
  }
  if (p === "/sair") { res.writeHead(303, { Location: "login", "Set-Cookie": "alinha=; Path=/; Max-Age=0" }); return res.end(); }
  if (p === "/login") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(paginaLogin()); }

  if (!sessaoValida(req)) {
    if (p.startsWith("/api/")) return json(res, 401, { erro: "Sessão expirada. Entre novamente." });
    res.writeHead(303, { Location: "login" }); return res.end();
  }

  if (p === "/api/config" && req.method === "GET") return json(res, 200, { plataforma: true, ia: !!anthropic, kommo: kommoOk() });

  // pacientes (follow-up)
  if (p === "/api/pacientes" && req.method === "GET") return json(res, 200, { ok: true, pacientes: DB.pacientes });
  if (p === "/api/pacientes" && req.method === "POST") {
    const b = await lerJSON(req);
    if (!b.id) b.id = "p" + Date.now().toString(36) + crypto.randomBytes(2).toString("hex");
    const i = DB.pacientes.findIndex((x) => x.id === b.id);
    if (i >= 0) DB.pacientes[i] = b; else DB.pacientes.push(b);
    salvarDB();
    return json(res, 200, { ok: true, paciente: b });
  }
  if (p.startsWith("/api/pacientes/") && req.method === "DELETE") {
    const id = decodeURIComponent(p.split("/").pop());
    DB.pacientes = DB.pacientes.filter((x) => x.id !== id); salvarDB();
    return json(res, 200, { ok: true });
  }
  if (p === "/api/ajustes" && req.method === "GET") return json(res, 200, { ok: true, ajustes: DB.ajustes || {} });
  if (p === "/api/ajustes" && req.method === "POST") { DB.ajustes = { ...(DB.ajustes || {}), ...(await lerJSON(req)) }; salvarDB(); return json(res, 200, { ok: true, ajustes: DB.ajustes }); }

  // IA
  if (p.startsWith("/api/ia/") && req.method === "POST") {
    if (!anthropic) return json(res, 503, { erro: "IA não configurada (ANTHROPIC_API_KEY)" });
    const b = await lerJSON(req);
    const tipo = p.split("/").pop();
    const montar = { dica: promptDica, briefing: promptBriefing, mensagem: promptMensagem }[tipo];
    if (!montar) return json(res, 404, { erro: "Não encontrado" });
    return json(res, 200, { ok: true, ...(await chamarIA(montar(b))) });
  }

  // Kommo (opcional): registra o briefing no lead
  if (p === "/api/kommo/registrar" && req.method === "POST") {
    if (!kommoOk()) return json(res, 503, { erro: "Kommo não configurado" });
    const leadId = await registrarNoKommo(await lerJSON(req));
    return json(res, 200, { ok: true, lead_id: leadId });
  }

  const arq = p === "/" ? "index.html" : p.slice(1);
  if (["index.html", "app.js", "biblioteca.js", "demo.js"].includes(arq)) return servirArquivo(res, APP_DIR, arq);
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
  console.log(`Alinha rodando na porta ${CFG.porta} · IA: ${anthropic ? "✓ " + CFG.modelo : "não configurada"} · Kommo: ${kommoOk() ? "✓" : "não configurado"}`);
});
