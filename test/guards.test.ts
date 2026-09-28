import { expect, test } from "bun:test";
import { Glob } from "bun";

import { contrastRatio, readTokens } from "../src/lib/contrast";

async function filesOf(area: string, floor: number) {
  const found: string[] = [];
  for await (const file of new Glob(area).scan({ cwd: ".", dot: true })) found.push(file);

  expect(
    found.length,
    `the scan of ${area} found ${found.length} file(s), and the floor is ${floor}:` +
      " an empty list leaves the guard green without it having looked at anything",
  ).toBeGreaterThanOrEqual(floor);

  return found;
}

test("white on black gives the maximum of 21 to 1", () => {
  expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
});

test("lime on the dark background gives 15.06 to 1", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(15.06, 1);
});

test("the disabled text color stays below the minimum", () => {
  expect(contrastRatio("#6c737b", "#0f1113")).toBeLessThan(4.5);
});

test("resolves a theme token that points to the palette", () => {
  const tokens = readTokens(
    ":root { --rc-p-lima-500: #d4f34a; }\n" +
      "[data-rc-theme='x'] { --rc-accent: var(--rc-p-lima-500); }",
  );
  expect(tokens["--rc-accent"]).toBe("#d4f34a");
});

test("the order of the colors does not change the ratio", () => {
  expect(contrastRatio("#d4f34a", "#0f1113")).toBeCloseTo(contrastRatio("#0f1113", "#d4f34a"), 5);
});

test("the published package carries the CHANGELOG along", async () => {
  // In a 0.x library, with the package having already renamed public names
  // twice, whoever has an old version installed needs to be able to read what
  // changed without leaving node_modules. The file existed in the repo and was
  // left out of what npm packs.
  const pkg = await Bun.file("package.json").json();

  expect(pkg.files).toContain("CHANGELOG.md");
  expect(await Bun.file("CHANGELOG.md").exists()).toBe(true);
});

test("the version written in the code is the same as the package's", async () => {
  // `version` ships in the public API, and a wrong number there is worse than
  // no number: whoever debugs by it draws the wrong conclusion about what is
  // installed. There are two files, and both age together.
  const pkg = await Bun.file("package.json").json();
  const index = await Bun.file("src/index.ts").text();

  expect(index).toContain(`export const version = "${pkg.version}";`);
});

test("each package has its own CHANGELOG, and it travels along", async () => {
  // The native package publishes SOURCE and has already renamed three props.
  // Without the CHANGELOG inside the tarball, whoever has the old version
  // installed has nowhere to start from - and neither does the migration
  // agent, which reads exactly that file.
  for (const dir of [".", "native"]) {
    const pkg = await Bun.file(`${dir}/package.json`).json();
    expect(`${pkg.name} declares CHANGELOG: ${pkg.files.includes("CHANGELOG.md")}`).toBe(
      `${pkg.name} declares CHANGELOG: true`,
    );
    expect(`${pkg.name} has CHANGELOG: ${await Bun.file(`${dir}/CHANGELOG.md`).exists()}`).toBe(
      `${pkg.name} has CHANGELOG: true`,
    );
  }
});

test("each package's tag points to its own version", async () => {
  // Two packages, two triggers: `v*` is the web one and `native-v*` is the
  // native one. Without the prefix, a tag would publish the wrong package - or
  // worse, the right one with the other's number.
  const web = await Bun.file(".github/workflows/release.yml").text();
  const native = await Bun.file(".github/workflows/release-native.yml").text();

  expect(web).toContain('tags: ["v*"]');
  expect(native).toContain('tags: ["native-v*"]');
  expect(native).toContain("native/package.json");
});

/*
 * The boundary of a form control is what says "type here", and WCAG 1.4.11
 * requires 3:1 of it. What keeps that promise is `--rc-border-strong`;
 * `--rc-border` is a layout line, and in the dark theme it comes out at 1.1:1 -
 * visible to those who see well, invisible to everyone else.
 *
 * `check:contrast` does not catch this because it measures the token and not
 * who uses it: both pass, each on the promise it made. This guard looks at the
 * other side.
 */
const CONTROL_ROOT = /"[^"]*\bborder border-border(?!-strong)/;

