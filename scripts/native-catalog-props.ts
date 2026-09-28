/**
 * The props of each piece of the NATIVE package, read from the compiler.
 *
 * The web already had its table in `apps/docs/src/component-props.json`, and
 * native had none. The gap was written down in a guard: `check:skill` excluded
 * `reference/native.md` from the props check with the note "while
 * @rivocode/ui-native does not generate its own table, this file stays out".
 * As long as that is true, everything the native doc claims about a prop is a
 * claim nobody checks.
 *
 * This file generates the missing table. Its consumer today is
 * `scripts/native-signature.ts`, which compares the two signatures piece by
 * piece.
 *
 * ## Why it is NOT part of `bun run check`
 *
 * For the same reason as `check:native:types`, and the reason is in
 * `native/tsconfig.check.json`: react and react-native are peers, and the only
 * place in the repository where they are installed is `examples/native`, which
 * is not a workspace. `bun install --frozen-lockfile` at the root never
 * installs it.
 *
 * And it is not that it would fail without them - it would be worse, it would
 * pass while LYING. Measured on 28/08/2026, pointing the tsconfig at a world
 * without react-native: the 82 pieces kept coming out, and ten lost props.
 * `Omit<TextInputProps, ...> & { value; onValueChange }` with `TextInputProps`
 * unresolved collapses, and `PasswordInput` showed up with a single prop. A
 * table like that in the gate would be a green guard measuring nothing.
 *
 * That is why the design is the same as the native tokens: the table is a
 * COMMITTED ARTIFACT. Whoever generates it needs the example app installed,
 * and whoever checks it only needs the JSON. `--check` runs in the CI `nativo`
 * job, next to `check:native:types`, which already installs `examples/native`.
 *
 * To run again:
 *
 *   bun install --frozen-lockfile          inside examples/native
 *   bun run gen:props:native               writes
 *   bun run check:props:native             only checks, for CI
 */
import { API, SignatureKind, SymbolFlags } from "typescript/unstable/async";

import { countAtLeast } from "./scan";

const ROOT = process.cwd();
const TARGET = "apps/docs/src/native-props.json";
const PROJECT = "native/tsconfig.check.json";

const isOwnSource = (path: string) => path.includes("/native/src/") && !path.includes("/node_modules/");

/** The package's seven indexes. The same ones the parity table measures. */
const ENTRY_POINTS = [
  "native/src/index.ts",
  "native/src/form/index.ts",
  "native/src/chart/index.ts",
  "native/src/clipboard/index.ts",
  "native/src/file-upload/index.ts",
  "native/src/ai/index.ts",
  "native/src/dnd/index.ts",
];

/**
 * The floor of pieces and props.
 *
 * Without it `--check` mode compares empty with empty on the day the tsconfig
 * is renamed or the example's `paths` stops resolving, and comes out green. It
 * is the same family of defect `scripts/scan.ts` describes, except that here
 * the one scanning is the compiler.
 */
const PIECE_FLOOR = 60;
const PROP_FLOOR = 250;

export type NativeProp = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
};

export type NativePiece = {
  /** The index the piece ships through: the root, `/form`, `/chart`, `/clipboard`, `/file-upload`, `/ai`, `/dnd`. */
  entry: string;
  props: NativeProp[];
};

function withoutUndefined(type: string, optional: boolean): string {
  if (!optional) return type;
  const clean = type.replace(/\s*\|\s*undefined\s*$/, "");
  return clean || type;
}

function firstSentence(text: string): string | undefined {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  const period = clean.indexOf(". ");
  return period === -1 ? clean : clean.slice(0, period + 1);
}

