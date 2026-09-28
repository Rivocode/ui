import { describe, expect, spyOn, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { Card, CardTitle } from "../src/card";
import { Code } from "../src/code";
import { mono, systemFonts, useRivoFonts } from "../src/font";
import { Text } from "../src/text";
import { render, textOf } from "./helpers";

function familyOf(node: ReactTestInstance): unknown {
  for (const layer of [node.props?.style].flat(3)) {
    const family = (layer as { fontFamily?: unknown } | null | undefined)?.fontFamily;
    if (family !== undefined) return family;
  }
  return undefined;
}

function families(screen: ReactTestRenderer): unknown[] {
  return screen.root.findAll((node) => node.type === "Text").map((node) => familyOf(node));
}

const BRAND = { sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" };

function warned(run: () => void): string[] {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  try {
    run();
    return warn.mock.calls.map((call) => String(call[0]));
  } finally {
    warn.mockRestore();
  }
}

describe("the font the app declares", () => {
  test("without `fonts`, body text comes out in the system font and mono in the device's", () => {
    expect(systemFonts.sans).toBeUndefined();
    expect(systemFonts.display).toBeUndefined();

    expect(families(render(<Text>Nota emitida</Text>))).toEqual([undefined]);
    expect(families(render(<Code>app.json</Code>))).toEqual([mono]);
  });

  test("declared once, it dresses body, heading and fixed width", () => {
    expect(families(render(<Text>Nota emitida</Text>, { fonts: BRAND }))).toEqual(["Manrope"]);
    expect(families(render(<Code>app.json</Code>, { fonts: BRAND }))).toEqual(["JetBrainsMono"]);

    const card = render(
      <Card>
        <CardTitle>Faturamento</CardTitle>
      </Card>,
      { fonts: BRAND },
    );

    expect(families(card)).toEqual(["Poppins"]);
  });

  test("the heading falls back to `sans` when the app loaded only one family", () => {
    const card = render(
      <Card>
        <CardTitle>Faturamento</CardTitle>
      </Card>,
      { fonts: { sans: "Manrope" } },
    );

    expect(families(card)).toEqual(["Manrope"]);
  });

  test("declaring only `sans` does not take mono away from whoever needs it", () => {
    expect(families(render(<Code>app.json</Code>, { fonts: { sans: "Manrope" } }))).toEqual([mono]);
  });

  test("the caller's style keeps winning, with the provider's underneath", () => {
    const screen = render(<Text style={{ fontFamily: "Courier New" }}>emitida_em</Text>, {
      fonts: BRAND,
    });
    const node = screen.root.findAll((item) => item.type === "Text")[0]!;

    expect([node.props.style].flat(3).at(-1)).toEqual({ fontFamily: "Courier New" });
  });

  test("outside the provider, the hook returns the system one instead of blowing up", () => {
    function Probe() {
      return <Text>{String(useRivoFonts().sans)}</Text>;
    }

    const screen = render(<Probe />);
    expect(textOf(screen)).toBe("undefined");
  });
});

describe("the wrong font name", () => {
  test("a CSS stack is flagged, and does not silently come out in the system font", () => {
    const [message] = warned(() =>
      render(<Text>Nota</Text>, { fonts: { sans: "Manrope, system-ui, sans-serif" } }),
    );

    expect(message).toContain("[rivocode/ui-native]");
    expect(message).toContain("sans");
    expect(message).toContain("Manrope, system-ui, sans-serif");
  });

  test("the CSS generic family is flagged - it is what brought mono down", () => {
    const [message] = warned(() => render(<Text>Nota</Text>, { fonts: { mono: "ui-monospace" } }));

    expect(message).toContain("ui-monospace");
    expect(message).toContain("generic");
  });

  test("quotes, a CSS variable and an empty name all come out in the same warning", () => {
    const [message] = warned(() =>
      render(<Text>Nota</Text>, {
        fonts: { sans: '"Manrope"', display: "var(--rc-font-display)", mono: "  " },
      }),
    );

    expect(message).toContain("quotes");
    expect(message).toContain("CSS variable");
    expect(message).toContain("arrived empty");
  });

  test("`monospace` only applies on Android, and the double answers iOS", () => {
    const [message] = warned(() => render(<Text>Nota</Text>, { fonts: { mono: "monospace" } }));

    expect(message).toContain("Android");
  });

  test("with expo-font's `isLoaded`, a family that did not reach the device is named", () => {
    const loaded = new Set(["Manrope"]);
    const [message] = warned(() =>
      render(<Text>Nota</Text>, {
        fonts: BRAND,
        isFontLoaded: (family) => loaded.has(family),
      }),
    );

    expect(message).toContain("Poppins");
    expect(message).toContain("JetBrainsMono");
    expect(message).not.toContain('"Manrope" não');
  });

  test("a real, loaded name yields no warning at all", () => {
    const messages = warned(() =>
      render(<Text>Nota</Text>, { fonts: BRAND, isFontLoaded: () => true }),
    );

    expect(messages).toEqual([]);
  });
});
