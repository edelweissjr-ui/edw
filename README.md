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
- Endereço: **https://www.weissinfinity.com.br** (domínio próprio, separado do site da clínica).
- A pasta `apps/` é o projeto publicado na Vercel. `apps/index.html` é o portal com a lista de sistemas; `apps/vercel.json` define os atalhos: `/financeiro` (e `/contas`) abre o Weiss Financeiro.
- O Weiss Financeiro roda no Claude (https://claude.ai/artifact/TDSgSEYY3CResmE3sj5i5N): dados, comprovantes e login ficam lá, só para quem foi convidado. Perfis: titular/administrador (painel de gestão) e funcionário (lança contas e vê se estão pagas). Nada sensível fica neste repositório.
- `docs/apps/contas-a-pagar.html` é uma cópia do código do Financeiro, para histórico de versões.
- A pasta `apps` não é publicada pelo GitHub Pages do site (`_config.yml`).

### Configurar na Vercel (uma vez)
1. Vercel → Add New → Project → importar o repositório `edelweissjr-ui/edw`.
2. Root Directory: `apps` · Framework Preset: Other · sem comando de build → Deploy.
3. Settings → Domains → adicionar `weissinfinity.com.br` e `www.weissinfinity.com.br` (deixar o `www` como principal).
4. registro.br → domínio weissinfinity.com.br → DNS → Editar zona (modo avançado) e criar:
   - tipo **A**, nome em branco (raiz), valor **76.76.21.21**
   - tipo **CNAME**, nome **www**, valor **cname.vercel-dns.com**
   (Se a Vercel mostrar outros valores na tela de Domains, use os dela.)
5. Em até algumas horas o domínio fica ativo, com cadeado (HTTPS) automático. Cada alteração aprovada no branch principal publica sozinha.
