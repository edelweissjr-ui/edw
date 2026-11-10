# Alinha — do diagnóstico ao fechamento

**A marca:** *Alinha* é alinhar com o cliente — **a conversa, o orçamento, o fechamento e o tratamento** — e é também o alinhamento da Ortodontia: **do primeiro contato ao sorriso alinhado**. O logo é um "A" cujo traço do meio é um sorriso.

Copiloto de vendas da **Weiss Odontologia** (Caruaru e Recife). Acompanha a consulta e o paciente até o fechamento do tratamento, em quatro partes:

| | O que faz |
|---|---|
| **1. Consulta ao vivo** | Escuta a conversa (microfone, Google Chrome) e mostra **na hora** como contornar cada objeção, citando a frase do paciente. Mostra o momento da consulta: Acolhimento › Investigação › Diagnóstico › Apresentação › Negociação › Fechamento. |
| **2. Briefing pós-consulta** | Ao parar a gravação: desfecho, valor, **o que mais travou**, próximo passo (quem e até quando), o que aconteceu (por que veio, o que o exame mostrou, o que foi proposto, como terminou) e a avaliação da condução, com **por que pesa** e **como fazer da próxima**. |
| **3. Mensagem pronta** | Na tela **Hoje**: a mensagem de WhatsApp certa para cada paciente, escrita com **as palavras do próprio paciente**. Botões Copiar, WhatsApp, Outra versão, Enviei e Pular. |
| **4. Follow-up D0 a D30** | Quadro com cada paciente no toque certo (D0, D1, D3, D7, D15, D30): quem chamar hoje, atrasados, valor em aberto e **valor recuperado** pelo follow-up. Filtro por responsável. |

## Método de vendas
O Alinha aplica, adaptadas à Ortodontia, as técnicas **SPIN Selling** (Situação, Problema, Implicação, Necessidade), **N.E.A.T.** (Necessidade, impacto Econômico, Acesso a quem decide, Tempo), **Venda conceitual** (o resultado que o paciente imagina), **SNAP** (mensagens simples, valiosas, alinhadas e que priorizam), **Venda desafiadora** (ensinar algo novo e conduzir), **Sandler** (contrato inicial e funil da dor) e **Venda centrada no cliente**.
- **Na consulta:** painel "Método da consulta" marca sozinho o que já foi feito e sugere a próxima pergunta. Os itens também podem ser marcados à mão. O "Guia rápido das técnicas" traz as perguntas de cada uma.
- **Na IA:** dicas ao vivo, respostas de WhatsApp e mensagens de follow-up seguem as técnicas.
- **No briefing:** avaliação por técnica e a pergunta que faltou, pronta para usar no retorno.
- As perguntas e frases ficam em `biblioteca.js` (`metodos`) e podem ser ajustadas ao jeito da clínica.

## WhatsApp ao vivo
As conversas dos WhatsApps de **Caruaru e Recife**, que já estão ligados ao Kommo, chegam ao Alinha em segundos. A cada mensagem do paciente, a tela **WhatsApp** mostra a objeção detectada, a orientação e a **resposta pronta** (IA + roteiro), além do **termômetro** da conversa.
- **Responder:** "Copiar e abrir no Kommo" (a resposta sai pelo número oficial da clínica e fica registrada no CRM).
- **Assumir atendimento / Devolver para a IA:** coloca ou tira a etiqueta "Atendimento humano" no lead. No fluxo da IA do n8n, inclua uma verificação: se o lead tiver essa etiqueta, não responder.
- **Adicionar ao follow-up:** a conversa entra na cadência D0 a D30.

**Ligar (uma vez):** no Kommo, **Configurações › Integrações › Webhooks**, cadastre `https://SEU-ENDERECO/webhooks/kommo/VALOR_DE_KOMMO_CHAVE_WEBHOOK` (o valor aparece no Render, em Environment) e marque os eventos de **mensagem recebida** e **mensagem enviada**. O webhook da IA atual continua funcionando.

## Conectar celular por QR code (WhatsApp)
Em **Ajustes › Conectar celular**, o administrador gera um QR code; no celular: **WhatsApp › Aparelhos conectados › Conectar um aparelho**. As conversas desse número aparecem na tela WhatsApp e o botão **"Enviar pelo celular"** manda a resposta direto do Alinha.
- Usa a **Evolution API** (conector gratuito de WhatsApp Web, muito usado com n8n), que precisa rodar em um servidor próprio com Docker (Render, Railway, VPS) ou num provedor que a ofereça. Se a IA de vocês no n8n já usa uma Evolution API, use a mesma.
- Configure no Alinha: `EVOLUTION_URL` (endereço da Evolution API), `EVOLUTION_API_KEY` (a chave global dela) e, opcional, `EVOLUTION_INSTANCIA` (padrão `alinha`). O Alinha cria a instância e aponta o webhook sozinho.
- ⚠️ É uma conexão **não oficial**: há risco de bloqueio do número. Use um número que **não** esteja na API oficial do Kommo; os de Caruaru e Recife continuam pelo Kommo.

## Abrir no celular
Em **Ajustes › Abrir o Alinha no celular**, aponte a câmera para o QR code e entre com usuário e senha. No celular, "Adicionar à tela de início" deixa o Alinha com cara de app.

## Ver funcionando agora (sem instalar nada)
Abra `alinha/index.html` no navegador. O sistema abre em **modo demonstração**, com pacientes fictícios e uma **consulta simulada** (tela Consulta › "Ver uma consulta de demonstração").

