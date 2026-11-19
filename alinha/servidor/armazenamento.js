/* Armazenamento do Alinha
   • "arquivo": um JSON na pasta de dados (Render com disco, computador).
   • "redis": Upstash Redis pela API REST (Vercel e qualquer hospedagem sem disco).
   Escolha automática: se houver KV_REST_API_URL/KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL/TOKEN), usa Redis. */
import fs from "node:fs";
import path from "node:path";

const DIA = 86400000;
const diaLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const ultimosDias = (n) => Array.from({ length: n }, (_, i) => diaLocal(new Date(Date.now() - i * DIA)));
const nomeCopiaOk = (n) => /^[\w.-]{1,80}$/.test(String(n || ""));
const resumoDe = (lead, C) => { const u = C.lista[C.lista.length - 1] || {}; return { lead, nome: C.nome || "", foto: C.foto || "", unidade: C.unidade || "", ultima: u.texto || "", autor: u.autor || "", ts: u.ts || "", total: C.lista.length, setor: C.setor || "", responsavel: C.responsavel || "", atualizado: C.atualizado || 0 }; };

export function criarArmazenamento({ dados, prefixo = "alinha", env = process.env }) {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL || "";
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN || "";
  return url && token ? redis(url.replace(/\/$/, ""), token, prefixo) : arquivo(dados);
}

/* ------------------------------------------------------------------ */
function arquivo(pasta) {
  let persistente = true;
  try { fs.mkdirSync(pasta, { recursive: true }); fs.accessSync(pasta, fs.constants.W_OK); }
  catch { pasta = path.join("/tmp", "alinha-dados"); fs.mkdirSync(pasta, { recursive: true }); persistente = false; }
  const ARQ = path.join(pasta, "alinha.json"), BK = path.join(pasta, "backups");
  fs.mkdirSync(BK, { recursive: true });
  let DB = { pacientes: [], ajustes: {}, whatsapp: {}, esquema: 0, versao: null, waVer: 0 };
  try { DB = { ...DB, ...JSON.parse(fs.readFileSync(ARQ, "utf8")) }; } catch { /* primeiro uso */ }
  DB.whatsapp = DB.whatsapp || {};
  let t = null;
  const salvar = (ja) => {
    clearTimeout(t);
    const gravar = () => { const tmp = ARQ + ".tmp"; fs.writeFileSync(tmp, JSON.stringify(DB)); fs.renameSync(tmp, ARQ); };
    if (ja) gravar(); else t = setTimeout(() => { try { gravar(); } catch (e) { console.error("Falha ao salvar dados:", e.message); } }, 300);
  };
  return {
    tipo: "arquivo", persistente: persistente && !process.env.VERCEL,
    async meta() { return { esquema: DB.esquema || 0, versao: DB.versao || null }; },
    async salvarMeta(m) { Object.assign(DB, m); salvar(true); },
    async migrar(fn) { fn(DB); salvar(true); },
    async ajustes() { return DB.ajustes || {}; },
    async salvarAjustes(novo) { DB.ajustes = { ...(DB.ajustes || {}), ...novo }; salvar(); return DB.ajustes; },
    async pacientes() { return DB.pacientes; },
    async salvarPaciente(p) { const i = DB.pacientes.findIndex((x) => x.id === p.id); if (i >= 0) DB.pacientes[i] = p; else DB.pacientes.push(p); salvar(); return p; },
    async apagarPaciente(id) { DB.pacientes = DB.pacientes.filter((x) => x.id !== id); salvar(); },
    async conversa(lead) { return DB.whatsapp[lead] || null; },
    async salvarConversa(lead, C) {
      DB.whatsapp[lead] = C; DB.waVer = (DB.waVer || 0) + 1;
      for (const [k, X] of Object.entries(DB.whatsapp)) if (Date.now() - (X.atualizado || 0) > 30 * DIA) delete DB.whatsapp[k];
      salvar();
    },
    async resumoWA() { return { ver: DB.waVer || 0, itens: Object.entries(DB.whatsapp).map(([l, C]) => resumoDe(l, C)) }; },
    async integracoes() { return DB.integracoes || {}; },
    async salvarIntegracoes(x) { DB.integracoes = x; salvar(true); },
    async exportar() { return DB; },
    // check-list diário: { dia: { operador: registro } }
    async checklistDia(dia) { return (DB.checklist || {})[dia] || {}; },
    async salvarChecklist(dia, op, reg) {
      DB.checklist = DB.checklist || {}; (DB.checklist[dia] = DB.checklist[dia] || {})[op] = reg;
      const limite = diaLocal(new Date(Date.now() - 400 * DIA)); Object.keys(DB.checklist).forEach((d) => { if (d < limite) delete DB.checklist[d]; });
      salvar(); return reg;
    },
    async checklistHistorico(n) { const out = {}; ultimosDias(n).forEach((d) => { if ((DB.checklist || {})[d]) out[d] = DB.checklist[d]; }); return out; },
    // memória: cópias guardadas e restauração
    async listarCopias() { return fs.readdirSync(BK).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)).sort().reverse(); },
    async lerCopia(nome) { if (!nomeCopiaOk(nome)) return null; try { return JSON.parse(fs.readFileSync(path.join(BK, nome + ".json"), "utf8")); } catch { return null; } },
    async importar(db) { DB.pacientes = Array.isArray(db.pacientes) ? db.pacientes : []; DB.ajustes = db.ajustes || {}; if (db.checklist) DB.checklist = db.checklist; salvar(true); },
    async ultimaCopia() { return DB.ultimaCopia || ""; },
    async marcarCopia(dia) { DB.ultimaCopia = dia; salvar(); },
    async backup(motivo) {
      try { salvar(true); } catch (e) { console.error("Falha ao gravar antes da cópia:", e.message); } // grava o que estava esperando, para a cópia sair completa
      if (!fs.existsSync(ARQ)) return null;
      const nome = `alinha-${new Date().toISOString().slice(0, 10)}-${motivo}${motivo === "manual" || motivo === "antes-de-restaurar" ? "-" + new Date().toISOString().slice(11, 19).replace(/:/g, "") : ""}.json`;
      fs.copyFileSync(ARQ, path.join(BK, nome));
      const lista = fs.readdirSync(BK).filter((f) => f.endsWith(".json")).sort();
      const diarias = lista.filter((f) => f.includes("-diario"));
      diarias.slice(0, Math.max(0, diarias.length - 30)).forEach((f) => fs.unlinkSync(path.join(BK, f)));
      lista.filter((f) => !f.includes("-diario")).forEach((f) => { if (Date.now() - new Date(f.slice(7, 17)) > 90 * DIA) fs.unlinkSync(path.join(BK, f)); });
      return nome.slice(0, -5);
    }
  };
}

