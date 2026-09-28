import { expect, test } from "bun:test";

import { flattenPreset } from "../scripts/build-preset";

test("the flattened preset carries every file that src/preset.css imports, in order", async () => {
  const { css, files } = await flattenPreset();
  expect(files.length).toBeGreaterThan(4);

  let cursor = 0;
  for (const file of files) {
    const body = await Bun.file(file).text();
    expect(body.length).toBeGreaterThan(0);
    const at = css.indexOf(body, cursor);
    expect(at).toBeGreaterThanOrEqual(cursor);
    cursor = at + body.length;
  }
});

test("the flattened preset carries the rules of src/preset.css and no import", async () => {
  const { css, rules } = await flattenPreset();
  expect(rules).toContain("[data-rc-theme]");
  expect(rules).toContain("cursor: pointer");
  expect(css).toContain(rules);
  expect(css).not.toMatch(/@import/);
});
