# Copiloto de Consulta — Weiss Odontologia

Sistema para acompanhar a conversa com o paciente, **ao vivo (presencial)** ou pelo **WhatsApp**, mostrando em tempo real o que responder e conduzindo até o fechamento do orçamento. Ao final, tudo vai direto para o **Kommo**, e a **IA (Claude)** sugere respostas e avalia a consulta.

**Plataforma única:** a equipe acessa **um só endereço, com senha**. A plataforma fala direto com o Kommo, a IA e a transcrição de áudios. O n8n não é necessário.

```
consulta/
├── index.html      → a tela do copiloto
├── app.js          → lógica (análise da conversa, gravação, integração)
├── roteiro.js      → TODO o conteúdo: etapas, falas, objeções, mensagens (edite aqui)
├── servidor/server.js → a plataforma: login, Kommo, IA, áudio e WhatsApp ao vivo
├── .env.exemplo    → lista das configurações da plataforma
├── Dockerfile      → para publicar em qualquer servidor
└── n8n/            → (opcional) a mesma integração feita no n8n
    ├── 01-copiloto-registrar-no-kommo.json  → cria/atualiza lead, nota e tarefa no Kommo
    ├── 02-copiloto-sugestao-ia.json         → IA sugere a próxima fala
    ├── 03-whatsapp-ao-vivo.json             → mensagens do WhatsApp (via Kommo) chegam ao copiloto
    └── 04-copiloto-transcrever-audio.json   → áudios do paciente e gravação da consulta viram texto
```

---

## Como o Copiloto se encaixa no que vocês já têm

```
Anúncio no Meta ──► WhatsApp (Caruaru 99836-8491 ou Recife 97318-5005) ──► Kommo ──► IA no n8n
                                                                          │
                                                                          ▼
                                                                   FUNIL DE LEADS
                                                                          │  a IA qualifica e passa para a equipe
                                                                          ▼
                                       COPILOTO: Puxar do Kommo ► Assumir atendimento (IA pausa)
                                                 roteiro, objeções, sugestões, nota da consulta
                                                                          │
                                         Enviar ao Kommo ─────────────────┤
                                                                          ▼
                       Fechou ► FUNIL DE CLIENTES        Em negociação / Não fechou ► fica no FUNIL DE LEADS
```

- **Puxar dados do Kommo:** com o WhatsApp ou o ID do lead, traz nome, telefone, **unidade**, **origem** ("Anúncio Meta"), funil e etapa, além da conversa que o paciente já teve com a IA. As mensagens da IA aparecem marcadas com 🤖.
- **Unidade automática:** a plataforma identifica Caruaru ou Recife pelo número do WhatsApp, pela fonte do lead ou pelas etiquetas no Kommo. Se não conseguir, escolha manualmente.
- **Assumir atendimento / Devolver para a IA:** coloca ou retira a etiqueta **"Atendimento humano"** no lead do Kommo.
- **Funis:** em Configurações › *Funis do Kommo*, escolha uma vez o funil de leads, o funil de clientes e as etapas. A plataforma sugere os funis pelo nome.

### ⚠️ Um ajuste na IA do n8n (uma vez só)
Para a IA **parar de responder** quando alguém assume o atendimento, quem cuida do n8n precisa incluir no início do fluxo da IA uma verificação simples:

1. Depois do gatilho que recebe a mensagem do Kommo, adicione um nó **HTTP Request** `GET https://SEU-SUBDOMINIO.kommo.com/api/v4/leads/{{ID do lead}}`, com a mesma credencial do Kommo que o fluxo já usa.
2. Em seguida, um nó **IF**: se `{{ $json._embedded.tags.map(t => t.name).includes("Atendimento humano") }}` for verdadeiro, **encerre** o fluxo sem responder.

Assim a IA atende os leads dos anúncios e se cala quando a equipe assume. Ao clicar em **Devolver para a IA**, ela volta a responder.

---

## 1. Como funciona na prática

