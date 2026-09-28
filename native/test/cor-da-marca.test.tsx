import { expect, spyOn, test } from "bun:test";

import { tokens } from "../tokens";
import { ChartContainer, unknownSeriesComplaint } from "../src/chart/chart";
import { render } from "./helpers";

const dark = tokens.themes["rivocode-dark"];

const CONFIG = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
} as const;

function asked(key: string): { color: string | undefined; said: string } {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  let color: string | undefined;

  try {
    render(
      <ChartContainer config={CONFIG} data={[1]}>
        {({ colors }) => {
          color = colors[key];
          return null;
        }}
      </ChartContainer>,
    );
    return { color, said: warn.mock.calls.flat().join("\n") };
  } finally {
    warn.mockRestore();
  }
}

test("a chave que o config conhece devolve a cor e nao acusa nada", () => {
  const { color, said } = asked("emitidas");

  expect(color).toBe(dark["chart-1"]);
  expect(said).not.toContain("não conhece essa série");
});

test("a chave que o config nao tem e acusada, nomeada, com as validas ao lado", () => {
  const { color, said } = asked("canceladas");

  expect(color).toBeUndefined();
  expect(said).toContain('"canceladas"');
  expect(said).toContain("emitidas, pagas");
});

test("a mesma chave errada acusa uma vez so, e nao a cada quadro", () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  try {
    render(
      <ChartContainer config={CONFIG} data={[1]}>
        {({ colors }) => {
          void colors.canceladas;
          void colors.canceladas;
          void colors.canceladas;
          return null;
        }}
      </ChartContainer>,
    );

    const repeats = warn.mock.calls
      .flat()
      .filter((line) => String(line).includes("não conhece essa série"));
    expect(repeats).toHaveLength(1);
  } finally {
    warn.mockRestore();
  }
});

test("a reclamacao nomeia a chave que falta e lista as que existem", () => {
  const wording = unknownSeriesComplaint("canceladas", ["emitidas", "pagas"]);

  expect(wording).toContain('"canceladas"');
  expect(wording).toContain("emitidas, pagas");
});
