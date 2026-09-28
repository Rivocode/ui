import { expect, test } from "bun:test";

import { compactCss } from "../scripts/compact-css";

test("compactCss strips the space around braces and semicolons, and keeps the one inside the value", () => {
  const css = `.a {
  color: red;
  content: "a b";
}

.b { margin: 0 auto }
/* short note */
`;
  expect(compactCss(css)).toBe(
    `.a{color: red;content: "a b";}.b{margin: 0 auto}/* short note */\n`,
  );
});

test("compactCss rejects a string with a semicolon, which stripping space would corrupt", () => {
  expect(() => compactCss(`.a::after { content: "x ; y"; }`)).toThrow(
    /compactCss: string or comment/,
  );
  expect(() => compactCss(`.a::after { content: 'x { y'; }`)).toThrow(/x \{ y/);
});

test("compactCss rejects a comment with a brace or a line break", () => {
  expect(() => compactCss(`/* .a { color: red } */\n.b { color: blue; }`)).toThrow(
    /compactCss: string or comment/,
  );
  expect(() => compactCss(`/* first\n second */\n.b { color: blue; }`)).toThrow(
    /compactCss: string or comment/,
  );
});
