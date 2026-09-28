import { scanAtLeast } from "./scan";
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
    console.error("usage: bun run scripts/copy-fonts.ts <css-path>");
    process.exit(1);
  }

  const wanted = wantedFonts(await Bun.file(cssPath).text());

  if (wanted.size === 0) {
    console.log("no font referenced, nothing to copy.");
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
    console.error(`referenced fonts that do not exist in node_modules: ${missing.join(", ")}`);
    process.exit(1);
  }

  console.log(`${copied} font file(s) copied to ${target}`);
}
