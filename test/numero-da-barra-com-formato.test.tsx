import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Meter } from "../src/components/meter";
import { Progress } from "../src/components/progress";

function read(ui: React.ReactElement) {
  const { container } = render(ui);
  const root = container.querySelector("[aria-valuetext], [role=progressbar], [role=meter]")!;
  const indicator = container.querySelector<HTMLElement>("[style*='width']");
  return {
    text: container.textContent ?? "",
    spoken: root.getAttribute("aria-valuetext"),
    width: indicator?.style.width,
  };
}

test("o progresso indeterminado com format nao escreve NaN nem na tela nem no leitor de tela", () => {
  for (const value of [null, undefined as unknown as null, Number.NaN]) {
    const { text, spoken } = read(
      <Progress value={value} showValue format="percent" label="Enviando" />,
    );
    expect(text).not.toContain("NaN");
    expect(spoken ?? "").not.toContain("NaN");
    expect(spoken).toBe("indeterminate progress");
  }
});

test("o progresso acima do maximo com format escreve o maximo, igual a barra", () => {
  const { text, spoken, width } = read(
    <Progress value={150} showValue format="percent" label="Enviando" />,
  );
  expect(width).toBe("100%");
  expect(text).toContain("100%");
  expect(text).not.toContain("150");
  expect(spoken).toBe("100%");
});

test("o medidor abaixo do minimo com format escreve o minimo, e acima do maximo escreve o maximo", () => {
  const below = read(<Meter value={-20} showValue format="integer" label="Cota" />);
  expect(below.text).not.toContain("-20");
  expect(below.spoken).toBe("0");

  const above = read(<Meter value={150} showValue format="percent" label="Cota" />);
  expect(above.text).toContain("100%");
  expect(above.spoken).toBe("100%");
});

test("dentro da faixa o format continua escrevendo o valor", () => {
  expect(read(<Progress value={42} showValue format="percent" label="Enviando" />).spoken).toBe(
    "42%",
  );
  expect(
    read(<Meter value={7} min={0} max={10} showValue format="integer" label="Cota" />).spoken,
  ).toBe("7");
});
