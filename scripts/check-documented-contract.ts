/**
 * Checks that the contract cites everything the subpaths export.
 *
 * `convencoes.md` is the first thing an agent reads, and the chart subpath had
 * already fallen three versions behind it: `ChartXAxis`, `ChartDonut`,
 * `Sparkline`, `ChartRadial` and the gradient existed in the package and not in
 * the contract. The agent then wrote charts with the old API, or invented one.
 *
 * Main-package components do not go here: the index at `/llms.txt` already
 * enumerates them, and it is generated. What needs watching is the handwritten
 * text, and of it only the part that promises a list.
 *
 * There used to be a "the 66" in this sentence, written when the catalog had 66
 * pieces. It went stale silently until it became 83 and nobody noticed, because
 * a number in a comment has no guard. Do not bring the digit back: it does not
 * carry the argument, and the only thing it does is lie later.
 */
import { readdirSync, readFileSync } from "node:fs";

const CONTRACT_FILE = ".design-sync/conventions.md";
const SKILL_DIR = ".claude/skills/rivocode-ui";

/**
 * BOTH packages, and not only the web one.
 *
 * The guard was born counting only `src/chart` and `src/form`, and native grew
 * four subpaths outside it - `chart`, `form`, `clipboard` and `file-upload`. An
 * optional peer nobody cites is worse than no peer: whoever reads the contract
 * does not find out the piece exists, and whoever reads the skill writes the
 * root import, which does not have the piece. Removing the four lines below
 * brings back the whole blind spot.
 *
 * The utility hooks come in for the same reason, even though they come from the
 * root and not from a subpath: they are twenty-some names the piece index does
 * not enumerate - a hook has no page -, and their list in the contract and in
 * the skill is handwritten. The two lines read each package's barrel, and not
 * the root `index.ts`, to demand only the hooks and not the whole catalog.
 */
const TARGETS = [
  { file: "src/hooks/public.ts", name: "@rivocode/ui (hooks)" },
  { file: "native/src/hooks/common/index.ts", name: "@rivocode/ui-native (hooks)" },
  { file: "src/chart/index.ts", name: "@rivocode/ui/chart" },
  { file: "src/form/index.ts", name: "@rivocode/ui/form" },
  { file: "src/ai/index.ts", name: "@rivocode/ui/ai" },
  { file: "src/dnd/index.ts", name: "@rivocode/ui/dnd" },
  { file: "src/editor/index.ts", name: "@rivocode/ui/editor" },
  { file: "native/src/chart/index.ts", name: "@rivocode/ui-native/chart" },
  { file: "native/src/form/index.ts", name: "@rivocode/ui-native/form" },
  { file: "native/src/clipboard/index.ts", name: "@rivocode/ui-native/clipboard" },
  { file: "native/src/file-upload/index.ts", name: "@rivocode/ui-native/file-upload" },
  { file: "native/src/ai/index.ts", name: "@rivocode/ui-native/ai" },
  { file: "native/src/dnd/index.ts", name: "@rivocode/ui-native/dnd" },
];

const contract = readFileSync(CONTRACT_FILE, "utf8");
/**
 * The whole skill, and not only its body.
 *
 * The body became an index, and the form and chart detail lives in
 * `reference/`. Reading only SKILL.md, the guard started demanding names that
 * are documented in the file next to it.
 */
const skill = [
  readFileSync(`${SKILL_DIR}/SKILL.md`, "utf8"),
  ...readdirSync(`${SKILL_DIR}/reference`)
    .filter((file) => file.endsWith(".md"))
    .map((file) => readFileSync(`${SKILL_DIR}/reference/${file}`, "utf8")),
].join("\n");

/**
 * What the subpath exports of its own.
 *
 * The Recharts re-exports are left out: they are listed as a block in both
 * texts, and demanding them one by one would only create noise every time
 * Recharts gains a piece.
 */
function exportsOf(file: string) {
  const source = readFileSync(file, "utf8");
  const withoutRecharts = source
    // `[^}]` and not `[\s\S]*?`: the non-greedy one started at the file's first
    // `export {` and erased all of src/chart/index.ts before counting - the check
    // had been passing green for versions with useChartMotion, ChartLegend and
    // ChartLegendContent missing from the skill.
    .replace(/export \{[^}]*\} from "recharts";/g, "")
    // A comment inside the export block is not an export name: without removing
    // it, "// the old names" became a piece the docs would need to cite.
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");

  const names = new Set<string>();

  for (const block of withoutRecharts.matchAll(/export \{([\s\S]*?)\} from/g)) {
    for (const raw of block[1].split(",")) {
      const part = raw.trim();
      // A type does not need to appear in contract text: whoever writes a screen
      // uses the piece, and the type arrives through the editor.
      if (!part || part.startsWith("type ")) continue;
      names.add(part);
    }
  }

  return [...names];
}

let misses = 0;

for (const target of TARGETS) {
  const names = exportsOf(target.file);
  const missingFromContract = names.filter((name) => !contract.includes(name));
  const missingFromSkill = names.filter((name) => !skill.includes(name));

  if (missingFromContract.length > 0) {
    console.error(
      `${CONTRACT_FILE} does not cite, from ${target.name}: ${missingFromContract.join(", ")}`,
    );
    misses += missingFromContract.length;
  }
  if (missingFromSkill.length > 0) {
    console.error(`the skill does not cite, from ${target.name}: ${missingFromSkill.join(", ")}`);
    misses += missingFromSkill.length;
  }
}

if (misses > 0) {
  console.error(`\nWhat an agent reads fell behind what the package exports.`);
  process.exit(1);
}

console.log(`contract and skill cite everything the subpaths export.`);
