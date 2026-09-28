import { expect, test } from "bun:test";

const preset = await Bun.file("src/preset.css").text();

function baseLayer(css: string): string {
  const start = css.indexOf("@layer base {");
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  for (let index = css.indexOf("{", start); index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return css.slice(start, index + 1);
  }
  throw new Error("base layer is never closed");
}

test("the scrollbar wears the theme, with the border role and never a literal color", () => {
  const layer = baseLayer(preset);

  expect(layer).toContain("scrollbar-width: thin");
  expect(layer).toContain("scrollbar-color: var(--rc-border-strong) transparent");
  expect(layer).toContain("::-webkit-scrollbar-thumb");
  expect(layer).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
});

test("the rule lives in the base layer, so the component class and the consumer class win", () => {
  const outside = preset.replace(baseLayer(preset), "");

  expect(outside).not.toContain("scrollbar-color");
  expect(outside).not.toContain("::-webkit-scrollbar");
});
