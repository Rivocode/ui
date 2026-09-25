import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Meter } from "../src/components/meter";
import { Progress } from "../src/components/progress";
import { Slider } from "../src/components/slider";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("o medidor com format anuncia o mesmo texto que mostra", () => {
  withTheme(<Meter value={1500} max={3000} aria-label="Gasto" showValue format="currencyShort" />);

  const meter = screen.getByRole("meter");
  expect(meter.getAttribute("aria-valuetext")).toBe("R$ 1,5K");
  expect(meter.textContent).toContain("R$ 1,5K");
});

test("o medidor sem format continua anunciando a porcentagem", () => {
  withTheme(<Meter value={1500} max={3000} aria-label="Gasto" showValue />);

  expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("50%");
});

test("o medidor anuncia o format mesmo sem mostrar o valor", () => {
  withTheme(<Meter value={3} max={10} aria-label="Notas" format={(value) => `${value} de 10`} />);

  expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("3 de 10");
});

test("o getAriaValueText explicito ganha do format no medidor", () => {
  withTheme(
    <Meter
      value={1500}
      max={3000}
      aria-label="Gasto"
      format="currencyShort"
      getAriaValueText={() => "metade do limite"}
    />,
  );

  expect(screen.getByRole("meter").getAttribute("aria-valuetext")).toBe("metade do limite");
});

test("a barra de progresso com format anuncia o mesmo texto que mostra", () => {
  withTheme(
    <Progress value={3} max={10} aria-label="Notas" showValue format={(value) => `${value} de 10 notas`} />,
  );

  expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("3 de 10 notas");
  expect(screen.getByText("3 de 10 notas")).toBeDefined();
});

test("a barra de progresso sem format continua anunciando a porcentagem", () => {
  withTheme(<Progress value={3} max={10} aria-label="Notas" showValue />);

  expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe("30%");
});

test("a barra indeterminada com format continua dizendo que e indeterminada", () => {
  withTheme(<Progress value={null} aria-label="Carregando" format="integer" />);

  expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
    "indeterminate progress",
  );
});

test("o controle deslizante com format anuncia o texto escrito", () => {
  withTheme(<Slider defaultValue={1500} max={3000} label="Teto" showValue format="currencyShort" />);

  const thumb = screen.getByRole("slider");
  expect(thumb.getAttribute("aria-valuetext")).toBe("R$ 1,5K");
});

test("o controle deslizante sem format continua sem texto proprio", () => {
  withTheme(<Slider defaultValue={1500} max={3000} label="Teto" showValue />);

  expect(screen.getByRole("slider").hasAttribute("aria-valuetext")).toBe(false);
});

test("na faixa, cada pino anuncia a propria ponta escrita", () => {
  withTheme(
    <Slider
      defaultValue={[1000, 2000]}
      max={3000}
      thumbLabel={["Minimo", "Maximo"]}
      format="currencyShort"
    />,
  );

  const thumbs = screen.getAllByRole("slider");
  expect(thumbs.length).toBe(2);
  expect(thumbs.map((thumb) => thumb.getAttribute("aria-valuetext"))).toEqual([
    "R$ 1K",
    "R$ 2K",
  ]);
});

test("na faixa sem format, os pinos seguem com o texto de antes", () => {
  withTheme(
    <Slider defaultValue={[1000, 2000]} max={3000} thumbLabel={["Minimo", "Maximo"]} />,
  );

  const thumbs = screen.getAllByRole("slider");
  expect(thumbs.length).toBe(2);
  const spoken = thumbs.map((thumb) => thumb.getAttribute("aria-valuetext") ?? "");
  expect(spoken[0]).toMatch(/^1\D?000 start range$/);
  expect(spoken[1]).toMatch(/^2\D?000 end range$/);
});