/* ------------------------------------------------------------------ */
function redis(url, token, P) {
  async function pipe(cmds) {
    const r = await fetch(url + "/pipeline", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmds) });
    if (!r.ok) throw new Error(`Banco de dados respondeu ${r.status}`);
    const d = await r.json();
    const erro = d.find((x) => x.error); if (erro) throw new Error("Banco de dados: " + erro.error);
    return d.map((x) => x.result);
  }
  const um = async (...c) => (await pipe([c]))[0];
  const ler = (s, def) => { try { return s ? JSON.parse(s) : def; } catch { return def; } };
  const K = { meta: `${P}:meta`, aj: `${P}:ajustes`, pac: `${P}:pacientes`, res: `${P}:wa:resumo`, wa: (l) => `${P}:wa:${l}`, integ: `${P}:integracoes`, ck: (d) => `${P}:ck:${d}`, bk: (n) => `${P}:backup:${n}`, ult: `${P}:ultimaCopia` };
  const hash = (h) => { const o = {}; for (let i = 0; i + 1 < (h || []).length; i += 2) { const v = ler(h[i + 1], null); if (v) o[h[i]] = v; } return o; };
  return {
    tipo: "redis", persistente: true,
    async meta() { return ler(await um("GET", K.meta), { esquema: 0, versao: null }); },
    async salvarMeta(m) { await um("SET", K.meta, JSON.stringify(m)); },
    async migrar(fn) {
      // migrações recebem um objeto com o mesmo formato do arquivo e gravam de volta
      const db = await this.exportar(); fn(db);
      const cmds = [["SET", K.aj, JSON.stringify(db.ajustes || {})], ["DEL", K.pac]];
      (db.pacientes || []).forEach((p) => cmds.push(["HSET", K.pac, p.id, JSON.stringify(p)]));
      await pipe(cmds);
    },
    async ajustes() { return ler(await um("GET", K.aj), {}); },
    async salvarAjustes(novo) { const a = { ...(await this.ajustes()), ...novo }; await um("SET", K.aj, JSON.stringify(a)); return a; },
    async pacientes() { const h = await um("HGETALL", K.pac) || []; const out = []; for (let i = 0; i < h.length; i += 2) out.push(ler(h[i + 1], null)); return out.filter(Boolean); },
    async salvarPaciente(p) { await um("HSET", K.pac, p.id, JSON.stringify(p)); return p; },
    async apagarPaciente(id) { await um("HDEL", K.pac, id); },
    async conversa(lead) { return ler(await um("GET", K.wa(lead)), null); },
    async salvarConversa(lead, C) {
      const r = ler(await um("GET", K.res), { ver: 0, itens: {} });
      r.ver = (r.ver || 0) + 1; r.itens[lead] = resumoDe(lead, C);
      const velhos = Object.keys(r.itens).filter((l) => Date.now() - (r.itens[l].atualizado || 0) > 30 * DIA);
      velhos.forEach((l) => delete r.itens[l]);
      await pipe([["SET", K.wa(lead), JSON.stringify(C), "EX", String(35 * 86400)], ["SET", K.res, JSON.stringify(r)], ...velhos.map((l) => ["DEL", K.wa(l)])]);
    },
    async integracoes() { return ler(await um("GET", K.integ), {}); },
    async salvarIntegracoes(x) { await um("SET", K.integ, JSON.stringify(x)); },
    async resumoWA() { const r = ler(await um("GET", K.res), { ver: 0, itens: {} }); return { ver: r.ver || 0, itens: Object.values(r.itens || {}) }; },
    async exportar() {
      const [m, a] = await pipe([["GET", K.meta], ["GET", K.aj]]);
      const r = await this.resumoWA();
      const wa = {}; for (const it of r.itens) { const c = await this.conversa(it.lead); if (c) wa[it.lead] = c; }
      return { ...ler(m, {}), ajustes: ler(a, {}), pacientes: await this.pacientes(), whatsapp: wa, checklist: await this.checklistHistorico(120) };
    },
    async checklistDia(dia) { return hash(await um("HGETALL", K.ck(dia))); },
    async salvarChecklist(dia, op, reg) { await pipe([["HSET", K.ck(dia), op, JSON.stringify(reg)], ["EXPIRE", K.ck(dia), String(400 * 86400)]]); return reg; },
    async checklistHistorico(n) { const dias = ultimosDias(n); const r = await pipe(dias.map((d) => ["HGETALL", K.ck(d)])); const out = {}; dias.forEach((d, i) => { const h = hash(r[i]); if (Object.keys(h).length) out[d] = h; }); return out; },
    async listarCopias() { const ks = (await um("KEYS", K.bk("*"))) || []; return ks.map((k) => k.slice(K.bk("").length)).sort().reverse(); },
    async lerCopia(nome) { if (!nomeCopiaOk(nome)) return null; return ler(await um("GET", K.bk(nome)), null); },
    async importar(db) {
      const cmds = [["SET", K.aj, JSON.stringify(db.ajustes || {})], ["DEL", K.pac]];
      (db.pacientes || []).forEach((p) => p && p.id && cmds.push(["HSET", K.pac, p.id, JSON.stringify(p)]));
      Object.entries(db.checklist || {}).forEach(([d, regs]) => Object.entries(regs || {}).forEach(([op, r]) => cmds.push(["HSET", K.ck(d), op, JSON.stringify(r)])));
      await pipe(cmds);
    },
    async ultimaCopia() { return (await um("GET", K.ult)) || ""; },
    async marcarCopia(dia) { await um("SET", K.ult, dia); },
    async backup(motivo) {
      // cópia no próprio banco, guardada por 90 dias
      try { const db = await this.exportar(); const nome = `${new Date().toISOString().slice(0, 10)}-${motivo}${motivo === "manual" || motivo === "antes-de-restaurar" ? "-" + new Date().toISOString().slice(11, 19).replace(/:/g, "") : ""}`; await um("SET", K.bk(nome), JSON.stringify(db), "EX", String(90 * 86400)); return nome; }
      catch (e) { console.error("Cópia de segurança não gravada:", e.message); return null; }
    }
  };
}
