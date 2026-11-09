/* Dados de DEMONSTRAÇÃO do Alinha — pacientes e consulta fictícios.
   Servem para conhecer o sistema sem gravar nada. Podem ser apagados em Ajustes. */
window.ALINHA_DEMO = (function () {
  const diasAtras = (n, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
  const toques = (...feitos) => Object.fromEntries(feitos.map(([d, st, n]) => [d, { status: st, em: diasAtras(n) }]));

  const pacientes = () => [
    { id: "ex1", exemplo: true, prontidao: 48, nome: "Larissa Menezes", telefone: "(81) 90000-1001", unidade: "Recife", tratamento: "Aparelho ortodôntico", valorApresentado: 6200, status: "aberto", responsavel: "Renata", profissional: "Dra. Paula", consultaEm: diasAtras(8),
      dor: "dente torto na frente que aparece quando sorri", evento: "", decisor: "o pai", objecoes: ["decisor"], oQueTravou: "Decide com o pai", palavras: ["meu pai que vai ver isso comigo", "eu evito sorrir em foto"],
      toques: toques([0, "enviado", 8], [1, "enviado", 7], [3, "enviado", 5]) },
    { id: "ex2", exemplo: true, prontidao: 55, nome: "Bianca Rocha", telefone: "(81) 90000-1002", unidade: "Caruaru", tratamento: "Invisalign", valorApresentado: 12900, status: "aberto", responsavel: "Renata", profissional: "Dr. Edelweiss", consultaEm: diasAtras(4),
      dor: "dentes de baixo apinhados", evento: "formatura em março", decisor: "", objecoes: ["preco"], oQueTravou: "Valor da parcela", palavras: ["passou do que eu tinha separado", "queria muito estar com o sorriso pronto na formatura"],
      toques: toques([0, "enviado", 4], [1, "enviado", 3]) },
    { id: "ex3", exemplo: true, prontidao: 62, nome: "Tatiane Alves", telefone: "(81) 90000-1003", unidade: "Caruaru", tratamento: "Invisalign", valorApresentado: 8400, status: "aberto", responsavel: "Joana", profissional: "Dr. Edelweiss", consultaEm: diasAtras(7),
      dor: "diastema entre os dentes da frente", evento: "casamento em maio", decisor: "noivo", objecoes: ["pensar", "decisor"], oQueTravou: "Vai pensar com o noivo", palavras: ["vou conversar com o Thiago e te aviso", "o casamento é em maio"],
      toques: toques([0, "enviado", 7], [1, "enviado", 6], [3, "pulado", 4]) },
    { id: "ex4", exemplo: true, prontidao: 35, nome: "Igor Barros", telefone: "(81) 90000-1004", unidade: "Recife", tratamento: "Aparelho fixo estético", valorApresentado: 1800, status: "aberto", responsavel: "Joana", profissional: "Dra. Paula", consultaEm: diasAtras(1),
      dor: "mordida cruzada", evento: "", decisor: "", objecoes: ["tempo"], oQueTravou: "Medo de demorar", palavras: ["quanto tempo eu vou ficar com isso?"],
      toques: toques([0, "enviado", 1]) },
    { id: "ex5", exemplo: true, prontidao: 44, nome: "Rogério Lins", telefone: "(81) 90000-1005", unidade: "Caruaru", tratamento: "Invisalign", valorApresentado: 11100, status: "aberto", responsavel: "Renata", profissional: "Dr. Edelweiss", consultaEm: diasAtras(3),
      dor: "dentes tortos que atrapalham a mastigação", evento: "", decisor: "esposa", objecoes: ["concorrente"], oQueTravou: "Comparando com outra clínica", palavras: ["vi um orçamento mais em conta", "eu quero algo que ninguém perceba"],
      toques: toques([0, "enviado", 3]) },
    { id: "ex6", exemplo: true, prontidao: 72, nome: "Davi Coelho", telefone: "(81) 90000-1006", unidade: "Recife", tratamento: "Invisalign", valorApresentado: 5400, status: "aberto", responsavel: "Dr. Edelweiss", profissional: "Dr. Edelweiss", consultaEm: diasAtras(0),
      dor: "dentes da frente sobrepostos", evento: "", decisor: "", objecoes: ["medo"], oQueTravou: "Medo de dor", palavras: ["eu tenho pavor de dentista, sério"], toques: {} },
    { id: "ex7", exemplo: true, prontidao: 20, nome: "Sônia Prado", telefone: "(81) 90000-1007", unidade: "Caruaru", tratamento: "Contenção / finalização", valorApresentado: 2400, status: "aberto", responsavel: "Joana", profissional: "Dra. Paula", consultaEm: diasAtras(18),
      dor: "dentes voltaram a entortar depois do aparelho antigo", evento: "", decisor: "", objecoes: ["pensar"], oQueTravou: "Sem urgência", palavras: ["não é prioridade agora"],
      toques: toques([0, "enviado", 18], [1, "enviado", 17], [3, "enviado", 15], [7, "enviado", 11]) },
    { id: "ex8", exemplo: true, prontidao: 90, nome: "Letícia Moraes", telefone: "(81) 90000-1008", unidade: "Recife", tratamento: "Invisalign", valorApresentado: 9800, valorFechado: 9800, status: "fechado", recuperado: true, responsavel: "Renata", profissional: "Dr. Edelweiss", consultaEm: diasAtras(9), fechadoEm: diasAtras(2),
      dor: "sorriso torto", evento: "", decisor: "", objecoes: ["preco"], oQueTravou: "Parcela", palavras: [], toques: toques([0, "enviado", 9], [1, "enviado", 8], [3, "enviado", 6], [7, "respondeu", 2]) },
    { id: "ex9", exemplo: true, prontidao: 95, nome: "Caio Bezerra", telefone: "(81) 90000-1009", unidade: "Caruaru", tratamento: "Invisalign", valorApresentado: 13200, valorFechado: 13200, status: "fechado", responsavel: "Dr. Edelweiss", profissional: "Dr. Edelweiss", consultaEm: diasAtras(5), fechadoEm: diasAtras(5),
      dor: "", evento: "", decisor: "", objecoes: [], oQueTravou: "", palavras: [], toques: {} }
  ];

  // Consulta simulada (≈ 2 minutos, acelerada)
  const consulta = {
    paciente: { nome: "Priscila Andrade", telefone: "(81) 90000-1010", unidade: "Caruaru" },
    falas: [
      { quem: "profissional", texto: "Oi, Priscila! Que bom te receber. Me conta: o que te fez procurar a gente agora?" },
      { quem: "paciente", texto: "Então, doutor, eu tenho vergonha de sorrir nas fotos. Os dentes da frente são tortos e isso me incomoda há anos." },
      { quem: "profissional", texto: "Entendi. E tem alguma data importante chegando?" },
      { quem: "paciente", texto: "Vou casar em maio do ano que vem. Queria estar com o sorriso bonito no casamento." },
      { quem: "profissional", texto: "Vamos fazer o escaneamento com o iTero, você vai ver seu sorriso em 3D e uma simulação de como pode ficar." },
      { quem: "paciente", texto: "Nossa, que diferente! Mas isso dói? Eu tenho um pouco de medo." },
      { quem: "profissional", texto: "Não dói nada, é uma câmera que passa nos dentes. Olha aqui a simulação do resultado." },
      { quem: "paciente", texto: "Meu Deus, ficou lindo. É exatamente isso que eu queria." },
      { quem: "profissional", texto: "Pelo seu caso, recomendo o Invisalign. O investimento fica em 12 mil reais, em até 12 vezes." },
      { quem: "paciente", texto: "Hum... passou do que eu tinha separado. Uma amiga fez em outro lugar por menos.",
        dica: { rotulo: "Objeção de preço", tipo: "objecao", dica: "Segure o desconto. Descubra o que ela está comparando e traduza o valor em parcela até o casamento." } },
      { quem: "profissional", texto: "Entendo. Nesse outro orçamento estava incluído o planejamento digital e todas as consultas de acompanhamento?" },
      { quem: "paciente", texto: "Acho que não, era só o aparelho. Mas eu preciso ver com meu noivo, a gente tá juntando dinheiro pro casamento." },
      { quem: "profissional", texto: "Faz sentido. Se dependesse só de você, você começaria?" },
      { quem: "paciente", texto: "Começaria sim. E quando eu conseguiria começar?",
        dica: { rotulo: "Sinal de compra", tipo: "sinal_compra", dica: "Ela quer começar! Ofereça duas datas de início e diga qual é o próximo passo." } },
      { quem: "profissional", texto: "Consigo iniciar na próxima semana. Podemos fazer uma entrada de 4 mil e o restante parcelado. Que tal trazer seu noivo na quinta para ver a simulação?" },
      { quem: "paciente", texto: "Pode ser na quinta à tarde. Vou trazer ele, sim." }
    ],
    briefing: {
      paciente: "Priscila", manchete: "Saiu animada, mas não fechou: decide com o noivo e achou o valor acima do esperado. Retorno marcado para quinta, com ele.",
      desfecho: "negociacao", desfecho_detalhe: "volta quinta com o noivo", valor_apresentado: 12000, valor_fechado: null, tratamento: "Invisalign",
      o_que_travou: "Decide com o noivo", o_que_travou_detalhe: "O dinheiro do casal está reservado para o casamento.",
      proximo_passo: "Confirmar quinta à tarde com o noivo e preparar a simulação", proximo_passo_quem: "Comercial", proximo_passo_prazo_dias: 1,
      aconteceu: {
        por_que_veio: "Vergonha de sorrir nas fotos: dentes da frente tortos há anos. Casa em maio.",
        o_que_o_exame_mostrou: "Escaneamento iTero com simulação. Ela se emocionou: \"é exatamente isso que eu queria\".",
        o_que_foi_proposto: "Invisalign, R$ 12.000 em até 12x; depois, entrada de R$ 4.000 + parcelas e início na próxima semana.",
        como_terminou: "Comparou com o preço de uma amiga, citou o orçamento do casamento e marcou quinta com o noivo."
      },
      avaliacao: [
        { etapa: "Investigação", nivel: "bem", resumo: "Descobriu a dor emocional e o prazo (casamento).", por_que_pesa: "Dor e prazo dão motivo para decidir agora.", como_fazer: "Continue assim: anote as palavras exatas dela para usar no follow-up." },
        { etapa: "Apresentação", nivel: "atencao", resumo: "Mostrou a simulação, mas falou o preço logo em seguida.", por_que_pesa: "Sem resumir o valor antes, o preço soa alto.", como_fazer: "\"Com o Invisalign você chega no casamento com o sorriso que viu na simulação, discreto e com acompanhamento até o fim. O investimento é…\"" },
        { etapa: "Objeções", nivel: "bem", resumo: "Isolou a objeção do noivo com \"se dependesse só de você\".", por_que_pesa: "Separar a vontade dela do decisor mostra que o desejo existe.", como_fazer: "Mantenha. Na quinta, comece pela simulação, não pelo preço." },
        { etapa: "Fechamento", nivel: "melhorar", resumo: "Não ofereceu reservar a data de início.", por_que_pesa: "Sem compromisso, a decisão esfria até quinta.", como_fazer: "\"Posso já reservar sua data de início na próxima semana? Se o Thiago não concordar na quinta, a gente libera.\"" }
      ],
      objecoes: ["preco", "concorrente", "decisor", "medo"],
      palavras_do_paciente: ["tenho vergonha de sorrir nas fotos", "vou casar em maio", "é exatamente isso que eu queria", "a gente tá juntando dinheiro pro casamento"],
      dor: "vergonha de sorrir nas fotos por causa dos dentes da frente tortos", evento: "casamento em maio", decisor: "noivo", nota: 7
    }
  };

  return { pacientes, consulta };
})();
