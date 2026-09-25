import { scanAtLeast } from "./varredura";
import { dirname, join } from "node:path";

const FONT_FOLDERS = ["node_modules/@fontsource*/**/files/*", "node_modules/.bun/**/files/*"];

export function wantedFonts(css: string) {
  return new Set([...css.matchAll(/url\(\.\/files\/([^)]+)\)/g)].map((m) => m[1]!));
}

export async function availableFonts() {
  const available = new Map<string, string>();
  for (const file of await scanAtLeast(FONT_FOLDERS, 1, { followSymlinks: true })) {
    const name = file.split("/").pop()!;
    if (!available.has(name)) available.set(name, file);
  }
  return available;
}

if (import.meta.main) {
  const cssPath = process.argv[2];
  if (!cssPath) {
    console.error("uso: bun run scripts/copy-fonts.ts <caminho-da-css>");
    process.exit(1);
  }

  const wanted = wantedFonts(await Bun.file(cssPath).text());

  if (wanted.size === 0) {
    console.log("nenhuma fonte referenciada, nada a copiar.");
    process.exit(0);
  }

  const available = await availableFonts();
  const target = join(dirname(cssPath), "files");
  let copied = 0;
  const missing: string[] = [];

  for (const name of wanted) {
    const source = available.get(name);
    if (!source) {
      missing.push(name);
      continue;
    }
    await Bun.write(join(target, name), Bun.file(source));
    copied++;
  }

  if (missing.length > 0) {
    console.error(`fontes referenciadas que nao existem em node_modules: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`${copied} arquivo(s) de fonte copiado(s) para ${target}`);
}
