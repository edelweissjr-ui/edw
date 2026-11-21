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
3. **IA (opcional):** em Settings → Environment Variables, crie `ANTHROPIC_API_KEY` com uma chave da API da Anthropic e faça o Redeploy. A inteligência artificial do sistema se chama **KIN**. Sem a chave, o resto do sistema funciona e as telas da KIN avisam que o recurso não está configurado.
4. `KINESIS_SECRET` (assinatura das sessões) já está configurada. Se for trocada, todos precisam entrar de novo.

## Um sistema e um banco por clínica
Cada sistema hospedado é independente: projeto próprio na Vercel, endereço próprio, segredo de sessão próprio e **banco Upstash próprio**.
- Para criar o sistema de uma nova clínica: `python3 kinesis/build.py` e depois `python3 kinesis/nova-clinica.py <identificador>` (ex.: `clinica-movimento`). O script cria o projeto `kinesis-<identificador>`, gera o segredo de sessão, define o espaço de dados e publica.
- Em seguida, no projeto novo: Storage → Upstash for Redis → **crie um banco novo** (não reaproveite o de outra clínica) → conectar → Redeploy.
- Proteção extra: todas as chaves do banco levam o identificador da clínica (`KINESIS_INSTANCIA`). Se dois projetos forem ligados ao mesmo banco por engano, os dados, logins e sessões de um continuam invisíveis para o outro.
- Para atualizar um sistema existente depois de mudar o código: `python3 kinesis/nova-clinica.py <identificador> --projeto <nome-do-projeto>`. O script nunca troca o identificador de um sistema que já existe, para os dados não "sumirem".
