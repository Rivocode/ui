import { expect, test } from "bun:test";

import { availableFonts, wantedFonts } from "../scripts/copy-fonts";

test("cada arquivo de fonte que o rivocode-fonts.css pede existe em node_modules", async () => {
  const source = await Bun.file("src/tokens/themes/rivocode-fonts.css").text();
  const imports = [...source.matchAll(/@import\s+"([^"]+)";/g)].map((match) => match[1]!);
  expect(imports.length).toBeGreaterThan(2);

  const available = await availableFonts();
  const wanted: string[] = [];
  for (const request of imports) {
    const css = await Bun.file(Bun.resolveSync(request, process.cwd())).text();
    wanted.push(...wantedFonts(css));
  }
  expect(wanted.length).toBeGreaterThan(10);

  expect(wanted.filter((name) => !available.has(name))).toEqual([]);
});