## Publicar na Vercel
O Alinha roda na Vercel como uma função (`api/index.js`) e guarda os dados no **Upstash Redis** (instalado pela própria Vercel).
1. **vercel.com** › entre com o GitHub › **Add New › Project** › importe o repositório `edw`.
2. Em **Root Directory**, escolha **`alinha`**. Framework: **Other**.
3. Em **Environment Variables**, adicione: `SENHA_ADMIN`, `SENHA_ACESSO`, `ANTHROPIC_API_KEY`, `MODELO_DICAS` (`claude-haiku-5-5`, opcional), `KOMMO_SUBDOMINIO` (`edelweissjrhotmailcom`), `KOMMO_TOKEN` e `KOMMO_CHAVE_WEBHOOK` (invente um texto longo, sem espaços).
4. **Deploy**.
5. No projeto: **Storage › Create Database › Upstash (Redis)** › conecte ao projeto (as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` entram sozinhas) › **Deployments › Redeploy**.
6. Abra `https://SEU-PROJETO.vercel.app/login`. Se aparecer o aviso "banco de dados não está conectado", refaça o passo 5.

Observações: o plano Hobby (gratuito) da Vercel é só para uso não comercial; para a clínica, use o plano **Pro**. O Upstash tem plano gratuito (500 mil comandos/mês), suficiente para o uso normal. Cópias de segurança: na Vercel, baixe periodicamente em Ajustes › Atualizações › "Baixar cópia dos dados"; a cada atualização de versão, o Alinha também guarda uma cópia no próprio banco por 90 dias.

## Colocar no ar para a equipe
1. Chave da IA: **console.anthropic.com** › Billing (crédito) › API Keys › Create Key.
2. **render.com** › New › **Blueprint** › repositório `edw` (o arquivo `render.yaml` já está pronto).
3. Preencha `SENHA_ADMIN`, `SENHA_ACESSO` e `ANTHROPIC_API_KEY` (e `KOMMO_TOKEN`, se quiser enviar o briefing ao Kommo).
4. Abra o endereço gerado, digite a senha e cadastre a equipe em **Ajustes**.

Custo: hospedagem ≈ US$ 7/mês + uso da IA (centavos por consulta). Sem limite de consultas.

## Reconhecimento de voz (sem trocar o botão)
Em **Ajustes › Reconhecimento de voz**, escolha o profissional, toque em **Gravar minha voz** e leia o texto por 20 segundos. Depois toque em **Testar reconhecimento**.
Na consulta, o botão **🎙 Automático** fica ativo: a sua voz é marcada como **Profissional** e qualquer outra como **Paciente**. Se o Alinha errar uma frase, toque nela na transcrição para trocar.
- Não grava áudio: guarda só uma "impressão" numérica do timbre e do tom.
- Funciona melhor com o microfone perto do profissional e em sala silenciosa. Vozes muito parecidas podem confundir; por isso a correção com um toque continua disponível, e a IA também corrige pelo conteúdo ao gerar o briefing.

## Acessos
| Usuário | Senha (variável no Render) | Pode |
|---|---|---|
| `admin` | `SENHA_ADMIN` | Tudo: equipe, condição especial, apagar dados, baixar cópias, funis |
| `equipe` | `SENHA_ACESSO` | Uso diário: consultas, briefings, follow-up, mensagens e cadastro da própria voz |

Se `SENHA_ADMIN` não for definida, a senha da equipe tem acesso total. Após 8 senhas erradas, o acesso fica bloqueado por 15 minutos.

## Uso no dia a dia
- **Na consulta:** tela Consulta › nome e WhatsApp do paciente › marque a autorização › **Iniciar**. Deixe o computador ou tablet ao lado. No fim, **Parar e gerar briefing**.
- **Todo dia de manhã:** tela **Hoje** › envie as mensagens prontas › **Enviei**.
- **Quando o paciente fechar:** abra o paciente no Follow-up › **Fechou** (com o valor).

## Atualizações
O Alinha foi feito para receber novas versões sem perder dados:
1. **Publicar:** o desenvolvedor aumenta a versão em `package.json`, registra as novidades em `CHANGELOG.md` e na lista `NOVIDADES` (em `app.js`) e envia ao repositório.
2. **Instalar:** o Render instala a versão nova sozinho em ~2 minutos (`autoDeploy`).
3. **Antes de trocar a versão,** o servidor faz uma **cópia de segurança** dos dados (`backups/alinha-AAAA-MM-DD-antes-da-vX.json`) e, se o formato dos dados mudou, converte tudo automaticamente (lista `MIGRACOES` em `servidor/server.js`). Também há uma cópia diária (7 últimas).
4. **Na tela:** quem estiver com o Alinha aberto vê o aviso **"Nova versão disponível · Atualizar agora"**. Em **Ajustes › Atualizações** ficam a versão instalada, o botão "Verificar atualizações", as novidades e o botão "Baixar cópia dos dados".

**Para vender a várias clínicas:** cada clínica tem a própria instalação (dados separados) ligada ao mesmo repositório. Ao publicar uma versão, todas recebem a atualização automaticamente. Recomenda-se manter um ramo `estavel` para as clínicas e testar as novidades antes em uma instalação de teste.

## Ética e privacidade
- A gravação só começa com a autorização do paciente marcada (LGPD). O áudio **não é gravado nem enviado**; só o texto da conversa vai para a IA gerar dicas e o briefing.
- A IA segue o Código de Ética Odontológica: não promete resultado, não inventa desconto, prazo ou condição, não fala mal de concorrentes.
- Os dados ficam no servidor da clínica (pasta de dados), protegidos por senha.

## Arquivos
- `index.html` · `app.js`: a tela
- `biblioteca.js`: objeções, roteiro e mensagens (edite aqui o jeito de falar da clínica)
- `demo.js`: dados de demonstração
- `servidor/server.js`: login, dados da equipe, IA (Claude) e Kommo
