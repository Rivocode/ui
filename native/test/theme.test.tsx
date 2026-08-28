import { describe, expect, spyOn, test } from "bun:test";

import { tokens } from "../tokens";
import { render, byClass, byType, paintedColor, variableDeclarations } from "./helpers";
import { declaredColor } from "./css-compilado";
import { Button } from "../src/button";
import { Switch } from "../src/switch";
import { ChartContainer } from "../src/chart/chart";
import { useRivo, type RivoNativeColors } from "../src";

const ROLES = Object.keys(tokens.themes["rivocode-dark"]) as (keyof RivoNativeColors)[];

const fromCss = (role: string, scheme: "light" | "dark") =>
  declaredColor([`bg-${role}`], "background-color", scheme);

function warned(run: () => void): string[] {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  try {
    run();
    return warn.mock.calls.map((call) => String(call[0]));
  } finally {
    warn.mockRestore();
  }
}

let seen: RivoNativeColors;

function Probe() {
  seen = useRivo().colors;
  return null;
}

describe("a cor que a peça lê sai do CSS compilado", () => {
  test("os 45 papéis chegam ao contexto, e nenhum chega vazio", () => {
    render(<Probe />, { theme: "rivocode-dark" });

    expect(Object.keys(seen).length).toBe(45);
    expect(ROLES.filter((role) => typeof seen[role] !== "string" || seen[role] === "")).toEqual([]);
  });

  test("cada papel é a cor que a classe bg- pinta, no claro e no escuro", () => {
    for (const scheme of ["light", "dark"] as const) {
      render(<Probe />, { theme: scheme === "light" ? "rivocode-light" : "rivocode-dark" });

      const divergent = ROLES.filter((role) => seen[role] !== fromCss(role, scheme));
      expect(divergent, `papéis fora do CSS compilado no ${scheme}`).toEqual([]);
    }
  });

  test("o fundo da tela segue o esquema, claro #fbfbfa e escuro #0b0d0f", () => {
    const claro = render(<Button>Emitir</Button>, { theme: "rivocode-light" });
    const escuro = render(<Button>Emitir</Button>, { theme: "rivocode-dark" });

    expect(paintedColor(byClass(claro, /\bbg-bg\b/)[0]!, "background-color", "light")).toBe(
      "#fbfbfa",
    );
    expect(paintedColor(byClass(escuro, /\bbg-bg\b/)[0]!, "background-color", "dark")).toBe(
      "#0b0d0f",
    );
  });

  test("os oito chart-* têm classe emitida: sem ela o gráfico lia undefined", () => {
    const painted = ROLES.filter((role) => role.startsWith("chart-")).map((role) =>
      fromCss(role, "dark"),
    );

    expect(painted.length).toBe(8);
    expect(painted.filter((color) => color === undefined)).toEqual([]);
  });
});

describe("o gráfico e o botão saem do mesmo tema, na mesma tela", () => {
  const paint = (scheme: "light" | "dark") => {
    let series: Record<string, string> = {};
    const screen = render(
      <>
        <Button>Emitir</Button>
        <Switch checked onCheckedChange={() => {}} />
        <ChartContainer config={{ pagas: { label: "Pagas" } }} data={[1]}>
          {(frame) => {
            series = frame.colors;
            return null;
          }}
        </ChartContainer>
      </>,
      { theme: scheme === "light" ? "rivocode-light" : "rivocode-dark" },
    );

    return {
      button: paintedColor(byClass(screen, /\bbg-accent\b/)[0]!, "background-color", scheme),
      track: byType(screen, "Switch")[0]!.props.trackColor.true as string,
      slice: series.pagas,
    };
  };

  for (const scheme of ["light", "dark"] as const) {
    test(`no ${scheme}: fatia, trilho e fundo do botão são a cor da classe`, () => {
      const { button, track, slice } = paint(scheme);

      expect(button).toBe(fromCss("accent", scheme));
      expect(track).toBe(fromCss("accent-text", scheme));
      expect(slice).toBe(fromCss("chart-1", scheme));
    });
  }
});

describe("tema de cliente: o caminho é o CSS do app, e não uma prop", () => {
  test("o fundo do Button e a cor que ele lê do contexto são a MESMA, e é a do CSS", () => {
    const screen = render(
      <>
        <Button>Emitir</Button>
        <Probe />
      </>,
      { theme: "rivocode-light" },
    );
    const painted = paintedColor(
      byClass(screen, /\bbg-accent\b/)[0]!,
      "background-color",
      "light",
    );

    expect(painted).toBe(fromCss("accent", "light"));
    expect(seen.accent).toBe(painted);
  });

  test("o giro do Button sai no contraste do CSS", () => {
    const screen = render(<Button loading>Emitindo</Button>, { theme: "rivocode-light" });
    const spinner = byType(screen, "ActivityIndicator")[0]!;

    expect(spinner.props.color).toBe(fromCss("accent-fg", "light"));
  });

  test("nada é embrulhado: o VariableContextProvider saiu junto com o mapa", () => {
    const screen = render(<Button>Emitir</Button>, { theme: "rivocode-light" });

    expect(byType(screen, "VariableContextProvider").length).toBe(0);
  });

  test("a causa: cada --color-* é declarado uma vez só, e o inliner do react-native-css crava o valor dentro da classe", () => {
    const declared = variableDeclarations();
    const roles = ROLES.map((role) => `--color-${role}`).filter((name) => declared.has(name));
    const alive = roles.filter((name) => declared.get(name) !== 1);

    expect(declared.get("--color-accent")).toBe(1);
    expect(roles.length).toBeGreaterThan(20);
    expect(alive).toEqual([]);
  });

  test("montar com o tema de casa não emite aviso nenhum", () => {
    expect(warned(() => render(<Button>Emitir</Button>, { theme: "rivocode-light" }))).toEqual([]);
  });
});
