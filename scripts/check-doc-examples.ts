/**
 * Guard of the names cited in the examples of `.design-sync/docs/`.
 *
 * The `ChartContainer` page taught, for months, calling a
 * `useAreaGradient('faturado')` that NEVER existed: the real function is
 * `areaGradient(id, name)`, and the same example also forgot the required `id`
 * of `<ChartAreaGradient>`. Whoever copied from the site did not compile, and
 * the paragraph right below the block explained precisely the `id` the block
 * did not pass - the page contradicted itself two centimeters apart.
 *
 * Nothing flagged it. `check:doc` checks that piece and page exist for each
 * other, `check:skill` checks the props cited in the SKILL, and
 * `check:previews` compiles `.design-sync/previews/`. The body of the pages,
 * which is what a person copies, went through no compiler at all.
 *
 * It does not compile the blocks: it checks that every `useSomething(` and
 * every `<Something` tag cited exists in the PUBLIC SURFACE of both packages.
 * Outside names that are not ours - React's `useState`, react-native-svg's
 * `<Svg>`, the router's `<NavLink>` - live in `FOREIGN`, and that list is
 * closed on purpose: it names what comes from a third-party library, and NEVER
 * shelters an exception of ours. A piece of ours cited wrong is fixed in the
 * page or in `index.ts`, never here. The `<App />` the page draws as being the
 * reader's has its own list, `READER_CODE`, so `FOREIGN` stays auditable as a
 * third-party list.
 *
 * SECOND EPISODE, on the SAME day 28/08/2026, and it is the reason this block
 * doubled in size. Born in the morning against `useAreaGradient`, the guard
 * was audited in the afternoon by two independent readings, and both found the
 * same thing by different paths: it measured the FILE, and not the `.d.ts` the
 * client receives.
 *
 * The set of valid names came from a sweep of `export function|const|
 * class` across ALL of `src/**` and `native/src/**`. A file-internal name fell
 * into the same bag as a package entry name, and an `as` in `index.ts` was
 * invisible to it. Two pages were live like that:
 *
 * - `Toolbar.md` taught `<ToolbarRoot>`; `src/index.ts` exports
 *   `ToolbarRoot as Toolbar`.
 * - `Fieldset.md` taught `<FieldsetRoot>`; `src/index.ts` exports
 *   `FieldsetRoot as Fieldset`.
 *
 * Whoever copied from the site broke on the first build, with the bundler
 * saying `ToolbarRoot` is not exported by `@rivocode/ui`, and the guard stayed
 * GREEN on top of it - it saw the `export function ToolbarRoot` in the piece's
 * file and took as answered a question it never actually asked.
 *
 * The second hole was the one hiding the first: the tag sweep only looked at
 * `<(Chart|Rivo)[A-Z]\w*`. `<ToolbarRoot>` and `<FieldsetRoot>` start with
 * neither prefix, so they passed without being read. A narrow guard finds
 * nothing and looks clean.
 *
 * The fix is a single one, and it covers both: the set comes from the ENTRIES
 * - the three of the web and those of the `exports` field of
 * `native/package.json` -, with `as` already resolved, and the sweep reads
 * `<[A-Z]\w*`, any component. It is the "assertion that passes without
 * measuring" family from CLAUDE.md: a green guard is not a guard that
 * measured, and the way to know is to break on purpose what it should catch.
 */
import { countAtLeast, scanAtLeast } from "./scan";

/**
 * What comes from a third-party library and the page cites of its own accord.
 *
 * Recharts does NOT live here: `src/chart/index.ts` re-exports `<AreaChart>`,
 * `<Bar>`, `<XAxis>` and company, so they are already our public surface and
 * the guard reaches them on its own through the entry. An entry here is a
 * confession that the name was born OUTSIDE both packages, and never a
 * shortcut for a piece of ours cited wrong - that one is fixed in the page or
 * in `index.ts`.
 */
export const FOREIGN = new Set([
  "useState",
  "useEffect",
  "useMemo",
  "useRef",
  "useCallback",
  "useId",
  "useTransition",
  "useDeferredValue",
  "useSyncExternalStore",
  "useLayoutEffect",
  "useForm",
  "NavLink",
  "Svg",
  "TriangleAlert",
  "FileText",
  "Trash2",
  "Search",
  "Paperclip",
]);

/**
 * The component the page draws as being the READER's, and not the catalog's.
 *
 * `<App />` and `<Invoices />` are the hole where the person fits their own
 * screen: the example would lose its meaning if it cited a piece of ours
 * there. They do not go into `FOREIGN` because they come from no library, and
 * the separation is what keeps `FOREIGN` auditable as a third-party list.
 */
