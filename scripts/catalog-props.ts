/**
 * The props of each piece, read from the compiler.
 *
 * The props table is the part of the documentation that rots first, and until
 * here it came from a `.d.ts` snapshot the bundle sync left behind: the file
 * said `from @rivocode/ui@0.1.0`, and the site published that version's props.
 * What got lost was systematic, not case by case - the snapshot carried no
 * callback at all, so half of the controlled pieces showed up without
 * `onValueChange`, without `onOpenChange`, without `onCheckedChange`. And a
 * piece that changed shape since then showed up as "has no own props" while
 * having them.
 *
 * Here the checker itself answers: for each export that is a component, the
 * type of the first parameter, minus what comes from `@types/react` - which is
 * the root element, and lives in a single line at the end of the table.
 *
 * `--check` fails when the versioned JSON diverges from the types, and it is
 * what goes into `bun run check`: so the doc can no longer diverge silently.
 */
import { API, SignatureKind, SymbolFlags } from "typescript/unstable/async";

const ROOT = process.cwd();
const TARGET = "apps/docs/src/component-props.json";

/** The package's public entry points. What does not go out through them is not documentable. */
const ENTRY_POINTS = [
  "src/index.ts",
  "src/form/index.ts",
  "src/chart/index.ts",
  "src/ai/index.ts",
  "src/dnd/index.ts",
  "src/editor/index.ts",
];

/**
 * What every component forwards to the root element. It stays in a single line
 * at the end of the table, instead of repeated on 165 pages.
 */
const FORWARDED = new Set(["className", "style", "id", "children"]);

const OWN_SOURCE = `${ROOT}/src/`.toLowerCase();

const isOwnSource = (path: string) =>
  path.toLowerCase().startsWith(OWN_SOURCE) && !path.includes("/node_modules/");

export type CatalogProp = {
  name: string;
  type: string;
  required: boolean;
  note?: string;
  /**
   * The version in which the prop appeared in the catalog.
   *
   * It is not written by hand: `--since <version>` stamps, at release time,
   * everything that has no stamp yet. So the first version in which the prop
   * existed is the one recorded, and nobody has to remember to note it -
   * remembering is exactly what nobody does.
   *
   * A prop without a stamp is a prop that has not shipped in any version yet.
   */
  since?: string;
};

export type CatalogPiece = {
  /** Whether it accepts the root element's attributes besides its own props. */
  forwardsRoot: boolean;
  props: CatalogProp[];
};

/**
 * `boolean | undefined` in a row that already has the "Required: no" column
 * says the same thing twice, and the second takes the width the type needs.
 */
function withoutUndefined(type: string, optional: boolean): string {
  if (!optional) return type;
  const clean = type.replace(/\s*\|\s*undefined\s*$/, "");
  return clean || type;
}