export async function readNativeCatalog(): Promise<Record<string, NativePiece>> {
  const api = new API({ cwd: ROOT });
  const snapshot = await api.updateSnapshot({ openProjects: [`${ROOT}/${PROJECT}`] });
  const project = (await snapshot.getProjects())[0];
  if (!project) throw new Error(`Could not open the ${PROJECT} project.`);

  const { checker, program } = project;
  const catalog: Record<string, NativePiece> = {};
  const collisions: string[] = [];

  for (const entry of ENTRY_POINTS) {
    const file = await program.getSourceFile(`${ROOT}/${entry}`);
    if (!file) throw new Error(`Could not find ${entry}.`);

    const module = await checker.getSymbolAtLocation(file);
    if (!module) throw new Error(`${entry} did not resolve as a module.`);

    for (const [key, symbol] of await module.getExports()) {
      const name = String(key);
      if (!/^[A-Z]/.test(name) || catalog[name]) continue;

      const type = await checker.getTypeOfSymbol(symbol);
      if (!type) continue;

      const signatures = await checker.getSignaturesOfType(type, SignatureKind.Call);
      if (!signatures.length) continue;

      const parameter = await checker.getParameterType(signatures[0]!, 0);
      if (!parameter) continue;

      const props: NativeProp[] = [];

      for (const prop of await checker.getPropertiesOfType(parameter)) {
        // What the piece declares, not what it inherits from `ViewProps` and
        // `TextInputProps`: those are hundreds of platform props that say the
        // same thing on every piece, and the cut is the same one the web
        // catalog makes with `@types/react`.
        const paths = prop.declarations.map((declaration) => String(declaration.path ?? ""));
        if (!paths.some(isOwnSource)) continue;
        if (paths.some((path) => !isOwnSource(path))) collisions.push(`${name}.${prop.name}`);

        const propType = await checker.getTypeOfSymbol(prop);
        const note = firstSentence(await prop.getDocumentationComment(checker));
        const optional = Boolean(prop.flags & SymbolFlags.Optional);
        const written = propType
          ? (await checker.typeToString(propType)).replace(/\s+/g, " ").trim()
          : "unknown";

        props.push({
          name: prop.name,
          type: withoutUndefined(written, optional),
          required: !optional,
          ...(note ? { note } : {}),
        });
      }

      props.sort((a, b) =>
        a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
      );

      catalog[name] = { entry, props };
    }
  }

  await api.close();

  if (collisions.length) {
    console.error(
      `${collisions.length} own prop(s) collide with an inherited prop of the same name, and the published type becomes the intersection of both. Remove the key from the base with Omit:`,
    );
    for (const collision of collisions) console.error(`  ${collision}`);
    process.exit(1);
  }

  return Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.main) {
  const catalog = await readNativeCatalog();
  const pieces = Object.keys(catalog).length;
  const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);

  countAtLeast("native package pieces", pieces, PIECE_FLOOR);
  countAtLeast("native package props", total, PROP_FLOOR);

  const text = `${JSON.stringify(catalog, null, 2)}\n`;

  if (process.argv.includes("--check")) {
    const current = await Bun.file(TARGET)
      .text()
      .catch(() => "");

    if (current !== text) {
      console.error(`${TARGET} diverged from the types. Run: bun run gen:props:native`);

      const before: Record<string, NativePiece> = current ? JSON.parse(current) : {};
      for (const [piece, data] of Object.entries(catalog)) {
        const previous = new Set((before[piece]?.props ?? []).map((prop) => prop.name));
        const added = data.props.map((prop) => prop.name).filter((prop) => !previous.has(prop));
        const removed = [...previous].filter(
          (prop) => !data.props.some((current) => current.name === prop),
        );
        if (added.length) console.error(`  ${piece}: added ${added.join(", ")}`);
        if (removed.length) console.error(`  ${piece}: removed ${removed.join(", ")}`);
      }
      process.exit(1);
    }

    console.log(`native props up to date: ${pieces} pieces, ${total} props.`);
  } else {
    await Bun.write(TARGET, text);
    console.log(`${TARGET}: ${pieces} pieces, ${total} props.`);
  }
}
