/**
 * Dead selector guard: whoever consumes a group nobody declares.
 *
 * SidebarGroup hid its title with `group-data-[collapsed]/barra:hidden`, and
 * there was no `group/barra` anywhere in the library - the root declared
 * `group/sidebar`. It was a half-done rename, and the collapsed 3.5rem column
 * kept leaking "CATA" for weeks.
 *
 * The detail that makes this guard exist: the orphan class scan does not catch
 * it. The class exists and generates CSS - it is the selector that never
 * matches. Finding it takes comparing the declared group name with the
 * consumed one, which is a different question.
 *
 * The same goes for `peer/x`, for the same reason.
 *
 * The reverse direction fails too: a declared group nobody consumes. On
 * 25/09/2026 the `group/sidebar` on the `Sidebar` root sat there with no
 * consumer at all - collapsing had come to be decided by context - and the
 * guard counted it among "all with a declarer", announcing 8 selectors next to
 * 9 names. A declaration without consumption is the same half-done rename,
 * seen from the other end, and it is the name the next consumer will find and
 * use wrong.
 */
import { scanAtLeast } from "./scan";

const AREAS: [area: string, floor: number][] = [
  ["src/**/*.{ts,tsx}", 80],
  ["native/src/**/*.{ts,tsx}", 60],
];

/** `group/sidebar`, `peer/field`. */
const DECLARED = /\b(group|peer)\/([a-zA-Z][\w-]*)/g;

/** `group-data-[collapsed]/sidebar:hidden`, `peer-checked/field:block`. */
const CONSUMED = /\b(group|peer)-[a-z][\w-]*(?:-\[[^\]]*\])?\/([a-zA-Z][\w-]*)/g;

const declared = new Map<string, Set<string>>();
const consumed = new Map<string, { file: string; line: number }[]>();

for (const [area, floor] of AREAS) {
  for (const file of await scanAtLeast(area, floor)) {
    const code = await Bun.file(file).text();

    code.split("\n").forEach((line, index) => {
      for (const [, kind, name] of line.matchAll(DECLARED)) {
        const key = `${kind}/${name}`;
        const files = declared.get(key) ?? new Set<string>();
        files.add(file);
        declared.set(key, files);
      }

      for (const [, kind, name] of line.matchAll(CONSUMED)) {
        const key = `${kind}/${name}`;
        consumed.set(key, [...(consumed.get(key) ?? []), { file, line: index + 1 }]);
      }
    });
  }
}

const orphans = [...consumed.entries()].filter(([key]) => !declared.has(key));
const unused = [...declared.entries()].filter(([key]) => !consumed.has(key));

if (declared.size < 5) {
  console.error(
    `Only ${declared.size} group(s) declared in ${AREAS.map(([area]) => area).join(" and ")}.` +
      "\nThe library has more than that: the expression or the scan stopped reading.",
  );
  process.exit(1);
}

if (orphans.length > 0) {
  console.error(`${orphans.length} group selector(s) with no declarer:\n`);
  for (const [key, uses] of orphans) {
    console.error(`  ${key}  used in:`);
    for (const use of uses) console.error(`    ${use.file}:${use.line}`);
  }
  console.error(
    `\nDeclared today: ${[...declared.keys()].sort().join(", ")}` +
      "\nThe class exists and generates CSS; what is dead is the selector, and nothing complains.",
  );
}

if (unused.length > 0) {
  console.error(`${unused.length} declared group(s) nobody consumes:\n`);
  for (const [key, files] of unused) {
    console.error(`  ${key}  declared in: ${[...files].sort().join(", ")}`);
  }
  console.error(
    "\nIt is the other half of the same rename: the name stayed on the root and the consumer" +
      "\nchanged or vanished. Delete the declaration, or find the selector that should match it.",
  );
}

if (orphans.length > 0 || unused.length > 0) process.exit(1);

console.log(
  `${declared.size} declared group(s), each one with a consumer and each consumption with` +
    ` a declarer (${[...declared.keys()].sort().join(", ")}).`,
);
