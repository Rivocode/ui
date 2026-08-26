/**
 * Achata os arquivos de token num unico dist/preset.css. O consumidor importa
 * um arquivo e pronto, sem depender de como o bundler dele resolve @import
 * relativo dentro de node_modules.
 */
const ORDER = [
  "src/tokens/palette.css",
  "src/tokens/scales.css",
  "src/tokens/forma.css",
  "src/tokens/contract.css",
  "src/tokens/themes/rivocode-dark.css",
  "src/tokens/themes/rivocode-light.css",
];

const parts: string[] = ["/* @rivocode/ui: tokens e temas. Gerado, nao editar. */"];
for (const file of ORDER) {
  parts.push(`\n/* ${file} */\n${await Bun.file(file).text()}`);
}

/**
 * O que o src/preset.css declara alem dos imports viaja junto: e a regra que
 * pinta o fundo do tema e a que devolve o cursor de mao. Sem isto o preset
 * publicado entregava os tokens e esquecia as duas, e o consumidor via o
 * fundo cinza do navegador sem nenhum erro explicando.
 */
const presetSource = await Bun.file("src/preset.css").text();
const semImports = presetSource
  .split("\n")
  .filter((line) => !line.trimStart().startsWith("@import"))
  .join("\n")
  .trim();
parts.push(`\n/* src/preset.css (sem os imports, ja achatados acima) */\n${semImports}`);

await Bun.write("dist/preset.css", parts.join("\n"));
console.log(`dist/preset.css gerado a partir de ${ORDER.length} arquivos.`);

export {};
