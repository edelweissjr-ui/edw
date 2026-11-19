# Novidades do Alinha

## 2.0.0 — nov/2026
- Nova tela **Tratamentos**: cada tratamento do paciente tem uma **linha do tempo** com as etapas, as datas e o que vem a seguir.
  - Coroa em porcelana, prótese sobre implante e coroa sobre implante: orçamento (necessidade identificada) › orçamento aprovado › preparo do dente › escaneamento ou moldagem › enviado ao laboratório (com a **data de entrega combinada**) › recebido do laboratório › consulta de colocação agendada (dia e horário) › instalado.
  - Também: Invisalign (escaneamento iTero, ClinCheck, alinhadores pedidos e recebidos, entrega, tratamento, contenção), aparelho fixo e outros procedimentos.
  - Ao aprovar o orçamento, o paciente pode ser registrado como fechado no Comercial, com o valor.
  - Desfazer a última etapa e apagar tratamento (administrador).
- Aba **Laboratório**: no laboratório (com aviso de atraso e entrega do dia), chegou · agendar colocação, colocação agendada. Os avisos aparecem no topo do **Hoje**.
- **Linha do tempo completa** do paciente na ficha: entrada como lead, agendamento, consulta, follow-up, fechamento e todas as etapas dos tratamentos.
- Nova tela **Suporte**: chat para tirar dúvidas sobre o sistema (com IA quando configurada, baseada no manual; sem IA, responde pelo manual) e **manual de ajuda** pesquisável com 26 tópicos e atalhos para cada tela. Liberada para todos os perfis.
- **Letras mais nítidas**: fonte carregada mais cedo, ajuste de espaçamento entre letras, nenhum texto abaixo de 13 px e mais contraste nos textos secundários.
- Permissões: nova tela Tratamentos (liberada por padrão para Operacional e CRC).

## 1.9.0 — nov/2026
- **Sem barras de rolagem**: as telas longas foram organizadas em abas (Comercial: Funil do mês · CRM-Pipeline; Campanhas: Planejamento · Projeção · Cadência · Resultado do mês; Resultados: Gráfico · Tabela · WhatsApp; Consulta: Técnicas · Perfil DISC · Dicas · Guia) e o Hoje mostra os cartões em páginas que cabem na tela. As barras de rolagem não aparecem mais.
- **Nada rola para o lado**: Follow-up e Pipeline quebram as colunas em linhas (até 2 a 5 cartões por coluna, com "+ mais"); no celular, as tabelas viram cartões.
- **Ajustes ampliado**: usa a largura toda, em abas (Clínica e metas · Unidades · Permissões · Celular e acesso · Domínio · Voz · Sistema). Novos: **Unidades** (endereço, WhatsApp, telefone e e-mail editáveis, usados nas mensagens) e **Metas do mês** (leads, comparecimentos, fechamentos e faturamento).
- **Campanhas › Resultado do mês**: dos leads que entraram no mês, quantos compareceram, fecharam, faltaram, não fecharam e estão em follow-up de orçamento; custo por lead e por fechamento com o valor investido no mês; quadro previsto x meta x realizado.
- **Comercial** mostra o andamento das metas do mês.
- **Celular**: barra inferior com as 4 telas principais e o botão **Mais**.

## 1.8.1 — nov/2026
- Campanhas: o percentual de cada fase (topo, meio e fundo) é editável direto na pirâmide, digitando no próprio percentual ou arrastando o controle.
- Opção "Ajustar as outras fases para somar 100%": ao mudar uma fase, as outras se ajustam mantendo a proporção entre elas (pode desligar para editar livremente).
- Botão "Salvar como minha divisão", que vira um atalho ao lado das divisões prontas.

## 1.8.0 — nov/2026
- Nova tela **Comercial**: funil do mês (leads que entraram › agendaram › compareceram › fecharam), faltas, não fechados, follow-up de orçamento e recuperados, por unidade e mês.
- **CRM-Pipeline** com funil de leads e funil de clientes; arrastar e soltar; ficha do lead; quem comparece vira cliente e entra no follow-up D0.
- Conversa nova no WhatsApp cria o lead no CRM automaticamente (opcional); na conversa, botão "Adicionar ao CRM" / "Ver no CRM".
- Nova tela **Campanhas**: calculadora da pirâmide (topo, meio, fundo), cadência por fase e semanal, projeção de resultados e investimento para a meta.
- **Permissões** por perfil: Administrador, Operacional e CRC (usuário `crc`, senha `SENHA_CRC`), ajustáveis em Ajustes e aplicadas também no servidor.

