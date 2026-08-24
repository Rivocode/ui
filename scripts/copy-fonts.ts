/**
 * Copia os arquivos de fonte para o lado da CSS compilada.
 *
 * O fontsource escreve `url(./files/nome.woff2)`, relativo ao css original
 * dentro de node_modules. Depois de compilar, esse caminho nao resolve mais, e
 * a pagina cai para fonte do sistema sem avisar ninguem. Este passo resolve
 * cada nome e copia o arquivo para `<pasta-da-css>/files/`.
 *
 * Uso: bun run scripts/copy-fonts.ts <caminho-da-css>
 */
import { Glob } from "bun";
import { dirname, join } from "node:path";

const cssPath = process.argv[2];
if (!cssPath) {
  console.error("uso: bun run scripts/copy-fonts.ts <caminho-da-css>");
  process.exit(1);
}

const css = await Bun.file(cssPath).text();
const wanted = new Set([...css.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((m) => m[1]!));

if (wanted.size === 0) {
  console.log("nenhuma fonte referenciada, nada a copiar.");
  process.exit(0);
}

const disponivel = new Map<string, string>();
for await (const file of new Glob("node_modules/@fontsource*/**/files/*").scan(".")) {
  disponivel.set(file.split("/").pop()!, file);
}

const destino = join(dirname(cssPath), "files");
let copiados = 0;
const faltando: string[] = [];

for (const nome of wanted) {
  const origem = disponivel.get(nome);
  if (!origem) {
    faltando.push(nome);
    continue;
  }
  await Bun.write(join(destino, nome), Bun.file(origem));
  copiados++;
}

if (faltando.length > 0) {
  console.error(`fontes referenciadas que nao existem em node_modules: ${faltando.join(", ")}`);
  process.exit(1);
}

console.log(`${copiados} arquivo(s) de fonte copiado(s) para ${destino}`);
