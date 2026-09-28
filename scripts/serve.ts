/**
 * Servidor estatico da vitrine.
 *
 * Precisa ser HTTP e nao file://, porque o Chrome bloqueia modulo JavaScript
 * carregado de arquivo local, e a pagina sai em branco sem dizer o motivo.
 */
import { file } from "bun";
import { join, normalize } from "node:path";

const RAIZ = "demo";

export function servir(porta = 0) {
  return Bun.serve({
    port: porta,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      // normalize corta qualquer ../ antes de tocar no disco.
      const alvo = join(RAIZ, normalize(path).replace(/^(\.\.[/\\])+/, ""));
      const f = file(alvo);
      return (await f.exists()) ? new Response(f) : new Response("nao encontrado", { status: 404 });
    },
  });
}

if (import.meta.main) {
  const servidor = servir(4173);
  console.log(`vitrine em http://127.0.0.1:${servidor.port}/`);
  console.log(`dialogo em http://127.0.0.1:${servidor.port}/dialog.html`);
}
