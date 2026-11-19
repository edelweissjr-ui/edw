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
  let VERSAO = "2.4.0";
  const NOVIDADES = [
    { v: "2.4.0", data: "nov/2026", itens: ["Versículo do dia em pop-up para cada operador ao abrir o app (já pergunta quem está atendendo)", "Setores do atendimento (Comercial, Financeiro, Operacional e outros) com os nomes de quem atende, em Ajustes › Chat", "Transferir a conversa do WhatsApp para outro setor no próprio chat, com recado; filtro por setor e “Comigo”"] },
    { v: "2.3.0", data: "nov/2026", itens: ["Login com código de 6 números do Google Authenticator (opcional, em Ajustes › Segurança)", "Temas Esmeralda e Pérola, sem mudar a logomarca", "Foto do paciente do WhatsApp no círculo; palavras negativadas e correção ortográfica no chat", "Comercial em ampulheta (Funil Lead e Funil Cliente) com todos os números clicáveis; desempenho por CRC com metas", "Alerta do dia com os pacientes de maior chance; versículo diário; decisor, melhor horário, CRC e doutor na ficha"] },
    { v: "2.2.0", data: "nov/2026", itens: ["Nova logomarca Alinha · Gestão Infinity", "Linha do tempo com Finalizado e o fluxo completo do Invisalign (consulta, orçamento, pagamento, escaneamento, fotografias, radiografias, ClinCheck, alinhadores, agendamento, instalação)", "Marcar e desmarcar qualquer fase, com a data ao passar o mouse e o registro no prontuário", "Procedimentos e fases cadastráveis; ao aprovar o orçamento, a linha do tempo é criada e pode ser personalizada", "Cartões do CRM compactos com e-mail, WhatsApp, SMS, lembrete e termômetro; filtros completos no CRM"] },
    { v: "2.1.0", data: "nov/2026", itens: ["CRM em tela própria com dois funis: Funil Lead (lead novo, em contato, agendou, faltou, perdido) e Funil Cliente (compareceu, fechou, não fechou)", "Etapa do CRM direto na conversa do WhatsApp", "API aberta com tokens (ler e gravar ou só leitura) para conectar n8n, Kommo, site e outros apps", "Webhooks assinados: o Alinha avisa outros apps quando um lead entra, muda de etapa, comparece, fecha ou avança no tratamento", "Kommo: leads novos entram no Funil Lead, a mudança para o funil de clientes passa para o Funil Cliente e o card pode ser movido no Kommo quando o paciente comparece"] },
    { v: "2.0.0", data: "nov/2026", itens: ["Tratamentos: linha do tempo de cada tratamento, com a etapa atual e a próxima (coroa em porcelana, prótese e coroa sobre implante, Invisalign, aparelho fixo)", "Laboratório: trabalhos enviados com a data de entrega combinada, aviso de atraso, recebidos para agendar e colocações marcadas; avisos no Hoje", "Linha do tempo completa do paciente na ficha (comercial e tratamentos)", "Suporte: chat com IA e manual de ajuda pesquisável para tirar dúvidas sobre o sistema", "Letras mais nítidas: fonte carregada antes, mínimo de 13 px e mais contraste"] },
    { v: "1.9.0", data: "nov/2026", itens: ["Telas sem barras de rolagem: conteúdo organizado em abas e páginas para caber na tela (Comercial, Campanhas, Resultados, Consulta, Hoje e Ajustes)", "Nada rola para o lado: Follow-up e Pipeline quebram em linhas e as tabelas viram cartões no celular", "Ajustes ampliado: largura total em abas, com Unidades (endereço e contatos editáveis) e Metas do mês", "Campanhas › Resultado do mês: leads que entraram, compareceram, fecharam, faltaram, não fecharam e follow-up de orçamento, com custo por lead e por fechamento, e previsto x meta x realizado", "Celular: barra com as 4 telas principais e o botão Mais"] },
    { v: "1.8.1", data: "nov/2026", itens: ["Campanhas: percentual de cada fase editável direto na pirâmide (digitando ou arrastando), com ajuste automático para somar 100% e a opção de salvar a sua divisão"] },
    { v: "1.8.0", data: "nov/2026", itens: ["Comercial: funil do mês com leads que entraram, agendaram, compareceram, faltaram, fecharam e não fecharam, e o follow-up de orçamento", "CRM-Pipeline com funil de leads e de clientes (quem comparece vira cliente), arrastar e soltar", "Campanhas: calculadora da pirâmide (topo, meio e fundo), cadência e projeção de resultados", "Permissões por perfil: Administrador, Operacional e CRC"] },
    { v: "1.7.0", data: "nov/2026", itens: ["Resultados por tratamento: quantos pacientes têm interesse e quantos fecharam em cada tratamento, com conversão, valor e ticket médio", "WhatsApp em três colunas: conversas, o chat normal para escrever e enviar, e o chat sugerido ao lado", "Assuntos de cada conversa (preço, agendamento, medo, prazo…) com filtro e tratamento de interesse detectado", "Perfil DISC do paciente durante a consulta e no WhatsApp, com como falar com cada perfil", "Social Selling no WhatsApp: SPIN e N.E.A.T. acompanhados em cada conversa, com a próxima pergunta pronta"] },
    { v: "1.6.0", data: "nov/2026", itens: ["Pronto para domínio próprio (Registro.br): endereço oficial em APP_URL, redirecionamento do endereço antigo e cabeçalhos de segurança", "Ajustes › Domínio e endereços: login e webhook do Kommo prontos para copiar e verificação do apontamento", "Ícone de app ao adicionar o Alinha à tela de início do celular"] },
    { v: "1.5.0", data: "nov/2026", itens: ["Reativação automática de quem não fechou: 30, 60 e 90 dias, na lista Quem alinhar hoje e na coluna Reativação", "Modelos de mensagem (primeiro contato, quem não agendou, lembretes, pós-consulta, reativação, campanha, indicação) na conversa de WhatsApp e nos cartões", "Princípios de atendimento e os 7 funis no guia; a IA passa a usá-los"] },
    { v: "1.4.0", data: "nov/2026", itens: ["Conectar celular (WhatsApp) por QR code em Ajustes, com envio da resposta direto do Alinha", "Abrir o Alinha no celular por QR code", "Pronto para hospedar na Vercel (banco Upstash Redis)"] },
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
        AJ = Object.assign(AJ, { crcs: DEMO.crcs, doutores: DEMO.doutores, setores: DEMO.setores }, ls.get("alinha.ajustes", {})); // demonstração: CRCs e doutores de exemplo
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
  const CAD_NOME = { 0: "Resumo do plano", 1: "Tirar dúvidas", 3: "Reforçar valor", 7: "Pergunta direta", 15: "Porta aberta", 30: "Encerramento", R30: "Reativação · 30 dias", R60: "Reativação · 60 dias", R90: "Reativação · 90 dias" };
  // reativação de quem não fechou (ou terminou a cadência sem decidir): 30, 60 e 90 dias
  const REAT = ["R30", "R60", "R90"], REAT_DIAS = { R30: 30, R60: 60, R90: 90 };
  const ultimoToque = (p) => Object.values(p.toques || {}).map((t) => t && t.em).filter(Boolean).sort().pop();
  function proximo(p) {
    if (p.status === "fechado" || p.status === "lead") return null; // lead ainda não veio à clínica: fica no CRM
    const toques = p.toques || {};
    if (p.status === "aberto") {
      const dia = CAD.find((d) => !toques[d]);
      if (dia !== undefined) {
        // vence no dia da cadência, mas nunca antes do intervalo mínimo desde o último contato (evita 2 mensagens no mesmo dia)
        let due = new Date(inicioDia(p.consultaEm).getTime() + dia * DIA);
        const k = CAD.indexOf(dia), ant = CAD[k - 1];
        if (k > 0 && toques[ant] && toques[ant].em) {
          const minimo = new Date(inicioDia(toques[ant].em).getTime() + (dia - ant) * DIA);
          if (minimo > due) due = minimo;
        }
        return { dia, n: k + 1, due, atraso: Math.round((hoje0() - due) / DIA) };
      }
    }
    const r = REAT.find((k) => !toques[k]);
    if (!r) return p.status === "aberto" ? { fim: true } : null;
    const k = REAT.indexOf(r);
    const base = k > 0 && toques[REAT[k - 1]] ? toques[REAT[k - 1]].em : (p.status === "perdido" ? (p.encerradoEm || ultimoToque(p) || p.consultaEm) : (ultimoToque(p) || p.consultaEm));
    const intervalo = k > 0 ? REAT_DIAS[r] - REAT_DIAS[REAT[k - 1]] : REAT_DIAS[r];
    const due = new Date(inicioDia(base).getTime() + intervalo * DIA);
    return { dia: r, reativ: true, n: k + 1, due, atraso: Math.round((hoje0() - due) / DIA) };
  }
  const numToque = (dia) => typeof dia === "string" ? "reativação " + dia : CAD.indexOf(dia) + 1;
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
      R30: [preencherModelo(modeloBib("Reativação", 0), p), `Oi, ${n}! Como você está? Lembrei de você e do seu planejamento. Quer que eu te mande de novo a simulação do seu sorriso?`],
      R60: [preencherModelo(modeloBib("Reativação", 1), p), `${n}, tudo bem? Se ainda pensa em alinhar o sorriso, consigo um horário nesta semana para revisarmos seu plano. Quer?`],
      R90: [preencherModelo(modeloBib("Reativação", 2), p), `Oi, ${n}! Passando só para deixar a porta aberta: quando quiser retomar, é só responder aqui 🙂`],
      30: [`${n}, não quero te incomodar 🙂 Vou deixar seu plano guardado. Se um dia quiser retomar, é só responder esta mensagem. Um abraço da equipe Weiss!`, `Oi, ${n}! Vou encerrar seu acompanhamento por aqui, mas a porta fica aberta. Quando quiser, conte com a gente!`]
    };
    let lista = M[dia];
    if (dia === 3) lista = M[3][obj === "concorrente" ? "preco" : obj] || M[3].padrao;
    return lista[v % lista.length];
  }
  /* modelos da biblioteca (funis): preenchidos com os dados do paciente */
  const modeloBib = (grupo, i) => { const g = (BIB.modelos || []).find((x) => x.grupo === grupo); return g && g.itens[i] ? g.itens[i].texto : ""; };
  function preencherModelo(t, p = {}) {
    const u = BIB.unidades[p.unidade || "Caruaru"] || {};
    const prof = p.profissional || (AJ.equipe || [])[0] || "o Dr. Edelweiss";
    return String(t || "").replace(/\{(\w+)\}/g, (m, k) => ({ nome: primeiro(p.nome), unidade: p.unidade || "", endereco: u.endereco || "", profissional: prof, condicao: AJ.condicao || "", tratamento: p.tratamento || "seu tratamento" }[k] ?? "[" + k + "]"))
      .replace(/\s+([,.!?])/g, "$1").replace(/,\s*,/g, ",").replace(/^,\s*/, "").replace(/\s{2,}/g, " ").trim();
  }
  function abrirModelos(p, aoUsar) {
    const G = BIB.modelos || [];
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Modelos de mensagem">
      <div class="row"><h2 class="grow" style="font-size:20px">Modelos de mensagem</h2><button class="btn sm ghost" id="mdFechar" aria-label="Fechar">✕</button></div>
      <p class="small dim" style="margin:0">Toque em <b>Usar</b> para colocar o texto na resposta. Você pode editar antes de enviar.</p>
      ${G.map((g, gi) => { const bloqueado = g.requer === "condicao" && !AJ.condicao; return `<div class="card stack" style="gap:8px"><div><b>${esc(g.grupo)}</b> <span class="small dim">· ${esc(g.quando)}</span></div>
        ${bloqueado ? `<p class="small" style="margin:0;color:var(--warn)">Cadastre uma condição real em Ajustes para usar este modelo.</p>` : ""}
        ${g.itens.map((it, ii) => `<div class="sug"><div class="label">${esc(it.rotulo)}</div><p style="margin:4px 0 8px">${esc(preencherModelo(it.texto, p))}</p><button class="btn sm pri" data-usar="${gi}.${ii}" ${bloqueado ? "disabled" : ""}>Usar</button></div>`).join("")}</div>`; }).join("")}
      <details class="mguia"><summary>Princípios de atendimento</summary><ul>${(BIB.principios || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></details>
    </div></div>`;
    $("#mdFechar").onclick = fecharGaveta;
    $("#veil").addEventListener("click", (e) => {
      if (e.target.id === "veil") return fecharGaveta();
      const b = e.target.closest("[data-usar]"); if (!b) return;
      const [gi, ii] = b.dataset.usar.split(".").map(Number);
      aoUsar(preencherModelo(G[gi].itens[ii].texto, p)); fecharGaveta(); toast("Modelo aplicado — revise e envie");
    });
  }
  function textoMensagem(p, dia) { return (p.mensagens || {})[dia] || modelo(p, dia, (p.variante || {})[dia] || 0); }
  async function outraVersao(p, dia) {
    const atual = textoMensagem(p, dia);
    if (PLAT && PLAT.ia) {
      const d = await api("POST", "api/ia/mensagem", { paciente: p, dia, toque: numToque(dia), condicao: AJ.condicao, versao_anterior: atual });
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
      const d = await api("POST", "api/ia/mensagem", { paciente: p, dia, toque: numToque(dia), condicao: AJ.condicao });
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
      <div class="row small"><span class="pill ${x.reativ ? "acc" : ""}">${x.reativ ? `Reativação ${x.n}/3` : `Toque ${x.n} · D${x.dia}`}</span><span class="dim">${CAD_NOME[x.dia]}</span>${obj ? `<span class="pill warn">${esc(obj)}</span>` : ""}</div>
      <div class="sug"><div class="label" style="margin-bottom:6px">Mensagem sugerida · edite se quiser</div><textarea data-msg="${x.dia}" aria-label="Mensagem para ${esc(p.nome)}">${esc(txt)}</textarea></div>
      <div class="row">
        <button class="btn sm pri" data-act="copiar">Copiar</button>
        <a class="btn sm" data-act="whats" href="${esc(linkWhats(p, txt))}" target="_blank" rel="noopener">WhatsApp</a>
        <button class="btn sm" data-act="outra">↻ Outra versão</button>
        <button class="btn sm" data-act="modelos">📋 Modelos</button>
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
    const dia = /^\d+$/.test(ta.dataset.msg) ? Number(ta.dataset.msg) : ta.dataset.msg;
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
    } else if (act === "modelos" && x && !x.fim) {
      abrirModelos(p, async (txt) => { p.mensagens = Object.assign(p.mensagens || {}, { [x.dia]: txt }); await Store.salvar(p); render(); });
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
    const bs = $("#btnSeqHoje"); if (bs) { bs.classList.toggle("hide", !N.hoje); bs.textContent = `▶ Em sequência (${N.hoje})`; bs.title = "Alinhar um paciente por vez, em sequência"; }
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
    renderAvisosLab(); paginarFila();
    const b = $("#badgeHoje"); b.textContent = N.hoje; b.classList.toggle("hide", !N.hoje);
  }
  let filtro = "Todos";
  const FU_ABERTAS = {};
  $("#kanban").addEventListener("click", (e) => { const m = e.target.closest("[data-maisfu]"); if (!m) return; e.stopPropagation(); FU_ABERTAS[m.dataset.maisfu] = !FU_ABERTAS[m.dataset.maisfu]; renderFollowup(); }, true);
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
    colunas.push({ d: "reat", titulo: "Reativação", sub: "30, 60 e 90 dias", itens: lista.filter((p) => { const x = proximo(p); return x && x.reativ; }) });
    colunas.push({ d: "fim", titulo: "Fim da cadência", sub: "decidir: fechou ou encerrar", itens: lista.filter((p) => { const x = proximo(p); return x && x.fim; }) });
    colunas.push({ d: "ok", titulo: "Fecharam", sub: "no mês", itens: lista.filter((p) => p.status === "fechado" && doMes(p.fechadoEm)) });
    $("#kanban").innerHTML = colunas.map((c) => `<div class="col"><h3>${c.titulo}<span class="pill">${c.itens.length}</span></h3><div class="sub">${c.sub}</div>
      ${c.itens.slice(0, FU_ABERTAS[c.d] ? c.itens.length : 2).map((p) => { const x = proximo(p); const cls = x && !x.fim ? (x.atraso > 0 ? "late" : x.atraso === 0 ? "today" : "") : "";
        const quando = !x ? (p.status === "fechado" ? `fechou ${p.fechadoEm ? fmtData(p.fechadoEm) : ""}` : "") : x.fim ? "todos os toques feitos" : x.atraso > 0 ? `<span style="color:var(--bad)">${x.atraso} dia${x.atraso > 1 ? "s" : ""} de atraso</span>` : x.atraso === 0 ? "alinhar hoje" : `em ${-x.atraso} dia${x.atraso < -1 ? "s" : ""}`;
        return `<button class="pc ${cls}" data-id="${p.id}" data-act="abrir"><b>${esc(p.nome)}</b><span class="v num">${brl(p.status === "fechado" ? p.valorFechado : p.valorApresentado)}</span><span class="m">${quando}</span>${p.status === "aberto" ? miniTermo(p.prontidao) : ""}<span class="m">${esc(p.responsavel || "")}${(p.objecoes || [])[0] ? " · " + esc(OBJ_NOME[p.objecoes[0]] || "") : ""}</span></button>`; }).join("") || `<span class="tiny dim">vazio</span>`}
      ${c.itens.length > 2 ? `<button class="mais-col" data-maisfu="${c.d}">${FU_ABERTAS[c.d] ? "Mostrar menos" : `+ ${c.itens.length - 2} mais`}</button>` : ""}
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
      <div id="gDecisor">${decisorResumo(p)}</div>
      <details class="card contato-det"${p.decisor || p.crc ? "" : " open"}><summary><span class="label">Decisor, melhor horário, CRC e doutor</span></summary><div class="stack" style="margin-top:10px">${camposContatoHTML(p, "g")}</div></details>
      ${p.disc && p.disc.n ? `<div class="card stack"><span class="label">Perfil DISC</span>${discHTML(p.disc)}</div>` : ""}
      ${x && !x.fim ? cardMensagem(p, x) : ""}
      <div class="card stack"><span class="label">Resultado</span>
        <div class="row"><div class="grow"><label class="f" for="gTrat">Tratamento</label><select class="in" id="gTrat">${(() => { const atual = tratDoPaciente(p); const ops = TRAT.map((t) => t.nome); if (!ops.includes(atual)) ops.unshift(atual); return ops.map((o) => `<option${o === atual ? " selected" : ""}>${esc(o)}</option>`).join(""); })()}</select></div>
          <div class="grow"><label class="f" for="gEmail">E-mail</label><input class="in" id="gEmail" type="email" value="${esc(p.email || "")}"></div>
          <div class="grow"><label class="f" for="gValor">Valor fechado (R$)</label><input class="in num" id="gValor" inputmode="decimal" value="${p.valorFechado || p.valorApresentado || ""}"></div></div>
        <div class="row"><button class="btn pri" id="gFechou">Fechou</button><button class="btn" id="gPerdeu">Não fechou</button>${p.status !== "aberto" ? `<button class="btn ghost" id="gReabrir">Voltar ao follow-up</button>` : ""}</div>
        <div class="tiny dim">Histórico: ${CAD.filter((d) => (p.toques || {})[d]).map((d) => `D${d} ${p.toques[d].status}`).join(" · ") || "nenhum toque ainda"}</div>
      </div>
      ${timelinePacienteHTML(p)}
      <div class="row">${p.briefing ? `<button class="btn" id="gBriefing">Ver briefing</button>` : ""}<span class="grow"></span><button class="btn ghost" id="gApagar">Apagar paciente</button></div>
    </div></div>`;
    if (x && !x.fim) garantirMensagemIA(p, x.dia);
    ligarTimelinePaciente(p);
    ligarContato(p, "g", async () => { lerContato(p, "g"); await Store.salvar(p); $("#gDecisor").innerHTML = decisorResumo(p); toast("Ficha atualizada"); });
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#gEmail").onchange = async (e) => { p.email = e.target.value.trim(); await Store.salvar(p); toast("E-mail salvo"); };
    $("#gTrat").onchange = async (e) => { p.tratamento = e.target.value; p.interesse = e.target.value; await Store.salvar(p); toast("Tratamento atualizado"); };
    const valor = () => { const v = String($("#gValor").value).replace(/[^\d,.]/g, ""); return Number(v.includes(",") ? v.replace(/\./g, "").replace(",", ".") : v) || 0; };
    $("#gFechou").onclick = async () => {
      p.status = "fechado"; p.valorFechado = valor(); p.fechadoEm = new Date().toISOString();
      p.recuperado = inicioDia(p.fechadoEm).getTime() > inicioDia(p.consultaEm).getTime();
      await Store.salvar(p); toast("Fechamento registrado 🎉"); fecharGaveta(); render(); aposFechamento(p);
    };
    $("#gPerdeu").onclick = async () => { p.status = "perdido"; p.encerradoEm = new Date().toISOString(); await Store.salvar(p); toast("Paciente encerrado"); fecharGaveta(); render(); };
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
      ${p.disc && p.disc.n ? `<h3 style="margin-top:6px">Perfil DISC do paciente</h3><div class="card stack" style="max-width:520px">${discHTML(p.disc)}</div>` : ""}
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
    return { inicio: null, seg: 0, gravando: false, pausado: false, momento: 0, falas: [], dicas: [], objecoes: new Set(), demo: false, ultimaIA: 0, temp: 25, avisouFechar: false, spin: {}, neat: {}, contrato: false, disc: null, discIA: null };
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
    atualizarDiscConsulta();
    renderMetodo();
  }
  function atualizarDiscConsulta() { C.disc = discMesclar(discDe(C.falas.filter((f) => f.quem === "paciente").map((f) => f.texto)), C.discIA); }
  function renderMetodo() {
    if (!$("#mSpin")) return;
    $("#mDisc").innerHTML = discHTML(C.disc);
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
        <h4>Venda centrada no cliente</h4>${L(MET.centrada.regras)}
        <h4>Princípios de atendimento</h4>${L(BIB.principios || [])}
        <h4>Os 7 funis aplicados</h4>${L((BIB.funis || []).map((f) => f.nome + ": " + f.noAlinha))}`;
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
      if (d.disc) { C.discIA = d.disc; atualizarDiscConsulta(); renderMetodo(); }
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
    atualizarDiscConsulta(); renderMetodo();
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
      disc: (() => { atualizarDiscConsulta(); const d = discMesclar(C.disc, B.disc); return d && d.n ? d : undefined; })(),
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
    estadoCelular(); renderAbrirCelular(); renderDominio(false);
    renderEu(); if (ABAS.aj === "seg") renderSeguranca();
    if (ehAdminFront()) { renderPermissoes(); renderUnidadesMetas(); renderProcedimentos(); renderCrcsAjustes(); renderChatAjustes(); renderSetoresAjustes(); if (["api", "kommo"].includes(ABAS.aj)) { if (INTEG) renderIntegracoes(); else carregarIntegracoes(); } }
  }
  function ehAdminFront() { return !PLAT || PLAT.papel === "admin"; }
  /* ------------------------------------------------------------ */
  /* Conectar celular (WhatsApp) por QR code · Abrir no celular    */
  /* ------------------------------------------------------------ */
  let celTimer = null;
  async function estadoCelular() {
    const st = $("#celEstado"); if (!st) return;
    if (!PLAT) { st.className = "pill"; st.textContent = "demonstração"; return; }
    if (!PLAT.celular) { st.className = "pill"; st.textContent = "conector não configurado"; $("#celAviso").textContent = "Para usar, configure o conector do WhatsApp (Evolution API) no servidor: EVOLUTION_URL e EVOLUTION_API_KEY. Veja o manual."; return { estado: "off" }; }
    try {
      const d = await api("GET", "api/celular/estado");
      st.className = "pill " + (d.estado === "conectado" ? "good" : d.estado === "aguardando" ? "warn" : "");
      st.textContent = d.estado === "conectado" ? `✓ conectado${d.numero ? " · +" + d.numero : ""}` : d.estado === "aguardando" ? "aguardando leitura do QR code" : "desconectado";
      $("#btnCelDesconectar").classList.toggle("hide", d.estado !== "conectado");
      if (d.estado === "conectado") { $("#celQr").innerHTML = ""; clearInterval(celTimer); }
      return d;
    } catch (e) { st.className = "pill bad"; st.textContent = "sem resposta do conector"; $("#celAviso").textContent = e.message; }
  }
  $("#btnCelConectar").addEventListener("click", async () => {
    const b = $("#btnCelConectar"); b.disabled = true; b.textContent = "Gerando QR code…";
    try {
      if (!PLAT) { // demonstração
        $("#celQr").innerHTML = `<div class="qrbox"><div id="qrDemo"></div><p class="small dim">QR code de demonstração · conecta sozinho em 6 s</p></div>`;
        desenharQR("qrDemo", "alinha-demonstracao-" + Date.now(), 220);
        setTimeout(() => { $("#celQr").innerHTML = ""; $("#celEstado").className = "pill good"; $("#celEstado").textContent = "✓ conectado (demonstração)"; toast("Celular conectado (demonstração)"); }, 6000);
      } else {
        const d = await api("POST", "api/celular/conectar");
        if (d.qr) {
          $("#celQr").innerHTML = `<div class="qrbox"><img src="${esc(d.qr)}" alt="QR code para conectar o WhatsApp" width="240" height="240">${d.codigo ? `<p class="small">ou use o código: <b class="num">${esc(d.codigo)}</b></p>` : ""}<p class="small dim">O QR code expira em cerca de 40 s. Se expirar, gere de novo.</p></div>`;
          clearInterval(celTimer); celTimer = setInterval(estadoCelular, 3000);
        } else toast("Este celular já está conectado");
        estadoCelular();
      }
    } catch (e) { toast(e.message); }
    b.disabled = false; b.textContent = "Gerar QR code";
  });
  $("#btnCelDesconectar").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (b.dataset.c !== "1") { b.dataset.c = "1"; b.textContent = "Toque de novo para desconectar"; setTimeout(() => { b.dataset.c = ""; b.textContent = "Desconectar"; }, 4000); return; }
    try { await api("POST", "api/celular/desconectar"); toast("Celular desconectado"); } catch (err) { toast(err.message); }
    b.dataset.c = ""; b.textContent = "Desconectar"; estadoCelular();
  });
  // QR code desenhado no navegador (biblioteca qrcodejs; se não carregar, mostra o endereço)
  function desenharQR(id, texto, tam) {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = "";
    if (window.qrcode) {
      try { const q = window.qrcode(0, "M"); q.addData(texto); q.make(); const n = q.getModuleCount(); el.innerHTML = q.createSvgTag({ cellSize: Math.max(2, Math.floor(tam / (n + 4))), margin: 2, scalable: false }); return; }
      catch (e) { /* segue */ }
    }
    el.innerHTML = `<p class="small">${esc(texto)}</p>`;
  }
  /* domínio próprio: endereço oficial, endereços dos webhooks e verificação do DNS */
  async function renderDominio(verificar) {
    if (!$("#domEstado")) return;
    if (!PLAT) { $("#domEstado").textContent = "demonstração"; $("#domEndereco").textContent = "Disponível depois de publicar o Alinha"; return; }
    try {
      const d = await api("GET", "api/dominio");
      $("#domEndereco").textContent = d.endereco;
      $("#domEstado").className = "pill " + (d.configurado ? "good" : "warn");
      $("#domEstado").textContent = !d.configurado ? "usando o endereço da hospedagem" : d.redirecionando ? "domínio próprio ativo" : "domínio configurado · aguardando o DNS";
      const linha = (rot, v) => v ? `<div class="sug"><div class="label">${rot}</div><div class="row" style="margin-top:4px"><code class="grow num" style="word-break:break-all;font-size:13.5px">${esc(v)}</code><button class="btn sm" data-copiar="${esc(v)}">Copiar</button></div></div>` : "";
      $("#domWebhooks").innerHTML = linha("Página de login (para a equipe)", d.endereco + "/login") + linha("Webhook do Kommo (Configurações › Integrações › Webhooks)", d.webhooks.kommo) + (d.webhooks.evolution ? linha("Webhook do celular conectado (configurado sozinho)", d.webhooks.evolution) : "");
      if (verificar) {
        const ok = d.dns.a.length || d.dns.cname.length;
        $("#domResultado").innerHTML = ok
          ? `✓ <b>${esc(d.host)}</b> já aponta para: ${esc([...d.dns.cname.map((c) => "CNAME " + c), ...d.dns.a.map((x) => "A " + x)].join(" · "))}${d.acessoAtual !== d.host ? `<br><span class="dim">Você está acessando por ${esc(d.acessoAtual)}. Quando o domínio estiver ativo na hospedagem, o Alinha passa a abrir pelo domínio oficial.</span>` : ""}`
          : `⏳ <b>${esc(d.host)}</b> ainda não aponta para lugar nenhum. Crie o registro no Registro.br; a propagação leva de alguns minutos a 24 horas.`;
      }
    } catch (e) { $("#domResultado").textContent = "Não foi possível verificar: " + e.message; }
  }
  $("#btnDomVerificar").addEventListener("click", () => renderDominio(true));
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copiar]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.copiar); toast("Copiado"); } catch (err) { toast("Selecione e copie: " + b.dataset.copiar); }
  });

  function renderAbrirCelular() {
    const url = location.protocol === "file:" ? "Publique o Alinha para gerar o QR code do endereço" : (PLAT && PLAT.endereco ? PLAT.endereco + "/" : location.origin + location.pathname.replace(/[^/]*$/, ""));
    $("#abrirUrl").textContent = url;
    if (location.protocol !== "file:") desenharQR("abrirQr", url, 180);
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

  // Unidades (endereço e contatos) e metas do mês
  const UNID_CAMPOS = [["endereco", "Endereço"], ["whatsapp", "WhatsApp"], ["fixo", "Telefone fixo"], ["email", "E-mail"]];
  function aplicarUnidades() { Object.entries(AJ.unidades || {}).forEach(([n, u]) => { BIB.unidades[n] = Object.assign({}, BIB.unidades[n] || {}, u); }); }
  function renderUnidadesMetas() {
    aplicarUnidades();
    $("#aUnidades").innerHTML = Object.entries(BIB.unidades).map(([n, u]) => `<fieldset data-unid="${esc(n)}"><legend>${esc(n)}</legend>${UNID_CAMPOS.map(([k, r]) => `<div><label class="f" for="u_${esc(n)}_${k}">${r}</label><input class="in" id="u_${esc(n)}_${k}" data-k="${k}" value="${esc(u[k] || "")}"></div>`).join("")}</fieldset>`).join("");
    const M = AJ.metas || {};
    $("#mLeads").value = M.leads || ""; $("#mComp").value = M.comparecimentos || ""; $("#mFech").value = M.fechamentos || ""; $("#mFat").value = M.faturamento || "";
  }
  $("#btnSalvarUnid").addEventListener("click", async () => {
    const U = {}; $$("#aUnidades fieldset").forEach((f) => { U[f.dataset.unid] = Object.fromEntries($$("input", f).map((i) => [i.dataset.k, i.value.trim()])); });
    try { await Store.ajustes({ unidades: U }); aplicarUnidades(); $("#unidStatus").textContent = "✓ Salvo"; } catch (e) { $("#unidStatus").textContent = "Erro: " + e.message; }
  });
  $("#btnSalvarMetas").addEventListener("click", async () => {
    const n = (id) => { const v = num($(id).value); return v > 0 ? v : null; };
    try { await Store.ajustes({ metas: { leads: n("#mLeads"), comparecimentos: n("#mComp"), fechamentos: n("#mFech"), faturamento: n("#mFat") } }); $("#metaStatus").textContent = "✓ Salvo"; render(); } catch (e) { $("#metaStatus").textContent = "Erro: " + e.message; }
  });
  $("#btnSalvarAjustes").addEventListener("click", async () => {
    try {
      await Store.ajustes({ equipe: $("#aEquipe").value.split(",").map((s) => s.trim()).filter(Boolean), condicao: $("#aCondicao").value.trim(), doutores: $("#aDoutores").value.split(",").map((s) => s.trim()).filter(Boolean) });
      $("#ajStatus").textContent = "✓ Salvo"; render();
    } catch (e) { $("#ajStatus").textContent = "Erro: " + e.message; }
  });
  $("#tema").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const t = b.dataset.t; ls.set("alinha.tema", t); aplicarTema(t);
  });
  function aplicarTema(t) {
    const H = document.documentElement, claro = ["light", "perola"].includes(t), paleta = ["esmeralda", "perola"].includes(t) ? t : "";
    if (claro) H.setAttribute("data-theme", "light"); else H.removeAttribute("data-theme");
    if (paleta) H.setAttribute("data-paleta", paleta); else H.removeAttribute("data-paleta");
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
  const WA = { conversas: [], sel: null, msgs: {}, info: {}, sug: {}, temp: {}, humano: {}, demo: null, timers: [], lido: ls.get("alinha.wa.lido", {}), setor: {}, transf: {}, fSetor: "" };
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
    if (lead === WA.sel) renderSide();
    if (!(PLAT && PLAT.ia)) { if (versaoAnterior) { const alt = sugestaoLocal(lead); alt.mensagem = preencherBib("Entendo você, {nome}. O que pesa mais nessa decisão agora? Se fizer sentido, eu te mostro a simulação do seu sorriso e vemos juntos o melhor caminho 🙂", lead); WA.sug[lead] = alt; renderSide(); } return; }
    try {
      const i = WA.info[lead] || {};
      const d = await api("POST", "api/ia/whatsapp", { conversa: WA.msgs[lead] || [], nome: i.nome, unidade: i.unidade, condicao: AJ.condicao, versao_anterior: versaoAnterior || "", disc: discDe((WA.msgs[lead] || []).filter((m) => m.autor === "cliente").map((m) => m.texto)) });
      WA.sug[lead] = { rotulo: d.rotulo || "Sugestão da IA", orientacao: d.orientacao || "", mensagem: d.mensagem || "", fonte: "ia" };
      WA.ia[lead] = { disc: d.disc, assuntos: Array.isArray(d.assuntos) ? d.assuntos : [], tratamento_interesse: d.tratamento_interesse || "" };
      if (typeof d.prontidao === "number") WA.temp[lead] = Math.round((WA.temp[lead] + d.prontidao) / 2);
      if (lead === WA.sel) renderChat();
    } catch (e) { /* fica a sugestão do roteiro */ }
  }

  async function carregarConversas() {
    if (waModoReal()) {
      let d; try { d = await api("GET", "api/whatsapp/conversas" + (WA.ver != null ? "?ver=" + WA.ver : "")); } catch (e) { return false; }
      if (d.mudou === false) return false; // nada novo desde a última busca
      WA.ver = d.ver; WA.conversas = d.conversas || [];
      WA.conversas.forEach((c) => { WA.info[c.lead] = Object.assign({ nome: c.nome, unidade: c.unidade }, WA.info[c.lead] || {}); if (c.foto) WA.info[c.lead].foto = c.foto; if (c.setor) WA.setor[c.lead] = { setor: c.setor, pessoa: c.responsavel || "" }; });
    } else {
      if (!WA.demo) { WA.demo = DEMO.whatsapp(); WA.demo.forEach((c) => { WA.msgs[c.lead] = c.lista.slice(); WA.info[c.lead] = { nome: c.nome, telefone: c.telefone, unidade: c.unidade, foto: c.foto, origem: c.origem }; if (c.setor) WA.setor[c.lead] = { setor: c.setor, pessoa: c.responsavel || "" }; if (c.transf) WA.transf[c.lead] = c.transf.slice(); recalcularTemp(c.lead); });
        const gs = ls.get("alinha.wa.setor", null); if (gs) { Object.assign(WA.setor, gs.setor || {}); Object.assign(WA.transf, gs.transf || {}); } }
      WA.conversas = WA.demo.map((c) => { const l = WA.msgs[c.lead], u = l[l.length - 1]; return { lead: c.lead, nome: c.nome, unidade: c.unidade, ultima: u.texto, autor: u.autor, ts: u.ts }; }).sort((a, b) => (a.ts < b.ts ? 1 : -1));
    }
    badgeWA(); return true;
  }
  function naoLida(c) { return c.autor === "cliente" && (!WA.lido[c.lead] || c.ts > WA.lido[c.lead]); }
  function badgeWA() { const n = WA.conversas.filter(naoLida).length; const b = $("#badgeWA"); b.textContent = n; b.classList.toggle("hide", !n); }

  /* ------------------------------------------------------------ */
  /* Tratamentos, assuntos e perfil DISC                           */
  /* ------------------------------------------------------------ */
  const TRAT = [
    { nome: "Invisalign", g: ["invisalign", "alinhador", "alinhadores", "invisivel", "transparente", "placa transparente"] },
    { nome: "Aparelho estético", g: ["aparelho estetico", "safira", "porcelana", "ceramica", "autoligado", "fixo estetico"] },
    { nome: "Aparelho fixo", g: ["aparelho fixo", "aparelho metalico", "braquete", "bracket", "aparelho"] },
    { nome: "Ortodontia infantil", g: ["meu filho", "minha filha", "crianca", "infantil", "expansor", "ortopedia"] },
    { nome: "Contenção / finalização", g: ["contencao", "finalizacao", "voltou a entortar", "voltaram a entortar"] },
    { nome: "Clareamento", g: ["clareamento", "clarear", "amarelado", "branquear"] },
    { nome: "Lentes e facetas", g: ["lente de contato", "lentes", "faceta", "facetas", "laminado"] },
    { nome: "Implante", g: ["implante", "protese", "dente faltando", "perdi um dente"] },
    { nome: "Check-up digital (iTero)", g: ["check up", "checkup", "escaneamento", "itero", "avaliacao"] }
  ];
  const tratDe = (txt) => { if (!txt) return ""; const t = TRAT.find((x) => casa(txt, x.g)); return t ? t.nome : ""; };
  const tratDoPaciente = (p) => tratDe(p.interesse || p.tratamento) || String(p.interesse || p.tratamento || "").trim() || "Não informado";
  const ASSUNTOS = [
    { id: "preco", nome: "Preço e parcelas", g: ["quanto custa", "valor", "preco", "parcela", "parcelas", "caro", "orcamento", "cartao", "pix", "desconto", "entrada", "pagamento", "investimento"] },
    { id: "agenda", nome: "Agendamento", g: ["horario", "agendar", "agenda", "marcar", "disponivel", "amanha", "que dia", "encaixe", "remarcar"] },
    { id: "tratamento", nome: "Tratamento", g: TRAT.slice(0, 8).flatMap((x) => x.g).concat(["tratamento", "como funciona"]) },
    { id: "medo", nome: "Medo e dor", g: ["medo", "dor", "doi", "doer", "pavor", "receio", "nervoso", "ansiosa", "ansioso"] },
    { id: "tempo", nome: "Duração", g: ["quanto tempo", "demora", "meses", "prazo", "rapido", "duracao"] },
    { id: "estetica", nome: "Sorriso e resultado", g: ["sorriso", "foto", "fotos", "torto", "tortos", "vergonha", "bonito", "resultado", "casamento", "formatura", "aparece"] },
    { id: "decisor", nome: "Decide com alguém", g: ["marido", "esposa", "noivo", "noiva", "namorad", "meus pais", "minha mae", "meu pai", "conversar com", "ver com"] },
    { id: "local", nome: "Endereço e unidade", g: ["endereco", "onde fica", "localizacao", "estacionamento", "como chego"] },
    { id: "convenio", nome: "Convênio", g: ["convenio", "plano odontologico", "plano de saude", "reembolso"] }
  ];
  const ASS_NOME = Object.fromEntries(ASSUNTOS.map((a) => [a.id, a.nome]));
  function assuntosDe(msgs) {
    const n = {};
    (msgs || []).filter((m) => m.autor === "cliente").forEach((m) => ASSUNTOS.forEach((a) => { if (casa(m.texto, a.g)) n[a.id] = (n[a.id] || 0) + 1; }));
    return Object.keys(n).sort((a, b) => n[b] - n[a]);
  }
  function tratamentoDaConversa(msgs) {
    const n = {};
    (msgs || []).filter((m) => m.autor === "cliente").forEach((m) => { const t = tratDe(m.texto); if (t) n[t] = (n[t] || 0) + 1; });
    const ks = Object.keys(n).sort((a, b) => n[b] - n[a]);
    return ks.find((k) => !k.startsWith("Check-up")) || ks[0] || ""; // check-up só se não houver outro tratamento citado
  }
  // DISC: leitura do jeito de falar do paciente (indicativo, não é diagnóstico)
  const DISC = {
    D: { nome: "Dominante", cor: "Direto, quer resultado", g: ["quanto custa", "quanto tempo", "rapido", "logo", "direto", "resultado", "resolver", "quero", "agora", "prazo", "objetivo", "quando comeca", "sem enrolar", "pode ser", "fechado"],
      como: "Vá direto ao ponto: resultado, prazo e valor em poucas linhas. Dê duas opções e deixe a pessoa decidir.", evitar: "Rodeios, textos longos e detalhes demais." },
    I: { nome: "Influente", cor: "Comunicativo, emocional", g: ["amei", "adorei", "lindo", "linda", "festa", "casamento", "kkk", "rs", "haha", "maravilh", "perfeito", "top", "sonho", "apaixon", "foto", "fotos"],
      como: "Seja caloroso e animado: fale do sorriso, de fotos, do evento e de histórias de outros pacientes.", evitar: "Frieza e excesso de números." },
    S: { nome: "Estável", cor: "Cauteloso, busca segurança", g: ["medo", "seguranca", "calma", "pensar", "familia", "marido", "esposa", "confianca", "dor", "receio", "tranquil", "nervos", "ansios", "preocup", "com calma"],
      como: "Passe segurança: explique passo a passo, mostre o acompanhamento e acolha o medo. Não apresse.", evitar: "Pressão, urgência e mudanças bruscas." },
    C: { nome: "Analítico", cor: "Detalhista, quer entender", g: ["como funciona", "detalhe", "explica", "garantia", "quantos", "por que", "porque", "diferenca", "etapas", "contrato", "planejamento", "comparar", "material", "tecnologia", "incluso", "inclui"],
      como: "Seja preciso: etapas, o que está incluído e a tecnologia (iTero, planejamento digital). Mande por escrito.", evitar: "Exageros e promessas vagas." }
  };
  const DK = ["D", "I", "S", "C"];
  function discDe(textos) {
    const s = { D: 1, I: 1, S: 1, C: 1 };
    const lista = (textos || []).filter(Boolean);
    lista.forEach((t0) => {
      DK.forEach((k) => { DISC[k].g.forEach((w) => { if (casa(t0, [w])) s[k] += 2; }); });
      if (t0.length < 40) s.D += 0.6; if (t0.length > 160) s.C += 1;
      if (/!{2,}|😍|🥰|😂|🤣|❤|✨|🤩|😁|😊|🙏/u.test(t0)) s.I += 1.2;
      if (t0.includes("?")) s.C += 0.4;
    });
    return normDisc(s, lista.length);
  }
  function normDisc(s, n) {
    const tot = DK.reduce((a, k) => a + (Number(s[k]) || 0), 0) || 1;
    const r = Object.fromEntries(DK.map((k) => [k, Math.round(((Number(s[k]) || 0) / tot) * 100)]));
    const dif = 100 - DK.reduce((a, k) => a + r[k], 0); const top = DK.slice().sort((a, b) => r[b] - r[a]);
    r[top[0]] += dif; r.perfil = top[0]; r.n = n || 0;
    r.seguro = r.n >= 3 && r[top[0]] - r[top[1]] >= 8;
    return r;
  }
  // junta a leitura local com a da IA (quando houver)
  function discMesclar(local, ia) {
    if (!ia || !DK.every((k) => typeof ia[k] === "number")) return local;
    const m = normDisc(Object.fromEntries(DK.map((k) => [k, (local[k] + ia[k]) / 2])), Math.max(local.n, 3));
    if (ia.como_falar) m.como_falar = ia.como_falar;
    return m;
  }
  function discHTML(d, titulo) {
    if (!d || !d.n) return `<div class="small dim">${titulo ? "" : ""}O perfil aparece quando o paciente começar a falar.</div>`;
    const P = DISC[d.perfil];
    return `<div class="disc" role="img" aria-label="Perfil DISC: D ${d.D}%, I ${d.I}%, S ${d.S}%, C ${d.C}%">${DK.map((k) => `<div title="${esc(DISC[k].nome + ": " + DISC[k].cor)}"><div class="dcol${k === d.perfil ? " top" : ""}"><b style="height:${Math.max(4, d[k])}%"></b></div><span>${k} ${d[k]}%</span><em>${DISC[k].nome}</em></div>`).join("")}</div>
      <div><b>${esc(P.nome)}</b> <span class="small dim">· ${esc(P.cor)}${d.seguro ? "" : " · leitura inicial"}</span></div>
      <div class="small"><b>Como falar:</b> ${esc(d.como_falar || P.como)}</div><div class="small dim"><b>Evite:</b> ${esc(P.evitar)}</div>`;
  }
  // SPIN e N.E.A.T. aplicados a uma conversa de WhatsApp (Social Selling)
  function metodoConversa(msgs) {
    const spin = {}, neat = {};
    (msgs || []).forEach((m) => {
      const t = norm(m.texto);
      if (m.autor === "cliente") Object.entries(PISTA_NEAT).forEach(([k, ps]) => { if (ps.some((x) => t.includes(x))) neat[k] = true; });
      else Object.entries(PISTA_SPIN).forEach(([k, ps]) => { if (ps.some((x) => t.includes(x))) spin[k] = true; });
    });
    // se o paciente já contou o problema, a etapa P está coberta
    if (neat.N) spin.P = true;
    let rot = "", q = "";
    // segue adiante: a próxima etapa depois da última já feita (no WhatsApp não se volta para a Situação)
    const ord = ["S", "P", "I", "N"], ult = ord.reduce((a, x, i) => (spin[x] ? i : a), -1);
    const k = ord.slice(ult + 1).find((x) => !spin[x]) || (ult < 0 ? "S" : "");
    if (k) { rot = "SPIN · " + MET.spin[k].nome; q = MET.spin[k].perguntas[0]; }
    else { const n = ["N", "E", "A", "T"].find((x) => !neat[x]); if (n) { rot = "N.E.A.T. · " + MET.neat[n].nome; q = MET.neat[n].pergunta; } }
    return { spin, neat, rot, q };
  }

  /* ------------------------------------------------------------ */
  /* WhatsApp: lista · chat · chat sugerido                         */
  /* ------------------------------------------------------------ */
  WA.filtro = ""; WA.ia = {}; WA.rascunho = {};
  function linkWA(i, txt) { return i.telefone ? `https://wa.me/${(digits(i.telefone).length <= 11 ? "55" : "") + digits(i.telefone)}?text=${encodeURIComponent(txt || "")}` : ""; }
  function analiseWA(lead) {
    const msgs = WA.msgs[lead] || [], ia = WA.ia[lead] || {};
    const cli = msgs.filter((m) => m.autor === "cliente").map((m) => m.texto);
    const ass = assuntosDe(msgs); (ia.assuntos || []).forEach((a) => { if (ASS_NOME[a] && !ass.includes(a)) ass.push(a); });
    return { disc: discMesclar(discDe(cli), ia.disc), assuntos: ass, tratamento: tratDe(ia.tratamento_interesse) || ia.tratamento_interesse || tratamentoDaConversa(msgs), metodo: metodoConversa(msgs) };
  }
  function renderAssuntosFiltro() {
    const n = {};
    WA.conversas.forEach((c) => { const msgs = WA.msgs[c.lead]; const ass = msgs ? assuntosDe(msgs) : (c.assuntos || []); ass.forEach((a) => { n[a] = (n[a] || 0) + 1; }); });
    const ids = Object.keys(n).sort((a, b) => n[b] - n[a]);
    $("#waAssuntos").innerHTML = filtroSetorHTML() + (ids.length ? `<button data-ass="" class="${WA.filtro ? "" : "on"}">Todos os assuntos</button>` + ids.map((a) => `<button data-ass="${a}" class="${WA.filtro === a ? "on" : ""}">${esc(ASS_NOME[a])} · ${n[a]}</button>`).join("") : "");
  }
  function renderWA() {
    $("#waEstado").textContent = waModoReal() ? "conectado" : PLAT ? "aguardando configuração do webhook" : "demonstração";
    renderAssuntosFiltro();
    const lista = WA.conversas.filter((c) => { if (!passaSetor(c.lead)) return false; if (!WA.filtro) return true; const msgs = WA.msgs[c.lead]; return (msgs ? assuntosDe(msgs) : (c.assuntos || [])).includes(WA.filtro); });
    $("#waLista").innerHTML = lista.length ? lista.map((c) => { const i = WA.info[c.lead] || {}; const msgs = WA.msgs[c.lead]; const ass = (msgs ? assuntosDe(msgs) : (c.assuntos || [])).slice(0, 3);
      return `<button data-wa="${esc(c.lead)}" class="${c.lead === WA.sel ? "on" : ""}">${avaHTML(i.nome || c.nome, i.foto || c.foto)}<div class="t"><b>${esc(i.nome || c.nome || "Lead " + c.lead)}${naoLida(c) ? '<span class="nova" title="nova mensagem"></span>' : ""}</b><span class="u">${c.autor === "clinica" ? "Você: " : ""}${esc(c.ultima)}</span>${ass.length || WA.setor[c.lead] ? `<span class="ass">${setorTag(c.lead)}${ass.map((a) => `<span>${esc(ASS_NOME[a])}</span>`).join("")}</span>` : ""}</div><span class="h">${c.ts ? hora(c.ts) : ""}</span></button>`; }).join("")
      : `<div class="vazio">${WA.filtro ? "Nenhuma conversa com esse assunto." : PLAT ? "Nenhuma conversa ainda. Conecte o celular (Ajustes) ou configure o webhook do Kommo e as mensagens aparecem aqui." : "Sem conversas."}</div>`;
    renderChat();
  }
  function renderChat() {
    const el = $("#waChat"), side = $("#waSide"); const lead = WA.sel;
    const foco = document.activeElement && document.activeElement.id === "waTexto" ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
    $("#wa").classList.toggle("aberta", !!lead);
    if (!lead) { el.innerHTML = `<div class="vazio">Escolha uma conversa à esquerda.</div>`; side.innerHTML = ""; return; }
    const i = WA.info[lead] || {}, msgs = WA.msgs[lead] || [], t = WA.temp[lead] ?? 25, hum = WA.humano[lead];
    const doCelular = lead.startsWith("tel-") || i.origem === "celular";
    const kommoLink = !doCelular && PLAT && PLAT.kommoUrl ? `${PLAT.kommoUrl}/leads/detail/${encodeURIComponent(lead)}` : "";
    const nivel = t >= 70 ? "🔥 Quente · pronto para fechar" : t >= 40 ? "🌤️ Morno" : "❄️ Frio";
    const rasc = WA.rascunho[lead] || "";
    const wa = linkWA(i, rasc);
    const podeEnviar = (doCelular && pode("enviar_whatsapp")) || !PLAT; // celular conectado envia direto; na demonstração simula
    el.innerHTML = `<div class="card wahead"><button class="btn sm ghost voltar" id="waVoltar">← Conversas</button>${avaHTML(i.nome, i.foto)}
        <div class="grow"><b style="font-size:17px">${esc(i.nome || "Lead " + lead)}</b><div class="small dim">${esc([i.unidade, i.telefone, i.origem].filter(Boolean).join(" · ") || "lead " + lead)}</div></div>
        <span class="minitermo" title="Prontidão para o fechamento">🌡 <i><b style="width:${t}%"></b></i>${t}%</span><span class="pill ${t >= 70 ? "bad" : t >= 40 ? "warn" : ""}">${nivel}</span>
        <div class="row" style="width:100%">${setorPill(lead)}<button class="btn sm" data-waact="transferir" title="Transferir a conversa para outro setor">⇄ Transferir</button>${doCelular ? `<span class="pill acc">📱 Celular conectado</span>` : hum ? `<span class="pill acc">✋ Atendimento humano · IA pausada</span><button class="btn sm" data-waact="devolver">🤖 Devolver para a IA</button>` : `<button class="btn sm" data-waact="assumir">✋ Assumir atendimento</button>`}
          ${(() => { const px = PAC.find((x) => x.leadId && String(x.leadId) === String(lead)); if (!px) return `<button class="btn sm" data-waact="followup">+ Adicionar ao CRM</button>`;
          const e0 = etapaDe(px), op = (g, t) => `<optgroup label="${t}">${ETAPAS.filter((e) => e.grupo === g).map((e) => `<option value="${e.id}"${e.id === e0 ? " selected" : ""}>${esc(e.nome)}</option>`).join("")}</optgroup>`;
          return `<label class="small dim" for="waCrm">CRM</label><select class="in crmsel" id="waCrm" data-crmsel="${px.id}" aria-label="Etapa no CRM">${op("lead", "Funil Lead")}${op("cliente", "Funil Cliente")}</select><button class="btn sm" data-waact="followup">Ficha</button>`; })()}${kommoLink ? `<a class="btn sm" href="${esc(kommoLink)}" target="_blank" rel="noopener">Abrir no Kommo</a>` : ""}</div></div>
      <div class="thread" id="waThread">${comTransf(lead, msgs).map((m) => m._tr ? transfHTML(m) : `<div class="bolha ${m.autor === "cliente" ? "cli" : "cl"}${m._nova ? " chegou" : ""}">${esc(m.texto)}<span class="m">${m.autor === "cliente" ? "Paciente" : m.ia ? "🤖 IA de atendimento" : "Clínica"} · ${hora(m.ts)}</span></div>`).join("") || '<p class="dim">Sem mensagens.</p>'}</div>
      <div class="wa-avisos hide" id="waAvisos" aria-live="polite"></div>
      <div class="composer"><textarea id="waTexto" rows="2" spellcheck="true" lang="pt-BR" aria-label="Escreva a mensagem" placeholder="Escreva uma mensagem…">${esc(rasc)}</textarea>
        ${podeEnviar ? `<button class="btn pri" data-waact="enviar" title="${doCelular ? "Enviar pelo celular conectado" : "Enviar"}">➤ Enviar</button>` : `<button class="btn pri" data-waact="copiar">${kommoLink ? "Copiar e abrir no Kommo" : "Copiar"}</button>`}
        ${wa ? `<a class="btn" id="waLink" href="${esc(wa)}" target="_blank" rel="noopener" title="Abrir no WhatsApp">WhatsApp</a>` : ""}</div>`;
    msgs.forEach((m) => delete m._nova);
    const th = $("#waThread"); th.scrollTop = th.scrollHeight;
    if (foco) { const ta = $("#waTexto"); ta.focus(); try { ta.setSelectionRange(foco[0], foco[1]); } catch (e) { /* */ } }
    avisosComposer();
    renderSide();
  }
  function renderSide() {
    const lead = WA.sel, side = $("#waSide"); if (!lead) { side.innerHTML = ""; return; }
    const sg = WA.sug[lead], A = analiseWA(lead), M = A.metodo;
    const ch = (ok, txt, tip) => `<span class="pill ${ok ? "good" : ""}" title="${esc(tip || "")}">${ok ? "✓ " : ""}${esc(txt)}</span>`;
    side.innerHTML = `${sg ? `<div class="resp"><div class="row"><span class="label grow" style="color:var(--tip-dim)">Chat sugerido</span><span class="small" style="color:var(--tip-dim)">${sg.fonte === "ia" ? "IA" : "roteiro"}</span></div>
        <div class="row"><span class="pill acc">${esc(sg.rotulo || "Sugestão")}</span></div>
        <div class="ori">${esc(sg.orientacao || "")}</div>
        <textarea id="waSug" aria-label="Resposta sugerida">${esc(sg.mensagem || "")}</textarea>
        <div class="row"><button class="btn pri" data-waact="usar">↙ Usar no chat</button><button class="btn" data-waact="outra">↻ Outra versão</button><button class="btn" data-waact="modelos">📋 Modelos</button></div></div>` : ""}
      <div class="card stack"><div class="row"><span class="label grow">Perfil DISC do paciente</span><span class="tiny dim">pelo jeito de escrever</span></div>${discHTML(A.disc)}</div>
      <div class="card stack"><div class="row"><span class="label grow">Social Selling</span><span class="tiny dim">SPIN · N.E.A.T.</span></div>
        <div class="row">${["S", "P", "I", "N"].map((k) => ch(M.spin[k], k + " · " + MET.spin[k].nome, MET.spin[k].objetivo)).join("")}</div>
        <div class="row">${["N", "E", "A", "T"].map((k) => ch(M.neat[k], MET.neat[k].nome, MET.neat[k].dica)).join("")}</div>
        ${M.q ? `<div class="proxq"><span class="small dim">Próxima pergunta · <b>${esc(M.rot)}</b></span><div style="margin-top:4px">“${esc(M.q)}”</div><button class="btn sm" style="margin-top:8px" data-waact="pergunta">↙ Usar no chat</button></div>` : `<div class="small"><b>Tudo coberto.</b> Convide para o próximo passo.</div>`}</div>
      <div class="card stack"><span class="label">Assuntos desta conversa</span>
        <div class="row">${A.assuntos.length ? A.assuntos.map((a) => `<span class="pill">${esc(ASS_NOME[a])}</span>`).join("") : '<span class="small dim">Nenhum ainda.</span>'}</div>
        <div class="small">Tratamento de interesse: <b>${esc(A.tratamento || "não identificado")}</b></div></div>`;
  }
  function usarNoChat(lead, txt) {
    WA.rascunho[lead] = txt; const ta = $("#waTexto"); if (!ta) return;
    ta.value = txt; ta.focus(); const a = $("#waLink"); if (a) a.href = linkWA(WA.info[lead] || {}, txt);
  }
  async function abrirConversa(lead) {
    WA.sel = lead;
    if (waModoReal() && !WA.msgs[lead]) {
      try { const d = await api("GET", "api/whatsapp/mensagens?lead=" + encodeURIComponent(lead)); WA.msgs[lead] = d.mensagens || []; WA.transf[lead] = d.transferencias || []; } catch (e) { WA.msgs[lead] = []; }
      recalcularTemp(lead);
    }
    const c = WA.conversas.find((x) => x.lead === lead); if (c) { WA.lido[lead] = c.ts; ls.set("alinha.wa.lido", WA.lido); }
    renderWA(); gerarSugestao(lead);
    if (PLAT && PLAT.kommo && !lead.startsWith("tel-") && !WA.info[lead]._kommo) {
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
    if (!waModoReal() || document.hidden) return; // aba escondida: não consulta (economiza o banco)
    const antes = Object.fromEntries(WA.conversas.map((c) => [c.lead, c.ts]));
    if (!(await carregarConversas())) return; // sem novidade em nenhuma conversa
    if (WA.sel && WA.msgs[WA.sel]) {
      const l = WA.msgs[WA.sel], desde = l.length ? l[l.length - 1].ts : "";
      try { const d = await api("GET", "api/whatsapp/mensagens?lead=" + encodeURIComponent(WA.sel) + "&desde=" + encodeURIComponent(desde)); receber(WA.sel, d.mensagens || []); } catch (e) { /* tenta de novo */ }
    }
    if (vista === "whatsapp" && WA.conversas.some((c) => antes[c.lead] !== c.ts)) renderWA();
  }
  $("#waLista").addEventListener("click", (e) => { const b = e.target.closest("[data-wa]"); if (b) abrirConversa(b.dataset.wa); });
  $("#waAssuntos").addEventListener("click", (e) => { const b = e.target.closest("[data-ass]"); if (!b) return; WA.filtro = b.dataset.ass; renderWA(); });
  $("#wa").addEventListener("input", (e) => {
    if (!WA.sel) return;
    if (e.target.id === "waTexto") { autoCorrigir(e.target, e); avisosComposer(); WA.rascunho[WA.sel] = e.target.value; const a = $("#waLink"); if (a) a.href = linkWA(WA.info[WA.sel] || {}, e.target.value); }
    if (e.target.id === "waSug" && WA.sug[WA.sel]) WA.sug[WA.sel].mensagem = e.target.value;
  });
  $("#wa").addEventListener("change", async (e) => {
    const sel = e.target.closest("[data-crmsel]"); if (!sel) return;
    const px = PAC.find((x) => x.id === sel.dataset.crmsel); if (px) await mover(px, sel.value);
  });
  $("#wa").addEventListener("keydown", (e) => {
    if (e.target.id !== "waTexto" || e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    const b = $('#waChat [data-waact="enviar"]'); if (b) { e.preventDefault(); b.click(); }
  });
  $("#wa").addEventListener("click", async (e) => {
    if (e.target.closest("#waVoltar")) { WA.sel = null; renderWA(); return; }
    const b = e.target.closest("[data-waact]"); if (!b || !WA.sel) return;
    const lead = WA.sel, act = b.dataset.waact, i = WA.info[lead] || {};
    if (act === "usar") {
      usarNoChat(lead, ($("#waSug") || {}).value || (WA.sug[lead] || {}).mensagem || "");
    } else if (act === "pergunta") {
      const M = metodoConversa(WA.msgs[lead] || []); if (M.q) usarNoChat(lead, preencherBib(M.q, lead));
    } else if (act === "copiar") {
      const txt = $("#waTexto").value.trim() || ($("#waSug") || {}).value || "";
      const negC = negativasNoTexto(txt);
      if (negC.length && b.dataset.conf !== "1") { b.dataset.conf = "1"; toast(`Evite: ${negC.map((x) => x.p).join(", ")}. Troque ou toque de novo para copiar assim.`); setTimeout(() => { b.dataset.conf = ""; }, 6000); return; }
      try { await navigator.clipboard.writeText(txt); toast("Mensagem copiada"); } catch (err) { $("#waTexto").select(); toast("Selecionado: use Ctrl+C para copiar"); }
      if (PLAT && PLAT.kommoUrl && !lead.startsWith("tel-")) window.open(`${PLAT.kommoUrl}/leads/detail/${encodeURIComponent(lead)}`, "_blank", "noopener");
    } else if (act === "modelos") {
      abrirModelos(Object.assign({}, i, { nome: i.nome }), (txt) => { WA.sug[lead] = Object.assign({}, WA.sug[lead] || {}, { mensagem: txt, rotulo: "Modelo", orientacao: "Modelo da biblioteca: revise e envie.", fonte: "roteiro" }); renderSide(); });
    } else if (act === "enviar") {
      const txt = $("#waTexto").value.trim(); if (!txt) { toast("Escreva a mensagem ou use a sugestão ao lado"); return; }
      const neg = negativasNoTexto(txt);
      if (neg.length && b.dataset.conf !== "1") { b.dataset.conf = "1"; avisosComposer(); toast(`Evite: ${neg.map((x) => x.p).join(", ")}. Troque ou toque em Enviar de novo para mandar assim.`); setTimeout(() => { b.dataset.conf = ""; }, 6000); return; }
      b.disabled = true; b.textContent = "Enviando…";
      try {
        if (PLAT) { const d = await api("POST", "api/whatsapp/enviar", { lead, texto: txt }); WA.rascunho[lead] = ""; receber(lead, [{ id: d.id, ts: new Date().toISOString(), autor: "clinica", texto: txt }]); toast("Mensagem enviada pelo celular ✓"); }
        else { WA.rascunho[lead] = ""; receber(lead, [{ id: "e" + Date.now(), ts: new Date().toISOString(), autor: "clinica", texto: txt }]); toast("Mensagem enviada ✓ (demonstração)"); }
      } catch (err) { toast("Não enviou: " + err.message); b.disabled = false; b.textContent = "➤ Enviar"; }
    } else if (act === "outra") {
      b.disabled = true; b.textContent = "Gerando…"; await gerarSugestao(lead, ($("#waSug") || {}).value || "");
    } else if (act === "assumir" || act === "devolver") {
      const humano = act === "assumir";
      try { if (PLAT && PLAT.kommo) await api("POST", "api/whatsapp/atendimento", { lead_id: lead, humano }); WA.humano[lead] = humano; renderChat(); toast(humano ? "Você assumiu: a IA do n8n fica pausada neste lead" : "Lead devolvido para a IA"); }
      catch (err) { toast("Kommo: " + err.message); }
    } else if (act === "transferir") {
      abrirTransferir(lead);
    } else if (act === "followup") {
      let p = PAC.find((x) => x.leadId && String(x.leadId) === String(lead));
      if (p) { abrirCard(p); return; }
      const cli = (WA.msgs[lead] || []).filter((m) => m.autor === "cliente");
      const objs = [...new Set(cli.flatMap((m) => BIB.objecoes.filter((o) => casa(m.texto, o.gatilhos)).map((o) => o.id)))];
      const A = analiseWA(lead);
      p = { id: novoId(), leadId: lead, nome: i.nome || "Lead " + lead, telefone: i.telefone || "", unidade: i.unidade || "", origem: i.origem === "celular" || lead.startsWith("tel-") ? "WhatsApp (celular)" : i.origem || "WhatsApp (Kommo)", status: "lead", etapa: "contato", entradaEm: (cli[0] || {}).ts || new Date().toISOString(),
        tratamento: A.tratamento || "", interesse: A.tratamento || "", disc: A.disc.n ? A.disc : undefined, assuntos: A.assuntos, crc: eu() || "", foto: i.foto || undefined,
        responsavel: (AJ.equipe || [])[0] || "", profissional: (AJ.equipe || [])[0] || "", objecoes: objs, palavras: cli.slice(-3).map((m) => m.texto.slice(0, 90)), oQueTravou: objs[0] ? OBJ_NOME[objs[0]] : "", prontidao: WA.temp[lead], toques: {} };
      await Store.salvar(p); toast("Adicionado ao CRM · Em contato"); render();
    }
  });

  /* ------------------------------------------------------------ */
  /* Resultados por tratamento                                      */
  /* ------------------------------------------------------------ */
  const RES = { dias: 0, unidade: "" };
  function renderResultados() {
    const corte = RES.dias ? Date.now() - RES.dias * 864e5 : 0;
    const lista = PAC.filter((p) => (!RES.unidade || p.unidade === RES.unidade) && (!corte || new Date(p.status === "fechado" && p.fechadoEm ? p.fechadoEm : p.consultaEm).getTime() >= corte));
    const G = {};
    lista.forEach((p) => {
      const k = tratDoPaciente(p); const g = G[k] = G[k] || { nome: k, interesse: 0, aberto: 0, fechado: 0, perdido: 0, valor: 0 };
      g.interesse++; g[p.status === "fechado" ? "fechado" : p.status === "perdido" ? "perdido" : "aberto"]++;
      if (p.status === "fechado") g.valor += Number(p.valorFechado || p.valorApresentado || 0);
    });
    const grupos = Object.values(G).sort((a, b) => b.interesse - a.interesse || b.fechado - a.fechado);
    const tot = grupos.reduce((a, g) => ({ i: a.i + g.interesse, f: a.f + g.fechado, v: a.v + g.valor }), { i: 0, f: 0, v: 0 });
    const top = grupos.slice().sort((a, b) => b.fechado - a.fechado || b.valor - a.valor)[0];
    $$("#resPeriodo button").forEach((b) => b.classList.toggle("on", Number(b.dataset.p) === RES.dias));
    $$("#resUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === RES.unidade));
    $("#kpisRes").innerHTML = [["Pacientes com interesse", tot.i, "no período"], ["Fecharam", tot.f, tot.i ? Math.round((tot.f / tot.i) * 100) + "% de conversão" : "—"], ["Valor fechado", brl(tot.v), tot.f ? "ticket " + brl(tot.v / tot.f) : "—"], ["Mais fechado", top && top.fechado ? top.nome : "—", top && top.fechado ? top.fechado + " paciente" + (top.fechado > 1 ? "s" : "") : ""]]
      .map(([l, v, s]) => `<div class="kpi"><div class="label">${l}</div><b class="num">${esc(String(v))}</b><span>${esc(s)}</span></div>`).join("");
    const max = Math.max(1, ...grupos.map((g) => g.interesse));
    $("#resBarras").innerHTML = grupos.length ? grupos.map((g) => {
      const conv = g.interesse ? Math.round((g.fechado / g.interesse) * 100) : 0;
      const dica = (rot, n) => esc(`${g.nome} · ${rot}: ${n} paciente${n === 1 ? "" : "s"}${rot === "Fechados" ? ` (${conv}% de conversão${g.valor ? ", " + brl(g.valor) : ""})` : ` (${g.aberto} em negociação, ${g.perdido} ${g.perdido === 1 ? "não fechou" : "não fecharam"})`}`);
      return `<div class="lin"><div class="nome">${esc(g.nome)}<small>${conv}% de conversão</small></div><div class="par">
        <div class="bar"><b style="width:${(g.interesse / max) * 100}%;background:var(--s-interesse)" data-dica="${dica("Interesse", g.interesse)}"></b><span>${g.interesse}</span></div>
        <div class="bar"><b style="width:${(g.fechado / max) * 100}%;background:var(--s-fechado)" data-dica="${dica("Fechados", g.fechado)}"></b><span>${g.fechado}</span></div></div></div>`; }).join("")
      : `<div class="vazio">Nenhum paciente neste filtro. Os tratamentos entram aqui a partir das consultas, do follow-up e do WhatsApp.</div>`;
    $("#resTabela").innerHTML = `<thead><tr><th>Tratamento</th><th class="n">Interesse</th><th class="n">Em negociação</th><th class="n">Fecharam</th><th class="n">Não fecharam</th><th class="n">Conversão</th><th class="n">Valor fechado</th><th class="n">Ticket médio</th></tr></thead><tbody>${grupos.map((g) => `<tr><td>${esc(g.nome)}</td><td class="n">${g.interesse}</td><td class="n">${g.aberto}</td><td class="n">${g.fechado}</td><td class="n">${g.perdido}</td><td class="n">${g.interesse ? Math.round((g.fechado / g.interesse) * 100) : 0}%</td><td class="n">${brl(g.valor)}</td><td class="n">${g.fechado ? brl(g.valor / g.fechado) : "—"}</td></tr>`).join("")}
      ${grupos.length > 1 ? `<tr style="font-weight:800"><td>Total</td><td class="n">${tot.i}</td><td class="n">${grupos.reduce((a, g) => a + g.aberto, 0)}</td><td class="n">${tot.f}</td><td class="n">${grupos.reduce((a, g) => a + g.perdido, 0)}</td><td class="n">${tot.i ? Math.round((tot.f / tot.i) * 100) : 0}%</td><td class="n">${brl(tot.v)}</td><td class="n">${tot.f ? brl(tot.v / tot.f) : "—"}</td></tr>` : ""}</tbody>`;
    rotularTabela($("#resTabela"));
    // WhatsApp: tratamentos e assuntos das conversas
    const nt = {}, na = {};
    WA.conversas.filter((c) => !RES.unidade || (WA.info[c.lead] || {}).unidade === RES.unidade).forEach((c) => {
      const msgs = WA.msgs[c.lead]; const A = msgs ? analiseWA(c.lead) : { tratamento: c.tratamento || "", assuntos: c.assuntos || [] };
      if (A.tratamento) nt[A.tratamento] = (nt[A.tratamento] || 0) + 1;
      A.assuntos.forEach((a) => { na[a] = (na[a] || 0) + 1; });
    });
    const bloco = (titulo, obj, nome) => { const ks = Object.keys(obj).sort((a, b) => obj[b] - obj[a]); const mx = Math.max(1, ...ks.map((k) => obj[k]));
      return `<div><span class="label">${titulo}</span><div class="lista-bar" style="margin-top:8px">${ks.length ? ks.map((k) => `<div><span>${esc(nome(k))}</span><i style="width:${(obj[k] / mx) * 100}%" data-dica="${esc(nome(k) + ": " + obj[k] + " conversa" + (obj[k] > 1 ? "s" : ""))}"></i><b class="num">${obj[k]}</b></div>`).join("") : '<span class="small dim">Sem conversas ainda.</span>'}</div></div>`; };
    $("#resWA").innerHTML = bloco("Tratamento de interesse", nt, (k) => k) + bloco("Assuntos mais falados", na, (k) => ASS_NOME[k] || k);
  }
  $("#resPeriodo").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (b) { RES.dias = Number(b.dataset.p); renderResultados(); } });
  $("#resUnidade").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { RES.unidade = b.dataset.u; renderResultados(); } });
  // dica ao passar o mouse (ou tocar) nas barras
  const dicaG = $("#dicaGrafico");
  document.addEventListener("pointerover", (e) => { const el = e.target.closest("[data-dica]"); if (!el) { dicaG.classList.add("hide"); return; } dicaG.textContent = el.dataset.dica; dicaG.classList.remove("hide"); });
  document.addEventListener("pointermove", (e) => { if (dicaG.classList.contains("hide")) return; const w = dicaG.offsetWidth; dicaG.style.left = Math.min(window.innerWidth - w - 8, e.clientX + 14) + "px"; dicaG.style.top = (e.clientY + 16) + "px"; });

  /* ------------------------------------------------------------ */
  /* Permissões: Administrador · Operacional · CRC                  */
  /* ------------------------------------------------------------ */
  const TELAS = [["hoje", "Hoje"], ["whatsapp", "WhatsApp"], ["crm", "CRM (Funil Lead e Funil Cliente)"], ["consulta", "Consulta"], ["briefings", "Briefings"], ["followup", "Follow-up"], ["comercial", "Comercial (funil do mês)"], ["tratamentos", "Tratamentos e laboratório"], ["resultados", "Resultados"], ["campanhas", "Campanhas"]];
  const ACOES = [["enviar_whatsapp", "Enviar mensagens pelo celular conectado"], ["exportar", "Baixar cópia dos dados"]];
  const PAPEL_NOME = { admin: "Administrador", operacional: "Operacional", crc: "CRC" };
  const PERM_PADRAO = {
    operacional: { telas: ["hoje", "crm", "consulta", "briefings", "followup", "comercial", "tratamentos"], acoes: [] },
    crc: { telas: ["hoje", "whatsapp", "crm", "briefings", "followup", "comercial", "tratamentos"], acoes: ["enviar_whatsapp"] }
  };
  const papel = () => (PLAT ? PLAT.papel : "admin");
  function perm() {
    if (PLAT && PLAT.permissoes) return PLAT.permissoes;
    return { telas: TELAS.map((t) => t[0]).concat("suporte", "ajustes"), acoes: ACOES.map((a) => a[0]).concat("apagar", "configurar") };
  }
  const pode = (k) => perm().telas.includes(k) || perm().acoes.includes(k);
  function aplicarPermissoes() {
    $$("#nav button[data-v]").forEach((b) => b.classList.toggle("hide", !pode(b.dataset.v)));
    // celular: 4 telas na barra + "Mais" com as outras
    const vis = $$("#nav button[data-v]").filter((b) => !b.classList.contains("hide"));
    vis.forEach((b, i) => b.classList.toggle("prim", i < 4 || vis.length <= 5));
    $("#navMais").classList.toggle("hide", vis.length <= 5);
    document.body.dataset.papel = papel();
  }
  function renderPermissoes() {
    const el = $("#permTabela"); if (!el) return;
    const P = Object.assign({}, PERM_PADRAO, AJ.permissoes || {});
    const linha = (chave, nome, tipo) => `<tr><td>${esc(nome)}</td><td class="c">✓</td>${["operacional", "crc"].map((r) => `<td class="c"><input type="checkbox" aria-label="${esc(nome)} · ${PAPEL_NOME[r]}" data-perm="${r}|${tipo}|${chave}"${(P[r] && P[r][tipo] || []).includes(chave) ? " checked" : ""}></td>`).join("")}</tr>`;
    el.innerHTML = `<thead><tr><th>Tela ou ação</th><th class="c">Admin</th><th class="c">Operacional</th><th class="c">CRC</th></tr></thead><tbody>
      ${TELAS.map(([k, n]) => linha(k, n, "telas")).join("")}${ACOES.map(([k, n]) => linha(k, n, "acoes")).join("")}
      <tr><td>Ajustes da clínica, equipe, domínio, conectar celular, apagar dados</td><td class="c">✓</td><td class="c dim">—</td><td class="c dim">—</td></tr></tbody>`;
    $("#aLeadsAuto").checked = AJ.leadsAutomaticos !== false;
    rotularTabela(el);
  }
  $("#btnSalvarPerm").addEventListener("click", async () => {
    const P = { operacional: { telas: [], acoes: [], v: 2 }, crc: { telas: [], acoes: [], v: 2 } };
    $$("#permTabela [data-perm]").forEach((c) => { if (c.checked) { const [r, t, k] = c.dataset.perm.split("|"); P[r][t].push(k); } });
    try { await Store.ajustes({ permissoes: P, leadsAutomaticos: $("#aLeadsAuto").checked }); $("#permStatus").textContent = "Salvo ✓ (vale no próximo acesso de cada pessoa)"; }
    catch (e) { $("#permStatus").textContent = "Erro: " + e.message; }
  });
  $("#btnPermPadrao").addEventListener("click", () => { AJ.permissoes = JSON.parse(JSON.stringify(PERM_PADRAO)); renderPermissoes(); $("#permStatus").textContent = "Padrão restaurado: toque em Salvar para confirmar."; });

  /* ------------------------------------------------------------ */
  /* Comercial: funil do mês e CRM-Pipeline                         */
  /* ------------------------------------------------------------ */
  // Funil de leads (antes de vir à clínica) → funil de clientes (quem compareceu)
  const ETAPAS = [
    { id: "novo", nome: "Lead novo", grupo: "lead", sub: "entrou agora" },
    { id: "contato", nome: "Em contato", grupo: "lead", sub: "conversando" },
    { id: "agendado", nome: "Agendou", grupo: "lead", sub: "check-up / avaliação marcada" },
    { id: "faltou", nome: "Faltou", grupo: "lead", sub: "remarcar" },
    { id: "perdido", nome: "Perdido", grupo: "lead", sub: "sem interesse ou sem resposta" },
    { id: "orcamento", nome: "Compareceu · orçamento", grupo: "cliente", sub: "follow-up do orçamento" },
    { id: "fechado", nome: "Fechou", grupo: "cliente", sub: "tratamento fechado" },
    { id: "nao_fechou", nome: "Não fechou", grupo: "cliente", sub: "reativação 30/60/90" }
  ];
  const ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.id, e]));
  const ehCliente = (p) => ["aberto", "fechado", "perdido"].includes(p.status);
  function etapaDe(p) {
    if (p.status === "lead") return ETAPA[p.etapa] ? p.etapa : "novo";
    return p.status === "fechado" ? "fechado" : p.status === "perdido" ? "nao_fechou" : "orcamento";
  }
  const entrouEm = (p) => p.entradaEm || p.consultaEm;
  async function mover(p, etapa) {
    const agora = new Date().toISOString(), antes = etapaDe(p);
    if (antes === etapa) return;
    if (ETAPA[etapa].grupo === "lead") {
      p.status = "lead"; p.etapa = etapa;
      if (etapa === "agendado") p.agendadoEm = p.agendadoEm || agora;
      if (etapa === "faltou") { p.faltouEm = agora; p.faltas = (p.faltas || 0) + 1; p.agendadoEm = p.agendadoEm || agora; }
      if (etapa === "perdido") p.perdidoEm = agora;
    } else {
      if (!ehCliente(p)) { p.compareceuEm = agora; p.consultaEm = agora; p.agendadoEm = p.agendadoEm || agora; p.toques = p.toques || {}; } // compareceu: vira cliente
      p.compareceuEm = p.compareceuEm || p.consultaEm || agora;
      if (etapa === "orcamento") { p.status = "aberto"; delete p.fechadoEm; }
      if (etapa === "fechado") { p.status = "fechado"; p.fechadoEm = agora; p.valorFechado = p.valorFechado || p.valorApresentado || 0; p.recuperado = inicioDia(agora).getTime() > inicioDia(p.consultaEm).getTime(); }
      if (etapa === "nao_fechou") { p.status = "perdido"; p.encerradoEm = agora; }
    }
    await Store.salvar(p);
    toast(etapa === "orcamento" && !["fechado", "nao_fechou"].includes(antes) ? `${primeiro(p.nome)} compareceu: agora é cliente (follow-up D0)` : `${primeiro(p.nome)} → ${ETAPA[etapa].nome}`);
    render();
    if (etapa === "fechado") aposFechamento(p);
  }
  const COM = { mes: new Date().toISOString().slice(0, 7), unidade: "", busca: "", abertas: {} };
  const noMes = (iso, mes) => !!iso && String(new Date(iso).toISOString()).slice(0, 7) === mes;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  function numerosComercial(mes, unidade, crc) {
    const base = PAC.filter((p) => (!unidade || p.unidade === unidade) && (crc == null || (p.crc || "") === crc));
    const coorte = base.filter((p) => noMes(entrouEm(p), mes)); // leads que entraram no mês
    const L = { entraram: coorte, agendaram: [], compareceram: [], faltaram: [], fecharam: [], naoFecharam: [], emFollowup: [], aguardando: [], perdidos: [] };
    coorte.forEach((p) => {
      const e = etapaDe(p);
      if (ehCliente(p) || ["agendado", "faltou"].includes(e) || p.agendadoEm) L.agendaram.push(p);
      if (ehCliente(p)) L.compareceram.push(p);
      if (e === "faltou") L.faltaram.push(p);
      if (e === "perdido") L.perdidos.push(p);
      if (e === "fechado") L.fecharam.push(p);
      if (e === "nao_fechou") L.naoFecharam.push(p);
      if (e === "orcamento") L.emFollowup.push(p);
      if (["novo", "contato", "agendado"].includes(e)) L.aguardando.push(p);
    });
    const c = Object.fromEntries(Object.entries(L).map(([k, v]) => [k, v.length]));
    c.valorFechado = L.fecharam.reduce((t, p) => t + Number(p.valorFechado || 0), 0);
    c.valorFollowup = L.emFollowup.reduce((t, p) => t + Number(p.valorApresentado || 0), 0);
    // orçamentos (clientes que compareceram no mês) e o follow-up deles
    const orc = base.filter((p) => ehCliente(p) && noMes(p.compareceuEm || p.consultaEm, mes));
    const LO = { orcTotal: orc, orcFecharam: orc.filter((p) => p.status === "fechado"), orcNao: orc.filter((p) => p.status === "perdido"), orcFollow: orc.filter((p) => p.status === "aberto"), orcRecuperados: orc.filter((p) => p.status === "fechado" && p.recuperado) };
    const o = { total: orc.length, fecharam: LO.orcFecharam.length, naoFecharam: LO.orcNao.length, emFollowup: LO.orcFollow.length,
      apresentado: orc.reduce((t, p) => t + Number(p.valorApresentado || 0), 0), fechado: LO.orcFecharam.reduce((t, p) => t + Number(p.valorFechado || 0), 0), recuperados: LO.orcRecuperados.length };
    return { c, o, listas: Object.assign({}, L, LO) };
  }
  // lista de pacientes (ao tocar num número): sem precisar filtrar
  function abrirListaPacientes(titulo, lista, sub) {
    const linha = (p) => { const e = etapaDe(p), [dt, rot] = dataDoCartao(p, e), tel = telIntl(p.telefone);
      return `<div class="it" data-pid="${p.id}"><span class="tdot t-${tempDe(p)}" aria-hidden="true"></span><span class="grow"><b>${esc(p.nome)}</b><span class="tiny dim"> · ${esc(ETAPA[e].nome)}${p.unidade ? " · " + esc(p.unidade) : ""}${p.crc ? " · CRC " + esc(p.crc) : ""} · ${esc(rot.toLowerCase())} ${dt ? dataBR(dt) : "—"}</span></span>
        ${tel ? `<a class="btn sm" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp</a>` : ""}<button class="btn sm" data-lfich="1">Ficha</button></div>`; };
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${esc(titulo)}">
      <div class="row"><div class="grow"><h2 style="font-size:21px">${esc(titulo)}</h2><div class="small dim">${lista.length} paciente${lista.length === 1 ? "" : "s"}${sub ? " · " + esc(sub) : ""}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card"><div class="lista-int" id="lpLista">${lista.length ? lista.slice().sort((a, b) => a.nome.localeCompare(b.nome)).map(linha).join("") : `<span class="small dim">Ninguém aqui.</span>`}</div></div></div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#lpLista").addEventListener("click", (e) => { const it = e.target.closest("[data-pid]"); if (!it || e.target.closest("a")) return; const p = PAC.find((x) => x.id === it.dataset.pid); if (p) (ehCliente(p) ? abrirGaveta : abrirCard)(p); });
  }
  const NOME_LISTA = { entraram: "Leads que entraram", agendaram: "Agendaram", compareceram: "Compareceram (viraram clientes)", faltaram: "Faltaram à consulta", fecharam: "Fecharam", naoFecharam: "Não fecharam", emFollowup: "Em follow-up de orçamento", aguardando: "Ainda no Funil Lead", perdidos: "Leads perdidos",
    orcTotal: "Orçamentos do mês", orcFecharam: "Orçamentos fechados", orcNao: "Orçamentos não fechados", orcFollow: "Orçamentos em follow-up", orcRecuperados: "Recuperados pelo follow-up" };
  let LISTAS_COM = {};
  function kpisClic(sel, linhas) {
    $(sel).innerHTML = linhas.map(([rot, val, sub, hl, chave]) => !chave ? `<div class="kpi${hl ? " hl" : ""}"><div class="label">${rot}</div><b class="num">${val}</b><span>${sub}</span></div>` : `<button class="kpi click${hl ? " hl" : ""}" data-lista="${chave}" aria-label="${esc(rot)}: ${esc(String(val))}. Ver os pacientes"><div class="label">${rot}</div><b class="num">${val}</b><span>${sub}</span><em class="go">Ver nomes →</em></button>`).join("");
  }
  function renderComercial() {
    if (!$("#comMes").value) $("#comMes").value = COM.mes;
    $$("#comUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === COM.unidade));
    const { c, o, listas } = numerosComercial(COM.mes, COM.unidade);
    LISTAS_COM = listas;
    const nomeMes = new Date(COM.mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("#comTitulo").textContent = `Ampulheta de ${nomeMes}`;
    // ampulheta: em cima o Funil Lead (estreita até quem comparece), embaixo o Funil Cliente (alarga até quem fecha)
    const cam = (k, n, v, sub, lado, larg) => `<button class="camada-a ${lado}" style="--w:${larg}%" data-lista="${k}" aria-label="${esc(n)}: ${v}. Ver os pacientes" data-dica="${esc(`${n}: ${v} · ${sub} (toque para ver os nomes)`)}"><span class="num">${v}</span><small>${esc(n)}</small><em>${esc(sub)}</em></button>`;
    $("#ampulheta").innerHTML = `<div class="amp-rot">Funil Lead</div>
      ${cam("entraram", "Leads que entraram", c.entraram, "100%", "topo", 100)}
      ${cam("agendaram", "Agendaram", c.agendaram, `${pct(c.agendaram, c.entraram)}% dos leads`, "topo", 78)}
      ${cam("compareceram", "Compareceram", c.compareceram, `${pct(c.compareceram, c.agendaram)}% dos agendados`, "topo pescoco", 56)}
      <div class="amp-gargalo" aria-hidden="true">viraram clientes</div>
      ${cam("emFollowup", "Em follow-up", c.emFollowup, brl(c.valorFollowup), "base", 56)}
      ${cam("fecharam", "Fecharam", c.fecharam, `${pct(c.fecharam, c.compareceram)}% de quem compareceu · ${brl(c.valorFechado)}`, "base", 78)}
      <div class="amp-rot">Funil Cliente</div>`;
    $("#ampLados").innerHTML = [["faltaram", "Faltaram", c.faltaram, "bad"], ["perdidos", "Perdidos", c.perdidos, "bad"], ["aguardando", "Ainda no Funil Lead", c.aguardando, ""], ["naoFecharam", "Não fecharam", c.naoFecharam, "bad"]]
      .map(([k, n, v, cls]) => `<button class="lado ${cls}" data-lista="${k}" data-dica="${esc(n)}: toque para ver os nomes"><b class="num">${v}</b> ${esc(n)}</button>`).join("");
    kpisClic("#comOrc", [
      ["Orçamentos no mês", o.total, brl(o.apresentado) + " apresentados", false, "orcTotal"],
      ["Fecharam", o.fecharam, `${pct(o.fecharam, o.total)}% · ${brl(o.fechado)}`, true, "orcFecharam"],
      ["Não fecharam", o.naoFecharam, `${pct(o.naoFecharam, o.total)}% dos orçamentos`, false, "orcNao"],
      ["Em follow-up", o.emFollowup, `${o.recuperados} recuperado${o.recuperados === 1 ? "" : "s"}`, false, "orcFollow"]
    ]);
    const MT = AJ.metas || {}, barra = (n, v, m) => m ? `<div class="meta-l"><span>${n}</span><i><b style="width:${Math.min(100, pct(v, m))}%"></b></i><span class="num">${typeof v === "number" && n === "Faturamento" ? brl(v) : v} / ${n === "Faturamento" ? brl(m) : m}</span></div>` : "";
    $("#comMetas").innerHTML = (barra("Leads", c.entraram, MT.leads) + barra("Comparecimentos", c.compareceram, MT.comparecimentos) + barra("Fechamentos", c.fecharam, MT.fechamentos) + barra("Faturamento", c.valorFechado, MT.faturamento)) || `<span class="small dim">Cadastre as metas em Ajustes › Clínica e metas.</span>`;
    renderEquipe();
  }
  $("#v-comercial").addEventListener("click", (e) => {
    const b = e.target.closest("[data-lista]"); if (!b) return;
    const k = b.dataset.lista, crc = b.dataset.crc;
    const lista = crc != null ? numerosComercial(COM.mes, COM.unidade, crc).listas[k] : LISTAS_COM[k];
    if (lista) abrirListaPacientes((NOME_LISTA[k] || k) + (crc != null ? ` · ${crc || "sem CRC"}` : ""), lista, new Date(COM.mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  });
  // desempenho por CRC (metas individuais e evolução)
  const crcsCadastradas = () => (AJ.crcs || []).filter((x) => x && x.nome);
  function renderEquipe() {
    const el = $("#equipeTabela"); if (!el) return;
    const nomes = crcsCadastradas().map((x) => x.nome);
    PAC.forEach((p) => { if (p.crc && !nomes.includes(p.crc)) nomes.push(p.crc); });
    const meses = [2, 1, 0].map((k) => { const d = new Date(COM.mes + "-15"); d.setMonth(d.getMonth() - k); return d.toISOString().slice(0, 7); });
    const lin = (nome) => {
      const { c } = numerosComercial(COM.mes, COM.unidade, nome), cad = crcsCadastradas().find((x) => x.nome === nome), M = (cad && cad.metas) || {};
      const evo = meses.map((m) => numerosComercial(m, COM.unidade, nome).c.fecharam);
      const cel = (k, v, meta, moeda) => `<td class="n"><button class="lk" data-lista="${k}" data-crc="${esc(nome)}">${moeda ? brl(v) : v}</button>${meta ? `<div class="mini-meta" title="Meta: ${moeda ? brl(meta) : meta}"><b style="width:${Math.min(100, pct(v, meta))}%"></b></div><span class="tiny dim">${pct(v, meta)}% da meta</span>` : ""}</td>`;
      const idx = [["agendaram", M.agendamentos], ["compareceram", M.comparecimentos], ["fecharam", M.fechamentos]].filter(([, m]) => m).map(([k, m]) => Math.min(150, pct(c[k], m)));
      const indice = idx.length ? Math.round(idx.reduce((a, b) => a + b, 0) / idx.length) : null;
      return `<tr><td><b>${esc(nome || "Sem CRC")}</b></td>${cel("entraram", c.entraram)}${cel("agendaram", c.agendaram, M.agendamentos)}${cel("compareceram", c.compareceram, M.comparecimentos)}${cel("fecharam", c.fecharam, M.fechamentos)}<td class="n">${brl(c.valorFechado)}${M.faturamento ? `<div class="mini-meta"><b style="width:${Math.min(100, pct(c.valorFechado, M.faturamento))}%"></b></div>` : ""}</td>
        <td class="n">${pct(c.fecharam, c.compareceram)}%</td><td class="n">${indice == null ? "—" : `<b class="indice ${indice >= 100 ? "ok" : indice >= 70 ? "med" : "baixo"}">${indice}%</b>`}</td>
        <td class="n"><span class="evo" title="Fechamentos nos últimos 3 meses">${evo.map((v, i) => `<i style="height:${6 + Math.min(22, v * 5)}px" data-dica="${esc(new Date(meses[i] + "-15").toLocaleDateString("pt-BR", { month: "short" }))}: ${v} fechamento${v === 1 ? "" : "s"}"></i>`).join("")}</span></td></tr>`;
    };
    const semCrc = PAC.some((p) => !p.crc && noMes(entrouEm(p), COM.mes));
    el.innerHTML = nomes.length || semCrc ? `<thead><tr><th>CRC</th><th class="n">Leads atendidos</th><th class="n">Agendaram</th><th class="n">Compareceram</th><th class="n">Fecharam</th><th class="n">Faturamento</th><th class="n">Conversão</th><th class="n">Índice da meta</th><th class="n">Evolução</th></tr></thead><tbody>${nomes.map(lin).join("")}${semCrc ? lin("") : ""}</tbody>`
      : `<tbody><tr><td class="small dim">Cadastre as CRCs e as metas em Ajustes › Clínica e metas e escolha a CRC de cada lead.</td></tr></tbody>`;
    rotularTabela(el);
  }
  const CRMS = { unidade: "" };
  // termômetro do cliente (bolinha colorida): manual ou pela prontidão registrada
  const TEMPS = [["frio", "Frio"], ["morno", "Morno"], ["quente", "Quente"]];
  const tempDe = (p) => p.temp || (p.prontidao == null ? "sem" : p.prontidao >= 70 ? "quente" : p.prontidao >= 40 ? "morno" : "frio");
  const TEMP_NOME = { sem: "Sem leitura", frio: "Frio", morno: "Morno", quente: "Quente" };
  const telIntl = (t) => { const d = digits(t || ""); return d ? (d.length <= 11 ? "55" : "") + d : ""; };
  const ICO = {
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.4A8.4 8.4 0 1 1 20.5 11.6z"/><path d="M9 8.8c.2 2.6 2.6 5 5.2 5.2l.9-1.3-1.6-.8-.7.6a4 4 0 0 1-2.2-2.2l.6-.7-.8-1.6z" fill="currentColor" stroke="none"/></svg>',
    sms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg>'
  };
  function dataDoCartao(p, e) {
    if (e === "agendado" && p.agendaPara) return [p.agendaPara, "Consulta agendada para"];
    if (e === "orcamento") return [p.compareceuEm || p.consultaEm, "Compareceu em"];
    if (e === "fechado") return [p.fechadoEm, "Fechou em"];
    if (e === "nao_fechou") return [p.encerradoEm || p.consultaEm, "Encerrado em"];
    if (e === "faltou" && p.faltouEm) return [p.faltouEm, "Faltou em"];
    if (e === "perdido" && p.perdidoEm) return [p.perdidoEm, "Perdido em"];
    return [entrouEm(p), "Entrou em"];
  }
  function cartaoCRM(p) {
    const e = etapaDe(p), [dt, rot] = dataDoCartao(p, e), tel = telIntl(p.telefone), tp = tempDe(p);
    const lp = lembretesPendentes(p), atrasado = lp.some((l) => new Date(l.quando) <= fimDoDia());
    const lnk = (ok, href, ic, nome, extra = "") => ok ? `<a class="ic" href="${esc(href)}" ${extra} draggable="false" data-ic="${ic}" aria-label="${nome} para ${esc(p.nome)}" data-dica="${nome}">${ICO[ic]}</a>` : `<span class="ic off" aria-hidden="true" data-dica="${nome}: sem ${ic === "email" ? "e-mail" : "telefone"}">${ICO[ic]}</span>`;
    return `<div class="pc mini" draggable="true" data-pid="${p.id}" tabindex="0" role="button" aria-label="${esc(p.nome)} · ${esc(ETAPA[e].nome)}">
      <div class="icons">${lnk(!!p.email, "mailto:" + (p.email || ""), "email", "E-mail")}${lnk(!!tel, `https://wa.me/${tel}`, "wa", "WhatsApp", 'target="_blank" rel="noopener"')}${lnk(!!tel, `sms:+${tel}`, "sms", "SMS")}
        <button class="ic${lp.length ? (atrasado ? " late" : " on") : ""}" data-ic="lembrete" aria-label="Lembrete" data-dica="${lp.length ? `${lp.length} lembrete${lp.length > 1 ? "s" : ""} pendente${lp.length > 1 ? "s" : ""}` : "Criar lembrete"}">${ICO.bell}</button>
        <span class="grow"></span><button class="tdot t-${tp}" data-ic="temp" aria-label="Termômetro: ${TEMP_NOME[tp]}. Toque para trocar" data-dica="Termômetro: ${TEMP_NOME[tp]} (toque para trocar)"></button></div>
      <b>${esc(p.nome)}</b><span class="m num" data-dica="${esc(rot + " " + (dt ? dataBR(dt) : "—"))}">${dt ? dataBR(dt) : "—"}</span></div>`;
  }

  // filtros do CRM (Funil Lead e Funil Cliente)
  const CRMF0 = { origens: [], tratamentos: [], temps: [], responsaveis: [], etapas: [], de: "", ate: "", lembrete: "", contato: "", valorMin: "", valorMax: "", faltou: false, emTratamento: false };
  let CRMF = Object.assign({}, CRMF0, ls.get("alinha.crmFiltro", {}));
  const nFiltros = () => ["origens", "tratamentos", "temps", "responsaveis", "etapas"].filter((k) => CRMF[k].length).length + ["de", "ate", "lembrete", "contato", "valorMin", "valorMax"].filter((k) => CRMF[k]).length + (CRMF.faltou ? 1 : 0) + (CRMF.emTratamento ? 1 : 0);
  function passaFiltro(p) {
    const F = CRMF, ent = (entrouEm(p) || "").slice(0, 10), v = Number(p.status === "fechado" ? p.valorFechado : p.valorApresentado) || 0;
    if (F.origens.length && !F.origens.includes(p.origem || "Sem origem")) return false;
    if (F.tratamentos.length && !F.tratamentos.includes(tratDoPaciente(p))) return false;
    if (F.temps.length && !F.temps.includes(tempDe(p))) return false;
    if (F.responsaveis.length && !F.responsaveis.includes(p.responsavel || "Sem responsável")) return false;
    if (F.etapas.length && !F.etapas.includes(etapaDe(p))) return false;
    if (F.de && ent < F.de) return false; if (F.ate && ent > F.ate) return false;
    const lp = lembretesPendentes(p);
    if (F.lembrete === "pendente" && !lp.length) return false;
    if (F.lembrete === "atrasado" && !lp.some((l) => new Date(l.quando) <= fimDoDia())) return false;
    if (F.lembrete === "sem" && lp.length) return false;
    if (F.contato === "telefone" && !digits(p.telefone || "")) return false;
    if (F.contato === "email" && !p.email) return false;
    if (F.contato === "sem" && (digits(p.telefone || "") || p.email)) return false;
    if (F.valorMin && v < num(F.valorMin)) return false; if (F.valorMax && v > num(F.valorMax)) return false;
    if (F.faltou && !(p.faltas > 0 || p.faltouEm)) return false;
    if (F.emTratamento && !(p.trabalhos || []).some((t) => !concluido(t))) return false;
    return true;
  }
  function abrirFiltros() {
    const opc = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b));
    const origens = opc(PAC.map((p) => p.origem || "Sem origem")), trats = opc(PAC.map(tratDoPaciente)), resps = opc(PAC.map((p) => p.responsavel || "Sem responsável"));
    const grupo = (chave, lista, rotulos) => `<div class="chips fchips" data-fk="${chave}">${lista.map((x) => `<button data-fv="${esc(x)}" class="${CRMF[chave].includes(x) ? "on" : ""}">${esc(rotulos ? rotulos[x] : x)}</button>`).join("")}</div>`;
    const um = (chave, ops) => `<div class="chips fchips" data-fu="${chave}">${ops.map(([v, n]) => `<button data-fv="${v}" class="${CRMF[chave] === v ? "on" : ""}">${n}</button>`).join("")}</div>`;
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Filtrar o CRM">
      <div class="row"><h2 class="grow" style="font-size:21px">Filtrar</h2><span class="small dim" id="fQtd"></span><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack filtros" id="fBox">
        <div><span class="label">Etapa</span>${grupo("etapas", ETAPAS.map((e) => e.id), Object.fromEntries(ETAPAS.map((e) => [e.id, e.nome])))}</div>
        <div><span class="label">Termômetro</span>${grupo("temps", ["quente", "morno", "frio", "sem"], TEMP_NOME)}</div>
        <div><span class="label">Origem</span>${grupo("origens", origens)}</div>
        <div><span class="label">Tratamento de interesse</span>${grupo("tratamentos", trats)}</div>
        <div><span class="label">Responsável</span>${grupo("responsaveis", resps)}</div>
        <div><span class="label">Entrou entre</span><div class="row"><input class="in" type="date" id="fDe" value="${CRMF.de}" aria-label="De" style="width:auto"><span class="dim">e</span><input class="in" type="date" id="fAte" value="${CRMF.ate}" aria-label="Até" style="width:auto">
          <div class="chips"><button data-fper="7">7 dias</button><button data-fper="30">30 dias</button><button data-fper="90">90 dias</button></div></div></div>
        <div class="duo"><div><span class="label">Lembrete</span>${um("lembrete", [["", "Todos"], ["pendente", "Com lembrete"], ["atrasado", "Para hoje/atrasado"], ["sem", "Sem lembrete"]])}</div>
          <div><span class="label">Contato</span>${um("contato", [["", "Todos"], ["telefone", "Com telefone"], ["email", "Com e-mail"], ["sem", "Sem contato"]])}</div></div>
        <div><span class="label">Valor (orçamento ou fechado, R$)</span><div class="row"><input class="in num" id="fMin" placeholder="mínimo" inputmode="decimal" value="${esc(CRMF.valorMin)}" style="width:130px"><input class="in num" id="fMax" placeholder="máximo" inputmode="decimal" value="${esc(CRMF.valorMax)}" style="width:130px"></div></div>
        <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="fFaltou"${CRMF.faltou ? " checked" : ""}> Já faltou alguma vez</label>
        <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="fTrat"${CRMF.emTratamento ? " checked" : ""}> Com tratamento em andamento</label>
      </div>
      <div class="row"><button class="btn pri" id="fAplicar">Ver resultados</button><button class="btn" id="fLimpar">Limpar filtros</button></div></div></div>`;
    const aplicar = () => { ls.set("alinha.crmFiltro", CRMF); renderPipeline(); $("#fQtd").textContent = `${PAC.filter(passaFiltro).length} pacientes`; };
    aplicar();
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta; $("#fAplicar").onclick = fecharGaveta;
    $("#fLimpar").onclick = () => { CRMF = clonar(CRMF0); aplicar(); abrirFiltros(); };
    $("#fBox").addEventListener("click", (e) => {
      const b = e.target.closest("[data-fv]"); const per = e.target.closest("[data-fper]");
      if (per) { const d = new Date(Date.now() - Number(per.dataset.fper) * DIA).toISOString().slice(0, 10); CRMF.de = d; CRMF.ate = ""; $("#fDe").value = d; $("#fAte").value = ""; aplicar(); return; }
      if (!b) return;
      const multi = b.closest("[data-fk]"), unico = b.closest("[data-fu]");
      if (multi) { const k = multi.dataset.fk, v = b.dataset.fv; CRMF[k] = CRMF[k].includes(v) ? CRMF[k].filter((x) => x !== v) : CRMF[k].concat(v); b.classList.toggle("on"); }
      if (unico) { const k = unico.dataset.fu; CRMF[k] = b.dataset.fv; $$("button", unico).forEach((x) => x.classList.toggle("on", x === b)); }
      aplicar();
    });
    $("#fBox").addEventListener("input", (e) => {
      if (e.target.id === "fDe") CRMF.de = e.target.value; if (e.target.id === "fAte") CRMF.ate = e.target.value;
      if (e.target.id === "fMin") CRMF.valorMin = e.target.value; if (e.target.id === "fMax") CRMF.valorMax = e.target.value;
      if (e.target.id === "fFaltou") CRMF.faltou = e.target.checked; if (e.target.id === "fTrat") CRMF.emTratamento = e.target.checked;
      aplicar();
    });
  }

  function renderPipeline() {
    const q = norm(COM.busca);
    $$("#crmUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === CRMS.unidade));
    const lista = PAC.filter((p) => (!CRMS.unidade || p.unidade === CRMS.unidade) && (!q || norm(p.nome + " " + (p.telefone || "") + " " + (p.email || "")).includes(q)) && passaFiltro(p));
    const recente = (p) => { const e = etapaDe(p); if (["fechado"].includes(e)) return Date.now() - new Date(p.fechadoEm || 0) < 60 * 864e5; if (e === "nao_fechou") return Date.now() - new Date(p.encerradoEm || p.consultaEm || 0) < 60 * 864e5; return true; };
    const LIM = 7;
    const grupoHTML = (g) => ETAPAS.filter((e) => e.grupo === g && (!CRMF.etapas.length || CRMF.etapas.includes(e.id))).map((e) => {
      const itens = lista.filter((p) => etapaDe(p) === e.id && recente(p)).sort((a, b) => ((dataDoCartao(b, e.id)[0] || "") > (dataDoCartao(a, e.id)[0] || "") ? 1 : -1));
      const soma = itens.reduce((t, p) => t + Number((e.id === "fechado" ? p.valorFechado : p.valorApresentado) || 0), 0);
      return `<div class="col" data-etapa="${e.id}"><h3>${e.nome}<span class="pill">${itens.length}</span></h3><div class="sub">${e.sub}${soma ? " · " + brl(soma) : ""}</div>
        ${itens.slice(0, COM.abertas[e.id] ? itens.length : LIM).map(cartaoCRM).join("") || `<span class="tiny dim">vazio</span>`}
        ${itens.length > LIM ? `<button class="mais-col" data-maiscol="${e.id}">${COM.abertas[e.id] ? "Mostrar menos" : `+ ${itens.length - LIM} mais`}</button>` : ""}</div>`; }).join("");
    $("#pipeLead").innerHTML = grupoHTML("lead") || `<div class="vazio">Nenhuma etapa do Funil Lead no filtro.</div>`;
    $("#pipeCliente").innerHTML = grupoHTML("cliente") || `<div class="vazio">Nenhuma etapa do Funil Cliente no filtro.</div>`;
    const qtd = (g) => lista.filter((p) => ETAPA[etapaDe(p)].grupo === g && recente(p)).length;
    $("#crmQtdLead").textContent = qtd("lead"); $("#crmQtdCliente").textContent = qtd("cliente");
    const n = nFiltros(); $("#crmFiltroN").textContent = n || ""; $("#crmFiltroN").classList.toggle("hide", !n); $("#btnCrmLimpar").classList.toggle("hide", !n);
  }
  $("#btnCrmFiltro").addEventListener("click", abrirFiltros);
  $("#btnCrmLimpar").addEventListener("click", () => { CRMF = clonar(CRMF0); ls.set("alinha.crmFiltro", CRMF); renderPipeline(); });
  // ícones do cartão: lembrete, termômetro (os links de e-mail, WhatsApp e SMS abrem direto)
  $("#pipeline").addEventListener("click", async (e) => {
    const ic = e.target.closest("[data-ic]"); if (!ic) return;
    e.stopPropagation();
    const p = PAC.find((x) => x.id === ic.closest("[data-pid]").dataset.pid); if (!p) return;
    if (ic.dataset.ic === "lembrete") { e.preventDefault(); abrirLembrete(p); return; }
    if (ic.dataset.ic === "temp") {
      e.preventDefault();
      const ord = ["frio", "morno", "quente"], at = tempDe(p), nv = ord[(ord.indexOf(at) + 1) % 3];
      p.temp = nv; prontuario(p, `Termômetro: ${TEMP_NOME[nv]}`, new Date().toISOString());
      await Store.salvar(p); renderPipeline(); toast(`${primeiro(p.nome)}: ${TEMP_NOME[nv]}`);
    }
  }, true);
  $("#pipeline").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches(".pc.mini")) { const p = PAC.find((x) => x.id === e.target.dataset.pid); if (p) abrirCard(p); } });
  // arrastar e soltar entre as colunas
  let arrastando = null;
  $("#pipeline").addEventListener("dragstart", (e) => { const c = e.target.closest("[data-pid]"); if (!c) return; arrastando = c.dataset.pid; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", arrastando); } catch (er) { /* */ } });
  $("#pipeline").addEventListener("dragover", (e) => { const col = e.target.closest("[data-etapa]"); if (!col || !arrastando) return; e.preventDefault(); $$("#pipeline .col.alvo").forEach((x) => x !== col && x.classList.remove("alvo")); col.classList.add("alvo"); });
  $("#pipeline").addEventListener("dragleave", (e) => { const col = e.target.closest("[data-etapa]"); if (col && !col.contains(e.relatedTarget)) col.classList.remove("alvo"); });
  $("#pipeline").addEventListener("drop", async (e) => {
    const col = e.target.closest("[data-etapa]"); $$("#pipeline .col.alvo").forEach((x) => x.classList.remove("alvo"));
    if (!col || !arrastando) return; e.preventDefault();
    const p = PAC.find((x) => x.id === arrastando); arrastando = null; if (p) await mover(p, col.dataset.etapa);
  });
  $("#pipeline").addEventListener("dragend", () => { arrastando = null; $$("#pipeline .col.alvo").forEach((x) => x.classList.remove("alvo")); });
  $("#pipeline").addEventListener("click", (e) => { const m = e.target.closest("[data-maiscol]"); if (m) { COM.abertas[m.dataset.maiscol] = !COM.abertas[m.dataset.maiscol]; renderPipeline(); return; } if (e.target.closest("[data-ic]")) return; const c = e.target.closest("[data-pid]"); if (!c) return; const p = PAC.find((x) => x.id === c.dataset.pid); if (p) abrirCard(p); });
  $("#comMes").addEventListener("change", (e) => { COM.mes = e.target.value || new Date().toISOString().slice(0, 7); renderComercial(); });
  $("#comUnidade").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { COM.unidade = b.dataset.u; renderComercial(); } });
  $("#crmUnidade").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { CRMS.unidade = b.dataset.u; renderPipeline(); } });
  $("#btnIrCrm").addEventListener("click", () => mostrar("crm"));
  // soltar o card sobre a aba do outro funil: Funil Cliente = compareceu; Funil Lead = volta para "Agendou"
  const abasCrm = $('.abas[data-grupo="crm"]');
  abasCrm.addEventListener("dragover", (e) => { const b = e.target.closest("[data-solta]"); if (!b || !arrastando) return; e.preventDefault(); b.classList.add("solta"); });
  abasCrm.addEventListener("dragleave", (e) => { const b = e.target.closest("[data-solta]"); if (b) b.classList.remove("solta"); });
  abasCrm.addEventListener("drop", async (e) => {
    const b = e.target.closest("[data-solta]"); $$('.abas[data-grupo="crm"] .solta').forEach((x) => x.classList.remove("solta"));
    if (!b || !arrastando) return; e.preventDefault();
    const p = PAC.find((x) => x.id === arrastando); arrastando = null; if (!p) return;
    const alvo = b.dataset.solta === "cliente" ? "orcamento" : "agendado";
    if (ETAPA[etapaDe(p)].grupo !== b.dataset.solta) { await mover(p, alvo); abrirAba("crm", b.dataset.solta); renderPipeline(); }
  });
  $("#comBusca").addEventListener("input", (e) => { COM.busca = e.target.value; renderPipeline(); });
  $("#btnNovoLead").addEventListener("click", () => abrirCard(null));

  // ficha do card: lead (funil de leads) ou cliente
  function abrirCard(p) {
    const novo = !p;
    if (p && ehCliente(p)) { abrirGavetaCRM(p); return; }
    p = p || { id: novoId(), status: "lead", etapa: "novo", entradaEm: new Date().toISOString(), origem: "Anúncio Meta", unidade: COM.unidade || "", crc: eu() || "", toques: {} };
    const sel = (id, ops, atual) => `<select class="in" id="${id}">${ops.map((o) => `<option${o === atual ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    const trat = tratDoPaciente(p) === "Não informado" ? "" : tratDoPaciente(p);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${novo ? "Novo lead" : esc(p.nome)}">
      <div class="row"><div class="ava">${esc(iniciais(p.nome || "+"))}</div><div class="grow"><h2 style="font-size:22px">${novo ? "Novo lead" : esc(p.nome)}</h2><div class="small dim">${novo ? "Funil de leads" : `${ETAPA[etapaDe(p)].nome} · entrou ${fmtData(entrouEm(p))}${p.faltas ? ` · faltou ${p.faltas}x` : ""}`}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      ${novo ? "" : decisorResumo(p)}
      <div class="card stack">
        <div><label class="f" for="lNome">Nome</label><input class="in" id="lNome" value="${esc(p.nome || "")}"></div>
        <div class="duo"><div><label class="f" for="lTel">WhatsApp</label><input class="in" id="lTel" inputmode="tel" value="${esc(p.telefone || "")}"></div>
          <div><label class="f" for="lEmail">E-mail</label><input class="in" id="lEmail" type="email" inputmode="email" value="${esc(p.email || "")}"></div></div>
        <div><label class="f" for="lUni">Unidade</label>${sel("lUni", ["", "Caruaru", "Recife"], p.unidade || "")}</div>
        ${camposContatoHTML(p, "l")}
        <div class="duo"><div><label class="f" for="lTrat">Tratamento de interesse</label>${sel("lTrat", [""].concat(TRAT.map((t) => t.nome)), trat)}</div>
          <div><label class="f" for="lOrig">Origem</label>${sel("lOrig", ["Anúncio Meta", "Instagram orgânico", "Indicação", "Google", "WhatsApp (Kommo)", "WhatsApp (celular)", "Passou na frente", "Outro"].concat(p.origem && !["Anúncio Meta", "Instagram orgânico", "Indicação", "Google", "WhatsApp (Kommo)", "WhatsApp (celular)", "Passou na frente", "Outro"].includes(p.origem) ? [p.origem] : []), p.origem || "")}</div></div>
        <div class="duo"><div><label class="f" for="lEtapa">Etapa</label>${sel("lEtapa", ETAPAS.filter((e) => e.grupo === "lead").map((e) => e.nome), ETAPA[etapaDe(p)].nome)}</div>
          <div><label class="f" for="lAgenda">Data agendada</label><input class="in" type="date" id="lAgenda" value="${p.agendaPara ? String(p.agendaPara).slice(0, 10) : ""}"></div></div>
        <div><label class="f" for="lObs">Observações</label><input class="in" id="lObs" value="${esc(p.obs || "")}"></div>
        <div class="row"><button class="btn pri" id="lSalvar">${novo ? "Adicionar lead" : "Salvar"}</button><span class="small dim" id="lSt"></span></div>
      </div>
      ${novo ? "" : `<div class="card stack"><span class="label">Avançar no funil</span>
        <div class="row"><button class="btn pri" data-mv="orcamento">✓ Compareceu (vira cliente)</button><button class="btn" data-mv="agendado">Agendou</button><button class="btn" data-mv="faltou">Faltou</button></div>
        <p class="small dim" style="margin:0">Quando o lead comparece na clínica ele passa para o funil de clientes e entra no follow-up do orçamento (D0).</p></div>
        <div class="row">${p.leadId && pode("whatsapp") ? `<button class="btn" id="lConversa">Ver conversa no WhatsApp</button>` : ""}<span class="grow"></span>${pode("apagar") ? `<button class="btn ghost" id="lApagar">Apagar lead</button>` : ""}</div>`}
    </div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    ligarContato(p, "l");
    const ler = () => {
      p.nome = $("#lNome").value.trim(); p.telefone = $("#lTel").value.trim(); p.email = $("#lEmail").value.trim(); lerContato(p, "l"); p.unidade = $("#lUni").value; p.origem = $("#lOrig").value; p.obs = $("#lObs").value.trim();
      const t = $("#lTrat").value; p.interesse = t; p.tratamento = t;
      const ag = $("#lAgenda").value; p.agendaPara = ag ? new Date(ag + "T12:00:00").toISOString() : undefined;
      const et = ETAPAS.find((e) => e.nome === $("#lEtapa").value);
      return et ? et.id : "novo";
    };
    $("#lSalvar").onclick = async () => {
      const et = ler(); if (!p.nome) { $("#lSt").textContent = "Informe o nome."; return; }
      if (et !== etapaDe(p) || novo) { if (novo) { p.etapa = et; if (et === "agendado") p.agendadoEm = new Date().toISOString(); await Store.salvar(p); } else await mover(p, et); }
      else await Store.salvar(p);
      if (p.agendaPara && !p.agendadoEm) { p.agendadoEm = new Date().toISOString(); if (p.etapa === "novo" || p.etapa === "contato") p.etapa = "agendado"; await Store.salvar(p); }
      toast(novo ? "Lead adicionado ao CRM" : "Lead salvo"); fecharGaveta(); render();
    };
    $$("#drawerHost [data-mv]").forEach((b) => (b.onclick = async () => { ler(); if (!p.nome) return; fecharGaveta(); await mover(p, b.dataset.mv); }));
    if ($("#lApagar")) $("#lApagar").onclick = async (e) => { if (e.currentTarget.dataset.c !== "1") { e.currentTarget.dataset.c = "1"; e.currentTarget.textContent = "Toque de novo para apagar"; return; } await Store.remover(p.id); fecharGaveta(); render(); toast("Lead apagado"); };
    if ($("#lConversa")) $("#lConversa").onclick = () => { fecharGaveta(); mostrar("whatsapp"); abrirConversa(String(p.leadId)); };
    if (novo) setTimeout(() => { const n = $("#lNome"); if (n) n.focus(); }, 50);
  }
  // cliente: a ficha de follow-up + troca de etapa no funil de clientes
  function abrirGavetaCRM(p) {
    abrirGaveta(p);
    const d = $("#drawerHost .drawer"); if (!d) return;
    d.insertAdjacentHTML("beforeend", `<div class="card stack"><span class="label">Etapa no CRM</span><div class="row">${ETAPAS.filter((e) => e.grupo === "cliente").map((e) => `<button class="btn${etapaDe(p) === e.id ? " pri" : ""}" data-mvc="${e.id}">${e.nome}</button>`).join("")}<button class="btn ghost" data-mvc="agendado" title="Desfazer o comparecimento">Voltar para lead</button></div></div>`);
    $$("#drawerHost [data-mvc]").forEach((b) => (b.onclick = async () => { fecharGaveta(); await mover(p, b.dataset.mvc); }));
  }

  /* ------------------------------------------------------------ */
  /* Campanhas: calculadora da pirâmide e cadência                  */
  /* ------------------------------------------------------------ */
  const PRESETS = { equilibrado: [50, 30, 20], captacao: [60, 25, 15], conversao: [40, 30, 30], lancamento: [70, 20, 10] };
  const PRESET_NOME = { equilibrado: "Equilibrado 50/30/20", captacao: "Mais captação 60/25/15", conversao: "Mais conversão 40/30/30", lancamento: "Novo público 70/20/10" };
  const FASES = [
    { k: "topo", nome: "Topo · Atração", obj: "Alcance e visualização de vídeo", pub: "Público frio da região (Caruaru / Recife), por idade e interesses",
      cad: "4 a 5 conteúdos por semana: Reels curtos e educativos (como funciona o Invisalign, o check-up digital com iTero, mitos do aparelho)." },
    { k: "meio", nome: "Meio · Consideração", obj: "Engajamento, visitas ao perfil e mensagens", pub: "Quem assistiu 50% dos vídeos, engajou ou visitou o perfil nos últimos 30 dias",
      cad: "3 conteúdos por semana: bastidores do escaneamento, depoimentos autorizados, perguntas frequentes, apresentação da equipe." },
    { k: "fundo", nome: "Fundo · Conversão", obj: "Conversas no WhatsApp e agendamento", pub: "Quem engajou ou mandou mensagem nos últimos 7 a 30 dias e ainda não agendou",
      cad: "Sempre ativo: convite para o check-up digital, condição vigente (só se for real) e lembrete de agenda. O CRC responde em até 5 minutos." }
  ];
  const CALC0 = { invest: 3000, dias: 30, preset: "equilibrado", dist: [50, 30, 20], cpl: 25, agend: 35, comp: 70, fech: 35, ticket: 8000, meta: 10 };
  let CALC = Object.assign({}, CALC0, ls.get("alinha.calc", {}));
  const num = (v) => { const s = String(v).replace(/[^\d,.-]/g, ""); return Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s) || 0; };
  function taxasReais() {
    // últimos 3 meses, para ter volume
    const meses = [0, 1, 2].map((k) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k); return d.toISOString().slice(0, 7); });
    const s = { entraram: 0, agendaram: 0, compareceram: 0, fecharam: 0 };
    meses.forEach((m) => { const { c } = numerosComercial(m, COM.unidade); Object.keys(s).forEach((k) => (s[k] += c[k])); });
    const fech = PAC.filter((p) => p.status === "fechado" && Number(p.valorFechado) > 0);
    return { n: s.entraram, agend: pct(s.agendaram, s.entraram), comp: pct(s.compareceram, s.agendaram), fech: pct(s.fecharam, s.compareceram), ticket: fech.length ? Math.round(fech.reduce((t, p) => t + Number(p.valorFechado), 0) / fech.length) : 0 };
  }
  function renderCampanhas() {
    const r0 = taxasReais(), usaCRM = CALC.autoCRM !== false && r0.n >= 5;
    const C = usaCRM ? Object.assign({}, CALC, { agend: r0.agend || CALC.agend, comp: r0.comp || CALC.comp, fech: r0.fech || CALC.fech, ticket: r0.ticket || CALC.ticket }) : CALC;
    ["agend", "comp", "fech", "ticket"].forEach((k) => { const el = $("#k_" + k); if (el) { el.disabled = usaCRM; el.title = usaCRM ? "Vem do CRM automaticamente" : ""; } });
    if ($("#kAutoCRM")) { $("#kAutoCRM").checked = CALC.autoCRM !== false; $("#kAutoInfo").textContent = usaCRM ? `Usando o CRM: ${r0.n} leads dos últimos 3 meses` : r0.n >= 5 ? "Taxas digitadas à mão" : `Poucos dados no CRM (${r0.n} leads): usando as taxas digitadas`; }
    ["invest", "dias", "cpl", "agend", "comp", "fech", "ticket", "meta"].forEach((k) => { const el = $("#k_" + k); if (el && document.activeElement !== el) el.value = C[k]; });
    $$("#kPreset button").forEach((b) => b.classList.toggle("on", b.dataset.pr === C.preset));
    ["topo", "meio", "fundo"].forEach((k, i) => { const el = $("#k_" + k); if (el && document.activeElement !== el) el.value = C.dist[i]; });
    const soma = C.dist.reduce((a, b) => a + b, 0) || 1;
    const dist = C.dist.map((v) => v / soma);
    const dias = Math.max(1, C.dias), semanas = Math.max(1, Math.ceil(dias / 7));
    $("#kSoma").textContent = soma === 100 ? "" : `As fases somam ${soma}%: o cálculo usa a proporção entre elas.`;
    const val = dist.map((d) => C.invest * d);
    // pirâmide (invertida: topo largo → fundo estreito), com o percentual editável em cada camada
    if (!$("#kPiramide .camada")) $("#kPiramide").innerHTML = FASES.map((f, i) => `<div class="camada c${i}" style="--w:${100 - i * 22}%"><div class="forma"><label class="pyval"><input class="pyin num" data-fase="${i}" inputmode="numeric" aria-label="Percentual da fase ${esc(f.nome)}"><span>%</span></label></div>
      <input type="range" class="pyrange" min="0" max="100" step="1" data-fase="${i}" aria-label="Ajustar ${esc(f.nome)}">
      <div class="info"><strong>${esc(f.nome)}</strong><span class="num" data-pyinfo="${i}"></span></div></div>`).join("");
    FASES.forEach((f, i) => {
      const inp = $(`#kPiramide .pyin[data-fase="${i}"]`), rg = $(`#kPiramide .pyrange[data-fase="${i}"]`);
      if (document.activeElement !== inp) inp.value = C.dist[i];
      if (document.activeElement !== rg) rg.value = C.dist[i];
      $(`#kPiramide [data-pyinfo="${i}"]`).textContent = `${brl(val[i])} · ${brl(val[i] / dias)}/dia · ${brl(val[i] / semanas)}/semana`;
      inp.closest(".forma").dataset.dica = `${f.nome}: ${Math.round(dist[i] * 100)}% · ${brl(val[i])} no período · ${brl(val[i] / dias)} por dia`;
    });
    $("#kAuto").checked = C.auto !== false;
    const mb = $('#kPreset [data-pr="minha"]');
    if (C.minha) { const txt = `Minha divisão ${C.minha.join("/")}`; if (!mb) $("#kPreset").insertAdjacentHTML("beforeend", `<button data-pr="minha">${txt}</button>`); else mb.textContent = txt; $$("#kPreset button").forEach((b) => b.classList.toggle("on", b.dataset.pr === C.preset)); }
    // cadência por fase
    $("#kCadencia").innerHTML = `<thead><tr><th>Fase</th><th>Objetivo</th><th>Público</th><th>Cadência de conteúdo</th><th class="n">Por dia</th><th class="n">Conjuntos</th></tr></thead><tbody>${FASES.map((f, i) => {
      const dia = val[i] / dias, conj = Math.max(1, Math.min(3, Math.floor(dia / 20)));
      return `<tr><td><b>${esc(f.nome)}</b></td><td>${esc(f.obj)}</td><td>${esc(f.pub)}</td><td>${esc(f.cad)}</td><td class="n">${brl(dia)}${dia < 10 ? `<br><span class="small" style="color:var(--warn)">baixo</span>` : ""}</td><td class="n">${conj}</td></tr>`; }).join("")}</tbody>`;
    // cadência semanal do investimento
    let resto = dias;
    $("#kSemanas").innerHTML = `<thead><tr><th>Semana</th><th class="n">Dias</th>${FASES.map((f) => `<th class="n">${esc(f.nome.split(" · ")[0])}</th>`).join("")}<th class="n">Total</th><th>O que fazer</th></tr></thead><tbody>${Array.from({ length: semanas }, (_, s) => {
      const d = Math.min(7, resto); resto -= d; const v = val.map((x) => (x / dias) * d);
      const acao = s === 0 ? "Fase de aprendizado: suba os anúncios e não altere por 7 dias." : s === 1 ? "Pause os anúncios com custo por conversa muito acima da média; duplique os melhores." : s === semanas - 1 ? "Feche o mês: compare leads, comparecimentos e fechamentos no Comercial e ajuste a divisão." : "Renove os criativos do topo; reforce o remarketing no fundo.";
      return `<tr><td>${s + 1}</td><td class="n">${d}</td>${v.map((x) => `<td class="n">${brl(x)}</td>`).join("")}<td class="n"><b>${brl(v.reduce((a, b) => a + b, 0))}</b></td><td class="small">${acao}</td></tr>`; }).join("")}</tbody>`;
    // projeção
    const leads = C.cpl ? C.invest / C.cpl : 0, ag = leads * C.agend / 100, cp = ag * C.comp / 100, fe = cp * C.fech / 100, fat = fe * C.ticket;
    kpis("#kProj", [
      ["Leads previstos", Math.round(leads), `custo por lead ${brl(C.cpl)}`],
      ["Agendamentos", Math.round(ag), `${C.agend}% dos leads`],
      ["Comparecimentos", Math.round(cp), `${C.comp}% dos agendados · custo ${cp ? brl(C.invest / cp) : "—"} cada`],
      ["Fechamentos", fe.toFixed(1).replace(".", ","), `${C.fech}% de quem comparece · custo ${fe ? brl(C.invest / fe) : "—"}`]
    ]);
    kpis("#kRet", [
      ["Faturamento previsto", brl(fat), `ticket médio ${brl(C.ticket)}`, true],
      ["Retorno sobre o investimento", C.invest ? (fat / C.invest).toFixed(1).replace(".", ",") + "x" : "—", "faturamento ÷ investimento"],
      ["Para a meta de " + C.meta + " fechamentos", brl(C.agend && C.comp && C.fech ? (C.meta / (C.agend / 100 * C.comp / 100 * C.fech / 100)) * C.cpl : 0), "investimento estimado no período"],
      ["Leads necessários para a meta", Math.ceil(C.agend && C.comp && C.fech ? C.meta / (C.agend / 100 * C.comp / 100 * C.fech / 100) : 0), "com as taxas acima"]
    ]);
    rotularTabela($("#kCadencia")); rotularTabela($("#kSemanas"));
    renderCampReal();
    const r = taxasReais();
    $("#kReais").innerHTML = r.n >= 5 ? `Números reais (últimos 3 meses, ${r.n} leads): agendamento ${r.agend}%, comparecimento ${r.comp}%, fechamento ${r.fech}%${r.ticket ? `, ticket ${brl(r.ticket)}` : ""}. <button class="btn sm" id="kUsarReais">Usar estes números</button>` : "Ainda há poucos leads registrados no Comercial: use estimativas. Com mais dados, o Alinha sugere as taxas reais da clínica.";
    const b = $("#kUsarReais"); if (b) b.onclick = () => { Object.assign(CALC, { agend: r.agend || CALC.agend, comp: r.comp || CALC.comp, fech: r.fech || CALC.fech, ticket: r.ticket || CALC.ticket }); ls.set("alinha.calc", CALC); renderCampanhas(); toast("Taxas reais aplicadas"); };
  }
  // muda uma fase; com "somar 100%" ligado, as outras se ajustam mantendo a proporção entre elas
  function definirFase(i, v) {
    v = Math.round(Math.max(0, Math.min(100, v)));
    const d = CALC.dist.slice(); d[i] = v;
    if (CALC.auto !== false) {
      const outras = [0, 1, 2].filter((j) => j !== i), resto = 100 - v, base = outras.reduce((t, j) => t + CALC.dist[j], 0);
      // arredonda pelos maiores restos (ex.: 30 dividido 3:2 → 18 e 12)
      const exato = Object.fromEntries(outras.map((j) => [j, base ? (CALC.dist[j] / base) * resto : resto / 2]));
      outras.forEach((j) => { d[j] = Math.floor(exato[j]); });
      let falta = 100 - d.reduce((a, b) => a + b, 0);
      outras.slice().sort((a, b) => (exato[b] - d[b]) - (exato[a] - d[a])).forEach((j) => { if (falta > 0) { d[j]++; falta--; } });
    }
    CALC.dist = d;
    CALC.preset = (Object.entries(PRESETS).find(([, pr]) => pr.join() === d.join()) || [""])[0] || (CALC.minha && CALC.minha.join() === d.join() ? "minha" : "");
  }
  $("#v-campanhas").addEventListener("input", (e) => {
    if (e.target.dataset.fase != null) { definirFase(Number(e.target.dataset.fase), num(e.target.value)); ls.set("alinha.calc", CALC); renderCampanhas(); return; }
    const id = e.target.id || ""; if (!id.startsWith("k_")) return;
    const k = id.slice(2), v = num(e.target.value);
    if (["topo", "meio", "fundo"].includes(k)) definirFase(["topo", "meio", "fundo"].indexOf(k), v);
    else CALC[k] = Math.max(0, v);
    ls.set("alinha.calc", CALC); renderCampanhas();
  });
  $("#kPreset").addEventListener("click", (e) => { const b = e.target.closest("[data-pr]"); if (!b) return; CALC.preset = b.dataset.pr; CALC.dist = (b.dataset.pr === "minha" ? CALC.minha : PRESETS[b.dataset.pr]).slice(); ls.set("alinha.calc", CALC); renderCampanhas(); });
  $("#kAuto").addEventListener("change", (e) => { CALC.auto = e.target.checked; if (CALC.auto) definirFase(0, CALC.dist[0]); ls.set("alinha.calc", CALC); renderCampanhas(); });
  $("#kSalvarDiv").addEventListener("click", () => { CALC.minha = CALC.dist.slice(); CALC.preset = "minha"; ls.set("alinha.calc", CALC); renderCampanhas(); toast(`Divisão ${CALC.minha.join("/")} salva`); });
  $("#kReset").addEventListener("click", () => { const minha = CALC.minha; CALC = JSON.parse(JSON.stringify(CALC0)); if (minha) CALC.minha = minha; ls.set("alinha.calc", CALC); renderCampanhas(); });

  /* ------------------------------------------------------------ */
  /* Abas, paginação e resultado do mês (sem barras de rolagem)    */
  /* ------------------------------------------------------------ */
  const ABAS = ls.get("alinha.abas", {});
  function abrirAba(grupo, aba) {
    const todos = $$(`.abas[data-grupo="${grupo}"] button`);
    const vis = todos.filter((b) => getComputedStyle(b).display !== "none");
    if (!vis.some((b) => b.dataset.aba === aba)) aba = vis[0] && vis[0].dataset.aba;
    todos.forEach((b) => { const on = b.dataset.aba === aba; b.classList.toggle("on", on); b.setAttribute("role", "tab"); b.setAttribute("aria-selected", on ? "true" : "false"); });
    $$(`.painel[data-grupo="${grupo}"]`).forEach((pn) => pn.classList.toggle("on", pn.dataset.aba === aba));
    ABAS[grupo] = aba; ls.set("alinha.abas", ABAS);
  }
  function iniciarAbas() { $$(".abas[data-grupo]").forEach((a) => abrirAba(a.dataset.grupo, ABAS[a.dataset.grupo])); }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".abas button"); if (!b) return;
    const g = b.closest(".abas").dataset.grupo; abrirAba(g, b.dataset.aba); window.scrollTo({ top: 0 });
    if (g === "camp") renderCampanhas(); if (g === "res") renderResultados(); if (g === "aj") { renderAjustes(); if (["api", "kommo"].includes(b.dataset.aba)) carregarIntegracoes(); if (b.dataset.aba === "seg") renderSeguranca(); } if (g === "com") renderComercial(); if (g === "crm") renderPipeline();
  });
  // tabela vira cartão no celular: cada célula leva o nome da coluna
  function rotularTabela(t) {
    if (!t) return; const th = $$("thead th", t).map((x) => x.textContent.trim());
    $$("tbody tr", t).forEach((tr) => [...tr.children].forEach((td, i) => td.setAttribute("data-label", th[i] || "")));
  }
  // Hoje: os cartões viram páginas que cabem na tela
  let filaPg = 0;
  function paginarFila() {
    const f = $("#fila"), pg = $("#filaPager"), cards = $$("#fila .msgcard");
    cards.forEach((c) => c.classList.remove("fora"));
    if (vista !== "hoje" || cards.length < 2) { pg.classList.add("hide"); return; }
    const cols = Math.max(1, getComputedStyle(f).gridTemplateColumns.split(" ").filter(Boolean).length);
    const topo = f.getBoundingClientRect().top + window.scrollY;
    const disp = window.innerHeight - topo - 64 - (window.innerWidth <= 860 ? 84 : 12);
    const alt = Math.max(...cards.slice(0, cols).map((c) => c.offsetHeight)) + 14;
    const por = cols * Math.max(1, Math.floor(disp / alt));
    const paginas = Math.ceil(cards.length / por);
    if (paginas <= 1) { pg.classList.add("hide"); return; }
    filaPg = Math.max(0, Math.min(filaPg, paginas - 1));
    cards.forEach((c, i) => c.classList.toggle("fora", Math.floor(i / por) !== filaPg));
    pg.classList.remove("hide");
    $("#filaPg").textContent = `${filaPg + 1} de ${paginas} · ${cards.length} paciente${cards.length > 1 ? "s" : ""}`;
    $('#filaPager [data-pg="-1"]').disabled = filaPg === 0; $('#filaPager [data-pg="1"]').disabled = filaPg >= paginas - 1;
  }
  $("#filaPager").addEventListener("click", (e) => { const b = e.target.closest("[data-pg]"); if (!b) return; filaPg += Number(b.dataset.pg); paginarFila(); window.scrollTo({ top: 0 }); });
  let tRes = null;
  window.addEventListener("resize", () => { clearTimeout(tRes); tRes = setTimeout(() => { if (vista === "hoje") paginarFila(); if (vista === "tratamentos") paginarTrab(); }, 150); });

  // Campanhas › Resultado do mês: o que os leads do mês viraram
  const CM = { mes: new Date().toISOString().slice(0, 7), unidade: "" };
  function renderCampReal() {
    if (!$("#cmMes")) return;
    if (!$("#cmMes").value) $("#cmMes").value = CM.mes;
    $$("#cmUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === CM.unidade));
    const { c } = numerosComercial(CM.mes, CM.unidade);
    CALC.real = CALC.real || {};
    const inv = CALC.real[CM.mes] != null ? CALC.real[CM.mes] : CALC.invest;
    if (document.activeElement !== $("#cmInvest")) $("#cmInvest").value = inv;
    const dos = (n) => `${pct(n, c.entraram)}% dos leads`;
    kpisClic("#cmKpis", [
      ["Leads que entraram", c.entraram, "total do mês", true, "entraram"],
      ["Compareceram", c.compareceram, `${dos(c.compareceram)} · viraram clientes`, false, "compareceram"],
      ["Fecharam", c.fecharam, `${dos(c.fecharam)} · ${pct(c.fecharam, c.compareceram)}% de quem compareceu`, false, "fecharam"],
      ["Faltaram à consulta", c.faltaram, `${dos(c.faltaram)} · ${pct(c.faltaram, c.agendaram)}% dos agendados`, false, "faltaram"]
    ]);
    kpisClic("#cmKpis2", [
      ["Não fecharam", c.naoFecharam, `${dos(c.naoFecharam)} · ${pct(c.naoFecharam, c.compareceram)}% de quem compareceu`, false, "naoFecharam"],
      ["Follow-up de orçamento", c.emFollowup, `${dos(c.emFollowup)} · ${brl(c.valorFollowup)} em negociação`, false, "emFollowup"],
      ["Custo por lead", c.entraram ? brl(inv / c.entraram) : "—", `investido ${brl(inv)} no mês`],
      ["Custo por fechamento", c.fecharam ? brl(inv / c.fecharam) : "—", c.valorFechado ? `${brl(c.valorFechado)} fechados · retorno ${inv ? (c.valorFechado / inv).toFixed(1).replace(".", ",") + "x" : "—"}` : "sem fechamentos ainda"]
    ]);
    const nomeMes = new Date(CM.mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    $("#cmTitulo").textContent = `Leads de ${nomeMes}`;
    const linhas = [["Entraram", c.entraram], ["Agendaram", c.agendaram], ["Compareceram", c.compareceram], ["Fecharam", c.fecharam], ["Faltaram", c.faltaram], ["Não fecharam", c.naoFecharam], ["Follow-up", c.emFollowup], ["No Funil Lead", c.aguardando], ["Leads perdidos", c.perdidos]];
    const mx = Math.max(1, c.entraram);
    $("#cmFunil").innerHTML = linhas.map(([n, v]) => `<div class="fl"><div class="nome">${n}</div><div class="trilho"><b style="width:${Math.max(v ? 2 : 0, (v / mx) * 100)}%" data-dica="${esc(`${n}: ${v} de ${c.entraram} leads (${pct(v, c.entraram)}%)`)}"></b></div><div class="val"><strong class="num">${v}</strong><span>${pct(v, c.entraram)}%</span></div></div>`).join("");
    // previsto (com as taxas da projeção e o investido no mês) x realizado
    const lp = CALC.cpl ? inv / CALC.cpl : 0, ap = lp * CALC.agend / 100, cp = ap * CALC.comp / 100, fp = cp * CALC.fech / 100;
    const MT = AJ.metas || {};
    const fmt = (v, moeda) => (v == null ? "—" : moeda ? brl(v) : Math.round(v));
    const linha = (n, prev, real, meta, moeda) => `<tr><td>${n}</td><td class="n">${fmt(prev, moeda)}</td><td class="n">${fmt(meta, moeda)}</td><td class="n"><b>${fmt(real, moeda)}</b></td><td class="n">${meta ? Math.round((real / meta) * 100) + "% da meta" : prev ? Math.round((real / prev) * 100) + "% do previsto" : "—"}</td></tr>`;
    $("#cmComp").innerHTML = `<thead><tr><th>Etapa</th><th class="n">Previsto</th><th class="n">Meta</th><th class="n">Realizado</th><th class="n">Atingido</th></tr></thead><tbody>
      ${linha("Leads", lp, c.entraram, MT.leads)}${linha("Agendamentos", ap, c.agendaram, null)}${linha("Comparecimentos", cp, c.compareceram, MT.comparecimentos)}${linha("Fechamentos", fp, c.fecharam, MT.fechamentos)}${linha("Faturamento", fp * CALC.ticket, c.valorFechado, MT.faturamento, true)}</tbody>`;
    rotularTabela($("#cmComp"));
  }
  $("#v-campanhas").addEventListener("click", (e) => { const b = e.target.closest("[data-lista]"); if (!b) return; const L = numerosComercial(CM.mes, CM.unidade).listas[b.dataset.lista]; if (L) abrirListaPacientes(NOME_LISTA[b.dataset.lista] || b.dataset.lista, L, new Date(CM.mes + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })); });
  $("#kAutoCRM").addEventListener("change", (e) => { CALC.autoCRM = e.target.checked; ls.set("alinha.calc", CALC); renderCampanhas(); });
  $("#cmMes").addEventListener("change", (e) => { CM.mes = e.target.value || new Date().toISOString().slice(0, 7); renderCampReal(); });
  $("#cmUnidade").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { CM.unidade = b.dataset.u; renderCampReal(); } });
  $("#cmInvest").addEventListener("input", (e) => { CALC.real = CALC.real || {}; CALC.real[CM.mes] = Math.max(0, num(e.target.value)); ls.set("alinha.calc", CALC); renderCampReal(); });

  /* ------------------------------------------------------------ */
  /* Tratamentos: linha do tempo (fases cadastráveis) e laboratório  */
  /* ------------------------------------------------------------ */
  // papéis especiais que uma fase pode ter
  const PAPEIS = { "": "Fase simples", aprovacao: "Aprovação do orçamento (registra o fechamento)", moldagem: "Escaneamento ou moldagem (pergunta como foi feito)", lab_envio: "Envio ao laboratório (pede a data de entrega)", lab_recebido: "Recebido do laboratório", agendamento: "Agendamento (pede dia e horário)" };
  const Fz = (id, nome, papel) => ({ id, nome, papel: papel || "" });
  const protese = (final) => [Fz("orcamento", "Orçamento"), Fz("aprovado", "Orçamento aprovado", "aprovacao"), Fz("preparo", "Preparo do dente"), Fz("moldagem", "Escaneamento ou moldagem", "moldagem"),
    Fz("enviado", "Enviado ao laboratório", "lab_envio"), Fz("recebido", "Recebido do laboratório", "lab_recebido"), Fz("agendado", "Colocação agendada", "agendamento"), Fz("instalado", final), Fz("finalizado", "Finalizado")];
  const PROC_PADRAO = {
    "Coroa em porcelana": protese("Coroa cimentada"),
    "Prótese sobre implante": protese("Prótese instalada"),
    "Coroa sobre implante": protese("Coroa instalada"),
    "Invisalign": [Fz("consulta", "Consulta"), Fz("orcamento", "Orçamento"), Fz("pagamento", "Pagamento aprovado", "aprovacao"), Fz("escaneamento", "Escaneamento", "moldagem"), Fz("fotografias", "Fotografias"), Fz("radiografias", "Radiografias"),
      Fz("clincheck_mod", "ClinCheck em modificação"), Fz("clincheck_ok", "ClinCheck aprovado", "lab_envio"), Fz("alinhadores", "Alinhadores na clínica", "lab_recebido"), Fz("agendado", "Paciente agendado", "agendamento"), Fz("instalacao", "Concluída instalação"), Fz("finalizado", "Finalizado")],
    "Aparelho fixo": [Fz("orcamento", "Orçamento"), Fz("aprovado", "Orçamento aprovado", "aprovacao"), Fz("documentacao", "Documentação (exames)"), Fz("agendado", "Instalação agendada", "agendamento"), Fz("instalado", "Aparelho instalado"),
      Fz("manutencao", "Manutenções"), Fz("remocao", "Remoção do aparelho"), Fz("contencao", "Contenção"), Fz("finalizado", "Finalizado")],
    "Outro procedimento": [Fz("orcamento", "Orçamento"), Fz("aprovado", "Orçamento aprovado", "aprovacao"), Fz("agendado", "Consulta agendada", "agendamento"), Fz("execucao", "Procedimento realizado"), Fz("finalizado", "Finalizado")]
  };
  const clonar = (x) => JSON.parse(JSON.stringify(x));
  const procedimentos = () => clonar(AJ.procedimentos && Object.keys(AJ.procedimentos).length ? AJ.procedimentos : PROC_PADRAO);
  const fasesModelo = (tipo) => { const P = procedimentos(); return clonar(P[tipo] || P["Outro procedimento"] || PROC_PADRAO["Outro procedimento"]); };
  const fasesDe = (t) => (t.fases && t.fases.length ? t.fases : fasesModelo(t.tipo));
  const feita = (t, f) => !!(t.etapas || {})[f.id];
  const temLab = (t) => fasesDe(t).some((f) => f.papel === "lab_envio");
  function posicao(t) { let k = -1; fasesDe(t).forEach((f, i) => { if (feita(t, f)) k = i; }); return k; } // última fase marcada
  const proxima = (t) => fasesDe(t).find((f) => !feita(t, f)) || null; // primeira fase ainda não marcada
  const concluido = (t) => { const F = fasesDe(t); return !!F.length && feita(t, F[F.length - 1]); };
  const hojeISO = () => new Date().toISOString().slice(0, 10);
  const diasAte = (iso) => Math.round((inicioDia(iso) - hoje0()) / DIA);
  const dataBR = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "");
  const horaBR = (iso) => (iso && String(iso).length > 10 ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");
  const slug = (s) => norm(s).replace(/\s+/g, "_").slice(0, 24) || "fase";
  const nomeTrab = (t) => `${t.tipo}${t.dente ? " (dente " + t.dente + ")" : ""}`;
  // prontuário do paciente: cada marcação e desmarcação fica registrada com a data
  function prontuario(p, texto, data) {
    p.prontuario = [{ em: new Date().toISOString(), data: data || null, texto, por: eu() || (PLAT ? (PAPEL_NOME[papel()] || "") : "") }].concat(p.prontuario || []).slice(0, 400);
  }
  // situação do trabalho de laboratório (pela última fase marcada)
  function situacaoLab(t) {
    const F = fasesDe(t), pos = posicao(t), atual = F[pos]; if (!atual || concluido(t)) return null;
    if (atual.papel === "lab_envio" && t.lab && t.lab.entrega) { const d = diasAte(t.lab.entrega); return { fase: "lab", d, cls: d < 0 ? "late" : d === 0 ? "today" : "ok", txt: d < 0 ? `atrasado ${-d} dia${d < -1 ? "s" : ""}` : d === 0 ? "entrega hoje" : `entrega em ${d} dia${d > 1 ? "s" : ""}` }; }
    if (atual.papel === "lab_recebido") return { fase: "agendar", cls: "today", txt: "chegou · agendar a consulta" };
    if (atual.papel === "agendamento" && t.consulta) { const d = diasAte(t.consulta); return { fase: "agendado", d, cls: d < 0 ? "late" : d === 0 ? "today" : "ok", txt: d === 0 ? `consulta hoje ${horaBR(t.consulta)}` : d < 0 ? `consulta era ${dataBR(t.consulta)} · confirmar` : `consulta ${dataBR(t.consulta)} ${horaBR(t.consulta)}` }; }
    return null;
  }
  const todosTrabalhos = () => PAC.flatMap((p) => (p.trabalhos || []).map((t) => ({ p, t })));
  function resumoLab() {
    const r = { atrasados: 0, hoje: 0, agendar: 0, colocacaoHoje: 0, total: 0 };
    todosTrabalhos().forEach(({ t }) => { if (!temLab(t)) return; const s = situacaoLab(t); if (!s) return; r.total++; if (s.fase === "lab" && s.d < 0) r.atrasados++; if (s.fase === "lab" && s.d === 0) r.hoje++; if (s.fase === "agendar") r.agendar++; if (s.fase === "agendado" && s.d === 0) r.colocacaoHoje++; });
    return r;
  }
  function renderAvisosLab() {
    const el = $("#avisosLab"); if (!el) return;
    const it = [];
    if (pode("tratamentos")) {
      const r = resumoLab();
      if (r.atrasados) it.push(`<button class="bad" data-irlab="1" title="Trabalhos atrasados no laboratório">🧪 ${r.atrasados} atrasado${r.atrasados > 1 ? "s" : ""} no lab</button>`);
      if (r.hoje) it.push(`<button class="warn" data-irlab="1" title="Trabalhos que chegam hoje do laboratório">📦 ${r.hoje} chega${r.hoje > 1 ? "m" : ""} hoje</button>`);
      if (r.agendar) it.push(`<button class="warn" data-irlab="1">📅 ${r.agendar} para agendar</button>`);
      if (r.colocacaoHoje) it.push(`<button data-irlab="1">🦷 ${r.colocacaoHoje} consulta${r.colocacaoHoje > 1 ? "s" : ""} hoje</button>`);
      const n = r.atrasados + r.hoje + r.agendar; const c = $("#labCont"); if (c) { c.textContent = n || ""; c.className = "pill" + (r.atrasados ? " bad" : n ? " warn" : ""); c.classList.toggle("hide", !n); }
    }
    if (pode("crm")) { const ac = altaChance().length; if (ac) it.push(`<button class="bad" data-iralerta="1" title="Pacientes com alta probabilidade de fechamento">🔥 ${ac} alta chance</button>`); }
    const lb = lembretesVencidos().length; if (lb) it.push(`<button class="warn" data-irlemb="1" title="Lembretes para hoje">🔔 ${lb} lembrete${lb > 1 ? "s" : ""} hoje</button>`);
    el.innerHTML = it.join(""); el.classList.toggle("hide", !it.length);
  }
  $("#avisosLab").addEventListener("click", (e) => {
    if (e.target.closest("[data-irlab]")) { mostrar("tratamentos"); abrirAba("trat", "lab"); renderTratamentos(); }
    if (e.target.closest("[data-irlemb]")) abrirLembretesDoDia();
    if (e.target.closest("[data-iralerta]")) abrirAlerta();
  });

  const TR = { busca: "", unidade: "", pg: 0 };
  const filtraTR = ({ p }) => (!TR.unidade || p.unidade === TR.unidade) && (!TR.busca || norm(p.nome).includes(norm(TR.busca)));
  // bolinhas da linha do tempo: passar o mouse mostra a data; clicar marca ou desmarca
  function bolinhas(t) {
    const F = fasesDe(t), prox = proxima(t);
    return F.map((f, i) => { const r = (t.etapas || {})[f.id];
      return `${i ? `<i class="${r && feita(t, F[i - 1]) ? "ok" : ""}"></i>` : ""}<button class="fz${r ? " ok" : ""}${prox && prox.id === f.id ? " atual" : ""}" data-fase="${esc(f.id)}" aria-label="${esc(f.nome)}: ${r ? "marcada em " + dataBR(r.em) : "pendente"}" data-dica="${esc(`${f.nome} · ${r ? dataBR(r.em) + " (clique para desmarcar)" : "pendente (clique para marcar)"}`)}"></button>`; }).join("");
  }
  function cartaoTrab(p, t) {
    const F = fasesDe(t), pos = posicao(t), atual = F[pos], prox = proxima(t), s = situacaoLab(t);
    return `<div class="card trab" data-trab="${t.id}" data-pid="${p.id}">
      <div class="row"><div class="ava">${esc(iniciais(p.nome))}</div><div class="grow"><h3>${esc(p.nome)}</h3><div class="meta">${esc(t.tipo)}${t.dente ? " · dente " + esc(t.dente) : ""}${t.dr ? " · " + esc(t.dr) : ""}${p.unidade ? " · " + esc(p.unidade) : ""}</div></div></div>
      ${s ? `<div><span class="pill ${s.cls === "late" ? "bad" : s.cls === "today" ? "warn" : "good"}">${esc(s.txt)}</span></div>` : ""}
      <div class="passos" aria-label="Fases: ${F.filter((f) => feita(t, f)).length} de ${F.length} marcadas">${bolinhas(t)}</div>
      <div class="agora">${atual ? `Agora: <b>${esc(atual.nome)}</b> <span class="dim small">· ${dataBR(t.etapas[atual.id].em)}</span>` : "<b>Nenhuma fase marcada</b>"}</div>
      <div class="row">${prox && !concluido(t) ? `<button class="btn pri sm" data-tact="avancar" title="Marcar a próxima fase">Próxima: ${esc(prox.nome)}</button>` : `<span class="pill good">✓ Finalizado</span>`}<button class="btn sm" data-tact="linha">Linha do tempo</button></div>
    </div>`;
  }
  function paginarTrab() {
    const cards = $$("#trabLista .trab"), pg = $("#trabPager");
    cards.forEach((c) => c.classList.remove("fora"));
    if (vista !== "tratamentos" || cards.length < 2) { pg.classList.add("hide"); return; }
    const f = $("#trabLista"), cols = Math.max(1, getComputedStyle(f).gridTemplateColumns.split(" ").filter(Boolean).length);
    const disp = window.innerHeight - (f.getBoundingClientRect().top + window.scrollY) - 64 - (window.innerWidth <= 860 ? 84 : 12);
    const alt = Math.max(...cards.slice(0, cols).map((c) => c.offsetHeight)) + 12, por = cols * Math.max(1, Math.floor(disp / alt)), paginas = Math.ceil(cards.length / por);
    if (paginas <= 1) { pg.classList.add("hide"); return; }
    TR.pg = Math.max(0, Math.min(TR.pg, paginas - 1));
    cards.forEach((c, i) => c.classList.toggle("fora", Math.floor(i / por) !== TR.pg));
    pg.classList.remove("hide"); $("#trabPg").textContent = `${TR.pg + 1} de ${paginas} · ${cards.length} tratamentos`;
    $('#trabPager [data-pg="-1"]').disabled = TR.pg === 0; $('#trabPager [data-pg="1"]').disabled = TR.pg >= paginas - 1;
  }
  $("#trabPager").addEventListener("click", (e) => { const b = e.target.closest("[data-pg]"); if (b) { TR.pg += Number(b.dataset.pg); paginarTrab(); } });
  function renderTratamentos() {
    $$("#tratUnidade button").forEach((b) => b.classList.toggle("on", b.dataset.u === TR.unidade));
    const lista = todosTrabalhos().filter(filtraTR);
    const peso = ({ t }) => { const s = situacaoLab(t); return s ? (s.cls === "late" ? 0 : s.cls === "today" ? 1 : 2) : 3; };
    const and = lista.filter(({ t }) => !concluido(t)).sort((a, b) => peso(a) - peso(b) || ((a.t.criadoEm || "") < (b.t.criadoEm || "") ? 1 : -1));
    $("#trabLista").innerHTML = and.length ? and.map(({ p, t }) => cartaoTrab(p, t)).join("") : `<div class="vazio">Nenhum tratamento em andamento. Toque em <b>+ Novo tratamento</b> para começar a linha do tempo de um paciente.</div>`;
    const fimEm = (t) => { const F = fasesDe(t); return ((t.etapas || {})[F[F.length - 1].id] || {}).em || ""; };
    const fim = lista.filter(({ t }) => concluido(t)).sort((a, b) => (fimEm(a.t) < fimEm(b.t) ? 1 : -1)).slice(0, 12);
    $("#trabFim").innerHTML = fim.length ? fim.map(({ p, t }) => cartaoTrab(p, t)).join("") : `<div class="vazio">Nenhum tratamento finalizado ainda.</div>`;
    const L = lista.filter(({ t }) => temLab(t) && situacaoLab(t));
    const col = (titulo, sub, itens, acao) => `<div class="col"><h3>${titulo}<span class="pill">${itens.length}</span></h3><div class="sub">${sub}</div>
      ${itens.map(({ p, t }) => { const s = situacaoLab(t), prox = proxima(t); return `<div class="labcard ${s.cls}" data-trab="${t.id}" data-pid="${p.id}"><b>${esc(p.nome)}</b><span class="m">${esc(t.tipo)}${t.dente ? " · dente " + esc(t.dente) : ""}${t.lab && t.lab.nome ? " · " + esc(t.lab.nome) : ""}</span>
        <span class="m" style="color:${s.cls === "late" ? "var(--bad)" : s.cls === "today" ? "var(--warn)" : "var(--dim)"};font-weight:700">${esc(s.txt)}${s.fase === "lab" ? ` · ${dataBR(t.lab.entrega)}` : ""}</span>
        <div class="row" style="margin-top:4px">${prox ? `<button class="btn sm pri" data-tact="avancar">${acao}: ${esc(prox.nome)}</button>` : ""}<button class="btn sm" data-tact="linha">Linha do tempo</button></div></div>`; }).join("") || `<span class="tiny dim">nada aqui</span>`}</div>`;
    const ord = (a, b) => (situacaoLab(a.t).d ?? 0) - (situacaoLab(b.t).d ?? 0);
    $("#labCols").innerHTML = col("No laboratório", "aguardando a entrega", L.filter(({ t }) => situacaoLab(t).fase === "lab").sort(ord), "✓")
      + col("Chegou · agendar", "marcar a consulta com o paciente", L.filter(({ t }) => situacaoLab(t).fase === "agendar"), "📅")
      + col("Consulta agendada", "consulta marcada com o paciente", L.filter(({ t }) => situacaoLab(t).fase === "agendado").sort(ord), "✓");
    renderAvisosLab(); paginarTrab();
  }
  $("#tratBusca").addEventListener("input", (e) => { TR.busca = e.target.value; TR.pg = 0; renderTratamentos(); });
  $("#tratUnidade").addEventListener("click", (e) => { const b = e.target.closest("[data-u]"); if (b) { TR.unidade = b.dataset.u; TR.pg = 0; renderTratamentos(); } });
  $("#btnNovoTrab").addEventListener("click", () => novoTrabalho(null));
  const achaTrab = (el) => { const box = el.closest("[data-trab]"); if (!box) return {}; const p = PAC.find((x) => x.id === box.dataset.pid); return { p, t: p && (p.trabalhos || []).find((x) => x.id === box.dataset.trab) }; };
  let confirmaFase = null;
  $("#v-tratamentos").addEventListener("click", (e) => {
    const dot = e.target.closest("[data-fase]");
    if (dot) { const { p, t } = achaTrab(dot); if (t) clicarFase(p, t, dot.dataset.fase, dot); return; }
    const b = e.target.closest("[data-tact]"); if (!b) return;
    const { p, t } = achaTrab(b); if (!t) return;
    if (b.dataset.tact === "avancar") { const f = proxima(t); if (f) marcarFase(p, t, f); } else linhaDoTempo(p, t);
  });
  // clicar numa bolinha: pendente = marca (hoje); marcada = desmarca (pede um segundo clique)
  async function clicarFase(p, t, id, el) {
    const f = fasesDe(t).find((x) => x.id === id); if (!f) return;
    if (!feita(t, f)) { marcarFase(p, t, f); return; }
    const chave = p.id + t.id + id;
    if (confirmaFase !== chave) { confirmaFase = chave; if (el) el.classList.add("confirma"); toast(`Clique de novo para desmarcar "${f.nome}"`); setTimeout(() => { if (confirmaFase === chave) { confirmaFase = null; if (el) el.classList.remove("confirma"); } }, 4000); return; }
    confirmaFase = null; await desmarcarFase(p, t, f); render();
  }
  async function desmarcarFase(p, t, f) {
    const antes = (t.etapas || {})[f.id]; if (!antes) return;
    const et = Object.assign({}, t.etapas); delete et[f.id]; t.etapas = et;
    if (f.papel === "lab_envio") delete t.lab; if (f.papel === "lab_recebido" && t.lab) delete t.lab.recebidoEm; if (f.papel === "agendamento") delete t.consulta; if (f.papel === "moldagem") delete t.metodo;
    prontuario(p, `${nomeTrab(t)}: ${f.nome} desmarcada (estava em ${dataBR(antes.em)})`, null);
    await Store.salvar(p); toast(`${f.nome} desmarcada`);
  }
  // marca uma fase; as fases com papel especial pedem os dados (laboratório, data de entrega, consulta…)
  function marcarFase(p, t, f, depois) {
    const precisa = ["aprovacao", "moldagem", "lab_envio", "agendamento"].includes(f.papel) && !(f.papel === "aprovacao" && p.status === "fechado");
    if (!precisa) {
      const em = new Date(hojeISO() + "T12:00:00").toISOString();
      t.etapas = Object.assign({}, t.etapas, { [f.id]: { em } });
      if (f.papel === "lab_recebido" && t.lab) t.lab.recebidoEm = em;
      prontuario(p, `${nomeTrab(t)}: ${f.nome}`, em);
      Store.salvar(p).then(() => { toast(`${primeiro(p.nome)}: ${f.nome} (${dataBR(em)})`); render(); if (depois) depois(); });
      return;
    }
    const labs = [...new Set(todosTrabalhos().map(({ t: x }) => x.lab && x.lab.nome).filter(Boolean).concat(t.tipo === "Invisalign" ? ["Align Technology"] : []))];
    const ehAprov = f.papel === "aprovacao";
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${esc(f.nome)}">
      <div class="row"><div class="grow"><h2 style="font-size:21px">${esc(f.nome)}</h2><div class="small dim">${esc(p.nome)} · ${esc(nomeTrab(t))}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack">
        <div class="duo"><div><label class="f" for="aeData">Data</label><input class="in" type="date" id="aeData" value="${hojeISO()}"></div><div></div></div>
        ${f.papel === "moldagem" ? `<div><label class="f" for="aeMetodo">Como foi feito</label><select class="in" id="aeMetodo"><option>Escaneamento digital (iTero)</option><option>Moldagem convencional</option></select></div>` : ""}
        ${f.papel === "lab_envio" ? `<div class="duo"><div><label class="f" for="aeLab">Laboratório</label><input class="in" id="aeLab" list="aeLabs" value="${esc(labs[0] || "")}" placeholder="nome do laboratório"><datalist id="aeLabs">${labs.map((l) => `<option value="${esc(l)}">`).join("")}</datalist></div>
          <div><label class="f" for="aeEntrega">Data de entrega combinada</label><input class="in" type="date" id="aeEntrega" value="${new Date(Date.now() + 7 * DIA).toISOString().slice(0, 10)}"></div></div>
          <p class="small dim" style="margin:0">O Alinha avisa no Hoje quando a entrega chegar ou atrasar.</p>` : ""}
        ${f.papel === "agendamento" ? `<div class="duo"><div><label class="f" for="aeConsulta">Dia da consulta</label><input class="in" type="date" id="aeConsulta" value="${new Date(Date.now() + 2 * DIA).toISOString().slice(0, 10)}"></div><div><label class="f" for="aeHora">Horário</label><input class="in" type="time" id="aeHora" value="09:00"></div></div>` : ""}
        ${ehAprov ? `<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="aeFechou" checked> Registrar como fechado no Comercial</label><div><label class="f" for="aeValor">Valor aprovado (R$)</label><input class="in num" id="aeValor" inputmode="decimal" value="${p.valorApresentado || ""}"></div>` : ""}
        <div><label class="f" for="aeObs">Observação</label><input class="in" id="aeObs" placeholder="opcional"></div>
        <div class="row"><button class="btn pri" id="aeSalvar">✓ Marcar ${esc(f.nome.toLowerCase())}</button><span class="small" id="aeSt" style="color:var(--bad)"></span></div>
      </div></div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#aeSalvar").onclick = async () => {
      const d = $("#aeData").value || hojeISO(), em = new Date(d + "T12:00:00").toISOString();
      let extra = "";
      if (f.papel === "lab_envio") {
        const nome = $("#aeLab").value.trim(), ent = $("#aeEntrega").value;
        if (!ent) { $("#aeSt").textContent = "Escolha a data em que o laboratório deve entregar."; return; }
        t.lab = { nome, enviadoEm: em, entrega: new Date(ent + "T12:00:00").toISOString() }; extra = ` · ${nome ? nome + " · " : ""}entrega combinada ${dataBR(t.lab.entrega)}`;
      }
      if (f.papel === "agendamento") { const dc = $("#aeConsulta").value; if (!dc) { $("#aeSt").textContent = "Escolha o dia da consulta."; return; } t.consulta = new Date(dc + "T" + ($("#aeHora").value || "09:00") + ":00").toISOString(); extra = ` · consulta ${dataBR(t.consulta)} ${horaBR(t.consulta)}`; }
      if (f.papel === "moldagem") { t.metodo = $("#aeMetodo").value; extra = " · " + t.metodo; }
      t.etapas = Object.assign({}, t.etapas, { [f.id]: { em, obs: $("#aeObs").value.trim() || undefined } });
      if (ehAprov && $("#aeFechou").checked) {
        const v = num($("#aeValor").value);
        if (p.status === "lead") { p.compareceuEm = p.compareceuEm || em; p.consultaEm = p.consultaEm || em; }
        p.status = "fechado"; p.fechadoEm = em; p.valorFechado = v || p.valorApresentado || 0; p.tratamento = p.tratamento || t.tipo;
      }
      prontuario(p, `${nomeTrab(t)}: ${f.nome}${extra}`, em);
      await Store.salvar(p); fecharGaveta(); toast(`${primeiro(p.nome)}: ${f.nome}`);
      render(); if (depois) depois();
    };
  }

  // linha do tempo de um tratamento: marcar/desmarcar qualquer fase, mudar a data, editar as fases
  function linhaDoTempo(p, t) {
    const F = fasesDe(t), prox = proxima(t);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Linha do tempo">
      <div class="row"><div class="ava">${esc(iniciais(p.nome))}</div><div class="grow"><h2 style="font-size:21px">${esc(p.nome)}</h2><div class="small dim">${esc(nomeTrab(t))}${t.obs ? " · " + esc(t.obs) : ""}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="row"><label class="f" for="ltDr" style="margin:0">Doutor do tratamento</label><select class="in" id="ltDr" style="width:auto">${[""].concat(doutores()).concat(t.dr && !doutores().includes(t.dr) ? [t.dr] : []).map((d) => `<option value="${esc(d)}"${d === (t.dr || "") ? " selected" : ""}>${esc(d || "— escolha —")}</option>`).join("")}</select></div>
      <div class="card"><ol class="tl tledit">${F.map((f) => { const r = (t.etapas || {})[f.id];
        const extra = f.papel === "lab_envio" && t.lab ? `${t.lab.nome ? esc(t.lab.nome) + " · " : ""}entrega combinada ${dataBR(t.lab.entrega)}` : f.papel === "agendamento" && t.consulta ? `consulta ${dataBR(t.consulta)} ${horaBR(t.consulta)}` : f.papel === "moldagem" && t.metodo ? esc(t.metodo) : "";
        return `<li class="${r ? "ok" : prox && prox.id === f.id ? "atual" : "pend"}"><label class="row" style="gap:10px"><input type="checkbox" data-ltfase="${esc(f.id)}"${r ? " checked" : ""} aria-label="${esc(f.nome)}"><span class="grow"><span class="q">${esc(f.nome)}</span><span class="d">${extra ? extra : f.papel ? esc(PAPEIS[f.papel].split(" (")[0]) : ""}${r && r.obs ? (extra ? " · " : "") + esc(r.obs) : ""}</span></span></label>
          ${r ? `<input class="in" type="date" data-ltdata="${esc(f.id)}" value="${String(r.em).slice(0, 10)}" aria-label="Data de ${esc(f.nome)}">` : `<span class="tiny dim">pendente</span>`}</li>`; }).join("")}</ol></div>
      <div class="row"><button class="btn" id="ltEditar">✎ Editar fases</button><span class="grow"></span>${pode("apagar") ? `<button class="btn ghost" id="ltApagar">Apagar tratamento</button>` : ""}</div>
      <p class="tiny dim" style="margin:0">Marque ou desmarque qualquer fase. A data fica registrada no prontuário do paciente.</p>
    </div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $$("#drawerHost [data-ltfase]").forEach((c) => (c.onchange = async () => {
      const f = F.find((x) => x.id === c.dataset.ltfase);
      if (c.checked) marcarFase(p, t, f, () => linhaDoTempo(p, t));
      else { await desmarcarFase(p, t, f); render(); linhaDoTempo(p, t); }
    }));
    $$("#drawerHost [data-ltdata]").forEach((inp) => (inp.onchange = async () => {
      const f = F.find((x) => x.id === inp.dataset.ltdata), r = t.etapas[f.id]; if (!inp.value || !r) return;
      const novo = new Date(inp.value + "T12:00:00").toISOString(), velho = r.em;
      t.etapas = Object.assign({}, t.etapas, { [f.id]: Object.assign({}, r, { em: novo }) });
      prontuario(p, `${nomeTrab(t)}: data de ${f.nome} alterada de ${dataBR(velho)} para ${dataBR(novo)}`, novo);
      await Store.salvar(p); toast("Data alterada"); render(); linhaDoTempo(p, t);
    }));
    $("#ltDr").onchange = async (e) => { t.dr = e.target.value; prontuario(p, `${nomeTrab(t)}: tratamento com ${t.dr || "—"}`, new Date().toISOString()); await Store.salvar(p); toast("Doutor do tratamento salvo"); render(); };
    $("#ltEditar").onclick = () => editorFases(fasesDe(t), `Fases · ${nomeTrab(t)}`, async (novas) => {
      const ids = new Set(novas.map((f) => f.id)), removidas = fasesDe(t).filter((f) => !ids.has(f.id));
      t.fases = novas; const et = Object.assign({}, t.etapas); removidas.forEach((f) => delete et[f.id]); t.etapas = et;
      prontuario(p, `${nomeTrab(t)}: fases editadas (${novas.length} fases)`, null);
      await Store.salvar(p); toast("Fases salvas"); render(); linhaDoTempo(p, t);
    }, () => linhaDoTempo(p, t));
    if ($("#ltApagar")) $("#ltApagar").onclick = async (e) => { if (e.currentTarget.dataset.c !== "1") { e.currentTarget.dataset.c = "1"; e.currentTarget.textContent = "Toque de novo para apagar"; return; } p.trabalhos = (p.trabalhos || []).filter((x) => x.id !== t.id); prontuario(p, `${nomeTrab(t)}: tratamento apagado`, null); await Store.salvar(p); fecharGaveta(); toast("Tratamento apagado"); render(); };
  }

  // editor de fases (usado no tratamento e nos modelos de procedimento)
  function linhasFasesHTML(fases) {
    return fases.map((f, i) => `<div class="faserow" data-i="${i}"><span class="tiny dim num">${i + 1}</span><input class="in" data-fnome value="${esc(f.nome)}" aria-label="Nome da fase ${i + 1}"><select class="in" data-fpapel aria-label="Tipo da fase ${i + 1}">${Object.entries(PAPEIS).map(([k, n]) => `<option value="${k}"${(f.papel || "") === k ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <button class="btn sm" data-fmov="-1" aria-label="Subir"${i ? "" : " disabled"}>↑</button><button class="btn sm" data-fmov="1" aria-label="Descer"${i < fases.length - 1 ? "" : " disabled"}>↓</button><button class="btn sm ghost" data-fdel aria-label="Remover fase">✕</button></div>`).join("");
  }
  function lerLinhasFases(box, fases) {
    return $$(".faserow", box).map((r) => { const f = fases[Number(r.dataset.i)]; return { id: f.id, nome: $("[data-fnome]", r).value.trim() || f.nome, papel: $("[data-fpapel]", r).value }; });
  }
  function ligarEditorFases(box, getFases, setFases) {
    box.addEventListener("click", (e) => {
      const r = e.target.closest(".faserow"), fs = lerLinhasFases(box, getFases());
      if (e.target.closest("[data-fmov]") && r) { const i = Number(r.dataset.i), j = i + Number(e.target.closest("[data-fmov]").dataset.fmov); [fs[i], fs[j]] = [fs[j], fs[i]]; setFases(fs); }
      else if (e.target.closest("[data-fdel]") && r) { fs.splice(Number(r.dataset.i), 1); setFases(fs); }
      else if (e.target.closest("[data-fadd]")) { const nome = "Nova fase"; let id = slug(nome) + "_" + Math.random().toString(36).slice(2, 5); fs.push({ id, nome, papel: "" }); setFases(fs); const ins = $$("[data-fnome]", box); const u = ins[ins.length - 1]; if (u) { u.focus(); u.select(); } }
    });
  }
  function editorFases(fases, titulo, aoSalvar, aoCancelar) {
    let F = clonar(fases);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="${esc(titulo)}">
      <div class="row"><h2 class="grow" style="font-size:20px">${esc(titulo)}</h2><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <p class="small dim" style="margin:0">Renomeie, mude a ordem, remova ou acrescente fases. O tipo da fase define o que o Alinha pede ao marcar (ex.: envio ao laboratório pede a data de entrega).</p>
      <div class="card stack" id="efBox"><div class="fases" id="efLista"></div><button class="btn sm" data-fadd>+ Adicionar fase</button></div>
      <div class="row"><button class="btn pri" id="efSalvar">Salvar fases</button><button class="btn" id="efCancelar">Cancelar</button></div>
    </div></div>`;
    const desenhar = () => { $("#efLista").innerHTML = linhasFasesHTML(F); };
    desenhar(); ligarEditorFases($("#efBox"), () => F, (n) => { F = n; desenhar(); });
    const sair = () => (aoCancelar ? aoCancelar() : fecharGaveta());
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") sair(); });
    $("#btnFechar").onclick = sair; $("#efCancelar").onclick = sair;
    $("#efSalvar").onclick = () => { const n = lerLinhasFases($("#efBox"), F); if (!n.length) { toast("Deixe ao menos uma fase"); return; } aoSalvar(n); };
  }

  // novo tratamento: escolhe o procedimento e já personaliza as fases (também abre sozinho quando o orçamento é aprovado)
  const tipoDoTratamento = (txt) => { const t = norm(txt); const P = Object.keys(procedimentos()); return P.find((k) => t && (t.includes(norm(k)) || norm(k).includes(t))) || (t.includes("alinhador") ? "Invisalign" : t.includes("fixo") || t.includes("aparelho") ? "Aparelho fixo" : "") || P[0]; };
  function novoTrabalho(pac, opts = {}) {
    const P = procedimentos(), nomes = PAC.slice().sort((a, b) => a.nome.localeCompare(b.nome));
    let tipo = opts.tipo || (pac ? tipoDoTratamento(pac.tratamento || pac.interesse || "") : Object.keys(P)[0]);
    let F = fasesModelo(tipo);
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Nova linha do tempo">
      <div class="row"><div class="grow"><h2 style="font-size:21px">${opts.aprovado ? "Orçamento aprovado: cadastrar a linha do tempo" : "Novo tratamento"}</h2>${opts.aprovado ? `<div class="small dim">${esc(pac.nome)} fechou. Confira as fases deste tratamento.</div>` : ""}</div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack" id="ntBox">
        <div><label class="f" for="ntPac">Paciente</label>${pac ? `<input class="in" id="ntPac" value="${esc(pac.nome)}" disabled>` : `<input class="in" id="ntPac" list="ntPacs" placeholder="Digite o nome" autocomplete="off"><datalist id="ntPacs">${nomes.map((p) => `<option value="${esc(p.nome)}">`).join("")}</datalist>`}</div>
        <div class="duo"><div><label class="f" for="ntTipo">Procedimento</label><select class="in" id="ntTipo">${Object.keys(P).map((k) => `<option${k === tipo ? " selected" : ""}>${esc(k)}</option>`).join("")}</select></div>
          <div><label class="f" for="ntDente">Dente(s)</label><input class="in" id="ntDente" placeholder="ex.: 26 ou 11 e 21"></div></div>
        <div><label class="f" for="ntDr">Doutor do tratamento</label><select class="in" id="ntDr">${doutores().map((d) => `<option${d === ((pac && (pac.drAvaliacao || pac.profissional)) || "") ? " selected" : ""}>${esc(d)}</option>`).join("")}</select></div>
        <div><label class="f" for="ntObs">Observações</label><input class="in" id="ntObs" placeholder="ex.: cor A2, 3 refinamentos"></div>
        <div class="row"><span class="label grow">Fases deste tratamento</span><span class="tiny dim">personalize se precisar</span></div>
        <div class="fases" id="ntFases"></div><button class="btn sm" data-fadd>+ Adicionar fase</button>
        <div class="row"><button class="btn pri" id="ntSalvar">Criar linha do tempo</button><span class="small" id="ntSt" style="color:var(--bad)"></span></div>
      </div></div></div>`;
    const desenhar = () => { $("#ntFases").innerHTML = linhasFasesHTML(F); };
    desenhar(); ligarEditorFases($("#ntBox"), () => F, (n) => { F = n; desenhar(); });
    $("#ntTipo").onchange = () => { tipo = $("#ntTipo").value; F = fasesModelo(tipo); desenhar(); };
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#ntSalvar").onclick = async () => {
      const p = pac || PAC.find((x) => norm(x.nome) === norm($("#ntPac").value));
      if (!p) { $("#ntSt").textContent = "Escolha um paciente da lista (cadastre antes no CRM, se for novo)."; return; }
      const fases = lerLinhasFases($("#ntBox"), F); if (!fases.length) { $("#ntSt").textContent = "Deixe ao menos uma fase."; return; }
      const agora = new Date().toISOString(), etapas = {};
      // fases iniciais já cumpridas: consulta e orçamento (data da consulta) e, se aprovado, a aprovação
      const consultaEm = p.compareceuEm || p.consultaEm || agora;
      const iAprov = fases.findIndex((f) => f.papel === "aprovacao");
      fases.forEach((f, i) => { if (["consulta", "orcamento"].includes(f.id) && (i < iAprov || iAprov < 0)) etapas[f.id] = { em: consultaEm }; });
      if (!Object.keys(etapas).length && fases[0]) etapas[fases[0].id] = { em: agora };
      if ((opts.aprovado || p.status === "fechado") && iAprov >= 0) etapas[fases[iAprov].id] = { em: p.fechadoEm || agora };
      const t = { id: "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), tipo, dente: $("#ntDente").value.trim(), dr: $("#ntDr").value, obs: $("#ntObs").value.trim(), criadoEm: agora, fases, etapas };
      p.trabalhos = (p.trabalhos || []).concat(t);
      if (t.dr) prontuario(p, `${nomeTrab(t)}: tratamento com ${t.dr}`, agora);
      prontuario(p, `${nomeTrab(t)}: linha do tempo criada (${fases.length} fases) · ${fases.filter((f) => etapas[f.id]).map((f) => f.nome).join(", ")}`, agora);
      await Store.salvar(p); fecharGaveta(); toast("Linha do tempo criada");
      if (vista === "tratamentos") { abrirAba("trat", "and"); renderTratamentos(); } else render();
    };
    if (!pac) setTimeout(() => { const n = $("#ntPac"); if (n) n.focus(); }, 50);
  }
  // ao aprovar o orçamento (fechou): oferece cadastrar a linha do tempo do tratamento
  function aposFechamento(p) {
    if (!pode("tratamentos")) return;
    if ((p.trabalhos || []).some((t) => !concluido(t))) return;
    setTimeout(() => novoTrabalho(p, { aprovado: true }), 150);
  }

  // modelos de procedimento (Ajustes › Procedimentos)
  const PROCED = { sel: null, mapa: null };
  function renderProcedimentos() {
    const box = $("#procBox"); if (!box) return;
    if (!PROCED.mapa) PROCED.mapa = procedimentos();
    const nomes = Object.keys(PROCED.mapa); if (!PROCED.sel || !PROCED.mapa[PROCED.sel]) PROCED.sel = nomes[0];
    $("#procLista").innerHTML = nomes.map((n) => `<button data-proc="${esc(n)}" class="${n === PROCED.sel ? "on" : ""}">${esc(n)} <span class="tiny">${PROCED.mapa[n].length}</span></button>`).join("");
    $("#procFases").innerHTML = linhasFasesHTML(PROCED.mapa[PROCED.sel]);
    $("#procNome").textContent = PROCED.sel;
  }
  function ligarProcedimentos() {
    const box = $("#procBox"); if (!box) return;
    ligarEditorFases(box, () => PROCED.mapa[PROCED.sel], (n) => { PROCED.mapa[PROCED.sel] = n; renderProcedimentos(); });
    $("#procLista").addEventListener("click", (e) => { const b = e.target.closest("[data-proc]"); if (!b) return; PROCED.mapa[PROCED.sel] = lerLinhasFases(box, PROCED.mapa[PROCED.sel]); PROCED.sel = b.dataset.proc; renderProcedimentos(); });
    $("#btnProcNovo").addEventListener("click", () => { const n = $("#procNovoNome").value.trim(); if (!n) { toast("Digite o nome do procedimento"); return; } if (PROCED.mapa[n]) { toast("Esse procedimento já existe"); return; } PROCED.mapa[PROCED.sel] = lerLinhasFases(box, PROCED.mapa[PROCED.sel]); PROCED.mapa[n] = clonar(PROC_PADRAO["Outro procedimento"]); PROCED.sel = n; $("#procNovoNome").value = ""; renderProcedimentos(); });
    $("#btnProcRemover").addEventListener("click", (e) => { if (Object.keys(PROCED.mapa).length <= 1) return; if (e.currentTarget.dataset.c !== "1") { e.currentTarget.dataset.c = "1"; e.currentTarget.textContent = "Confirmar remoção"; return; } e.currentTarget.dataset.c = ""; e.currentTarget.textContent = "Remover procedimento"; delete PROCED.mapa[PROCED.sel]; PROCED.sel = null; renderProcedimentos(); });
    $("#btnProcSalvar").addEventListener("click", async () => { PROCED.mapa[PROCED.sel] = lerLinhasFases(box, PROCED.mapa[PROCED.sel]); try { await Store.ajustes({ procedimentos: PROCED.mapa }); $("#procStatus").textContent = "✓ Salvo: os próximos tratamentos usam estas fases"; } catch (er) { $("#procStatus").textContent = "Erro: " + er.message; } });
    $("#btnProcPadrao").addEventListener("click", async () => { PROCED.mapa = clonar(PROC_PADRAO); PROCED.sel = null; await Store.ajustes({ procedimentos: null }); renderProcedimentos(); $("#procStatus").textContent = "Modelos padrão restaurados"; });
  }
  ligarProcedimentos();

  // linha do tempo completa do paciente (na ficha): comercial + tratamentos + prontuário
  function timelinePacienteHTML(p) {
    const ev = [];
    if (p.entradaEm) ev.push([p.entradaEm, "Entrou como lead", p.origem || ""]);
    if (p.agendadoEm) ev.push([p.agendadoEm, "Agendou a avaliação", ""]);
    if (p.faltouEm) ev.push([p.faltouEm, "Faltou à consulta", ""]);
    if (p.compareceuEm || (["aberto", "fechado", "perdido"].includes(p.status) && p.consultaEm)) ev.push([p.compareceuEm || p.consultaEm, "Consulta · orçamento", [p.tratamento, p.valorApresentado ? brl(p.valorApresentado) : ""].filter(Boolean).join(" · ")]);
    const toques = Object.entries(p.toques || {}).filter(([, x]) => x && x.status === "enviado"); if (toques.length) ev.push([toques.map(([, x]) => x.em).sort().pop(), `Follow-up: ${toques.length} contato${toques.length > 1 ? "s" : ""}`, toques.map(([d]) => (String(d).startsWith("R") ? d : "D" + d)).join(", ")]);
    if (p.status === "fechado" && p.fechadoEm) ev.push([p.fechadoEm, "Fechou o tratamento", brl(p.valorFechado)]);
    if (p.status === "perdido" && p.encerradoEm) ev.push([p.encerradoEm, "Não fechou", ""]);
    (p.trabalhos || []).forEach((t) => fasesDe(t).forEach((f) => { const r = (t.etapas || {})[f.id]; if (r) ev.push([r.em, `${nomeTrab(t)}: ${f.nome}`, f.papel === "lab_envio" && t.lab ? `entrega ${dataBR(t.lab.entrega)}` : f.papel === "agendamento" && t.consulta ? `consulta ${dataBR(t.consulta)}` : "", true]); }));
    ev.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const mostra = ev.slice(-8), andamento = (p.trabalhos || []).filter((t) => !concluido(t)), pront = (p.prontuario || []).slice(0, 6);
    return `<div class="card stack"><div class="row"><span class="label grow">Linha do tempo</span>${pode("tratamentos") ? `<button class="btn sm" id="gNovoTrab">+ Tratamento</button>` : ""}</div>
      ${andamento.map((t) => `<div class="prox"><div class="row"><b class="grow">${esc(nomeTrab(t))}</b><button class="btn sm" data-gtrab="${t.id}">Abrir</button></div><div class="passos">${bolinhas(t).replace(/data-fase=/g, "data-gfase=").replace(/<button class="fz/g, `<button data-gt="${t.id}" class="fz`)}</div></div>`).join("")}
      ${mostra.length ? `<ol class="tl">${mostra.map(([d, q, x, trab]) => `<li class="ok${trab ? "" : " com"}"><div class="q">${esc(q)}</div><div class="d">${dataBR(d)}${x ? " · " + esc(x) : ""}</div></li>`).join("")}</ol>` : `<span class="small dim">Sem eventos ainda.</span>`}
    </div>
    <div class="card stack"><div class="row"><span class="label grow">Prontuário</span><span class="tiny dim">${(p.prontuario || []).length} registro${(p.prontuario || []).length === 1 ? "" : "s"}</span></div>
      ${pront.length ? `<ul class="pront">${pront.map((x) => `<li><b class="num">${x.data ? dataBR(x.data) : dataBR(x.em)}</b> ${esc(x.texto)}<span class="tiny dim"> · registrado ${dataHoraP(x.em)}${x.por ? " · " + esc(x.por) : ""}</span></li>`).join("")}</ul>` : `<span class="small dim">As fases marcadas e desmarcadas aparecem aqui com a data.</span>`}
      ${(p.prontuario || []).length > pront.length ? `<button class="btn sm" id="gProntTudo">Ver prontuário completo</button>` : ""}</div>`;
  }
  const dataHoraP = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  function ligarTimelinePaciente(p) {
    const n = $("#gNovoTrab"); if (n) n.onclick = () => novoTrabalho(p);
    $$("#drawerHost [data-gtrab]").forEach((b) => (b.onclick = () => { const t = (p.trabalhos || []).find((x) => x.id === b.dataset.gtrab); if (t) linhaDoTempo(p, t); }));
    $$("#drawerHost [data-gfase]").forEach((b) => (b.onclick = async () => { const t = (p.trabalhos || []).find((x) => x.id === b.dataset.gt); if (!t) return; await clicarFase(p, t, b.dataset.gfase, b); if (!$("#aeSalvar")) abrirGaveta(p); }));
    const tudo = $("#gProntTudo"); if (tudo) tudo.onclick = () => {
      $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Prontuário"><div class="row"><h2 class="grow" style="font-size:21px">Prontuário · ${esc(p.nome)}</h2><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
        <div class="card"><ul class="pront">${(p.prontuario || []).map((x) => `<li><b class="num">${x.data ? dataBR(x.data) : dataBR(x.em)}</b> ${esc(x.texto)}<span class="tiny dim"> · registrado ${dataHoraP(x.em)}${x.por ? " · " + esc(x.por) : ""}</span></li>`).join("")}</ul></div>
        <button class="btn" id="prVoltar">← Voltar à ficha</button></div></div>`;
      $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
      $("#btnFechar").onclick = fecharGaveta; $("#prVoltar").onclick = () => abrirGaveta(p);
    };
  }

  /* ------------------------------------------------------------ */
  /* Lembretes (sininho nos cartões do CRM)                          */
  /* ------------------------------------------------------------ */
  const fimDoDia = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d; };
  const lembretesPendentes = (p) => (p.lembretes || []).filter((l) => !l.feito);
  const lembretesVencidos = () => PAC.flatMap((p) => lembretesPendentes(p).filter((l) => new Date(l.quando) <= fimDoDia()).map((l) => ({ p, l })));
  function abrirLembrete(p) {
    const amanha = new Date(Date.now() + DIA).toISOString().slice(0, 10);
    const lista = () => lembretesPendentes(p).sort((a, b) => (a.quando > b.quando ? 1 : -1));
    const desenhar = () => {
      $("#lbLista").innerHTML = lista().length ? lista().map((l) => `<div class="it"><span class="grow"><b>${dataBR(l.quando)} ${horaBR(l.quando)}</b> · ${esc(l.texto)}</span><button class="btn sm" data-lbok="${l.id}">✓ Feito</button><button class="btn sm ghost" data-lbdel="${l.id}" aria-label="Apagar lembrete">✕</button></div>`).join("") : `<span class="small dim">Nenhum lembrete pendente.</span>`;
    };
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Lembrete"><div class="row"><div class="grow"><h2 style="font-size:21px">Lembrete</h2><div class="small dim">${esc(p.nome)}</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack"><div class="duo"><div><label class="f" for="lbDia">Dia</label><input class="in" type="date" id="lbDia" value="${amanha}"></div><div><label class="f" for="lbHora">Horário</label><input class="in" type="time" id="lbHora" value="09:00"></div></div>
        <div><label class="f" for="lbTexto">O que fazer</label><input class="in" id="lbTexto" value="Retornar o contato"></div>
        <div class="row"><button class="btn pri" id="lbSalvar">Criar lembrete</button></div></div>
      <div class="card stack"><span class="label">Pendentes</span><div class="lista-int" id="lbLista"></div></div>
      <p class="tiny dim" style="margin:0">No dia, o lembrete aparece no topo do Hoje.</p></div></div>`;
    desenhar();
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#lbSalvar").onclick = async () => {
      if (!$("#lbDia").value) return;
      const l = { id: "lb" + Date.now().toString(36), quando: new Date($("#lbDia").value + "T" + ($("#lbHora").value || "09:00") + ":00").toISOString(), texto: $("#lbTexto").value.trim() || "Retornar o contato", feito: false };
      p.lembretes = (p.lembretes || []).concat(l); prontuario(p, `Lembrete criado: ${l.texto} (${dataBR(l.quando)} ${horaBR(l.quando)})`, l.quando);
      await Store.salvar(p); toast("Lembrete criado"); desenhar(); render();
    };
    $("#lbLista").addEventListener("click", async (e) => {
      const ok = e.target.closest("[data-lbok]"), del = e.target.closest("[data-lbdel]"); if (!ok && !del) return;
      const id = (ok || del).dataset[ok ? "lbok" : "lbdel"], l = (p.lembretes || []).find((x) => x.id === id); if (!l) return;
      if (ok) { l.feito = true; l.feitoEm = new Date().toISOString(); prontuario(p, `Lembrete concluído: ${l.texto}`, l.feitoEm); } else p.lembretes = p.lembretes.filter((x) => x.id !== id);
      await Store.salvar(p); desenhar(); render();
    });
  }
  function abrirLembretesDoDia() {
    const desenhar = () => { const L = lembretesVencidos();
      $("#lbHoje").innerHTML = L.length ? L.map(({ p, l }) => `<div class="it" data-pid="${p.id}"><span class="grow"><b>${esc(p.nome)}</b> · ${esc(l.texto)} <span class="tiny dim">${dataBR(l.quando)} ${horaBR(l.quando)}</span></span><button class="btn sm" data-ld="${l.id}">✓ Feito</button><button class="btn sm" data-lf="1">Ficha</button></div>`).join("") : `<span class="small dim">Nenhum lembrete para hoje.</span>`; };
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Lembretes de hoje"><div class="row"><h2 class="grow" style="font-size:21px">Lembretes de hoje</h2><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div><div class="card"><div class="lista-int" id="lbHoje"></div></div></div></div>`;
    desenhar();
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#lbHoje").addEventListener("click", async (e) => {
      const it = e.target.closest("[data-pid]"); if (!it) return; const p = PAC.find((x) => x.id === it.dataset.pid); if (!p) return;
      if (e.target.closest("[data-lf]")) { (ehCliente(p) ? abrirGaveta : abrirCard)(p); return; }
      const b = e.target.closest("[data-ld]"); if (!b) return; const l = (p.lembretes || []).find((x) => x.id === b.dataset.ld); if (!l) return;
      l.feito = true; l.feitoEm = new Date().toISOString(); prontuario(p, `Lembrete concluído: ${l.texto}`, l.feitoEm); await Store.salvar(p); desenhar(); render();
    });
  }

  /* ------------------------------------------------------------ */
  /* Suporte: chat com IA e manual de ajuda                         */
  /* ------------------------------------------------------------ */
  const AJUDA = window.AJUDA || [];
  const NOME_TELA = Object.fromEntries([...$$("#nav button[data-v]")].map((b) => [b.dataset.v, b.textContent.replace(/\d+$/, "").trim()]));
  const SUP = { msgs: ls.get("alinha.suporte", []), ocupado: false };
  const STOP = new Set("pra pro pros pras faco como faço fazer para onde que qual quais uma um uns umas de da do das dos no na nos nas em por com sem meu minha seu sua isso esse essa este esta tem ter ver vejo posso pode consigo quero preciso".split(" "));
  function buscarAjuda(q) {
    const pal = norm(q).split(" ").filter((w) => w.length >= 3 && !STOP.has(w));
    return AJUDA.map((t) => { const T = norm(t.titulo), P = norm(t.palavras), X = norm(t.texto + " " + (t.passos || []).join(" "));
      let s = 0, achou = 0; pal.forEach((w) => { const raiz = w.length >= 5 ? w.slice(0, Math.max(4, w.length - 2)) : w; const a = s; if (T.includes(raiz)) s += 3; if (P.includes(raiz)) s += 2; if (X.includes(raiz)) s += 1; if (s > a) achou++; }); return { t, s, achou }; })
      .filter((x) => x.s > 0 && x.achou >= Math.min(2, pal.length)).sort((a, b) => b.s - a.s); // pergunta com várias palavras: ao menos 2 em comum
  }
  function respostaLocal(q) {
    const r = buscarAjuda(q);
    if (!r.length) return { texto: "Não encontrei isso no manual. Tente com outras palavras (ex.: laboratório, follow-up, permissões) ou fale com o administrador.", fonte: "manual" };
    const t = r[0].t;
    return { texto: `${t.texto}\n\nComo fazer:\n${(t.passos || []).map((x, i) => `${i + 1}. ${x}`).join("\n")}`, tela: t.tela, topico: t.id, rel: r.slice(1, 3).map((x) => x.t.id), fonte: "manual" };
  }
  function renderSuporte() {
    $("#supModo").textContent = PLAT && PLAT.ia ? "IA + manual" : "manual";
    $("#supModo").className = "pill" + (PLAT && PLAT.ia ? " acc" : "");
    const boas = { autor: "sup", texto: `Olá! Sou o suporte do Alinha. Pergunte qualquer dúvida sobre o sistema: como fazer, onde fica, o que significa.${PLAT && PLAT.ia ? "" : "\n(Respondendo pelo manual de ajuda.)"}` };
    const lista = [boas].concat(SUP.msgs);
    $("#supMsgs").innerHTML = lista.map((m) => `<div class="supmsg ${m.autor}">${esc(m.texto)}${m.autor === "sup" && (m.tela || m.topico || (m.rel || []).length) ? `<div class="acoes">${m.tela && NOME_TELA[m.tela] && pode(m.tela) && m.tela !== "suporte" ? `<button class="btn sm" data-supir="${m.tela}">Abrir ${esc(NOME_TELA[m.tela])}</button>` : ""}${m.topico ? `<button class="btn sm" data-suptop="${m.topico}">Ver no manual</button>` : ""}${(m.rel || []).map((id) => { const t = AJUDA.find((x) => x.id === id); return t ? `<button class="btn sm ghost" data-suptop="${id}">${esc(t.titulo)}</button>` : ""; }).join("")}</div>` : ""}${m.fonte ? `<span class="fonte">${m.fonte === "ia" ? "resposta da IA, com base no manual" : "resposta do manual de ajuda"}</span>` : ""}</div>`).join("") + (SUP.ocupado ? `<div class="supmsg sup dim">Pensando…</div>` : "");
    const box = $("#supMsgs"); box.scrollTop = box.scrollHeight;
    const sug = ["Como envio um trabalho para o laboratório?", "Como marco que o paciente compareceu?", "Como funciona o follow-up?", "Como conecto o celular?", "Onde vejo o resultado das campanhas?", "Como mudo as permissões?"];
    $("#supSug").innerHTML = SUP.msgs.length ? "" : sug.map((s) => `<button data-supq="${esc(s)}">${esc(s)}</button>`).join("");
    renderManual();
  }
  function renderManual(abrir) {
    const q = ($("#supBusca").value || "").trim();
    const lista = q ? buscarAjuda(q).map((x) => x.t) : AJUDA;
    $("#supQtd").textContent = `${lista.length} tópico${lista.length === 1 ? "" : "s"}`;
    $("#supManual").innerHTML = lista.map((t) => `<details data-top="${t.id}"${abrir === t.id ? " open" : ""}><summary>${esc(t.titulo)}</summary><p>${esc(t.texto)}</p><ol>${(t.passos || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>${pode(t.tela) && t.tela !== "suporte" ? `<button class="btn sm" data-supir="${t.tela}">Abrir ${esc(NOME_TELA[t.tela] || t.tela)}</button>` : ""}</details>`).join("") || `<span class="small dim">Nada encontrado.</span>`;
    if (abrir) { const d = $(`#supManual [data-top="${abrir}"]`); if (d) d.scrollIntoView({ block: "nearest" }); }
  }
  async function perguntar(q) {
    q = String(q || "").trim(); if (!q || SUP.ocupado) return;
    SUP.msgs.push({ autor: "eu", texto: q }); SUP.ocupado = true; renderSuporte();
    let r = null;
    if (PLAT && PLAT.ia) {
      try { const d = await api("POST", "api/ia/suporte", { pergunta: q, historico: SUP.msgs.slice(-9, -1) }); if (d.resposta) r = { texto: d.resposta, tela: d.tela || "", topico: AJUDA.some((t) => t.id === d.topico) ? d.topico : "", fonte: "ia" }; } catch (e) { /* usa o manual */ }
    }
    if (!r) r = respostaLocal(q);
    SUP.msgs.push(Object.assign({ autor: "sup" }, r)); SUP.msgs = SUP.msgs.slice(-30); SUP.ocupado = false;
    ls.set("alinha.suporte", SUP.msgs); renderSuporte();
  }
  $("#supForm").addEventListener("submit", (e) => { e.preventDefault(); const t = $("#supTexto"); const q = t.value; t.value = ""; perguntar(q); });
  $("#supTexto").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("#supForm").requestSubmit(); } });
  $("#supBusca").addEventListener("input", () => renderManual());
  $("#v-suporte").addEventListener("click", (e) => {
    const q = e.target.closest("[data-supq]"); if (q) { perguntar(q.dataset.supq); return; }
    const ir = e.target.closest("[data-supir]"); if (ir) { mostrar(ir.dataset.supir); return; }
    const tp = e.target.closest("[data-suptop]"); if (tp) { $("#supBusca").value = ""; renderManual(tp.dataset.suptop); }
  });

  /* ------------------------------------------------------------ */
  /* Integrações: tokens da API, webhooks e Kommo (administrador)    */
  /* ------------------------------------------------------------ */
  let INTEG = null;
  const EVENTOS_PADRAO = ["lead.criado", "lead.etapa", "cliente.compareceu", "cliente.fechou"];
  const dataHora = (iso) => (iso ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "nunca");
  async function carregarIntegracoes() {
    if (!PLAT || !ehAdminFront()) { renderIntegracoes(); return; }
    try { INTEG = await api("GET", "api/integracoes"); } catch (e) { INTEG = { erro: e.message }; }
    renderIntegracoes();
  }
  function renderIntegracoes(tokenNovo) {
    if (!$("#tkLista")) return;
    if (!PLAT) {
      const msg = `<span class="small dim">Disponível na plataforma (com login de administrador). Na demonstração não há servidor para receber chamadas.</span>`;
      $("#tkLista").innerHTML = msg; $("#whLista").innerHTML = msg; $("#whEventos").innerHTML = ""; $("#kmEstado").textContent = "demonstração"; return;
    }
    if (!INTEG || INTEG.erro) { $("#tkLista").innerHTML = `<span class="small" style="color:var(--bad)">${esc((INTEG && INTEG.erro) || "Carregando…")}</span>`; return; }
    const I = INTEG;
    $("#tkNovo").innerHTML = tokenNovo ? `<div class="tknovo"><b>Token gerado: copie agora, ele não será mostrado de novo.</b><div class="copiar"><code id="tkValor">${esc(tokenNovo)}</code><button class="btn sm" data-copiar="tkValor">Copiar</button></div></div>` : "";
    $("#tkLista").innerHTML = I.tokens.length ? I.tokens.map((t) => `<div class="it"><b>${esc(t.nome)}</b><code>${esc(t.prefixo)}…</code><span class="pill ${t.escopo === "leitura" ? "" : "acc"}">${t.escopo === "leitura" ? "só leitura" : "ler e gravar"}</span><span class="tiny dim grow">criado ${dataHora(t.criadoEm)} · último uso ${dataHora(t.usadoEm)}</span><button class="btn sm ghost" data-tkdel="${t.id}">Revogar</button></div>`).join("") : `<span class="small dim">Nenhum token ainda.</span>`;
    if (!$("#whEventos").children.length) $("#whEventos").innerHTML = Object.entries(I.eventos).map(([k, n]) => `<button data-ev="${k}" class="${EVENTOS_PADRAO.includes(k) ? "on" : ""}" title="${esc(n)}">${esc(k)}</button>`).join("");
    $("#whLista").innerHTML = I.webhooks.length ? I.webhooks.map((w) => `<div class="it"><b>${esc(w.nome)}</b><span class="pill ${w.ativo === false ? "" : "good"}">${w.ativo === false ? "pausado" : "ativo"}</span><span class="tiny dim grow" style="word-break:break-all">${esc(w.url)}</span>
      <span class="tiny" style="width:100%">Eventos: ${w.eventos.map(esc).join(", ")}</span>
      <div class="copiar" style="width:100%"><span class="tiny dim">Segredo para conferir a assinatura:</span><code id="seg${w.id}">${esc(w.segredo)}</code><button class="btn sm" data-copiar="seg${w.id}">Copiar</button></div>
      <button class="btn sm" data-whteste="${w.id}">Enviar teste</button><button class="btn sm" data-whativo="${w.id}">${w.ativo === false ? "Ativar" : "Pausar"}</button><button class="btn sm ghost" data-whdel="${w.id}">Remover</button></div>`).join("") : `<span class="small dim">Nenhum webhook ainda.</span>`;
    const ent = (I.entregas || []).slice(0, 5);
    $("#whEntregas").innerHTML = ent.length ? `<span class="label">Últimas entregas</span><br>` + ent.map((x) => `${x.ok ? "✅" : "⚠️"} ${esc(x.evento)} · ${dataHora(x.em)} · ${x.status ? "HTTP " + x.status : esc(x.erro || "")}`).join("<br>") : "";
    const K = I.kommo || {};
    $("#kmEstado").textContent = K.conectado ? "API do Kommo conectada" : "token do Kommo não configurado"; $("#kmEstado").className = "pill " + (K.conectado ? "good" : "");
    $("#kmWebhook").textContent = K.webhook || "Configure KOMMO_CHAVE_WEBHOOK na hospedagem para gerar o endereço.";
    $("#kmImportar").checked = K.importar !== false; $("#kmSincronizar").checked = !!K.sincronizar;
    $("#kmFunilLead").value = K.funilLead || ""; $("#kmFunilCliente").value = K.funilCliente || ""; $("#kmEtapaCliente").value = K.etapaCliente || ""; $("#kmEtapaFechou").value = K.etapaClienteFechou || "";
  }
  $("#v-ajustes").addEventListener("click", async (e) => {
    const cp = e.target.closest("[data-copiar]");
    if (cp) { const el = document.getElementById(cp.dataset.copiar); try { await navigator.clipboard.writeText(el.textContent); toast("Copiado"); } catch (er) { const r = document.createRange(); r.selectNodeContents(el); getSelection().removeAllRanges(); getSelection().addRange(r); toast("Selecionado: use Ctrl+C"); } return; }
    const ev = e.target.closest("#whEventos [data-ev]"); if (ev) { ev.classList.toggle("on"); return; }
    if (!PLAT) return;
    const chamar = async (m, rota, corpo, msg) => { try { const d = await api(m, rota, corpo); INTEG = d; renderIntegracoes(d.token); if (msg) toast(msg); return d; } catch (er) { toast(er.message); } };
    const del = e.target.closest("[data-tkdel]");
    if (del) { if (del.dataset.c !== "1") { del.dataset.c = "1"; del.textContent = "Confirmar"; return; } await chamar("DELETE", "api/integracoes/tokens/" + del.dataset.tkdel, null, "Token revogado"); return; }
    const wt = e.target.closest("[data-whteste]");
    if (wt) { wt.disabled = true; wt.textContent = "Enviando…"; const d = await chamar("POST", `api/integracoes/webhooks/${wt.dataset.whteste}/teste`, {}); if (d && d.teste) toast(d.teste.ok ? `Teste entregue (HTTP ${d.teste.status})` : `Não entregou: ${d.teste.erro || "HTTP " + d.teste.status}`); return; }
    const wa = e.target.closest("[data-whativo]");
    if (wa) { const w = INTEG.webhooks.find((x) => x.id === wa.dataset.whativo); await chamar("PATCH", "api/integracoes/webhooks/" + w.id, { ativo: w.ativo === false }, w.ativo === false ? "Webhook ativado" : "Webhook pausado"); return; }
    const wd = e.target.closest("[data-whdel]");
    if (wd) { if (wd.dataset.c !== "1") { wd.dataset.c = "1"; wd.textContent = "Confirmar"; return; } await chamar("DELETE", "api/integracoes/webhooks/" + wd.dataset.whdel, null, "Webhook removido"); return; }
    if (e.target.closest("#btnTkCriar")) { await chamar("POST", "api/integracoes/tokens", { nome: $("#tkNome").value.trim(), escopo: $("#tkEscopo").value }, "Token gerado"); $("#tkNome").value = ""; return; }
    if (e.target.closest("#btnWhCriar")) {
      const evs = $$("#whEventos .on").map((b) => b.dataset.ev);
      const d = await chamar("POST", "api/integracoes/webhooks", { url: $("#whUrl").value.trim(), eventos: evs }, "Webhook adicionado"); if (d) $("#whUrl").value = ""; return;
    }
    if (e.target.closest("#btnKmSalvar")) {
      const n = (id) => { const v = $(id).value.replace(/\D/g, ""); return v ? Number(v) : null; };
      try { await Store.ajustes({ funilLead: n("#kmFunilLead"), funilCliente: n("#kmFunilCliente"), etapaCliente: n("#kmEtapaCliente"), etapaClienteFechou: n("#kmEtapaFechou"), kommoSincronizar: $("#kmSincronizar").checked, kommoImportarLeads: $("#kmImportar").checked }); $("#kmStatus").textContent = "✓ Salvo"; carregarIntegracoes(); }
      catch (er) { $("#kmStatus").textContent = "Erro: " + er.message; }
      return;
    }
    if (e.target.closest("#btnApiDoc")) abrirDocApi();
  });
  function abrirDocApi() {
    const base = (INTEG && INTEG.api) || (location.origin + "/api/v1");
    const ex = (s) => `<pre>${esc(s)}</pre>`;
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer doc" role="dialog" aria-label="Documentação da API">
      <div class="row"><h2 class="grow" style="font-size:21px">API do Alinha</h2><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack">
        <p class="small" style="margin:0">Endereço base: <code>${esc(base)}</code>. Envie o token no cabeçalho <code>Authorization: Bearer SEU_TOKEN</code>. Limite: 120 requisições por minuto por token. Respostas em JSON.</p>
        <span class="label">Listar leads do Funil Lead</span>${ex(`curl -H "Authorization: Bearer SEU_TOKEN" "${base}/leads?funil=lead"`)}
        <span class="label">Criar lead (ex.: vindo do site ou do Kommo)</span>${ex(`curl -X POST -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" \\\n  -d '{"nome":"Maria Souza","telefone":"81999990000","unidade":"Recife","origem":"Site","tratamento":"Invisalign","kommo_lead_id":"12345"}' \\\n  "${base}/leads"`)}
        <span class="label">Mudar de etapa (ex.: compareceu → Funil Cliente)</span>${ex(`curl -X PATCH -H "Authorization: Bearer SEU_TOKEN" -H "Content-Type: application/json" \\\n  -d '{"etapa":"orcamento","valor_apresentado":8900}' "${base}/leads/ID_DO_LEAD"`)}
        <p class="small" style="margin:0">Etapas do <b>Funil Lead</b>: novo, contato, agendado, faltou, perdido. Etapas do <b>Funil Cliente</b>: orcamento (compareceu), fechado, nao_fechou.</p>
        <span class="label">Outras rotas</span>${ex(`GET  ${base}/leads/{id ou kommo_lead_id}\nGET  ${base}/tratamentos?situacao=andamento|laboratorio|concluido\nGET  ${base}/funil?mes=AAAA-MM&unidade=Recife\nPOST ${base}/mensagens  {"telefone":"81999990000","nome":"Maria","texto":"Oi!","autor":"cliente"}`)}
        <span class="label">Webhooks</span>
        <p class="small" style="margin:0">O Alinha envia um POST em JSON <code>{"id","evento","criado_em","dados"}</code> para o endereço cadastrado. Confira a assinatura no cabeçalho <code>X-Alinha-Assinatura: sha256=…</code> (HMAC-SHA256 do corpo com o segredo do webhook). Eventos: ${Object.keys((INTEG && INTEG.eventos) || {}).map((k) => `<code>${esc(k)}</code>`).join(", ") || "lead.criado, lead.etapa, cliente.compareceu, cliente.fechou, cliente.nao_fechou, tratamento.etapa, mensagem.recebida"}.</p>
      </div></div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
  }

  /* ------------------------------------------------------------ */
  /* Probabilidade de fechamento (termômetro) e alerta do dia        */
  /* ------------------------------------------------------------ */
  const probDe = (p) => (typeof p.prontidao === "number" && !p.temp ? p.prontidao : ({ quente: 85, morno: 55, frio: 20 })[tempDe(p)] ?? 35);
  const emAberto = (p) => (p.status === "lead" && !["perdido"].includes(p.etapa)) || p.status === "aberto";
  const altaChance = () => PAC.filter((p) => emAberto(p) && probDe(p) >= 70).sort((a, b) => probDe(b) - probDe(a));
  const mediaChance = () => PAC.filter((p) => emAberto(p) && probDe(p) >= 40 && probDe(p) < 70);
  function abrirAlerta() {
    const alta = altaChance(), media = mediaChance();
    const linha = (p) => { const tel = telIntl(p.telefone), dec = p.decisor ? ` · decide: ${esc(p.decisor)}` : "", hor = p.melhorHorario ? ` · ⏰ ${esc(p.melhorHorario)}` : "";
      return `<div class="it" data-pid="${p.id}"><span class="tdot t-${tempDe(p)}" aria-hidden="true"></span><span class="grow"><b>${esc(p.nome)}</b> <span class="pill bad">${probDe(p)}%</span><span class="tiny dim"> · ${esc(ETAPA[etapaDe(p)].nome)}${dec}${hor}</span></span>${tel ? `<a class="btn sm" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp</a>` : ""}<button class="btn sm" data-afich="1">Ficha</button></div>`; };
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer" role="dialog" aria-label="Alerta do dia">
      <div class="row"><div class="grow"><h2 style="font-size:21px">🔥 Alerta do dia</h2><div class="small dim">Pacientes com maior probabilidade de fechamento (pelo termômetro)</div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="kpis" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div class="kpi hl"><div class="label">Alta chance</div><b class="num">${alta.length}</b><span>quentes · 70% ou mais</span></div><div class="kpi"><div class="label">Média chance</div><b class="num">${media.length}</b><span>mornos · 40% a 69%</span></div><div class="kpi"><div class="label">Em aberto</div><b class="num">${PAC.filter(emAberto).length}</b><span>leads e orçamentos</span></div></div>
      <div class="card stack"><span class="label">Fale primeiro com estes</span><div class="lista-int" id="alLista">${alta.length ? alta.slice(0, 12).map(linha).join("") : `<span class="small dim">Nenhum paciente quente agora. Use a bolinha do termômetro nos cartões do CRM para classificar.</span>`}</div></div>
      <div class="row"><button class="btn pri" id="alCrm">Abrir o CRM</button><span class="grow"></span><span class="tiny dim">Aparece uma vez por dia ao abrir o app.</span></div></div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta;
    $("#alCrm").onclick = () => { fecharGaveta(); mostrar("crm"); };
    $("#alLista").addEventListener("click", (e) => { const it = e.target.closest("[data-pid]"); if (!it || e.target.closest("a")) return; const p = PAC.find((x) => x.id === it.dataset.pid); if (p) (ehCliente(p) ? abrirGaveta : abrirCard)(p); });
  }
  function alertaAoAbrir() {
    if (!pode("crm") || !altaChance().length) return;
    const hoje = new Date().toISOString().slice(0, 10);
    if (ls.get("alinha.alertaDia", "") === hoje) return;
    ls.set("alinha.alertaDia", hoje); abrirAlerta();
  }

  /* ------------------------------------------------------------ */
  /* Versículo do dia (rodapé)                                      */
  /* ------------------------------------------------------------ */
  const VERSICULOS = [
    ["Tudo posso naquele que me fortalece.", "Filipenses 4:13"],
    ["Entrega o teu caminho ao Senhor, confia nele, e ele tudo fará.", "Salmos 37:5"],
    ["Consagre ao Senhor tudo o que você faz, e os seus planos serão bem-sucedidos.", "Provérbios 16:3"],
    ["Tudo quanto fizerdes, fazei-o de todo o coração, como ao Senhor.", "Colossenses 3:23"],
    ["Não te mandei eu? Esforça-te e tem bom ânimo; não temas, porque o Senhor teu Deus é contigo.", "Josué 1:9"],
    ["Os que esperam no Senhor renovarão as suas forças; subirão com asas como águias.", "Isaías 40:31"],
    ["O Senhor é o meu pastor; nada me faltará.", "Salmos 23:1"],
    ["Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele.", "Salmos 118:24"],
    ["Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", "Provérbios 3:5"],
    ["E não nos cansemos de fazer o bem, porque a seu tempo ceifaremos, se não desfalecermos.", "Gálatas 6:9"],
    ["Sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.", "Romanos 8:28"],
    ["Lancem sobre ele toda a sua ansiedade, porque ele tem cuidado de vocês.", "1 Pedro 5:7"],
    ["Alegrai-vos na esperança, sede pacientes na tribulação, perseverai na oração.", "Romanos 12:12"],
    ["O coração alegre aformoseia o rosto.", "Provérbios 15:13"],
    ["Deem graças em todas as circunstâncias.", "1 Tessalonicenses 5:18"],
    ["O amor é paciente, o amor é bondoso.", "1 Coríntios 13:4"],
    ["As misericórdias do Senhor se renovam a cada manhã; grande é a tua fidelidade.", "Lamentações 3:22-23"],
    ["Bem-aventurados os mansos, porque herdarão a terra.", "Mateus 5:5"],
    ["Assim brilhe a vossa luz diante dos homens, para que vejam as vossas boas obras.", "Mateus 5:16"],
    ["Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", "Mateus 11:28"],
    ["A resposta branda desvia o furor.", "Provérbios 15:1"],
    ["Seja a vossa palavra sempre agradável, temperada com sal.", "Colossenses 4:6"],
    ["Em tudo dai graças, porque esta é a vontade de Deus.", "1 Tessalonicenses 5:18"],
    ["O Senhor te abençoe e te guarde.", "Números 6:24"],
    ["Se Deus é por nós, quem será contra nós?", "Romanos 8:31"],
    ["A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.", "Hebreus 11:1"],
    ["Pois eu sei os planos que tenho para vocês, planos de fazê-los prosperar.", "Jeremias 29:11"],
    ["Mil cairão ao teu lado, e dez mil à tua direita, mas tu não serás atingido.", "Salmos 91:7"],
    ["Aquele que começou a boa obra em vós há de completá-la.", "Filipenses 1:6"],
    ["Cada um exerça o dom que recebeu para servir os outros.", "1 Pedro 4:10"],
    ["Melhor é serem dois do que um, porque têm melhor paga do seu trabalho.", "Eclesiastes 4:9"]
  ];
  function versiculoDoDia() {
    const d = new Date(), ini = new Date(d.getFullYear(), 0, 0), dia = Math.floor((d - ini) / DIA);
    const [t, ref] = VERSICULOS[dia % VERSICULOS.length];
    $$(".versiculo").forEach((el) => { el.innerHTML = `<span>“${esc(t)}”</span><b>${esc(ref)}</b>`; el.title = `${t} (${ref})`; });
  }


  // Pop-up do versículo: para cada operador, uma vez por dia, ao abrir o app (ou ao trocar quem está atendendo)
  const chaveOperador = () => eu() || "_" + (PLAT ? papel() : "demo");
  const versiculoVisto = () => ls.get("alinha.versiculoVisto", {})[chaveOperador()] === hojeISO();
  function marcarVersiculo() { const m = ls.get("alinha.versiculoVisto", {}); Object.keys(m).forEach((k) => { if (m[k] !== hojeISO()) delete m[k]; }); m[chaveOperador()] = hojeISO(); ls.set("alinha.versiculoVisto", m); }
  function abrirVersiculo(depois) {
    const d = new Date(), ini = new Date(d.getFullYear(), 0, 0), dia = Math.floor((d - ini) / DIA);
    const [t, ref] = VERSICULOS[dia % VERSICULOS.length];
    const h = d.getHours(), saud = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
    renderEu(); const opts = $("#euSel") ? $("#euSel").innerHTML : "";
    const host = $("#popHost");
    host.innerHTML = `<div class="pop-veil" id="popVeil"><div class="pop" role="dialog" aria-modal="true" aria-labelledby="popTit">
      <div class="pop-cruz" aria-hidden="true">✝</div>
      <div class="pop-saud" id="popTit">${saud}${eu() ? ", " + esc(eu()) : ""}!</div>
      <div class="tiny dim">Palavra do dia · ${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</div>
      <blockquote class="pop-vers">“${esc(t)}”<cite>${esc(ref)}</cite></blockquote>
      <label class="pop-eu"><span>Quem está atendendo agora?</span><select class="in" id="popEu">${opts}</select></label>
      <button class="btn pri" id="popOk">Amém · Começar o dia</button></div></div>`;
    const fechar = () => { const v = $("#popEu").value; if (v !== eu()) { ls.set("alinha.eu", v); renderEu(); if (vista === "whatsapp") renderWA(); } marcarVersiculo(); host.innerHTML = ""; if (depois) depois(); };
    $("#popOk").onclick = fechar; $("#popOk").focus();
    $("#popVeil").addEventListener("click", (e) => { if (e.target.id === "popVeil") fechar(); });
    host.querySelector(".pop").addEventListener("keydown", (e) => { if (e.key === "Escape") fechar(); });
  }
  function aoAbrirApp() { if (!versiculoVisto()) abrirVersiculo(alertaAoAbrir); else alertaAoAbrir(); }

  /* ------------------------------------------------------------ */
  /* Quem está atendendo (CRC) — usado como CRC do lead e no prontuário */
  /* ------------------------------------------------------------ */
  const eu = () => ls.get("alinha.eu", "");
  function renderEu() {
    const el = $("#euSel"); if (!el) return;
    const nomes = [...new Set(crcsCadastradas().map((x) => x.nome).concat(setores().flatMap((x) => x.pessoas || [])).concat(doutores()).concat(AJ.equipe || []))].filter(Boolean);
    el.innerHTML = `<option value="">— escolha —</option>` + nomes.map((n) => `<option${n === eu() ? " selected" : ""}>${esc(n)}</option>`).join("");
  }
  $("#euSel").addEventListener("change", (e) => { ls.set("alinha.eu", e.target.value); toast(e.target.value ? `Atendendo como ${e.target.value}` : "Atendente removido"); if (vista === "whatsapp") renderWA(); if (e.target.value && !versiculoVisto()) abrirVersiculo(); });
  const doutores = () => { const d = (AJ.doutores || []).filter(Boolean); if (d.length) return d; const e = (AJ.equipe || []).filter((n) => /^dr/i.test(n)); return e.length ? e : ["Dr. Edelweiss"]; };

  // Ajustes › CRCs e metas individuais
  function renderCrcsAjustes() {
    const el = $("#crcLista"); if (!el) return;
    const L = (AJ.crcs || []).length ? AJ.crcs : [];
    el.innerHTML = L.map((x, i) => crcLinha(x, i)).join("") || `<span class="small dim">Nenhuma CRC cadastrada.</span>`;
    $("#aDoutores").value = doutores().join(", ");
  }
  const crcLinha = (x, i) => { const M = x.metas || {}; return `<div class="crcrow" data-i="${i}"><input class="in" data-c="nome" value="${esc(x.nome || "")}" placeholder="Nome da CRC" aria-label="Nome da CRC">
    <input class="in num" data-c="agendamentos" value="${M.agendamentos || ""}" placeholder="agend." inputmode="numeric" aria-label="Meta de agendamentos"><input class="in num" data-c="comparecimentos" value="${M.comparecimentos || ""}" placeholder="compar." inputmode="numeric" aria-label="Meta de comparecimentos">
    <input class="in num" data-c="fechamentos" value="${M.fechamentos || ""}" placeholder="fech." inputmode="numeric" aria-label="Meta de fechamentos"><input class="in num" data-c="faturamento" value="${M.faturamento || ""}" placeholder="R$" inputmode="decimal" aria-label="Meta de faturamento">
    <button class="btn sm ghost" data-crcdel aria-label="Remover CRC">✕</button></div>`; };
  const lerCrcs = () => $$("#crcLista .crcrow").map((r) => { const v = (k) => $(`[data-c="${k}"]`, r).value.trim(); const n = (k) => num(v(k)) || null;
    return { nome: v("nome"), metas: { agendamentos: n("agendamentos"), comparecimentos: n("comparecimentos"), fechamentos: n("fechamentos"), faturamento: n("faturamento") } }; }).filter((x) => x.nome);
  $("#crcBox").addEventListener("click", async (e) => {
    if (e.target.closest("#btnCrcAdd")) { const L = lerCrcs().concat({ nome: "", metas: {} }); $("#crcLista").innerHTML = L.map(crcLinha).join(""); const ins = $$("#crcLista [data-c=nome]"); ins[ins.length - 1].focus(); return; }
    const d = e.target.closest("[data-crcdel]"); if (d) { d.closest(".crcrow").remove(); return; }
    if (e.target.closest("#btnCrcSalvar")) {
      try { await Store.ajustes({ crcs: lerCrcs(), doutores: $("#aDoutores").value.split(",").map((s) => s.trim()).filter(Boolean) }); $("#crcStatus").textContent = "✓ Salvo"; renderEu(); render(); }
      catch (er) { $("#crcStatus").textContent = "Erro: " + er.message; }
    }
  });

  /* ------------------------------------------------------------ */
  /* Chat: palavras negativadas e correção ortográfica               */
  /* ------------------------------------------------------------ */
  const NEG_PADRAO = [["barato", "acessível"], ["desconto", "condição especial"], ["promoção", "condição especial"], ["garantido", "previsível"], ["garantia de resultado", "planejamento previsível"], ["preço", "investimento"], ["caro", "investimento"], ["problema", "situação"], ["contrato", "plano de tratamento"], ["infelizmente", "no momento"], ["não sei", "vou confirmar"], ["impossível", "vou verificar uma alternativa"]];
  const CORR_PADRAO = { vc: "você", vcs: "vocês", voce: "você", voces: "vocês", q: "que", tbm: "também", tb: "também", tambem: "também", pq: "porque", obg: "obrigado", obgd: "obrigado", nao: "não", ja: "já", ate: "até", entao: "então", sao: "são", estao: "estão", vao: "vão", tao: "tão",
    horario: "horário", horarios: "horários", endereco: "endereço", clinica: "clínica", avaliacao: "avaliação", orcamento: "orçamento", orcamentos: "orçamentos", cartao: "cartão", otimo: "ótimo", otima: "ótima", possivel: "possível", disponivel: "disponível", disponiveis: "disponíveis",
    amanha: "amanhã", manha: "manhã", proxima: "próxima", proximo: "próximo", numero: "número", informacao: "informação", informacoes: "informações", duvida: "dúvida", duvidas: "dúvidas", simulacao: "simulação", ortodontico: "ortodôntico", invisivel: "invisível", consultorio: "consultório", odontologico: "odontológico",
    concerteza: "com certeza", derrepente: "de repente", porisso: "por isso", seje: "seja", esteje: "esteja", menas: "menos", excessao: "exceção", previlegio: "privilégio", agradeco: "agradeço", blz: "beleza", msg: "mensagem", hj: "hoje", td: "tudo", cmg: "comigo", ctz: "certeza", dps: "depois", flw: "até logo", vlw: "obrigado" };
  const negativas = () => ((AJ.palavrasNegativas && AJ.palavrasNegativas.length) ? AJ.palavrasNegativas : NEG_PADRAO.map(([p, s]) => ({ p, s })));
  const modoCorrecao = () => (AJ.correcao && AJ.correcao.modo) || "sugerir";
  const dicionario = () => Object.assign({}, CORR_PADRAO, Object.fromEntries(((AJ.correcao && AJ.correcao.extras) || []).map((x) => [norm(x.e), x.c])));
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reNeg = (p) => new RegExp(`(^|[^\\p{L}])(${reEsc(p)})(?=$|[^\\p{L}])`, "iu");
  function negativasNoTexto(txt) { return negativas().filter((x) => x.p && reNeg(x.p).test(txt)); }
  function correcoesNoTexto(txt) {
    const D = dicionario(), out = [];
    txt.replace(/[\p{L}]+/gu, (w) => { const k = norm(w).replace(/ /g, ""); if (D[k] && D[k] !== w && D[k].toLowerCase() !== w.toLowerCase() && !out.some((o) => o.de === w)) out.push({ de: w, para: w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase() ? D[k][0].toUpperCase() + D[k].slice(1) : D[k] }); return w; });
    return out;
  }
  const trocarPalavra = (txt, de, para) => txt.replace(new RegExp(`(^|[^\\p{L}])${reEsc(de)}(?=$|[^\\p{L}])`, "gu"), (m, a) => a + para);
  function avisosComposer() {
    const ta = $("#waTexto"), box = $("#waAvisos"); if (!ta || !box) return;
    const txt = ta.value, neg = negativasNoTexto(txt), corr = modoCorrecao() === "sugerir" ? correcoesNoTexto(txt) : [];
    box.innerHTML = (neg.length ? `<div class="aviso-neg">⚠️ Evite: ${neg.map((x) => `<button class="chipx" data-neg="${esc(x.p)}" data-sug="${esc(x.s || "")}" title="Trocar por “${esc(x.s || "")}”"><s>${esc(x.p)}</s>${x.s ? ` → ${esc(x.s)}` : ""}</button>`).join("")}</div>` : "")
      + (corr.length ? `<div class="aviso-corr">✎ Correção: ${corr.map((x) => `<button class="chipx" data-de="${esc(x.de)}" data-para="${esc(x.para)}">${esc(x.de)} → <b>${esc(x.para)}</b></button>`).join("")}${corr.length > 1 ? `<button class="btn sm" data-corrtodas>Corrigir tudo</button>` : ""}</div>` : "");
    if (ultimaCorrecao && txt.includes(ultimaCorrecao.para)) box.insertAdjacentHTML("afterbegin", `<div class="aviso-corr">✓ Corrigido: ${esc(ultimaCorrecao.de)} → <b>${esc(ultimaCorrecao.para)}</b> <button class="btn sm" data-desfazer>Desfazer</button></div>`);
    box.classList.toggle("hide", !box.innerHTML);
  }
  // correção automática: ao terminar a palavra (espaço ou pontuação), troca e mostra "desfazer"
  let ultimaCorrecao = null;
  function autoCorrigir(ta, e) {
    if (modoCorrecao() !== "auto" || !e || !/^[\s.,!?;:]$/.test(e.data || "")) return;
    const pos = ta.selectionStart, antes = ta.value.slice(0, pos - 1), m = antes.match(/([\p{L}]+)$/u); if (!m) return;
    const w = m[1], c = correcoesNoTexto(w)[0]; if (!c) return;
    const ini = pos - 1 - w.length;
    ta.value = ta.value.slice(0, ini) + c.para + ta.value.slice(pos - 1);
    const np = ini + c.para.length + 1; ta.setSelectionRange(np, np);
    ultimaCorrecao = { de: w, para: c.para, ini };
  }
  $("#wa").addEventListener("click", (e) => {
    const ta = $("#waTexto"); if (!ta) return;
    const n = e.target.closest("[data-neg]"), c = e.target.closest("[data-de]");
    if (n && n.dataset.sug) { ta.value = ta.value.replace(new RegExp(`(^|[^\\p{L}])${reEsc(n.dataset.neg)}(?=$|[^\\p{L}])`, "giu"), (m, a) => a + n.dataset.sug); }
    else if (c) ta.value = trocarPalavra(ta.value, c.dataset.de, c.dataset.para);
    else if (e.target.closest("[data-corrtodas]")) correcoesNoTexto(ta.value).forEach((x) => { ta.value = trocarPalavra(ta.value, x.de, x.para); });
    else if (e.target.closest("[data-desfazer]") && ultimaCorrecao) { const u = ultimaCorrecao; ta.value = ta.value.slice(0, u.ini) + u.de + ta.value.slice(u.ini + u.para.length); ultimaCorrecao = null; }
    else return;
    WA.rascunho[WA.sel] = ta.value; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.focus();
  }, true);
  // Ajustes › Chat
  function renderChatAjustes() {
    const el = $("#negLista"); if (!el) return;
    el.innerHTML = negativas().map((x) => `<div class="negrow"><input class="in" data-n="p" value="${esc(x.p)}" aria-label="Palavra negativada"><span class="dim">→</span><input class="in" data-n="s" value="${esc(x.s || "")}" placeholder="sugestão (opcional)" aria-label="Sugestão"><button class="btn sm ghost" data-negdel aria-label="Remover">✕</button></div>`).join("");
    $$("#corrModo button").forEach((b) => b.classList.toggle("on", b.dataset.m === modoCorrecao()));
    $("#corrExtras").value = ((AJ.correcao && AJ.correcao.extras) || []).map((x) => `${x.e} = ${x.c}`).join("\n");
  }
  $("#chatBox").addEventListener("click", async (e) => {
    if (e.target.closest("#btnNegAdd")) { $("#negLista").insertAdjacentHTML("beforeend", `<div class="negrow"><input class="in" data-n="p" placeholder="palavra" aria-label="Palavra negativada"><span class="dim">→</span><input class="in" data-n="s" placeholder="sugestão (opcional)" aria-label="Sugestão"><button class="btn sm ghost" data-negdel aria-label="Remover">✕</button></div>`); const i = $$("#negLista [data-n=p]"); i[i.length - 1].focus(); return; }
    const d = e.target.closest("[data-negdel]"); if (d) { d.closest(".negrow").remove(); return; }
    const m = e.target.closest("#corrModo [data-m]"); if (m) { $$("#corrModo button").forEach((b) => b.classList.toggle("on", b === m)); return; }
    if (e.target.closest("#btnChatSalvar")) {
      const neg = $$("#negLista .negrow").map((r) => ({ p: $("[data-n=p]", r).value.trim(), s: $("[data-n=s]", r).value.trim() })).filter((x) => x.p);
      const extras = $("#corrExtras").value.split("\n").map((l) => l.split("=")).filter((x) => x.length === 2 && x[0].trim() && x[1].trim()).map(([a, b]) => ({ e: a.trim(), c: b.trim() }));
      const modo = ($("#corrModo .on") || {}).dataset ? $("#corrModo .on").dataset.m : "sugerir";
      try { await Store.ajustes({ palavrasNegativas: neg, correcao: { modo, extras } }); $("#chatStatus").textContent = "✓ Salvo"; } catch (er) { $("#chatStatus").textContent = "Erro: " + er.message; }
    }
    if (e.target.closest("#btnNegPadrao")) { AJ.palavrasNegativas = null; renderChatAjustes(); }
  });


  /* ------------------------------------------------------------ */
  /* Setores do atendimento e transferência de conversa             */
  /* ------------------------------------------------------------ */
  const SETORES_PADRAO = [{ id: "comercial", nome: "Comercial", pessoas: [] }, { id: "financeiro", nome: "Financeiro", pessoas: [] }, { id: "operacional", nome: "Operacional", pessoas: [] }];
  const setores = () => (Array.isArray(AJ.setores) && AJ.setores.length ? AJ.setores : SETORES_PADRAO);
  const setorNome = (id) => (setores().find((x) => x.id === id) || {}).nome || id || "";
  const slugSetor = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "setor";
  const quemSetor = (x) => (x && x.setor ? setorNome(x.setor) + (x.pessoa ? " · " + x.pessoa : "") : "");
  function passaSetor(lead) {
    const f = WA.fSetor; if (!f) return true; const x = WA.setor[lead];
    if (f === "@eu") return !!(x && eu() && x.pessoa === eu());
    if (f === "@sem") return !x || !x.setor;
    return !!(x && x.setor === f);
  }
  function filtroSetorHTML() {
    const n = (f) => WA.conversas.filter((c) => { const o = WA.fSetor; WA.fSetor = f; const r = passaSetor(c.lead); WA.fSetor = o; return r; }).length;
    return `<select class="in setor-f" id="waSetorF" aria-label="Filtrar por setor"><option value="">Todos os setores</option>${eu() ? `<option value="@eu"${WA.fSetor === "@eu" ? " selected" : ""}>Comigo (${esc(eu())}) · ${n("@eu")}</option>` : ""}${setores().map((x) => `<option value="${esc(x.id)}"${WA.fSetor === x.id ? " selected" : ""}>${esc(x.nome)} · ${n(x.id)}</option>`).join("")}<option value="@sem"${WA.fSetor === "@sem" ? " selected" : ""}>Sem setor · ${n("@sem")}</option></select>`;
  }
  const setorTag = (lead) => { const x = WA.setor[lead]; return x && x.setor ? `<span class="st${eu() && x.pessoa === eu() ? " meu" : ""}" title="Setor responsável">${esc(quemSetor(x))}</span>` : ""; };
  const setorPill = (lead) => { const x = WA.setor[lead]; return `<span class="pill setor-pill" title="Setor responsável pela conversa">🏷 ${x && x.setor ? esc(quemSetor(x)) : "Sem setor"}</span>`; };
  const comTransf = (lead, msgs) => msgs.concat((WA.transf[lead] || []).map((t) => Object.assign({ _tr: true }, t))).sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const transfHTML = (t) => `<div class="transf" role="note"><span>⇄ Transferida ${t.de ? `de <b>${esc(quemSetor({ setor: t.de, pessoa: t.deP }))}</b> ` : ""}para <b>${esc(quemSetor(t))}</b>${t.por ? ` · por ${esc(t.por)}` : ""} · ${hora(t.ts)}</span>${t.nota ? `<i>“${esc(t.nota)}”</i>` : ""}</div>`;
  $("#waAssuntos").addEventListener("change", (e) => { if (e.target.id === "waSetorF") { WA.fSetor = e.target.value; renderWA(); } });

  function abrirTransferir(lead) {
    const i = WA.info[lead] || {}, atual = WA.setor[lead] || {};
    let esc0 = atual.setor && setores().some((x) => x.id === atual.setor) ? atual.setor : setores()[0].id;
    const pessoasHTML = (id) => { const st = setores().find((x) => x.id === id) || { pessoas: [] };
      return `<option value="">Qualquer pessoa do setor</option>` + (st.pessoas || []).map((n) => `<option${n === atual.pessoa && id === atual.setor ? " selected" : ""}>${esc(n)}</option>`).join(""); };
    $("#drawerHost").innerHTML = `<div class="veil" id="veil"><div class="drawer pequeno" role="dialog" aria-label="Transferir conversa">
      <div class="row"><div class="grow"><h2 style="font-size:21px">⇄ Transferir conversa</h2><div class="small dim">${esc(i.nome || "Lead " + lead)} · agora com <b>${esc(quemSetor(atual) || "nenhum setor")}</b></div></div><button class="btn sm ghost" id="btnFechar" aria-label="Fechar">✕</button></div>
      <div class="card stack"><span class="label">Para qual setor?</span>
        <div class="chips" id="trSetores">${setores().map((x) => `<button data-st="${esc(x.id)}" class="${x.id === esc0 ? "on" : ""}">${esc(x.nome)}</button>`).join("")}</div>
        <label class="f" for="trPessoa">Quem vai atender</label><select class="in" id="trPessoa">${pessoasHTML(esc0)}</select>
        <label class="f" for="trNota">Recado para quem recebe (opcional)</label><textarea class="in" id="trNota" rows="3" placeholder="Ex.: quer simular o parcelamento; prefere falar à noite."></textarea>
        <p class="tiny dim" style="margin:0">Os nomes de cada setor são cadastrados em Ajustes › Chat. A transferência fica registrada na conversa${PAC.some((x) => x.leadId && String(x.leadId) === String(lead)) ? " e no prontuário" : ""}.</p></div>
      <div class="row"><button class="btn pri" id="trOk">⇄ Transferir</button><button class="btn ghost" id="trCancelar">Cancelar</button></div></div></div>`;
    $("#veil").addEventListener("click", (e) => { if (e.target.id === "veil") fecharGaveta(); });
    $("#btnFechar").onclick = fecharGaveta; $("#trCancelar").onclick = fecharGaveta;
    $("#trSetores").addEventListener("click", (e) => { const b = e.target.closest("[data-st]"); if (!b) return; esc0 = b.dataset.st; $$("#trSetores button").forEach((x) => x.classList.toggle("on", x === b)); $("#trPessoa").innerHTML = pessoasHTML(esc0); });
    $("#trOk").onclick = async () => {
      const pessoa = $("#trPessoa").value, nota = $("#trNota").value.trim(), por = eu() || (PLAT ? PAPEL_NOME[papel()] || "" : "");
      if (atual.setor === esc0 && (atual.pessoa || "") === pessoa) { toast("A conversa já está com " + quemSetor(atual)); return; }
      let t = { setor: esc0, pessoa, de: atual.setor || "", deP: atual.pessoa || "", por, nota, ts: new Date().toISOString() };
      if (waModoReal()) {
        try { t = (await api("POST", "api/whatsapp/transferir", { lead, setor: esc0, pessoa, nota, por })).transferencia || t; } catch (er) { toast("Não foi possível transferir: " + er.message); return; }
      }
      WA.setor[lead] = { setor: t.setor, pessoa: t.pessoa }; (WA.transf[lead] = WA.transf[lead] || []).push(t);
      if (!waModoReal()) ls.set("alinha.wa.setor", { setor: WA.setor, transf: WA.transf });
      const px = PAC.find((x) => x.leadId && String(x.leadId) === String(lead));
      if (px) { prontuario(px, `WhatsApp: conversa transferida para ${quemSetor(t)}${nota ? ` (${nota})` : ""}`, t.ts); try { await Store.salvar(px); } catch (er) { /* fica no próximo salvamento */ } }
      fecharGaveta(); toast(`Conversa transferida para ${quemSetor(t)}`); renderWA();
    };
  }

  // Ajustes › Chat › Setores do atendimento
  function renderSetoresAjustes() {
    const el = $("#setLista"); if (!el) return;
    el.innerHTML = setores().map(setorLinha).join("");
  }
  const setorLinha = (x) => `<div class="setrow" data-id="${esc(x.id || "")}"><input class="in" data-s="n" value="${esc(x.nome || "")}" placeholder="Setor" aria-label="Nome do setor"><input class="in" data-s="p" value="${esc((x.pessoas || []).join(", "))}" placeholder="Nomes (separe por vírgula)" aria-label="Pessoas do setor ${esc(x.nome || "")}"><button class="btn sm ghost" data-setdel="1" aria-label="Remover setor">✕</button></div>`;
  $("#setBox").addEventListener("click", async (e) => {
    if (e.target.closest("#btnSetAdd")) { $("#setLista").insertAdjacentHTML("beforeend", setorLinha({ nome: "", pessoas: [] })); $("#setLista .setrow:last-child input").focus(); return; }
    const d = e.target.closest("[data-setdel]"); if (d) { d.closest(".setrow").remove(); return; }
    if (e.target.closest("#btnSetSalvar")) {
      const usados = new Set();
      const lista = $$("#setLista .setrow").map((r) => { const nome = $("[data-s=n]", r).value.trim(); if (!nome) return null; let id = r.dataset.id || slugSetor(nome); while (usados.has(id)) id += "-2"; usados.add(id);
        return { id, nome, pessoas: [...new Set($("[data-s=p]", r).value.split(",").map((n) => n.trim()).filter(Boolean))] }; }).filter(Boolean);
      if (!lista.length) { $("#setStatus").textContent = "Cadastre pelo menos um setor."; return; }
      try { await Store.ajustes({ setores: lista }); $("#setStatus").textContent = "✓ Salvo"; renderSetoresAjustes(); renderEu(); } catch (er) { $("#setStatus").textContent = "Erro: " + er.message; }
    }
  });

  /* ------------------------------------------------------------ */
  /* Verificação em duas etapas (Google Authenticator)              */
  /* ------------------------------------------------------------ */
  async function renderSeguranca() {
    const el = $("#segEstado"); if (!el) return;
    if (!PLAT) { el.textContent = "disponível na plataforma (com login)"; $("#seg2fa").innerHTML = `<p class="small dim" style="margin:0">Na demonstração não há login. Na plataforma, cada perfil pode ativar o código de 6 números do Google Authenticator.</p>`; return; }
    try {
      const d = await api("GET", "api/seguranca");
      el.textContent = d.ativo ? "✓ ativada" : "desativada"; el.className = "pill " + (d.ativo ? "good" : "");
      $("#seg2fa").innerHTML = d.ativo
        ? `<p class="small" style="margin:0">O perfil <b>${esc(PAPEL_NOME[d.papel] || d.papel)}</b> pede o código de 6 números do Google Authenticator a cada login.</p><div class="row"><input class="in num" id="segCodDes" placeholder="código atual" inputmode="numeric" maxlength="7" style="width:150px"><button class="btn" id="btnSegDes">Desativar</button></div>`
        : `<p class="small" style="margin:0">Proteja o acesso: além da senha, o login pede um código de 6 números que muda a cada 30 segundos no celular.</p><button class="btn pri" id="btnSegIni">Ativar com o Google Authenticator</button>`;
      if (d.perfis) $("#segPerfis").innerHTML = `<span class="label">Situação dos perfis</span>` + Object.entries(d.perfis).map(([r, at]) => `<div class="it"><b class="grow">${esc(PAPEL_NOME[r])}</b><span class="pill ${at ? "good" : ""}">${at ? "ativada" : "desativada"}</span>${at && r !== d.papel ? `<button class="btn sm ghost" data-segres="${r}">Desativar (perdeu o celular)</button>` : ""}</div>`).join("");
    } catch (e) { el.textContent = "erro"; }
  }
  $("#segBox").addEventListener("click", async (e) => {
    if (e.target.closest("#btnSegIni")) {
      const d = await api("POST", "api/seguranca/2fa/iniciar", {});
      $("#seg2fa").innerHTML = `<ol class="small" style="margin:0 0 0 18px;padding:0"><li>Instale o <b>Google Authenticator</b> no celular.</li><li>Toque em <b>+</b> › <b>Ler código QR</b> e aponte para o código abaixo.</li><li>Digite os 6 números que aparecerem.</li></ol>
        <div class="row" style="align-items:flex-start"><div class="qrmini" id="segQr"></div><div class="grow stack" style="gap:6px"><span class="tiny dim">Sem câmera? Digite a chave:</span><code style="word-break:break-all">${esc(d.segredo.replace(/(.{4})/g, "$1 ").trim())}</code>
        <input class="in num" id="segCod" placeholder="000000" inputmode="numeric" maxlength="7" style="width:150px;letter-spacing:.2em"><button class="btn pri" id="btnSegAtv">Confirmar e ativar</button><span class="small" id="segErr" style="color:var(--bad)"></span></div></div>`;
      try { const q = qrcode(0, "M"); q.addData(d.uri); q.make(); $("#segQr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 2 }); } catch (er) { $("#segQr").textContent = "QR indisponível"; }
      return;
    }
    if (e.target.closest("#btnSegAtv")) { try { await api("POST", "api/seguranca/2fa/ativar", { codigo: $("#segCod").value }); toast("Verificação em duas etapas ativada"); renderSeguranca(); } catch (er) { $("#segErr").textContent = er.message; } return; }
    if (e.target.closest("#btnSegDes")) { try { await api("POST", "api/seguranca/2fa/desativar", { codigo: $("#segCodDes").value }); toast("Verificação em duas etapas desativada"); renderSeguranca(); } catch (er) { toast(er.message); } return; }
    const r = e.target.closest("[data-segres]"); if (r) { if (r.dataset.c !== "1") { r.dataset.c = "1"; r.textContent = "Confirmar"; return; } try { await api("POST", "api/seguranca/2fa/desativar", { papel: r.dataset.segres }); toast("Desativada para " + PAPEL_NOME[r.dataset.segres]); renderSeguranca(); } catch (er) { toast(er.message); } }
  });

  /* fotos do WhatsApp (círculo) */
  function avaHTML(nome, foto, extra = "") {
    const ini = esc(iniciais(nome || "?"));
    return foto ? `<span class="ava foto ${extra}"><img src="${esc(foto)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.remove('foto');this.parentNode.textContent='${ini}'"></span>` : `<div class="ava ${extra}">${ini}</div>`;
  }

  /* ------------------------------------------------------------ */
  /* Decisor do pagamento, melhor horário, CRC e doutor (ficha)      */
  /* ------------------------------------------------------------ */
  const RELACOES = ["O próprio paciente", "Cônjuge", "Pai ou mãe", "Noivo(a)", "Filho(a)", "Outro"];
  const HORARIOS = ["Manhã (8h–12h)", "Almoço (12h–14h)", "Tarde (14h–18h)", "Noite (18h–21h)", "Qualquer horário"];
  function decisorResumo(p) {
    const linhas = [];
    if (p.decisor || p.decisorTel) { const tel = telIntl(p.decisorTel);
      linhas.push(`💳 Decide o pagamento: <b>${esc(p.decisor || "—")}</b>${p.decisorRel && p.decisorRel !== "O próprio paciente" ? ` (${esc(p.decisorRel)})` : ""}${p.decisorTel ? ` · ${esc(p.decisorTel)}` : ""}${tel ? ` <a class="btn sm" href="https://wa.me/${tel}" target="_blank" rel="noopener">WhatsApp do decisor</a>` : ""}`); }
    if (p.melhorHorario) linhas.push(`⏰ Melhor horário para contato: <b>${esc(p.melhorHorario)}</b>`);
    const resp = [p.crc ? `CRC: <b>${esc(p.crc)}</b>` : "", (p.drAvaliacao || "") ? `avaliação: <b>${esc(p.drAvaliacao)}</b>` : "", ...[...new Set((p.trabalhos || []).map((t) => t.dr).filter(Boolean))].map((d) => `tratamento: <b>${esc(d)}</b>`)].filter(Boolean);
    if (resp.length) linhas.push(`👤 ${resp.join(" · ")}`);
    return linhas.length ? `<div class="decisor">${linhas.join("<br>")}</div>` : "";
  }
  function camposContatoHTML(p, x) {
    const sel = (id, ops, at, vazio) => `<select class="in" id="${x}${id}">${(vazio ? [""] : []).concat(ops).map((o) => `<option value="${esc(o)}"${o === at ? " selected" : ""}>${esc(o || vazio || "")}</option>`).join("")}</select>`;
    const crcs = crcsCadastradas().map((c) => c.nome); if (p.crc && !crcs.includes(p.crc)) crcs.push(p.crc);
    const drs = doutores().slice(); const dav = p.drAvaliacao || ""; if (dav && !drs.includes(dav)) drs.push(dav);
    return `<div class="duo"><div><label class="f" for="${x}DecRel">Quem decide o pagamento</label>${sel("DecRel", RELACOES, p.decisorRel || "", "— não informado —")}</div><div><label class="f" for="${x}DecNome">Nome do decisor</label><input class="in" id="${x}DecNome" value="${esc(p.decisor || "")}"></div></div>
      <div class="duo"><div><label class="f" for="${x}DecTel">Telefone do decisor</label><input class="in" id="${x}DecTel" inputmode="tel" value="${esc(p.decisorTel || "")}"></div><div><label class="f" for="${x}Horario">Melhor horário para contato</label>${sel("Horario", HORARIOS, p.melhorHorario || "", "— não informado —")}</div></div>
      <div class="duo"><div><label class="f" for="${x}Crc">CRC que atendeu</label>${sel("Crc", crcs, p.crc || "", "— escolha —")}</div><div><label class="f" for="${x}DrAv">Doutor da avaliação</label>${sel("DrAv", drs, dav, "— escolha —")}</div></div>`;
  }
  function lerContato(p, x) {
    const v = (id) => ($(`#${x}${id}`) || {}).value;
    const antes = { crc: p.crc || "", dr: p.drAvaliacao || "", dec: p.decisor || "" };
    p.decisorRel = v("DecRel") || ""; p.decisor = (v("DecNome") || "").trim(); p.decisorTel = (v("DecTel") || "").trim(); p.melhorHorario = v("Horario") || ""; p.crc = v("Crc") || ""; p.drAvaliacao = v("DrAv") || "";
    if (p.crc !== antes.crc && p.crc) prontuario(p, `Atendido pela CRC ${p.crc}`, new Date().toISOString());
    if (p.drAvaliacao !== antes.dr && p.drAvaliacao) prontuario(p, `Direcionado para ${p.drAvaliacao} (avaliação)`, new Date().toISOString());
    if (p.decisor !== antes.dec && p.decisor) prontuario(p, `Decisor do pagamento: ${p.decisor}${p.decisorRel ? " (" + p.decisorRel + ")" : ""}`, new Date().toISOString());
  }
  // "o próprio paciente" preenche nome e telefone do decisor
  function ligarContato(p, x, aoMudar) {
    const rel = $(`#${x}DecRel`); if (!rel) return;
    rel.addEventListener("change", () => { if (rel.value === "O próprio paciente") { if (!$(`#${x}DecNome`).value) $(`#${x}DecNome`).value = p.nome || ($("#lNome") || {}).value || ""; if (!$(`#${x}DecTel`).value) $(`#${x}DecTel`).value = p.telefone || ($("#lTel") || {}).value || ""; } });
    if (aoMudar) ["DecRel", "DecNome", "DecTel", "Horario", "Crc", "DrAv"].forEach((id) => $(`#${x}${id}`).addEventListener("change", aoMudar));
  }

  /* ------------------------------------------------------------ */
  /* Navegação e início                                            */
  /* ------------------------------------------------------------ */
  let vista = "hoje";
  function mostrar(v) {
    if (!pode(v)) v = ["hoje", "whatsapp", "comercial", "consulta", "followup", "ajustes"].find((x) => pode(x)) || "ajustes";
    vista = v;
    $$("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
    const atual = $(`#nav button[data-v="${v}"]`); $("#navMais").classList.toggle("on", !!atual && !atual.classList.contains("prim"));
    $$(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
    render(); window.scrollTo({ top: 0 });
  }
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "navMais") { const ab = $("#nav").classList.toggle("aberto"); b.setAttribute("aria-expanded", ab); return; }
    $("#nav").classList.remove("aberto"); $("#navMais").setAttribute("aria-expanded", "false"); mostrar(b.dataset.v);
  });
  function render() {
    if (!$("#bannerDemo").dataset.fixo) $("#bannerDemo").classList.toggle("hide", !PAC.some((p) => p.exemplo));
    renderHoje();
    if (vista === "followup") renderFollowup();
    if (vista === "briefings") renderBriefings();
    if (vista === "ajustes") renderAjustes();
    if (vista === "whatsapp") renderWA();
    if (vista === "resultados") renderResultados();
    if (vista === "comercial") renderComercial();
    if (vista === "crm") renderPipeline();
    if (vista === "campanhas") renderCampanhas();
    if (vista === "tratamentos") renderTratamentos();
    if (vista === "suporte") renderSuporte();
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
    const nv = (n) => `<div class="nov"><b>Versão ${n.v}</b> <span class="dim small">· ${n.data}</span><ul>${n.itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`;
    $("#atNovidades").innerHTML = NOVIDADES.slice(0, 1).map(nv).join("") + (NOVIDADES.length > 1 ? `<details class="small"><summary>Versões anteriores</summary>${NOVIDADES.slice(1).map(nv).join("")}</details>` : "");
    $("#btnBackup").classList.toggle("hide", !PLAT || !pode("exportar"));
  }

  async function iniciar() {
    aplicarTema(ls.get("alinha.tema", "auto"));
    renderMomento(); renderTermo(); renderMetodo();
    if (location.protocol !== "file:") {
      try { const r = await fetch("api/config", { headers: { Accept: "application/json" } }); if (r.ok) { const d = await r.json(); if (d.plataforma) { PLAT = d; if (d.versao) VERSAO = d.versao; } } } catch (e) { /* sem servidor: modo demonstração */ }
    }
    const ehAdmin = !PLAT || PLAT.papel === "admin";
    document.body.classList.toggle("perfil-equipe", !ehAdmin);
    aplicarPermissoes();
    iniciarAbas();
    $("#modoInfo").innerHTML = (PLAT ? `${PAPEL_NOME[papel()] || "Equipe"} · IA ${PLAT.ia ? "ativa" : "desligada"}<br><a href="sair" style="color:inherit">Sair</a>` : "Modo demonstração") + `<br><span style="opacity:.7">Weiss Odontologia · v${VERSAO}</span>`;
    renderAtualizacoes();
    if (PLAT) { verificarAtualizacao(false); setInterval(() => verificarAtualizacao(false), 5 * 60 * 1000); }
    carregarConversas().then(() => { if (vista === "whatsapp") renderWA(); });
    if (waModoReal()) setInterval(pollWA, 6000);
    if (PLAT && PLAT.dadosPersistentes === false && PLAT.papel === "admin") {
      const bn = $("#bannerDemo"); bn.innerHTML = "⚠️ O banco de dados não está conectado: os dados são temporários e podem se perder. Na Vercel, conecte o Upstash Redis (Storage) e publique de novo."; bn.classList.remove("hide"); bn.dataset.fixo = "1";
    }
    $("#pillIA").textContent = PLAT && PLAT.ia ? "IA ouvindo + roteiro" : "Dicas do roteiro";
    try { await Store.carregar(); } catch (e) { toast("Não foi possível carregar os dados: " + e.message); }
    aplicarUnidades(); renderAjustes(); mostrar(vista);
    versiculoDoDia(); renderEu(); setTimeout(aoAbrirApp, 400);
  }
  iniciar();
})();
