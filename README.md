# Weiss Odontologia — site

Site de página única, animado, da Weiss Odontologia (Caruaru e Recife).

- `index.html` é o site completo (HTML + CSS + JS num único arquivo, sem dependências além das fontes do Google).
- Para publicar no GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → branch `master`, pasta `/ (root)`.
- Para usar no domínio odontoweiss.com.br, basta enviar o `index.html` para a hospedagem atual do site.

## Onde trocar conteúdo
- Cores: bloco `:root` no topo do `<style>` (`--gold`, `--ink`, `--aqua`).
- Logotipo: o `<svg class="brand-mark">` no cabeçalho pode ser trocado por `<img src="logo.svg">`.
- Telefones/WhatsApp: busque por `wa.me/55` no arquivo.

## Alinha (copiloto de fechamento)
A pasta `alinha/` contém o sistema interno da equipe: dicas ao vivo durante a consulta, briefing pós-consulta, mensagem pronta de WhatsApp e follow-up D0 a D30. Publicação pelo `render.yaml`. Veja `alinha/README.md`.
