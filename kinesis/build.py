#!/usr/bin/env python3
"""Gera kinesis/public/index.html (versão hospedada) a partir do arquivo principal do sistema.
Uso: python3 kinesis/build.py"""
import os, re

AQUI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(AQUI, "..", "produtos", "torque-fisioterapia", "index.html")
OUT = os.path.join(AQUI, "public", "index.html")

s = open(SRC, encoding="utf-8").read()
i = s.index("\n<script>\n") + 1
fim = s.rindex("</script>")
marcacao, app = s[:i], s[i + len("<script>\n"):fim]
assert "</script" not in app.lower(), "o código do app não pode conter </script>"

def R(txt, a, b):
    assert txt.count(a) == 1, (txt.count(a), a[:80])
    return txt.replace(a, b)

marcacao = R(marcacao, "<title>Kinesis</title>\n", "")
marcacao = re.sub(r'<meta name="claude:[^>]*>\n?', "", marcacao)
marcacao = R(marcacao, '<span id="modo" class="pill">Carregando…</span>',
             '<span id="modo" class="pill">Carregando…</span><a href="#" class="kin-sair" onclick="event.preventDefault();T.sair()">Sair</a>')

K = ('<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="kgl" x1="0" y1="1" x2="1" y2="0">'
     '<stop offset="0" stop-color="#0FA3A3"/><stop offset="1" stop-color="#3DD6C4"/></linearGradient></defs>'
     '<rect x="16" y="10" width="14" height="80" rx="3" fill="#12304A"/><path d="M47 50L58 41L92 90H73z" fill="#12304A"/>'
     '<path d="M37 58C49 39 64 23 86 9h5C76 27 62 47 48 69z" fill="url(#kgl)"/></svg>')

CSS = """
.kin-gate{position:fixed;inset:0;z-index:300;display:grid;place-items:center;overflow:auto;padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px));background:#F4F7F9;font-family:Inter,system-ui,sans-serif}
.kin-gate[hidden]{display:none}
.login-card{width:min(420px,100%);background:#fff;border:1px solid #d6e0e7;border-radius:16px;padding:32px 28px;display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 60px rgba(18,48,74,.14);color:#0f2236}
.login-card form{display:flex;flex-direction:column;gap:14px}
.login-card .f{display:flex;flex-direction:column;gap:6px;color:#5B6B7A;font-size:13px;font-weight:500}
.login-card input{font:inherit;font-size:15px;padding:10px 12px;border-radius:10px;background:#fff;color:#0f2236;border:1px solid #c9d5de;min-height:44px}
.login-card input:focus{outline:2px solid #0FA3A3;outline-offset:1px;border-color:#0FA3A3}
.login-marca{display:flex;flex-direction:column;align-items:center;gap:2px;color:#12304A;margin-bottom:6px}.login-marca svg{width:72px;height:72px}
.login-marca b{font-weight:600;letter-spacing:.04em;font-size:32px;margin-top:6px;line-height:1}.login-marca small{font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#AC8850;margin-top:8px;font-weight:500}
.login-card h1{font-size:19px;text-align:center;color:#12304A;font-weight:600;margin:0}.lg-dica{margin:0;text-align:center;color:#5B6B7A;line-height:1.5}.lg-e{margin:0;color:#b3261e;font-size:13px}
.lg-b{width:100%;justify-content:center;min-height:46px;background:#12304A!important;border:1px solid #12304A!important;color:#fff!important;font:600 15px Inter,system-ui,sans-serif;border-radius:10px;cursor:pointer}
.lg-b:disabled{opacity:.6;cursor:wait}.lg-nota{margin:0;font-size:12px;color:#5B6B7A;text-align:center;line-height:1.5}
.lg-passos{margin:0;padding-left:20px;color:#0f2236;line-height:1.6;font-size:14px}
.kin-sair{color:var(--nav-muted);font-size:12px;text-decoration:underline;margin-left:8px}.kin-sair:hover{color:var(--nav-fg)}
"""

GATE = f"""<div id="kin-gate" class="kin-gate" role="dialog" aria-modal="true" aria-labelledby="lg-t"><div id="kin-card" class="login-card"><div class="login-marca">{K}<b>KINESIS</b><small>Gestão em Clínicas</small></div><p class="lg-dica">Carregando…</p></div></div>
<template id="kin-marca-tpl"><div class="login-marca">{K}<b>KINESIS</b><small>Gestão em Clínicas</small></div></template>"""

cliente = open(os.path.join(AQUI, "cliente.js"), encoding="utf-8").read()

doc = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#12304A">
<meta name="description" content="Kinesis · Gestão em Clínicas de fisioterapia.">
<title>Kinesis</title>
<link rel="icon" href="data:image/svg+xml,{K.replace('"', "'").replace('#', '%23').replace('<', '%3C').replace('>', '%3E')}">
<style>body{{margin:0;background:#F4F7F9}}{CSS}</style>
</head>
<body>
{GATE}
{marcacao}
<script type="text/plain" id="kin-src">
{app}</script>
<script>
{cliente}</script>
</body>
</html>
"""
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(doc)
print("ok", OUT, len(doc))
