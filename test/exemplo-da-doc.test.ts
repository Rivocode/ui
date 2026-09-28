import { expect, test } from "bun:test";

import {
  citedNames,
  FOREIGN,
  namesFromEntry,
  nativeEntries,
  publicNames,
  READER_CODE,
  tsxBlocks,
  WEB_ENTRIES,
} from "../scripts/check-exemplo-da-doc";

test("o nome publico e o depois do `as`, e nao o do arquivo da peca", () => {
  const names = namesFromEntry(
    `export {
       ToolbarButton,
       ToolbarRoot as Toolbar,
       type ToolbarProps,
     } from "./components/toolbar";`,
  );

  expect(names).toContain("Toolbar");
  expect(names).toContain("ToolbarButton");
  expect(names).not.toContain("ToolbarRoot");
});

test("declaracao na propria entrada tambem e nome publico", () => {
  const names = namesFromEntry(
    `export const version = "0.11.0";
     export function areaGradient() {}
     export type RivoTheme = string;`,
  );

  expect(names).toContain("version");
  expect(names).toContain("areaGradient");
  expect(names).toContain("RivoTheme");
});

test("`export type { ... }` entra sem arrastar a palavra `type`", () => {
  const names = namesFromEntry(`export type { FloatingPositionProps } from "./lib/positioning";`);

  expect(names).toContain("FloatingPositionProps");
  expect(names).not.toContain("type FloatingPositionProps");
});

test("a varredura de tag pega componente de qualquer prefixo", () => {
  const { tags } = citedNames("<Toolbar>\n  <ToolbarButton />\n</Toolbar>");

  expect(tags).toContain("Toolbar");
  expect(tags).toContain("ToolbarButton");
});

test("tag colada na anterior nao escapa da varredura", () => {
  const { tags } = citedNames("<Card><CardTitle>Faturado</CardTitle></Card>");

  expect(tags).toContain("CardTitle");
});

test("parametro de tipo nao e lido como componente", () => {
  const { tags } = citedNames(
    "const form = useZodForm<FormValues>(schema)\nconst rows: Array<Invoice> = []",
  );

  expect(tags).not.toContain("FormValues");
  expect(tags).not.toContain("Invoice");
});

test("hook chamado no exemplo entra na conta, e hook so citado nao", () => {
  const { hooks } = citedNames("const gradient = useAreaGradient('faturado')\n// useMemo");

  expect(hooks).toContain("useAreaGradient");
  expect(hooks).not.toContain("useMemo");
});

test("so os blocos `tsx` da pagina sao lidos", () => {
  const blocks = tsxBlocks(
    "Texto.\n\n```tsx\n<Toolbar />\n```\n\nOutro.\n\n```bash\nnpx algo\n```\n\n```tsx\n<Fieldset />\n```\n",
  );

  expect(blocks.length).toBe(2);
  expect(blocks[0]).toContain("<Toolbar />");
  expect(blocks[1]).toContain("<Fieldset />");
});

test("as entradas do nativo saem do campo `exports` do manifesto", async () => {
  const entries = await nativeEntries();

  expect(entries.length).toBeGreaterThan(4);
  expect(entries).toContain("native/src/index.ts");
  expect(entries).toContain("native/src/form/index.ts");
  for (const entry of entries) expect(entry.startsWith("native/")).toBe(true);
});

test("`Toolbar` e `Fieldset` sao publicos, e `ToolbarRoot` e `FieldsetRoot` nao", async () => {
  const names = await publicNames([...WEB_ENTRIES, ...(await nativeEntries())]);

  expect(names.size).toBeGreaterThan(300);
  expect(names.has("Toolbar")).toBe(true);
  expect(names.has("Fieldset")).toBe(true);
  expect(names.has("ToolbarRoot")).toBe(false);
  expect(names.has("FieldsetRoot")).toBe(false);
});

test("a Recharts que o `src/chart/index.ts` reexporta e superficie nossa", async () => {
  const names = await publicNames(WEB_ENTRIES);

  expect(names.has("AreaChart")).toBe(true);
  expect(names.has("XAxis")).toBe(true);
});

test("`FOREIGN` e `READER_CODE` nao abrigam nome que os pacotes publicam", async () => {
  const names = await publicNames([...WEB_ENTRIES, ...(await nativeEntries())]);

  expect(FOREIGN.size).toBeGreaterThan(10);
  expect(READER_CODE.size).toBeGreaterThan(1);

  for (const name of [...FOREIGN, ...READER_CODE]) {
    expect(names.has(name)).toBe(false);
  }
});
