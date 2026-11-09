# Alinha — do diagnóstico ao fechamento

**A marca:** *Alinha* é alinhar com o cliente — **a conversa, o orçamento, o fechamento e o tratamento** — e é também o alinhamento da Ortodontia: **do primeiro contato ao sorriso alinhado**. O logo é um "A" cujo traço do meio é um sorriso.

Copiloto de vendas da **Weiss Odontologia** (Caruaru e Recife). Acompanha a consulta e o paciente até o fechamento do tratamento, em quatro partes:

| | O que faz |
|---|---|
| **1. Consulta ao vivo** | Escuta a conversa (microfone, Google Chrome) e mostra **na hora** como contornar cada objeção, citando a frase do paciente. Mostra o momento da consulta: Acolhimento › Investigação › Diagnóstico › Apresentação › Negociação › Fechamento. |
| **2. Briefing pós-consulta** | Ao parar a gravação: desfecho, valor, **o que mais travou**, próximo passo (quem e até quando), o que aconteceu (por que veio, o que o exame mostrou, o que foi proposto, como terminou) e a avaliação da condução, com **por que pesa** e **como fazer da próxima**. |
| **3. Mensagem pronta** | Na tela **Hoje**: a mensagem de WhatsApp certa para cada paciente, escrita com **as palavras do próprio paciente**. Botões Copiar, WhatsApp, Outra versão, Enviei e Pular. |
| **4. Follow-up D0 a D30** | Quadro com cada paciente no toque certo (D0, D1, D3, D7, D15, D30): quem chamar hoje, atrasados, valor em aberto e **valor recuperado** pelo follow-up. Filtro por responsável. |

## Ver funcionando agora (sem instalar nada)
Abra `alinha/index.html` no navegador. O sistema abre em **modo demonstração**, com pacientes fictícios e uma **consulta simulada** (tela Consulta › "Ver uma consulta de demonstração").

## Colocar no ar para a equipe
1. Chave da IA: **console.anthropic.com** › Billing (crédito) › API Keys › Create Key.
2. **render.com** › New › **Blueprint** › repositório `edw` (o arquivo `render.yaml` já está pronto).
3. Preencha `SENHA_ACESSO` e `ANTHROPIC_API_KEY` (e `KOMMO_TOKEN`, se quiser enviar o briefing ao Kommo).
4. Abra o endereço gerado, digite a senha e cadastre a equipe em **Ajustes**.

Custo: hospedagem ≈ US$ 7/mês + uso da IA (centavos por consulta). Sem limite de consultas.

## Reconhecimento de voz (sem trocar o botão)
Em **Ajustes › Reconhecimento de voz**, escolha o profissional, toque em **Gravar minha voz** e leia o texto por 20 segundos. Depois toque em **Testar reconhecimento**.
Na consulta, o botão **🎙 Automático** fica ativo: a sua voz é marcada como **Profissional** e qualquer outra como **Paciente**. Se o Alinha errar uma frase, toque nela na transcrição para trocar.
- Não grava áudio: guarda só uma "impressão" numérica do timbre e do tom.
- Funciona melhor com o microfone perto do profissional e em sala silenciosa. Vozes muito parecidas podem confundir; por isso a correção com um toque continua disponível, e a IA também corrige pelo conteúdo ao gerar o briefing.

## Uso no dia a dia
- **Na consulta:** tela Consulta › nome e WhatsApp do paciente › marque a autorização › **Iniciar**. Deixe o computador ou tablet ao lado. No fim, **Parar e gerar briefing**.
- **Todo dia de manhã:** tela **Hoje** › envie as mensagens prontas › **Enviei**.
- **Quando o paciente fechar:** abra o paciente no Follow-up › **Fechou** (com o valor).

## Ética e privacidade
- A gravação só começa com a autorização do paciente marcada (LGPD). O áudio **não é gravado nem enviado**; só o texto da conversa vai para a IA gerar dicas e o briefing.
- A IA segue o Código de Ética Odontológica: não promete resultado, não inventa desconto, prazo ou condição, não fala mal de concorrentes.
- Os dados ficam no servidor da clínica (pasta de dados), protegidos por senha.

## Arquivos
- `index.html` · `app.js`: a tela
- `biblioteca.js`: objeções, roteiro e mensagens (edite aqui o jeito de falar da clínica)
- `demo.js`: dados de demonstração
- `servidor/server.js`: login, dados da equipe, IA (Claude) e Kommo
