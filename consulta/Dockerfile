# Uso: na raiz do repositório, rode
#   docker build -f consulta/Dockerfile -t copiloto-weiss .
#   docker run -p 3000:3000 --env-file consulta/.env -v copiloto-dados:/dados copiloto-weiss
FROM node:22-slim
WORKDIR /app
COPY assets/escudo.png ./assets/escudo.png
COPY consulta/package.json consulta/package-lock.json ./consulta/
RUN cd consulta && npm ci --omit=dev
COPY consulta/index.html consulta/app.js consulta/roteiro.js ./consulta/
COPY consulta/servidor ./consulta/servidor
ENV PASTA_DADOS=/dados PORT=3000
EXPOSE 3000
CMD ["node", "consulta/servidor/server.js"]
