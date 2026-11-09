/* Copiloto de Consulta — Weiss Odontologia
   Lógica da tela. O conteúdo (falas, objeções, mensagens) fica em roteiro.js. */
(function () {
  "use strict";
  const R = window.ROTEIRO;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------------- armazenamento local ---------------- */
  const KEY_CONS = "copiloto.consultas", KEY_ATUAL = "copiloto.atual", KEY_CFG = "copiloto.config";
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } };

  const cfg = Object.assign({
    profissional: "Dr. Edelweiss",
    nomesClinica: "Weiss, Odonto Weiss, Clínica, Você, You",
    tema: "auto",
    whReg: "", whIA: "", whMsg: "", whAudio: "", token: "",
    condicao: "", validade: "", garantia: ""
  }, load(KEY_CFG, {}));

  /* Plataforma: quando a tela é aberta pelo servidor do Copiloto, usa as rotas dele (sem n8n) */
  let PLAT = null; // { kommo, ia, audio, whatsapp } quando conectado à plataforma
  const EP = {
    get reg() { return PLAT ? (PLAT.kommo ? "api/consulta" : "") : cfg.whReg; },
    get ia() { return PLAT ? (PLAT.ia ? "api/sugestao" : "") : cfg.whIA; },
    get msg() { return PLAT ? (PLAT.whatsapp ? "api/mensagens" : "") : cfg.whMsg; },
    get audio() { return PLAT ? (PLAT.audio ? "api/audio" : "") : cfg.whAudio; }
  };
  const avisoFalta = (o) => PLAT ? `${o} não está configurado na plataforma (peça para ativar nas variáveis do servidor).` : `Configure ${o} em Configurações.`;

  let consultas = load(KEY_CONS, {});
  let S = null; // consulta atual

  function novaConsulta() {
    const id = "c" + Date.now().toString(36);
    return {
      id, criadoEm: new Date().toISOString(), atualizadoEm: null,
      canal: "whatsapp", unidade: "Caruaru",
      paciente: { nome: "", telefone: "", origem: "", leadId: "" },
      etapa: "acolhimento", checks: {},
      notas: { dor: "", evento: "", livre: "" },
      horarios: { dia1: "", hora1: "", dia2: "", hora2: "" },
      conversa: [], msgIds: {}, alertas: [], objecoes: {}, sinaisCompra: 0, temperatura: 50,
      orcamento: { tratamento: "", valor: "", entrada: "", parcelas: "", pagamento: "" },
      resultado: "", motivoPerda: "", proximoContato: "",
      consentimento: { aceito: false, em: null },
      resumo: "", resumoEditado: false, sincronizadoEm: null, ultimoSync: null
    };
  }

  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      S.atualizadoEm = new Date().toISOString();
      consultas[S.id] = S;
      store(KEY_CONS, consultas);
      store(KEY_ATUAL, S.id);
    }, 250);
  }

  /* ---------------- utilidades ---------------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const toNum = (v) => { if (v === "" || v == null) return NaN; const s = String(v).replace(/[^\d,.-]/g, ""); return parseFloat(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); };
  const brl = (n) => isNaN(n) ? "" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hora = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dataHora = (iso) => iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "";
  const digits = (s) => String(s || "").replace(/\D/g, "");
  function telE164(t) { let d = digits(t); if (!d) return ""; if (d.length <= 11) d = "55" + d; return d; }

  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("on"), 2200); }

  const regexCache = new Map();
  function gatilhoRegex(g) {
    if (regexCache.has(g)) return regexCache.get(g);
    const n = norm(g).replace(/ /g, "\\s");
    // palavras curtas precisam ser palavra inteira (com plural); as demais casam pelo início da palavra
    const re = n.length <= 4 ? new RegExp("(^|\\s)" + n + "(s|es)?(\\s|$)") : new RegExp("(^|\\s)" + n);
    regexCache.set(g, re);
    return re;
  }
  const casa = (texto, gatilhos) => { const t = norm(texto); return gatilhos.some((g) => gatilhoRegex(g).test(t)); };

  function parcelaTxt() {
    const v = toNum(S.orcamento.valor), e = toNum(S.orcamento.entrada) || 0, n = parseInt(S.orcamento.parcelas, 10);
    if (isNaN(v) || !n) return "";
    return `${n}x de ${brl((v - e) / n)}`;
  }

  function condicaoVigente() { return !!cfg.condicao && (!cfg.validade || new Date(cfg.validade) > new Date()); }
  function validadeTxt() {
    if (!cfg.validade) return "";
    const d = new Date(cfg.validade), hoje = new Date();
    const h = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
    if (d.toDateString() === hoje.toDateString()) return "hoje, às " + h;
    const am = new Date(hoje); am.setDate(am.getDate() + 1);
    if (d.toDateString() === am.toDateString()) return "amanhã, às " + h;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) + ", às " + h;
  }
  /* Aviso para falas que dependem de dados das Configurações (condição / garantia) */
  function avisoRequer(item) {
    if (!item.requer) return "";
    if (!cfg[item.requer]) return item.requer === "condicao" ? "Cadastre uma condição especial REAL em Configurações para usar esta fala." : "Cadastre em Configurações a segurança que a clínica oferece (ex.: devolução do sinal antes de iniciar).";
    if (item.requer === "condicao" && !condicaoVigente()) return "⚠️ A condição cadastrada está VENCIDA. Não use esta fala.";
    return "";
  }

  function preencher(texto) {
    const u = R.unidades[S.unidade] || {};
    const nome = (S.paciente.nome || "").trim().split(/\s+/)[0];
    const vars = {
      nome: nome, profissional: cfg.profissional, unidade: S.unidade, endereco: u.endereco, telefone_unidade: u.whatsapp,
      valor: brl(toNum(S.orcamento.valor)), entrada: brl(toNum(S.orcamento.entrada)), parcelas: parcelaTxt(),
      tratamento: S.orcamento.tratamento, dor: S.notas.dor, evento: S.notas.evento,
      dia: S.horarios.dia1, hora: S.horarios.hora1, dia2: S.horarios.dia2, hora2: S.horarios.hora2,
      condicao: condicaoVigente() ? cfg.condicao : "", validade: validadeTxt(), garantia: cfg.garantia
    };
    return texto.replace(/\{(\w+)\}/g, (m, k) => {
      const v = vars[k];
      if (v) return v;
      if (k === "nome") return "";
      return "[" + k + "]";
    }).replace(/,\s*!/g, "!").replace(/ ,/g, ",").replace(/Olá, !/g, "Olá!").replace(/\s{2,}/g, " ").replace(/ \n/g, "\n");
  }

  function copiar(texto) {
    const done = () => toast("Copiado ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(done, () => fallbackCopy(texto, done));
    else fallbackCopy(texto, done);
  }
  function fallbackCopy(t, cb) { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); cb(); } catch (e) { toast("Não foi possível copiar"); } a.remove(); }
  function abrirWhats(texto) {
    const tel = telE164(S.paciente.telefone);
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  /* Confirmação no próprio botão (1º toque pede confirmação, 2º executa) */
  function confirmar(btn, rotulo) {
    if (btn.dataset.conf === "1") { btn.dataset.conf = ""; btn.textContent = btn.dataset.orig; return true; }
    btn.dataset.orig = btn.textContent; btn.dataset.conf = "1"; btn.textContent = rotulo;
    setTimeout(() => { if (btn.dataset.conf === "1") { btn.dataset.conf = ""; btn.textContent = btn.dataset.orig; } }, 4000);
    return false;
  }

  /* Botões padrão de uma fala */
  function botoesFala(texto, extra = "") {
    return `<div class="acts">
      <button class="btn sm" data-copy="${esc(texto)}">Copiar</button>
      <button class="btn sm" data-wa="${esc(texto)}">WhatsApp</button>
      <button class="btn sm" data-usar="${esc(texto)}">Marcar como dita</button>${extra}</div>`;
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-copy],[data-wa],[data-usar],[data-ir]");
    if (!b) return;
    if (b.dataset.copy != null) copiar(b.dataset.copy);
    else if (b.dataset.wa != null) abrirWhats(b.dataset.wa);
    else if (b.dataset.usar != null) { addMsg("clinica", b.dataset.usar, "roteiro"); toast("Registrado na conversa"); }
    else if (b.dataset.ir) { irEtapa(b.dataset.ir); mostrarView("consulta"); }
  });

  /* ---------------- abas ---------------- */
  function mostrarView(v) {
    $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    if (v === "resumo") { if (!S.resumoEditado) gerarResumo(); renderNota(); }
    if (v === "historico") { renderHistorico(); renderMetricas(); }
    if (v === "mensagens") renderMensagens();
    window.scrollTo({ top: 0 });
  }
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) mostrarView(b.dataset.v); });

  /* ---------------- etapas ---------------- */
  function progresso(et) {
    const tot = et.checklist.length, feitos = Object.values(S.checks[et.id] || {}).filter(Boolean).length;
    return { tot, feitos };
  }
  function renderSteps() {
    $("#steps").innerHTML = R.etapas.map((et) => {
      const p = progresso(et);
      const done = p.tot && p.feitos === p.tot;
      return `<li class="${done ? "done" : ""}"><button data-et="${et.id}" class="${S.etapa === et.id ? "on" : ""}">
        <span>${et.icone}</span><span>${esc(et.nome)}</span><span class="prog">${done ? "✓" : p.feitos + "/" + p.tot}</span></button></li>`;
    }).join("");
  }
  $("#steps").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) irEtapa(b.dataset.et); });

  function irEtapa(id) { S.etapa = id; save(); renderSteps(); renderEtapa(); }

  function renderEtapa() {
    const idx = R.etapas.findIndex((e) => e.id === S.etapa);
    const et = R.etapas[idx];
    const wa = S.canal === "whatsapp";
    const falas = et.falas.filter((f) => !f.canal || f.canal === S.canal);
    const checks = S.checks[et.id] || {};
    const ant = R.etapas[idx - 1], prox = R.etapas[idx + 1];
    $("#etapaCard").innerHTML = `
      <div class="row" style="justify-content:space-between">
        <h2 style="margin:0;font-size:20px;flex:1 1 auto">${et.icone} ${esc(et.nome)}</h2>
        <div class="row" style="flex:0 0 auto">
          ${ant ? `<button class="btn sm" data-ir="${ant.id}">← ${esc(ant.nome)}</button>` : ""}
          ${prox ? `<button class="btn sm primary" data-ir="${prox.id}">${esc(prox.nome)} →</button>` : ""}
        </div>
      </div>
      <p class="objetivo" style="margin:12px 0 0">🎯 ${esc(et.objetivo)}</p>
      ${falas.length ? `<h3>O que falar</h3>` + falas.map((f) => {
        const t = preencher(wa && f.wa ? f.wa : f.texto);
        const av = avisoRequer(f);
        return `<div class="fala"${av ? ' style="opacity:.6"' : ""}><span class="lbl">${esc(f.rotulo)}</span>${f.canal ? `<span class="tag">${f.canal === "whatsapp" ? "WhatsApp" : "Presencial"}</span>` : ""}
          <p>${esc(t)}</p>${av ? `<div class="dica">${esc(av)}</div>` : botoesFala(t)}</div>`;
      }).join("") : ""}
      ${et.perguntas.length ? `<h3>Perguntas para fazer</h3><ul class="perg">` + et.perguntas.map((p) => {
        const t = preencher(p);
        return `<li>${esc(t)} <button class="btn sm ghost" data-copy="${esc(t)}">copiar</button><button class="btn sm ghost" data-usar="${esc(t)}">feita ✓</button></li>`;
      }).join("") + `</ul>` : ""}
      ${et.checklist.length ? `<h3>Checklist da etapa</h3>` + et.checklist.map((c, i) => `
        <label class="check"><input type="checkbox" data-chk="${i}" ${checks[i] ? "checked" : ""}><span>${esc(c)}</span></label>`).join("") : ""}
      ${et.dicas.length ? `<h3>Dicas</h3>` + et.dicas.map((d) => `<div class="dica">${esc(preencher(d))}</div>`).join("") : ""}
      ${et.id === "objecoes" ? `<h3>Objeções detectadas nesta consulta</h3>${listaObjDetectadas()}` : ""}
    `;
    $$("#etapaCard [data-chk]").forEach((c) => c.addEventListener("change", () => {
      S.checks[et.id] = S.checks[et.id] || {};
      S.checks[et.id][c.dataset.chk] = c.checked;
      save(); renderSteps();
    }));
  }

  function listaObjDetectadas() {
    const ids = Object.keys(S.objecoes);
    if (!ids.length) return `<p class="small muted">Nenhuma até agora.</p>`;
    return ids.map((id) => { const o = R.objecoes.find((x) => x.id === id); return o ? `<div class="fala"><span class="lbl">${esc(o.titulo)} (${S.objecoes[id]}x)</span><p class="small">${esc(o.entender)}</p></div>` : ""; }).join("");
  }

  /* ---------------- conversa e análise ---------------- */
  function addMsg(quem, texto, origem = "manual", opts = {}) {
    texto = String(texto || "").trim();
    if (!texto) return;
    const m = { quem, texto, ts: opts.ts || new Date().toISOString(), origem };
    if (opts.id) { if (S.msgIds[opts.id]) return; S.msgIds[opts.id] = 1; }
    S.conversa.push(m);
    renderChat();
    if (!opts.semAnalise) analisar(m);
    save();
  }

  function renderChat() {
    const c = $("#chat");
    if (!S.conversa.length) { c.innerHTML = `<div class="small muted">As mensagens e falas aparecem aqui. Cole a mensagem do paciente abaixo para receber a orientação.</div>`; return; }
    c.innerHTML = S.conversa.slice(-200).map((m) => `<div class="msg ${m.quem}"><span class="who">${m.quem === "cliente" ? esc((S.paciente.nome || "Paciente").split(" ")[0]) : "Clínica"} · ${hora(m.ts)}${m.origem === "voz" ? " · 🎙" : m.origem === "audio" ? " · 🎧 áudio" : m.origem === "kommo-ia" ? " · 🤖 IA" : ""}</span>${esc(m.texto)}</div>`).join("");
    c.scrollTop = c.scrollHeight;
  }

  const ordemEtapa = (id) => R.etapas.findIndex((e) => e.id === id);

  function analisar(m) {
    if (m.quem !== "cliente") return;
    const novos = [];
    R.objecoes.forEach((o) => {
      if (casa(m.texto, o.gatilhos)) {
        S.objecoes[o.id] = (S.objecoes[o.id] || 0) + 1;
        S.temperatura -= 8;
        novos.push({ tipo: "obj", ref: o.id });
      }
    });
    R.intencoes.forEach((it) => {
      if (it.somenteAntesDe && ordemEtapa(S.etapa) >= ordemEtapa(it.somenteAntesDe)) return;
      if (casa(m.texto, it.gatilhos)) novos.push({ tipo: "int", ref: it.id });
    });
    if (casa(m.texto, R.sinaisCompra)) {
      S.sinaisCompra++;
      S.temperatura += 12;
      novos.push({ tipo: "buy", ref: "compra" });
    }
    S.temperatura = Math.max(0, Math.min(100, S.temperatura));
    novos.forEach((n) => {
      const ultimo = S.alertas[0];
      if (ultimo && ultimo.tipo === n.tipo && ultimo.ref === n.ref) return; // evita repetir em sequência
      S.alertas.unshift(Object.assign(n, { ts: m.ts, trecho: m.texto.slice(0, 140) }));
    });
    S.alertas = S.alertas.slice(0, 40);
    renderAlertas(); renderTermometro();
    if (novos.some((n) => n.tipo === "obj")) renderEtapa();
  }

  function renderTermometro() {
    const t = S.temperatura;
    $("#thermoDot").style.left = t + "%";
    $("#thermoLbl").textContent = t >= 70 ? "🔥 Quente — conduza ao fechamento" : t >= 40 ? "Morno" : "❄️ Frio — volte à Descoberta";
  }

  function renderAlertas() {
    const box = $("#alerts");
    if (!S.alertas.length) { box.innerHTML = `<div class="small muted">As orientações aparecem aqui automaticamente quando o paciente demonstra uma objeção, faz uma pergunta importante ou dá um sinal de compra.</div>`; return; }
    box.innerHTML = S.alertas.map((a) => {
      const trecho = a.trecho ? `<div class="small muted">“${esc(a.trecho)}”</div>` : "";
      if (a.tipo === "obj") {
        const o = R.objecoes.find((x) => x.id === a.ref); if (!o) return "";
        return `<div class="alert obj"><b>🛡️ Objeção: ${esc(o.titulo)}</b>${trecho}
          <div class="small" style="margin-top:4px"><i>${esc(o.entender)}</i></div>
          ${o.respostas.map((r) => { const t = preencher(r); return `<div class="resp">${esc(t)}</div>${botoesFala(t)}`; }).join("")}
          <div class="small" style="margin-top:6px">➡ ${esc(preencher(o.proximo))}</div></div>`;
      }
      if (a.tipo === "int") {
        const it = R.intencoes.find((x) => x.id === a.ref); if (!it) return "";
        const t = preencher(it.resposta);
        return `<div class="alert int"><b>💬 ${esc(it.titulo)}</b>${trecho}<div class="small">${esc(it.orientacao)}</div><div class="resp">${esc(t)}</div>${botoesFala(t)}</div>`;
      }
      if (a.tipo === "buy") {
        return `<div class="alert buy"><b>✅ Sinal de compra!</b>${trecho}<div class="small">Pare de apresentar e conduza para o fechamento.</div>
          <div class="acts" style="margin-top:6px"><button class="btn sm primary" data-ir="fechamento">Ir para Fechamento</button></div></div>`;
      }
      if (a.tipo === "ia") {
        return `<div class="alert ia"><b>✨ Sugestão da IA</b>${a.orientacao ? `<div class="small"><i>${esc(a.orientacao)}</i></div>` : ""}<div class="resp">${esc(a.texto)}</div>${botoesFala(a.texto)}</div>`;
      }
      if (a.tipo === "info") return `<div class="alert"><b>${esc(a.titulo)}</b><div class="small">${esc(a.texto)}</div></div>`;
      return "";
    }).join("");
  }

  $("#btnAddCliente").addEventListener("click", () => { addMsg("cliente", $("#inMsg").value); $("#inMsg").value = ""; });
  $("#btnAddClinica").addEventListener("click", () => { addMsg("clinica", $("#inMsg").value); $("#inMsg").value = ""; });
  $("#inMsg").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("#btnAddCliente").click(); } });
  $("#btnLimparAlertas").addEventListener("click", () => { S.alertas = []; save(); renderAlertas(); });

  /* Importa conversa exportada do WhatsApp ("Exportar conversa" > sem mídia) */
  $("#btnColarConversa").addEventListener("click", () => {
    const txt = $("#inMsg").value;
    if (!txt.trim()) { toast("Cole a conversa exportada no campo de mensagem primeiro"); $("#inMsg").focus(); return; }
    const re = /^\[?(\d{1,2})\/(\d{1,2})\/(\d{2,4})[,\s]+(\d{1,2}):(\d{2})(?::\d{2})?\]?\s*(?:-\s*)?([^:]{1,60}):\s?(.*)$/;
    const clinica = cfg.nomesClinica.split(",").map(norm).filter(Boolean);
    const msgs = [];
    txt.split(/\r?\n/).forEach((linha) => {
      const m = linha.replace(/[‎‏]/g, "").match(re);
      if (m) {
        let [, d, mo, a, h, mi, autor, corpo] = m;
        if (a.length === 2) a = "20" + a;
        const ts = new Date(+a, +mo - 1, +d, +h, +mi).toISOString();
        const na = norm(autor);
        const quem = clinica.some((c) => na.includes(c)) ? "clinica" : "cliente";
        msgs.push({ quem, texto: corpo, ts, autor });
      } else if (msgs.length && linha.trim()) {
        msgs[msgs.length - 1].texto += "\n" + linha;
      }
    });
    if (!msgs.length) { toast("Formato não reconhecido — use 'Exportar conversa' do WhatsApp"); return; }
    if (!S.paciente.nome) { const c = msgs.find((m) => m.quem === "cliente"); if (c) { S.paciente.nome = c.autor.trim(); $("#pNome").value = S.paciente.nome; } }
    msgs.filter((m) => !/<(m[ií]dia oculta|media omitted)>/i.test(m.texto)).forEach((m) => addMsg(m.quem, m.texto, "importado", { ts: m.ts }));
    $("#inMsg").value = "";
    toast(msgs.length + " mensagens importadas");
  });

  /* ---------------- gravação presencial ---------------- */
  let rec = null, chunks = [], stream = null, sr = null, gravando = false, quemFala = "cliente";
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  $("#chkConsent").addEventListener("change", (e) => {
    S.consentimento = e.target.checked ? { aceito: true, em: new Date().toISOString() } : { aceito: false, em: null };
    $("#btnRec").disabled = !e.target.checked;
    if (!e.target.checked && gravando) pararGravacao();
    save();
  });
  $("#segQuem").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; quemFala = b.dataset.q; $$("#segQuem button").forEach((x) => x.classList.toggle("on", x === b)); });

  $("#btnRec").addEventListener("click", async () => {
    if (!S.consentimento.aceito) { toast("Registre a autorização do paciente antes de gravar"); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) { toast("Microfone não autorizado neste navegador"); return; }
    chunks = [];
    try {
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const a = $("#lnkAudio");
        a.href = URL.createObjectURL(blob);
        a.download = `consulta-${(S.paciente.nome || "paciente").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.webm`;
        a.classList.remove("hide");
        ultimoAudioBlob = blob;
        if (EP.audio) $("#btnTranscreverGravacao").classList.remove("hide");
      };
      rec.start(1000);
    } catch (e) { rec = null; }
    gravando = true;
    $("#pillRec").classList.remove("hide"); $("#btnRec").classList.add("hide"); $("#btnStop").classList.remove("hide");
    if (SR) {
      iniciarSR();
      $("#recHint").textContent = "Transcrevendo em tempo real. Toque em “Paciente” ou “Eu” para indicar quem está falando.";
    } else {
      $("#recHint").textContent = "A transcrição automática funciona no Google Chrome. O áudio está sendo gravado; digite os pontos principais no campo de mensagem.";
    }
  });
  $("#btnStop").addEventListener("click", pararGravacao);

  function iniciarSR() {
    sr = new SR();
    sr.lang = "pt-BR"; sr.continuous = true; sr.interimResults = true;
    sr.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) addMsg(quemFala, r[0].transcript, "voz");
        else interim += r[0].transcript;
      }
      $("#interim").textContent = interim;
    };
    sr.onerror = (e) => { if (e.error === "not-allowed") { $("#recHint").textContent = "Transcrição bloqueada pelo navegador."; } };
    sr.onend = () => { if (gravando) { try { sr.start(); } catch (e) { /* reinício */ } } };
    try { sr.start(); } catch (e) { /* já iniciado */ }
  }

  function pararGravacao() {
    gravando = false;
    try { sr && sr.stop(); } catch (e) { /* */ }
    try { rec && rec.state !== "inactive" && rec.stop(); } catch (e) { /* */ }
    stream && stream.getTracks().forEach((t) => t.stop());
    $("#pillRec").classList.add("hide"); $("#btnRec").classList.remove("hide"); $("#btnStop").classList.add("hide");
    $("#interim").textContent = "";
    $("#recHint").textContent = "Gravação encerrada. O áudio fica só neste aparelho: baixe-o se quiser anexar ao prontuário.";
  }

  /* ---------------- integração n8n ---------------- */
  async function post(url, body) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ token: cfg.token }, body)) });
    if (r.status === 401 && PLAT) { location.href = "login"; throw new Error("sessão expirada"); }
    const txt = await r.text();
    let data = {}; try { data = txt ? JSON.parse(txt) : {}; } catch (e) { data = { texto: txt }; }
    if (!r.ok) throw new Error(data.erro || data.message || ("HTTP " + r.status));
    return data;
  }

  function payload() {
    return {
      evento: "consulta_copiloto",
      consulta: {
        id: S.id, inicio: S.criadoEm, atualizado: new Date().toISOString(), canal: S.canal, unidade: S.unidade,
        profissional: cfg.profissional, etapa_alcancada: S.etapa,
        consentimento_gravacao: S.consentimento, compareceu: compareceu()
      },
      paciente: { nome: S.paciente.nome, telefone: telE164(S.paciente.telefone), origem: S.paciente.origem, lead_id: S.paciente.leadId || null },
      notas: S.notas,
      orcamento: {
        tratamento: S.orcamento.tratamento, valor: toNum(S.orcamento.valor) || 0, entrada: toNum(S.orcamento.entrada) || 0,
        parcelas: parseInt(S.orcamento.parcelas, 10) || 0, forma_pagamento: S.orcamento.pagamento
      },
      resultado: S.resultado || "negociacao", motivo_perda: S.motivoPerda,
      proximo_contato: S.proximoContato ? new Date(S.proximoContato).toISOString() : null,
      temperatura: S.temperatura,
      objecoes: Object.keys(S.objecoes).map((id) => ({ id, titulo: (R.objecoes.find((o) => o.id === id) || {}).titulo, vezes: S.objecoes[id] })),
      checklist: R.etapas.map((e) => ({ etapa: e.nome, feitos: progresso(e).feitos, total: progresso(e).tot })),
      resumo: S.resumoEditado ? S.resumo : gerarResumo(),
      transcricao: S.conversa.map((m) => ({ quem: m.quem, texto: m.texto, ts: m.ts, origem: m.origem }))
    };
  }

  async function enviarKommo() {
    if (!EP.reg) { toast(avisoFalta("o Kommo")); if (!PLAT) mostrarView("config"); return; }
    if (!S.paciente.nome || !digits(S.paciente.telefone)) { toast("Preencha nome e WhatsApp do paciente"); mostrarView("consulta"); return; }
    const st = $("#kommoStatus"); st.textContent = "Enviando…";
    try {
      const d = await post(EP.reg, payload());
      if (d.lead_id) { S.paciente.leadId = String(d.lead_id); $("#pLead").value = S.paciente.leadId; }
      S.sincronizadoEm = new Date().toISOString();
      save(); renderSync();
      st.textContent = "✓ Enviado ao Kommo" + (d.lead_id ? " — lead " + d.lead_id : "") + " em " + dataHora(S.sincronizadoEm);
      toast("Enviado ao Kommo ✓");
    } catch (e) {
      st.textContent = "Erro ao enviar: " + e.message + ". Confira a URL, a chave e se o fluxo está ativo no n8n.";
      toast("Falha ao enviar ao Kommo");
    }
  }
  $("#btnKommo").addEventListener("click", enviarKommo);
  $("#btnKommo2").addEventListener("click", enviarKommo);

  function renderSync() { $("#syncInfo").textContent = S.sincronizadoEm ? "Kommo ✓ " + dataHora(S.sincronizadoEm) : ""; }

  $("#btnIA").addEventListener("click", async () => {
    if (!EP.ia) { toast(avisoFalta("a IA")); if (!PLAT) mostrarView("config"); return; }
    const b = $("#btnIA"); b.disabled = true; b.textContent = "✨ Pensando…";
    try {
      const et = R.etapas.find((e) => e.id === S.etapa);
      const d = await post(EP.ia, {
        evento: "sugestao_copiloto",
        canal: S.canal, unidade: S.unidade, etapa: et.nome, objetivo_etapa: et.objetivo,
        paciente: { nome: S.paciente.nome, lead_id: S.paciente.leadId || null },
        notas: S.notas, orcamento: S.orcamento, temperatura: S.temperatura,
        objecoes: Object.keys(S.objecoes),
        condicao: condicaoVigente() ? cfg.condicao + (cfg.validade ? " (válida até " + validadeTxt() + ")" : "") : "", garantia: cfg.garantia,
        conversa: S.conversa.slice(-25).map((m) => ({ quem: m.quem, texto: m.texto }))
      });
      const txt = d.sugestao || d.output || d.text || d.texto || "";
      if (!txt) throw new Error("resposta vazia");
      S.alertas.unshift({ tipo: "ia", texto: String(txt).trim(), orientacao: d.orientacao || "", ts: new Date().toISOString() });
      save(); renderAlertas();
    } catch (e) { toast("IA indisponível: " + e.message); }
    b.disabled = false; b.textContent = "✨ Sugestão da IA";
  });

  /* Acompanhar WhatsApp: busca no n8n as mensagens que o Kommo recebeu/enviou */
  let pollTimer = null;
  async function poll() {
    if (!EP.msg || !S.paciente.leadId) { $("#aoVivoInfo").textContent = !EP.msg ? avisoFalta("o WhatsApp ao vivo") : "Informe o ID do lead no Kommo (campo à esquerda) para acompanhar."; return; }
    try {
      const u = new URL(EP.msg, location.href);
      u.searchParams.set("lead", S.paciente.leadId);
      u.searchParams.set("desde", S.ultimoSync || "1970-01-01T00:00:00.000Z"); // 1ª busca traz o histórico recente do lead
      u.searchParams.set("token", cfg.token);
      const r = await fetch(u.toString());
      if (!r.ok) throw new Error("HTTP " + r.status);
      const d = await r.json();
      (d.mensagens || []).forEach((m) => {
        if (m.anexo && m.audio) {
          if (S.msgIds[m.id]) return;
          S.msgIds[m.id] = 1;
          transcreverAudio({ url: m.anexo }, m.autor === "clinica" ? "clinica" : "cliente", m.ts);
        } else addMsg(m.autor === "clinica" ? "clinica" : "cliente", m.texto, m.ia ? "kommo-ia" : "kommo", { id: m.id, ts: m.ts });
        if (!S.ultimoSync || m.ts > S.ultimoSync) S.ultimoSync = m.ts;
      });
      $("#aoVivoInfo").textContent = "Conectado · última verificação " + new Date().toLocaleTimeString("pt-BR");
    } catch (e) { $("#aoVivoInfo").textContent = "Sem conexão com o n8n (" + e.message + ")"; }
  }
  $("#chkAoVivo").addEventListener("change", (e) => {
    clearInterval(pollTimer);
    if (e.target.checked) { poll(); pollTimer = setInterval(poll, 5000); }
    else $("#aoVivoInfo").textContent = "";
  });

  $("#btnTestar").addEventListener("click", async () => {
    const st = $("#testeStatus"); st.textContent = "Testando…";
    const res = [];
    for (const [nome, url] of [["Registro", EP.reg], ["IA", EP.ia]]) {
      if (!url) { res.push(nome + ": não configurado"); continue; }
      try { await post(url, { evento: "teste" }); res.push(nome + ": ✓"); } catch (e) { res.push(nome + ": ✗ " + e.message); }
    }
    if (EP.msg) {
      try { const u = new URL(EP.msg, location.href); u.searchParams.set("token", cfg.token); u.searchParams.set("lead", "0"); const r = await fetch(u); res.push("Mensagens: " + (r.ok ? "✓" : "✗ HTTP " + r.status)); }
      catch (e) { res.push("Mensagens: ✗ " + e.message); }
    } else res.push("Mensagens: não configurado");
    st.textContent = res.join(" · ");
  });

  /* ---------------- áudios (WhatsApp e gravação) ---------------- */
  async function transcreverAudio(fonte, quem = "cliente", ts) {
    if (!EP.audio) { toast(avisoFalta("a transcrição de áudio")); return null; }
    const fd = new FormData();
    fd.append("token", cfg.token);
    fd.append("lead", S.paciente.leadId || "");
    if (fonte.url) fd.append("url", fonte.url);
    if (fonte.arquivo) fd.append("data", fonte.arquivo, fonte.nome || "audio.ogg");
    toast("Transcrevendo áudio…");
    try {
      const r = PLAT
        ? (fonte.url
          ? await fetch(EP.audio, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: fonte.url }) })
          : await fetch(EP.audio, { method: "POST", headers: { "Content-Type": fonte.arquivo.type || "audio/ogg" }, body: fonte.arquivo }))
        : await fetch(EP.audio, { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.texto) throw new Error(d.erro || "HTTP " + r.status);
      addMsg(quem, d.texto, "audio", { ts });
      toast("Áudio transcrito ✓");
      return d.texto;
    } catch (e) { toast("Falha ao transcrever: " + e.message); addMsg(quem, "🎧 [áudio não transcrito]", "audio", { ts, semAnalise: true }); return null; }
  }
  $("#btnAudio").addEventListener("click", () => $("#fileAudio").click());
  $("#fileAudio").addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) await transcreverAudio({ arquivo: f, nome: f.name }, "cliente");
    e.target.value = "";
  });
  let ultimoAudioBlob = null;
  $("#btnTranscreverGravacao").addEventListener("click", async () => {
    if (!ultimoAudioBlob) return;
    const b = $("#btnTranscreverGravacao"); b.disabled = true;
    await transcreverAudio({ arquivo: ultimoAudioBlob, nome: "consulta.webm" }, "cliente");
    b.disabled = false;
  });

  /* ---------------- nota da consulta (sem IA) ---------------- */
  function pct(id) { const et = R.etapas.find((e) => e.id === id); const p = progresso(et); return p.tot ? p.feitos / p.tot : 0; }
  function avaliar() {
    const itens = [
      { peso: 10, ok: !!S.notas.dor, txt: "Anotar a dor principal com as palavras do paciente" },
      { peso: 5, ok: !!S.notas.evento, txt: "Descobrir uma data ou evento que crie prazo natural" },
      { peso: 15, ok: pct("descoberta"), txt: "Completar a Descoberta (motivação, prazo, quem decide)" },
      { peso: 10, ok: pct("diagnostico"), txt: "Mostrar o escaneamento 3D e a simulação do iTero" },
      { peso: 10, ok: pct("solucao"), txt: "Recomendar UM tratamento ligado à dor do paciente" },
      { peso: 10, ok: !!toNum(S.orcamento.valor), txt: "Apresentar o investimento com valor e condição" },
      { peso: 10, ok: Object.keys(S.objecoes).length ? pct("objecoes") : 1, txt: "Tratar as objeções: ouvir, validar, isolar, responder" },
      { peso: 10, ok: pct("fechamento") > 0 || S.resultado === "fechado", txt: "Fazer a pergunta de fechamento" },
      { peso: 15, ok: S.resultado === "fechado" || !!S.proximoContato, txt: "Sair com o fechamento ou com data/hora do próximo contato" },
      { peso: 5, ok: !!S.resultado, txt: "Registrar o resultado" }
    ];
    let nota = 0; const melhorar = [];
    itens.forEach((i) => { const v = i.ok === true ? 1 : i.ok === false ? 0 : Number(i.ok) || 0; nota += i.peso * v; if (v < 1) melhorar.push(i.txt); });
    return { nota: Math.round(nota), melhorar };
  }
  function renderNota() {
    const el = $("#notaConsulta"); if (!el) return;
    const a = avaliar();
    const cor = a.nota >= 75 ? "var(--good)" : a.nota >= 50 ? "var(--warn)" : "var(--bad)";
    el.innerHTML = `<div class="row" style="align-items:baseline"><span style="flex:0 0 auto;font-size:40px;font-weight:800;color:${cor}">${a.nota}</span><span class="muted" style="flex:0 0 auto">/100</span></div>
      ${a.melhorar.length ? `<p class="small muted" style="margin:6px 0 4px">Para melhorar:</p><ul class="perg small">${a.melhorar.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : `<p class="small">Consulta conduzida de ponta a ponta. 👏</p>`}`;
  }
  $("#btnAvaliarIA").addEventListener("click", async () => {
    if (!EP.ia) { toast(avisoFalta("a IA")); if (!PLAT) mostrarView("config"); return; }
    const b = $("#btnAvaliarIA"), out = $("#avaliacaoIA"); b.disabled = true; out.textContent = "Analisando a consulta…";
    try {
      const d = await post(EP.ia, {
        evento: "avaliar_consulta", canal: S.canal, unidade: S.unidade, etapa: (R.etapas.find((e) => e.id === S.etapa) || {}).nome,
        paciente: { nome: S.paciente.nome }, notas: S.notas, orcamento: S.orcamento, temperatura: S.temperatura,
        objecoes: Object.keys(S.objecoes), resultado: S.resultado, nota_local: avaliar().nota,
        conversa: S.conversa.slice(-120).map((m) => ({ quem: m.quem, texto: m.texto }))
      });
      out.innerHTML = `${d.orientacao ? `<b>${esc(d.orientacao)}</b><br>` : ""}<span style="white-space:pre-wrap">${esc(d.sugestao || "")}</span>`;
      S.avaliacaoIA = (d.orientacao ? d.orientacao + "\n" : "") + (d.sugestao || ""); save();
    } catch (e) { out.textContent = "IA indisponível: " + e.message; }
    b.disabled = false;
  });

  /* ---------------- painel de resultados ---------------- */
  function renderMetricas() {
    const el = $("#metricas"); if (!el) return;
    const lista = Object.values(consultas).filter((c) => c.paciente && (c.paciente.nome || c.conversa.length));
    const fech = lista.filter((c) => c.resultado === "fechado");
    const decididas = lista.filter((c) => c.resultado);
    const soma = (arr) => arr.reduce((t, c) => t + (toNum(c.orcamento.valor) || 0), 0);
    const neg = lista.filter((c) => c.resultado === "negociacao" || !c.resultado);
    const objs = {};
    lista.forEach((c) => Object.keys(c.objecoes || {}).forEach((k) => objs[k] = (objs[k] || 0) + 1));
    const top = Object.entries(objs).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${esc((R.objecoes.find((o) => o.id === k) || {}).titulo || k)} (${v})`);
    const porCanal = (canal) => { const l = decididas.filter((c) => c.canal === canal); return l.length ? Math.round(100 * l.filter((c) => c.resultado === "fechado").length / l.length) + "%" : "—"; };
    const tile = (n, l) => `<div class="card" style="padding:12px"><div style="font-size:24px;font-weight:800">${n}</div><div class="small muted">${l}</div></div>`;
    el.innerHTML = `<div class="lib" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
      ${tile(lista.length, "consultas")}
      ${tile(decididas.length ? Math.round(100 * fech.length / decididas.length) + "%" : "—", "taxa de fechamento")}
      ${tile(fech.length ? brl(soma(fech) / fech.length) : "—", "ticket médio fechado")}
      ${tile(brl(soma(fech)) || "R$ 0,00", "total fechado")}
      ${tile(brl(soma(neg)) || "R$ 0,00", "em negociação")}
      ${tile(porCanal("whatsapp") + " / " + porCanal("presencial"), "fechamento WhatsApp / presencial")}
    </div>
    <p class="small" style="margin:10px 0 0"><b>Objeções mais frequentes:</b> ${top.length ? top.join(" · ") : "—"}</p>`;
  }

  /* ---------------- resumo ---------------- */
  function gerarResumo() {
    const et = R.etapas.find((e) => e.id === S.etapa);
    const res = { fechado: "FECHOU ✅", negociacao: "Em negociação ⏳", perdido: "Não fechou ❌" }[S.resultado] || "Em negociação ⏳";
    const objs = Object.keys(S.objecoes).map((id) => "• " + ((R.objecoes.find((o) => o.id === id) || {}).titulo || id) + (S.objecoes[id] > 1 ? ` (${S.objecoes[id]}x)` : "")).join("\n") || "• Nenhuma registrada";
    const v = toNum(S.orcamento.valor);
    const linhas = [
      `CONSULTA — COPILOTO WEISS`,
      `${dataHora(S.criadoEm)} · ${S.canal === "whatsapp" ? "WhatsApp" : "Presencial"} · ${S.unidade} · ${cfg.profissional}`,
      `Paciente: ${S.paciente.nome || "-"} · ${S.paciente.telefone || "-"}${S.paciente.origem ? " · Origem: " + S.paciente.origem : ""}`,
      ``,
      `RESULTADO: ${res}${S.resultado === "perdido" && S.motivoPerda ? " — " + S.motivoPerda : ""}`,
      `Compareceu na clínica: ${compareceu() ? "sim" : "não (conversa pelo WhatsApp)"}`,
      `Temperatura: ${S.temperatura}/100 · Etapa alcançada: ${et ? et.nome : "-"}`,
      S.proximoContato ? `Próximo contato: ${dataHora(S.proximoContato)}` : `Próximo contato: não combinado`,
      ``,
      `DESCOBERTA`,
      `• Dor principal: ${S.notas.dor || "-"}`,
      `• Evento/prazo: ${S.notas.evento || "-"}`,
      S.notas.livre ? `• Notas: ${S.notas.livre}` : null,
      ``,
      `ORÇAMENTO`,
      `• Tratamento: ${S.orcamento.tratamento || "-"}`,
      `• Valor: ${isNaN(v) ? "-" : brl(v)}${S.orcamento.entrada ? " · Entrada: " + brl(toNum(S.orcamento.entrada)) : ""}${parcelaTxt() ? " · " + parcelaTxt() : ""}`,
      S.orcamento.pagamento ? `• Pagamento: ${S.orcamento.pagamento}` : null,
      ``,
      `OBJEÇÕES`,
      objs,
      ``,
      `Sinais de compra: ${S.sinaisCompra} · Nota da condução: ${avaliar().nota}/100`,
      S.canal === "presencial" ? `Gravação: ${S.consentimento.aceito ? "autorizada pelo paciente em " + dataHora(S.consentimento.em) : "não gravada"}` : null,
      `Mensagens/falas registradas: ${S.conversa.length}`
    ].filter((l) => l !== null);
    const txt = linhas.join("\n");
    if (!S.resumoEditado) { S.resumo = txt; const el = $("#resumoTxt"); if (el && document.activeElement !== el) el.value = txt; }
    return txt;
  }
  $("#resumoTxt").addEventListener("input", (e) => { S.resumo = e.target.value; S.resumoEditado = true; save(); });
  $("#btnGerarResumo").addEventListener("click", () => { S.resumoEditado = false; gerarResumo(); save(); });
  $("#btnCopiarResumo").addEventListener("click", () => copiar($("#resumoTxt").value));
  $("#btnImprimir").addEventListener("click", () => window.print());

  /* ---------------- bibliotecas ---------------- */
  function renderObjecoes() {
    const q = norm($("#qObj").value);
    $("#libObj").innerHTML = R.objecoes.filter((o) => !q || norm(o.titulo + " " + o.gatilhos.join(" ") + " " + o.respostas.join(" ")).includes(q)).map((o) => `
      <div class="card"><h2>🛡️ ${esc(o.titulo)}</h2>
        <p class="small muted" style="margin:0 0 6px"><b>Entenda:</b> ${esc(o.entender)}</p>
        ${o.respostas.map((r) => { const t = preencher(r); return `<div class="fala"><p style="font-size:15px">${esc(t)}</p>${botoesFala(t)}</div>`; }).join("")}
        <div class="dica">➡ ${esc(preencher(o.proximo))}</div>
      </div>`).join("") || `<p class="muted">Nada encontrado.</p>`;
  }
  $("#qObj").addEventListener("input", renderObjecoes);

  function renderMensagens() {
    $("#libMsg").innerHTML = R.mensagens.map((g) => `
      <div class="card"><h2>${esc(g.grupo)}</h2>
        ${g.itens.map((m) => { const t = preencher(m.texto), av = avisoRequer(m); return `<div class="fala"${av ? ' style="opacity:.6"' : ""}><span class="lbl">${esc(m.rotulo)}</span><p style="font-size:15px">${esc(t)}</p>${av ? `<div class="dica">${esc(av)}</div>` : botoesFala(t)}</div>`; }).join("")}
      </div>`).join("");
  }

  /* ---------------- histórico ---------------- */
  function renderHistorico() {
    const lista = Object.values(consultas).sort((a, b) => (b.criadoEm > a.criadoEm ? 1 : -1));
    $("#histBody").innerHTML = lista.map((c) => `
      <tr><td>${dataHora(c.criadoEm)}</td><td>${esc(c.paciente.nome || "—")}</td><td>${c.canal === "whatsapp" ? "WhatsApp" : "Presencial"}</td><td>${esc(c.unidade)}</td>
        <td>${c.resultado ? `<span class="status ${c.resultado}">${{ fechado: "Fechou", negociacao: "Negociação", perdido: "Não fechou" }[c.resultado]}</span>` : "—"}</td>
        <td>${c.sincronizadoEm ? "✓" : "—"}</td>
        <td style="white-space:nowrap"><button class="btn sm" data-abrir="${c.id}">Abrir</button> <button class="btn sm danger" data-apagar="${c.id}">Apagar</button></td></tr>`).join("")
      || `<tr><td colspan="7" class="muted">Nenhuma consulta salva.</td></tr>`;
  }
  $("#histBody").addEventListener("click", (e) => {
    const a = e.target.closest("[data-abrir]"), d = e.target.closest("[data-apagar]");
    if (a) { abrir(consultas[a.dataset.abrir]); mostrarView("consulta"); }
    if (d && confirmar(d, "Toque de novo para apagar")) {
      delete consultas[d.dataset.apagar]; store(KEY_CONS, consultas);
      if (S.id === d.dataset.apagar) abrir(novaConsulta());
      renderHistorico();
    }
  });
  $("#btnExportar").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(Object.values(consultas), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "copiloto-consultas.json"; a.click();
  });

  /* ---------------- formulários ---------------- */
  function bind(sel, get, set) {
    const el = $(sel);
    el.addEventListener("input", () => { set(el.value); save(); onDadosMudaram(sel); });
    el.addEventListener("change", () => { set(el.value); save(); onDadosMudaram(sel); });
    return () => { el.value = get() || ""; };
  }
  let rerenderTimer = null;
  function onDadosMudaram(sel) {
    if (sel === "#oValor" || sel === "#oEntrada" || sel === "#oParcelas") calcOrc();
    clearTimeout(rerenderTimer);
    rerenderTimer = setTimeout(() => { renderEtapa(); if (!S.resumoEditado) gerarResumo(); renderNota(); }, 400);
  }
  function calcOrc() { const p = parcelaTxt(); $("#oCalc").textContent = p ? `Saldo parcelado: ${p}` : ""; }

  const binders = [
    bind("#pNome", () => S.paciente.nome, (v) => S.paciente.nome = v),
    bind("#pTel", () => S.paciente.telefone, (v) => S.paciente.telefone = v),
    bind("#pOrigem", () => S.paciente.origem, (v) => S.paciente.origem = v),
    bind("#pLead", () => S.paciente.leadId, (v) => S.paciente.leadId = digits(v)),
    bind("#nDor", () => S.notas.dor, (v) => S.notas.dor = v),
    bind("#nEvento", () => S.notas.evento, (v) => S.notas.evento = v),
    bind("#nNotas", () => S.notas.livre, (v) => S.notas.livre = v),
    bind("#hDia1", () => S.horarios.dia1, (v) => S.horarios.dia1 = v),
    bind("#hHora1", () => S.horarios.hora1, (v) => S.horarios.hora1 = v),
    bind("#hDia2", () => S.horarios.dia2, (v) => S.horarios.dia2 = v),
    bind("#hHora2", () => S.horarios.hora2, (v) => S.horarios.hora2 = v),
    bind("#oTrat", () => S.orcamento.tratamento, (v) => S.orcamento.tratamento = v),
    bind("#oValor", () => S.orcamento.valor, (v) => S.orcamento.valor = v),
    bind("#oEntrada", () => S.orcamento.entrada, (v) => S.orcamento.entrada = v),
    bind("#oParcelas", () => S.orcamento.parcelas, (v) => S.orcamento.parcelas = v),
    bind("#oPag", () => S.orcamento.pagamento, (v) => S.orcamento.pagamento = v),
    bind("#rMotivo", () => S.motivoPerda, (v) => S.motivoPerda = v),
    bind("#rProx", () => S.proximoContato, (v) => S.proximoContato = v)
  ];
  $("#rMotivo").innerHTML = `<option value="">—</option>` + R.motivosPerda.map((m) => `<option>${esc(m)}</option>`).join("");

  /* Compareceu na clínica: marcado sozinho na consulta presencial, mas pode ser alterado */
  function compareceu() { return S.compareceu == null ? S.canal === "presencial" : !!S.compareceu; }
  $("#chkCompareceu").addEventListener("change", (e) => { S.compareceu = e.target.checked; save(); if (!S.resumoEditado) gerarResumo(); });

  function setCanal(c) {
    S.canal = c;
    $$("#segCanal button").forEach((b) => b.classList.toggle("on", b.dataset.c === c));
    $("#pillCanal").textContent = c === "whatsapp" ? "WhatsApp" : "Presencial";
    $("#boxPresencial").classList.toggle("hide", c !== "presencial");
    $("#boxWhats").classList.toggle("hide", c !== "whatsapp");
    if (c !== "presencial" && gravando) pararGravacao();
    $("#chkCompareceu").checked = compareceu();
  }
  function setUnidade(u) { S.unidade = u; $$("#segUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === u)); }
  function setResultado(r) {
    S.resultado = r;
    $$("#segRes button").forEach((b) => b.classList.toggle("on", b.dataset.r === r));
    $("#boxPerda").classList.toggle("hide", r !== "perdido");
  }
  $("#segCanal").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setCanal(b.dataset.c); save(); renderEtapa(); });
  $("#segUnidade").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setUnidade(b.dataset.u); save(); renderEtapa(); });
  $("#segRes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; setResultado(b.dataset.r); save(); if (!S.resumoEditado) gerarResumo(); renderNota(); });

  /* configurações */
  function aplicarTema() {
    if (cfg.tema === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", cfg.tema);
    $$("#segTema button").forEach((b) => b.classList.toggle("on", b.dataset.t === cfg.tema));
  }
  $("#segTema").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; cfg.tema = b.dataset.t; store(KEY_CFG, cfg); aplicarTema(); });
  [["#cProf", "profissional"], ["#cNomesClinica", "nomesClinica"], ["#cWhReg", "whReg"], ["#cWhIA", "whIA"], ["#cWhMsg", "whMsg"], ["#cWhAudio", "whAudio"], ["#cToken", "token"],
    ["#cCondicao", "condicao"], ["#cValidade", "validade"], ["#cGarantia", "garantia"]].forEach(([sel, k]) => {
    const el = $(sel); el.value = cfg[k] || "";
    const upd = () => { cfg[k] = el.value.trim(); store(KEY_CFG, cfg); renderEtapa(); renderCondicao(); };
    el.addEventListener("input", upd); el.addEventListener("change", upd);
  });
  function renderCondicao() {
    const el = $("#condInfo"); if (!el) return;
    if (!cfg.condicao) el.textContent = "Nenhuma condição cadastrada: as falas de condição especial ficam desativadas.";
    else if (!condicaoVigente()) el.textContent = "⚠️ Condição vencida: as falas de condição ficam desativadas.";
    else el.textContent = "✓ Condição ativa" + (cfg.validade ? " até " + validadeTxt() : " (sem prazo)") + ".";
  }
  renderCondicao();

  /* ---------------- abrir / nova ---------------- */
  function abrir(c) {
    if (gravando) pararGravacao();
    clearInterval(pollTimer); $("#chkAoVivo").checked = false; $("#aoVivoInfo").textContent = "";
    S = Object.assign(novaConsulta(), c);
    binders.forEach((f) => f());
    setCanal(S.canal); setUnidade(S.unidade); setResultado(S.resultado);
    $("#chkConsent").checked = !!S.consentimento.aceito; $("#btnRec").disabled = !S.consentimento.aceito;
    $("#lnkAudio").classList.add("hide"); $("#recHint").textContent = "";
    $("#resumoTxt").value = S.resumo || "";
    $("#kommoStatus").textContent = "";
    $("#kommoLeadInfo").textContent = S.kommo ? `${S.kommo.funil || ""}${S.kommo.etapa ? " › " + S.kommo.etapa : ""} · ${S.kommo.humano ? "✋ Atendimento humano (IA pausada)" : "🤖 IA atendendo"}` : "";
    mostrarSituacaoIA(S.kommo && S.kommo.humano);
    $("#avaliacaoIA").textContent = S.avaliacaoIA || "";
    $("#btnTranscreverGravacao").classList.add("hide"); ultimoAudioBlob = null;
    calcOrc(); renderSteps(); renderEtapa(); renderChat(); renderAlertas(); renderTermometro(); renderSync(); renderObjecoes();
    save();
  }
  $("#btnNova").addEventListener("click", (e) => {
    if (S.conversa.length && !S.sincronizadoEm && !S.exemplo && !confirmar(e.currentTarget, "Não enviada ao Kommo — tocar de novo")) return;
    abrir(novaConsulta()); mostrarView("consulta"); $("#pNome").focus();
  });

  /* Atendimento de exemplo (fictício) para conhecer o sistema */
  function carregarExemplo() {
    const c = novaConsulta();
    Object.assign(c, {
      exemplo: true, etapa: "investimento",
      paciente: { nome: "Maria Exemplo (fictícia)", telefone: "(81) 90000-0000", origem: "Instagram", leadId: "" },
      notas: { dor: "os dentes da frente tortos aparecem nas fotos", evento: "casamento em maio", livre: "Já usou aparelho fixo na adolescência. Marido participa da decisão." },
      horarios: { dia1: "terça-feira", hora1: "14h", dia2: "quinta-feira", hora2: "18h" },
      orcamento: { tratamento: "Invisalign", valor: "12000", entrada: "2000", parcelas: "10", pagamento: "Entrada + cartão" },
      checks: { acolhimento: { 0: true, 2: true }, descoberta: { 0: true, 1: true, 2: true, 3: true }, diagnostico: { 0: true, 1: true, 3: true } }
    });
    abrir(c);
    [["cliente", "Oi! Vi o anúncio de vocês. Quanto custa o aparelho invisível?"],
     ["clinica", "Olá, Maria! Que bom que você nos chamou 😊 Me conta: o que mais te incomoda hoje no seu sorriso?"],
     ["cliente", "Meus dentes da frente tortos, aparecem muito nas fotos. E vou casar em maio"],
     ["cliente", "Gostei da simulação! Mas achei caro, vou pensar e falar com meu marido"]
    ].forEach(([q, t]) => addMsg(q, t, "exemplo"));
    toast("Atendimento de exemplo carregado");
  }
  $("#btnExemplo").addEventListener("click", () => { carregarExemplo(); mostrarView("consulta"); });

  /* ---------------- Kommo direto (plataforma) ---------------- */
  async function apiGet(rota) {
    const r = await fetch(rota, { headers: { Accept: "application/json" } });
    if (r.status === 401) { location.href = "login"; throw new Error("sessão expirada"); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || "HTTP " + r.status);
    return d;
  }
  function mostrarSituacaoIA(humano) {
    $("#btnAssumir").classList.toggle("hide", !!humano);
    $("#btnDevolverIA").classList.toggle("hide", !humano);
  }
  $("#btnPuxarKommo").addEventListener("click", async () => {
    const id = S.paciente.leadId, tel = digits(S.paciente.telefone);
    if (!id && !tel) { toast("Informe o WhatsApp ou o ID do lead"); return; }
    const info = $("#kommoLeadInfo"); info.textContent = "Buscando no Kommo…";
    try {
      const d = await apiGet("api/kommo/lead?" + (id ? "id=" + encodeURIComponent(id) : "telefone=" + encodeURIComponent(tel)));
      S.paciente.leadId = String(d.lead_id); $("#pLead").value = S.paciente.leadId;
      if (d.nome && !S.paciente.nome) { S.paciente.nome = d.nome; $("#pNome").value = d.nome; }
      if (d.telefone && !digits(S.paciente.telefone)) { S.paciente.telefone = d.telefone; $("#pTel").value = d.telefone; }
      if (d.unidade) setUnidade(d.unidade);
      if (d.origem) { S.paciente.origem = d.origem; $("#pOrigem").value = d.origem; }
      S.kommo = { funil: d.funil, etapa: d.etapa, humano: d.humano };
      info.innerHTML = `Lead <b>${esc(d.lead_id)}</b>${d.funil ? " · " + esc(d.funil) : ""}${d.etapa ? " › " + esc(d.etapa) : ""}${d.unidade ? " · " + esc(d.unidade) : " · unidade não identificada"}<br>${d.humano ? "✋ Atendimento humano (IA pausada)" : "🤖 IA atendendo"}`;
      mostrarSituacaoIA(d.humano);
      save(); renderEtapa();
      if (EP.msg) { S.ultimoSync = null; await poll(); }
      toast("Dados do Kommo carregados");
    } catch (e) { info.textContent = e.message; }
  });
  async function trocarAtendimento(humano) {
    if (!S.paciente.leadId) { toast("Puxe o lead do Kommo primeiro"); return; }
    try {
      const d = await post("api/kommo/atendimento", { lead_id: S.paciente.leadId, humano });
      S.kommo = Object.assign(S.kommo || {}, { humano: d.humano }); save();
      mostrarSituacaoIA(d.humano);
      $("#kommoLeadInfo").innerHTML = $("#kommoLeadInfo").innerHTML.replace(/(✋ Atendimento humano \(IA pausada\)|🤖 IA atendendo)/, d.humano ? "✋ Atendimento humano (IA pausada)" : "🤖 IA atendendo");
      toast(d.humano ? "Você assumiu — etiqueta \"" + d.etiqueta + "\" adicionada" : "Lead devolvido para a IA");
    } catch (e) { toast("Kommo: " + e.message); }
  }
  $("#btnAssumir").addEventListener("click", () => trocarAtendimento(true));
  $("#btnDevolverIA").addEventListener("click", () => trocarAtendimento(false));

  let FUNIS = [];
  function opcoes(sel, lista, valor, vazio) {
    $(sel).innerHTML = (vazio ? `<option value="">${vazio}</option>` : "") + lista.map((x) => `<option value="${x.id}"${String(x.id) === String(valor) ? " selected" : ""}>${esc(x.nome)}</option>`).join("");
  }
  function etapasDe(funilId) { const f = FUNIS.find((x) => String(x.id) === String(funilId)); return f ? f.etapas : []; }
  async function carregarFunis() {
    const st = $("#funisStatus");
    try {
      const [f, a] = await Promise.all([apiGet("api/kommo/funis"), apiGet("api/ajustes")]);
      FUNIS = f.funis; const aj = a.ajustes;
      const adivinha = (re) => (FUNIS.find((x) => re.test(x.nome)) || {}).id;
      const lead = aj.funilLead || adivinha(/lead/i) || "";
      const cli = aj.funilCliente || adivinha(/client/i) || "";
      opcoes("#fFunilLead", FUNIS, lead, "— escolha —");
      opcoes("#fFunilCliente", FUNIS, cli, "— escolha —");
      opcoes("#fEtapaNeg", etapasDe(lead), aj.etapaNegociacao, "não mudar a etapa");
      opcoes("#fEtapaPerdido", etapasDe(lead), aj.etapaPerdido || 143);
      opcoes("#fEtapaCliente", etapasDe(cli), aj.etapaCliente, "— escolha —");
      opcoes("#fEtapaCliFechou", etapasDe(cli), aj.etapaClienteFechou, "mesma etapa de quem compareceu");
      opcoes("#fEtapaCliPerdido", etapasDe(cli), aj.etapaClientePerdido || 143);
      $("#fEtiqueta").value = aj.etiquetaHumano || "Atendimento humano";
      st.textContent = aj.funilLead ? "" : "Confira os funis sugeridos e clique em Salvar.";
    } catch (e) { st.textContent = "Não foi possível ler os funis: " + e.message; }
  }
  $("#fFunilLead").addEventListener("change", (e) => { opcoes("#fEtapaNeg", etapasDe(e.target.value), "", "não mudar a etapa"); opcoes("#fEtapaPerdido", etapasDe(e.target.value), 143); });
  $("#fFunilCliente").addEventListener("change", (e) => {
    opcoes("#fEtapaCliente", etapasDe(e.target.value), "", "— escolha —");
    opcoes("#fEtapaCliFechou", etapasDe(e.target.value), "", "mesma etapa de quem compareceu");
    opcoes("#fEtapaCliPerdido", etapasDe(e.target.value), 143);
  });
  $("#btnSalvarFunis").addEventListener("click", async () => {
    try {
      await post("api/ajustes", { funilLead: $("#fFunilLead").value, etapaNegociacao: $("#fEtapaNeg").value, etapaPerdido: $("#fEtapaPerdido").value,
        funilCliente: $("#fFunilCliente").value, etapaCliente: $("#fEtapaCliente").value,
        etapaClienteFechou: $("#fEtapaCliFechou").value, etapaClientePerdido: $("#fEtapaCliPerdido").value, etiquetaHumano: $("#fEtiqueta").value.trim() });
      $("#funisStatus").textContent = "✓ Salvo. O card só vai para o funil de clientes quando o paciente comparece.";
      toast("Funis salvos");
    } catch (e) { $("#funisStatus").textContent = "Erro ao salvar: " + e.message; }
  });

  async function detectarPlataforma() {
    if (location.protocol === "file:") return;
    try {
      const r = await fetch("api/config", { headers: { Accept: "application/json" } });
      if (!r.ok) return;
      const d = await r.json();
      if (!d.plataforma) return;
      PLAT = d;
      $("#cardN8n").classList.add("hide");
      $("#cardPlataforma").classList.remove("hide");
      const it = (ok, nome) => `<li>${ok ? "✅" : "⚪"} ${nome}${ok ? "" : " — não configurado"}</li>`;
      $("#platStatus").innerHTML = `<ul class="perg">${it(d.kommo, "Kommo (registrar consultas)")}${it(d.ia, "IA (sugestões e avaliação)")}${it(d.audio, "Transcrição de áudios")}${it(d.whatsapp, "WhatsApp ao vivo pelo Kommo")}</ul>`;
      $("#btnSair").classList.remove("hide");
      if (d.kommo) { $("#boxKommoLead").classList.remove("hide"); $("#cardFunis").classList.remove("hide"); carregarFunis(); }
      if (!EP.audio) $("#btnTranscreverGravacao").classList.add("hide");
    } catch (e) { /* aberto fora da plataforma: segue com as configurações locais */ }
  }
  detectarPlataforma();

  aplicarTema();
  const atual = consultas[load(KEY_ATUAL, "")];
  if (atual) abrir(atual);
  else if (!Object.keys(consultas).length) carregarExemplo();
  else abrir(novaConsulta());
})();
