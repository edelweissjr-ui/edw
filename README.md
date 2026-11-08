# Weiss Odontologia — site

Site de página única, animado, da Weiss Odontologia (Caruaru e Recife).

- `index.html` é o site completo (HTML + CSS + JS num único arquivo, sem dependências além das fontes do Google).
- Para publicar no GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → branch `master`, pasta `/ (root)`.
- Para usar no domínio odontoweiss.com.br, basta enviar o `index.html` para a hospedagem atual do site.

## Onde trocar conteúdo
- Cores: bloco `:root` no topo do `<style>` (`--gold`, `--ink`, `--aqua`).
- Logotipo: o `<svg class="brand-mark">` no cabeçalho pode ser trocado por `<img src="logo.svg">`.
- Telefones/WhatsApp: busque por `wa.me/55` no arquivo.

## Copiloto de Consulta
A pasta `consulta/` contém o sistema interno que acompanha a conversa com o paciente (presencial ou WhatsApp), sugere o que responder e envia o resultado direto ao Kommo. Ela roda como plataforma única com senha (`consulta/servidor`, publicação pelo `render.yaml`). Veja `consulta/README.md`.
