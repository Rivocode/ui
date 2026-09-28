import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";
import { Platform } from "react-native";

import { tokens } from "../tokens";
import { byClass, byType, paintedColor, render } from "./helpers";
import { compiledCss, dressCompiledCss } from "./compiled-css";
import { useRivo, type RivoNativeColors } from "../src";

mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
    Text: host("SvgText"),
  };
});

const { Button } = await import("../src/button");
const { Switch } = await import("../src/switch");
const { ChartDonut } = await import("../src/chart/chart-donut");

const ACME = {
  accent: "#1b57ff",
  "accent-fg": "#ffffff",
  "accent-text": "#1b57ff",
  "chart-1": "#1b57ff",
} as const;

function dressRoles(roles: Record<string, string>) {
  const dressed = Object.entries(roles).reduce(
    (css, [role, color]) => css.replace(new RegExp(`(--color-${role}):[^;]+;`), `$1: ${color};`),
    compiledCss(),
  );
  dressCompiledCss(dressed);
}

afterEach(() => dressCompiledCss(undefined));

let seen: RivoNativeColors;

function Probe() {
  seen = useRivo().colors;
  return null;
}

const SLICES = [
  { natureza: "servico", total: 60 },
  { natureza: "produto", total: 40 },
];

describe("the client dresses the roles in the app CSS, and the whole screen follows", () => {
  test("Button, Switch and ChartDonut all come out in the client's accent", () => {
    dressRoles(ACME);

    const screen = render(
      <>
        <Probe />
        <Button loading>Emitir</Button>
        <Switch label="Ativo" checked onCheckedChange={() => {}} />
        <ChartDonut data={SLICES} valueKey="total" nameKey="natureza" legend={false} />
      </>,
      { theme: "rivocode-dark" },
    );

    const button = paintedColor(byClass(screen, /\bbg-accent\b/)[0]!, "background-color", "dark");
    const spinner = byType(screen, "ActivityIndicator")[0]!.props.color;
    const track = byType(screen, "Switch")[0]!.props.trackColor.true;
    const slice = byType(screen, "Path")[0]!.props.stroke;

    expect(button).toBe(ACME.accent);
    expect(track).toBe(ACME["accent-text"]);
    expect(slice).toBe(ACME["chart-1"]);
    expect(spinner).toBe(ACME["accent-fg"]);
    expect(seen.accent).toBe(ACME.accent);
  });

  test("a role the client did not dress stays in the house color", () => {
    dressRoles(ACME);
    render(<Probe />, { theme: "rivocode-dark" });

    expect(seen.bg).toBe(tokens.themes["rivocode-dark"].bg);
  });

  test("with no override at all, the accent goes back to the house lime", () => {
    render(<Probe />, { theme: "rivocode-dark" });

    expect(seen.accent).toBe(tokens.themes["rivocode-dark"].accent);
  });
});

describe("on react-native-web the color comes from the document, not from useCssElement", () => {
  const dressDocument = () => {
    const sheet = document.createElement("style");
    sheet.textContent =
      ":root { --color-accent: #1b57ff; }" +
      ".bg-accent { background-color: var(--color-accent); }" +
      ".bg-chart-1 { background-color: #1b57ff; }";
    document.head.appendChild(sheet);
    return () => sheet.remove();
  };

  const onWeb = <T,>(body: () => T): T => {
    const kept = Platform.OS;
    const undress = dressDocument();
    (Platform as { OS: string }).OS = "web";
    try {
      return body();
    } finally {
      (Platform as { OS: string }).OS = kept;
      undress();
    }
  };

  test("a role the document paints comes from getComputedStyle; the rest falls back to the token", () => {
    onWeb(() => {
      render(<Probe />, { theme: "rivocode-dark" });

      expect(["#1b57ff", "rgb(27, 87, 255)"]).toContain(seen.accent);
      expect(["#1b57ff", "rgb(27, 87, 255)"]).toContain(seen["chart-1"]);
      expect(seen.bg).toBe(tokens.themes["rivocode-dark"].bg);
    });
  });
});
