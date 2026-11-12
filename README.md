# Weiss Odontologia — site

Site de página única, animado, da Weiss Odontologia (Caruaru e Recife).

- `index.html` é o site completo (HTML + CSS + JS num único arquivo, sem dependências além das fontes do Google).
- Para publicar no GitHub Pages: Settings → Pages → Source: "Deploy from a branch" → branch `master`, pasta `/ (root)`.
- Para usar no domínio odontoweiss.com.br, basta enviar o `index.html` para a hospedagem atual do site.

## Onde trocar conteúdo
- Cores: bloco `:root` no topo do `<style>` (`--gold`, `--ink`, `--aqua`).
- Logotipo: o `<svg class="brand-mark">` no cabeçalho pode ser trocado por `<img src="logo.svg">`.
- Telefones/WhatsApp: busque por `wa.me/55` no arquivo.

## App "Boletim Cognitivo" (pasta `boletim/`)
App offline para o estudante acompanhar as notas no formato do Colégio Cognitivo (Manual do Estudante – Ensino Médio 2026).
- Abra `boletim/index.html` (ou publique a pasta e acesse `/boletim/`). No celular: "Adicionar à Tela de Início" para instalar.
- Regras: média da unidade = (PP + PU + PS) ÷ 3; abaixo de 7,0 → PR (nova média = (média + PR) ÷ 2, vale a maior); aprovação com 21 pontos nas 3 unidades; senão Recuperação Final (precisa de 10 − soma ÷ 3); bônus SimulaCOG e Laboratório de Redação até 0,5; frequência mínima de 75%.
- Funciona sem internet (service worker) e salva tudo só no aparelho (localStorage). Backup/restauração em JSON na aba Ajustes.
