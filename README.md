# Weiss Odontologia — site

Site de página única, animado, da Weiss Odontologia (Caruaru e Recife).

- `index.html` é o site completo (HTML + CSS + JS num único arquivo, sem dependências além das fontes do Google).
- Para publicar no GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → branch `master`, pasta `/ (root)`.
- Para usar no domínio odontoweiss.com.br, basta enviar o `index.html` para a hospedagem atual do site.

## Onde trocar conteúdo
- Cores: bloco `:root` no topo do `<style>` (`--gold`, `--ink`, `--aqua`).
- Logotipo: o `<svg class="brand-mark">` no cabeçalho pode ser trocado por `<img src="logo.svg">`.
- Telefones/WhatsApp: busque por `wa.me/55` no arquivo.

## Weiss Infinity — portal dos apps internos (Vercel)
- Endereço: **https://infinity.weissodontologia.com.br** (subdomínio do site; o site continua em www.weissodontologia.com.br).
- A pasta `apps/` é o projeto publicado na Vercel. `apps/index.html` é o portal com a lista de sistemas; `apps/vercel.json` define os atalhos: `/financeiro` (e `/contas`) abre o Weiss Financeiro.
- O Weiss Financeiro roda no Claude (https://claude.ai/artifact/TDSgSEYY3CResmE3sj5i5N): dados, comprovantes e login ficam lá, só para quem foi convidado. Perfis: titular/administrador (painel de gestão) e funcionário (lança contas e vê se estão pagas). Nada sensível fica neste repositório.
- O Weiss Indicadores roda no Claude (https://claude.ai/artifact/Bu4NKXrCWEuJb1kGveRQQZ), atalho `/indicadores`. Pacientes/leads e saídas ficam no banco do artifact, só para convidados. `docs/apps/indicadores.html` é a cópia do código.
- `docs/apps/contas-a-pagar.html` é uma cópia do código do Financeiro, para histórico de versões.
- A pasta `apps` não é publicada pelo GitHub Pages do site (`_config.yml`).

### Configurar na Vercel (uma vez)
1. Vercel → Add New → Project → importar o repositório `edelweissjr-ui/edw`.
2. Root Directory: `apps` · Framework Preset: Other · sem comando de build → Deploy.
3. Settings → Domains → adicionar `infinity.weissodontologia.com.br`.
4. registro.br → domínio weissodontologia.com.br → DNS → Editar zona e criar:
   - tipo **CNAME**, nome **infinity**, valor **cname.vercel-dns.com** (ou o valor que a Vercel mostrar em Domains)
   Não mexa nos registros que já existem: eles mantêm o site www no ar.
5. Em pouco tempo o subdomínio fica ativo, com HTTPS automático. Cada alteração no branch `master` publica sozinha.

## Alinha (sistema de gestão e vendas da equipe)
- Endereço: **https://alinha.weissodontologia.com.br** (outro subdomínio do site; o site continua em www.weissodontologia.com.br).
- A pasta `alinha/` é um projeto próprio na Vercel (Root Directory: `alinha`), com login, banco de dados (Upstash Redis) e cópias automáticas. Veja `alinha/README.md`.
- A pasta `alinha` não é publicada pelo GitHub Pages do site (`_config.yml`).