### Pelo WhatsApp (uso principal)
1. Abra o copiloto, clique em **+ Nova consulta**, preencha nome, WhatsApp e unidade.
2. A cada mensagem do paciente, cole no campo e clique em **Paciente disse**, ou ligue **Acompanhar WhatsApp pelo Kommo/n8n** para as mensagens chegarem sozinhas.
3. O painel **O que responder** mostra na hora:
   - 🛡️ **Objeções** (caro, vou pensar, falar com o marido, achei mais barato, medo de dor…) com respostas prontas;
   - 💬 **Perguntas importantes** (preço antes do diagnóstico, endereço, horários, Invisalign);
   - ✅ **Sinais de compra** → aviso para parar de apresentar e fechar.
4. Cada resposta tem os botões **Copiar**, **WhatsApp** (abre a conversa com o texto pronto) e **Marcar como dita**.
5. **✨ Sugestão da IA** pede ao n8n uma resposta personalizada com base em toda a conversa.
6. O **termômetro** (frio → quente) mostra se é hora de fechar ou de voltar à Descoberta.

**Áudios do paciente:** clique em **🎧 Transcrever áudio do paciente** e escolha o áudio salvo do WhatsApp. Ele vira texto e passa pela mesma análise. Com o acompanhamento pelo Kommo ligado, os áudios que chegam são transcritos sozinhos.

Dá também para **Importar conversa**: no WhatsApp, abra a conversa › ⋮ › Mais › **Exportar conversa** › Sem mídia, cole o texto no campo de mensagem e clique em *Importar conversa*.

### Ao vivo (presencial)
1. Escolha **Presencial**. Leia ao paciente a fala *Pedido para gravar* (etapa Acolhimento).
2. Com a autorização, marque a caixa de consentimento: data e hora ficam registradas (LGPD).
3. Clique em **Gravar e transcrever**. No **Google Chrome**, a fala vira texto em tempo real e passa pela mesma análise de objeções. Toque em *Paciente* ou *Eu* para indicar quem está falando.
4. O áudio fica **só no aparelho**: ao parar, aparece o botão para baixá-lo e anexar ao prontuário, se quiser. Fora do Chrome, use **Transcrever gravação (IA)** para enviar o áudio ao fluxo 04 e receber o texto.

### Roteiro de 9 etapas
Preparação → Acolhimento → Descoberta → Check-up digital (iTero) → Apresentação da solução → Investimento → Objeções → Fechamento → Pós-consulta/Follow-up.
Cada etapa tem objetivo, falas (versão presencial e versão curta para WhatsApp), perguntas, checklist e dicas. As falas são preenchidas automaticamente com nome do paciente, unidade, endereço, dor relatada, evento, valor, entrada e parcelas.

### Técnicas de fechamento com prazo e segurança
Em **Configurações › Condição especial e segurança** você cadastra:
- uma **condição real** com **data e hora de validade** (ex.: "o valor do check-up digital é abatido do tratamento", até hoje às 23h59);
- a **segurança** que a clínica oferece (ex.: "se desistir antes de iniciarmos o planejamento, devolvemos o sinal").

Com isso, a etapa **Fechamento** passa a mostrar as falas *Condição especial com prazo*, *Por que essa condição existe*, *Segurança para decidir* e *Credibilidade*, e a aba Mensagens ganha os avisos de prazo. **Quando a validade vence, as falas se desativam sozinhas**: o sistema nunca sugere um prazo falso.
> O Código de Ética Odontológica não permite prometer resultado. Por isso a "garantia" do sistema é sobre o **processo** (sinal, abatimento, desistência antes de iniciar), nunca sobre o resultado clínico.

### Nota da consulta e painel de resultados
- **Nota da consulta (0–100)**, na aba Fechamento: calculada pelo roteiro (dor anotada, Descoberta, iTero, proposta, investimento, objeções, pergunta de fechamento, próximo passo), com a lista do que melhorar. Funciona sem internet.
- **✨ Avaliação detalhada da IA**: notas por critério, pontos fortes e pontos a melhorar, com a frase que poderia ter sido dita.
- **Painel de resultados**, na aba Histórico: taxa de fechamento, ticket médio, total fechado, valor em negociação, fechamento por canal (WhatsApp × presencial) e objeções mais frequentes.