function unionParts(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < type.length; index++) {
    const char = type[index]!;
    if ("(<{[".includes(char)) depth++;
    else if (")>}]".includes(char) && type[index - 1] !== "=") depth--;
    else if (char === "|" && depth === 0) {
      parts.push(type.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(type.slice(start).trim());
  return parts.filter(Boolean);
}

/** A single line, no break: the doc table and the site table take no paragraph. */
function firstSentence(text: string): string | undefined {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return undefined;
  const period = clean.indexOf(". ");
  return period === -1 ? clean : clean.slice(0, period + 1);
}

/**
 * The stamps that already exist, read from the committed JSON itself. Without
 * this each generation would erase the memory of when each prop was born.
 */
const previous: Record<string, CatalogPiece> = await Bun.file(TARGET)
  .json()
  .catch(() => ({}));

const stamped = (piece: string, prop: string) =>
  previous[piece]?.props.find((current) => current.name === prop)?.since;

async function readCatalog(): Promise<Record<string, CatalogPiece>> {
  const api = new API({ cwd: ROOT });
  const snapshot = await api.updateSnapshot({ openProjects: [`${ROOT}/tsconfig.json`] });
  const project = (await snapshot.getProjects())[0];
  if (!project) throw new Error("Could not open the tsconfig.json project.");

  const { checker, program } = project;
  const catalog: Record<string, CatalogPiece> = {};
  const collisions: string[] = [];

  for (const entryPoint of ENTRY_POINTS) {
    const file = await program.getSourceFile(`${ROOT}/${entryPoint}`);
    if (!file) throw new Error(`Could not find ${entryPoint}.`);

    const module = await checker.getSymbolAtLocation(file);
    if (!module) throw new Error(`${entryPoint} did not resolve as a module.`);

    for (const [key, symbol] of await module.getExports()) {
      const name = String(key);
      // A component starts with a capital letter. Hooks and utilities have
      // another form of documentation, and forcing both into the same table
      // lies about both.
      if (!/^[A-Z]/.test(name) || catalog[name]) continue;

      const type = await checker.getTypeOfSymbol(symbol);
      if (!type) continue;

      const signatures = await checker.getSignaturesOfType(type, SignatureKind.Call);
      if (!signatures.length) continue;

      const merged = new Map<string, { types: string[]; required: boolean; note?: string }>();
      let forwardsRoot = false;
      let read = 0;

      const overloaded =
        signatures.length > 1 &&
        signatures.every((signature) => isOwnSource(String(signature.declaration?.path ?? "")));

      for (const signature of overloaded ? signatures : signatures.slice(0, 1)) {
        const parameter = await checker.getParameterType(signature, 0);
        if (!parameter) continue;
        read++;

        const all = await checker.getPropertiesOfType(parameter);
        const seen = new Set<string>();

        for (const prop of all) {
          const paths = prop.declarations.map((declaration) => String(declaration.path ?? ""));
          const own = paths.some(isOwnSource);
          if (own && paths.some((path) => !isOwnSource(path)) && !FORWARDED.has(prop.name)) {
            collisions.push(`${name}.${prop.name}`);
          }
          const fromReact = !own && (paths[0] ?? "").includes("@types/react");
          if (fromReact || FORWARDED.has(prop.name)) {
            if (prop.name === "className") forwardsRoot = true;
            continue;
          }

          const propType = await checker.getTypeOfSymbol(prop);
          const note = firstSentence(await prop.getDocumentationComment(checker));
          const optional = Boolean(prop.flags & SymbolFlags.Optional);
          const written = propType
            ? (await checker.typeToString(propType)).replace(/\s+/g, " ").trim()
            : "unknown";
          const type = withoutUndefined(written, optional);

          seen.add(prop.name);
          const entry = merged.get(prop.name) ?? { types: [], required: read === 1 };
          for (const part of overloaded ? unionParts(type) : [type]) {
            if (overloaded && part === "undefined") continue;
            if (!entry.types.includes(part)) entry.types.push(part);
          }
          entry.required &&= !optional;
          entry.note ??= note;
          merged.set(prop.name, entry);
        }

        for (const [known, entry] of merged) if (!seen.has(known)) entry.required = false;
      }
      if (read === 0) continue;

      const props: CatalogProp[] = [...merged].map(([propName, entry]) => {
        // The stamp is memory, not derived from the type: the compiler does not
        // know when the prop was born, so it survives from one generation to
        // the next by coming from the committed JSON itself.
        const since = stamped(name, propName);
        return {
          name: propName,
          type: entry.types.join(" | "),
          required: entry.required,
          ...(entry.note ? { note: entry.note } : {}),
          ...(since ? { since } : {}),
        };
      });

      // Required before optional, and alphabetical within each group: what the
      // caller must pass comes before what it may pass.
      props.sort((a, b) =>
        a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1,
      );

      catalog[name] = { forwardsRoot, props };
    }
  }

  await api.close();

  if (collisions.length) {
    console.error(
      `${collisions.length} own prop(s) collide with an inherited attribute of the same name, and the published type becomes the intersection of both. Remove the key from the base with Omit:`,
    );
    for (const collision of collisions) console.error(`  ${collision}`);
    process.exit(1);
  }

  // Sorted, so the file does not reorder lines on each run and dirty the diff.
  return Object.fromEntries(Object.entries(catalog).sort(([a], [b]) => a.localeCompare(b)));
}

if (import.meta.main) {
  const catalog = await readCatalog();

  /*
   * The release stamp.
   *
   * `bun run gen:props --since 0.5.0` writes the version into every prop that
   * does not have one yet. It is the only moment the information exists:
   * during development nobody knows in which version the prop will ship, and
   * guessing produces a wrong number the doc publishes with confidence.
   */
  const stampArg = process.argv.indexOf("--since");
  if (stampArg !== -1) {
    const version = process.argv[stampArg + 1];
    if (!version) {
      console.error("Missing the version: bun run gen:props --since 0.5.0");
      process.exit(1);
    }

    let stampedNow = 0;
    for (const piece of Object.values(catalog)) {
      for (const prop of piece.props) {
        if (prop.since) continue;
        prop.since = version;
        stampedNow++;
      }
    }

    await Bun.write(TARGET, `${JSON.stringify(catalog, null, 2)}\n`);
    console.log(`${stampedNow} prop(s) stamped with ${version}.`);
    process.exit(0);
  }
  const text = `${JSON.stringify(catalog, null, 2)}\n`;
  const checking = process.argv.includes("--check");

  if (checking) {
    const current = await Bun.file(TARGET)
      .text()
      .catch(() => "");

    if (current !== text) {
      console.error(`${TARGET} diverged from the types. Run: bun run gen:props`);

      const before: Record<string, CatalogPiece> = current ? JSON.parse(current) : {};
      for (const [piece, data] of Object.entries(catalog)) {
        const previous = new Set((before[piece]?.props ?? []).map((p) => p.name));
        const added = data.props.map((p) => p.name).filter((p) => !previous.has(p));
        const removed = [...previous].filter(
          (p) => !data.props.some((current) => current.name === p),
        );
        if (added.length) console.error(`  ${piece}: added ${added.join(", ")}`);
        if (removed.length) console.error(`  ${piece}: removed ${removed.join(", ")}`);
      }
      process.exit(1);
    }

    const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);
    console.log(`props up to date: ${Object.keys(catalog).length} pieces, ${total} props.`);
  } else {
    await Bun.write(TARGET, text);
    const total = Object.values(catalog).reduce((sum, piece) => sum + piece.props.length, 0);
    console.log(`${TARGET}: ${Object.keys(catalog).length} pieces, ${total} props.`);
  }
}
