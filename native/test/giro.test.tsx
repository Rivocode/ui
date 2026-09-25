import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";

import { Spinner } from "../src";
import { byType, render } from "./helpers";

const indicator = (element: ReactElement) =>
  byType(render(element), "ActivityIndicator")[0]!.props;

describe("Spinner", () => {
  test("fala sm, md e lg, como o web, sobre os dois giros do sistema", () => {
    expect(indicator(<Spinner size="sm" />).size).toBe("small");
    expect(indicator(<Spinner size="md" />).size).toBe("small");
    expect(indicator(<Spinner size="lg" />).size).toBe("large");
    expect(indicator(<Spinner />).size).toBe("small");
  });

  test("small e large continuam valendo", () => {
    expect(indicator(<Spinner size="small" />).size).toBe("small");
    expect(indicator(<Spinner size="large" />).size).toBe("large");
  });

  test("o label e o que o leitor anuncia, com Carregando de padrao", () => {
    expect(indicator(<Spinner />).accessibilityLabel).toBe("Carregando");
    expect(indicator(<Spinner label="Emitindo a nota" />).accessibilityLabel).toBe(
      "Emitindo a nota",
    );
  });

  test("label vazio esconde o giro da leitura", () => {
    const props = indicator(<Spinner label="" />);
    expect(props.accessibilityLabel).toBeUndefined();
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
