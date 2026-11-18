# Weiss Odontologia — site

Site de página única, animado, da Weiss Odontologia (Caruaru e Recife).

- `index.html` é o site completo (HTML + CSS + JS num único arquivo, sem dependências além das fontes do Google).
- Para publicar no GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → branch `master`, pasta `/ (root)`.
- Para usar no domínio odontoweiss.com.br, basta enviar o `index.html` para a hospedagem atual do site.

## Onde trocar conteúdo
- Cores: bloco `:root` no topo do `<style>` (`--gold`, `--ink`, `--aqua`).
- Logotipo: o `<svg class="brand-mark">` no cabeçalho pode ser trocado por `<img src="logo.svg">`.
- Telefones/WhatsApp: busque por `wa.me/55` no arquivo.

## Apps internos (Weiss Apps) — hospedados na Vercel
- A pasta `apps/` é um projeto separado do site, publicado na Vercel em domínio próprio (o site continua no seu domínio).
- `apps/index.html` é o portal com a lista de sistemas; `apps/vercel.json` define os atalhos: `/financeiro` (e `/contas`) abre o Weiss Financeiro.
- O Weiss Financeiro roda no Claude (https://claude.ai/artifact/TDSgSEYY3CResmE3sj5i5N): dados, comprovantes e login ficam lá, só para quem foi convidado. Nada sensível fica neste repositório.
- `docs/apps/contas-a-pagar.html` é uma cópia do código do Financeiro, para histórico de versões.
- A pasta `apps` não é publicada pelo GitHub Pages do site (`_config.yml`).

### Configurar na Vercel (uma vez)
1. Vercel → Add New → Project → importar o repositório `edelweissjr-ui/edw`.
2. Root Directory: `apps` · Framework Preset: Other · sem comando de build.
3. Deploy. Depois, Settings → Domains → adicionar o subdomínio escolhido (ex.: `apps.seudominio.com.br`).
4. No registro.br, na zona DNS do domínio, criar um registro CNAME com o nome do subdomínio apontando para o valor que a Vercel mostrar (normalmente `cname.vercel-dns.com`).
5. A partir daí, cada alteração aprovada no branch principal publica sozinha.
