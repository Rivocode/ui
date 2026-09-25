import { expect, test } from "bun:test";

import { compactCss } from "../scripts/compactar-css";

test("o compactCss tira o espaco em volta de chave e ponto e virgula, e preserva o de dentro do valor", () => {
  const css = `.a {
  color: red;
  content: "a b";
}

.b { margin: 0 auto }
/* nota curta */
`;
  expect(compactCss(css)).toBe(
    `.a{color: red;content: "a b";}.b{margin: 0 auto}/* nota curta */\n`,
  );
});

test("o compactCss recusa string com ponto e virgula, que o corte de espaco corromperia", () => {
  expect(() => compactCss(`.a::after { content: "x ; y"; }`)).toThrow(
    /compactCss: string ou comentario/,
  );
  expect(() => compactCss(`.a::after { content: 'x { y'; }`)).toThrow(/x \{ y/);
});

test("o compactCss recusa comentario com chave ou quebra de linha", () => {
  expect(() => compactCss(`/* .a { color: red } */\n.b { color: blue; }`)).toThrow(
    /compactCss: string ou comentario/,
  );
  expect(() => compactCss(`/* primeira\n segunda */\n.b { color: blue; }`)).toThrow(
    /compactCss: string ou comentario/,
  );
});
