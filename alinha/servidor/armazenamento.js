/* Armazenamento do Alinha
   • "arquivo": um JSON na pasta de dados (Render com disco, computador).
   • "redis": Upstash Redis pela API REST (Vercel e qualquer hospedagem sem disco).
   Escolha automática: se houver KV_REST_API_URL/KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL/TOKEN), usa Redis. */
import fs from "node:fs";
import path from "node:path";

const DIA = 86400000;
const resumoDe = (lead, C) => { const u = C.lista[C.lista.length - 1] || {}; return { lead, nome: C.nome || "", unidade: C.unidade || "", ultima: u.texto || "", autor: u.autor || "", ts: u.ts || "", total: C.lista.length, atualizado: C.atualizado || 0 }; };

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
    async exportar() { return DB; },
    async backup(motivo) {
      if (!fs.existsSync(ARQ)) return null;
      const nome = `alinha-${new Date().toISOString().slice(0, 10)}-${motivo}.json`;
      fs.copyFileSync(ARQ, path.join(BK, nome));
      const lista = fs.readdirSync(BK).filter((f) => f.endsWith(".json")).sort();
      const diarias = lista.filter((f) => f.includes("-diario"));
      diarias.slice(0, Math.max(0, diarias.length - 7)).forEach((f) => fs.unlinkSync(path.join(BK, f)));
      lista.filter((f) => !f.includes("-diario")).forEach((f) => { if (Date.now() - new Date(f.slice(7, 17)) > 90 * DIA) fs.unlinkSync(path.join(BK, f)); });
      return nome;
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
  const K = { meta: `${P}:meta`, aj: `${P}:ajustes`, pac: `${P}:pacientes`, res: `${P}:wa:resumo`, wa: (l) => `${P}:wa:${l}` };
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
    async resumoWA() { const r = ler(await um("GET", K.res), { ver: 0, itens: {} }); return { ver: r.ver || 0, itens: Object.values(r.itens || {}) }; },
    async exportar() {
      const [m, a] = await pipe([["GET", K.meta], ["GET", K.aj]]);
      const r = await this.resumoWA();
      const wa = {}; for (const it of r.itens) { const c = await this.conversa(it.lead); if (c) wa[it.lead] = c; }
      return { ...ler(m, {}), ajustes: ler(a, {}), pacientes: await this.pacientes(), whatsapp: wa };
    },
    async backup(motivo) {
      // cópia no próprio banco, guardada por 90 dias
      try { const db = await this.exportar(); await um("SET", `${P}:backup:${new Date().toISOString().slice(0, 10)}-${motivo}`, JSON.stringify(db), "EX", String(90 * 86400)); return motivo; }
      catch (e) { console.error("Cópia de segurança não gravada:", e.message); return null; }
    }
  };
}
