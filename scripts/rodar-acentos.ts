import { acentuar, pendencias } from "./acentuar";

import { readdirSync } from "node:fs";

// O Glob do Bun ignora pasta oculta, e a dos documentos comeca com ponto — na
// primeira tentativa os 106 arquivos passaram batido e o script disse "5 de 5".
const alvos = [
  ...readdirSync(".design-sync/docs")
    .filter((arquivo) => arquivo.endsWith(".md"))
    .map((arquivo) => `.design-sync/docs/${arquivo}`),
  ...readdirSync("apps/docs/src/content")
    .filter((arquivo) => arquivo.endsWith(".md"))
    .map((arquivo) => `apps/docs/src/content/${arquivo}`),
];

let mudados = 0;
const restantes: string[] = [];

for (const arquivo of alvos) {
  const antes = await Bun.file(arquivo).text();
  const depois = acentuar(antes);
  if (antes !== depois) {
    await Bun.write(arquivo, depois);
    mudados++;
  }
  for (const linha of pendencias(depois)) restantes.push(`${arquivo}: ${linha}`);
}

console.log(`arquivos alterados: ${mudados} de ${alvos.length}`);
console.log(`linhas com "e" solto, para revisar: ${restantes.length}`);
await Bun.write("/tmp/revisar-e.txt", restantes.join("\n"));
