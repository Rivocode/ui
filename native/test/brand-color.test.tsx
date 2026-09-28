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

test("a key the config knows returns the color and flags nothing", () => {
  const { color, said } = asked("emitidas");

  expect(color).toBe(dark["chart-1"]);
  expect(said).not.toContain("does not know that series");
});

test("a key the config does not have is flagged, named, with the valid ones beside it", () => {
  const { color, said } = asked("canceladas");

  expect(color).toBeUndefined();
  expect(said).toContain('"canceladas"');
  expect(said).toContain("emitidas, pagas");
});

test("the same wrong key is flagged only once, not on every frame", () => {
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
      .filter((line) => String(line).includes("does not know that series"));
    expect(repeats).toHaveLength(1);
  } finally {
    warn.mockRestore();
  }
});

test("the complaint names the missing key and lists the ones that exist", () => {
  const wording = unknownSeriesComplaint("canceladas", ["emitidas", "pagas"]);

  expect(wording).toContain('"canceladas"');
  expect(wording).toContain("emitidas, pagas");
});
