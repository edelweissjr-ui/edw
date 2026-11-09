# Na raiz do repositório:
#   docker build -f alinha/Dockerfile -t alinha .
#   docker run -p 3000:3000 --env-file alinha/.env -v alinha-dados:/dados alinha
FROM node:22-slim
WORKDIR /app
COPY alinha/package.json alinha/package-lock.json ./alinha/
RUN cd alinha && npm ci --omit=dev
COPY alinha/index.html alinha/app.js alinha/biblioteca.js alinha/demo.js alinha/voz.js ./alinha/
COPY alinha/servidor ./alinha/servidor
ENV PASTA_DADOS=/dados PORT=3000
EXPOSE 3000
CMD ["node", "alinha/servidor/server.js"]