/**
 * The whole `cn(...)` block, with balanced parentheses - a control's class is
 * born split across several strings, and looking at one at a time would miss
 * the half that matters.
 *
 * It comes with the position in the file because the focus guards need to
 * know WHO wears the block, and that lives in the `<Tag` right above it.
 */
function blocksOf(code: string) {
  const blocks: { text: string; at: number }[] = [];
  for (let i = code.indexOf("cn("); i !== -1; i = code.indexOf("cn(", i + 1)) {
    let depth = 1;
    let end = i + 3;
    while (end < code.length && depth > 0) {
      if (code[end] === "(") depth += 1;
      else if (code[end] === ")") depth -= 1;
      end += 1;
    }
    blocks.push({ text: code.slice(i, end), at: i });
  }
  return blocks;
}

/**
 * Besides `cn()`, the class written straight in the attribute: half of the
 * library's `outline-none`s live in `className="..."` with no function around
 * them, and a guard that only looked at `cn()` would miss exactly those.
 */
function classAttributesOf(code: string) {
  return [...code.matchAll(/className="[^"]*"/g)].map((hit) => ({
    text: hit[0],
    at: hit.index!,
  }));
}

/** The line of a position, so the message points to where it hurts. */
function lineAt(code: string, at: number) {
  return code.slice(0, at).split("\n").length;
}

/**
 * Who wears the block: the name of the Base UI piece in the nearest `<Tag`
 * above, or the constant's name when the block is a reused `const X = cn(...)`.
 */
