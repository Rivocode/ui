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

/*
 * A varredura precisa alcancar tambem `node_modules/.bun`, onde o bun guarda o
 * pacote de verdade, o que fica em `node_modules/@fontsource*` e um link, e o
 * Glob nao atravessa link. Enquanto o repo tinha um pacote so isso nao
 * aparecia; virou workspace, a instalacao mudou de forma, e o build passou a
 * terminar dizendo que dezesseis fontes nao existem.
 */
const disponivel = new Map<string, string>();
const pastas = ["node_modules/@fontsource*/**/files/*", "node_modules/.bun/**/files/*"];

for (const padrao of pastas) {
  for await (const file of new Glob(padrao).scan({ cwd: ".", followSymlinks: true })) {
    const name = file.split("/").pop()!;
    if (!disponivel.has(name)) disponivel.set(name, file);
  }
}

const target = join(dirname(cssPath), "files");
let copiados = 0;
const missing: string[] = [];

for (const name of wanted) {
  const source = disponivel.get(name);
  if (!source) {
    missing.push(name);
    continue;
  }
  await Bun.write(join(target, name), Bun.file(source));
  copiados++;
}

if (missing.length > 0) {
  console.error(`fontes referenciadas que nao existem em node_modules: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`${copiados} arquivo(s) de fonte copiado(s) para ${target}`);
