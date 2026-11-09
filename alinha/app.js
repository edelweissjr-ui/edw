/* ALINHA — copiloto de fechamento da Weiss Odontologia
   Telas: Hoje (mensagens prontas) · Consulta ao vivo · Briefings · Follow-up D0–D30 · Ajustes.
   Funciona em dois modos:
   • Plataforma (servidor do Alinha): dados da equipe no servidor + IA (Claude);
   • Demonstração/local: dados neste navegador, dicas do roteiro e briefing de exemplo. */
(function () {
  "use strict";
  const BIB = window.ROTEIRO, DEMO = window.ALINHA_DEMO;
  /* Versão: na plataforma, vem do servidor (package.json) no momento em que a tela abriu.
     Ao publicar uma atualização, aumente a versão em package.json e registre em NOVIDADES. */
  let VERSAO = "1.3.0";
  const NOVIDADES = [
    { v: "1.3.0", data: "nov/2026", itens: ["Método de vendas: SPIN, N.E.A.T., Venda conceitual, SNAP, Venda desafiadora, Sandler e Venda centrada no cliente", "Painel Método na consulta: perguntas SPIN, qualificação N.E.A.T., contrato inicial e próxima pergunta sugerida", "Briefing avalia a consulta por técnica e mostra a pergunta que faltou", "IA usa as técnicas nas dicas, no WhatsApp e no follow-up"] },
    { v: "1.2.0", data: "nov/2026", itens: ["WhatsApp ao vivo: conversas de Caruaru e Recife chegam pelo Kommo, com o que responder em cada mensagem", "Termômetro por conversa, Assumir atendimento (pausa a IA do n8n) e Adicionar ao follow-up", "Perfis de administrador e equipe"] },
    { v: "1.1.0", data: "nov/2026", itens: ["Atualizações dentro do sistema: aviso de nova versão e botão Atualizar agora", "Cópia de segurança automática dos dados (diária e antes de cada atualização)", "Reconhecimento da voz do profissional", "Modo sequência para alinhar os pacientes do dia", "Termômetro de prontidão para o fechamento"] },
    { v: "1.0.0", data: "nov/2026", itens: ["Dicas ao vivo, briefing pós-consulta, mensagem pronta e follow-up D0 a D30"] }
  ];
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
    // vence no dia da cadência, mas nunca antes do intervalo mínimo desde o último contato (evita 2 mensagens no mesmo dia)
    let due = new Date(inicioDia(p.consultaEm).getTime() + dia * DIA);
    const k = CAD.indexOf(dia), ant = CAD[k - 1];
    if (k > 0 && toques[ant] && toques[ant].em) {
      const minimo = new Date(inicioDia(toques[ant].em).getTime() + (dia - ant) * DIA);
      if (minimo > due) due = minimo;
    }
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
  const miniTermo = (v) => v == null ? "" : `<span class="minitermo" title="Prontidão para o fechamento">🌡 <i><b style="width:${v}%"></b></i>${v}%</span>`;
  const linkWhats = (p, txt) => `https://wa.me/${(digits(p.telefone).length <= 11 ? "55" : "") + digits(p.telefone)}?text=${encodeURIComponent(txt)}`;

  function cardMensagem(p, x) {
    const txt = textoMensagem(p, x.dia);
    const atraso = x.atraso > 0 ? `<span class="pill bad">${x.atraso} dia${x.atraso > 1 ? "s" : ""} de atraso</span>` : `<span class="pill acc">hoje</span>`;
    const obj = (p.objecoes || []).map((o) => OBJ_NOME[o]).filter(Boolean)[0];
    return `<article class="card msgcard" data-id="${p.id}">
      <div class="top"><div class="ava">${esc(iniciais(p.nome))}</div>
        <div class="grow"><h3>${esc(p.nome)}</h3><div class="meta">${esc(p.tratamento || "")} · ${brl(p.valorApresentado)} · ${esc(p.unidade || "")}</div>${miniTermo(p.prontidao)}</div>${atraso}</div>
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
      render(); if (SEQ) renderSeq(); else if ($("#drawerHost").innerHTML) abrirGaveta(p);
    } else if ((act === "enviei" || act === "pular") && x && !x.fim) {
      p.toques = Object.assign(p.toques || {}, { [x.dia]: { status: act === "enviei" ? "enviado" : "pulado", em: new Date().toISOString() } });
      await Store.salvar(p);
      if (SEQ) { SEQ.feitos[p.id] = act === "enviei" ? "enviado" : "pulado"; SEQ.i++; render(); renderSeq(); return; }
      toast(act === "enviei" ? `Toque D${x.dia} registrado` : `D${x.dia} pulado`);
      fecharGaveta(); render();
    }
  });

  /* ------------------------------------------------------------ */
  /* Telas: Hoje e Follow-up                                       */
  /* ------------------------------------------------------------ */
  function kpis(el, itens) {
    $(el).innerHTML = itens.map(([rot, val, sub, hl, seq]) => seq
      ? `<button class="kpi click${hl ? " hl" : ""}" data-seq="${seq}" ${val ? "" : "disabled"}><div class="label">${rot}</div><b class="num">${val}</b><span>${sub}</span>${val ? `<em class="go">Alinhar em sequência →</em>` : ""}</button>`
      : `<div class="kpi${hl ? " hl" : ""}"><div class="label">${rot}</div><b class="num">${val}</b><span>${sub}</span></div>`).join("");
  }
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-seq]"); if (b && !b.disabled) abrirSequencia(b.dataset.seq); });

  /* ------------------------------------------------------------ */
  /* Modo sequência: um paciente por vez, até chamar todos         */
  /* ------------------------------------------------------------ */
  let SEQ = null;
  function abrirSequencia(tipo) {
    const lista = paraHoje().filter((o) => tipo !== "atrasados" || o.x.atraso > 0);
    if (!lista.length) { toast("Ninguém para alinhar agora"); return; }
    SEQ = { tipo, ids: lista.map((o) => o.p.id), i: 0, feitos: {} };
    renderSeq();
  }
  function renderSeq() {
    if (!SEQ) return;
    const total = SEQ.ids.length;
    // pula quem já não tem toque pendente para hoje (ex.: resolvido em outra aba)
    while (SEQ.i < total) { const p = PAC.find((x) => x.id === SEQ.ids[SEQ.i]); const x = p && proximo(p); if (p && x && !x.fim && x.atraso >= 0 && !SEQ.feitos[p.id]) break; SEQ.i++; }
    const pontos = SEQ.ids.map((id, k) => `<i class="${SEQ.feitos[id] === "enviado" ? "ok" : SEQ.feitos[id] === "pulado" ? "skip" : k === SEQ.i ? "cur" : ""}"></i>`).join("");
    const titulo = SEQ.tipo === "atrasados" ? "Atrasados" : "Alinhar hoje";
    let corpo;
    if (SEQ.i >= total) {
      const env = Object.values(SEQ.feitos).filter((v) => v === "enviado").length, pul = Object.values(SEQ.feitos).filter((v) => v === "pulado").length;
      corpo = `<div class="seqfim"><div style="font-size:44px">🎉</div><h2>Pronto! Você passou por todos.</h2><p class="dim">${env === 1 ? "1 mensagem enviada" : env + " mensagens enviadas"}${pul ? ` · ${pul} pulado${pul > 1 ? "s" : ""}` : ""}. Amanhã o Alinha prepara a próxima lista.</p><button class="btn pri" id="seqFechar2">Concluir</button></div>`;
    } else {
      const p = PAC.find((x) => x.id === SEQ.ids[SEQ.i]), x = proximo(p);
      garantirMensagemIA(p, x.dia);
      const ctx = [p.dor && `<div><span class="label">Dor</span><br>${esc(p.dor)}</div>`, p.oQueTravou && `<div><span class="label">O que travou</span><br>${esc(p.oQueTravou)}</div>`, (p.palavras || []).length && `<div><span class="label">Palavras do paciente</span><br>${p.palavras.slice(0, 2).map((w) => "“" + esc(w) + "”").join(" · ")}</div>`].filter(Boolean).join("");
      corpo = `${ctx ? `<div class="seqctx small">${ctx}</div>` : ""}${cardMensagem(p, x)}
        <div class="row"><button class="btn ghost" id="seqAnt" ${SEQ.i === 0 ? "disabled" : ""}>← Anterior</button><span class="grow"></span><button class="btn ghost" id="seqProx">Deixar para depois →</button></div>`;
    }
    $("#drawerHost").innerHTML = `<div class="veil center" id="veil"><div class="seq" role="dialog" aria-label="${titulo} em sequência">
      <div class="row"><div class="grow"><span class="label">${titulo} · em sequência</span><h2 style="font-size:22px;margin-top:2px">${Math.min(SEQ.i + 1, total)} de ${total}</h2></div><button class="btn sm ghost" id="seqFechar" aria-label="Fechar">✕</button></div>
      <div class="seqdots">${pontos}</div>${corpo}</div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#seqFechar").onclick = fecharGaveta;
    if ($("#seqFechar2")) $("#seqFechar2").onclick = fecharGaveta;
    if ($("#seqAnt")) $("#seqAnt").onclick = () => { let k = SEQ.i - 1; while (k > 0 && SEQ.feitos[SEQ.ids[k]]) k--; if (!SEQ.feitos[SEQ.ids[k]]) { SEQ.i = k; renderSeq(); } };
    if ($("#seqProx")) $("#seqProx").onclick = () => { SEQ.feitos[SEQ.ids[SEQ.i]] = "depois"; SEQ.i++; renderSeq(); };
    const ta = $("#drawerHost textarea[data-msg]"); if (ta) ta.focus({ preventScroll: true });
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
    const bs = $("#btnSeqHoje"); if (bs) { bs.classList.toggle("hide", !N.hoje); bs.textContent = `▶ Alinhar em sequência (${N.hoje})`; }
    $("#hojeData").textContent = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    kpis("#kpisHoje", [
      ["Valor em aberto", brl(N.emAberto), `${N.nAbertos} pacientes em follow-up`],
      ["Para alinhar hoje", N.hoje, N.hoje ? "toque para alinhar um por um" : "ninguém hoje", false, "hoje"],
      ["Atrasados", N.atrasados, N.atrasados ? "comece por estes" : "tudo em dia", false, "atrasados"],
      ["Recuperado no follow-up", brl(N.recuperado), `${N.nRec} fecharam depois da consulta, no mês`, true]
    ]);
    const fila = paraHoje();
    $("#fila").innerHTML = fila.length ? fila.map((o) => cardMensagem(o.p, o.x)).join("") : `<div class="vazio">Ninguém para alinhar hoje. Quando uma consulta terminar sem fechamento, o paciente aparece aqui no dia certo.</div>`;
    fila.forEach((o) => garantirMensagemIA(o.p, o.x.dia));
    const b = $("#badgeHoje"); b.textContent = N.hoje; b.classList.toggle("hide", !N.hoje);
  }
  let filtro = "Todos";
  function renderFollowup() {
    const N = numeros();
    kpis("#kpisFU", [
      ["Valor em aberto", brl(N.emAberto), `${N.nAbertos} pacientes`, true],
      ["Atrasados hoje", N.atrasados, "toques vencidos", false, "atrasados"],
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
        const quando = !x ? (p.status === "fechado" ? `fechou ${p.fechadoEm ? fmtData(p.fechadoEm) : ""}` : "") : x.fim ? "todos os toques feitos" : x.atraso > 0 ? `<span style="color:var(--bad)">${x.atraso} dia${x.atraso > 1 ? "s" : ""} de atraso</span>` : x.atraso === 0 ? "alinhar hoje" : `em ${-x.atraso} dia${x.atraso < -1 ? "s" : ""}`;
        return `<button class="pc ${cls}" data-id="${p.id}" data-act="abrir"><b>${esc(p.nome)}</b><span class="v num">${brl(p.status === "fechado" ? p.valorFechado : p.valorApresentado)}</span><span class="m">${quando}</span>${p.status === "aberto" ? miniTermo(p.prontidao) : ""}<span class="m">${esc(p.responsavel || "")}${(p.objecoes || [])[0] ? " · " + esc(OBJ_NOME[p.objecoes[0]] || "") : ""}</span></button>`; }).join("") || `<span class="tiny dim">vazio</span>`}
    </div>`).join("");
  }
  $("#filtroResp").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { filtro = b.dataset.f; renderFollowup(); } });

  /* gaveta do paciente */
  function abrirGaveta(p) {
    const x = proximo(p);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${esc(p.nome)}" data-id="${p.id}">
      <div class="row"><div class="ava">${esc(iniciais(p.nome))}</div><div class="grow"><h2 style="font-size:22px">${esc(p.nome)}</h2><div class="small dim">${esc(p.tratamento || "")} · ${esc(p.unidade || "")} · consulta em ${fmtData(p.consultaEm)} com ${esc(p.profissional || "—")}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
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
  function fecharGaveta() { $("#drawerHost").innerHTML = ""; if (SEQ) { SEQ = null; render(); } }
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
        <span class="pill ${B.temperatura === "quente" ? "good" : B.temperatura === "frio" ? "bad" : "warn"}">${B.temperatura === "quente" ? "🔥 quente" : B.temperatura === "frio" ? "❄️ frio" : "🌤️ morno"}</span>${miniTermo(B.prontidao ?? p.prontidao)}${B.nota != null ? `<span class="pill">nota ${esc(B.nota)}/10</span>` : ""}${p.exemplo || B.exemplo ? `<span class="pill">exemplo</span>` : ""}</div>
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
      ${B.metodos ? (() => { const M = B.metodos, ch = (ok, t) => `<span class="pill ${ok ? "good" : ""}">${ok ? "✓ " : ""}${t}</span>`;
        return `<h3 style="margin-top:6px">Métodos de venda</h3><div class="mbrief">
          <div><span class="label">SPIN</span><div class="row" style="margin-top:6px">${["S", "P", "I", "N"].map((k) => ch((M.spin || {})[k], BIB.metodos.spin[k].nome)).join("")}</div></div>
          <div><span class="label">N.E.A.T.</span><div class="row" style="margin-top:6px">${["N", "E", "A", "T"].map((k) => ch((M.neat || {})[k], BIB.metodos.neat[k].nome)).join("")}</div></div>
          <div><span class="label">Sandler · Desafiadora</span><div class="row" style="margin-top:6px">${ch(M.contrato_inicial, "Contrato inicial")}${ch(M.insight, "Insight ensinado")}</div></div>
          ${M.conceito ? `<div><span class="label">Conceito do paciente</span><p style="margin:4px 0 0">${esc(M.conceito)}</p></div>` : ""}
          ${M.pergunta_que_faltou ? `<div style="grid-column:1/-1;background:var(--accent-soft)"><span class="label">Pergunta que faltou (use no retorno)</span><p style="margin:4px 0 0;font-weight:700">“${esc(M.pergunta_que_faltou)}”</p></div>` : ""}
        </div>`; })() : ""}
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
    return { inicio: null, seg: 0, gravando: false, pausado: false, momento: 0, falas: [], dicas: [], objecoes: new Set(), demo: false, ultimaIA: 0, temp: 25, avisouFechar: false, spin: {}, neat: {}, contrato: false };
  }
  C = novaSessao();
  let quem = "paciente", tick = null, sr = null, stream = null, tipTimer = null, demoTimer = null, MED = null, quemManual = false;
  const perfilAtual = () => (AJ.vozes || {})[$("#cProf").value];
  function atualizarAuto() {
    const tem = !!perfilAtual();
    $("#btnQuemAuto").classList.toggle("hide", !tem);
    if (tem && !quemManual) quem = "auto";
    if (!tem && quem === "auto") quem = "paciente";
    $$("#segQuem button").forEach((x) => x.classList.toggle("on", x.dataset.q === quem));
  }

  function renderMomento() {
    $("#momentoNome").textContent = MOMENTOS[C.momento];
    $("#momentoSteps").innerHTML = MOMENTOS.map((m, i) => `<i class="${i < C.momento ? "done" : i === C.momento ? "cur" : ""}"></i>`).join("");
    $("#momentoNames").innerHTML = MOMENTOS.map((m, i) => `<span class="${i === C.momento ? "cur" : ""}">${m}</span>`).join("");
  }
  function avancarMomento(txt) {
    const t = norm(txt), antes = C.momento;
    PISTAS.forEach(([i, ps]) => { if (i > C.momento && ps.some((p) => t.includes(p))) C.momento = Math.min(i, C.momento + 2); });
    if (C.momento > antes) { ajustarTemp(3 * (C.momento - antes), "a consulta avançou para " + MOMENTOS[C.momento]); renderMetodo(); }
    renderMomento();
  }

  /* Termômetro de prontidão para o fechamento (0–100) */
  const EMOCAO = ["queria muito", "gostei", "adorei", "amei", "lindo", "linda", "perfeito", "exatamente", "quero", "nossa", "maravilh", "sonho", "incrivel", "que bom", "ficou otimo", "faz sentido"];
  const PRONTO = ["conseguiria comecar", "comecaria", "posso comecar", "pode ser na", "vou trazer", "vamos marcar", "pode marcar", "fecha", "bora"];
  const PRAZO = ["casar", "casamento", "formatura", "viagem", "aniversario", "entrevista"];
  const nivelTemp = (t) => t >= 70 ? ["Quente", "pronto para o fechamento"] : t >= 40 ? ["Morno", "trate as objeções e reforce o valor"] : ["Frio", "aprofunde a dor e o desejo"];
  function renderTermo() {
    const t = Math.round(C.temp), [n, o] = nivelTemp(t);
    $("#termoPct").textContent = t + "%";
    $("#termoEst").textContent = n + " · " + o;
    $("#termoMarc").style.left = t + "%";
    $("#termoBarra").setAttribute("aria-valuenow", t);
    $("#termo").classList.toggle("quente", t >= 70);
  }
  function ajustarTemp(delta, motivo) {
    if (!delta) return;
    C.temp = Math.max(0, Math.min(100, C.temp + delta));
    $("#termoMot").textContent = `${delta > 0 ? "▲ +" : "▼ "}${delta} · ${motivo}`;
    renderTermo();
    if (C.temp >= 70 && !C.avisouFechar) {
      C.avisouFechar = true;
      setTimeout(() => mostrarDica({ rotulo: "Hora de fechar", tipo: "sinal_compra", dica: "O paciente está pronto. Faça agora a pergunta de fechamento: “Prefere começar nesta semana ou na próxima?”", fonte: "termometro" }), 900);
    }
    if (C.temp < 60) C.avisouFechar = false;
  }
  /* Método: SPIN, N.E.A.T. e Sandler detectados na conversa (e marcáveis à mão) */
  const MET = BIB.metodos;
  const PISTA_SPIN = { S: ["ja usou", "rotina", "trabalha", "o que te fez procurar", "como e o seu dia"], P: ["incomoda", "problema", "o que te chateia", "ha quanto tempo"], I: ["atrapalha", "afeta", "momentos", "deixa de", "evita", "confianca"], N: ["se a gente resolvesse", "o que mudaria", "como seria", "resultado perfeito", "sorriso ideal"] };
  const PISTA_NEAT = { N: ["incomoda", "vergonha", "foto", "torto", "dor", "quero melhorar", "nao gosto"], E: ["valor", "investir", "investimento", "parcela", "caro", "preco", "quanto custa", "orcamento", "cabe no", "dinheiro", "separado", "juntando", "condicoes"], A: ["marido", "esposa", "noivo", "noiva", "namorad", "meus pais", "minha mae", "meu pai", "eu mesma decido", "eu decido", "quem decide", "participa da decisao"], T: ["casamento", "casar", "formatura", "viagem", "aniversario", "ano que vem", "mes que vem", "ate o", "prazo", "data importante"] };
  function detectarMetodos(f) {
    const t = norm(f.texto);
    if (f.quem === "profissional") {
      Object.entries(PISTA_SPIN).forEach(([k, ps]) => { if (ps.some((x) => t.includes(x))) C.spin[k] = true; });
      if (/no final|ao final/.test(t) && /(faz sentido|sim ou nao|tudo bem se)/.test(t)) C.contrato = true;
      if (t.includes("participa da decisao") || t.includes("quem decide")) C.neat.A = C.neat.A || "perguntado";
    } else {
      Object.entries(PISTA_NEAT).forEach(([k, ps]) => { if (ps.some((x) => t.includes(x))) C.neat[k] = true; });
    }
    renderMetodo();
  }
  function renderMetodo() {
    if (!$("#mSpin")) return;
    $("#mSpin").innerHTML = ["S", "P", "I", "N"].map((k) => `<button class="${C.spin[k] ? "ok" : ""}" data-mspin="${k}" title="${esc(MET.spin[k].objetivo)}">${k} · ${MET.spin[k].nome}</button>`).join("");
    $("#mNeat").innerHTML = ["N", "E", "A", "T"].map((k) => `<button class="${C.neat[k] ? "ok" : ""}" data-mneat="${k}" title="${esc(MET.neat[k].dica)}">${MET.neat[k].nome}</button>`).join("");
    $("#mSandler").innerHTML = `<button class="${C.contrato ? "ok" : ""}" data-mcontrato="1" title="Combinar no início que o paciente dirá sim ou não no final">Contrato inicial</button>`;
    // próxima pergunta: contrato (no começo) → SPIN na ordem → N.E.A.T. que falta
    let rot = "", q = "";
    if (!C.contrato && C.momento <= 1) { rot = "Sandler · Contrato inicial"; q = MET.sandler.contrato; }
    else { const k = ["S", "P", "I", "N"].find((x) => !C.spin[x]); if (k) { rot = "SPIN · " + MET.spin[k].nome; q = MET.spin[k].perguntas[0]; } else { const n = ["N", "E", "A", "T"].find((x) => !C.neat[x]); if (n) { rot = "N.E.A.T. · " + MET.neat[n].nome; q = MET.neat[n].pergunta; } } }
    $("#mProx").innerHTML = q ? `<span class="small dim">Próxima pergunta sugerida · <b>${esc(rot)}</b></span><div style="margin-top:4px">“${esc(q)}”</div>` : `<span class="small"><b>Tudo coberto.</b> Conduza ao fechamento.</span>`;
    if (!$("#mGuia").innerHTML) {
      const L = (arr) => `<ul>${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
      $("#mGuia").innerHTML = `<h4>SPIN</h4>${L(["S", "P", "I", "N"].map((k) => MET.spin[k].nome + ": " + MET.spin[k].perguntas[0]))}
        <h4>N.E.A.T.</h4>${L(["N", "E", "A", "T"].map((k) => MET.neat[k].nome + ": " + MET.neat[k].pergunta))}
        <h4>Venda conceitual</h4><p class="small" style="margin:0 0 4px">${esc(MET.conceitual.ideia)}</p>${L(MET.conceitual.perguntas)}
        <h4>Sandler</h4>${L([MET.sandler.contrato, MET.sandler.principio, "Funil da dor: " + MET.sandler.funil.join(" · ")])}
        <h4>Venda desafiadora</h4><p class="small" style="margin:0 0 4px">${esc(MET.challenger.ideia)}</p>${L(MET.challenger.insights)}
        <h4>SNAP (WhatsApp)</h4>${L(MET.snap.regras)}
        <h4>Venda centrada no cliente</h4>${L(MET.centrada.regras)}`;
    }
  }
  $("#metodo").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mspin],[data-mneat],[data-mcontrato]"); if (!b) return;
    if (b.dataset.mspin) C.spin[b.dataset.mspin] = !C.spin[b.dataset.mspin];
    if (b.dataset.mneat) C.neat[b.dataset.mneat] = !C.neat[b.dataset.mneat];
    if (b.dataset.mcontrato) C.contrato = !C.contrato;
    renderMetodo();
  });

  function termometro(f) {
    if (f.quem !== "paciente") return;
    const objs = BIB.objecoes.filter((o) => casa(f.texto, o.gatilhos));
    if (objs.length) ajustarTemp(-6 * objs.length, "objeção: " + objs.map((o) => o.titulo.toLowerCase()).join(", "));
    if (casa(f.texto, BIB.sinaisCompra) || PRONTO.some((w) => norm(f.texto).includes(w))) ajustarTemp(18, "sinal de compra");
    else if (EMOCAO.some((w) => norm(f.texto).includes(w))) ajustarTemp(10, "demonstrou entusiasmo");
    if (PRAZO.some((w) => norm(f.texto).includes(w))) ajustarTemp(5, "tem um prazo importante");
  }
  function mostrarDica(d) {
    if (!d || !d.dica) return;
    if (C.dicas.some((x) => x.dica === d.dica)) return;
    C.dicas.unshift(d);
    const el = $("#dica");
    el.classList.remove("idle");
    el.innerHTML = `<div class="rot"><b>${esc(d.rotulo || "Dica")}</b>${d.fonte === "ia" ? (C.demo ? "IA · demonstração" : "IA") : d.fonte === "termometro" ? "termômetro" : "roteiro"} · agora</div>
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
      if (typeof d.prontidao === "number") { const alvo = Math.max(0, Math.min(100, d.prontidao)); ajustarTemp(Math.round((alvo - C.temp) / 2), "leitura da IA"); }
      if (d.dica) mostrarDica({ ...d, fonte: "ia" });
    } catch (e) { /* segue com as dicas do roteiro */ }
  }
  function addFala(q, texto, extra, opts = {}) {
    texto = String(texto || "").trim(); if (!texto) return;
    const f = { quem: q, texto, t: C.seg, auto: !!opts.auto };
    C.falas.push(f);
    const tr = $("#trans");
    if (C.falas.length === 1) tr.innerHTML = "";
    tr.insertAdjacentHTML("beforeend", `<p data-i="${C.falas.length - 1}" class="${q === "paciente" ? "pac" : ""}${opts.incerto ? " inc" : ""}" title="Toque para trocar quem falou"><b>${q === "paciente" ? "Paciente" : "Profissional"}${opts.auto ? " 🎙" : ""}</b>${esc(texto)}</p>`);
    tr.scrollTop = tr.scrollHeight;
    avancarMomento(texto);
    if (extra && extra.dica) mostrarDica({ ...extra.dica, citacao: texto.slice(0, 110), fonte: "ia" });
    else analisarLocal(f);
    termometro(f);
    detectarMetodos(f);
    if (q === "paciente") dicaIA();
  }
  // tocar numa frase troca quem falou (corrige o reconhecimento)
  $("#trans").addEventListener("click", (e) => {
    const el = e.target.closest("p[data-i]"); if (!el) return;
    const f = C.falas[Number(el.dataset.i)]; if (!f) return;
    f.quem = f.quem === "paciente" ? "profissional" : "paciente"; f.corrigido = true;
    el.classList.toggle("pac", f.quem === "paciente"); el.classList.remove("inc");
    el.querySelector("b").textContent = f.quem === "paciente" ? "Paciente" : "Profissional";
    if (f.quem === "paciente") { analisarLocal(f); termometro(f); }
  });
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
    C = novaSessao(); $("#timer").textContent = "00:00"; renderMomento(); renderTermo(); renderMetodo();
    $("#termoMot").textContent = "Começa frio. Sobe com desejo e sinais de compra; cai com objeções.";
    $("#trans").innerHTML = `<p class="dim">A conversa aparece aqui.</p>`;
    $("#hist").innerHTML = `<p class="small dim" style="margin:0">Nenhuma dica ainda.</p>`; $("#histCount").textContent = "";
    const el = $("#dica"); el.classList.add("idle"); el.innerHTML = `<div class="txt">As dicas aparecem aqui assim que o paciente falar algo importante: uma objeção, uma dúvida ou um sinal de que quer fechar.</div>`;
  }
  $("#chkConsent").addEventListener("change", estadoBotoes);
  $("#segQuem").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; quem = b.dataset.q; quemManual = quem !== "auto"; $$("#segQuem button").forEach((x) => x.classList.toggle("on", x === b)); });
  $("#cProf").addEventListener("change", () => { quemManual = false; atualizarAuto(); });
  $("#btnFala").addEventListener("click", () => { addFala(quem === "auto" ? "paciente" : quem, $("#inFala").value); $("#inFala").value = ""; });
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
    try { MED = window.AlinhaVoz.medidor(stream); } catch (e) { MED = null; }
    sr.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) continue;
        const quadros = MED ? MED.pegar() : [];
        let q = quem, opts = {};
        if (quem === "auto") {
          const r = window.AlinhaVoz.classificar(perfilAtual(), quadros);
          q = r ? r.quem : (C.ultimoQuem || "paciente");
          opts = { auto: true, incerto: !r || r.confianca < 0.12 };
          C.ultimoQuem = q;
        }
        addFala(q, ev.results[i][0].transcript, null, opts);
      }
    };
    sr.onend = () => { if (C.gravando && !C.pausado) { try { sr.start(); } catch (e) { /* já ativo */ } } };
    try { sr.start(); $("#recHint").textContent = quem === "auto" ? "Escutando e reconhecendo as vozes sozinho. Se errar, toque na frase para trocar." : "Escutando. Toque em Paciente ou Profissional para indicar quem fala (ou cadastre sua voz em Ajustes)."; } catch (e) { /* */ }
  });
  $("#btnPausar").addEventListener("click", () => {
    C.pausado = !C.pausado; estadoBotoes();
    if (sr) { try { C.pausado ? sr.stop() : sr.start(); } catch (e) { /* */ } }
  });
  function pararCaptura() {
    C.gravando = false; clearInterval(tick); clearInterval(demoTimer);
    try { sr && sr.stop(); } catch (e) { /* */ } sr = null;
    stream && stream.getTracks().forEach((t) => t.stop()); stream = null;
    if (MED) { MED.parar(); MED = null; }
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
      briefing: Object.assign(B, { prontidao: Math.round(C.temp), temperatura: B.temperatura || (C.temp >= 70 ? "quente" : C.temp >= 40 ? "morno" : "frio"),
        metodos: (() => { const m = B.metodos || {}; const or = (a = {}, b = {}) => Object.fromEntries(["S", "P", "I", "N"].map((k) => [k, !!(a[k] || b[k])]));
          const spin = or(m.spin, C.spin), neat = Object.fromEntries(["N", "E", "A", "T"].map((k) => [k, !!((m.neat || {})[k] || C.neat[k])]));
          const faltaS = ["S", "P", "I", "N"].find((k) => !spin[k]), faltaN = ["N", "E", "A", "T"].find((k) => !neat[k]);
          return { spin, neat, conceito: m.conceito || "", contrato_inicial: !!(m.contrato_inicial || C.contrato), insight: !!m.insight,
            pergunta_que_faltou: m.pergunta_que_faltou || (faltaS ? MET.spin[faltaS].perguntas[0] : faltaN ? MET.neat[faltaN].pergunta : "") }; })() }),
      prontidao: Math.round(C.temp), transcricao: C.falas, toques: {}
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
    renderVozes(); atualizarAuto();
  }
  /* cadastro e teste da voz */
  function renderVozes() {
    const equipe = [...new Set([...(AJ.equipe || []), ...PAC.map((p) => p.profissional).filter(Boolean)])];
    const atual = $("#vozProf").value || $("#cProf").value;
    $("#vozProf").innerHTML = equipe.map((n) => `<option${n === atual ? " selected" : ""}>${esc(n)}</option>`).join("");
    const v = AJ.vozes || {};
    $("#vozLista").innerHTML = Object.keys(v).length ? Object.entries(v).map(([n, pf]) => `<div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><span class="grow">✓ Voz de <b>${esc(n)}</b> cadastrada em ${fmtData(pf.criadoEm)}</span><button class="btn sm ghost" data-vozdel="${esc(n)}">Apagar</button></div>`).join("") : `<span class="dim">Nenhuma voz cadastrada.</span>`;
  }
  async function capturar(segundos, aoTique) {
    const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const m = window.AlinhaVoz.medidor(st);
    for (let s = segundos; s > 0; s--) { aoTique(s, m.espiar()); await new Promise((r) => setTimeout(r, 1000)); }
    const q = m.pegar(); m.parar(); st.getTracks().forEach((t) => t.stop());
    return q;
  }
  $("#btnVozGravar").addEventListener("click", async () => {
    const nome = $("#vozProf").value; if (!nome) { toast("Cadastre a equipe primeiro"); return; }
    const b = $("#btnVozGravar"), st = $("#vozStatus"); b.disabled = true;
    try {
      const q = await capturar(20, (s, n) => { st.textContent = `Gravando… leia o texto (${s} s) · ${n} trechos de voz`; });
      const perfil = window.AlinhaVoz.criarPerfil(q);
      await Store.ajustes({ vozes: Object.assign({}, AJ.vozes || {}, { [nome]: perfil }) });
      st.textContent = `✓ Voz de ${nome} cadastrada. Toque em “Testar reconhecimento”.`;
      renderVozes(); atualizarAuto();
    } catch (e) { st.textContent = e.name === "NotAllowedError" || e.name === "NotFoundError" ? "O microfone não foi liberado neste aparelho." : e.message; }
    b.disabled = false;
  });
  $("#btnVozTestar").addEventListener("click", async () => {
    const nome = $("#vozProf").value, perfil = (AJ.vozes || {})[nome], st = $("#vozStatus");
    if (!perfil) { st.textContent = "Cadastre a voz primeiro."; return; }
    const b = $("#btnVozTestar"); b.disabled = true;
    try {
      const q = await capturar(4, (s) => { st.textContent = `Fale qualquer frase… (${s} s)`; });
      const r = window.AlinhaVoz.classificar(perfil, q);
      st.textContent = !r ? "Não captei voz suficiente. Fale mais perto do microfone." : r.quem === "profissional" ? `✓ Reconheci: ${nome}` : "Reconheci: outra pessoa (seria marcada como Paciente)";
    } catch (e) { st.textContent = "O microfone não foi liberado neste aparelho."; }
    b.disabled = false;
  });
  $("#vozLista").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-vozdel]"); if (!b) return;
    const v = Object.assign({}, AJ.vozes || {}); delete v[b.dataset.vozdel];
    AJ.vozes = v; await Store.ajustes({ vozes: v }); renderVozes(); atualizarAuto();
  });

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
  /* WhatsApp ao vivo (mensagens chegam pelo webhook do Kommo)     */
  /* ------------------------------------------------------------ */
  const WA = { conversas: [], sel: null, msgs: {}, info: {}, sug: {}, temp: {}, humano: {}, demo: null, timers: [], lido: ls.get("alinha.wa.lido", {}) };
  const waModoReal = () => !!(PLAT && PLAT.whatsapp);
  const hora = (iso) => { const d = new Date(iso), h = new Date(); return d.toDateString() === h.toDateString() ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : fmtData(iso); };
  function preencherBib(t, lead) {
    const i = WA.info[lead] || {}, u = BIB.unidades[i.unidade || "Caruaru"] || {};
    return String(t).replace(/\{(\w+)\}/g, (m, k) => ({ nome: primeiro(i.nome), unidade: i.unidade || "", endereco: u.endereco || "" }[k] || "")).replace(/\s+([,.!?])/g, "$1").replace(/,\s*,/g, ",").replace(/\s{2,}/g, " ").replace(/^,\s*/, "").trim();
  }
  // pontuação do termômetro para uma mensagem do paciente
  function deltaTexto(texto) {
    let d = 0; const t = norm(texto);
    const objs = BIB.objecoes.filter((o) => casa(texto, o.gatilhos)); d -= 6 * objs.length;
    if (casa(texto, BIB.sinaisCompra) || PRONTO.some((w) => t.includes(w))) d += 18;
    else if (EMOCAO.some((w) => t.includes(w))) d += 10;
    if (PRAZO.some((w) => t.includes(w))) d += 5;
    return d;
  }
  function recalcularTemp(lead) {
    let v = 25; (WA.msgs[lead] || []).forEach((m) => { if (m.autor === "cliente") v = Math.max(0, Math.min(100, v + deltaTexto(m.texto))); });
    WA.temp[lead] = v;
  }
  // sugestão imediata pelo roteiro (sem IA)
  function sugestaoLocal(lead) {
    const cli = (WA.msgs[lead] || []).filter((m) => m.autor === "cliente");
    const ultima = (cli[cli.length - 1] || {}).texto || "";
    // 1º olha só a última mensagem; se nada for detectado, considera a anterior também
    for (const txt of [ultima, cli.slice(-2).map((m) => m.texto).join(" ")]) {
      if (!txt) continue;
      if (casa(txt, BIB.sinaisCompra) || PRONTO.some((w) => norm(txt).includes(w))) return { rotulo: "Sinal de compra", orientacao: "Sinal de compra! Pare de apresentar: ofereça duas datas e o próximo passo.", mensagem: preencherBib("Que ótimo, {nome}! Consigo te encaixar já nesta semana para começarmos. Prefere terça ou quinta? E sim, dá para parcelar no cartão 😊", lead), fonte: "roteiro" };
      const o = BIB.objecoes.find((x) => casa(txt, x.gatilhos));
      if (o) return { rotulo: o.titulo, orientacao: DICA_OBJ[o.id] || o.proximo, mensagem: preencherBib(o.respostas[0], lead), fonte: "roteiro" };
      const it = BIB.intencoes.find((x) => casa(txt, x.gatilhos));
      if (it) return { rotulo: it.titulo, orientacao: it.orientacao, mensagem: preencherBib(it.resposta, lead), fonte: "roteiro" };
    }
    return { rotulo: "Conduzir", orientacao: "Descubra a dor e convide para o check-up digital com o iTero.", mensagem: preencherBib("Entendi, {nome}! Me conta: o que mais te incomoda hoje no seu sorriso? Assim já vejo o melhor horário para o seu check-up digital 😊", lead), fonte: "roteiro" };
  }
  async function gerarSugestao(lead, versaoAnterior) {
    WA.sug[lead] = WA.sug[lead] && !versaoAnterior ? WA.sug[lead] : sugestaoLocal(lead);
    if (!versaoAnterior) WA.sug[lead] = sugestaoLocal(lead);
    if (lead === WA.sel) renderChat();
    if (!(PLAT && PLAT.ia)) { if (versaoAnterior) { const alt = sugestaoLocal(lead); alt.mensagem = preencherBib("Entendo você, {nome}. O que pesa mais nessa decisão agora? Se fizer sentido, eu te mostro a simulação do seu sorriso e vemos juntos o melhor caminho 🙂", lead); WA.sug[lead] = alt; renderChat(); } return; }
    try {
      const i = WA.info[lead] || {};
      const d = await api("POST", "api/ia/whatsapp", { conversa: WA.msgs[lead] || [], nome: i.nome, unidade: i.unidade, condicao: AJ.condicao, versao_anterior: versaoAnterior || "" });
      WA.sug[lead] = { rotulo: d.rotulo || "Sugestão da IA", orientacao: d.orientacao || "", mensagem: d.mensagem || "", fonte: "ia" };
      if (typeof d.prontidao === "number") WA.temp[lead] = Math.round((WA.temp[lead] + d.prontidao) / 2);
      if (lead === WA.sel) renderChat();
    } catch (e) { /* fica a sugestão do roteiro */ }
  }

  async function carregarConversas() {
    if (waModoReal()) {
      try { WA.conversas = (await api("GET", "api/whatsapp/conversas")).conversas || []; } catch (e) { return; }
      WA.conversas.forEach((c) => { WA.info[c.lead] = Object.assign({ nome: c.nome, unidade: c.unidade }, WA.info[c.lead] || {}); });
    } else {
      if (!WA.demo) { WA.demo = DEMO.whatsapp(); WA.demo.forEach((c) => { WA.msgs[c.lead] = c.lista.slice(); WA.info[c.lead] = { nome: c.nome, telefone: c.telefone, unidade: c.unidade, origem: c.origem }; recalcularTemp(c.lead); }); }
      WA.conversas = WA.demo.map((c) => { const l = WA.msgs[c.lead], u = l[l.length - 1]; return { lead: c.lead, nome: c.nome, unidade: c.unidade, ultima: u.texto, autor: u.autor, ts: u.ts }; }).sort((a, b) => (a.ts < b.ts ? 1 : -1));
    }
    badgeWA();
  }
  function naoLida(c) { return c.autor === "cliente" && (!WA.lido[c.lead] || c.ts > WA.lido[c.lead]); }
  function badgeWA() { const n = WA.conversas.filter(naoLida).length; const b = $("#badgeWA"); b.textContent = n; b.classList.toggle("hide", !n); }

  function renderWA() {
    $("#waEstado").textContent = waModoReal() ? "conectado ao Kommo" : PLAT ? "aguardando configuração do webhook" : "demonstração";
    $("#waLista").innerHTML = WA.conversas.length ? WA.conversas.map((c) => { const i = WA.info[c.lead] || {}; return `<button data-wa="${esc(c.lead)}" class="${c.lead === WA.sel ? "on" : ""}"><div class="ava">${esc(iniciais(i.nome || c.nome || "?"))}</div><div class="t"><b>${esc(i.nome || c.nome || "Lead " + c.lead)}${naoLida(c) ? '<span class="nova" title="nova mensagem"></span>' : ""}</b><span class="u">${c.autor === "clinica" ? "Você: " : ""}${esc(c.ultima)}</span></div><span class="h">${c.ts ? hora(c.ts) : ""}</span></button>`; }).join("")
      : `<div class="vazio">${PLAT ? "Nenhuma conversa ainda. Assim que o webhook do Kommo estiver configurado, as mensagens do WhatsApp aparecem aqui." : "Sem conversas."}</div>`;
    renderChat();
  }
  function renderChat() {
    const el = $("#waChat"); const lead = WA.sel;
    $("#wa").classList.toggle("aberta", !!lead);
    if (!lead) { el.innerHTML = `<div class="vazio">Escolha uma conversa à esquerda.</div>`; return; }
    const i = WA.info[lead] || {}, msgs = WA.msgs[lead] || [], sg = WA.sug[lead], t = WA.temp[lead] ?? 25, hum = WA.humano[lead];
    const kommoLink = PLAT && PLAT.kommoUrl ? `${PLAT.kommoUrl}/leads/detail/${encodeURIComponent(lead)}` : "";
    const wa = i.telefone ? `https://wa.me/${(digits(i.telefone).length <= 11 ? "55" : "") + digits(i.telefone)}?text=${encodeURIComponent(sg ? sg.mensagem : "")}` : "";
    const nivel = t >= 70 ? "🔥 Quente · pronto para fechar" : t >= 40 ? "🌤️ Morno" : "❄️ Frio";
    el.innerHTML = `<div class="card wahead"><button class="btn sm ghost voltar" id="waVoltar">← Conversas</button><div class="ava">${esc(iniciais(i.nome || "?"))}</div>
        <div class="grow"><b style="font-size:17px">${esc(i.nome || "Lead " + lead)}</b><div class="small dim">${esc([i.unidade, i.telefone, i.origem].filter(Boolean).join(" · ") || "lead " + lead)}</div></div>
        <span class="minitermo" title="Prontidão para o fechamento">🌡 <i><b style="width:${t}%"></b></i>${t}%</span><span class="pill ${t >= 70 ? "bad" : t >= 40 ? "warn" : ""}">${nivel}</span>
        <div class="row" style="width:100%">${hum ? `<span class="pill acc">✋ Atendimento humano · IA pausada</span><button class="btn sm" data-waact="devolver">🤖 Devolver para a IA</button>` : `<button class="btn sm" data-waact="assumir">✋ Assumir atendimento</button>`}
          <button class="btn sm" data-waact="followup">+ Adicionar ao follow-up</button>${kommoLink ? `<a class="btn sm" href="${esc(kommoLink)}" target="_blank" rel="noopener">Abrir no Kommo</a>` : ""}</div></div>
      <div class="thread" id="waThread">${msgs.map((m) => `<div class="bolha ${m.autor === "cliente" ? "cli" : "cl"}${m._nova ? " chegou" : ""}">${esc(m.texto)}<span class="m">${m.autor === "cliente" ? "Paciente" : m.ia ? "🤖 IA de atendimento" : "Clínica"} · ${hora(m.ts)}</span></div>`).join("") || '<p class="dim">Sem mensagens.</p>'}</div>
      ${sg ? `<div class="resp"><div class="row"><span class="pill acc">${esc(sg.rotulo || "Sugestão")}</span><span class="small" style="color:var(--tip-dim)">${sg.fonte === "ia" ? "IA" : "roteiro"} · o que responder</span></div>
        <div class="ori">${esc(sg.orientacao || "")}</div>
        <textarea id="waTexto" aria-label="Resposta sugerida">${esc(sg.mensagem || "")}</textarea>
        <div class="row"><button class="btn pri" data-waact="copiar">${kommoLink ? "Copiar e abrir no Kommo" : "Copiar"}</button>${wa ? `<a class="btn" id="waLink" href="${esc(wa)}" target="_blank" rel="noopener">Abrir no WhatsApp</a>` : ""}<button class="btn" data-waact="outra">↻ Outra versão</button></div></div>` : ""}`;
    msgs.forEach((m) => delete m._nova);
    const th = $("#waThread"); th.scrollTop = th.scrollHeight;
  }
  async function abrirConversa(lead) {
    WA.sel = lead;
    if (waModoReal() && !WA.msgs[lead]) {
      try { WA.msgs[lead] = (await api("GET", "api/whatsapp/mensagens?lead=" + encodeURIComponent(lead))).mensagens || []; } catch (e) { WA.msgs[lead] = []; }
      recalcularTemp(lead);
    }
    const c = WA.conversas.find((x) => x.lead === lead); if (c) { WA.lido[lead] = c.ts; ls.set("alinha.wa.lido", WA.lido); }
    renderWA(); gerarSugestao(lead);
    if (PLAT && PLAT.kommo && !WA.info[lead]._kommo) {
      api("GET", "api/whatsapp/lead?id=" + encodeURIComponent(lead)).then((d) => { WA.info[lead] = Object.assign(WA.info[lead] || {}, { nome: d.nome || WA.info[lead].nome, telefone: d.telefone, unidade: d.unidade, origem: d.origem, _kommo: true }); WA.humano[lead] = d.humano; if (WA.sel === lead) renderWA(); }).catch(() => {});
    }
    // demonstração: novas mensagens chegam aos poucos
    WA.timers.forEach(clearTimeout); WA.timers = [];
    const dc = WA.demo && WA.demo.find((x) => x.lead === lead);
    if (dc && dc.novas && dc.novas.length) dc.novas.splice(0).forEach((m, k) => WA.timers.push(setTimeout(() => receber(lead, [{ id: "n" + Date.now() + k, ts: new Date().toISOString(), ...m }]), 6000 * (k + 1))));
  }
  function receber(lead, novas) {
    if (!novas.length) return;
    const lista = WA.msgs[lead] = WA.msgs[lead] || [];
    novas.forEach((m) => { if (!lista.some((x) => x.id === m.id)) lista.push(Object.assign(m, { _nova: true })); });
    recalcularTemp(lead);
    const c = WA.conversas.find((x) => x.lead === lead), u = lista[lista.length - 1];
    if (c) Object.assign(c, { ultima: u.texto, autor: u.autor, ts: u.ts });
    if (lead === WA.sel) { WA.lido[lead] = u.ts; ls.set("alinha.wa.lido", WA.lido); }
    WA.conversas.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    if (vista === "whatsapp") renderWA(); badgeWA();
    if (novas.some((m) => m.autor === "cliente") && lead === WA.sel) gerarSugestao(lead);
  }
  async function pollWA() {
    if (!waModoReal()) return;
    const antes = Object.fromEntries(WA.conversas.map((c) => [c.lead, c.ts]));
    await carregarConversas();
    if (WA.sel && WA.msgs[WA.sel]) {
      const l = WA.msgs[WA.sel], desde = l.length ? l[l.length - 1].ts : "";
      try { const d = await api("GET", "api/whatsapp/mensagens?lead=" + encodeURIComponent(WA.sel) + "&desde=" + encodeURIComponent(desde)); receber(WA.sel, d.mensagens || []); } catch (e) { /* tenta de novo */ }
    }
    if (vista === "whatsapp" && WA.conversas.some((c) => antes[c.lead] !== c.ts)) renderWA();
  }
  $("#waLista").addEventListener("click", (e) => { const b = e.target.closest("[data-wa]"); if (b) abrirConversa(b.dataset.wa); });
  $("#waChat").addEventListener("input", (e) => {
    if (e.target.id !== "waTexto" || !WA.sel) return;
    if (WA.sug[WA.sel]) WA.sug[WA.sel].mensagem = e.target.value;
    const a = $("#waLink"), i = WA.info[WA.sel] || {}; if (a && i.telefone) a.href = `https://wa.me/${(digits(i.telefone).length <= 11 ? "55" : "") + digits(i.telefone)}?text=${encodeURIComponent(e.target.value)}`;
  });
  $("#waChat").addEventListener("click", async (e) => {
    if (e.target.closest("#waVoltar")) { WA.sel = null; renderWA(); return; }
    const b = e.target.closest("[data-waact]"); if (!b || !WA.sel) return;
    const lead = WA.sel, act = b.dataset.waact, i = WA.info[lead] || {};
    if (act === "copiar") {
      const txt = $("#waTexto").value;
      try { await navigator.clipboard.writeText(txt); toast("Resposta copiada"); } catch (err) { $("#waTexto").select(); toast("Selecionado: use Ctrl+C para copiar"); }
      if (PLAT && PLAT.kommoUrl) window.open(`${PLAT.kommoUrl}/leads/detail/${encodeURIComponent(lead)}`, "_blank", "noopener");
    } else if (act === "outra") {
      b.disabled = true; b.textContent = "Gerando…"; await gerarSugestao(lead, $("#waTexto").value); 
    } else if (act === "assumir" || act === "devolver") {
      const humano = act === "assumir";
      try { if (PLAT && PLAT.kommo) await api("POST", "api/whatsapp/atendimento", { lead_id: lead, humano }); WA.humano[lead] = humano; renderChat(); toast(humano ? "Você assumiu: a IA do n8n fica pausada neste lead" : "Lead devolvido para a IA"); }
      catch (err) { toast("Kommo: " + err.message); }
    } else if (act === "followup") {
      let p = PAC.find((x) => x.leadId && String(x.leadId) === String(lead));
      if (p) { abrirGaveta(p); return; }
      const cli = (WA.msgs[lead] || []).filter((m) => m.autor === "cliente");
      const objs = [...new Set(cli.flatMap((m) => BIB.objecoes.filter((o) => casa(m.texto, o.gatilhos)).map((o) => o.id)))];
      p = { id: novoId(), leadId: lead, nome: i.nome || "Lead " + lead, telefone: i.telefone || "", unidade: i.unidade || "", origem: i.origem || "WhatsApp", status: "aberto", consultaEm: new Date().toISOString(),
        responsavel: (AJ.equipe || [])[0] || "", profissional: (AJ.equipe || [])[0] || "", objecoes: objs, palavras: cli.slice(-3).map((m) => m.texto.slice(0, 90)), oQueTravou: objs[0] ? OBJ_NOME[objs[0]] : "", prontidao: WA.temp[lead], toques: {} };
      await Store.salvar(p); toast("Adicionado ao follow-up (D0 hoje)"); render();
    }
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
    if (vista === "whatsapp") renderWA();
  }

  /* lema da marca: Alinha a conversa → o orçamento → o fechamento → o tratamento → o sorriso */
  function lema() {
    const el = $("#lemaPalavra"); if (!el) return;
    const palavras = ["a conversa", "o orçamento", "o fechamento", "o tratamento", "o sorriso"];
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = "do diálogo ao sorriso"; return; }
    let i = 0;
    setInterval(() => {
      el.classList.add("saindo");
      setTimeout(() => { i = (i + 1) % palavras.length; el.textContent = palavras[i]; el.classList.remove("saindo"); }, 350);
    }, 2600);
  }
  lema();

  /* atualizações: verifica se o servidor já está numa versão mais nova que esta tela */
  const cmpVersao = (a, b) => { const x = String(a).split(".").map(Number), y = String(b).split(".").map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
  async function verificarAtualizacao(manual) {
    if (!PLAT) { if (manual) $("#atStatus").textContent = "No modo demonstração, você está sempre na versão mais recente publicada."; return; }
    try {
      const d = await (await fetch("versao", { cache: "no-store" })).json();
      const nova = d.versao && cmpVersao(d.versao, VERSAO) !== 0;
      $("#bannerAtualizacao").classList.toggle("hide", !nova);
      if (nova) $("#atNova").textContent = d.versao;
      if (manual) $("#atStatus").textContent = nova ? `Nova versão ${d.versao} disponível.` : "✓ Você está na versão mais recente.";
    } catch (e) { if (manual) $("#atStatus").textContent = "Não foi possível verificar agora. Confira a internet."; }
  }
  function atualizarAgora() {
    // recarrega ignorando o cache, preservando o que está salvo
    const u = new URL(location.href); u.searchParams.set("v", Date.now()); location.replace(u.toString());
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("#btnAtualizarAgora")) atualizarAgora();
    if (e.target.closest("#btnVerificarAt")) verificarAtualizacao(true);
  });
  function renderAtualizacoes() {
    const el = $("#atVersao"); if (!el) return;
    el.textContent = VERSAO;
    $("#atNovidades").innerHTML = NOVIDADES.map((n) => `<div class="nov"><b>Versão ${n.v}</b> <span class="dim small">· ${n.data}</span><ul>${n.itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("");
    $("#btnBackup").classList.toggle("hide", !PLAT);
  }

  async function iniciar() {
    aplicarTema(ls.get("alinha.tema", "auto"));
    renderMomento(); renderTermo(); renderMetodo();
    if (location.protocol !== "file:") {
      try { const r = await fetch("api/config", { headers: { Accept: "application/json" } }); if (r.ok) { const d = await r.json(); if (d.plataforma) { PLAT = d; if (d.versao) VERSAO = d.versao; } } } catch (e) { /* sem servidor: modo demonstração */ }
    }
    const ehAdmin = !PLAT || PLAT.papel === "admin";
    document.body.classList.toggle("perfil-equipe", !ehAdmin);
    $("#modoInfo").innerHTML = (PLAT ? `${ehAdmin ? "Administrador" : "Equipe"} · IA ${PLAT.ia ? "ativa" : "desligada"}<br><a href="sair" style="color:inherit">Sair</a>` : "Modo demonstração") + `<br><span style="opacity:.7">Weiss Odontologia · v${VERSAO}</span>`;
    renderAtualizacoes();
    if (PLAT) { verificarAtualizacao(false); setInterval(() => verificarAtualizacao(false), 5 * 60 * 1000); }
    carregarConversas().then(() => { if (vista === "whatsapp") renderWA(); });
    if (waModoReal()) setInterval(pollWA, 5000);
    $("#pillIA").textContent = PLAT && PLAT.ia ? "IA ouvindo + roteiro" : "Dicas do roteiro";
    try { await Store.carregar(); } catch (e) { toast("Não foi possível carregar os dados: " + e.message); }
    renderAjustes(); render();
  }
  iniciar();
})();