function ownerOf(code: string, at: number) {
  const before = code.slice(0, at);
  const assigned = /(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*$/.exec(before.slice(-120));
  if (assigned) return assigned[1]!;

  const tag = [...before.matchAll(/<([A-Za-z][\w.]*)/g)].pop();
  return tag?.[1] ?? "?";
}

test("the boundary of a form control never wears the weak border", async () => {
  // The cut is narrow on purpose, and it is what separates a field from a
  // card: a field surface (`bg-surface`), with a full border around it and its
  // own focus ring. A card has no ring; an inner divider is `border-r` and not
  // `border`; a color swatch and a page button have no `bg-surface`. None of
  // the three gets in here, and all of them use the plain border for a reason.
  const weak: string[] = [];

  for (const file of await filesOf("src/components/*.tsx", 70)) {
    const code = await Bun.file(file).text();
    for (const { text: block } of blocksOf(code)) {
      const isField = block.includes("bg-surface") && /focus-(visible|within):ring-2/.test(block);
      if (isField && CONTROL_ROOT.test(block)) weak.push(file);
    }
  }

  expect(weak).toEqual([]);
});

/* ---------------------------------------------------------------------------
 * Guard against the outline removed without a replacement.
 *
 * `outline-none` is not "no style": it is the active removal of the only focus
 * signal the browser gives for free. Whoever removes it has to replace it, and
 * four pieces did not - the menu trigger, the tab panel, the chart surface and
 * the published menubar example. All of them passed `check:contrast`, which
 * measures COLOR and not absence; and all of them only showed up with Tab in
 * one hand and the accessibility tree in the other.
 *
 * What the guard requires is the replacement in the SAME class block: the ring
 * can be `focus-visible:`, `focus:`, `focus-within:` or the
 * `data-[highlighted]:` that Base UI lights on the menu item the arrow moves
 * through.
 * ------------------------------------------------------------------------- */

/**
 * Where the two class guards look: the library and the published examples.
 *
 * The example counts as much as the piece - whoever reads the documentation
 * copies what they see, and that is how the menubar shipped without a focus
 * ring in every organization that built it.
 */
const AREAS: [area: string, floor: number][] = [
  ["src/**/*.tsx", 80],
  [".design-sync/previews/*.tsx", 80],
];

/** Something lights up when focus arrives. */
const FOCUS_PAINTS =
  /focus-visible|focus-within|has-\[input:focus|focus:|data-\[highlighted\]|data-\[selected\]/;

/**
 * What Tab does not reach, and therefore owes nothing to 2.4.7.
 *
 * `Popup`, `Positioner`, `Portal`, `Backdrop` and `Viewport` are the shell of
 * what floats: what sends focus into them is Base UI, in code, and a ring
 * around a whole dialog would only add noise.
 *
 * `ContextMenuTrigger` is here for a different reason and is worth checking if
 * Base UI changes: it renders it as a `div` without `tabIndex`
 * (`context-menu/trigger/ContextMenuTrigger.js`), so its `outline-none` is a
 * dead letter - there is no focus to remove.
 *
 * `input` is the text field: what shows focus there is the blinking caret, and
 * in this library the ring is drawn by the frame around it
 * (`has-[input:focus-visible]` in TagsInput, `focus-within` in InputGroup).
 * The raw `textarea` is the same case, and only exists inside a frame: the one
 * in `PromptInput` lives inside the `form` that lights
 * `has-[textarea:focus-visible]`. The catalog's `Textarea` does not go through
 * here, because it paints its own ring.
 */
const OUT_OF_TAB_ORDER =
  /(Popup|Positioner|Portal|Backdrop|Viewport|floatingPanel)$|^input$|^textarea$|Input$|ContextMenu\.Trigger$/;

/*
 * The guard was born with a debt declared in a list: `PopoverTrigger` repeated
 * the shape of `MenuTrigger` - `cn("outline-none", className)` - and the file
 * belonged to other work in progress in the same tree. It was fixed, the list
 * emptied and went away with it: an exception list that outlives its last
 * exception guards nothing, it only teaches that there is a place where the
 * next bare `outline-none` can be written.
 */

test("whoever removes the focus outline puts something in its place", async () => {
  const naked: string[] = [];

  for (const [area, floor] of AREAS) {
    for (const file of await filesOf(area, floor)) {
      const code = await Bun.file(file).text();

      for (const { text, at } of [...blocksOf(code), ...classAttributesOf(code)]) {
        if (!/\boutline-none\b/.test(text) || FOCUS_PAINTS.test(text)) continue;

        const owner = ownerOf(code, at);
        if (OUT_OF_TAB_ORDER.test(owner)) continue;

        naked.push(
          `${file}:${lineAt(code, at)}  <${owner}> removes the focus outline and replaces it with nothing`,
        );
      }
    }
  }

  expect(naked).toEqual([]);
});

/* ---------------------------------------------------------------------------
 * Guard against `motion-reduce` defeated by specificity.
 *
 * `data-[indeterminate]:animate-indeterminate` compiles as
 * `.class[data-indeterminate]` - (0,2,0). `motion-reduce:animate-none`
 * compiles as `.class` inside a media query - (0,1,0), because a media query
 * adds no specificity. The second NEVER beats the first, in any order, and the
 * indeterminate bar spun for months in the face of whoever asked for less
 * motion, with the right class written right next to it.
 *
 * It is the same family as `check:groups`: the selector exists, generates CSS,
 * and never matches. The fix is to repeat the data variant in the motion rule
 * - `motion-reduce:data-[indeterminate]:animate-none` -, which equalizes the
 * specificity and wins by order.
 * ------------------------------------------------------------------------- */

/** `motion-reduce:animate-none`, `motion-reduce:transition-none`. */
const CALM = /(?:^|["'\s])motion-reduce:([a-z]+)-none(?=["'\s]|$)/g;

/** `data-[indeterminate]:animate-indeterminate`, `data-[open]:duration-500`. */
const UNDER_DATA = /data-\[[^\]]+\]:([a-z]+)-[a-z0-9[]/g;

test("no motion-reduce loses on specificity to a data variant", async () => {
  const defeated: string[] = [];

  for (const [area, floor] of AREAS) {
    for (const file of await filesOf(area, floor)) {
      const code = await Bun.file(file).text();

      for (const { text, at } of [...blocksOf(code), ...classAttributesOf(code)]) {
        const calm = new Set([...text.matchAll(CALM)].map((hit) => hit[1]!));
        if (calm.size === 0) continue;

        // Only what sits under a data variant competes: the same property
        // group written loose (`animate-spin` in Spinner) ties on specificity
        // and loses by order, which is right.
        const guarded = new Set([...text.matchAll(UNDER_DATA)].map((hit) => hit[1]!));

        for (const property of calm) {
          if (guarded.has(property)) {
            defeated.push(
              `${file}:${lineAt(code, at)}  motion-reduce:${property}-none never matches:` +
                ` it loses to data-[...]:${property}-* on specificity`,
            );
          }
        }
      }
    }
  }

  expect(defeated).toEqual([]);
});
