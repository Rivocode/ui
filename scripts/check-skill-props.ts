/**
 * Skill guard: a prop cited in an example has to exist on the piece.
 *
 * SKILL.md itself says, in item 3, "never invent a prop" - and its form example
 * taught `<FormField render={...} />` for months. `FormFieldProps` never had
 * `render`: the function comes in through `children`, which is required.
 * Whoever followed the example did not compile, and whoever reads the skill is
 * precisely the one who does not know the piece well enough to be suspicious.
 *
 * The hole was structural. `check:previews` typechecks `.design-sync/previews`
 * and nothing else; no code block of the skill goes through the compiler, and
 * the skill is published raw at /skill/SKILL.md and copied into the package by
 * `build:skill`. That is: it is the only code the library distributes without
 * anyone checking it.
 *
 * ## Why check props, and not compile the block
 *
 * Compiling would be stronger and does not fit: of the blocks here, half are
 * fragments - loose JSX, no import, calling `FORMAS` and `field` that were
 * never declared. Making them compile would require wrapping each one in a
 * synthetic file with guessed stubs, and the guard would start failing because
 * of the wrapper itself - which is the known way for a guard to get turned off.
 *
 * So this one checks what can be checked without context: the name of each
 * attribute written on a catalog component, against the props table the
 * compiler already generated in `apps/docs/src/component-props.json`. It is the
 * same data the published documentation shows, so the skill and the docs never
 * diverge without someone knowing. It catches the FormField `render`, which was
 * the target.
 *
 * What it does not catch, on purpose: wrong value type, composition order, a
 * piece that does not exist, a missing import. For that the path is the
 * compiler, and it costs the wrapper above.
 */
import { scanAtLeast } from "./scan";

const SKILL_DIR = ".claude/skills/rivocode-ui";
const CATALOG = "apps/docs/src/component-props.json";
const REACT_TYPES = "node_modules/@types/react/index.d.ts";

/**
 * The native skill talks about another package, and checks against its table.
 *
 * `Button` and `Card` exist in both catalogs with different props, and checking
 * the native example against the web table would flag the right piece for the
 * wrong reason. Until 25/09/2026 `reference/native.md` was left out for that,
 * with the reason "until native generates its own table" - and the table had
 * already existed for a month, in `apps/docs/src/native-props.json`, without the
 * guard knowing.
 *
 * The native table cuts what the piece inherits from `ViewProps`,
 * `PressableProps` and `TextInputProps`, as the web one cuts `@types/react`, but
 * it has no `forwardsRoot` saying which pieces pass those props on. And their
 * list cannot be taken from the `.d.ts`, as the web takes it from React:
 * `react-native` is only installed in `examples/native`, which the gate does not
 * install. So the native side accepts the platform prop FAMILY by shape - an
 * `onSomething` event, `accessibilitySomething`, `style`, `testID` - and not by
 * name. An invented prop that does not look like platform (`variant="outline"`
 * on a `Card`, `render` on a `FormField`) still fails, and that is the error the
 * guard exists to catch.
 */
const NATIVE_FILES = new Set(["reference/native.md"]);
const NATIVE_CATALOG = "apps/docs/src/native-props.json";
const NATIVE_PLATFORM = /^(on[A-Z]\w*|accessibility\w*|style|testID|className)$/;

type Piece = { forwardsRoot: boolean; props: { name: string }[] };

/**
 * The attributes React accepts on any element.
 *
 * The props table does not list them - `catalog-props.ts` cuts everything that
 * comes from `@types/react` and keeps only the `forwardsRoot` answer - so
 * `className` on a `<Card>` would be flagged without this. The list comes from
 * the installed React `.d.ts` itself, and is not handwritten: DOM attributes are
 * a vocabulary of some three hundred words, and keeping it by hand would be the
 * second closed list in this repository to go stale on its own.
 */
async function domAttributes(): Promise<Set<string>> {
  const source = await Bun.file(REACT_TYPES).text();
  const names = new Set<string>();

  // `AllHTMLAttributes` brings every HTML attribute; `SVGAttributes` brings
  // `fill`, `stroke` and company, which the charts use. Both EXTEND
  // `DOMAttributes`, but this reading only sees each interface's own members,
  // not the inherited ones: without reading `DOMAttributes` too, `onClick` on a
  // skill `<Button>` was flagged as an invented prop. The old comment said
  // inheritance was enough, and no example had tested that until the first
  // button with `onClick` came in. `aria-*` goes through the prefix rule, which
  // is why `AriaAttributes` is not in the list.
  for (const wanted of ["AllHTMLAttributes", "SVGAttributes", "DOMAttributes"]) {
    const start = source.indexOf(`interface ${wanted}<T>`);
    if (start === -1) {
      throw new Error(
        `Could not find \`interface ${wanted}<T>\` in ${REACT_TYPES}.\n` +
          "Without it the guard would flag `className` on every piece. Check whether\n" +
          "@types/react renamed the interface and adjust domAttributes().",
      );
    }

    // From the interface's `{` to the brace that closes it at the block's column zero.
    const open = source.indexOf("{", start);
    const end = source.indexOf("\n    }", open);
    for (const [, name] of source.slice(open, end).matchAll(/^\s{8}([a-zA-Z][\w-]*)\??:/gm)) {
      names.add(name!);
    }
  }

  return names;
}

