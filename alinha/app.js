/* ALINHA — copiloto de fechamento da Weiss Odontologia
   Telas: Hoje (mensagens prontas) · Consulta ao vivo · Briefings · Follow-up D0–D30 · Ajustes.
   Funciona em dois modos:
   • Plataforma (servidor do Alinha): dados da equipe no servidor + IA (Claude);
   • Demonstração/local: dados neste navegador, dicas do roteiro e briefing de exemplo. */
(function () {
  "use strict";
  const BIB = window.ROTEIRO, DEMO = window.ALINHA_DEMO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const brl = (n) => (n || n === 0) && !isNaN(n) ? Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "—";
  const digits = (s) => String(s || "").replace(/\D/g, "");
  const primeiro = (n) => String(n || "").trim().split(/\s+/)[0] || "";
  const iniciais = (n) => String(n || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const DIA = 86400000;
  const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const hoje0 = () => inicioDia(new Date());
  const fmtData = (iso) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2400); }
  const ls = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } } };

  /* ------------------------------------------------------------ */
  /* Dados                                                         */
  /* ------------------------------------------------------------ */
  let PLAT = null;               // { ia, kommo } quando conectado ao servidor
  let PAC = [];                  // pacientes
  let AJ = { equipe: ["Dr. Edelweiss"], condicao: "" };

  async function api(metodo, rota, corpo) {
    const r = await fetch(rota, { method: metodo, headers: corpo ? { "Content-Type": "application/json" } : {}, body: corpo ? JSON.stringify(corpo) : undefined });
    if (r.status === 401) { location.href = "login"; throw new Error("Sessão expirada"); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || "Erro " + r.status);
    return d;
  }
  const Store = {
    async carregar() {
      if (PLAT) {
        PAC = (await api("GET", "api/pacientes")).pacientes || [];
        AJ = Object.assign(AJ, (await api("GET", "api/ajustes")).ajustes || {});
      } else {
        PAC = ls.get("alinha.pacientes", null);
        if (!PAC) { PAC = DEMO.pacientes(); ls.set("alinha.pacientes", PAC); }
        AJ = Object.assign(AJ, ls.get("alinha.ajustes", {}));
      }
    },
    async salvar(p) {
      const i = PAC.findIndex((x) => x.id === p.id);
      if (i >= 0) PAC[i] = p; else PAC.push(p);
      if (PLAT) { const d = await api("POST", "api/pacientes", p); Object.assign(p, d.paciente); }
      else ls.set("alinha.pacientes", PAC);
    },
    async remover(id) {
      PAC = PAC.filter((x) => x.id !== id);
      if (PLAT) await api("DELETE", "api/pacientes/" + encodeURIComponent(id)); else ls.set("alinha.pacientes", PAC);
    },
    async ajustes(novo) {
      AJ = Object.assign(AJ, novo);
      if (PLAT) await api("POST", "api/ajustes", novo); else ls.set("alinha.ajustes", AJ);
    }
  };
  const novoId = () => "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  /* ------------------------------------------------------------ */
  /* Cadência de follow-up                                         */
  /* ------------------------------------------------------------ */
  const CAD = [0, 1, 3, 7, 15, 30];
  const CAD_NOME = { 0: "Resumo do plano", 1: "Tirar dúvidas", 3: "Reforçar valor", 7: "Pergunta direta", 15: "Porta aberta", 30: "Encerramento" };
  function proximo(p) {
    if (p.status !== "aberto") return null;
    const toques = p.toques || {};
    const dia = CAD.find((d) => !toques[d]);
    if (dia === undefined) return { fim: true };
    const due = new Date(inicioDia(p.consultaEm).getTime() + dia * DIA);
    const atraso = Math.round((hoje0() - due) / DIA);
    return { dia, n: CAD.indexOf(dia) + 1, due, atraso };
  }
  const paraHoje = () => PAC.map((p) => ({ p, x: proximo(p) })).filter((o) => o.x && !o.x.fim && o.x.atraso >= 0).sort((a, b) => b.x.atraso - a.x.atraso);
  const doMes = (iso) => { if (!iso) return false; const d = new Date(iso), h = new Date(); return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear(); };

  /* ------------------------------------------------------------ */
  /* Mensagens (IA na plataforma; modelos no modo local)           */
  /* ------------------------------------------------------------ */
  const OBJ_NOME = Object.fromEntries(BIB.objecoes.map((o) => [o.id, o.titulo]));
  OBJ_NOME.medo = OBJ_NOME.dor; OBJ_NOME.tempo = OBJ_NOME.tempo_tratamento;
  function modelo(p, dia, v = 0) {
    const n = primeiro(p.nome), pal = (p.palavras || [])[0], prof = p.profissional || "o doutor", obj = (p.objecoes || [])[0];
    const valor = p.valorApresentado ? " — " + brl(p.valorApresentado) : "";
    const parcela = p.valorApresentado ? brl(Math.round(p.valorApresentado / 12)) : "";
    const M = {
      0: [`Oi, ${n}! Foi muito bom te receber hoje 😊 Como combinamos, segue o seu plano: ${p.tratamento || "tratamento ortodôntico"}${valor}.${p.dor ? ` É o caminho para resolver ${p.dor}.` : ""} Ficou alguma dúvida que eu possa esclarecer?`,
        `${n}, obrigada pela consulta de hoje! Resumindo o que conversamos: ${p.tratamento || "seu tratamento"}${valor}. Quer que eu te mande a simulação do seu sorriso para você ver com calma?`],
      1: [`Oi, ${n}! Passando pra saber se ficou alguma dúvida sobre o plano.${pal ? ` Você comentou "${pal}", e isso ficou comigo.` : ""} Posso te ajudar em algum ponto?`,
        `${n}, tudo bem? Fiquei pensando na nossa conversa. Tem alguma pergunta que você esqueceu de fazer na consulta? Estou por aqui 🙂`],
      3: {
        decisor: [`Oi, ${n}! ${prof} pode gravar um vídeo rapidinho explicando o seu plano para você mostrar ${p.decisor ? "para " + p.decisor : "em casa"}. Posso te enviar?`, `${n}, que tal você vir com ${p.decisor || "quem decide junto"} para ver a simulação? Assim tiramos as dúvidas dos dois. Prefere quinta ou sábado?`],
        preco: [`Oi, ${n}! Fiz as contas: dividindo, o seu tratamento fica em torno de ${parcela} por mês. Quer que eu monte uma condição que caiba no seu mês?`, `${n}, pensando no que você disse sobre o valor: dá pra ajustar entrada e parcelas. Posso te mandar duas opções?`],
        medo: [`Oi, ${n}! Lembrei do seu receio de sentir dor. Muitos pacientes chegaram assim e se surpreenderam: com os alinhadores é só uma leve pressão nos primeiros dias. Posso te mandar o relato de um deles?`, `${n}, quer vir aqui só para segurar um alinhador e ver como é leve? Sem compromisso.`],
        padrao: [`Oi, ${n}! Lembra da simulação do seu sorriso? 😍 Posso te mandar de novo para você ver com calma?`, `${n}, separei um caso bem parecido com o seu, com o antes e depois. Quer ver?`]
      },
      7: [`Oi, ${n}! Queria te perguntar com sinceridade: existe algo que esteja te impedindo de começar? Me fala, que eu te ajudo a encontrar o melhor caminho 🙂`, `${n}, de 0 a 10, quanto você quer começar o tratamento? O que falta para chegar no 10?`],
      15: [AJ.condicao ? `Oi, ${n}! Lembrei de você: estamos com ${AJ.condicao}. Quer aproveitar?` : `Oi, ${n}! Seu planejamento continua salvo aqui. Quando fizer sentido pra você, é só me chamar que a gente começa 🙂`, `${n}, como você está? Se quiser, revisamos juntos o plano e as condições. Posso te ligar rapidinho?`],
      30: [`${n}, não quero te incomodar 🙂 Vou deixar seu plano guardado. Se um dia quiser retomar, é só responder esta mensagem. Um abraço da equipe Weiss!`, `Oi, ${n}! Vou encerrar seu acompanhamento por aqui, mas a porta fica aberta. Quando quiser, conte com a gente!`]
    };
    let lista = M[dia];
    if (dia === 3) lista = M[3][obj === "concorrente" ? "preco" : obj] || M[3].padrao;
    return lista[v % lista.length];
  }
  function textoMensagem(p, dia) { return (p.mensagens || {})[dia] || modelo(p, dia, (p.variante || {})[dia] || 0); }
  async function outraVersao(p, dia) {
    const atual = textoMensagem(p, dia);
    if (PLAT && PLAT.ia) {
      const d = await api("POST", "api/ia/mensagem", { paciente: p, dia, toque: CAD.indexOf(dia) + 1, condicao: AJ.condicao, versao_anterior: atual });
      p.mensagens = Object.assign(p.mensagens || {}, { [dia]: d.mensagem });
    } else {
      p.variante = Object.assign(p.variante || {}, { [dia]: ((p.variante || {})[dia] || 0) + 1 });
      if (p.mensagens) delete p.mensagens[dia];
    }
    await Store.salvar(p);
  }
  async function garantirMensagemIA(p, dia) {
    if (!(PLAT && PLAT.ia) || (p.mensagens || {})[dia]) return;
    try {
      const d = await api("POST", "api/ia/mensagem", { paciente: p, dia, toque: CAD.indexOf(dia) + 1, condicao: AJ.condicao });
      p.mensagens = Object.assign(p.mensagens || {}, { [dia]: d.mensagem });
      await Store.salvar(p);
      render();
    } catch (e) { /* fica com o modelo */ }
  }
  const linkWhats = (p, txt) => `https://wa.me/${(digits(p.telefone).length <= 11 ? "55" : "") + digits(p.telefone)}?text=${encodeURIComponent(txt)}`;

  function cardMensagem(p, x) {
    const txt = textoMensagem(p, x.dia);
    const atraso = x.atraso > 0 ? `<span class="pill bad">${x.atraso} dia${x.atraso > 1 ? "s" : ""} de atraso</span>` : `<span class="pill acc">hoje</span>`;
    const obj = (p.objecoes || []).map((o) => OBJ_NOME[o]).filter(Boolean)[0];
    return `<article class="card msgcard" data-id="${p.id}">
      <div class="top"><div class="ava">${esc(iniciais(p.nome))}</div>
        <div class="grow"><h3>${esc(p.nome)}</h3><div class="meta">${esc(p.tratamento || "")} · ${brl(p.valorApresentado)} · ${esc(p.unidade || "")}</div></div>${atraso}</div>
      <div class="row small"><span class="pill">Toque ${x.n} · D${x.dia}</span><span class="dim">${CAD_NOME[x.dia]}</span>${obj ? `<span class="pill warn">${esc(obj)}</span>` : ""}</div>
      <div class="sug"><div class="label" style="margin-bottom:6px">Mensagem sugerida · edite se quiser</div><textarea data-msg="${x.dia}" aria-label="Mensagem para ${esc(p.nome)}">${esc(txt)}</textarea></div>
      <div class="row">
        <button class="btn sm pri" data-act="copiar">Copiar</button>
        <a class="btn sm" data-act="whats" href="${esc(linkWhats(p, txt))}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="btn sm" data-act="outra">↻ Outra versão</button>
        <span class="grow"></span>
        <button class="btn sm" data-act="enviei">Enviei</button>
        <button class="btn sm ghost" data-act="pular">Pular</button>
      </div>
      <div class="tiny dim">WhatsApp: <span class="num">${esc(p.telefone || "—")}</span> · responsável: ${esc(p.responsavel || "—")}</div>
    </article>`;
  }
  // ações dos cartões (delegação)
  document.addEventListener("input", (e) => {
    const ta = e.target.closest("textarea[data-msg]"); if (!ta) return;
    const card = ta.closest("[data-id]"), p = PAC.find((x) => x.id === card.dataset.id); if (!p) return;
    const dia = Number(ta.dataset.msg);
    p.mensagens = Object.assign(p.mensagens || {}, { [dia]: ta.value });
    const a = card.querySelector('[data-act="whats"]'); if (a) a.href = linkWhats(p, ta.value);
    clearTimeout(ta._t); ta._t = setTimeout(() => Store.salvar(p), 600);
  });
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const card = b.closest("[data-id]"); const p = card && PAC.find((x) => x.id === card.dataset.id);
    const act = b.dataset.act;
    if (act === "abrir" && p) return abrirGaveta(p);
    if (!p) return;
    const x = proximo(p);
    const ta = card.querySelector("textarea[data-msg]");
    if (act === "copiar") {
      try { await navigator.clipboard.writeText(ta.value); toast("Mensagem copiada"); }
      catch (err) { ta.focus(); ta.select(); toast("Selecionado: use Ctrl+C para copiar"); }
    } else if (act === "whats") {
      // o link abre o WhatsApp; nada a fazer aqui
    } else if (act === "outra" && x) {
      b.disabled = true; b.textContent = "Gerando…";
      try { await outraVersao(p, x.dia); } catch (err) { toast(err.message); }
      render(); if ($("#drawerHost").innerHTML) abrirGaveta(p);
    } else if ((act === "enviei" || act === "pular") && x && !x.fim) {
      p.toques = Object.assign(p.toques || {}, { [x.dia]: { status: act === "enviei" ? "enviado" : "pulado", em: new Date().toISOString() } });
      await Store.salvar(p); toast(act === "enviei" ? `Toque D${x.dia} registrado` : `D${x.dia} pulado`);
      fecharGaveta(); render();
    }
  });

  /* ------------------------------------------------------------ */
  /* Telas: Hoje e Follow-up                                       */
  /* ------------------------------------------------------------ */
  function kpis(el, itens) {
    $(el).innerHTML = itens.map(([rot, val, sub, hl]) => `<div class="kpi${hl ? " hl" : ""}"><div class="label">${rot}</div><b class="num">${val}</b><span>${sub}</span></div>`).join("");
  }
  function numeros() {
    const abertos = PAC.filter((p) => p.status === "aberto");
    const fila = paraHoje();
    const rec = PAC.filter((p) => p.status === "fechado" && p.recuperado && doMes(p.fechadoEm));
    return {
      emAberto: abertos.reduce((t, p) => t + (p.valorApresentado || 0), 0), nAbertos: abertos.length,
      hoje: fila.length, atrasados: fila.filter((o) => o.x.atraso > 0).length,
      recuperado: rec.reduce((t, p) => t + (p.valorFechado || 0), 0), nRec: rec.length,
      fecharamMes: PAC.filter((p) => p.status === "fechado" && doMes(p.fechadoEm)).length
    };
  }
  function renderHoje() {
    const N = numeros();
    $("#hojeData").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    kpis("#kpisHoje", [
      ["Valor em aberto", brl(N.emAberto), `${N.nAbertos} pacientes em follow-up`],
      ["Para chamar hoje", N.hoje, "mensagens prontas abaixo"],
      ["Atrasados", N.atrasados, N.atrasados ? "comece por estes" : "tudo em dia"],
      ["Recuperado no follow-up", brl(N.recuperado), `${N.nRec} fecharam depois da consulta, no mês`, true]
    ]);
    const fila = paraHoje();
    $("#fila").innerHTML = fila.length ? fila.map((o) => cardMensagem(o.p, o.x)).join("") : `<div class="vazio">Ninguém para chamar hoje. Quando uma consulta terminar sem fechamento, o paciente aparece aqui no dia certo.</div>`;
    fila.forEach((o) => garantirMensagemIA(o.p, o.x.dia));
    const b = $("#badgeHoje"); b.textContent = N.hoje; b.classList.toggle("hide", !N.hoje);
  }
  let filtro = "Todos";
  function renderFollowup() {
    const N = numeros();
    kpis("#kpisFU", [
      ["Valor em aberto", brl(N.emAberto), `${N.nAbertos} pacientes`, true],
      ["Atrasados hoje", N.atrasados, "toques vencidos"],
      ["Fecharam no mês", N.fecharamMes, "pacientes"],
      ["Recuperado", brl(N.recuperado), "fechados pelo follow-up"]
    ]);
    const resp = ["Todos", ...new Set([...(AJ.equipe || []), ...PAC.map((p) => p.responsavel).filter(Boolean)])];
    $("#filtroResp").innerHTML = resp.map((r) => `<button class="${r === filtro ? "on" : ""}" data-f="${esc(r)}">${esc(r)}</button>`).join("");
    const lista = PAC.filter((p) => filtro === "Todos" || p.responsavel === filtro);
    const colunas = CAD.map((d) => ({ d, titulo: `D${d}`, sub: CAD_NOME[d], itens: lista.filter((p) => { const x = proximo(p); return x && !x.fim && x.dia === d; }) }));
    colunas.push({ d: "fim", titulo: "Fim da cadência", sub: "decidir: fechou ou encerrar", itens: lista.filter((p) => { const x = proximo(p); return x && x.fim; }) });
    colunas.push({ d: "ok", titulo: "Fecharam", sub: "no mês", itens: lista.filter((p) => p.status === "fechado" && doMes(p.fechadoEm)) });
    $("#kanban").innerHTML = colunas.map((c) => `<div class="col"><h3>${c.titulo}<span class="pill">${c.itens.length}</span></h3><div class="sub">${c.sub}</div>
      ${c.itens.map((p) => { const x = proximo(p); const cls = x && !x.fim ? (x.atraso > 0 ? "late" : x.atraso === 0 ? "today" : "") : "";
        const quando = !x ? (p.status === "fechado" ? `fechou ${p.fechadoEm ? fmtData(p.fechadoEm) : ""}` : "") : x.fim ? "todos os toques feitos" : x.atraso > 0 ? `<span style="color:var(--bad)">${x.atraso} dia${x.atraso > 1 ? "s" : ""} de atraso</span>` : x.atraso === 0 ? "chamar hoje" : `em ${-x.atraso} dia${x.atraso < -1 ? "s" : ""}`;
        return `<button class="pc ${cls}" data-id="${p.id}" data-act="abrir"><b>${esc(p.nome)}</b><span class="v num">${brl(p.status === "fechado" ? p.valorFechado : p.valorApresentado)}</span><span class="m">${quando}</span><span class="m">${esc(p.responsavel || "")}${(p.objecoes || [])[0] ? " · " + esc(OBJ_NOME[p.objecoes[0]] || "") : ""}</span></button>`; }).join("") || `<span class="tiny dim">vazio</span>`}
    </div>`).join("");
  }
  $("#filtroResp").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { filtro = b.dataset.f; renderFollowup(); } });

  /* gaveta do paciente */
  function abrirGaveta(p) {
    const x = proximo(p);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${esc(p.nome)}" data-id="${p.id}">
      <div class="row"><div class="ava">${esc(iniciais(p.nome))}</div><div class="grow"><h2 style="font-size:20px">${esc(p.nome)}</h2><div class="small dim">${esc(p.tratamento || "")} · ${esc(p.unidade || "")} · consulta em ${fmtData(p.consultaEm)} com ${esc(p.profissional || "—")}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="row">${p.status === "fechado" ? `<span class="pill good">Fechou ${brl(p.valorFechado)}</span>` : p.status === "perdido" ? `<span class="pill bad">Não fechou</span>` : `<span class="pill acc">Em follow-up · ${brl(p.valorApresentado)}</span>`}${(p.objecoes || []).map((o) => `<span class="pill warn">${esc(OBJ_NOME[o] || o)}</span>`).join("")}</div>
      ${p.oQueTravou || p.dor ? `<div class="card small stack" style="gap:6px">${p.dor ? `<div><span class="label">Dor</span><br>${esc(p.dor)}</div>` : ""}${p.oQueTravou ? `<div><span class="label">O que travou</span><br>${esc(p.oQueTravou)}</div>` : ""}${(p.palavras || []).length ? `<div><span class="label">Palavras do paciente</span><br>${p.palavras.map((w) => "“" + esc(w) + "”").join(" · ")}</div>` : ""}</div>` : ""}
      ${x && !x.fim ? cardMensagem(p, x) : ""}
      <div class="card stack"><span class="label">Resultado</span>
        <div class="row"><div class="grow"><label class="f" for="gValor">Valor fechado (R$)</label><input class="in num" id="gValor" inputmode="decimal" value="${p.valorFechado || p.valorApresentado || ""}"></div></div>
        <div class="row"><button class="btn pri" id="gFechou">Fechou</button><button class="btn" id="gPerdeu">Não fechou</button>${p.status !== "aberto" ? `<button class="btn ghost" id="gReabrir">Voltar ao follow-up</button>` : ""}</div>
        <div class="tiny dim">Histórico: ${CAD.filter((d) => (p.toques || {})[d]).map((d) => `D${d} ${p.toques[d].status}`).join(" · ") || "nenhum toque ainda"}</div>
      </div>
      <div class="row">${p.briefing ? `<button class="btn" id="gBriefing">Ver briefing</button>` : ""}<span class="grow"></span><button class="btn ghost" id="gApagar">Apagar paciente</button></div>
    </div></div>`;
    if (x && !x.fim) garantirMensagemIA(p, x.dia);
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    const valor = () => { const v = String($("#gValor").value).replace(/[^\d,.]/g, ""); return Number(v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v) || 0; };
    $("#gFechou").onclick = async () => {
      p.status = "fechado"; p.valorFechado = valor(); p.fechadoEm = new Date().toISOString();
      p.recuperado = inicioDia(p.fechadoEm).getTime() > inicioDia(p.consultaEm).getTime();
      await Store.salvar(p); toast("Fechamento registrado 🎉"); fecharGaveta(); render();
    };
    $("#gPerdeu").onclick = async () => { p.status = "perdido"; await Store.salvar(p); toast("Paciente encerrado"); fecharGaveta(); render(); };
    if ($("#gReabrir")) $("#gReabrir").onclick = async () => { p.status = "aberto"; delete p.fechadoEm; await Store.salvar(p); fecharGaveta(); render(); };
    if ($("#gBriefing")) $("#gBriefing").onclick = () => { fecharGaveta(); briefSel = p.id; mostrar("briefings"); };
    $("#gApagar").onclick = async (e) => {
      if (e.currentTarget.dataset.c !== "1") { e.currentTarget.dataset.c = "1"; e.currentTarget.textContent = "Toque de novo para apagar"; return; }
      await Store.remover(p.id); fecharGaveta(); render(); toast("Paciente apagado");
    };
  }
  function fecharGaveta() { $("#drawerHost").innerHTML = ""; }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharGaveta(); });

  /* ------------------------------------------------------------ */
  /* Briefings                                                     */
  /* ------------------------------------------------------------ */
  let briefSel = null;
  const NIVEL = { bem: ["good", "Bem feito"], atencao: ["warn", "Atenção"], melhorar: ["bad", "Melhorar"] };
  function renderBriefings() {
    const lista = PAC.filter((p) => p.briefing).sort((a, b) => (b.consultaEm > a.consultaEm ? 1 : -1));
    if (!briefSel || !lista.find((p) => p.id === briefSel)) briefSel = lista[0] && lista[0].id;
    $("#blist").innerHTML = lista.length ? lista.map((p) => `<button class="${p.id === briefSel ? "on" : ""}" data-b="${p.id}"><b>${esc(p.nome)}</b><span>${fmtData(p.consultaEm)} · ${esc(p.profissional || "")} · ${p.status === "fechado" ? "fechou" : p.status === "perdido" ? "não fechou" : "em aberto"}</span></button>`).join("")
      : `<div class="vazio">Nenhum briefing ainda. Grave uma consulta (ou veja a demonstração) para gerar o primeiro.</div>`;
    const p = lista.find((x) => x.id === briefSel);
    $("#bdetail").innerHTML = p ? htmlBriefing(p) : "";
  }
  $("#blist").addEventListener("click", (e) => { const b = e.target.closest("[data-b]"); if (b) { briefSel = b.dataset.b; renderBriefings(); } });
  function htmlBriefing(p) {
    const B = p.briefing, a = B.aconteceu || {};
    const desf = { fechado: ["good", "Fechado"], negociacao: ["warn", "Em negociação"], perdido: ["bad", "Não fechou"] }[B.desfecho] || ["warn", "Em negociação"];
    const prazo = B.proximo_passo_prazo_dias != null ? new Date(new Date(p.consultaEm).getTime() + B.proximo_passo_prazo_dias * DIA).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }) : "";
    return `<div class="card stack">
      <div class="row small dim"><span>${esc(p.nome)} · ${esc(p.profissional || "")}${p.duracaoMin ? ` · ${p.duracaoMin} min` : ""} · ${fmtData(p.consultaEm)}</span><span class="grow"></span>
        <span class="pill ${B.temperatura === "quente" ? "good" : B.temperatura === "frio" ? "bad" : "warn"}">${B.temperatura === "quente" ? "🔥 quente" : B.temperatura === "frio" ? "❄️ frio" : "🌤️ morno"}</span>${B.nota != null ? `<span class="pill">nota ${esc(B.nota)}/10</span>` : ""}${p.exemplo || B.exemplo ? `<span class="pill">exemplo</span>` : ""}</div>
      <div class="manchete">${esc(B.manchete || "")}</div>
      <div class="bk">
        <div><span class="label">Desfecho</span><strong><span class="pill ${desf[0]}">${desf[1]}</span></strong><span>${esc(B.desfecho_detalhe || "")}</span></div>
        <div><span class="label">Valor ${B.valor_fechado ? "fechado" : "apresentado"}</span><strong class="num">${brl(B.valor_fechado || B.valor_apresentado)}</strong><span>${B.valor_fechado && B.valor_apresentado ? "de " + brl(B.valor_apresentado) + " apresentados" : esc(B.tratamento || "")}</span></div>
        <div><span class="label">O que mais travou</span><strong>${esc(B.o_que_travou || "—")}</strong><span>${esc(B.o_que_travou_detalhe || "")}</span></div>
        <div><span class="label">Próximo passo</span><strong>${esc(B.proximo_passo || "—")}</strong><span>${esc(B.proximo_passo_quem || "")}${prazo ? " · até " + prazo : ""}</span></div>
      </div>
      <h3 style="margin-top:6px">O que aconteceu na consulta</h3>
      <div class="aconteceu">
        ${[["Por que veio", a.por_que_veio], ["O que o exame mostrou", a.o_que_o_exame_mostrou], ["O que foi proposto", a.o_que_foi_proposto], ["Como terminou", a.como_terminou]].map(([t, v], i) => `<div><i>${i + 1}</i><div><span class="label">${t}</span><p>${esc(v || "—")}</p></div></div>`).join("")}
      </div>
      ${(B.avaliacao || []).length ? `<h3 style="margin-top:6px">Como foi a condução</h3><div class="aval">${B.avaliacao.map((v) => { const nv = NIVEL[v.nivel] || NIVEL.atencao; return `<div class="a"><div><b>${esc(v.etapa)}</b><br><span class="pill ${nv[0]}" style="margin-top:6px">${nv[1]}</span><p class="small dim" style="margin:6px 0 0">${esc(v.resumo || "")}</p></div>
        <div class="box peso"><span class="label">Por que pesa</span>${esc(v.por_que_pesa || "")}</div><div class="box como"><span class="label">Como fazer da próxima</span>${esc(v.como_fazer || "")}</div></div>`; }).join("")}</div>` : ""}
      ${(B.palavras_do_paciente || []).length ? `<div class="small"><span class="label">Palavras do paciente (usadas nas mensagens)</span><br>${B.palavras_do_paciente.map((w) => "“" + esc(w) + "”").join(" · ")}</div>` : ""}
      <div class="row"><button class="btn pri" data-id="${p.id}" data-act="abrir">Mensagem e follow-up</button>${PLAT && PLAT.kommo ? `<button class="btn" id="btnKommo" data-k="${p.id}">Enviar ao Kommo</button>` : ""}<span class="small dim" id="kommoSt"></span></div>
    </div>`;
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("#btnKommo"); if (!b) return;
    const p = PAC.find((x) => x.id === b.dataset.k), B = p.briefing;
    b.disabled = true; $("#kommoSt").textContent = "Enviando…";
    try {
      const resumo = `ALINHA — BRIEFING\n${B.manchete}\nDesfecho: ${B.desfecho} · ${B.o_que_travou}\nPróximo passo: ${B.proximo_passo}\n\nPor que veio: ${(B.aconteceu || {}).por_que_veio}\nProposto: ${(B.aconteceu || {}).o_que_foi_proposto}\nComo terminou: ${(B.aconteceu || {}).como_terminou}`;
      const d = await api("POST", "api/kommo/registrar", {
        paciente: { nome: p.nome, telefone: digits(p.telefone), lead_id: p.leadId || null },
        consulta: { canal: "presencial", unidade: p.unidade, compareceu: true },
        orcamento: { valor: B.valor_fechado || B.valor_apresentado || 0, tratamento: B.tratamento },
        resultado: B.desfecho, resumo, temperatura: B.temperatura === "quente" ? 80 : 50,
        transcricao: (p.transcricao || []).map((m) => ({ quem: m.quem === "paciente" ? "cliente" : "clinica", texto: m.texto }))
      });
      p.leadId = d.lead_id; await Store.salvar(p);
      $("#kommoSt").textContent = "✓ Registrado no Kommo (lead " + d.lead_id + ")";
    } catch (err) { $("#kommoSt").textContent = "Erro: " + err.message; }
    b.disabled = false;
  });

  /* ------------------------------------------------------------ */
  /* Consulta ao vivo                                              */
  /* ------------------------------------------------------------ */
  const MOMENTOS = ["Acolhimento", "Investigação", "Diagnóstico", "Apresentação", "Negociação", "Fechamento"];
  const PISTAS = [
    [1, ["incomoda", "vergonha", "procurar", "ha anos", "foto", "motivo", "casar", "casamento", "formatura"]],
    [2, ["itero", "escane", "simula", "3d", "radiograf", "exame"]],
    [3, ["recomendo", "invisalign", "alinhador", "indicado", "plano de tratamento", "aparelho fixo"]],
    [4, ["investimento", "valor", "reais", "parcela", "vezes", "entrada", "caro", "orcamento"]],
    [5, ["comecar", "agendar", "reservar", "data de inicio", "fechado", "fechar", "vamos fazer", "proxima semana"]]
  ];
  const DICA_OBJ = {
    preco: "Segure o desconto. Descubra com o que está comparando e traduza o valor em parcela mensal.",
    pensar: "“Vou pensar” esconde outra dúvida. Pergunte: o que exatamente ficou em aberto?",
    decisor: "Pergunte: se dependesse só de você, começaria? Depois convide quem decide para ver a simulação.",
    concorrente: "Compare tratamento com tratamento: pergunte o que está incluído no outro orçamento.",
    dor: "Acolha o medo e explique em uma frase: só uma leve pressão nos primeiros dias de cada troca.",
    tempo_tratamento: "Ligue ao prazo que o paciente citou: o planejamento digital já mostra a previsão.",
    funciona: "Mostre um caso parecido e reforce o acompanhamento. Não prometa resultado.",
    sem_tempo: "Rotina cheia favorece o Invisalign: consultas espaçadas e sem emergências.",
    fixo: "Pergunte o que pesa mais: o investimento menor ou a discrição no dia a dia.",
    idade: "Não há idade limite com gengiva saudável. Mostre casos de adultos.",
    convenio: "Explique com clareza que o plano não cobre alinhadores e apresente a condição de pagamento.",
    distancia: "Lembre das duas unidades e das consultas espaçadas.",
    estetica: "Coloque um alinhador na mão do paciente: transparente, quase ninguém percebe."
  };
  const regex = new Map();
  const casa = (txt, gat) => { const t = norm(txt); return gat.some((g) => { if (!regex.has(g)) { const n = norm(g).replace(/ /g, "\\s"); regex.set(g, n.length <= 4 ? new RegExp("(^|\\s)" + n + "(s|es)?(\\s|$)") : new RegExp("(^|\\s)" + n)); } return regex.get(g).test(t); }); };

  let C = null; // sessão de consulta
  function novaSessao() {
    return { inicio: null, seg: 0, gravando: false, pausado: false, momento: 0, falas: [], dicas: [], objecoes: new Set(), demo: false, ultimaIA: 0 };
  }
  C = novaSessao();
  let quem = "paciente", tick = null, sr = null, stream = null, tipTimer = null, demoTimer = null;

  function renderMomento() {
    $("#momentoNome").textContent = MOMENTOS[C.momento];
    $("#momentoSteps").innerHTML = MOMENTOS.map((m, i) => `<i class="${i < C.momento ? "done" : i === C.momento ? "cur" : ""}"></i>`).join("");
    $("#momentoNames").innerHTML = MOMENTOS.map((m, i) => `<span class="${i === C.momento ? "cur" : ""}">${m}</span>`).join("");
  }
  function avancarMomento(txt) {
    const t = norm(txt);
    PISTAS.forEach(([i, ps]) => { if (i > C.momento && ps.some((p) => t.includes(p))) C.momento = Math.min(i, C.momento + 2); });
    renderMomento();
  }
  function mostrarDica(d) {
    if (!d || !d.dica) return;
    if (C.dicas.some((x) => x.dica === d.dica)) return;
    C.dicas.unshift(d);
    const el = $("#dica");
    el.classList.remove("idle");
    el.innerHTML = `<div class="rot"><b>${esc(d.rotulo || "Dica")}</b>${d.fonte === "ia" ? (C.demo ? "IA · demonstração" : "IA") : "roteiro"} · agora</div>
      <div class="txt">${esc(d.dica)}</div>
      ${d.citacao ? `<div class="cit"><b>Paciente</b>“${esc(d.citacao)}”</div>` : ""}
      <div class="bar"><i id="tipBar"></i></div><div class="tiny" style="color:var(--tip-dim)">some em 12 s</div>`;
    const bar = $("#tipBar"); bar.style.transition = "none"; bar.style.width = "100%";
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transition = "width 12s linear"; bar.style.width = "0%"; }));
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => { el.classList.add("idle"); el.innerHTML = `<div class="txt">Ouvindo a conversa…</div>`; }, 12000);
    $("#hist").innerHTML = C.dicas.map((x) => `<div class="h"><b>${esc(x.rotulo || "Dica")}: ${esc(x.dica)}</b>${x.citacao ? `<span>“${esc(x.citacao)}”</span>` : ""}</div>`).join("");
    $("#histCount").textContent = C.dicas.length + " dica" + (C.dicas.length > 1 ? "s" : "");
  }
  function analisarLocal(f) {
    if (f.quem !== "paciente") return;
    BIB.objecoes.forEach((o) => { if (casa(f.texto, o.gatilhos)) { C.objecoes.add(o.id); mostrarDica({ rotulo: o.titulo, tipo: "objecao", dica: DICA_OBJ[o.id] || o.proximo, citacao: f.texto.slice(0, 110), fonte: "roteiro" }); } });
    const pc = BIB.intencoes.find((i) => i.id === "preco_cedo");
    if (C.momento < 4 && casa(f.texto, pc.gatilhos)) mostrarDica({ rotulo: "Preço cedo", tipo: "alerta", dica: "Perguntou o preço antes da hora. Valorize o diagnóstico e a simulação antes de falar valor.", citacao: f.texto.slice(0, 110), fonte: "roteiro" });
    if (casa(f.texto, BIB.sinaisCompra)) mostrarDica({ rotulo: "Sinal de compra", tipo: "sinal_compra", dica: "Sinal de compra! Pare de apresentar: ofereça duas datas de início e o próximo passo.", citacao: f.texto.slice(0, 110), fonte: "roteiro" });
  }
  async function dicaIA() {
    if (!(PLAT && PLAT.ia) || C.demo) return;
    if (Date.now() - C.ultimaIA < 12000) return;
    C.ultimaIA = Date.now();
    try {
      const d = await api("POST", "api/ia/dica", { momento: MOMENTOS[C.momento], transcricao: C.falas.slice(-40), ja_mostradas: C.dicas.slice(0, 8).map((x) => x.dica) });
      const i = MOMENTOS.indexOf(d.momento); if (i > C.momento) { C.momento = i; renderMomento(); }
      if (d.dica) mostrarDica({ ...d, fonte: "ia" });
    } catch (e) { /* segue com as dicas do roteiro */ }
  }
  function addFala(q, texto, extra) {
    texto = String(texto || "").trim(); if (!texto) return;
    const f = { quem: q, texto, t: C.seg };
    C.falas.push(f);
    const tr = $("#trans");
    if (C.falas.length === 1) tr.innerHTML = "";
    tr.insertAdjacentHTML("beforeend", `<p class="${q === "paciente" ? "pac" : ""}"><b>${q === "paciente" ? "Paciente" : "Profissional"}</b>${esc(texto)}</p>`);
    tr.scrollTop = tr.scrollHeight;
    avancarMomento(texto);
    if (extra && extra.dica) mostrarDica({ ...extra.dica, citacao: texto.slice(0, 110), fonte: "ia" });
    else analisarLocal(f);
    if (q === "paciente") dicaIA();
  }
  const mmss = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  function estadoBotoes() {
    const on = C.gravando;
    $("#btnIniciar").classList.toggle("hide", on); $("#btnPausar").classList.toggle("hide", !on); $("#btnParar").classList.toggle("hide", !on);
    $("#recState").classList.toggle("hide", !on || C.pausado);
    $("#btnPausar").textContent = C.pausado ? "▶" : "❚❚";
    $("#btnIniciar").disabled = !$("#chkConsent").checked;
  }
  function iniciarRelogio() {
    clearInterval(tick);
    tick = setInterval(() => { if (C.gravando && !C.pausado) { C.seg++; $("#timer").textContent = mmss(C.seg); } }, 1000);
  }
  function reiniciarTela() {
    C = novaSessao(); $("#timer").textContent = "00:00"; renderMomento();
    $("#trans").innerHTML = `<p class="dim">A conversa aparece aqui.</p>`;
    $("#hist").innerHTML = `<p class="small dim" style="margin:0">Nenhuma dica ainda.</p>`; $("#histCount").textContent = "";
    const el = $("#dica"); el.classList.add("idle"); el.innerHTML = `<div class="txt">As dicas aparecem aqui assim que o paciente falar algo importante: uma objeção, uma dúvida ou um sinal de que quer fechar.</div>`;
  }
  $("#chkConsent").addEventListener("change", estadoBotoes);
  $("#segQuem").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; quem = b.dataset.q; $$("#segQuem button").forEach((x) => x.classList.toggle("on", x === b)); });
  $("#btnFala").addEventListener("click", () => { addFala(quem, $("#inFala").value); $("#inFala").value = ""; });
  $("#inFala").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#btnFala").click(); });

  $("#btnIniciar").addEventListener("click", async () => {
    if (C.falas.length && !C.gravando) reiniciarTela();
    C.gravando = true; C.inicio = new Date().toISOString();
    estadoBotoes(); iniciarRelogio();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { $("#recHint").textContent = "O microfone não foi liberado neste aparelho. Digite as falas no campo da transcrição ou veja a consulta de demonstração."; return; }
    if (!SR) { $("#recHint").textContent = "A transcrição automática funciona no Google Chrome. Neste navegador, digite as falas principais."; return; }
    sr = new SR(); sr.lang = "pt-BR"; sr.continuous = true; sr.interimResults = false;
    sr.onresult = (ev) => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) addFala(quem, ev.results[i][0].transcript); };
    sr.onend = () => { if (C.gravando && !C.pausado) { try { sr.start(); } catch (e) { /* já ativo */ } } };
    try { sr.start(); $("#recHint").textContent = "Escutando. Toque em Paciente ou Profissional para indicar quem fala."; } catch (e) { /* */ }
  });
  $("#btnPausar").addEventListener("click", () => {
    C.pausado = !C.pausado; estadoBotoes();
    if (sr) { try { C.pausado ? sr.stop() : sr.start(); } catch (e) { /* */ } }
  });
  function pararCaptura() {
    C.gravando = false; clearInterval(tick); clearInterval(demoTimer);
    try { sr && sr.stop(); } catch (e) { /* */ } sr = null;
    stream && stream.getTracks().forEach((t) => t.stop()); stream = null;
    estadoBotoes();
  }
  $("#btnParar").addEventListener("click", async () => {
    pararCaptura();
    if (!C.falas.length) { toast("Nada foi registrado nesta consulta"); return; }
    const b = $("#btnParar"); b.classList.remove("hide"); b.disabled = true; b.textContent = "Gerando briefing…";
    try { await gerarBriefing(); } catch (e) { toast("Não foi possível gerar o briefing: " + e.message); }
    b.disabled = false; b.textContent = "■ Parar e gerar briefing"; b.classList.add("hide");
  });

  function briefingLocal() {
    const objs = [...C.objecoes];
    const pac = C.falas.filter((f) => f.quem === "paciente");
    return {
      paciente: primeiro($("#cNome").value), manchete: "Consulta registrada. Revise o desfecho e o valor na ficha do paciente.",
      desfecho: "negociacao", desfecho_detalhe: "", valor_apresentado: null, valor_fechado: null, tratamento: "",
      o_que_travou: objs[0] ? OBJ_NOME[objs[0]] : "—", o_que_travou_detalhe: "", proximo_passo: "Enviar o resumo do plano hoje (D0)", proximo_passo_quem: "Comercial", proximo_passo_prazo_dias: 0,
      aconteceu: { por_que_veio: (pac[0] || {}).texto || "", o_que_o_exame_mostrou: "", o_que_foi_proposto: "", como_terminou: (pac[pac.length - 1] || {}).texto || "" },
      avaliacao: [], objecoes: objs, palavras_do_paciente: pac.slice(0, 3).map((f) => f.texto.slice(0, 90)), dor: "", evento: "", decisor: "", temperatura: "morno", nota: null
    };
  }
  async function gerarBriefing() {
    let B;
    if (C.demo) B = { ...DEMO.consulta.briefing, exemplo: true };
    else if (PLAT && PLAT.ia) B = (await api("POST", "api/ia/briefing", { transcricao: C.falas, profissional: $("#cProf").value, unidade: $("#cUnidade").value, duracao_min: Math.max(1, Math.round(C.seg / 60)) }));
    else B = briefingLocal();
    delete B.ok;
    const nome = $("#cNome").value.trim() || B.paciente || "Paciente";
    const p = {
      id: novoId(), exemplo: C.demo || undefined, nome, telefone: $("#cTel").value.trim(), unidade: $("#cUnidade").value, profissional: $("#cProf").value, responsavel: $("#cProf").value,
      tratamento: B.tratamento || "", valorApresentado: B.valor_apresentado || null, valorFechado: B.valor_fechado || null,
      status: B.desfecho === "fechado" ? "fechado" : B.desfecho === "perdido" ? "perdido" : "aberto",
      fechadoEm: B.desfecho === "fechado" ? new Date().toISOString() : undefined,
      consultaEm: C.inicio || new Date().toISOString(), duracaoMin: Math.max(1, Math.round(C.seg / 60)),
      dor: B.dor || "", evento: B.evento || "", decisor: B.decisor || "", objecoes: B.objecoes || [], palavras: B.palavras_do_paciente || [], oQueTravou: B.o_que_travou || "",
      briefing: B, transcricao: C.falas, toques: {}
    };
    await Store.salvar(p);
    briefSel = p.id; mostrar("briefings"); toast("Briefing pronto");
  }

  /* consulta de demonstração */
  $("#btnDemoConsulta").addEventListener("click", () => {
    pararCaptura(); reiniciarTela();
    C.demo = true; C.gravando = true; C.inicio = new Date().toISOString();
    const P = DEMO.consulta.paciente; $("#cNome").value = P.nome; $("#cTel").value = P.telefone; $("#cUnidade").value = P.unidade;
    $("#chkConsent").checked = true; estadoBotoes(); iniciarRelogio();
    $("#recHint").textContent = "Demonstração: uma consulta simulada, acelerada. No uso real, o Alinha escuta pelo microfone.";
    let i = 0; const falas = DEMO.consulta.falas;
    clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      if (C.pausado) return;
      const f = falas[i++]; if (!f) { clearInterval(demoTimer); $("#recHint").textContent = "Fim da demonstração. Toque em “Parar e gerar briefing”."; return; }
      C.seg += 17; $("#timer").textContent = mmss(C.seg);
      addFala(f.quem, f.texto, f);
    }, 3200);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ------------------------------------------------------------ */
  /* Ajustes                                                       */
  /* ------------------------------------------------------------ */
  function renderAjustes() {
    $("#aEquipe").value = (AJ.equipe || []).join(", ");
    $("#aCondicao").value = AJ.condicao || "";
    $("#dadosInfo").textContent = PLAT ? "Os dados ficam no servidor do Alinha e são compartilhados com a equipe." : "Modo demonstração: os dados ficam só neste navegador.";
    const profs = [...new Set([...(AJ.equipe || []), ...PAC.map((p) => p.profissional).filter(Boolean)])];
    const atual = $("#cProf").value;
    $("#cProf").innerHTML = profs.map((n) => `<option${n === atual ? " selected" : ""}>${esc(n)}</option>`).join("");
  }
  $("#btnSalvarAjustes").addEventListener("click", async () => {
    try {
      await Store.ajustes({ equipe: $("#aEquipe").value.split(",").map((s) => s.trim()).filter(Boolean), condicao: $("#aCondicao").value.trim() });
      $("#ajStatus").textContent = "✓ Salvo"; render();
    } catch (e) { $("#ajStatus").textContent = "Erro: " + e.message; }
  });
  $("#tema").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const t = b.dataset.t; ls.set("alinha.tema", t); aplicarTema(t);
  });
  function aplicarTema(t) {
    if (t === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", t);
    $$("#tema button").forEach((x) => x.classList.toggle("on", x.dataset.t === t));
  }
  async function trocarExemplos(carregar) {
    for (const p of PAC.filter((x) => x.exemplo)) await Store.remover(p.id);
    if (carregar) for (const p of DEMO.pacientes()) await Store.salvar(p);
    render(); toast(carregar ? "Exemplos carregados" : "Exemplos removidos");
  }
  $("#btnExemplos").addEventListener("click", () => trocarExemplos(true));
  $("#btnLimparExemplos").addEventListener("click", () => trocarExemplos(false));
  $("#btnApagarTudo").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = "Toque de novo para apagar tudo"; setTimeout(() => { b.dataset.c = ""; b.textContent = "Apagar todos os dados"; }, 4000); return; }
    for (const p of [...PAC]) await Store.remover(p.id);
    b.dataset.c = ""; b.textContent = "Apagar todos os dados"; render(); toast("Dados apagados");
  });

  /* ------------------------------------------------------------ */
  /* Navegação e início                                            */
  /* ------------------------------------------------------------ */
  let vista = "hoje";
  function mostrar(v) {
    vista = v;
    $$("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    render(); window.scrollTo({ top: 0 });
  }
  $("#nav").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) mostrar(b.dataset.v); });
  function render() {
    $("#bannerDemo").classList.toggle("hide", !PAC.some((p) => p.exemplo));
    renderHoje();
    if (vista === "followup") renderFollowup();
    if (vista === "briefings") renderBriefings();
    if (vista === "ajustes") renderAjustes();
  }

  async function iniciar() {
    aplicarTema(ls.get("alinha.tema", "auto"));
    renderMomento();
    if (location.protocol !== "file:") {
      try { const r = await fetch("api/config", { headers: { Accept: "application/json" } }); if (r.ok) { const d = await r.json(); if (d.plataforma) PLAT = d; } } catch (e) { /* sem servidor: modo demonstração */ }
    }
    $("#modoInfo").innerHTML = PLAT ? `Conectado · IA ${PLAT.ia ? "ativa" : "desligada"}<br><a href="sair" style="color:inherit">Sair</a>` : "Modo demonstração";
    $("#pillIA").textContent = PLAT && PLAT.ia ? "IA ouvindo + roteiro" : "Dicas do roteiro";
    try { await Store.carregar(); } catch (e) { toast("Não foi possível carregar os dados: " + e.message); }
    renderAjustes(); render();
  }
  iniciar();
})();
