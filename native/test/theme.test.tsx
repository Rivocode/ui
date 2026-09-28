import { describe, expect, spyOn, test } from "bun:test";

import { tokens } from "../tokens";
import { render, byClass, byType, paintedColor, variableDeclarations } from "./helpers";
import { declaredColor } from "./compiled-css";
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

describe("the color a piece reads comes from the compiled CSS", () => {
  test("the 45 roles reach the context, and none arrives empty", () => {
    render(<Probe />, { theme: "rivocode-dark" });

    expect(Object.keys(seen).length).toBe(45);
    expect(ROLES.filter((role) => typeof seen[role] !== "string" || seen[role] === "")).toEqual([]);
  });

  test("each role is the color the bg- class paints, in light and in dark", () => {
    for (const scheme of ["light", "dark"] as const) {
      render(<Probe />, { theme: scheme === "light" ? "rivocode-light" : "rivocode-dark" });

      const divergent = ROLES.filter((role) => seen[role] !== fromCss(role, scheme));
      expect(divergent, `roles outside the compiled CSS in ${scheme}`).toEqual([]);
    }
  });

  test("the screen background follows the scheme, light #fbfbfa and dark #0b0d0f", () => {
    const claro = render(<Button>Emitir</Button>, { theme: "rivocode-light" });
    const escuro = render(<Button>Emitir</Button>, { theme: "rivocode-dark" });

    expect(paintedColor(byClass(claro, /\bbg-bg\b/)[0]!, "background-color", "light")).toBe(
      "#fbfbfa",
    );
    expect(paintedColor(byClass(escuro, /\bbg-bg\b/)[0]!, "background-color", "dark")).toBe(
      "#0b0d0f",
    );
  });

  test("the eight chart-* have an emitted class: without it the chart read undefined", () => {
    const painted = ROLES.filter((role) => role.startsWith("chart-")).map((role) =>
      fromCss(role, "dark"),
    );

    expect(painted.length).toBe(8);
    expect(painted.filter((color) => color === undefined)).toEqual([]);
  });
});

describe("the chart and the button come from the same theme, on the same screen", () => {
  const paint = (scheme: "light" | "dark") => {
    let series: Record<string, string> = {};
    const screen = render(
      <>
        <Button>Emitir</Button>
        <Switch label="Ativo" checked onCheckedChange={() => {}} />
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
    test(`in ${scheme}: slice, track and button background are the class color`, () => {
      const { button, track, slice } = paint(scheme);

      expect(button).toBe(fromCss("accent", scheme));
      expect(track).toBe(fromCss("accent-text", scheme));
      expect(slice).toBe(fromCss("chart-1", scheme));
    });
  }
});

describe("client theme: the path is the app CSS, not a prop", () => {
  test("the Button background and the color it reads from the context are the SAME, and it is the CSS one", () => {
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

  test("the Button spinner comes out in the CSS contrast", () => {
    const screen = render(<Button loading>Emitindo</Button>, { theme: "rivocode-light" });
    const spinner = byType(screen, "ActivityIndicator")[0]!;

    expect(spinner.props.color).toBe(fromCss("accent-fg", "light"));
  });

  test("nothing is wrapped: VariableContextProvider left together with the map", () => {
    const screen = render(<Button>Emitir</Button>, { theme: "rivocode-light" });

    expect(byType(screen, "VariableContextProvider").length).toBe(0);
  });

  test("the cause: each --color-* is declared only once, and the react-native-css inliner bakes the value into the class", () => {
    const declared = variableDeclarations();
    const roles = ROLES.map((role) => `--color-${role}`).filter((name) => declared.has(name));
    const alive = roles.filter((name) => declared.get(name) !== 1);

    expect(declared.get("--color-accent")).toBe(1);
    expect(roles.length).toBeGreaterThan(20);
    expect(alive).toEqual([]);
  });

  test("mounting with the house theme emits no warning at all", () => {
    expect(warned(() => render(<Button>Emitir</Button>, { theme: "rivocode-light" }))).toEqual([]);
  });
});
