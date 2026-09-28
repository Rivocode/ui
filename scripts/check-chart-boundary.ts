/**
 * Guard of the OPTIONAL peer boundaries, in BOTH packages.
 *
 * It was born for the chart - and the file name still says so -, but the
 * invariant was never the chart's: it belongs to every subpath that exists
 * because a peer cannot be charged to whoever does not use it. Whoever only
 * wants a button and a table installs `@rivocode/ui` and does not pay the
 * ~180kB of `@rivocode/ui/chart`; whoever only wants a `Button` on the phone
 * installs `@rivocode/ui-native` and does not need to link react-native-svg,
 * expo-clipboard or expo-document-picker to the native project, where they
 * cost a build and not just bytes. The price of this arrangement is always
 * the same: no module reached by the root index may import the peer, neither
 * directly nor through a piece of the subpath.
 *
 * The invariant lived only in prose - a comment in `src/components/stat.tsx`
 * explaining why Stat does not use Sparkline. An `import { Sparkline } from
 * "../chart/sparkline"` written there compiles, passes the whole `check`,
 * goes into the bundle, and only fails on the machine of whoever installed
 * without recharts: module not found, at runtime, with no build error of ours
 * to blame. It is the worst kind of breakage - the kind our suite cannot feel,
 * because here recharts is installed as a devDependency.
 *
 * There are two rules per boundary, and the second is the one that really
 * shuts the door:
 *
 *   1. The peer only enters the subpath's directory.
 *   2. The subpath's directory is only imported from inside itself -
 *      importing Sparkline drags recharts along, and step 1 would see
 *      nothing.
 *
 * The guard reads imports, not text. `grep -rn recharts src/` would flag the
 * Stat comment, which is precisely what explains the rule; a guard that flags
 * its own documentation dies in the first week.
 *
 * **The table below is the whole piece, and it exists to grow.** Neither
 * native, nor the form, nor the two Expo boundaries got their own script: the
 * invariant is the same, the import reading is the same, and two identical
 * guards diverge at the first fix only one of them receives. The proof is the
 * hole the first version had and that the table closed in all of them at once
 * - see `inside()`. A new subpath with a new peer is one line here, and
 * nothing more.
 *
 * **A subpath without a peer lives here too.** `@rivocode/ui/ai` and
 * `@rivocode/ui-native/ai` cost no dependency at all: what they cost is
 * WEIGHT. `PromptInput`, `Conversation` and `ToolCall` only serve an app that
 * talks to a model, and metro does not shake trees - importing a `Button`
 * from the native index compiles everything the index reaches, on the device
 * of someone who will never open a chat. Rule 2 is the same, and it is the one
 * that holds the door: nothing from outside the directory imports from it.
 * That is why `peer` is optional in the table - a line without it guards only
 * the second rule, and `why` says what is lost.
 *
 * A note on the file name: it is `check-chart-boundary` because the script is
 * called `check:chart` in the root package.json, and renaming one without the
 * other leaves the command dead. Read "chart" as "the first subpath that
 * needed this".
 */
import { scanAtLeast } from "./scan";

type Frontier = {
  /** The published name, so the message says who it is about. */
  pkg: string;
  /** The root of the package's code. */
  core: string;
  /** The subpath's directory, with a trailing slash. */
  dir: string;
  /** The subpath's public specifier. */
  entry: string;
  /** The optional peer - or peers - that must not leak. Without it, only rule 2. */
  peer?: RegExp;
  /** Why it must not leak, in one line. */
  why: string;
};

const FRONTIERS: Frontier[] = [
  {
    pkg: "@rivocode/ui",
    core: "src",
    dir: "src/chart/",
    entry: "@rivocode/ui/chart",
    peer: /^recharts(\/|$)/,
    why: "recharts is an optional peer: whoever installed only @rivocode/ui does not have it.",
  },
  {
    pkg: "@rivocode/ui",
    core: "src",
    dir: "src/form/",
    entry: "@rivocode/ui/form",
    peer: /^(react-hook-form|@hookform\/resolvers|zod)(\/|$)/,
    why:
      "react-hook-form, zod and the resolver are optional peers: whoever installed\n" +
      "    only @rivocode/ui builds an Input without any of the three.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/chart/",
    entry: "@rivocode/ui-native/chart",
    peer: /^react-native-svg(\/|$)/,
    why:
      "react-native-svg is an optional peer, and on the phone it is not just bytes: it is\n" +
      "    a native module, which the app has to link and rebuild.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/form/",
    entry: "@rivocode/ui-native/form",
    peer: /^(react-hook-form|@hookform\/resolvers|zod)(\/|$)/,
    why:
      "react-hook-form, zod and the resolver are optional peers, and metro\n" +
      "    resolves imports per file: in the root index, whoever only wants a Button\n" +
      "    would have to install all three.",
  },
  {
    pkg: "@rivocode/ui",
    core: "src",
    dir: "src/editor/",
    entry: "@rivocode/ui/editor",
    peer: /^@tiptap\//,
    why:
      "Tiptap is an optional peer - @tiptap/react, /pm, /core, /starter-kit and\n" +
      "    /extensions -, and the ProseMirror underneath weighs more than the rest of\n" +
      "    the whole form. Whoever builds an Input installs no editor at all.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/clipboard/",
    entry: "@rivocode/ui-native/clipboard",
    peer: /^expo-clipboard(\/|$)/,
    why:
      "expo-clipboard is an optional peer and an Expo native module: whoever copies\n" +
      "    nothing should not have to install and rebuild because of it.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/file-upload/",
    entry: "@rivocode/ui-native/file-upload",
    peer: /^expo-document-picker(\/|$)/,
    why:
      "expo-document-picker is an optional peer and an Expo native module. It has a\n" +
      "    path SEPARATE from clipboard on purpose: whoever copies an NF-e key\n" +
      "    attaches no file, and an index shared by both would charge for both.",
  },
  {
    pkg: "@rivocode/ui",
    core: "src",
    dir: "src/dnd/",
    entry: "@rivocode/ui/dnd",
    peer: /^@dnd-kit\//,
    why:
      "@dnd-kit/core and @dnd-kit/sortable are optional peers: whoever neither\n" +
      "    reorders lists nor builds boards installs neither of them.",
  },
  {
    pkg: "@rivocode/ui",
    core: "src",
    dir: "src/ai/",
    entry: "@rivocode/ui/ai",
    why:
      "The AI subpath has no peer: what it costs is weight. Whoever builds an invoice\n" +
      "    screen does not load the prompt field, the conversation and the tool\n" +
      "    card for having imported a Button.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/dnd/",
    entry: "@rivocode/ui-native/dnd",
    why:
      "The native drag subpath has no peer - the gesture is core's PanResponder -,\n" +
      "    and it exists so the import line is the same as on the web. Nothing from\n" +
      "    outside goes in there, or the root index starts compiling the list along.",
  },
  {
    pkg: "@rivocode/ui-native",
    core: "native/src",
    dir: "native/src/ai/",
    entry: "@rivocode/ui-native/ai",
    why:
      "The AI subpath has no peer, and on the phone the weight is bigger than on the web:\n" +
      "    metro does not shake trees, and everything the root index reaches is\n" +
      "    compiled into the app of whoever only wanted a Button.",
  },
];

