/* Kinesis · servidor (Vercel)
   Login por e-mail e senha, sessões assinadas em cookie HttpOnly, dados no Upstash Redis (REST),
   permissões por setor e limite da licença aplicados aqui no servidor, KIN, a inteligência artificial clínica (Claude ou OpenAI). */
import crypto from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";

const RURL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const RTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
/* Cada sistema hospedado tem o próprio espaço de dados. Mesmo que dois projetos sejam ligados
   ao mesmo banco por engano, as chaves de um nunca se misturam com as do outro. */
const INSTANCIA = String(process.env.KINESIS_INSTANCIA || process.env.VERCEL_PROJECT_ID || "local").replace(/[^\w-]/g, "").slice(0, 60) || "local";
const P = "kin:" + INSTANCIA + ":";
const SESSAO_DIAS = 30;

const COLS = new Set(["pacientes", "agenda", "registros", "financeiro", "chat", "estoque", "movest", "guias", "pesquisas", "modelos", "espera", "bloqueios", "notas", "auditoria", "leads", "faturas", "config", "licenca"]);
const COL_MOD = { pacientes: "pacientes", agenda: "agenda", espera: "agenda", bloqueios: "agenda", notas: "agenda", registros: "prontuario", modelos: "modelos", chat: "chat", leads: "crm", financeiro: "financeiro", estoque: "estoque", movest: "estoque", guias: "tiss", pesquisas: "satisfacao", faturas: "ajustes" };
const PERM_PAD = {
  fisio: { inicio: 2, agenda: 2, pacientes: 2, prontuario: 2, modelos: 2, chat: 2, crm: 0, financeiro: 0, relatorios: 0, estoque: 1, tiss: 1, satisfacao: 1, ia: 2, migracao: 0, auditoria: 0, ajustes: 0 },
  financeiro: { inicio: 1, agenda: 1, pacientes: 1, prontuario: 0, modelos: 0, chat: 2, crm: 1, financeiro: 2, relatorios: 2, estoque: 1, tiss: 2, satisfacao: 1, ia: 0, migracao: 0, auditoria: 1, ajustes: 0 },
  comercial: { inicio: 1, agenda: 2, pacientes: 2, prontuario: 0, modelos: 0, chat: 2, crm: 2, financeiro: 1, relatorios: 1, estoque: 0, tiss: 0, satisfacao: 2, ia: 0, migracao: 0, auditoria: 0, ajustes: 0 },
  estoque: { inicio: 1, agenda: 0, pacientes: 0, prontuario: 0, modelos: 0, chat: 2, crm: 0, financeiro: 0, relatorios: 0, estoque: 2, tiss: 0, satisfacao: 0, ia: 0, migracao: 0, auditoria: 0, ajustes: 0 },
  recepcao: { inicio: 2, agenda: 2, pacientes: 2, prontuario: 0, modelos: 0, chat: 2, crm: 1, financeiro: 2, relatorios: 0, estoque: 1, tiss: 1, satisfacao: 2, ia: 0, migracao: 0, auditoria: 0, ajustes: 0 },
  crc: { inicio: 1, agenda: 2, pacientes: 2, prontuario: 0, modelos: 0, chat: 2, crm: 2, financeiro: 0, relatorios: 1, estoque: 0, tiss: 0, satisfacao: 2, ia: 0, migracao: 0, auditoria: 0, ajustes: 0 },
};
/* Planos: módulos bloqueados e cota mensal da KIN (o titular pode ajustar preço, usuários e cota). */
const PLANOS_PAD = {
  essencial: { usuarios: 2, kinMes: 100, kinInstr: false, bloq: ["crm", "estoque", "tiss", "satisfacao", "auditoria"] },
  profissional: { usuarios: 5, kinMes: 600, kinInstr: false, bloq: ["auditoria"] },
  completo: { usuarios: 10, kinMes: 2000, kinInstr: true, bloq: [] },
};
const PLANO_ANT = { solo: "essencial", clinica: "profissional", clinicaplus: "completo", rede: "completo" };
function planoDe(l) {
  l = l || {};
  const lista = Array.isArray(l.planos) && l.planos.some((x) => x && x.kinMes !== undefined) ? l.planos : null;
  const id = lista ? l.plano : PLANO_ANT[l.plano] || l.plano || "profissional";
  const salvo = lista ? lista.find((x) => x && x.id === id) : null, pad = PLANOS_PAD[id] || PLANOS_PAD.profissional;
  return { id, kinMes: Number(salvo && salvo.kinMes !== undefined ? salvo.kinMes : pad.kinMes) || 0, kinInstr: salvo && salvo.kinInstr !== undefined ? !!salvo.kinInstr : pad.kinInstr, bloq: (salvo && Array.isArray(salvo.bloq) ? salvo.bloq : pad.bloq).map(String) };
}
const PAPEIS = new Set(["admin", "fisio", "financeiro", "comercial", "estoque", "recepcao", "crc"]);

/* ---------- Upstash Redis (REST) ---------- */
async function cmd(...a) {
  const r = await fetch(RURL, { method: "POST", headers: { Authorization: `Bearer ${RTOK}`, "Content-Type": "application/json" }, body: JSON.stringify(a) });
  const j = await r.json();
  if (j.error) throw new Error("redis: " + j.error);
  return j.result;
}
const pares = (arr) => { const o = {}; for (let i = 0; i < (arr || []).length; i += 2) o[arr[i]] = arr[i + 1]; return o; };

