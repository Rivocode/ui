import { readFileSync } from "node:fs";

import { Glob } from "bun";
import { expect, test } from "bun:test";

const IMPORT = /import\s+(?:\w+\s*,\s*)?\{([^}]*)\}\s+from\s+"react-native-svg"/g;
const MOCK = /mock\.module\("react-native-svg",[\s\S]*?\n\}\);/g;

test("todo duble do react-native-svg exporta o que o native/src importa", async () => {
  const sources = await Array.fromAsync(new Glob("native/src/**/*.{ts,tsx}").scan("."));
  expect(sources.length).toBeGreaterThan(50);

  const used = new Set<string>();
  for (const file of sources) {
    for (const [, names] of readFileSync(file, "utf8").matchAll(IMPORT)) {
      for (const name of names!.split(",")) {
        const clean = name.replace(/^type\s+/, "").replace(/\s+as\s+\w+\s*$/, "").trim();
        if (clean && !name.trim().startsWith("type ")) used.add(clean);
      }
    }
  }
  expect(used.size).toBeGreaterThan(2);

  const tests = await Array.fromAsync(new Glob("native/test/**/*.{ts,tsx}").scan("."));
  expect(tests.length).toBeGreaterThan(20);

  let mocks = 0;
  for (const file of tests) {
    for (const [block] of readFileSync(file, "utf8").matchAll(MOCK)) {
      mocks += 1;
      for (const name of used) expect({ file, has: block.includes(`${name}:`) }).toEqual({ file, has: true });
    }
  }
  expect(mocks).toBeGreaterThan(1);
});
