/**
 * Guarda de contraste: le os arquivos de tema, resolve os tokens e falha se
 * algum par que carrega texto ficar abaixo do minimo da norma.
 */
const MIN_TEXT = 4.5;
const MIN_BODY = 7;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

export function contrastRatio(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

/**
 * Le `--rc-x: valor` e resolve um nivel de var(). Recebe a paleta concatenada
 * com o tema, porque o tema aponta para a paleta e ela vive em outro arquivo.
 */
export function readTokens(css: string): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [, name, value] of css.matchAll(/(--rc-[\w-]+)\s*:\s*([^;]+);/g)) {
    raw[name!] = value!.trim();
  }
  const resolved: Record<string, string> = {};
  for (const [name, value] of Object.entries(raw)) {
    const ref = value.match(/^var\((--rc-[\w-]+)\)$/);
    resolved[name] = ref ? (raw[ref[1]!] ?? value) : value;
  }
  return resolved;
}

/** Os pares que carregam texto e portanto precisam passar. */
const PAIRS: Array<[string, string, number]> = [
  ["--rc-fg", "--rc-bg", MIN_BODY],
  ["--rc-fg", "--rc-surface", MIN_BODY],
  ["--rc-fg-muted", "--rc-bg", MIN_TEXT],
  ["--rc-fg-muted", "--rc-surface", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-bg", MIN_TEXT],
  ["--rc-fg-subtle", "--rc-surface", MIN_TEXT],
  ["--rc-accent-text", "--rc-bg", MIN_TEXT],
  ["--rc-accent-fg", "--rc-accent", MIN_TEXT],
  ["--rc-success-text", "--rc-bg", MIN_TEXT],
  ["--rc-warning-text", "--rc-bg", MIN_TEXT],
  ["--rc-danger-text", "--rc-bg", MIN_TEXT],
  ["--rc-info-text", "--rc-bg", MIN_TEXT],
  ["--rc-success-text", "--rc-surface", MIN_TEXT],
  ["--rc-warning-text", "--rc-surface", MIN_TEXT],
  ["--rc-danger-text", "--rc-surface", MIN_TEXT],
  ["--rc-info-text", "--rc-surface", MIN_TEXT],
  ["--rc-success-fg", "--rc-success", MIN_TEXT],
  ["--rc-warning-fg", "--rc-warning", MIN_TEXT],
  ["--rc-danger-fg", "--rc-danger", MIN_TEXT],
  ["--rc-info-fg", "--rc-info", MIN_TEXT],
];

/** `--rc-fg-disabled` e isento: texto desabilitado nao entra na norma. */
if (import.meta.main) {
  const { Glob } = await import("bun");
  const palette = await Bun.file("src/tokens/palette.css").text();
  const files = await Array.fromAsync(new Glob("src/tokens/themes/*.css").scan("."));
  let failed = 0;

  for (const file of files.sort()) {
    const tokens = readTokens(palette + "\n" + (await Bun.file(file).text()));
    // Nem todo arquivo na pasta de temas e um tema: o de fontes, por exemplo,
    // so traz @import. Um tema de verdade sempre declara o fundo.
    if (!tokens["--rc-bg"]) continue;
    console.log(`\n${file}`);
    for (const [fg, bg, min] of PAIRS) {
      const a = tokens[fg];
      const b = tokens[bg];
      if (!a || !b) {
        console.log(`  FALTA  ${fg} sobre ${bg}`);
        failed++;
        continue;
      }
      // Todo token de PAIRS carrega texto, entao precisa virar hexadecimal.
      // Nao resolver e defeito da paleta ou do tema, nunca motivo para pular.
      if (!a.startsWith("#") || !b.startsWith("#")) {
        console.log(`  FALHA  ${fg} ou ${bg} nao resolveu para hexadecimal`);
        failed++;
        continue;
      }
      const ratio = contrastRatio(a, b);
      const ok = ratio >= min;
      if (!ok) failed++;
      console.log(
        `  ${ok ? "ok   " : "FALHA"} ${fg} sobre ${bg}  ${ratio.toFixed(2)}:1 (min ${min})`,
      );
    }
  }

  if (failed > 0) {
    console.error(`\n${failed} par(es) abaixo do minimo.`);
    process.exit(1);
  }
  console.log("\nContraste ok em todos os temas.");
}
