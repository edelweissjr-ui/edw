# Kinesis · versão hospedada (Vercel)

O mesmo sistema de `produtos/torque-fisioterapia/index.html`, rodando como site próprio, com login por e-mail e senha, banco de dados e regras de acesso aplicadas no servidor. Funciona sem o Claude.

- Endereço: https://kinesis-gestao.vercel.app (também https://kinesis-app-psi.vercel.app). Projeto `kinesis-app` na Vercel (equipe weiss-odontologia).

## Como está montado
- `api/index.js`: servidor (uma função da Vercel).
  - Login com senha guardada com scrypt, sessão em cookie HttpOnly assinado (30 dias), limite de tentativas de login.
  - Dados no Upstash Redis.
  - Permissões por setor aplicadas no servidor: quem não tem acesso ao prontuário nem recebe esses dados.
  - Limite de usuários da licença aplicado no servidor. Só o titular altera licença e faturas. A auditoria não pode ser alterada.
  - Desativar um usuário ou trocar a senha dele encerra as sessões abertas.
- `cliente.js`: telas de primeiro acesso e login e a ligação do sistema com o servidor. As mudanças de outros usuários aparecem em cerca de 4 segundos.
- `build.py`: gera `public/index.html` a partir do arquivo principal. Depois de mudar o sistema, rode `python3 kinesis/build.py` e publique de novo.

## Configuração na Vercel
1. **Banco (obrigatório):** abra o projeto e vá em Storage → Upstash for Redis (o plano gratuito serve para começar) → conectar ao projeto → Redeploy. Enquanto o banco não estiver conectado, o site mostra esse passo a passo.
2. **Primeiro acesso:** quem abrir o site primeiro cria a conta do titular. O titular controla o plano, o limite de usuários e as faturas. Ao vender para uma clínica, faça você o primeiro acesso e cadastre os sócios da clínica como "Administrador / Sócio".
3. **IA (opcional):** em Settings → Environment Variables, crie `ANTHROPIC_API_KEY` com uma chave da API da Anthropic e faça o Redeploy. Sem ela, o resto do sistema funciona e as telas de IA avisam que o recurso não está configurado.
4. `KINESIS_SECRET` (assinatura das sessões) já está configurada. Se for trocada, todos precisam entrar de novo.

## Uma instalação por clínica
Cada clínica deve ter o próprio projeto na Vercel e o próprio banco. Para criar outra, publique esta pasta num projeto novo e conecte um banco Upstash novo.