### Fechamento e registro
Na aba **Fechamento & registro**: tratamento, valor, entrada, parcelas, resultado (fechou / em negociação / não fechou + motivo) e próximo contato. O resumo é gerado automaticamente e pode ser editado. **Enviar ao Kommo** manda tudo para o n8n.

---

## 2. Publicar a plataforma (uma vez só)

A plataforma é um pequeno servidor. Ele precisa ficar ligado o tempo todo para receber as mensagens do Kommo. O caminho mais simples é o **Render** (render.com), com custo a partir de cerca de US$ 7/mês no plano Starter mais um disco de 1 GB.

### 2.1 Separe as chaves
| O quê | Onde conseguir |
|---|---|
| **Token do Kommo** | Kommo › Configurações › Integrações › Criar integração (privada) › Chaves e escopos › token de longa duração |
| **Subdomínio do Kommo** | a parte antes de `.kommo.com` no endereço do seu Kommo |
| **Chave da IA (Claude)** | console.anthropic.com › API Keys |
| **Chave da OpenAI** *(opcional, só para áudios)* | platform.openai.com › API keys |
| **Senha da equipe** | invente uma senha forte |

### 2.2 Publique no Render
1. Crie uma conta em render.com e conecte o GitHub.
2. Clique em **New › Blueprint** e escolha o repositório `edw`. O arquivo `render.yaml` já tem tudo pronto.
3. Preencha as variáveis pedidas: `SENHA_ACESSO`, `KOMMO_SUBDOMINIO`, `KOMMO_TOKEN`, `ANTHROPIC_API_KEY` e, se quiser áudios, `OPENAI_API_KEY`. `SEGREDO_SESSAO` e `KOMMO_CHAVE_WEBHOOK` são geradas sozinhas.
4. Ao terminar, o Render mostra o endereço, por exemplo `https://copiloto-weiss.onrender.com`. Dá para usar um endereço próprio, como `copiloto.odontoweiss.com.br`, em *Settings › Custom Domain*.
5. Abra o endereço, digite a senha e pronto. Em **Configurações** aparece o que está ativo: Kommo, IA, Áudio e WhatsApp ao vivo.

> Prefere outro lugar? Em qualquer servidor com Docker: `docker build -f consulta/Dockerfile -t copiloto-weiss .` e `docker run -p 3000:3000 --env-file consulta/.env -v copiloto-dados:/dados copiloto-weiss`. Sem Docker: `cd consulta && npm install && npm start`, com as variáveis do `.env.exemplo`.

### 2.3 WhatsApp ao vivo
No Kommo: **Configurações › Integrações › Webhooks**, cadastre o endereço

`https://SEU-ENDERECO/webhooks/kommo/VALOR_DA_KOMMO_CHAVE_WEBHOOK`

e marque os eventos de **mensagem recebida** e **mensagem enviada**. O valor da chave aparece no Render, em *Environment*. O webhook que a IA atual de vocês já usa continua funcionando.

### 2.4 Funil do Kommo *(opcional)*
Para a plataforma mover o lead para a etapa certa, preencha `KOMMO_FUNIL_ID` e `KOMMO_ETAPA_NEGOCIACAO`. Os IDs aparecem em `https://SEU-SUBDOMINIO.kommo.com/api/v4/leads/pipelines`, acessado com você logado no Kommo. "Fechou" e "Não fechou" já usam as etapas padrão do Kommo: 142 (venda ganha) e 143 (venda perdida).

---

## Alternativa: integração pelo n8n
Só se vocês preferirem manter tudo no n8n. Com a plataforma acima, **pule esta seção**.

