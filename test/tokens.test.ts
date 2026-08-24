import { expect, test } from "bun:test";

import { contrastRatio, readTokens } from "../scripts/check-contrast";

const read = (p: string) => Bun.file(p).text();

const base = async () =>
  (await read("src/tokens/palette.css")) + "\n" + (await read("src/tokens/scales.css"));

test("todo token que o contrato referencia existe nos dois temas", async () => {
  const contract = await read("src/tokens/contract.css");
  const referenced = [...contract.matchAll(/var\((--rc-[\w-]+)\)/g)].map((m) => m[1]!);
  expect(referenced.length).toBeGreaterThan(20);

  const shared = await base();
  const dark = readTokens(shared + (await read("src/tokens/themes/rivocode-dark.css")));
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));

  const faltando = referenced.filter((t) => !dark[t] || !light[t]);
  expect(faltando).toEqual([]);
});

test("nenhum componente le da paleta crua", async () => {
  const { Glob } = await import("bun");
  const files = await Array.fromAsync(
    new Glob("src/{components,provider}/**/*.{ts,tsx}").scan("."),
  );
  for (const file of files) {
    expect(await Bun.file(file).text()).not.toContain("--rc-p-");
  }
});

test("a densidade compacta encolhe todo controle", async () => {
  const scales = readTokens(await read("src/tokens/scales.css"));
  expect(scales["--rc-control-md"]).toBeDefined();
});

test("o acento do tema claro passa como texto, e a lima crua nao passaria", async () => {
  const shared = await base();
  const light = readTokens(shared + (await read("src/tokens/themes/rivocode-light.css")));
  expect(contrastRatio(light["--rc-accent-text"]!, light["--rc-bg"]!)).toBeGreaterThan(4.5);
  expect(contrastRatio("#d4f34a", light["--rc-bg"]!)).toBeLessThan(2);
});

test("a densidade compacta alcanca painel, item de lista, caixa e dia", async () => {
  const escalas = await Bun.file("src/tokens/scales.css").text();
  const compacta = escalas.slice(escalas.indexOf('[data-rc-density="compact"]'));

  for (const token of ["--rc-pad-panel", "--rc-item-y", "--rc-box", "--rc-day"]) {
    expect(compacta).toContain(token);
  }
});

test("nenhum componente do catalogo usa medida de controle fixa em pixel", async () => {
  const { Glob } = await import("bun");
  const suspeitos: string[] = [];

  for await (const caminho of new Glob("src/components/*.tsx").scan(".")) {
    const fonte = await Bun.file(caminho).text();
    // Altura de controle, lado de caixa de marcar e respiro de painel devem
    // sair de token. Pixel solto aqui e densidade que nao chega.
    if (/size-\[(1[6-9]|2\d)px\]|h-\[(3[0-9]|4[0-8])px\]/.test(fonte)) {
      suspeitos.push(caminho);
    }
  }

  expect(suspeitos).toEqual([]);
});