export const READER_CODE = new Set(["App", "Invoices"]);

export const WEB_ENTRIES = [
  "src/index.ts",
  "src/chart/index.ts",
  "src/form/index.ts",
  "src/ai/index.ts",
  "src/dnd/index.ts",
  "src/editor/index.ts",
];

/**
 * The native entries come from the manifest itself, and not from a list here:
 * a new subpath in `native/package.json` enters the count in the same commit.
 */
export async function nativeEntries(): Promise<string[]> {
  const manifest: { exports?: Record<string, string> } =
    await Bun.file("native/package.json").json();
  const paths = Object.values(manifest.exports ?? {}).filter((path) => path.endsWith(".ts"));

  countAtLeast("`.ts` entries in the `exports` field of native/package.json", paths.length, 4);

  return paths.map((path) => `native/${path.replace(/^\.\//, "")}`);
}

/**
 * The name the entry PUBLISHES, with `as` already resolved.
 *
 * Only what leaves through the entry counts: `export function ToolbarRoot` in
 * the piece's file is not importable if `index.ts` publishes it as `Toolbar`.
 * It reads the text of ONE entry, and is pure on purpose - the whole decision
 * of this guard fits in two functions without disk, and
 * `test/doc-example.test.ts` breaks both on purpose to see whether they bite.
 */
export function namesFromEntry(text: string): string[] {
  const names: string[] = [];

  for (const found of text.matchAll(/export\s+(?:function|const|class|type|interface)\s+(\w+)/g)) {
    names.push(found[1]!);
  }

  for (const block of text.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (const piece of block[1]!.split(",")) {
      const name = piece
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)
        .pop();
      if (name) names.push(name.trim());
    }
  }

  return names;
}

export type Cited = { hooks: string[]; tags: string[] };

/**
 * What a `tsx` block cites: a hook called and a tag mounted.
 *
 * A generic's `<` comes glued to an identifier - `useForm<Values>`,
 * `Array<Item>` -, and a tag's never does. Without that edge the guard would
 * read a type parameter as if it were a component, and the noise would get the
 * guard switched off.
 */
export function citedNames(code: string): Cited {
  const hooks = [...code.matchAll(/\b(use[A-Z]\w*)\s*\(/g)].map((found) => found[1]!);
  const tags = [...code.matchAll(/(?:^|[^A-Za-z0-9_$\]])<([A-Z]\w*)/gm)].map((found) => found[1]!);

  return { hooks, tags };
}

/** The `tsx` blocks of a page, which is what a person copies. */
export function tsxBlocks(page: string): string[] {
  return [...page.matchAll(/```tsx\n([\s\S]*?)```/g)].map((block) => block[1]!);
}

export async function publicNames(entries: string[]): Promise<Set<string>> {
  const names = new Set<string>();

  for (const entry of entries) {
    for (const name of namesFromEntry(await Bun.file(entry).text())) names.add(name);
  }

  return names;
}

async function main() {
  const entries = [...WEB_ENTRIES, ...(await nativeEntries())];
  countAtLeast("public entries of both packages", entries.length, 8);

  const exported = await publicNames(entries);
  countAtLeast("names published by the entries of both packages", exported.size, 300);

  const problems: string[] = [];

  for (const file of await scanAtLeast(".design-sync/docs/*.md", 100, { dot: true })) {
    const page = await Bun.file(file).text();

    for (const code of tsxBlocks(page)) {
      const { hooks, tags } = citedNames(code);

      for (const name of hooks) {
        if (!FOREIGN.has(name) && !exported.has(name)) {
          problems.push(
            `${file}: the example calls \`${name}()\`, which no entry of either package exports.`,
          );
        }
      }

      for (const name of tags) {
        if (!FOREIGN.has(name) && !READER_CODE.has(name) && !exported.has(name)) {
          problems.push(
            `${file}: the example mounts \`<${name}>\`, which no entry of either package exports.`,
          );
        }
      }
    }
  }

  const unique = [...new Set(problems)];

  if (unique.length > 0) {
    console.error("Doc example citing a name that does not exist:\n");
    for (const problem of unique) console.error(`  ${problem}`);
    console.error(
      "\nIt is the code a person copies from the published page, and what counts is the name\n" +
        "that leaves through the package ENTRY - `ToolbarRoot` in the piece's file cannot be\n" +
        "imported if `index.ts` publishes it as `Toolbar`. Fix the example, or\n" +
        "export the name - do not add an exception: `FOREIGN` is only for\n" +
        "third-party library names.",
    );
    process.exit(1);
  }

  console.log(
    `Examples in .design-sync/docs checked against ${exported.size} names published by ${entries.length} entries of both packages.`,
  );
}

if (import.meta.main) await main();
