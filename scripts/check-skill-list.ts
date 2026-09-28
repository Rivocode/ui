/**
 * Guard of the handwritten list that installs the skill.
 *
 * The skill is not a file, it is a folder: a `SKILL.md` and the `reference/`
 * files the agent opens when the work calls for them. Whoever installs through
 * the package gets the whole folder, because `build:skill` copies a directory
 * and a directory does not forget a file. Whoever installs through the site
 * gets whatever is written in the loop of `apps/docs/src/content/skill.md`, and
 * a handwritten loop forgets.
 *
 * It forgot. The loop listed seven names and the folder had eight: missing was
 * precisely `native`, the newest file. Whoever followed the docs ended up with
 * an incomplete skill and no warning at all - `curl` returns zero on all seven,
 * the folder looks ready, and the agent only finds out it lacks the React
 * Native reference when someone asks for a native screen and it invents one.
 * The failure mode is the worst there is: silent at install and visible weeks
 * later, in a place nobody connects to the command they ran.
 *
 * The fix was by hand, the same day, and that is why this guard exists: what is
 * fixed by hand breaks again at the next new reference, by the same path and
 * for the same reason. The folder is the source, and the two texts that repeat
 * it have to cite all of its files - the `SKILL.md` index, which is how the
 * agent knows the file exists, and the site's loop, which is how the file
 * reaches the disk.
 *
 * Zero exceptions, and there is no exception list here on purpose: a file in
 * `reference/` that should not be installed should not be in `reference/`.
 */
import { readdirSync } from "node:fs";

const REFERENCE = ".claude/skills/rivocode-ui/reference";
const SKILL = ".claude/skills/rivocode-ui/SKILL.md";
const PAGE = "apps/docs/src/content/skill.md";

const files = readdirSync(REFERENCE)
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""))
  .sort();

const skill = await Bun.file(SKILL).text();
const page = await Bun.file(PAGE).text();

const problems: string[] = [];

if (files.length === 0) {
  problems.push(
    `${REFERENCE} is empty.\n` +
      "    Either the path changed, or the folder is gone. A guard with nothing to check\n" +
      "    stays green forever, which is the state it exists to prevent.",
  );
}

const linked = new Set([...skill.matchAll(/reference\/([\w-]+)\.md/g)].map(([, name]) => name!));

const loop = /for\s+f\s+in\s+([\w\s-]+?);\s*do/.exec(page);

if (!loop) {
  problems.push(
    `${PAGE}: could not find the loop that downloads \`reference/\`, in the form \`for f in a b c; do\`.\n` +
      "    Without it this guard stops checking without complaining, and the loop goes\n" +
      "    stale again the same way. If the command's shape changed, adjust the guard with it.",
  );
}

const looped = new Set(loop ? loop[1]!.trim().split(/\s+/) : []);

for (const name of files) {
  if (!linked.has(name)) {
    problems.push(
      `\`${name}.md\` does not appear in the index of ${SKILL}.\n` +
        `    The agent only opens what the index cites: without the line, the file travels along and\n` +
        "    is never read. Add the line to the topics table.",
    );
  }

  if (loop && !looped.has(name)) {
    problems.push(
      `\`${name}\` is not in the loop of ${PAGE}.\n` +
        "    Whoever installs through the site goes without this file, and `curl` does not complain:\n" +
        "    the folder looks ready and the skill is incomplete. Add the name to the loop.",
    );
  }
}

for (const name of linked) {
  if (!files.includes(name)) {
    problems.push(
      `${SKILL} points to \`reference/${name}.md\`, which does not exist.\n` +
        "    Either the file was renamed, or it was deleted. A dead link in the index sends the\n" +
        "    agent to open what is not there, and it goes on without the reference it needed.",
    );
  }
}

for (const name of looped) {
  if (!files.includes(name)) {
    problems.push(
      `The loop of ${PAGE} downloads \`${name}.md\`, which does not exist in ${REFERENCE}.\n` +
        "    `curl -f` exits with an error in the middle of the install and the rest of the folder never arrives.\n" +
        "    Delete the name from the loop.",
    );
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in the skill list:\n`);
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    "The `reference/` folder is the source. The SKILL.md index and the site's loop are\n" +
      "handwritten copies of it, and a handwritten copy goes stale silently: the loop\n" +
      "once installed seven of eight files, and the one missing was the newest.",
  );
  process.exit(1);
}

console.log(
  `${files.length} files in ${REFERENCE}, all in the SKILL.md index and in the site's loop: ` +
    `${files.join(", ")}.`,
);