/* ---------- utilidades HTTP ---------- */
const enviar = (res, code, obj) => { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); };
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").map((c) => c.trim()).filter(Boolean).map((c) => { const i = c.indexOf("="); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))]; }));
const cookie = (res, v, maxAge) => res.setHeader("Set-Cookie", `kin_s=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
const hoje = () => new Date().toISOString().slice(0, 10);
const addDias = (d, n) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const idOk = (s) => /^[\w.:@+-]{1,120}$/.test(String(s || ""));
const emailOk = (s) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(String(s || ""));
const novoId = () => Date.now().toString(36) + crypto.randomBytes(4).toString("hex");

/* ---------- segredo e sessões ---------- */
let SEGREDO = process.env.KINESIS_SECRET || "";
async function segredo() {
  if (SEGREDO) return SEGREDO;
  let s = await cmd("GET", P + "secret");
  if (!s) { await cmd("SET", P + "secret", crypto.randomBytes(32).toString("hex"), "NX"); s = await cmd("GET", P + "secret"); }
  return (SEGREDO = s);
}
const hmac = async (txt) => crypto.createHmac("sha256", await segredo()).update(txt).digest("base64url");
async function assinar(obj) { const p = Buffer.from(JSON.stringify(obj)).toString("base64url"); return p + "." + (await hmac(p)); }
async function lerToken(t) {
  if (!t || !t.includes(".")) return null;
  const [p, s] = t.split("."), esperado = await hmac(p);
  if (!s || s.length !== esperado.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(esperado))) return null;
  try { const o = JSON.parse(Buffer.from(p, "base64url").toString()); return o.exp > Date.now() ? o : null; } catch { return null; }
}
const hashSenha = (senha) => { const sal = crypto.randomBytes(16); return "s1$" + sal.toString("hex") + "$" + crypto.scryptSync(senha, sal, 64).toString("hex"); };
const confereSenha = (senha, h) => { try { const [, sal, dig] = String(h).split("$"); const x = crypto.scryptSync(senha, Buffer.from(sal, "hex"), 64); return crypto.timingSafeEqual(x, Buffer.from(dig, "hex")); } catch { return false; } };

/* ---------- usuários ---------- */
async function todosUsuarios() { return Object.values(pares(await cmd("HGETALL", P + "users"))).map((v) => JSON.parse(v)); }
async function usuario(id) { const v = await cmd("HGET", P + "users", id); return v ? JSON.parse(v) : null; }
async function gravarUsuario(u) { await cmd("HSET", P + "users", u.id, JSON.stringify(u)); if (u.email) await cmd("SET", P + "email:" + u.email, u.id); await cmd("HINCRBY", P + "v", "usuarios", 1); }
const publico = (u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.owner ? "admin" : u.papel, owner: !!u.owner, profId: u.profId || "" });
async function sessaoUsuario(req) {
  const t = await lerToken(cookies(req).kin_s); if (!t) return null;
  const u = await usuario(t.u); if (!u || u.ativo === false || (u.sv || 0) !== (t.sv || 0)) return null;
  return u;
}
async function abrirSessao(res, u) { cookie(res, await assinar({ u: u.id, sv: u.sv || 0, exp: Date.now() + SESSAO_DIAS * 864e5 }), SESSAO_DIAS * 86400); }
async function limiteTentativas(chave, max, segundos) { const n = await cmd("INCR", P + "rl:" + chave); if (n === 1) await cmd("EXPIRE", P + "rl:" + chave, segundos); return n > max; }

/* ---------- permissões ---------- */
async function lerDoc(col, id) { const v = await cmd("HGET", P + "c:" + col, id); return v ? JSON.parse(v) : null; }
const cfgClinica = async () => { const c = (await lerDoc("config", "clinica")) || {}; Object.defineProperty(c, "_lic", { value: await licenca(), enumerable: false }); return c; };
const licenca = async () => (await lerDoc("licenca", "atual")) || { limite: 5 };
function nivel(u, cfg, mod) {
  if (u.owner) return 2;
  if (planoDe(cfg._lic).bloq.includes(mod)) return 0;
  if (u.papel === "admin") return 2;
  const v = ((cfg.permissoes || {})[u.papel] || {})[mod];
  return v ?? ((PERM_PAD[u.papel] || {})[mod] || 0);
}
const vencida = (l) => !!l.vencimento && hoje() > addDias(l.vencimento, Number(l.tolerancia || 0));
async function podeLer(u, col, cfg) {
  if (col === "config" || col === "licenca") return true;
  if (col === "auditoria") return nivel(u, cfg, "auditoria") >= 1;
  return nivel(u, cfg, COL_MOD[col] || "ajustes") >= 1;
}
async function podeGravar(u, col, id, apagar) {
  const cfg = await cfgClinica();
  if (!u.owner) { const l = await licenca(); if (l.bloquearVencida && vencida(l)) return "A assinatura está vencida. O sistema está em modo leitura até a regularização."; }
  if (col === "licenca" || col === "faturas") return u.owner ? null : "Só o titular da conta altera a licença e as faturas.";
  if (col === "config") return nivel(u, cfg, "ajustes") >= 2 ? null : "Só administradores alteram as configurações.";
  if (col === "auditoria") { if (apagar && !u.owner) return "A auditoria não pode ser apagada."; if (!apagar && !u.owner && (await lerDoc(col, id))) return "Registros de auditoria não podem ser alterados."; return null; }
  if (col === "chat") {
    if (nivel(u, cfg, "chat") < 2) return "Seu perfil não pode usar o chat.";
    if (apagar && !(u.owner || u.papel === "admin")) { const d = await lerDoc(col, id); if (d && d.autorId !== u.id) return "Você só pode apagar as próprias mensagens."; }
    return null;
  }
  const mod = COL_MOD[col];
  return mod && nivel(u, cfg, mod) >= 2 ? null : "Seu perfil não tem permissão para alterar esta área.";
}

/* ---------- rotas ---------- */
async function rotaEstado(req, res) {
  const u = await sessaoUsuario(req), n = Number(await cmd("HLEN", P + "users")) || 0;
  const ia = await iaDisponivel();
  enviar(res, 200, { redis: true, setup: n === 0, user: u ? publico(u) : null, ia: ia.ok, iaProvedor: ia.provedor, asaas: u ? await asaasOk() : false });
}
async function rotaSetup(req, res, b) {
  if ((Number(await cmd("HLEN", P + "users")) || 0) > 0) return enviar(res, 409, { erro: "O sistema já foi configurado. Entre com seu e-mail e senha." });
  const nome = String(b.nome || "").trim().slice(0, 80), email = String(b.email || "").trim().toLowerCase(), senha = String(b.senha || "");
  if (!nome || !emailOk(email)) return enviar(res, 400, { erro: "Informe nome e um e-mail válido." });
  if (senha.length < 8) return enviar(res, 400, { erro: "A senha precisa ter pelo menos 8 caracteres." });
  const ok = await cmd("SET", P + "setup-lock", "1", "NX", "EX", 60); if (!ok) return enviar(res, 409, { erro: "Configuração em andamento. Tente de novo em instantes." });
  const u = { id: novoId(), nome, email, senha: hashSenha(senha), papel: "admin", owner: true, ativo: true, sv: 0, criadoEm: new Date().toISOString() };
  await gravarUsuario(u);
  const clinica = String(b.clinica || "").trim().slice(0, 100);
  if (clinica) { const c = await cfgClinica(); c.clinica = Object.assign({}, c.clinica, { nome: clinica }); await cmd("HSET", P + "c:config", "clinica", JSON.stringify(Object.assign(c, { id: "clinica" }))); await cmd("HINCRBY", P + "v", "config", 1); }
  await abrirSessao(res, u); enviar(res, 200, { ok: true, user: publico(u) });
}
async function rotaLogin(req, res, b) {
  const email = String(b.email || "").trim().toLowerCase(), senha = String(b.senha || "");
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "ip";
  if ((await limiteTentativas("login:" + email, 8, 900)) || (await limiteTentativas("ip:" + ip, 40, 900))) return enviar(res, 429, { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo." });
  const id = emailOk(email) ? await cmd("GET", P + "email:" + email) : null, u = id ? await usuario(id) : null;
  if (!u || !confereSenha(senha, u.senha)) return enviar(res, 401, { erro: "E-mail ou senha incorretos." });
  if (u.ativo === false) return enviar(res, 403, { erro: "Seu acesso está desativado. Fale com o administrador da clínica." });
  await cmd("DEL", P + "rl:login:" + email);
  u.ultimoAcesso = new Date().toISOString(); await cmd("HSET", P + "users", u.id, JSON.stringify(u));
  await abrirSessao(res, u); enviar(res, 200, { ok: true, user: publico(u) });
}
async function rotaSenha(req, res, b, u) {
  if (!confereSenha(String(b.atual || ""), u.senha)) return enviar(res, 400, { erro: "A senha atual não confere." });
  const nova = String(b.nova || ""); if (nova.length < 8) return enviar(res, 400, { erro: "A nova senha precisa ter pelo menos 8 caracteres." });
  u.senha = hashSenha(nova); u.sv = (u.sv || 0) + 1; await gravarUsuario(u); await abrirSessao(res, u); enviar(res, 200, { ok: true });
}
async function listarColecao(req, res, col, u) {
  const cfg = await cfgClinica();
  if (col === "usuarios") {
    const adm = nivel(u, cfg, "ajustes") >= 2;
    const L = (await todosUsuarios()).filter((x) => !x.owner).map((x) => ({ id: x.id, accountId: x.id, nome: x.nome, email: adm || x.id === u.id ? x.email : undefined, papel: x.papel, profId: x.profId || "", ativo: x.ativo !== false, ultimoAcesso: adm ? x.ultimoAcesso || "" : undefined }));
    return enviar(res, 200, L);
  }
  if (!COLS.has(col)) return enviar(res, 404, { erro: "Coleção desconhecida." });
  if (!(await podeLer(u, col, cfg))) return enviar(res, 200, []);
  enviar(res, 200, Object.values(pares(await cmd("HGETALL", P + "c:" + col))).map((v) => JSON.parse(v)));
}
async function gravarUsuarioRota(res, id, b, u) {
  const cfg = await cfgClinica();
  if (nivel(u, cfg, "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores cadastram usuários." });
  const d = b.data || {}, atual = await usuario(id);
  if (atual && atual.owner) return enviar(res, 403, { erro: "O titular é alterado em Segurança da conta." });
  const email = String(d.email || (atual && atual.email) || "").trim().toLowerCase(), senha = String(d.senha || "");
  if (!emailOk(email)) return enviar(res, 400, { erro: "Informe um e-mail de acesso válido." });
  const outro = await cmd("GET", P + "email:" + email); if (outro && outro !== id) return enviar(res, 409, { erro: "Este e-mail já está em uso por outro usuário." });
  if (!atual && senha.length < 8) return enviar(res, 400, { erro: "A senha inicial precisa ter pelo menos 8 caracteres." });
  if (senha && senha.length < 8) return enviar(res, 400, { erro: "A nova senha precisa ter pelo menos 8 caracteres." });
  const ativo = d.ativo !== false;
  if (ativo && (!atual || atual.ativo === false)) {
    const l = await licenca(), usados = 1 + (await todosUsuarios()).filter((x) => !x.owner && x.ativo !== false).length;
    if (usados >= Number(l.limite || 5)) return enviar(res, 403, { erro: `Limite do plano atingido (${l.limite || 5} usuários). O titular pode liberar mais usuários em Plano e licenças.` });
  }
  const papel = PAPEIS.has(d.papel) ? d.papel : "recepcao";
  const novo = Object.assign({ id, criadoEm: new Date().toISOString(), sv: 0 }, atual || {}, { nome: String(d.nome || email).trim().slice(0, 80), email, papel, profId: idOk(d.profId) ? d.profId : "", ativo });
  if (senha) { novo.senha = hashSenha(senha); novo.sv = (novo.sv || 0) + 1; }
  if (atual && atual.email && atual.email !== email) await cmd("DEL", P + "email:" + atual.email);
  if (atual && atual.ativo !== false && !ativo) novo.sv = (novo.sv || 0) + 1;
  await gravarUsuario(novo); enviar(res, 200, { ok: true });
}
async function apagarUsuario(res, id, u) {
  const cfg = await cfgClinica();
  if (nivel(u, cfg, "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores removem usuários." });
  const x = await usuario(id); if (!x) return enviar(res, 200, { ok: true });
  if (x.owner) return enviar(res, 403, { erro: "O titular não pode ser removido." });
  await cmd("HDEL", P + "users", id); if (x.email) await cmd("DEL", P + "email:" + x.email); await cmd("HINCRBY", P + "v", "usuarios", 1);
  enviar(res, 200, { ok: true });
}
async function gravarDoc(res, col, id, b, u) {
  if (col === "usuarios") return gravarUsuarioRota(res, id, b, u);
  if (!COLS.has(col) || !idOk(id)) return enviar(res, 400, { erro: "Endereço inválido." });
  const d = b.data; if (!d || typeof d !== "object" || Array.isArray(d)) return enviar(res, 400, { erro: "Dados inválidos." });
  if (col === "chat" || col === "auditoria") d.autorId = u.id;
  const txt = JSON.stringify(Object.assign({}, d, { id })); if (txt.length > 900000) return enviar(res, 413, { erro: "Registro grande demais (limite de 900 KB)." });
  const erro = await podeGravar(u, col, id, false); if (erro) return enviar(res, 403, { erro });
  await cmd("HSET", P + "c:" + col, id, txt);
  enviar(res, 200, { ok: true, v: Number(await cmd("HINCRBY", P + "v", col, 1)) });
}
async function apagarDoc(res, col, id, u) {
  if (col === "usuarios") return apagarUsuario(res, id, u);
  if (!COLS.has(col) || !idOk(id)) return enviar(res, 400, { erro: "Endereço inválido." });
  const erro = await podeGravar(u, col, id, true); if (erro) return enviar(res, 403, { erro });
  await cmd("HDEL", P + "c:" + col, id);
  enviar(res, 200, { ok: true, v: Number(await cmd("HINCRBY", P + "v", col, 1)) });
}
/* ---------- KIN: inteligência artificial (Anthropic Claude ou OpenAI) ---------- */
const IA_SISTEMA = "Você é a KIN, a inteligência artificial clínica do Kinesis, sistema de gestão usado por clínicas de fisioterapia no Brasil. Responda em português do Brasil, de forma objetiva e prática, para fisioterapeutas. Baseie-se em evidências e diretrizes atuais, diga quando a evidência é fraca ou controversa e lembre que a decisão clínica é do profissional. Não invente referências.";
const PROVEDORES = {
  anthropic: { nome: "Anthropic · Claude", modelo: "claude-opus-5-5", env: "ANTHROPIC_API_KEY" },
  openai: { nome: "OpenAI · ChatGPT", modelo: "gpt-5", env: "OPENAI_API_KEY" },
};
const OPENAI_URL = (process.env.KINESIS_OPENAI_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const modeloOk = (s) => /^[\w.:-]{1,80}$/.test(String(s || ""));

/* As chaves de API ficam cifradas no banco (AES-256-GCM) e nunca voltam para o navegador. */
async function chaveCripto() { return crypto.createHash("sha256").update((await segredo()) + ":kin-ia").digest(); }
async function cifrar(txt) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", await chaveCripto(), iv);
  const ct = Buffer.concat([c.update(txt, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), ct].map((x) => x.toString("base64url")).join(".");
}
async function decifrar(s) {
  try { const [iv, tag, ct] = String(s).split(".").map((x) => Buffer.from(x, "base64url")); const d = crypto.createDecipheriv("aes-256-gcm", await chaveCripto(), iv); d.setAuthTag(tag); return Buffer.concat([d.update(ct), d.final()]).toString("utf8"); }
  catch { return ""; }
}
async function iaCfg() {
  const v = await cmd("GET", P + "iacfg"); const c = v ? JSON.parse(v) : {};
  return { ativo: c.ativo !== false, provedor: PROVEDORES[c.provedor] ? c.provedor : "anthropic", modelos: c.modelos || {}, instrucoes: c.instrucoes || "", limite: Number(c.limite) || 40, chaves: c.chaves || {}, finais: c.finais || {} };
}
async function chaveDe(c, prov) { return (c.chaves[prov] && (await decifrar(c.chaves[prov]))) || process.env[PROVEDORES[prov].env] || ""; }
const modeloDe = (c, prov) => (modeloOk(c.modelos[prov]) && c.modelos[prov]) || (prov === "anthropic" && process.env.KINESIS_MODELO) || PROVEDORES[prov].modelo;
async function iaDisponivel() { const c = await iaCfg(); return { ok: c.ativo && !!(await chaveDe(c, c.provedor)), provedor: c.provedor }; }
const erroIA = (e) => {
  const s = e && (e.status || e.statusCode);
  if (s === 401 || s === 403) return "A chave da API foi recusada pelo provedor. Confira a chave nas configurações da KIN.";
  if (s === 404) return "O modelo escolhido não foi encontrado nessa conta. Confira o nome do modelo.";
  if (s === 429) return "O provedor recusou por limite de uso ou falta de créditos. Aguarde um pouco ou confira o saldo da conta.";
  return "Não foi possível falar com o provedor de IA" + (e && e.message ? ": " + String(e.message).slice(0, 160) : ".");
};

async function gerarAnthropic({ chave, modelo, system, messages, onText }) {
  const client = new Anthropic({ apiKey: chave });
  const extra = modelo === "claude-opus-5-5" ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {};
  const stream = client.beta.messages.stream(Object.assign({ model: modelo, max_tokens: 16000, system, output_config: { effort: "medium" }, messages }, extra));
  stream.on("text", onText);
  const msg = await stream.finalMessage();
  return msg.stop_reason === "refusal" ? "recusa" : msg.stop_reason === "max_tokens" ? "limite" : "ok";
}
async function gerarOpenAI({ chave, modelo, system, messages, onText }) {
  const r = await fetch(OPENAI_URL + "/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + chave, "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelo, stream: true, max_completion_tokens: 16000, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error((j.error && j.error.message) || "HTTP " + r.status); e.status = r.status; throw e; }
  const dec = new TextDecoder(); let buf = "", fim = "ok";
  for await (const parte of r.body) {
    buf += dec.decode(parte, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const linha = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
      if (!linha.startsWith("data:")) continue;
      const dado = linha.slice(5).trim(); if (dado === "[DONE]") continue;
      try {
        const j = JSON.parse(dado), ch = j.choices && j.choices[0];
        if (ch && ch.delta && ch.delta.content) onText(ch.delta.content);
        if (ch && ch.finish_reason === "length") fim = "limite";
        if (ch && ch.finish_reason === "content_filter") fim = "recusa";
      } catch { /* linha incompleta */ }
    }
  }
  return fim;
}
async function testarProvedor(prov, chave, modelo) {
  if (prov === "openai") {
    const r = await fetch(OPENAI_URL + "/models/" + encodeURIComponent(modelo), { headers: { Authorization: "Bearer " + chave } });
    if (!r.ok) { const j = await r.json().catch(() => ({})); const e = new Error((j.error && j.error.message) || "HTTP " + r.status); e.status = r.status; throw e; }
    return;
  }
  await new Anthropic({ apiKey: chave }).models.retrieve(modelo);
}

async function rotaIA(req, res, b, u) {
  const c = await iaCfg(), prov = c.provedor, chave = c.ativo ? await chaveDe(c, prov) : "";
  if (!chave) return enviar(res, 503, { erro: "A KIN (inteligência artificial) não está configurada neste servidor." });
  const cfg = await cfgClinica(); if (nivel(u, cfg, "ia") < 1) return enviar(res, 403, { erro: "Seu perfil não usa a KIN." });
  const hora = new Date().toISOString().slice(0, 13); if (await limiteTentativas("ia:" + u.id + ":" + hora, c.limite, 3700)) return enviar(res, 429, { erro: "Limite de perguntas por hora atingido. Tente mais tarde." });
  const pl = planoDe(cfg._lic), mes = new Date().toISOString().slice(0, 7);
  if (!u.owner) {
    const n = Number(await cmd("INCR", P + "iames:" + mes)); if (n === 1) await cmd("EXPIRE", P + "iames:" + mes, 40 * 86400);
    if (n > pl.kinMes) return enviar(res, 429, { erro: `A cota da KIN deste mês acabou (${pl.kinMes} perguntas no plano atual). Ela renova no dia 1º. Para ampliar, fale com o titular sobre mudar de plano.` });
  }
  const entrada = b.input;
  const messages = typeof entrada === "string" ? [{ role: "user", content: entrada.slice(0, 60000) }] : Array.isArray(entrada) ? entrada.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content).slice(-30).map((m) => ({ role: m.role, content: m.content.slice(0, 60000) })) : [];
  if (!messages.length || messages[messages.length - 1].role !== "user") return enviar(res, 400, { erro: "Pergunta vazia." });
  const system = IA_SISTEMA + (c.instrucoes && pl.kinInstr ? "\n\nOrientações da clínica: " + c.instrucoes : "");
  res.statusCode = 200; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.setHeader("Cache-Control", "no-store");
  try {
    const fim = await (prov === "openai" ? gerarOpenAI : gerarAnthropic)({ chave, modelo: modeloDe(c, prov), system, messages, onText: (t) => res.write(t) });
    if (fim === "recusa") res.write("\n\n[A KIN não pôde responder a esta pergunta. Reformule com mais contexto clínico.]");
    else if (fim === "limite") res.write("\n\n[Resposta interrompida pelo limite de tamanho.]");
  } catch (e) {
    console.error("IA:", prov, e && e.status, e && e.message);
    res.write("\n\n[" + erroIA(e) + "]");
  }
  res.end();
}
async function iaConfigPublica(c) {
  const chaves = {};
  for (const p of Object.keys(PROVEDORES)) chaves[p] = { salva: !!c.chaves[p], final: c.finais[p] || "", env: !!process.env[PROVEDORES[p].env] };
  const modelos = {}; for (const p of Object.keys(PROVEDORES)) modelos[p] = modeloDe(c, p);
  const pl = planoDe(await licenca());
  return { ativo: c.ativo, provedor: c.provedor, modelos, instrucoes: c.instrucoes, kinInstr: pl.kinInstr, limite: c.limite, chaves, disponivel: c.ativo && !!(await chaveDe(c, c.provedor)) };
}
async function rotaIAConfig(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores configuram a KIN." });
  const c = await iaCfg();
  if (req.method === "GET") return enviar(res, 200, await iaConfigPublica(c));
  const prov = PROVEDORES[b.provedor] ? b.provedor : c.provedor;
  const novo = { ativo: b.ativo !== false, provedor: prov, modelos: Object.assign({}, c.modelos), instrucoes: String(b.instrucoes ?? c.instrucoes).slice(0, 2000), limite: Math.max(1, Math.min(500, Number(b.limite) || c.limite)), chaves: Object.assign({}, c.chaves), finais: Object.assign({}, c.finais) };
  if (b.modelo !== undefined) { if (b.modelo && !modeloOk(b.modelo)) return enviar(res, 400, { erro: "Nome de modelo inválido." }); if (b.modelo) novo.modelos[prov] = b.modelo; else delete novo.modelos[prov]; }
  const chave = String(b.chave || "").trim();
  if (chave) { if (chave.length < 20 || chave.length > 300 || /\s/.test(chave)) return enviar(res, 400, { erro: "Essa chave não parece válida." }); novo.chaves[prov] = await cifrar(chave); novo.finais[prov] = chave.slice(-4); }
  if (PROVEDORES[b.removerChave]) { delete novo.chaves[b.removerChave]; delete novo.finais[b.removerChave]; }
  await cmd("SET", P + "iacfg", JSON.stringify(novo));
  enviar(res, 200, await iaConfigPublica(novo));
}
async function rotaIATestar(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores configuram a KIN." });
  const c = await iaCfg(), prov = PROVEDORES[b.provedor] ? b.provedor : c.provedor;
  const chave = String(b.chave || "").trim() || (await chaveDe(c, prov));
  const modelo = modeloOk(b.modelo) ? b.modelo : modeloDe(c, prov);
  if (!chave) return enviar(res, 400, { erro: "Informe a chave da API para testar." });
  const t0 = Date.now();
  try { await testarProvedor(prov, chave, modelo); enviar(res, 200, { ok: true, ms: Date.now() - t0, provedor: PROVEDORES[prov].nome, modelo }); }
  catch (e) { enviar(res, 200, { ok: false, erro: erroIA(e) }); }
}

/* ---------- Pagamentos: Asaas (Pix, boleto e cartão) ---------- */
const ASAAS_URL = { producao: process.env.KINESIS_ASAAS_URL || "https://api.asaas.com/v3", sandbox: process.env.KINESIS_ASAAS_SANDBOX_URL || process.env.KINESIS_ASAAS_URL || "https://api-sandbox.asaas.com/v3" };
const AS_FORMAS = new Set(["UNDEFINED", "PIX", "BOLETO", "CREDIT_CARD"]);
const AS_FORMA_NOME = { PIX: "Pix", BOLETO: "Boleto", CREDIT_CARD: "Cartão de crédito", DEBIT_CARD: "Cartão de débito" };
async function asCfg() {
  const v = await cmd("GET", P + "asaas"); const c = v ? JSON.parse(v) : {};
  if (!c.webhookToken) { c.webhookToken = crypto.randomBytes(24).toString("base64url"); await cmd("SET", P + "asaas", JSON.stringify(c)); }
  return { ativo: c.ativo !== false, ambiente: c.ambiente === "producao" ? "producao" : "sandbox", chave: c.chave || "", final: c.final || "", webhookToken: c.webhookToken, formaPadrao: AS_FORMAS.has(c.formaPadrao) ? c.formaPadrao : "UNDEFINED" };
}
async function asChave(c) { return c.chave ? await decifrar(c.chave) : ""; }
async function asaasOk() { const c = await asCfg(); return c.ativo && !!c.chave; }
async function asApi(c, chave, metodo, caminho, corpo) {
  const r = await fetch(ASAAS_URL[c.ambiente] + caminho, { method: metodo, headers: { access_token: chave, "Content-Type": "application/json", "User-Agent": "Kinesis" }, body: corpo ? JSON.stringify(corpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = (j.errors && j.errors[0] && j.errors[0].description) || "Erro " + r.status;
    const e = new Error(r.status === 401 ? "A chave do Asaas foi recusada. Confira a chave e o ambiente (testes ou produção)." : "Asaas: " + msg); e.status = r.status; throw e;
  }
  return j;
}
const urlBase = (req) => "https://" + String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
async function asaasPublico(req, c) { return { ativo: c.ativo, ambiente: c.ambiente, salva: !!c.chave, final: c.final, formaPadrao: c.formaPadrao, webhookUrl: urlBase(req) + "/api/asaas/webhook", webhookToken: c.webhookToken, conectado: c.ativo && !!c.chave }; }
async function rotaAsaasConfig(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores configuram os pagamentos." });
  const c = await asCfg();
  if (req.method === "GET") return enviar(res, 200, await asaasPublico(req, c));
  const novo = { ativo: b.ativo !== false, ambiente: b.ambiente === "producao" ? "producao" : "sandbox", chave: c.chave, final: c.final, webhookToken: c.webhookToken, formaPadrao: AS_FORMAS.has(b.formaPadrao) ? b.formaPadrao : c.formaPadrao };
  const k = String(b.chave || "").trim();
  if (k) { if (k.length < 20 || k.length > 400 || /\s/.test(k)) return enviar(res, 400, { erro: "Essa chave do Asaas não parece válida." }); novo.chave = await cifrar(k); novo.final = k.slice(-4); }
  await cmd("SET", P + "asaas", JSON.stringify(novo));
  enviar(res, 200, await asaasPublico(req, Object.assign({}, novo)));
}
async function rotaAsaasTestar(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "ajustes") < 2) return enviar(res, 403, { erro: "Só administradores configuram os pagamentos." });
  const c = await asCfg(); if (b.ambiente === "producao" || b.ambiente === "sandbox") c.ambiente = b.ambiente;
  const chave = String(b.chave || "").trim() || (await asChave(c));
  if (!chave) return enviar(res, 400, { erro: "Informe a chave da API do Asaas." });
  try { const j = await asApi(c, chave, "GET", "/finance/balance"); enviar(res, 200, { ok: true, saldo: Number(j.balance) || 0, ambiente: c.ambiente }); }
  catch (e) { enviar(res, 200, { ok: false, erro: e.message }); }
}
async function gravarInterno(col, id, d) { await cmd("HSET", P + "c:" + col, id, JSON.stringify(Object.assign({}, d, { id }))); await cmd("HINCRBY", P + "v", col, 1); }
async function auditar(acao, resumo, autorId) { const id = novoId(); await gravarInterno("auditoria", id, { col: "financeiro", docId: "", acao, resumo: String(resumo).slice(0, 220), em: new Date().toISOString(), autorId: autorId || "asaas", profId: "" }); }
function aplicarPagamento(f, pg) {
  f.asaasStatus = pg.status || f.asaasStatus;
  if (["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"].includes(pg.status) && f.status !== "pago") {
    f.status = "pago"; f.pagoEm = String(pg.paymentDate || pg.clientPaymentDate || pg.confirmedDate || hoje()).slice(0, 10);
    if (AS_FORMA_NOME[pg.billingType]) f.forma = AS_FORMA_NOME[pg.billingType];
    return true;
  }
  return false;
}
async function rotaAsaasCobrar(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "financeiro") < 2) return enviar(res, 403, { erro: "Seu perfil não pode gerar cobranças." });
  const c = await asCfg(), chave = c.ativo ? await asChave(c) : ""; if (!chave) return enviar(res, 400, { erro: "Conecte o Asaas em Configurações › Pagamentos." });
  if (!idOk(b.finId)) return enviar(res, 400, { erro: "Receita inválida." });
  const f = await lerDoc("financeiro", b.finId); if (!f || f.tipo !== "receita") return enviar(res, 404, { erro: "Receita não encontrada." });
  if (f.status === "pago") return enviar(res, 400, { erro: "Esta receita já está paga." });
  if (f.asaasId && f.asaasUrl && f.asaasStatus !== "DELETED") return enviar(res, 200, { ok: true, fin: f });
  const p = f.pacienteId ? await lerDoc("pacientes", f.pacienteId) : null;
  if (!p) return enviar(res, 400, { erro: "Escolha o paciente da receita antes de cobrar." });
  const cpf = String(p.cpf || "").replace(/\D/g, ""); if (cpf.length !== 11 && cpf.length !== 14) return enviar(res, 400, { erro: "Cadastre o CPF do paciente para cobrar pelo Asaas." });
  try {
    let cli = p.asaasClientes && p.asaasClientes[c.ambiente];
    if (!cli) {
      const fone = String(p.telefone || "").replace(/\D/g, "");
      const j = await asApi(c, chave, "POST", "/customers", { name: p.nome, cpfCnpj: cpf, email: p.email || undefined, mobilePhone: fone || undefined, externalReference: "pac:" + p.id, notificationDisabled: false });
      cli = j.id; p.asaasClientes = Object.assign({}, p.asaasClientes, { [c.ambiente]: cli }); await gravarInterno("pacientes", p.id, p);
    }
    const venc = f.data && f.data >= hoje() ? f.data : hoje();
    const pg = await asApi(c, chave, "POST", "/payments", { customer: cli, billingType: AS_FORMAS.has(b.billingType) ? b.billingType : c.formaPadrao, value: Math.round(Number(f.valor) * 100) / 100, dueDate: venc, description: String(f.descricao || "Atendimento").slice(0, 400), externalReference: "fin:" + f.id });
    Object.assign(f, { asaasId: pg.id, asaasUrl: pg.invoiceUrl || pg.bankSlipUrl || "", asaasStatus: pg.status || "PENDING", asaasTipo: pg.billingType, asaasAmbiente: c.ambiente, asaasEm: new Date().toISOString() });
    await gravarInterno("financeiro", f.id, f);
    await auditar("criou", "Cobrança Asaas " + (f.descricao || "") + " · R$ " + Number(f.valor).toFixed(2), u.id);
    enviar(res, 200, { ok: true, fin: f });
  } catch (e) { console.error("asaas:", e.status, e.message); enviar(res, 502, { erro: e.message }); }
}
async function rotaAsaasSincronizar(req, res, b, u) {
  if (nivel(u, await cfgClinica(), "financeiro") < 1) return enviar(res, 403, { erro: "Sem acesso ao financeiro." });
  const c = await asCfg(), chave = await asChave(c); if (!chave) return enviar(res, 400, { erro: "Conecte o Asaas em Configurações › Pagamentos." });
  const f = idOk(b.finId) ? await lerDoc("financeiro", b.finId) : null; if (!f || !f.asaasId) return enviar(res, 404, { erro: "Esta receita não tem cobrança no Asaas." });
  try { const pg = await asApi(c, chave, "GET", "/payments/" + encodeURIComponent(f.asaasId)); aplicarPagamento(f, pg); await gravarInterno("financeiro", f.id, f); enviar(res, 200, { ok: true, fin: f }); }
  catch (e) { enviar(res, 502, { erro: e.message }); }
}
async function rotaAsaasWebhook(req, res, b) {
  const c = await asCfg(), tk = String(req.headers["asaas-access-token"] || "");
  if (!tk || tk.length !== c.webhookToken.length || !crypto.timingSafeEqual(Buffer.from(tk), Buffer.from(c.webhookToken))) return enviar(res, 401, { erro: "Token inválido." });
  const pg = b && b.payment, ref = pg && String(pg.externalReference || "");
  if (!ref.startsWith("fin:")) return enviar(res, 200, { ok: true, ignorado: true });
  const f = await lerDoc("financeiro", ref.slice(4)); if (!f) return enviar(res, 200, { ok: true, ignorado: true });
  if (f.asaasId && pg.id && f.asaasId !== pg.id) return enviar(res, 200, { ok: true, ignorado: true });
  if (b.event === "PAYMENT_DELETED") pg.status = "DELETED";
  const pagou = aplicarPagamento(f, pg);
  await gravarInterno("financeiro", f.id, f);
  if (pagou) await auditar("alterou", "Pagamento recebido pelo Asaas: " + (f.descricao || "") + " · R$ " + Number(f.valor).toFixed(2));
  enviar(res, 200, { ok: true });
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://local");
    const seg = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    const m = req.method;
    if (!RURL || !RTOK) return seg[0] === "estado" ? enviar(res, 200, { redis: false }) : enviar(res, 503, { erro: "Banco de dados não configurado." });
    let b = req.body; if (typeof b === "string") { try { b = JSON.parse(b || "{}"); } catch { b = {}; } } b = b || {};
    if (m !== "GET" && m !== "HEAD") { const o = req.headers.origin, h = req.headers.host; if (o && h && new URL(o).host !== h) return enviar(res, 403, { erro: "Origem não permitida." }); }
    if (seg[0] === "estado" && m === "GET") return rotaEstado(req, res);
    if (seg[0] === "asaas" && seg[1] === "webhook" && m === "POST") return rotaAsaasWebhook(req, res, b);
    if (seg[0] === "setup" && m === "POST") return rotaSetup(req, res, b);
    if (seg[0] === "login" && m === "POST") return rotaLogin(req, res, b);
    if (seg[0] === "logout" && m === "POST") { cookie(res, "", 0); return enviar(res, 200, { ok: true }); }
    const u = await sessaoUsuario(req);
    if (!u) return enviar(res, 401, { erro: "Sua sessão expirou. Entre de novo." });
    if (seg[0] === "senha" && m === "POST") return rotaSenha(req, res, b, u);
    if (seg[0] === "ver" && m === "GET") return enviar(res, 200, pares(await cmd("HGETALL", P + "v")));
    if (seg[0] === "col" && seg[1] && m === "GET") return listarColecao(req, res, seg[1], u);
    if (seg[0] === "doc" && seg[1] && seg[2] && m === "PUT") return gravarDoc(res, seg[1], seg[2], b, u);
    if (seg[0] === "doc" && seg[1] && seg[2] && m === "DELETE") return apagarDoc(res, seg[1], seg[2], u);
    if (seg[0] === "ia" && seg[1] === "config" && (m === "GET" || m === "PUT")) return rotaIAConfig(req, res, b, u);
    if (seg[0] === "asaas" && seg[1] === "config" && (m === "GET" || m === "PUT")) return rotaAsaasConfig(req, res, b, u);
    if (seg[0] === "asaas" && seg[1] === "testar" && m === "POST") return rotaAsaasTestar(req, res, b, u);
    if (seg[0] === "asaas" && seg[1] === "cobrar" && m === "POST") return rotaAsaasCobrar(req, res, b, u);
    if (seg[0] === "asaas" && seg[1] === "sincronizar" && m === "POST") return rotaAsaasSincronizar(req, res, b, u);
    if (seg[0] === "ia" && seg[1] === "uso" && m === "GET") { const pl = planoDe(await licenca()); return enviar(res, 200, { plano: pl.id, limite: pl.kinMes, usado: Number(await cmd("GET", P + "iames:" + new Date().toISOString().slice(0, 7))) || 0 }); }
    if (seg[0] === "ia" && seg[1] === "testar" && m === "POST") return rotaIATestar(req, res, b, u);
    if (seg[0] === "ia" && !seg[1] && m === "POST") return rotaIA(req, res, b, u);
    enviar(res, 404, { erro: "Rota não encontrada." });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) enviar(res, 500, { erro: "Erro no servidor. Tente de novo." }); else res.end();
  }
}
