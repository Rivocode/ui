import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { version } from "../src/index";
import manifesto from "../package.json";

/*
 * Comparada com o manifesto, e nao com um numero escrito aqui: cravar a versao
 * no teste faz cada `npm version` quebrar a suite por um motivo que nao e
 * defeito. O que importa e as duas nao se separarem, porque quem le a `version`
 * exportada esta perguntando qual pacote esta instalado.
 */
test("a versao exportada e a mesma do pacote", () => {
  expect(version).toBe(manifesto.version);
});

test("o ambiente de teste tem DOM", () => {
  render(<p>ok</p>);
  expect(screen.getByText("ok")).toBeDefined();
});
