import { describe, expect, test } from "bun:test";

import { tokens } from "../tokens";
import { render, byType } from "./helpers";
import { Button } from "../src/button";

/*
 * A camada 3 no nativo.
 *
 * No web, vestir um cliente e reescrever a camada 3 - e essa frase e a razao
 * de a biblioteca existir do jeito que existe. No nativo ela nao valia: os 44
 * papeis viravam hex cravado dentro de light-dark() em build, e o provider so
 * aceitava os dois temas de casa. Nao havia nome de cliente possivel.
 *
 * O que nao pode se perder no caminho: os temas de casa continuam trocando no
 * mesmo frame, sem re-render, porque continuam no light-dark().
 */

const ACME = {
  light: { ...tokens.themes["rivocode-light"], accent: "#1b57ff", "accent-fg": "#ffffff" },
  dark: { ...tokens.themes["rivocode-dark"], accent: "#7aa2ff", "accent-fg": "#0b1020" },
};

describe("tema de cliente", () => {
  test("o provider veste os 44 papeis do tema que recebeu", () => {
    const screen = render(<Button>Emitir</Button>, { theme: ACME, scheme: "light" });
    const applied = byType(screen, "VariableContextProvider")[0]!.props.value as Record<
      string,
      string
    >;

    expect(applied["--color-accent"]).toBe("#1b57ff");
    // Nao e so o acento: um tema incompleto herda a cor da RivoCode em pecas
    // isoladas, e isso so aparece na tela do cliente.
    expect(Object.keys(applied).length).toBe(Object.keys(tokens.themes["rivocode-dark"]).length);
  });

  test("o esquema do aparelho escolhe entre o claro e o escuro do cliente", () => {
    const screen = render(<Button>Emitir</Button>, { theme: ACME, scheme: "dark" });
    const applied = byType(screen, "VariableContextProvider")[0]!.props.value as Record<
      string,
      string
    >;

    expect(applied["--color-accent"]).toBe("#7aa2ff");
  });

  test("quem le cor por fora da classe recebe a do cliente, e nao a da casa", () => {
    // O Switch pinta o trilho nativo com trackColor, o Button pinta o giro:
    // essas pecas leem o papel do contexto, e nao a classe. Sem isso, metade
    // da tela do cliente ficaria com a lima da RivoCode.
    const screen = render(<Button loading>Emitindo</Button>, { theme: ACME, scheme: "light" });
    const spinner = byType(screen, "ActivityIndicator")[0]!;

    expect(spinner.props.color).toBe("#ffffff");
  });

  test("sem tema de cliente, nada e embrulhado - o light-dark() continua sozinho", () => {
    // A troca no mesmo frame e o que a escolha original comprou, e ela vale
    // para os dois temas de casa. Embrulhar todo mundo custaria isso de graca.
    const screen = render(<Button>Emitir</Button>, { theme: "rivocode-dark" });

    expect(byType(screen, "VariableContextProvider").length).toBe(0);
  });
});
