/**
 * Duplicate install guard: a second copy of React in the tree.
 *
 * The root declares `workspaces: ["apps/*"]`, and `native/` is not in it. Whoever
 * runs `bun install` inside the native package - the obvious move for someone
 * about to work on it - does not get a link to the root's copy: they get a real
 * second copy, with the same version number.
 *
 * The damage does not show up where it was done. The root `bun test` loads both
 * in the same process, and ninety-eight tests nobody touched start failing
 * with "Invalid hook call ... more than one copy of React" - a message that
 * sends you hunting for a hook bug in code that is correct. CI never sees it,
 * because it only installs at the root, so the green there does not help explain
 * the red here.
 *
 * Nothing legitimate needs that folder: `check:native:types` type-checks the
 * package through `examples/native`, and passes without it.
 */
import { existsSync } from "node:fs";

/** The folder and the trail it leaves, so the fix comes out complete. */
const STRAYS = ["native/node_modules", "native/bun.lock"];

const found = STRAYS.filter((path) => existsSync(path));

if (found.length > 0) {
  console.error(`Stray install inside native/: ${found.join(", ")}`);
  console.error(
    "\n`native/` is not a workspace, so a `bun install` in there creates a" +
      "\nsecond copy of React - and the root `bun test` breaks en masse with" +
      '\n"Invalid hook call", pointing at code that is correct.' +
      `\n\nThe fix:\n  rm -rf ${found.join(" ")}` +
      "\n\nTo work on the native package, the example app already has everything installed:" +
      "\n  bun install --cwd examples/native",
  );
  process.exit(1);
}

console.log("A single copy of React: no stray install in native/.");
