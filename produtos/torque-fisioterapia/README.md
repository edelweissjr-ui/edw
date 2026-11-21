# Kinesis · Gestão em Clínicas

> Antes chamado Kinesis. A marca segue o Manual de Identidade Visual Kinesis v1.0 (nov/2026): símbolo K com haste azul-marinho e faixa em degradê verde-água, Azul Kinesis #12304A, Verde Movimento #0FA3A3, Verde Claro #3DD6C4, Dourado #AC8850 (no máximo 3%: assinatura e filetes), Gelo #F4F7F9, fonte Inter (títulos SemiBold 600).

Sistema de gestão para a clínica Kinesis Fisioterapia (5 sócios), com os módulos que os sistemas mais usados no Brasil oferecem.

- **Publicado no Claude (privado):** https://claude.ai/artifact/Avzh5ZkiDvhVhARd87uQJ2. Lá os dados ficam num banco compartilhado, só para quem for convidado pelo menu Compartilhar.
- **`index.html`:** a mesma página. Aberta fora do Claude, guarda os dados no navegador (modo local).

## Módulos
- **Início:** agenda do dia com ações rápidas (WhatsApp, atendido, faltou, evoluir), indicadores do mês e alertas: atendimentos sem evolução, pacotes/guias acabando, contas vencidas, aniversariantes.
- **Agenda:** visão por dia (uma coluna por fisioterapeuta) e por semana; clique no horário vazio para agendar; sessões repetidas (ex.: Seg e Qua, 10 sessões); aviso de conflito; confirmação pelo WhatsApp.
- **Cores e confirmação na agenda:** cada procedimento tem sua cor (ajustável em Ajustes). Ao lado do nome do paciente há uma barra cinza que fica verde quando o paciente confirma (clique na barra para confirmar ou desfazer); vermelha se faltou.
- **Contato do paciente:** telefone visível no agendamento e na agenda do dia, com botões de WhatsApp (confirmação), Lembrete (WhatsApp) e SMS, copiar número e copiar lembrete. O sistema registra quando cada lembrete foi enviado.
- **Chat da equipe:** conversas entre os profissionais em salas (Geral, Recepção e agenda, Casos clínicos, Sócios…), criação de novas salas, aviso de mensagens não lidas no menu.
- **Pacientes e prontuário:** cadastro completo (convênio, carteirinha, guia, médico, CID, LGPD), avaliação fisioterapêutica (anamnese, EVA, goniometria, força de Oxford, testes, escalas, diagnóstico cinético-funcional, plano), evoluções SOAP com técnicas, curva de dor. Registros não são apagados nem alterados; correções entram como adendo (Res. COFFITO 414/2012).
- **Avaliação traumato-ortopédica:** testes especiais prontos por região (ombro, cotovelo, punho e mão, quadril, joelho, tornozelo e pé, coluna e osteopatia), com + ou − por lado, observação e o que o teste positivo sugere. Na osteopatia, campo para as disfunções somáticas.
- **Reteste a cada sessão:** a evolução já traz os testes que estavam positivos para retestar, e aceita qualquer outro teste da lista.
- **Linha do tempo do paciente:** avaliação, sessões numeradas e faltas em ordem; dor antes e depois de cada sessão; técnicas; testes que negativaram ou positivaram; e o mapa de cada teste sessão a sessão.
- **Documentos:** declaração de comparecimento, atestado, recibo com valor por extenso, relatório para o médico e termo de consentimento, com a logomarca.
- **Financeiro:** receitas e despesas, contas a pagar/receber, despesas fixas mensais. Atendimento marcado como atendido gera a receita sozinho (pacotes são lançados uma vez na venda).
- **Relatórios:** atendimentos, faltas, ticket médio, produção por fisioterapeuta, convênios, serviços, origem dos pacientes e **fechamento do mês com divisão do lucro pelas cotas dos sócios** (padrão 20% cada).
- **Ajustes:** dados da clínica, sócios e colaboradores (CREFITO, cota, comissão), serviços e valores, convênios, categorias e cópia de segurança (JSON).

Abre com dados de exemplo, só na tela; eles somem quando o primeiro paciente real é cadastrado.

