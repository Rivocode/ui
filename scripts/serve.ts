/**
 * Static server for the showcase.
 *
 * It has to be HTTP and not file://, because Chrome blocks JavaScript modules
 * loaded from a local file, and the page comes out blank without saying why.
 */
import { file } from "bun";
import { join, normalize } from "node:path";

const ROOT = "demo";

export function serveDemo(port = 0) {
  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname === "/" ? "/index.html" : url.pathname;
      // normalize strips any ../ before touching the disk.
      const target = join(ROOT, normalize(path).replace(/^(\.\.[/\\])+/, ""));
      const f = file(target);
      return (await f.exists()) ? new Response(f) : new Response("not found", { status: 404 });
    },
  });
}

if (import.meta.main) {
  const server = serveDemo(4173);
  console.log(`showcase at http://127.0.0.1:${server.port}/`);
  console.log(`dialog at http://127.0.0.1:${server.port}/dialog.html`);
}