### Token do Kommo
1. No Kommo: **Configurações › Integrações › Criar integração** (integração privada).
2. Na aba *Chaves e escopos*, gere o **token de longa duração** e copie.
3. No n8n, crie uma credencial **Header Auth** chamada `Kommo API`:
   - Name: `Authorization`
   - Value: `Bearer SEU_TOKEN`

### Importar os fluxos no n8n
Para cada arquivo da pasta `n8n/`: no n8n, **Workflows › Import from File**.

| Fluxo | O que ajustar | Webhook para o copiloto |
|---|---|---|
| **01 Registrar no Kommo** | Nó *Validar e preparar*: `TOKEN`, `SUBDOMINIO`, `PIPELINE_ID`, IDs das etapas. Nos nós HTTP, escolha a credencial `Kommo API`. | `.../webhook/copiloto-consulta` |
| **02 Sugestão da IA** | Nó *Validar e montar prompt*: `TOKEN`. Troque o sub-nó *Modelo de IA* pelo mesmo modelo e credencial que a IA de vocês já usa. | `.../webhook/copiloto-sugestao` |
| **03 WhatsApp ao vivo** | Nó *Ler mensagens*: `TOKEN`. No Kommo, cadastre o webhook (abaixo). | `.../webhook/copiloto-mensagens` |
| **04 Transcrição de áudio** | Nó *Validar áudio*: `TOKEN`. No nó *Transcrever (Whisper)*, escolha a credencial OpenAI. | `.../webhook/copiloto-audio` |

Depois, **ative** os quatro fluxos e copie as **Production URLs** para **Configurações** no copiloto, junto com a mesma chave (`TOKEN`). Clique em **Testar conexão**.

> **IDs do funil:** abra o funil no Kommo; o ID do funil aparece na URL. Para os IDs das etapas, acesse `https://SEU-SUBDOMINIO.kommo.com/api/v4/leads/pipelines` logado no Kommo. `142` (venda ganha) e `143` (venda perdida) são padrão em todas as contas.

### Mensagens do WhatsApp chegando ao copiloto (n8n)
1. No Kommo: **Configurações › Integrações › Webhooks**: cole a Production URL do nó *Webhook Kommo* do fluxo 03 (`.../webhook/kommo-mensagens`) e marque os eventos de **mensagem recebida** e **mensagem enviada**.
2. O Kommo aceita vários webhooks ao mesmo tempo: o webhook que a IA de vocês já usa continua funcionando.
3. No copiloto, informe o **ID do lead** (aparece na URL do lead no Kommo, ou é preenchido sozinho após o primeiro *Enviar ao Kommo*) e ligue **Acompanhar WhatsApp**.

### O que acontece no Kommo ao enviar
- Procura o contato pelo telefone; se não existir, **cria contato + lead**.
- Atualiza **valor**, **etapa do funil** (conforme o resultado) e **tags** (`Copiloto`, canal, unidade, tratamento, `Lead quente`).
- Adiciona uma **nota** com o resumo da consulta, as objeções e a transcrição.
- Se houver próximo contato combinado, cria uma **tarefa** de retorno com data e hora.

---

## 3. Os dois números de WhatsApp

**Situação atual de vocês:** os dois números (Caruaru +55 81 99836-8491 e Recife +55 81 97318-5005) já estão ligados ao Kommo, que já está ligado ao n8n. É exatamente a opção recomendada abaixo, e o Copiloto lê os dois pelo Kommo.

### Referência — opções

**Opção A, recomendada: os dois números das clínicas na API oficial, ligados ao Kommo**

| Número | Uso |
|---|---|
| Recife (81) 97318-5005 | Canal de WhatsApp no Kommo, com tag `Recife` |
| Caruaru (81) 99836-8491 | Canal de WhatsApp no Kommo, com tag `Caruaru` |

