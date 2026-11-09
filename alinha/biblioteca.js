/* =====================================================================
   ROTEIRO DO COPILOTO DE CONSULTA — Weiss Odontologia
   ---------------------------------------------------------------------
   Este arquivo concentra TODO o conteúdo de orientação (etapas, falas,
   objeções, sinais de compra e mensagens de WhatsApp). Para mudar o que
   aparece na tela, edite apenas aqui — não é preciso mexer no app.js.

   Variáveis que podem ser usadas dentro das falas:
     {nome}        primeiro nome do paciente
     {profissional} nome configurado em Configurações
     {unidade}     Caruaru ou Recife
     {endereco}    endereço da unidade escolhida
     {telefone_unidade}  WhatsApp da unidade
     {valor} {parcelas} {entrada} {tratamento}  dados do orçamento
     {dor}         dor principal anotada na Descoberta
     {condicao} {validade} {garantia}  cadastrados em Configurações
     {evento}      data/evento importante anotado na Descoberta
   ===================================================================== */

window.ROTEIRO = {

  unidades: {
    Caruaru: {
      endereco: "R. dos Expedicionários, 104, 1º Andar, Nossa Sra. das Dores - Caruaru/PE, CEP 55002-440",
      whatsapp: "(81) 99836-8491",
      fixo: "(81) 3721-2866",
      email: "caruaru@odontoweiss.com.br"
    },
    Recife: {
      endereco: "Av. República do Líbano, 251 - Torre 1 - Sala 1614 - Pina, Recife/PE, CEP 51110-160",
      whatsapp: "(81) 97318-5005",
      fixo: "(81) 3091-1895",
      email: "recife@odontoweiss.com.br"
    }
  },

  /* ------------------------------------------------------------------
     ETAPAS DA CONSULTA (na ordem em que acontecem)
     Cada fala pode ter "wa" (versão curta para WhatsApp). Se não tiver,
     a mesma fala serve para os dois canais.
     ------------------------------------------------------------------ */
  etapas: [
    {
      id: "preparo",
      nome: "Preparação",
      icone: "📋",
      objetivo: "Chegar na conversa já sabendo quem é o paciente, de onde veio e o que ele busca.",
      checklist: [
        "Li a ficha / histórico do lead no Kommo",
        "Sei a origem do contato (Instagram, indicação, Google, anúncio…)",
        "Tenho escaneamento ou fotos anteriores, se houver",
        "Simulação de sorriso pronta para mostrar (se já escaneou)",
        "Sei se há outra pessoa que decide junto (cônjuge, pais)"
      ],
      falas: [],
      perguntas: [],
      dicas: [
        "Paciente que veio por indicação já chega com confiança: pergunte quem indicou e cite a pessoa.",
        "No WhatsApp, responda o primeiro contato em até 5 minutos — a chance de agendar cai muito depois disso."
      ]
    },
    {
      id: "acolhimento",
      nome: "Acolhimento",
      icone: "🤝",
      objetivo: "Criar conexão e conseguir permissão para conduzir a conversa.",
      checklist: [
        "Me apresentei pelo nome e chamei o paciente pelo nome",
        "Pedi autorização para gravar (presencial) — ou dispensei",
        "Perguntei o que motivou a procura agora"
      ],
      falas: [
        {
          rotulo: "Abertura",
          texto: "Olá, {nome}! Tudo bem? Eu sou {profissional}, da Weiss Odontologia em {unidade}. Que bom falar com você!",
          wa: "Olá, {nome}! Tudo bem? 😊 Aqui é da Weiss Odontologia, unidade {unidade}. Que bom que você nos chamou!"
        },
        {
          rotulo: "Pedido para gravar (presencial)",
          texto: "Para eu não perder nenhum detalhe do que você me contar, posso gravar o áudio da nossa conversa? Ele fica apenas no seu prontuário, e se você preferir que eu não grave, tudo bem também.",
          canal: "presencial"
        },
        {
          rotulo: "Abrir a conversa",
          texto: "Antes de eu te explicar qualquer coisa, me conta: o que te fez procurar a gente agora?",
          wa: "Pra eu te ajudar da melhor forma, me conta: o que te fez procurar a gente agora? 🙂"
        },
        {
          rotulo: "Quando veio por indicação",
          texto: "Que legal que veio por indicação! Quem te indicou? Fico muito feliz quando um paciente nosso confia a gente a alguém próximo."
        }
      ],
      perguntas: [],
      dicas: [
        "Fale menos, escute mais: nesta fase o paciente deve falar 70% do tempo.",
        "No WhatsApp, prefira um áudio curto (até 40s) na primeira resposta: gera proximidade."
      ]
    },
    {
      id: "descoberta",
      nome: "Descoberta",
      icone: "🔎",
      objetivo: "Descobrir a dor real, a motivação emocional, o prazo e quem decide. É aqui que o fechamento é construído.",
      checklist: [
        "Dor principal identificada (anotei nas Notas)",
        "Motivação emocional (autoestima, trabalho, fotos, evento)",
        "Prazo ou evento importante",
        "Experiência anterior com aparelho",
        "Preferência estética (invisível x fixo)",
        "Quem decide junto"
      ],
      falas: [
        {
          rotulo: "Confirmar a dor (espelhar)",
          texto: "Deixa eu ver se entendi: o que mais te incomoda hoje é {dor}, e isso já vem te incomodando há um tempo. É isso?"
        }
      ],
      perguntas: [
        "O que mais te incomoda hoje no seu sorriso?",
        "Há quanto tempo isso te incomoda?",
        "Em que momentos você mais percebe isso? Fotos, trabalho, sorrir em público?",
        "Você já usou aparelho antes? Como foi a experiência?",
        "Se a gente resolvesse isso, o que mudaria na sua vida?",
        "Tem alguma data importante pela frente? Casamento, formatura, viagem?",
        "Você tem preferência por um tratamento mais discreto, invisível?",
        "Além de você, mais alguém participa dessa decisão?"
      ],
      dicas: [
        "Anote as palavras exatas do paciente: na apresentação, use as mesmas palavras dele.",
        "Se o paciente perguntar preço aqui, use a fala de 'Preço antes do diagnóstico' (aparece automaticamente no painel ao vivo).",
        "Perguntou quem decide e é outra pessoa? Convide essa pessoa para a consulta ou para uma chamada de vídeo."
      ]
    },
    {
      id: "diagnostico",
      nome: "Check-up digital (iTero)",
      icone: "🦷",
      objetivo: "Transformar a dor em algo visível: escaneamento 3D e simulação do resultado.",
      checklist: [
        "Expliquei o check-up digital com o iTero",
        "Mostrei o sorriso em 3D na tela",
        "Apontei os pontos que causam a dor que ele relatou",
        "Mostrei a simulação do sorriso final",
        "Perguntei o que ele achou da simulação"
      ],
      falas: [
        {
          rotulo: "Apresentar o check-up digital",
          texto: "Aqui a gente faz o check-up digital com o scanner iTero: em poucos minutos temos seu sorriso em 3D, sem aquela massinha desconfortável. E o melhor: você já consegue ver uma simulação de como pode ficar o seu sorriso.",
          wa: "Aqui na Weiss a gente faz o check-up digital com o scanner iTero 🦷✨ Em poucos minutos você vê seu sorriso em 3D, sem massinha, e ainda uma simulação de como ele pode ficar. Quer agendar o seu na unidade {unidade}?"
        },
        {
          rotulo: "Conectar o 3D com a dor",
          texto: "Olha aqui, {nome}: está vendo esse ponto? É exatamente isso que causa {dor}, que você me contou. Agora olha como fica na simulação."
        },
        {
          rotulo: "Pergunta de impacto",
          texto: "O que você sentiu vendo o seu sorriso assim?"
        },
        {
          rotulo: "Convite para agendar (WhatsApp)",
          texto: "O primeiro passo é o check-up digital: você sai sabendo exatamente o que precisa, vê a simulação do seu sorriso e já recebe o plano com valores. Tenho horário {dia} às {hora} ou {dia2} às {hora2} em {unidade}. Qual fica melhor pra você?",
          canal: "whatsapp"
        }
      ],
      perguntas: [
        "O que você achou de ver o seu sorriso em 3D?",
        "Era assim que você imaginava o resultado?",
        "Numa escala de 0 a 10, quanto você quer chegar nesse sorriso?"
      ],
      dicas: [
        "Depois de mostrar a simulação, fique em silêncio e deixe o paciente reagir.",
        "Não prometa resultado garantido: fale em 'simulação' e 'planejamento' (orientação ética do CFO)."
      ]
    },
    {
      id: "solucao",
      nome: "Apresentação da solução",
      icone: "💡",
      objetivo: "Recomendar UM caminho, ligado à dor e à motivação que o paciente contou.",
      checklist: [
        "Retomei a dor e a motivação com as palavras do paciente",
        "Recomendei um tratamento (no máximo 2 opções)",
        "Expliquei os benefícios que importam PARA ELE",
        "Falei da nossa experiência (especialista, mestre, pioneiros Invisalign em Caruaru)",
        "Expliquei como funciona o tratamento e as consultas"
      ],
      falas: [
        {
          rotulo: "Recomendação",
          texto: "Pelo que você me contou — {dor} — e pelo que vimos no seu escaneamento, o caminho que eu recomendo pra você é o {tratamento}."
        },
        {
          rotulo: "Benefícios do Invisalign",
          texto: "Com o Invisalign você usa alinhadores transparentes, praticamente invisíveis. Você tira para comer, então come o que quiser, escova e passa fio normalmente, e não tem aquela emergência de bráquete que solta. As consultas também são mais espaçadas."
        },
        {
          rotulo: "Autoridade",
          texto: "A gente foi pioneiro no Invisalign aqui em Caruaru e eu sou especialista e mestre em Ortodontia. Então você vai ser acompanhado do planejamento até o resultado final por quem trabalha com isso todos os dias."
        },
        {
          rotulo: "Como funciona",
          texto: "Funciona assim: a partir do seu escaneamento, a gente planeja cada movimento dos dentes. Você recebe os alinhadores, troca de tempos em tempos, e vem aqui para eu acompanhar a evolução. Você vai vendo o sorriso mudar aos poucos."
        },
        {
          rotulo: "Checagem",
          texto: "Faz sentido pra você esse caminho? Ficou alguma dúvida sobre como funciona?"
        }
      ],
      perguntas: [
        "Desses benefícios, qual é o mais importante pra você?",
        "Você se vê usando os alinhadores no seu dia a dia?"
      ],
      dicas: [
        "Muitas opções confundem e adiam a decisão. Recomende com segurança.",
        "Use a data/evento que o paciente citou: 'começando agora, você chega no {evento} já com o tratamento bem adiantado'."
      ]
    },
    {
      id: "investimento",
      nome: "Investimento",
      icone: "💳",
      objetivo: "Apresentar o valor com segurança, depois de o paciente já ter visto o valor do tratamento.",
      checklist: [
        "Resumi o que ele vai conquistar antes de falar o preço",
        "Disse o que está incluído",
        "Apresentei o valor e a condição de pagamento",
        "Fiz uma pergunta e fiquei em silêncio esperando a resposta"
      ],
      falas: [
        {
          rotulo: "Resumo de valor (antes do preço)",
          texto: "Então, recapitulando: com o {tratamento} a gente resolve {dor}, de forma discreta, com acompanhamento do início ao fim, e você já viu na simulação onde a gente quer chegar."
        },
        {
          rotulo: "Apresentar o valor",
          texto: "O investimento no seu tratamento completo fica em {valor}. Isso já inclui o planejamento digital, os alinhadores e todas as consultas de acompanhamento. E dá pra fazer com entrada de {entrada} e o restante em {parcelas}."
        },
        {
          rotulo: "Pergunta após o preço",
          texto: "Isso cabe no seu planejamento?"
        },
        {
          rotulo: "Orçamento por WhatsApp",
          texto: "{nome}, segue o resumo do seu plano 😊\n\n🦷 Tratamento: {tratamento}\n💰 Investimento: {valor}\n💳 Condição: entrada de {entrada} + {parcelas}\n\nInclui planejamento digital, alinhadores e consultas de acompanhamento. Posso já reservar o seu horário para começarmos?",
          canal: "whatsapp"
        }
      ],
      perguntas: [],
      dicas: [
        "Depois de falar o valor: SILÊNCIO. Quem fala primeiro depois do preço costuma ceder.",
        "Fale o valor olhando nos olhos, sem pedir desculpas e sem 'infelizmente'.",
        "Prefira falar em valor da parcela quando o paciente for sensível a preço."
      ]
    },
    {
      id: "objecoes",
      nome: "Objeções",
      icone: "🛡️",
      objetivo: "Entender a objeção verdadeira e responder com empatia. Método: Ouvir → Validar → Isolar → Responder → Confirmar.",
      checklist: [
        "Ouvi a objeção até o fim, sem interromper",
        "Validei o sentimento (\"entendo, faz sentido\")",
        "Isolei: \"além disso, tem mais alguma coisa?\"",
        "Respondi e confirmei se ficou resolvido"
      ],
      falas: [
        {
          rotulo: "Isolar a objeção",
          texto: "Entendo, faz todo sentido. Além disso, tem mais alguma coisa que te deixa em dúvida? Se a gente resolvesse isso, você começaria?"
        },
        {
          rotulo: "Confirmar",
          texto: "Ficou mais claro agora? Isso resolve a sua dúvida?"
        }
      ],
      perguntas: [],
      dicas: [
        "As respostas para cada objeção aparecem automaticamente no painel ao vivo quando o paciente fala ou escreve algo parecido.",
        "Abra a aba 'Objeções' para ver a biblioteca completa e pesquisar."
      ]
    },
    {
      id: "fechamento",
      nome: "Fechamento",
      icone: "✅",
      objetivo: "Conduzir para a decisão e transformar o 'sim' em agendamento e pagamento.",
      checklist: [
        "Fiz a pergunta de fechamento",
        "Definimos forma de pagamento",
        "Agendei o início (escaneamento / instalação)",
        "Expliquei os próximos passos",
        "Registrei no Kommo"
      ],
      falas: [
        {
          rotulo: "Fechamento por alternativa",
          texto: "Você prefere começar já nesta semana ou na próxima?"
        },
        {
          rotulo: "Forma de pagamento",
          texto: "Pra você o que fica melhor: cartão parcelado ou entrada mais parcelas?"
        },
        {
          rotulo: "Fechamento por resumo",
          texto: "Então ficamos assim: {tratamento}, investimento de {valor}, com entrada de {entrada} e {parcelas}. Vou já reservar o seu horário para darmos início. Combinado?"
        },
        {
          rotulo: "Fechamento pelo evento",
          texto: "Se a gente começar agora, você chega no {evento} com o tratamento bem adiantado. Vamos garantir o seu horário?"
        },
        {
          rotulo: "Condição especial com prazo",
          texto: "{nome}, tem mais uma coisa que eu quero te falar: até {validade}, estamos com uma condição especial: {condicao}. Depois disso essa condição não vale mais, tá bom?",
          requer: "condicao"
        },
        {
          rotulo: "Por que essa condição existe",
          texto: "E por que a gente faz isso? Porque a gente confia muito no nosso planejamento digital e quer que você comece logo, enquanto a vontade de mudar o sorriso está aí. Não faz sentido você esperar mais.",
          requer: "condicao"
        },
        {
          rotulo: "Segurança para decidir (reversão de risco)",
          texto: "E pra você decidir tranquilo(a): {garantia}",
          requer: "garantia"
        },
        {
          rotulo: "Credibilidade",
          texto: "A Weiss tem uma história construída em Caruaru e Recife, a gente foi pioneira do Invisalign em Caruaru, e eu não te recomendaria nada que não fizesse sentido pro seu caso. Você está em boas mãos."
        },
        {
          rotulo: "Boas-vindas (WhatsApp)",
          texto: "Seja muito bem-vindo(a) à Weiss Odontologia, {nome}! 🎉 Seu início está marcado. Qualquer dúvida, é só chamar aqui. Vamos juntos nessa transformação do seu sorriso! 😁",
          canal: "whatsapp"
        }
      ],
      perguntas: [],
      dicas: [
        "Sinal de compra (pergunta de prazo, pagamento, horário)? Pare de apresentar e feche.",
        "Depois do 'sim', não volte a falar do tratamento: siga para agenda e pagamento.",
        "Condição com prazo: use SOMENTE se for verdadeira e estiver cadastrada em Configurações. Prazo inventado destrói a confiança do paciente.",
        "Garantia: nunca garanta resultado clínico (o Código de Ética Odontológica não permite). Dê segurança no PROCESSO: devolução do sinal antes de iniciar, valor do check-up abatido no tratamento etc."
      ]
    },
    {
      id: "posconsulta",
      nome: "Pós-consulta / Follow-up",
      icone: "📆",
      objetivo: "Se não fechou hoje, sair com data e hora marcadas para o próximo contato.",
      checklist: [
        "Combinei dia e hora do próximo contato",
        "Enviei o resumo do orçamento por WhatsApp",
        "Registrei resultado, objeções e próximo passo no Kommo",
        "Agendei os follow-ups (D+1, D+3, D+7)"
      ],
      falas: [
        {
          rotulo: "Combinar retorno",
          texto: "Perfeito, {nome}. Pra eu não te deixar sem resposta: posso te chamar na {dia} às {hora} pra gente conversar sobre a sua decisão?"
        }
      ],
      perguntas: [],
      dicas: [
        "Nunca termine com 'qualquer coisa me chama'. Termine com data e hora combinadas.",
        "As mensagens de follow-up prontas estão na aba 'Mensagens'."
      ]
    }
  ],

  /* ------------------------------------------------------------------
     BIBLIOTECA DE OBJEÇÕES
     "gatilhos" são trechos de texto que, quando aparecem na fala ou na
     mensagem do paciente, fazem a resposta surgir no painel ao vivo.
     ------------------------------------------------------------------ */
  objecoes: [
    {
      id: "preco",
      titulo: "Está caro / não tenho condições",
      gatilhos: ["caro", "muito dinheiro", "nao tenho condic", "nao tenho como pagar", "valor alto", "salgado", "puxado", "fora do orcamento", "apertado", "sem dinheiro", "muito alto"],
      entender: "Caro em relação a quê? Ao valor percebido, ao concorrente ou à parcela que cabe no mês?",
      respostas: [
        "Entendo, é um investimento importante e faz sentido você pensar com cuidado. Me ajuda a entender: o que pesa mais pra você, o valor total ou o valor da parcela?",
        "Se a gente encontrar uma forma de pagamento que caiba no seu mês, isso resolveria pra você?",
        "Pensa comigo: é um tratamento que você faz uma vez e leva pra vida toda. Dividindo pelo tempo de tratamento, fica em torno de {parcelas}. E você já viu na simulação o resultado que quer alcançar."
      ],
      proximo: "Ofereça condição de pagamento alternativa (entrada menor, mais parcelas) antes de pensar em desconto."
    },
    {
      id: "pensar",
      titulo: "Vou pensar",
      gatilhos: ["vou pensar", "pensar melhor", "preciso pensar", "vou ver", "depois eu", "te aviso", "te dou um retorno", "mais pra frente", "outra hora", "mais adiante", "ver direitinho"],
      entender: "'Vou pensar' quase nunca é sobre pensar: geralmente é preço, insegurança ou outra pessoa que decide.",
      respostas: [
        "Claro, é uma decisão importante. Pra eu te ajudar a pensar: o que exatamente ficou em dúvida? É mais a questão do valor, do tratamento em si ou de conversar com alguém?",
        "Perfeito. De 0 a 10, quanto você quer fazer esse tratamento? … O que falta pra chegar no 10?",
        "Sem problema! Pra eu não te deixar sem resposta, posso te chamar na {dia} às {hora}?"
      ],
      proximo: "Descubra a objeção real. Se não conseguir, saia com data e hora do retorno combinadas."
    },
    {
      id: "decisor",
      titulo: "Preciso falar com marido / esposa / pais",
      gatilhos: ["meu marido", "minha esposa", "minha mulher", "meu esposo", "meu namorado", "minha namorada", "meus pais", "minha mae", "meu pai", "falar com ele", "falar com ela", "conversar em casa", "ver com ele", "ver com ela", "ver com meu", "ver com minha"],
      entender: "A decisão é compartilhada. A outra pessoa não viu o que o paciente viu.",
      respostas: [
        "Ótimo, faz todo sentido decidir junto. E você, se dependesse só de você, começaria?",
        "Que tal a gente fazer uma chamada de vídeo rapidinha com ele(a) agora, ou marcar um horário pra vocês virem juntos? Assim eu mostro a simulação e tiro as dúvidas dos dois.",
        "Posso te mandar por WhatsApp a simulação e o resumo do plano pra você mostrar em casa. E combinamos de conversar na {dia} às {hora}, pode ser?"
      ],
      proximo: "Leve a simulação até o decisor. Combine retorno com data e hora."
    },
    {
      id: "concorrente",
      titulo: "Achei mais barato em outro lugar",
      gatilhos: ["outro lugar", "outra clinica", "mais barato", "outro dentista", "outro orcamento", "orcamento em", "pesquisando", "pesquisar", "cotando", "vi por menos"],
      entender: "Compare tratamento com tratamento: tecnologia, planejamento, quem acompanha, o que está incluído.",
      respostas: [
        "Entendo, é normal pesquisar. Posso te ajudar a comparar? Nesse outro orçamento está incluído o planejamento digital, o número de alinhadores e as consultas de acompanhamento?",
        "Aqui você é acompanhado por especialista e mestre em Ortodontia, com check-up digital no iTero e pioneirismo no Invisalign em Caruaru. No fim, o que importa é chegar no resultado que você viu na simulação, com segurança.",
        "Além do valor, o que mais é importante pra você na escolha de quem vai cuidar do seu sorriso?"
      ],
      proximo: "Nunca fale mal do concorrente. Mostre o que está incluído e reforce a segurança do resultado."
    },
    {
      id: "dor",
      titulo: "Medo de dor / desconforto",
      gatilhos: ["doi", "dor", "medo", "machuca", "desconfort", "agonia", "aflito", "aflita", "sofrer"],
      entender: "Medo é emoção: acolha primeiro, explique depois.",
      respostas: [
        "Super normal ter essa preocupação. Com os alinhadores, o que a maioria sente é uma leve pressão nos primeiros dias de cada troca, sinal de que os dentes estão se movendo. Não tem fio nem bráquete machucando a boca.",
        "E o escaneamento com o iTero não tem massinha nem ânsia: é uma câmera que passa nos dentes em poucos minutos."
      ],
      proximo: "Se possível, mostre um alinhador na mão do paciente."
    },
    {
      id: "tempo_tratamento",
      titulo: "Quanto tempo demora?",
      gatilhos: ["quanto tempo", "demora", "muito tempo", "quantos meses", "quantos anos", "leva quanto"],
      entender: "Quer previsibilidade. Responda com o planejamento do caso dele, sem prometer prazo exato.",
      respostas: [
        "Depende do seu caso, e é por isso que o planejamento digital é tão importante: no seu escaneamento a gente já consegue estimar quantos alinhadores você vai precisar e o tempo previsto.",
        "E o melhor: você já começa a ver diferença no espelho bem antes do final."
      ],
      proximo: "Ligue com o evento dele: 'começando agora, no {evento} você já estará com o tratamento bem adiantado'."
    },
    {
      id: "funciona",
      titulo: "Funciona mesmo? E se não der certo?",
      gatilhos: ["funciona mesmo", "sera que funciona", "da resultado", "resolve mesmo", "e se nao", "garantia", "garante", "confiavel", "da certo"],
      entender: "Insegurança sobre o resultado. Use prova: casos, experiência, simulação.",
      respostas: [
        "Ótima pergunta. O Invisalign é usado no mundo inteiro há mais de 25 anos, e a gente trabalha com ele desde que chegou em Caruaru. Posso te mostrar alguns casos parecidos com o seu?",
        "O segredo do resultado é o planejamento e o acompanhamento. Você vai estar comigo do início ao fim, e a gente acompanha cada etapa."
      ],
      proximo: "Mostre casos clínicos semelhantes (com autorização dos pacientes). Não use a palavra 'garantia' de resultado."
    },
    {
      id: "sem_tempo",
      titulo: "Não tenho tempo para consultas",
      gatilhos: ["nao tenho tempo", "corrido", "trabalho muito", "viajo muito", "agenda cheia", "sem tempo", "correria"],
      entender: "Rotina cheia é um argumento A FAVOR dos alinhadores.",
      respostas: [
        "Por isso mesmo o Invisalign combina com você: as consultas são mais espaçadas que no aparelho fixo e não tem aquela emergência de bráquete solto.",
        "A gente organiza os horários pra encaixar na sua rotina. Qual dia da semana costuma ser melhor pra você?"
      ],
      proximo: "Mostre a flexibilidade de agenda e as duas unidades (Caruaru e Recife)."
    },
    {
      id: "fixo",
      titulo: "O aparelho fixo é mais barato",
      gatilhos: ["aparelho normal", "aparelho fixo", "ferrinho", "braquete", "bracket", "aparelho comum", "aparelho de ferro", "metalico"],
      entender: "Está comparando valor de entrada, não a experiência completa.",
      respostas: [
        "É verdade, o fixo costuma ter investimento menor e também é uma ótima opção. A diferença está na rotina: com os alinhadores você tira pra comer, escova normalmente, ninguém percebe e tem menos emergências.",
        "Pelo que você me contou sobre {dor}, o que pesa mais pra você: o investimento menor ou a discrição no dia a dia?"
      ],
      proximo: "Deixe o paciente escolher com consciência. Se escolher o fixo, feche o fixo."
    },
    {
      id: "idade",
      titulo: "Será que na minha idade ainda dá?",
      gatilhos: ["minha idade", "velho", "velha", "tarde demais", "adulto", "ja passei da idade", "tenho 4", "tenho 5", "tenho 6"],
      entender: "Muitos adultos acham que aparelho é coisa de adolescente.",
      respostas: [
        "Dá sim! Hoje boa parte dos nossos pacientes de ortodontia são adultos. Com dentes e gengiva saudáveis, não existe idade limite pra alinhar o sorriso.",
        "E os alinhadores foram pensados justamente pra quem tem vida profissional e social: ninguém percebe."
      ],
      proximo: "Mostre casos de adultos."
    },
    {
      id: "convenio",
      titulo: "Meu plano / convênio cobre?",
      gatilhos: ["plano", "convenio", "unimed", "odontoprev", "amil", "hapvida", "bradesco saude", "sulamerica"],
      entender: "Quer saber se tem cobertura. Explique com transparência e volte ao valor.",
      respostas: [
        "Os planos odontológicos normalmente não cobrem alinhadores como o Invisalign. Mas a gente tem condições de pagamento que facilitam bastante. Quer que eu te mostre?"
      ],
      proximo: "Apresente a condição de pagamento."
    },
    {
      id: "distancia",
      titulo: "Fica longe pra mim",
      gatilhos: ["longe", "distancia", "moro em", "outra cidade", "dificil de ir", "transito"],
      entender: "Lembre que são duas unidades e que as consultas são espaçadas.",
      respostas: [
        "A gente tem duas unidades: Caruaru e Recife. Qual fica melhor pra você?",
        "E com os alinhadores as consultas são mais espaçadas, então você vem poucas vezes."
      ],
      proximo: "Ofereça a unidade mais próxima."
    },
    {
      id: "estetica",
      titulo: "Vai aparecer? Atrapalha a fala?",
      gatilhos: ["vai aparecer", "da pra ver", "aparece", "enrolad", "atrapalha a fala", "falar normal", "percebe"],
      entender: "Preocupação com imagem — ótima oportunidade para reforçar o Invisalign.",
      respostas: [
        "Os alinhadores são transparentes, praticamente ninguém percebe. Na fala, os primeiros um ou dois dias você sente uma diferencinha, e depois se acostuma rápido."
      ],
      proximo: "Coloque um alinhador de demonstração para o paciente ver."
    }
  ],

  /* ------------------------------------------------------------------
     INTENÇÕES QUE GERAM ORIENTAÇÃO AUTOMÁTICA
     ------------------------------------------------------------------ */
  intencoes: [
    {
      id: "preco_cedo",
      titulo: "Perguntou preço antes do diagnóstico",
      gatilhos: ["quanto custa", "quanto e", "qual o valor", "qual valor", "valor do", "preco", "quanto fica", "quanto sai", "media de valor", "valores"],
      somenteAntesDe: "investimento",
      orientacao: "Não passe valor solto. Valorize o check-up digital e convide para agendar.",
      resposta: "Ótima pergunta, {nome}! O valor depende do seu caso: cada sorriso precisa de um planejamento diferente. Por isso o primeiro passo é o check-up digital com o iTero: você vê seu sorriso em 3D, a simulação de como ele pode ficar e já sai sabendo exatamente o plano e o investimento. Posso ver um horário pra você em {unidade}?"
    },
    {
      id: "endereco",
      titulo: "Perguntou o endereço",
      gatilhos: ["onde fica", "endereco", "localizacao", "como chego", "qual o local"],
      orientacao: "Envie o endereço e já ofereça um horário.",
      resposta: "Estamos em {endereco} 📍 Quer que eu já reserve um horário pra você?"
    },
    {
      id: "horario",
      titulo: "Perguntou horários / disponibilidade",
      gatilhos: ["horario", "tem vaga", "disponibilidade", "que dia", "sabado", "agenda", "atende"],
      orientacao: "Ofereça DUAS opções concretas de horário (técnica da alternativa).",
      resposta: "Tenho {dia} às {hora} ou {dia2} às {hora2}. Qual fica melhor pra você?"
    },
    {
      id: "invisalign",
      titulo: "Perguntou sobre Invisalign / aparelho invisível",
      gatilhos: ["invisalign", "invisivel", "alinhador", "transparente", "aparelho que nao aparece"],
      orientacao: "Reforce o pioneirismo e leve para o check-up digital.",
      resposta: "Trabalhamos com Invisalign, e fomos pioneiros dessa tecnologia em Caruaru 😊 Com o check-up digital no iTero você já vê uma simulação de como seu sorriso pode ficar com os alinhadores. Quer agendar o seu?"
    }
  ],

  /* ------------------------------------------------------------------
     SINAIS DE COMPRA (esquentam o termômetro e avisam para fechar)
     ------------------------------------------------------------------ */
  sinaisCompra: [
    "como faco", "quando posso comecar", "quando comeca", "pode agendar", "pode marcar", "quero marcar",
    "quero agendar", "tem horario", "parcela", "parcelar", "em quantas vezes", "cartao", "pix", "entrada",
    "fechado", "fechou", "vamos fazer", "quero fazer", "quero comecar", "gostei", "adorei", "amei",
    "perfeito", "bora", "pode reservar", "como funciona o pagamento"
  ],

  /* ------------------------------------------------------------------
     MENSAGENS PRONTAS DE WHATSAPP (aba "Mensagens")
     ------------------------------------------------------------------ */
  mensagens: [
    {
      grupo: "Primeiro contato",
      itens: [
        { rotulo: "Resposta ao lead de anúncio", texto: "Olá, {nome}! Tudo bem? 😊 Aqui é da Weiss Odontologia, unidade {unidade}. Vi que você se interessou pelo nosso tratamento. Me conta: o que mais te incomoda hoje no seu sorriso?" },
        { rotulo: "Lead que sumiu no primeiro contato", texto: "Oi, {nome}! Passando pra saber se ficou alguma dúvida. Se quiser, já te mostro os horários disponíveis para o seu check-up digital com o iTero 🦷✨" }
      ]
    },
    {
      grupo: "Agendamento",
      itens: [
        { rotulo: "Confirmação de consulta", texto: "Oi, {nome}! Confirmando seu check-up digital na Weiss Odontologia ({unidade}) em {dia} às {hora}. 📍 {endereco}\n\nPode confirmar sua presença respondendo SIM? 😊" },
        { rotulo: "Lembrete no dia", texto: "Bom dia, {nome}! Hoje é o dia do seu check-up digital às {hora} 😁 Estamos te esperando em {endereco}." }
      ]
    },
    {
      grupo: "Follow-up de orçamento",
      itens: [
        { rotulo: "D+1 — resumo", texto: "Oi, {nome}! Foi muito bom te receber ontem 😊 Como prometido, segue o resumo do seu plano:\n\n🦷 {tratamento}\n💰 {valor}\n💳 Entrada de {entrada} + {parcelas}\n\nFicou alguma dúvida que eu possa esclarecer?" },
        { rotulo: "D+3 — reforço de valor", texto: "{nome}, lembrei de você! Lembra da simulação do seu sorriso? 😍 Se quiser, posso te mandar de novo pra você mostrar em casa. Ficou alguma dúvida sobre o tratamento?" },
        { rotulo: "D+7 — pergunta direta", texto: "Oi, {nome}! Tudo bem? Queria saber como está sua decisão sobre o tratamento. Existe algo que esteja te impedindo de começar? Me fala com sinceridade, que eu te ajudo a encontrar o melhor caminho 🙂" },
        { rotulo: "D+15 — porta aberta", texto: "{nome}, não quero te incomodar 🙂 Só quero que saiba que seu planejamento continua salvo aqui. Quando fizer sentido pra você, é só me chamar que a gente começa!" }
      ]
    },
    {
      grupo: "Condição especial (somente se cadastrada)",
      itens: [
        { rotulo: "Aviso de condição com prazo", texto: "Oi, {nome}! 😊 Passando pra te avisar: até {validade}, estamos com uma condição especial: {condicao}. Quer que eu já reserve o seu início?", requer: "condicao" },
        { rotulo: "Último dia da condição", texto: "{nome}, hoje é o último dia da condição especial ({condicao}). A partir de amanhã ela não vale mais. Posso garantir pra você?", requer: "condicao" }
      ]
    },
    {
      grupo: "Pós-fechamento",
      itens: [
        { rotulo: "Boas-vindas", texto: "Seja muito bem-vindo(a) à Weiss Odontologia, {nome}! 🎉 Seu tratamento começa em {dia} às {hora}. Qualquer dúvida, é só chamar aqui!" },
        { rotulo: "Pedido de indicação", texto: "{nome}, que alegria acompanhar a evolução do seu sorriso! 😁 Se você conhece alguém que também sonha em alinhar os dentes, pode indicar a gente? Vamos cuidar com o mesmo carinho!" }
      ]
    }
  ],

  /* ------------------------------------------------------------------
     MÉTODO DE VENDAS DO ALINHA
     SPIN, N.E.A.T., Venda conceitual, SNAP, Venda desafiadora (Challenger),
     Sandler e Venda centrada no cliente — adaptados à consulta de Ortodontia.
     ------------------------------------------------------------------ */
  metodos: {
    spin: {
      S: { nome: "Situação", objetivo: "Entender o contexto do paciente", perguntas: ["Você já usou aparelho antes? Como foi?", "Como é a sua rotina: trabalho, fotos, falar em público?", "O que te fez procurar a gente agora?"] },
      P: { nome: "Problema", objetivo: "Fazer o paciente dizer o que incomoda", perguntas: ["O que mais te incomoda hoje no seu sorriso?", "Há quanto tempo isso te incomoda?", "Tem algo que você evita fazer por causa disso?"] },
      I: { nome: "Implicação", objetivo: "Mostrar o peso do problema na vida dele", perguntas: ["Em que momentos isso mais te atrapalha: fotos, trabalho, sorrir em público?", "Como isso afeta a sua confiança no dia a dia?", "Dentes desalinhados acumulam mais placa e podem desgastar com o tempo. Você já percebeu algo assim?"] },
      N: { nome: "Necessidade", objetivo: "Fazer o paciente descrever o valor da solução", perguntas: ["Se a gente resolvesse isso, o que mudaria pra você?", "Como seria chegar no seu evento com o sorriso que você quer?", "O que seria um resultado perfeito pra você?"] }
    },
    neat: {
      N: { nome: "Necessidade", dica: "Qual a dor real e o resultado desejado?", pergunta: "O que mais te incomoda e como você imagina o resultado?" },
      E: { nome: "Impacto econômico", dica: "Quanto vale para ele resolver e quanto cabe no mês?", pergunta: "Pensando no seu planejamento, que valor de parcela ficaria confortável?" },
      A: { nome: "Quem decide", dica: "Quem participa da decisão? Traga essa pessoa para a conversa.", pergunta: "Além de você, mais alguém participa dessa decisão?" },
      T: { nome: "Prazo", dica: "Existe uma data que cria motivo para começar agora?", pergunta: "Tem alguma data importante pela frente: casamento, formatura, viagem?" }
    },
    conceitual: {
      ideia: "As pessoas não compram o aparelho; compram o resultado que imaginam (o 'conceito'). Descubra esse conceito e confirme com as palavras do paciente.",
      perguntas: ["Quando você imagina o seu sorriso ideal, como ele é?", "Deixa eu confirmar: o mais importante pra você é…, certo?", "O que precisaria acontecer para você se sentir seguro(a) para começar?"]
    },
    sandler: {
      contrato: "Antes de começar: vou te fazer algumas perguntas, te mostrar o escaneamento e, no final, você me diz com sinceridade se faz sentido ou não. Tudo bem se for um não. Combinado?",
      funil: ["Me conta mais sobre isso.", "Pode me dar um exemplo?", "Há quanto tempo isso acontece?", "O que você já tentou para resolver?", "Como você se sente com isso?"],
      principio: "Deixe o paciente à vontade para dizer não: quem não se sente pressionado decide com mais clareza."
    },
    challenger: {
      ideia: "Ensine algo novo e relevante, adapte ao caso e conduza com segurança ao próximo passo (sem pressão).",
      insights: ["Alinhar os dentes também facilita a higiene e protege a gengiva, não é só estética.", "Com o planejamento digital, você vê o resultado antes de começar, então decide com segurança.", "Muitos adultos começam hoje justamente porque os alinhadores ninguém percebe no trabalho."]
    },
    snap: {
      regras: ["Simples: uma ideia por mensagem, curta.", "Valiosa: traga algo útil (simulação, caso parecido, resposta clara).", "Alinhada: use o objetivo e as palavras do paciente.", "Prioridade: mostre por que vale decidir agora (o prazo dele), sem pressão."]
    },
    centrada: {
      regras: ["Faça perguntas antes de apresentar.", "Fale do resultado que o paciente quer, não das características do aparelho.", "Recomende uma solução para o caso dele, não um catálogo.", "Confirme o entendimento com as palavras dele."]
    }
  },

  /* Motivos de perda (vão para o Kommo) */
  motivosPerda: [
    "Preço / sem condições no momento",
    "Escolheu outra clínica",
    "Decisor não aprovou",
    "Sem urgência / adiou",
    "Medo / insegurança",
    "Não respondeu mais",
    "Sem indicação clínica",
    "Outro"
  ]
};
