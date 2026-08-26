import { addAccents, pendingLines } from "./acentuar";

import { readdirSync } from "node:fs";

// O Glob do Bun ignora pasta oculta, e a dos documentos comeca com ponto, na
// primeira tentativa os 106 arquivos passaram batido e o script disse "5 de 5".
const TARGETS = [
  ...readdirSync(".design-sync/docs")
    .filter((file) => file.endsWith(".md"))
    .map((file) => `.design-sync/docs/${file}`),
  ...readdirSync("apps/docs/src/content")
    .filter((file) => file.endsWith(".md"))
    .map((file) => `apps/docs/src/content/${file}`),
];

let changed = 0;
const pending: string[] = [];

for (const file of TARGETS) {
  const before = await Bun.file(file).text();
  const after = addAccents(before);
  if (before !== after) {
    await Bun.write(file, after);
    changed++;
  }
  for (const row of pendingLines(after)) pending.push(`${file}: ${row}`);
}

console.log(`arquivos alterados: ${changed} de ${TARGETS.length}`);
console.log(`linhas com "e" solto, para revisar: ${pending.length}`);
await Bun.write("/tmp/revisar-e.txt", pending.join("\n"));
