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
} from "../scripts/check-doc-examples";

test("the public name is the one after `as`, and not the one in the piece file", () => {
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

test("a declaration in the entry itself is also a public name", () => {
  const names = namesFromEntry(
    `export const version = "0.11.0";
     export function areaGradient() {}
     export type RivoTheme = string;`,
  );

  expect(names).toContain("version");
  expect(names).toContain("areaGradient");
  expect(names).toContain("RivoTheme");
});

test("`export type { ... }` comes in without dragging the word `type`", () => {
  const names = namesFromEntry(`export type { FloatingPositionProps } from "./lib/positioning";`);

  expect(names).toContain("FloatingPositionProps");
  expect(names).not.toContain("type FloatingPositionProps");
});

test("the tag sweep catches components with any prefix", () => {
  const { tags } = citedNames("<Toolbar>\n  <ToolbarButton />\n</Toolbar>");

  expect(tags).toContain("Toolbar");
  expect(tags).toContain("ToolbarButton");
});

test("a tag glued to the previous one does not escape the sweep", () => {
  const { tags } = citedNames("<Card><CardTitle>Faturado</CardTitle></Card>");

  expect(tags).toContain("CardTitle");
});

test("a type parameter is not read as a component", () => {
  const { tags } = citedNames(
    "const form = useZodForm<FormValues>(schema)\nconst rows: Array<Invoice> = []",
  );

  expect(tags).not.toContain("FormValues");
  expect(tags).not.toContain("Invoice");
});

test("a hook called in the example counts, and a hook merely mentioned does not", () => {
  const { hooks } = citedNames("const gradient = useAreaGradient('faturado')\n// useMemo");

  expect(hooks).toContain("useAreaGradient");
  expect(hooks).not.toContain("useMemo");
});

test("only the page's `tsx` blocks are read", () => {
  const blocks = tsxBlocks(
    "Text.\n\n```tsx\n<Toolbar />\n```\n\nOther.\n\n```bash\nnpx something\n```\n\n```tsx\n<Fieldset />\n```\n",
  );

  expect(blocks.length).toBe(2);
  expect(blocks[0]).toContain("<Toolbar />");
  expect(blocks[1]).toContain("<Fieldset />");
});

test("the native entries come from the manifest `exports` field", async () => {
  const entries = await nativeEntries();

  expect(entries.length).toBeGreaterThan(4);
  expect(entries).toContain("native/src/index.ts");
  expect(entries).toContain("native/src/form/index.ts");
  for (const entry of entries) expect(entry.startsWith("native/")).toBe(true);
});

test("`Toolbar` and `Fieldset` are public, and `ToolbarRoot` and `FieldsetRoot` are not", async () => {
  const names = await publicNames([...WEB_ENTRIES, ...(await nativeEntries())]);

  expect(names.size).toBeGreaterThan(300);
  expect(names.has("Toolbar")).toBe(true);
  expect(names.has("Fieldset")).toBe(true);
  expect(names.has("ToolbarRoot")).toBe(false);
  expect(names.has("FieldsetRoot")).toBe(false);
});

test("the Recharts that `src/chart/index.ts` re-exports is our surface", async () => {
  const names = await publicNames(WEB_ENTRIES);

  expect(names.has("AreaChart")).toBe(true);
  expect(names.has("XAxis")).toBe(true);
});

test("`FOREIGN` and `READER_CODE` do not harbor a name the packages publish", async () => {
  const names = await publicNames([...WEB_ENTRIES, ...(await nativeEntries())]);

  expect(FOREIGN.size).toBeGreaterThan(10);
  expect(READER_CODE.size).toBeGreaterThan(1);

  for (const name of [...FOREIGN, ...READER_CODE]) {
    expect(names.has(name)).toBe(false);
  }
});
