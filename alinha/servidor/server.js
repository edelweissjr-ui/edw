/* Alinha — servidor para Render, computador ou qualquer hospedagem com Node.
   Na Vercel, o mesmo núcleo roda como função em api/index.js. */
import http from "node:http";
import { handler, iniciar, resumoInicial, PORTA, STORE } from "./app.js";

await iniciar();
http.createServer((req, res) => { handler(req, res); }).listen(PORTA, () => {
  console.log(`${resumoInicial()} · porta ${PORTA}`);
});
// cópia de segurança diária (no arquivo) — na Vercel/Redis isso não roda
if (STORE.tipo === "arquivo") {
  STORE.backup("diario");
  setInterval(() => STORE.backup("diario"), 24 * 3600 * 1000).unref();
}
