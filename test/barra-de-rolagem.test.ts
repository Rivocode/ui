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
  throw new Error("camada base sem fechamento");
}

test("a barra de rolagem veste o tema, com o papel da borda e nunca cor literal", () => {
  const layer = baseLayer(preset);

  expect(layer).toContain("scrollbar-width: thin");
  expect(layer).toContain("scrollbar-color: var(--rc-border-strong) transparent");
  expect(layer).toContain("::-webkit-scrollbar-thumb");
  expect(layer).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i);
});

test("a regra mora na camada base, para a classe da peca e a de quem usa vencerem", () => {
  const outside = preset.replace(baseLayer(preset), "");

  expect(outside).not.toContain("scrollbar-color");
  expect(outside).not.toContain("::-webkit-scrollbar");
});