/** `key` and `ref` belong to React and not to the element; `children` comes from inside. */
const ALWAYS = new Set(["key", "ref", "children"]);

/**
 * The attributes of an opening tag, without mixing them up with what is inside
 * the values.
 *
 * A regex over the whole tag flagged `flex-wrap` from `className="flex-wrap"`
 * and `thumb` from `classNames={{ thumb: ... }}` - thirty false positives,
 * enough for nobody to read the output. So it reads character by character: a
 * string is skipped whole, a `{...}` block is skipped whole, and only what is
 * really at the tag level remains.
 */
function attributesOf(code: string) {
  const found: { tag: string; attr: string; line: number }[] = [];

  for (let i = 0; i < code.length; i++) {
    if (code[i] !== "<") continue;
    const opening = /^<([A-Z][A-Za-z0-9]*)/.exec(code.slice(i));
    if (!opening) continue;

    const tag = opening[1]!;
    let at = i + opening[0].length;
    let depth = 0;
    let word = "";

    const flush = (position: number) => {
      if (!word) return;
      found.push({ tag, attr: word, line: code.slice(0, position).split("\n").length });
      word = "";
    };

    while (at < code.length) {
      const char = code[at]!;

      if (depth === 0 && (char === ">" || (char === "/" && code[at + 1] === ">"))) break;

      if (char === "{") {
        depth += 1;
        at += 1;
        continue;
      }
      if (char === "}") {
        depth -= 1;
        at += 1;
        continue;
      }
      if (depth > 0) {
        at += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        at += 1;
        while (at < code.length && code[at] !== char) at += 1;
        at += 1;
        continue;
      }

      // `aria-label` and `data-state` have a hyphen; `render` and `onValueChange` do not.
      if (/[A-Za-z0-9_-]/.test(char)) {
        word += char;
        at += 1;
        continue;
      }

      flush(at);
      at += 1;
    }

    flush(at);
  }

  return found;
}

const catalog = JSON.parse(await Bun.file(CATALOG).text()) as Record<string, Piece>;
const dom = await domAttributes();
const nativeCatalog = JSON.parse(await Bun.file(NATIVE_CATALOG).text()) as Record<string, Piece>;
let nativeFiles = 0;

const invented: string[] = [];
let checked = 0;

/*
 * `Glob(".claude/**").scan(".")` returns zero files: bun ignores a hidden folder
 * when it is in the pattern. Scanning from inside it solves it, and the cost of
 * finding this out again is an afternoon.
 */
for (const file of await scanAtLeast("**/*.md", 5, { cwd: SKILL_DIR })) {
  const native = NATIVE_FILES.has(file);
  const pieces: Record<string, Piece> = native ? nativeCatalog : catalog;
  if (native) nativeFiles += 1;

  const text = await Bun.file(`${SKILL_DIR}/${file}`).text();

  for (const block of text.matchAll(/```(?:tsx|jsx)\n([\s\S]*?)```/g)) {
    const code = block[1]!;
    // The line where the block starts, so the error address points at the file
    // and not at the block.
    const offset = text.slice(0, block.index! + block[0].indexOf("\n") + 1).split("\n").length - 1;

    for (const { tag, attr, line } of attributesOf(code)) {
      const piece = pieces[tag];
      // A piece not in the catalog is the example's own component
      // (`<InvoiceScreen />`) or a lucide icon. There is no table to check.
      if (!piece) continue;

      checked += 1;

      if (piece.props.some((prop) => prop.name === attr)) continue;
      if (ALWAYS.has(attr) || /^(aria|data)-/.test(attr)) continue;
      // A DOM attribute only counts where the piece forwards the root.
      if (piece.forwardsRoot && dom.has(attr)) continue;
      if (native && NATIVE_PLATFORM.test(attr)) continue;

      const real = piece.props.map((prop) => prop.name).sort();
      invented.push(
        `  ${SKILL_DIR}/${file}:${offset + line}  <${tag} ${attr}=...>\n` +
          `    ${tag} accepts: ${real.length ? real.join(", ") : "(no props of its own)"}`,
      );
    }
  }
}

if (nativeFiles !== NATIVE_FILES.size) {
  console.error(
    `The skill has ${nativeFiles} of ${NATIVE_FILES.size} native file(s) declared in NATIVE_FILES.\n` +
      "The name changed or the file is gone, and the native example would be checked against\n" +
      "the web table - or not checked at all. Fix NATIVE_FILES.",
  );
  process.exit(1);
}

if (invented.length > 0) {
  console.error(`${invented.length} prop(s) the skill teaches and the piece does not have:\n`);
  for (const item of invented) console.error(item);
  console.error(
    "\nRewrite the example with the prop that exists - the list above comes from the" +
      "\nsame compiler that generates the documentation table. The skill is copied into" +
      "\nthe package by `build:skill` and served at /skill/SKILL.md: an example that" +
      "\ndoes not compile becomes the first code an agent writes." +
      "\n\nIf the prop is new, run `bun run gen:props` first: the table may be behind" +
      "\nthe code.",
  );
  process.exit(1);
}

console.log(
  `${checked} props cited in the skill examples, all existing, ${nativeFiles} file(s) against the native table.`,
);
