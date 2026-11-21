#!/usr/bin/env python3
"""Cria (ou atualiza) um sistema Kinesis hospedado na Vercel para UMA clínica.

Cada clínica fica isolada: projeto próprio na Vercel, endereço próprio, segredo de sessão próprio
e espaço de dados próprio (KINESIS_INSTANCIA). O banco Upstash também deve ser um por clínica:
depois de rodar este script, conecte um banco NOVO em Storage → Upstash for Redis.

Uso:
  python3 kinesis/nova-clinica.py <identificador>      ex.: python3 kinesis/nova-clinica.py clinica-movimento
  python3 kinesis/nova-clinica.py <identificador> --projeto kinesis-app   (atualiza um projeto existente)

Precisa de VERCEL_TOKEN no ambiente (ou de um proxy que autentique api.vercel.com) e, se for o caso,
VERCEL_TEAM_ID. O sistema publicado é o de kinesis/public/index.html: rode antes python3 kinesis/build.py.
"""
import json, os, re, secrets, sys, time, urllib.error, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
TEAM = os.environ.get("VERCEL_TEAM_ID", "team_8Pghz2SUvEUu3ZuDlERC87Lu")
TOKEN = os.environ.get("VERCEL_TOKEN", "")


def call(metodo, caminho, corpo=None):
    url = "https://api.vercel.com" + caminho + ("&" if "?" in caminho else "?") + "teamId=" + TEAM
    h = {"Content-Type": "application/json"}
    if TOKEN:
        h["Authorization"] = "Bearer " + TOKEN
    req = urllib.request.Request(url, method=metodo, headers=h, data=json.dumps(corpo).encode() if corpo is not None else None)
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return json.loads(e.read() or b"{}")


def main():
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        sys.exit(__doc__)
    ident = args[0].lower()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,40}", ident):
        sys.exit("Identificador inválido: use letras minúsculas, números e hífen (ex.: clinica-movimento).")
    nome_proj = args[args.index("--projeto") + 1] if "--projeto" in args else "kinesis-" + ident

    p = call("GET", "/v9/projects/" + nome_proj)
    if p.get("error"):
        p = call("POST", "/v11/projects", {"name": nome_proj, "framework": None})
        if p.get("error"):
            sys.exit("Não foi possível criar o projeto: " + p["error"].get("message", ""))
        print("Projeto criado:", nome_proj)
    else:
        print("Projeto existente:", nome_proj)
    pid = p["id"]
    call("PATCH", "/v9/projects/" + pid, {"ssoProtection": None})  # site aberto ao público (o login é do próprio Kinesis)

    existentes = {e["key"] for e in call("GET", "/v9/projects/" + pid + "/env").get("envs", [])}
    novas = {"KINESIS_INSTANCIA": ident}
    if "KINESIS_SECRET" not in existentes:
        novas["KINESIS_SECRET"] = secrets.token_hex(32)
    for k, v in novas.items():
        if k == "KINESIS_INSTANCIA" and k in existentes:
            continue  # nunca troca o espaço de dados de um sistema que já existe
        r = call("POST", "/v10/projects/" + pid + "/env?upsert=true", {"key": k, "value": v, "type": "encrypted", "target": ["production", "preview"]})
        print("Variável", k, "erro: " + r["error"].get("message", "") if r.get("error") else "ok")

    arquivos = ["api/index.js", "package.json", "package-lock.json", "vercel.json", "public/index.html"]
    files = [{"file": f, "data": open(os.path.join(AQUI, f), encoding="utf-8").read()} for f in arquivos]
    d = call("POST", "/v13/deployments", {"name": nome_proj, "project": pid, "target": "production", "files": files,
                                           "projectSettings": {"framework": None, "buildCommand": None, "installCommand": None, "outputDirectory": "public"}})
    if d.get("error"):
        sys.exit("Falha ao publicar: " + d["error"].get("message", ""))
    print("Publicando…", end="", flush=True)
    for _ in range(40):
        time.sleep(6)
        st = call("GET", "/v13/deployments/" + d["id"])
        if st.get("readyState") in ("READY", "ERROR", "CANCELED"):
            break
        print(".", end="", flush=True)
    print(" " + str(st.get("readyState")))
    print("Endereços:", ", ".join("https://" + a for a in st.get("alias", [])) or "https://" + d["url"])
    print("\nPróximo passo: na Vercel, projeto " + nome_proj + " → Storage → Upstash for Redis → crie um banco NOVO só para esta clínica → conecte → Redeploy.")


if __name__ == "__main__":
    main()
