const RISKY = /"[^"]*"|'[^']*'|\/\*[\s\S]*?\*\//g;

export function compactCss(css: string) {
  for (const hit of css.matchAll(RISKY)) {
    if (/[{};\n]/.test(hit[0])) {
      throw new Error(
        `compactCss: string ou comentario com { } ; ou quebra de linha, e o corte de espaco o corromperia: ${hit[0].slice(0, 80)}`,
      );
    }
  }
  return `${css
    .replace(/[ \t]*\n\s*/g, "\n")
    .replace(/\s*([{};])\s*/g, "$1")
    .trim()}\n`;
}

if (import.meta.main) {
  const path = process.argv[2];
  if (!path) {
    console.error("uso: bun run scripts/compactar-css.ts <caminho-da-css>");
    process.exit(1);
  }
  const before = await Bun.file(path).text();
  const after = compactCss(before);
  await Bun.write(path, after);
  console.log(`${path}: ${before.length} -> ${after.length} bytes sem espaco inutil.`);
}
