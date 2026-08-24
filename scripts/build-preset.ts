/**
 * Achata os arquivos de token num unico dist/preset.css. O consumidor importa
 * um arquivo e pronto, sem depender de como o bundler dele resolve @import
 * relativo dentro de node_modules.
 */
const ORDER = [
  'src/tokens/themes/rivocode-fonts.css',
  'src/tokens/palette.css',
  'src/tokens/scales.css',
  'src/tokens/contract.css',
  'src/tokens/themes/rivocode-dark.css',
  'src/tokens/themes/rivocode-light.css',
]

const parts: string[] = ['/* @rivocode/ui: tokens e temas. Gerado, nao editar. */']
for (const file of ORDER) {
  parts.push(`\n/* ${file} */\n${await Bun.file(file).text()}`)
}

await Bun.write('dist/preset.css', parts.join('\n'))
console.log(`dist/preset.css gerado a partir de ${ORDER.length} arquivos.`)
