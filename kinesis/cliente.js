/* Kinesis · camada do navegador para a versão hospedada.
   Mostra login / primeiro acesso, conversa com /api e oferece ao sistema a mesma interface
   de banco (coleções com onSnapshot), usuário e IA que ele usa dentro do Claude. */
(function () {
  "use strict";
  const $g = (id) => document.getElementById(id);
  let ESTADO = null;

  async function api(path, opt) {
    opt = opt || {};
    const r = await fetch("/api/" + path, {
      method: opt.method || "GET",
      headers: opt.body !== undefined ? { "Content-Type": "application/json" } : {},
      body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
    if (r.status === 401 && !opt.publico) { location.reload(); throw new Error("Sua sessão expirou."); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.erro || "Erro " + r.status); e.status = r.status; throw e; }
    return j;
  }

  /* ---------- banco: cache por coleção + atualização por versão ---------- */
  const cache = {}, lis = {}, vers = {}, carregando = {};
  const copia = (o) => JSON.parse(JSON.stringify(o));
  function avisar(col) { (lis[col] || []).slice().forEach((f) => { try { f(cache[col] || []); } catch (e) { console.error(e); } }); }
  async function carregar(col) {
    if (carregando[col]) return carregando[col];
    carregando[col] = api("col/" + encodeURIComponent(col)).then((arr) => { cache[col] = Array.isArray(arr) ? arr : []; avisar(col); }).finally(() => { carregando[col] = null; });
    return carregando[col];
  }
  function ouvir(col, fn) {
    (lis[col] = lis[col] || []).push(fn);
    if (cache[col]) setTimeout(() => fn(cache[col]), 0); else carregar(col).catch(() => {});
    return () => { lis[col] = (lis[col] || []).filter((x) => x !== fn); };
  }
  const docSnap = (id, d) => ({ id, exists: !!d, data: () => (d ? copia(d) : undefined) });
  function aplicarLocal(col, id, d) {
    const L = (cache[col] || []).filter((x) => x.id !== id);
    if (d) L.push(Object.assign({}, d, { id }));
    cache[col] = L; avisar(col);
  }
  function marcarVersao(col, v) { if (typeof v === "number" && v === Number(vers[col] || 0) + 1) vers[col] = v; }

  function docRef(col, id) {
    return {
      id,
      async get() { if (!cache[col]) await carregar(col); return docSnap(id, (cache[col] || []).find((x) => x.id === id)); },
      async set(data) {
        const antes = cache[col] ? copia(cache[col]) : null;
        if (col !== "usuarios") aplicarLocal(col, id, data);
        try { const r = await api("doc/" + encodeURIComponent(col) + "/" + encodeURIComponent(id), { method: "PUT", body: { data } }); marcarVersao(col, r.v); }
        catch (e) { if (antes) { cache[col] = antes; avisar(col); } throw e; }
        if (col === "usuarios") await carregar(col);
      },
      async update(parcial) { const atual = (cache[col] || []).find((x) => x.id === id) || {}; return this.set(Object.assign({}, atual, parcial)); },
      async delete() {
        const antes = cache[col] ? copia(cache[col]) : null;
        aplicarLocal(col, id, null);
        try { const r = await api("doc/" + encodeURIComponent(col) + "/" + encodeURIComponent(id), { method: "DELETE" }); marcarVersao(col, r.v); }
        catch (e) { if (antes) { cache[col] = antes; avisar(col); } throw e; }
      },
      onSnapshot(cb, err) { return ouvir(col, (L) => cb(docSnap(id, L.find((x) => x.id === id)))); },
    };
  }
  function consulta(col, ord, lim) {
    const vista = (L) => {
      let a = L.slice();
      if (ord) a.sort((x, y) => { const p = x[ord.f], q = y[ord.f]; const c = p < q ? -1 : p > q ? 1 : 0; return ord.d === "desc" ? -c : c; });
      if (lim) a = a.slice(0, lim);
      return { docs: a.map((d) => docSnap(d.id, d)), size: a.length, empty: !a.length, forEach(f) { this.docs.forEach(f); } };
    };
    return {
      orderBy: (f, d) => consulta(col, { f, d: d || "asc" }, lim),
      limit: (n) => consulta(col, ord, n),
      doc: (id) => docRef(col, id),
      async get() { if (!cache[col]) await carregar(col); return vista(cache[col] || []); },
      onSnapshot(cb, err) { return ouvir(col, (L) => cb(vista(L))); },
    };
  }
  const DB = {
    collection: (c) => consulta(c),
    doc: (caminho) => { const [c, id] = String(caminho).split("/"); return docRef(c, id); },
  };

  let ocupado = false;
  async function sincronizar() {
    if (ocupado || document.hidden) return;
    ocupado = true;
    try {
      const v = await api("ver");
      const tarefas = [];
      Object.keys(lis).forEach((col) => { if ((lis[col] || []).length && String(v[col] || 0) !== String(vers[col] || 0)) { vers[col] = v[col] || 0; tarefas.push(carregar(col).catch(() => {})); } });
      await Promise.all(tarefas);
    } catch (e) { /* sem conexão: tenta de novo no próximo ciclo */ }
    ocupado = false;
  }

  /* ---------- usuário e IA ---------- */
  const USER = {
    can: async () => true,
    id: async () => ESTADO.user.id,
    isOwner: async () => !!ESTADO.user.owner,
    canEdit: async () => true,
    me: async () => ({ id: ESTADO.user.id, name: ESTADO.user.nome }),
    profiles: async (ids) => {
      const o = {};
      (cache.usuarios || []).forEach((u) => { if (ids.includes(u.id)) o[u.id] = { id: u.id, name: u.nome }; });
      if (ids.includes(ESTADO.user.id)) o[ESTADO.user.id] = { id: ESTADO.user.id, name: ESTADO.user.nome };
      return o;
    },
    search: async () => [],
  };
  async function SAMPLE(input, opts) {
    opts = opts || {};
    const r = await fetch("/api/ia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }), credentials: "same-origin" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      const e = new Error(j.erro || "Erro " + r.status);
      e.code = r.status === 429 ? "rate_limited" : r.status === 503 || r.status === 403 ? "not_granted" : "error";
      if (r.status === 401) location.reload();
      throw e;
    }
    const leitor = r.body.getReader(), dec = new TextDecoder();
    let txt = "";
    for (;;) {
      const { value, done } = await leitor.read();
      if (done) break;
      txt += dec.decode(value, { stream: true });
      if (opts.onText) opts.onText({ text: txt });
    }
    txt += dec.decode();
    if (opts.onText) opts.onText({ text: txt });
    return { text: txt };
  }

  /* ---------- telas de acesso ---------- */
  const tela = (html) => { const g = $g("kin-gate"); g.hidden = false; $g("kin-card").innerHTML = html; const i = g.querySelector("input"); if (i) setTimeout(() => i.focus(), 30); };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const MARCA = $g("kin-marca-tpl").innerHTML;
  function erro(f, msg) { const p = f.querySelector(".lg-e"); p.textContent = msg; p.hidden = !msg; }
  async function enviar(f, rota, corpo) {
    const b = f.querySelector("button[type=submit]"); b.disabled = true; erro(f, "");
    try { await api(rota, { method: "POST", body: corpo, publico: true }); location.reload(); }
    catch (e) { erro(f, e.message || "Não foi possível entrar."); b.disabled = false; }
  }
  function telaLogin() {
    tela(`${MARCA}<h1 id="lg-t">Entrar</h1>
      <form id="kin-f" novalidate><label class="f">E-mail<input type="email" name="email" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label class="f">Senha<input type="password" name="senha" autocomplete="current-password" required></label>
      <p class="lg-e" role="alert" hidden></p><button type="submit" class="btn pri lg-b">Entrar</button></form>
      <p class="lg-nota">Esqueceu a senha? Peça ao administrador da clínica para definir uma nova em Usuários e permissões.</p>`);
    $g("kin-f").onsubmit = (ev) => { ev.preventDefault(); const f = ev.target; enviar(f, "login", { email: f.email.value, senha: f.senha.value }); };
  }
  function telaSetup() {
    tela(`${MARCA}<h1 id="lg-t">Primeiro acesso</h1><p class="lg-dica">Crie a conta do titular. O titular tem acesso total e controla plano, limite de usuários e faturas.</p>
      <form id="kin-f" novalidate><label class="f">Nome da clínica<input type="text" name="clinica" autocomplete="organization"></label>
      <label class="f">Seu nome<input type="text" name="nome" autocomplete="name" required></label>
      <label class="f">E-mail<input type="email" name="email" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
      <label class="f">Senha (mínimo 8 caracteres)<input type="password" name="senha" autocomplete="new-password" required></label>
      <label class="f">Confirme a senha<input type="password" name="senha2" autocomplete="new-password" required></label>
      <p class="lg-e" role="alert" hidden></p><button type="submit" class="btn pri lg-b">Criar conta e entrar</button></form>`);
    $g("kin-f").onsubmit = (ev) => {
      ev.preventDefault(); const f = ev.target;
      if (f.senha.value !== f.senha2.value) return erro(f, "As senhas não conferem.");
      enviar(f, "setup", { clinica: f.clinica.value, nome: f.nome.value, email: f.email.value, senha: f.senha.value });
    };
  }
  function telaSemBanco() {
    tela(`${MARCA}<h1 id="lg-t">Falta conectar o banco de dados</h1>
      <p class="lg-dica">O sistema está no ar, mas ainda não tem onde guardar os dados.</p>
      <ol class="lg-passos"><li>No painel da Vercel, abra este projeto e vá em <b>Storage</b>.</li><li>Escolha <b>Upstash for Redis</b> (o plano gratuito serve para começar) e conecte ao projeto.</li><li>Em <b>Deployments</b>, clique em <b>Redeploy</b>. Depois, recarregue esta página.</li></ol>
      <button type="button" class="btn pri lg-b" onclick="location.reload()">Recarregar</button>`);
  }
  function telaFalha(msg) {
    tela(`${MARCA}<h1 id="lg-t">Não foi possível conectar</h1><p class="lg-dica">${esc(msg)}</p><button type="button" class="btn pri lg-b" onclick="location.reload()">Tentar de novo</button>`);
  }

  async function iniciarApp() {
    window.__KINESIS_HOSTED = true;
    window.__KINESIS_EMAIL = ESTADO.user.email || "";
    window.__KINESIS_IA_OK = !!ESTADO.ia;
    window.__KINESIS_IA_PROV = ESTADO.iaProvedor || "anthropic";
    try { Object.assign(vers, await api("ver")); } catch (e) {}
    window.claude = {
      use: async (nome) => {
        if (nome === "db") return DB;
        if (nome === "user") return USER;
        if (nome === "sample") { if (window.__KINESIS_IA_OK) return SAMPLE; const e = new Error("IA não configurada"); e.code = "unavailable"; throw e; }
        if (nome === "downloads") return null;
        throw new Error("Recurso indisponível: " + nome);
      },
    };
    $g("kin-gate").hidden = true;
    const s = document.createElement("script");
    s.textContent = $g("kin-src").textContent;
    document.body.appendChild(s);
    setInterval(sincronizar, 4000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) sincronizar(); });
  }

  (async () => {
    try { ESTADO = await api("estado", { publico: true }); }
    catch (e) { return telaFalha("O servidor não respondeu. Verifique a internet e tente de novo."); }
    if (!ESTADO.redis) return telaSemBanco();
    if (ESTADO.setup) return telaSetup();
    if (!ESTADO.user) return telaLogin();
    iniciarApp();
  })();
})();
