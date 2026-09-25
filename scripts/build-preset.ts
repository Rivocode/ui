import { dirname, join, normalize } from "node:path";

const SOURCE = "src/preset.css";

export async function flattenPreset(source = SOURCE) {
  const text = await Bun.file(source).text();
  const lines = text.split("\n");

  const files = lines
    .map((line) => /^\s*@import\s+"(\.[^"]+)";/.exec(line)?.[1])
    .filter((request): request is string => request !== undefined)
    .map((request) => normalize(join(dirname(source), request)));

  const parts: string[] = ["/* @rivocode/ui: tokens e temas. Gerado, nao editar. */"];
  for (const file of files) {
    parts.push(`\n/* ${file} */\n${await Bun.file(file).text()}`);
  }

  const rules = lines
    .filter((line) => !line.trimStart().startsWith("@import"))
    .join("\n")
    .trim();
  parts.push(`\n/* ${source} (sem os imports, ja achatados acima) */\n${rules}`);

  return { css: parts.join("\n"), files, rules };
}

if (import.meta.main) {
  const { css, files } = await flattenPreset();
  await Bun.write("dist/preset.css", css);
  console.log(`dist/preset.css gerado a partir de ${files.length} arquivos.`);
}
