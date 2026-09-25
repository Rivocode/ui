import { expect, test } from "bun:test";

import { flattenPreset } from "../scripts/build-preset";

test("o preset achatado leva cada arquivo que o src/preset.css importa, na ordem", async () => {
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

test("o preset achatado leva as regras do src/preset.css e nenhum import", async () => {
  const { css, rules } = await flattenPreset();
  expect(rules).toContain("[data-rc-theme]");
  expect(rules).toContain("cursor: pointer");
  expect(css).toContain(rules);
  expect(css).not.toMatch(/@import/);
});