- Todas as conversas ficam no Kommo; a IA do n8n e o copiloto leem da mesma fonte.
- O copiloto não envia nada sozinho: quem envia é o atendente (botão **WhatsApp**/**Copiar**) ou o próprio Kommo.

**Opção B: um número comercial + um número interno ("sussurro")**
- Número 1 (API + Kommo): conversa com os pacientes.
- Número 2 (interno, celular do doutor/consultora): recebe da IA no n8n alertas como *"lead quente: Maria perguntou sobre parcelamento"* e sugestões de resposta, sem o paciente ver. Basta adicionar, no fluxo 02 ou na IA atual, um envio de mensagem para esse número quando a temperatura passar de 70.

> Um número ligado à API oficial normalmente deixa de funcionar no aplicativo comum do WhatsApp. Alguns provedores oferecem o modo **coexistência** (app WhatsApp Business + API no mesmo número): confirme com o provedor de vocês antes de migrar os números das clínicas.

---

## 4. Comparação com sistemas cobrados por consulta
O áudio de referência apresenta um sistema vendido em **planos por número de consultas por mês**, com garantia de devolução no primeiro mês. Este copiloto:
- não tem limite de consultas: o custo é a hospedagem (cerca de US$ 7/mês) mais o uso da IA e da transcrição (centavos por consulta);
- funciona **mesmo sem internet ou IA** (roteiro, objeções, nota e resumo são locais);
- usa o Kommo que vocês **já têm**; a plataforma é de vocês, no endereço de vocês;
- tem o roteiro **todo editável** em `roteiro.js`, no jeito de falar da clínica.

## 5. Privacidade e LGPD
- Os dados das consultas ficam **apenas no navegador do aparelho** (localStorage) até serem enviados ao Kommo. Na aba *Histórico*, apague consultas antigas já sincronizadas.
- A gravação só é liberada depois de registrar a autorização do paciente. O áudio **não é enviado** a lugar nenhum; só a transcrição em texto vai para o Kommo.
- A transcrição ao vivo do Chrome usa o serviço de reconhecimento de voz do Google. A transcrição de áudios (plataforma ou fluxo 04) envia o áudio para a OpenAI (Whisper): avise o paciente quando usar.
- A chave (`TOKEN`) impede que terceiros enviem dados para os webhooks do n8n. Use uma chave longa e diferente da senha do Kommo.

- A plataforma exige senha em todas as telas e no acesso ao Kommo e à IA. As chaves ficam só no servidor, nunca no navegador.

### ⚠️ Onde hospedar
Com a plataforma, o acesso já é protegido por senha. Se alguém abrir só o arquivo HTML, sem a plataforma, vale o alerta abaixo.
Este repositório também publica o site. Se ele estiver no GitHub Pages ou na hospedagem pública, a página `/consulta/` **também fica acessível** a quem souber o endereço. Ela não aparece no Google (`noindex`) e não contém dados de pacientes, mas o roteiro comercial fica visível. Prefira:
- abrir o `consulta/index.html` direto do computador ou tablet da clínica; ou
- hospedar a pasta `consulta/` num endereço com senha (por exemplo, Netlify/Cloudflare Pages com proteção por senha); ou
- tornar o repositório privado.

---

## 6. Personalizar o roteiro
Tudo o que aparece na tela está em **`roteiro.js`**, em português e comentado:
- **etapas**: falas, perguntas, checklist e dicas de cada etapa;
- **objecoes**: `gatilhos` (palavras que fazem a resposta aparecer) e as respostas;
- **intencoes**: perguntas que geram orientação automática;
- **sinaisCompra**: frases que esquentam o termômetro;
- **mensagens**: modelos de WhatsApp (confirmação, follow-up D+1/D+3/D+7/D+15, boas-vindas, indicação).

Variáveis disponíveis nas falas: `{nome}`, `{profissional}`, `{unidade}`, `{endereco}`, `{dor}`, `{evento}`, `{tratamento}`, `{valor}`, `{entrada}`, `{parcelas}`, `{dia}`, `{hora}`, `{dia2}`, `{hora2}`, `{condicao}`, `{validade}`, `{garantia}`. Se faltar um dado, ele aparece entre colchetes, por exemplo `[valor]`, para você lembrar de completar.
