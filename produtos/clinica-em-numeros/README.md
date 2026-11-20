# Clínica em Números

Versão comercial (sem a marca Weiss) do painel de indicadores, pronta para oferecer a outras clínicas.

## O que tem
- **Comercial:** oportunidades de venda, agendados, faltaram, remarcaram, fecharam, % de conversão, follow-up de orçamento, finalizaram e indicações.
- **Financeiro:** entrou de entrada, saiu, saldo, ticket médio, não pagaram, inadimplência, pagaram em espécie, em cartão e à vista.
- **Funil de leads** e **funil de clientes**.
- **Gráficos:** entradas × saídas por mês, conversão por mês, como conheceu a clínica, campanhas, agenda e formas de pagamento.
- Cadastro de pacientes/leads e de saídas, filtros por período e unidade, exportação CSV.
- **Configurar clínica:** nome e unidades de cada cliente (sem mexer no código).

## Arquivos
- `index.html`: página completa para hospedar em qualquer lugar (Vercel, Netlify, GitHub Pages). Sem o Claude, guarda os dados **no navegador** de quem usa (modo local).
- `index-artifact.html`: a mesma página no formato de Artifact do Claude. Vitrine publicada (privada): https://claude.ai/artifact/2YN4X6KhAGAK8sDZecJZQD. No Claude, os dados ficam num banco compartilhado entre quem tem acesso.

## Antes de vender
- O modo local não tem login nem cópia na nuvem: serve como demonstração ou para uma pessoa só. Para vender como assinatura com vários usuários, o próximo passo é um servidor com login e banco (como o Alinha já tem).
- Abre com dados de exemplo enquanto não há cadastros; somem ao salvar o primeiro paciente.
- Os dados de pacientes são dados pessoais (LGPD): o contrato com cada clínica deve dizer onde ficam e quem acessa.
