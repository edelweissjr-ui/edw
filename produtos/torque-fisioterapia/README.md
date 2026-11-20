# Torque Fisioterapia

Sistema de gestão para a clínica Torque Fisioterapia (5 sócios), com os módulos que os sistemas mais usados no Brasil oferecem.

- **Publicado no Claude (privado):** https://claude.ai/artifact/Avzh5ZkiDvhVhARd87uQJ2. Lá os dados ficam num banco compartilhado, só para quem for convidado pelo menu Compartilhar.
- **`index.html`:** a mesma página. Aberta fora do Claude, guarda os dados no navegador (modo local).

## Módulos
- **Início:** agenda do dia com ações rápidas (WhatsApp, atendido, faltou, evoluir), indicadores do mês e alertas: atendimentos sem evolução, pacotes/guias acabando, contas vencidas, aniversariantes.
- **Agenda:** visão por dia (uma coluna por fisioterapeuta) e por semana; clique no horário vazio para agendar; sessões repetidas (ex.: Seg e Qua, 10 sessões); aviso de conflito; confirmação pelo WhatsApp.
- **Pacientes e prontuário:** cadastro completo (convênio, carteirinha, guia, médico, CID, LGPD), avaliação fisioterapêutica (anamnese, EVA, goniometria, força de Oxford, testes, escalas, diagnóstico cinético-funcional, plano), evoluções SOAP com técnicas, curva de dor. Registros não são apagados nem alterados; correções entram como adendo (Res. COFFITO 414/2012).
- **Avaliação traumato-ortopédica:** testes especiais prontos por região (ombro, cotovelo, punho e mão, quadril, joelho, tornozelo e pé, coluna e osteopatia), com + ou − por lado, observação e o que o teste positivo sugere. Na osteopatia, campo para as disfunções somáticas.
- **Reteste a cada sessão:** a evolução já traz os testes que estavam positivos para retestar, e aceita qualquer outro teste da lista.
- **Linha do tempo do paciente:** avaliação, sessões numeradas e faltas em ordem; dor antes e depois de cada sessão; técnicas; testes que negativaram ou positivaram; e o mapa de cada teste sessão a sessão.
- **Documentos:** declaração de comparecimento, atestado, recibo com valor por extenso, relatório para o médico e termo de consentimento, com a logomarca.
- **Financeiro:** receitas e despesas, contas a pagar/receber, despesas fixas mensais. Atendimento marcado como atendido gera a receita sozinho (pacotes são lançados uma vez na venda).
- **Relatórios:** atendimentos, faltas, ticket médio, produção por fisioterapeuta, convênios, serviços, origem dos pacientes e **fechamento do mês com divisão do lucro pelas cotas dos sócios** (padrão 20% cada).
- **Ajustes:** dados da clínica, sócios e colaboradores (CREFITO, cota, comissão), serviços e valores, convênios, categorias e cópia de segurança (JSON).

Abre com dados de exemplo, só na tela; eles somem quando o primeiro paciente real é cadastrado.