/** What this file imports, with comments stripped and already resolved. */
function importsOf(file: string, code: string) {
  // A comment is prose: `stat.tsx` mentions recharts to explain why it does not
  // use it, and the mention is not an import.
  const source = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  const found: { specifier: string; line: number }[] = [];

  // Covers `import x from "m"`, `import "m"`, `export * from "m"`,
  // `import("m")` and `require("m")` - the five ways a module gets in.
  for (const hit of source.matchAll(/(?:\bfrom|\bimport|\brequire)\s*\(?\s*["']([^"']+)["']/g)) {
    found.push({
      specifier: hit[1]!,
      line: code.slice(0, hit.index!).split("\n").length,
    });
  }

  return found.map((entry) => ({
    ...entry,
    // `../chart/sparkline` from `src/components/stat.tsx` is
    // `src/chart/sparkline`: without resolving, one extra `../` would slip by.
    resolved: entry.specifier.startsWith(".")
      ? new URL(entry.specifier, `file:///${file}`).pathname.slice(1)
      : entry.specifier,
  }));
}

/**
 * Does the path fall inside the subpath's directory?
 *
 * `startsWith(dir)` alone has a hole, and it is the hole of the most natural
 * import there is: `import { ChartDonut } from "./chart"` from the root index
 * resolves to `src/chart` - without the trailing slash, because the specifier
 * points at the DIRECTORY and whoever adds `/index` is the module resolver,
 * not us. `"src/chart".startsWith("src/chart/")` is false, so the form anyone
 * would write first was the only one that passed.
 */
const inside = (resolved: string, dir: string) =>
  resolved === dir.slice(0, -1) || resolved.startsWith(dir);

const breaches: string[] = [];

for (const frontier of FRONTIERS) {
  for (const file of await scanAtLeast("**/*.{ts,tsx}", 40, { cwd: frontier.core })) {
    const path = `${frontier.core}/${file}`;
    if (inside(path, frontier.dir)) continue;

    const code = await Bun.file(path).text();

    for (const { specifier, resolved, line } of importsOf(path, code)) {
      if (frontier.peer?.test(specifier)) {
        breaches.push(`  ${path}:${line}  imports "${specifier}"\n    ${frontier.why}`);
        continue;
      }

      if (inside(resolved, frontier.dir) || resolved === frontier.entry) {
        breaches.push(
          `  ${path}:${line}  imports "${specifier}"\n` +
            `    Everything in ${frontier.dir} drags the subpath along, even if the piece does not look like it.\n` +
            `    ${frontier.why}`,
        );
      }
    }
  }
}

if (breaches.length > 0) {
  console.error(`${breaches.length} import(s) crossing a subpath boundary:\n`);
  for (const item of breaches) console.error(item);
  console.error(
    "\nThe core of both packages has to keep building without the peer installed." +
      "\n\nIf the piece really needs the peer, it belongs in the peer's directory and ships" +
      "\nthrough the subpath. If it is the core that needs it, redo the part without the peer -" +
      "\nit is what `Stat` does on the web, and what the native `Sparkline` does with `View`;" +
      "\nthe comments of both explain why." +
      "\n\nNothing here breaks the build: it breaks the install of whoever lacks the peer," +
      "\nwith 'module not found' in production and no error of ours to blame.",
  );
  process.exit(1);
}

console.log(
  FRONTIERS.map((frontier) =>
    frontier.peer
      ? `${frontier.pkg}: the peer does not leave ${frontier.dir}`
      : `${frontier.pkg}: ${frontier.dir} has no peer`,
  ).join(
    ", and nobody from outside goes in there.\n",
  ) + ", and nobody from outside goes in there.",
);
