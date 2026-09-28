/**
 * Guarda do white-label: cor so pode existir em src/tokens. Um hexadecimal
 * dentro de um componente amarra a biblioteca a uma marca, e e a coisa mais
 * facil de fazer sem perceber.
 *
 * A varredura cobria so `components`, `provider` e `lib`, e os quatro
 * subcaminhos - `ai`, `chart`, `form` e `dnd` - ficavam fora dela sem ninguem
 * ter decidido isso: uma cor ou um `z-10` escrito no `Kanban` passaria calado.
 * Medido no dia em que o `dnd` entrou, os quatro estavam limpos. A lista abaixo
 * e o `src/` inteiro menos `tokens`, que e o unico lugar onde a cor pode morar.
 */
import { scanAtLeast } from "./varredura";

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/;
const Z_INDEX = /z-index\s*:\s*-?\d+|\bz-\[?-?\d+\]?\b/;

const files = await scanAtLeast(
  "src/{components,provider,lib,shared,ai,chart,form,dnd}/**/*.{ts,tsx,css}",
  90,
);

let failed = 0;
for (const file of files) {
  const lines = (await Bun.file(file).text()).split("\n");
  lines.forEach((line, i) => {
    if (COLOR.test(line)) {
      console.error(`${file}:${i + 1}  cor literal: ${line.trim()}`);
      failed++;
    }
    if (Z_INDEX.test(line)) {
      console.error(`${file}:${i + 1}  empilhamento literal: ${line.trim()}`);
      failed++;
    }
  });
}

if (failed > 0) {
  console.error(
    `\n${failed} violacao(oes). Cor vive em src/tokens, empilhamento usa var(--rc-z-*).`,
  );
  process.exit(1);
}
console.log(`Guarda de cor literal ok em ${files.length} arquivo(s).`);
