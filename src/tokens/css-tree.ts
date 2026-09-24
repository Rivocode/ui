import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function readCssTree(path: string, seen = new Set<string>()): string {
  const full = resolve(path);
  if (seen.has(full)) return "";
  seen.add(full);
  return readFileSync(full, "utf8").replace(
    /@import\s+["'](\.{1,2}\/[^"']+)["'][^;]*;/g,
    (_, target: string) => readCssTree(resolve(dirname(full), target), seen),
  );
}
