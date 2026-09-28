/**
 * White-label guard: color may only exist in src/tokens. A hexadecimal inside
 * a component ties the library to a brand, and it is the easiest thing to do
 * without noticing.
 *
 * The scan covered only `components`, `provider` and `lib`, and the four
 * subpaths - `ai`, `chart`, `form` and `dnd` - stayed out of it without anyone
 * having decided so: a color or a `z-10` written in the `Kanban` would pass
 * silently. Measured on the day `dnd` came in, the four were clean. The list
 * below is the whole of `src/` minus `tokens`, the only place color may live.
 */
import { scanAtLeast } from "./scan";

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
      console.error(`${file}:${i + 1}  literal color: ${line.trim()}`);
      failed++;
    }
    if (Z_INDEX.test(line)) {
      console.error(`${file}:${i + 1}  literal stacking: ${line.trim()}`);
      failed++;
    }
  });
}

if (failed > 0) {
  console.error(
    `\n${failed} violation(s). Color lives in src/tokens, stacking uses var(--rc-z-*).`,
  );
  process.exit(1);
}
console.log(`Literal color guard ok in ${files.length} file(s).`);