## Módulos de gestão (inspirados no Livive)
- **Painel:** guia de primeiros passos (8 etapas), comparecimento em 30 dias e pendências (evoluções, contas vencidas, estoque baixo, guias vencendo, lista de espera).
- **Agenda:** salas de atendimento, status "Em espera" (paciente chegou), lista de espera, bloqueio de horário, feriados nacionais e locais, observações do dia, filtros por sala, status e procedimento, busca por nome/CPF, teleconsulta com link de vídeo (Jitsi Meet) e agenda do dia para baixar e imprimir.
- **Modelos de prontuário:** fichas personalizadas por especialidade. Padrões: Pilates (avaliação inicial com PAR-Q e evolução da aula), fisioterapia pélvica (PERFECT) e neurofuncional (Berg, TUG, Ashworth). Duplique e edite os campos (texto, número, data, sim/não, lista, múltipla escolha, escala 0–10).
- **Finanças:** período com comparação, recebido, a receber, pago, a pagar, saldo, ticket médio, inadimplência, projeção; abas Painel (fluxo de caixa de 6 meses, receita acumulada vs. meta, forma de pagamento, categoria), Inadimplência (cobrança por WhatsApp), Contas, Categorias, Centros de custo e Repasses.
- **Relatórios:** períodos (mês, mês anterior, 3 e 6 meses, ano) com comparação, atendimentos por situação, novos pacientes em 12 meses, NPS por mês, comparativo por profissional, divisão entre sócios; CSV e relatório para PDF.
- **Estoque:** itens com mínimo, validade e custo; entradas, saídas, ajustes e movimentações; alerta de baixo estoque e vencimento; compra lançada como despesa.
- **Convênios (TISS):** guias com senha, sessões autorizadas x realizadas, validade, valor, glosa e situação; operadoras e dados do prestador. Não gera o XML TISS.
- **Satisfação do paciente:** pesquisa NPS enviada pelo WhatsApp, registro da nota e do comentário, NPS, nota média e distribuição.
- **Conhecimento (IA do Claude):** Assistente clínico (pode usar o resumo do prontuário, sem nome), Evidências (síntese com referências e links para PubMed/SciELO) e Bulas (o que importa para a fisioterapia). Funciona quando aberto no Claude.
- **Migração de dados:** importa CSV ou Excel de pacientes, profissionais, agendamentos, histórico de prontuário e financeiro, com modelo CSV e ligação das colunas.
- **Auditoria:** registro de quem criou, alterou ou excluiu cada registro.
- **Geral:** busca global (Ctrl K), botão + para criar, sino de pendências, tema claro/escuro, "Você" (profissional atual), botões "Preciso de ajuda" e "Chat interno".
- Fora do escopo: vídeo próprio para teleconsulta, agendamento online pelo paciente (exige página pública), envio automático de WhatsApp/SMS e XML TISS.

## Acesso por setor, licenças e CRM
- **Usuários e permissões** (Sistema): cada pessoa é cadastrada com um setor: Administrador/Sócio, Fisioterapeuta, Financeiro, Comercial, Estoque, Recepcionista ou CRC. A matriz de permissões define, por área, Sem acesso / Ver / Editar. "Ver o sistema como" mostra a tela de cada setor. Quem abre o link sem cadastro vê "Acesso aguardando liberação".
- **Prontuário clínico** (avaliações, evoluções, fichas, linha do tempo, relatório clínico) fica, por padrão, só com fisioterapeutas e administradores (LGPD e sigilo COFFITO).
- **Plano e licenças** (monetização): tabela de planos com preço de venda, plano atual, número de usuários liberados (o sistema bloqueia novos usuários acima do limite), preço por usuário adicional, vencimento, tolerância, modo leitura quando vencida, link de pagamento e Pix, faturas mensais (marcar como paga renova o vencimento). Só o titular da conta altera.
- **CRM / Comercial**: funil em quadros (novo lead, em contato, avaliação agendada, proposta, ganho, perdido) com arrastar e soltar, temperatura, valor, responsável, próximo contato, histórico de contatos, motivo da perda, conversão em paciente com agendamento da avaliação; follow-up de hoje e atrasados; leads por origem; aba Relacionamento (CRC) com reativação, aniversariantes, pós-alta e pacotes acabando.
- **Identidade visual** (Ajustes): envio da logomarca e nome da barra lateral; a logomarca vai para os documentos.
- Regras do banco: só administradores (editores) gravam usuários e configurações; só o titular grava licença e faturas. As demais permissões por setor são aplicadas pela própria página.

## Identidade Kinesis e configurações
- **Marca:** Kinesis Saúde e Reabilitação, com o monograma TF redesenhado em vetor (T azul-marinho, F lilás) e o lema "Movimento que transforma". Paleta da logomarca: azul-marinho #2e3a56, lilás #5f5aa2 e fundo bege #f4f2ee, com versão escura.
- **Cores do painel:** 7 temas prontos, cor principal, cor de destaque, cor própria do menu lateral e tom de fundo. Ao enviar outra logomarca, o sistema extrai os tons dela.
- **Configurações em seções:** Agenda (horários por profissional e dia, com intervalo; fora do horário fica sombreado), Clínica e equipe, Prontuário e documentos (assinatura em imagem nos documentos), Financeiro e dados (avisos de vencimento, exportações, cópia de segurança), WhatsApp e lembretes (textos editáveis com variáveis, diagnóstico e histórico de envios), Segurança da conta e Plano e cobrança.
- **Finanças:** meta mensal de faturamento, faturamento por janela (30, 90 e 120 dias) e resumo de repasses.
- **Leitura:** fontes com suavização e tamanho base de 15 px; campos e botões com altura mínima para toque.

## Demonstração para clientes
- Link público: https://kinesis-clinic-demo.vercel.app (os links antigos torque-saude-demo.vercel.app e torque-demo-bice.vercel.app também abrem). Projeto `torque-demo` na Vercel.
- Login de demonstração: usuário **admin**, senha **admin**. A tela de login é só uma porta de entrada da demonstração, não protege dados.
- Roda só no navegador do visitante (sem banco compartilhado), com dados fictícios. Os botões "Recomeçar demonstração" e "Sair" ficam no topo. Os recursos de IA não funcionam fora do Claude.
- `demo/` é gerado a partir do `index.html`. Para atualizar, gere de novo e publique na Vercel.
- Paleta medida na logomarca: azul-ardósia #424e68, lilás #918ba5, fundo bege.