## 1.7.0 — nov/2026
- Nova tela **Resultados**: pacientes por tratamento de interesse e por tratamento fechado (barras, tabela, conversão, valor fechado e ticket médio), com filtro de período e unidade.
- Interesse nas conversas de WhatsApp: tratamentos e assuntos mais falados.
- WhatsApp em três colunas: lista de conversas, chat normal (escrever e enviar; Enter envia) e chat sugerido ao lado ("Usar no chat", outra versão, modelos).
- Assuntos detectados em cada conversa (preço, agendamento, tratamento, medo, prazo, sorriso, decisor, endereço, convênio), com filtro.
- Perfil DISC do paciente (Dominante, Influente, Estável, Analítico) na consulta ao vivo, no WhatsApp, no briefing e na ficha, com orientação de como falar. A IA refina a leitura.
- Social Selling no WhatsApp: etapas SPIN e N.E.A.T. acompanhadas em cada conversa e a próxima pergunta pronta para usar.
- Ficha do paciente: campo Tratamento editável (alimenta os Resultados).

## 1.6.0 — nov/2026
- Domínio próprio (Registro.br): variável APP_URL com o endereço oficial; quem acessa pelo endereço da hospedagem é redirecionado (webhooks continuam funcionando).
- Ajustes › Domínio e endereços: página de login e webhook do Kommo prontos para copiar; botão "Verificar apontamento" (consulta o DNS).
- Cabeçalhos de segurança (HTTPS estrito, proteção contra incorporação em outros sites).
- Ícone de app (manifest) ao adicionar à tela de início do celular.

## 1.5.0 — nov/2026
- Base de conhecimento ampliada com os materiais "7 Funis de Vendas Comprovados para Clínicas" e "Atraia Clientes de Alto Valor", adaptados à Ortodontia e às regras do CFO.
- Reativação automática: quem não fechou (ou terminou a cadência) recebe contato com 30, 60 e 90 dias.
- Modelos de mensagem por situação, acessíveis na conversa de WhatsApp e nos cartões de follow-up.
- Princípios de atendimento e os 7 funis no guia rápido; a IA aplica nos textos e no briefing (inclui "próximo agendamento antes da saída").

## 1.4.0 — nov/2026
- Conectar celular (WhatsApp) por QR code em Ajustes (via Evolution API): as conversas entram na tela WhatsApp e a resposta é enviada direto do Alinha.
- Abrir o Alinha no celular por QR code.
- Hospedagem na Vercel com banco Upstash Redis (o Render e o computador continuam funcionando com arquivo).

## 1.3.0 — nov/2026
- Método de vendas integrado: SPIN, N.E.A.T., Venda conceitual, SNAP, Venda desafiadora (Challenger), Sandler e Venda centrada no cliente.
- Painel "Método da consulta": perguntas SPIN feitas, qualificação N.E.A.T., contrato inicial (Sandler) e a próxima pergunta sugerida; guia rápido das técnicas.
- Briefing com avaliação por técnica, "conceito" do paciente e a pergunta que faltou.
- A IA aplica as técnicas nas dicas ao vivo, nas respostas de WhatsApp (SNAP) e nas mensagens de follow-up.

## 1.2.0 — nov/2026
- WhatsApp ao vivo: as conversas de Caruaru e Recife chegam pelo webhook do Kommo, com orientação e resposta pronta a cada mensagem do paciente.
- Termômetro por conversa, "Assumir atendimento" (pausa a IA do n8n pela etiqueta no Kommo) e "Adicionar ao follow-up".
- Perfis de administrador (admin) e equipe.

## 1.1.0 — nov/2026
- Atualizações dentro do sistema: aviso de nova versão e botão "Atualizar agora".
- Cópia de segurança automática dos dados (diária e antes de cada atualização).
- Reconhecimento da voz do profissional.
- Modo sequência para alinhar os pacientes do dia.
- Termômetro de prontidão para o fechamento.

## 1.0.0 — nov/2026
- Dicas ao vivo, briefing pós-consulta, mensagem pronta e follow-up D0 a D30.
