import { describe, expect, mock, test } from "bun:test";

import * as web from "../../src/shared/format";
import { Meter, Progress, Slider, Stat, currencyShort, formatters, percent } from "../src";
import { byClass, byRole, render, textOf } from "./helpers";

describe("o vocabulario de formatacao e o mesmo do web", () => {
  test("a raiz exporta os mesmos formatadores, com a mesma saida", () => {
    expect(Object.keys(formatters).sort()).toEqual(Object.keys(web.formatters).sort());
    expect(currencyShort(2480)).toBe(web.currencyShort(2480));
    expect(currencyShort(2480)).toBe("R$\u00a02,5K");
    expect(percent(12.5)).toBe("13%");
  });
});

describe("Meter", () => {
  test("o nome do formatador escreve a tela e o anuncio", () => {
    const screen = render(
      <Meter value={1500} max={3000} label="Cota" showValue format="currencyShort" />,
    );

    expect(textOf(screen)).toContain("R$ 1,5K");
    expect(textOf(screen)).not.toContain("50%");
    expect(byRole(screen, "text")[0]!.props.accessibilityValue).toEqual({
      min: 0,
      max: 3000,
      now: 1500,
      text: "R$\u00a01,5K",
    });
  });

  test("a funcao propria recebe o valor cru, e o valueLabel ganha dela", () => {
    const own = render(
      <Meter value={8} max={15} label="Disco" showValue format={(value) => `${value} GB`} />,
    );
    expect(textOf(own)).toContain("8 GB");

    const both = render(
      <Meter value={8} max={15} label="Disco" format="integer" valueLabel="8 GB de 15 GB" />,
    );
    expect(byRole(both, "text")[0]!.props.accessibilityValue.text).toBe("8 GB de 15 GB");
  });
});

describe("Progress", () => {
  test("showValue escreve o rotulo e a porcentagem, como o web", () => {
    const screen = render(<Progress value={30} label="Envio" showValue />);

    expect(textOf(screen)).toContain("Envio");
    expect(textOf(screen)).toContain("30%");
    expect(byRole(screen, "progressbar")[0]!.props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 30,
    });
  });

  test("format escreve a tela e o anuncio", () => {
    const screen = render(
      <Progress value={3} label="Notas" showValue format={(value) => `${value} de 10 notas`} />,
    );

    expect(textOf(screen)).toContain("3 de 10 notas");
    expect(byRole(screen, "progressbar")[0]!.props.accessibilityValue.text).toBe(
      "3 de 10 notas",
    );
  });

  test("sem showValue a barra continua sozinha, e o format ainda fala", () => {
    const screen = render(<Progress value={30} label="Envio" format="integer" />);

    expect(textOf(screen)).toBe("");
    expect(byRole(screen, "progressbar")[0]!.props.accessibilityValue.text).toBe("30");
  });
});

describe("Slider", () => {
  test("showValue escreve o rotulo e o valor pelo formatador da casa", () => {
    const screen = render(
      <Slider
        value={1500}
        onValueChange={mock(() => {})}
        max={3000}
        label="Limite"
        showValue
        format="currencyShort"
      />,
    );

    expect(textOf(screen)).toContain("Limite");
    expect(textOf(screen)).toContain("R$ 1,5K");
    expect(byRole(screen, "adjustable")[0]!.props.accessibilityValue).toEqual({
      min: 0,
      max: 3000,
      now: 1500,
      text: "R$\u00a01,5K",
    });
  });

  test("sem format o valor sai com a virgula do pt-BR, e sem showValue nada se escreve", () => {
    const shown = render(
      <Slider value={2.5} onValueChange={mock(() => {})} max={5} step={0.5} label="Nota" showValue />,
    );
    expect(textOf(shown)).toContain("2,5");

    const bare = render(
      <Slider value={2.5} onValueChange={mock(() => {})} max={5} step={0.5} label="Nota" />,
    );
    expect(textOf(bare)).toBe("");
  });
});

describe("Stat", () => {
  test("a variacao sai em percent por padrao, arredondada como no web", () => {
    const screen = render(<Stat label="Faturado" value="R$ 246,7K" delta={12.5} />);

    expect(textOf(screen)).toContain("13%");
    expect(textOf(screen)).not.toContain("12.5");
  });

  test("deltaFormat troca a unidade da variacao, e o sinal fica com a seta", () => {
    const screen = render(
      <Stat label="Custo" value="R$ 9,1K" delta={-2480} deltaFormat="currencyShort" />,
    );

    expect(textOf(screen)).toContain("↘ R$ 2,5K");
    expect(textOf(screen)).not.toContain("%");
  });

  test("delta zero e neutro: sem seta e sem o verde de alta, mesmo invertido", () => {
    for (const invert of [false, true]) {
      const screen = render(<Stat label="Faturado" value="R$ 246,7K" delta={0} invert={invert} />);
      expect(textOf(screen)).toContain("0%");
      expect(textOf(screen)).not.toMatch(/[↗↘]/);
      const [line] = byClass(screen, /\btext-xs\b/);
      const tokens = String(line!.props.className).split(" ");
      expect(tokens).toContain("text-fg-muted");
      expect(tokens).not.toContain("text-success-text");
      expect(tokens).not.toContain("text-danger-text");
    }
  });
});
