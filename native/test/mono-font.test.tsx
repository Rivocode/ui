import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { Calendar } from "../src/calendar";
import { Code } from "../src/code";
import { ColorPicker } from "../src/color-picker";
import { familyClassesIn, mono } from "../src/font";
import { Timeline } from "../src/timeline";
import { byLabel, render } from "./helpers";

const REFUSAL_REGISTRY = "native/src/font.ts";

const OWN_FAMILY: Record<string, string> = {
  "native/src/chart/signature-pad.tsx":
    "the cursive of the typed name is the consumer's choice, through the `font` prop, and not one of the provider's three roles; the default is a truly installed font, Snell Roundhand on iOS and `cursive` on Android",
};

/*
 * What this suite measures is not the platform, but that the fixed-width
 * typeface reaches the device.
 *
 * The `font-mono` class compiled to `{ fontFamily: "ui-monospace" }` -
 * react-native-css keeps only the first family of the list, and the CSS generic
 * is not installed on any phone. RN, with no matching name, silently falls back
 * to the default typeface: the defect raised no error, did not paint the
 * screen red and survived for months in six pieces.
 *
 * That is why the assertion below is negative before being positive: a real
 * font name, and never the generic one. The double's `Platform` answers a fixed
 * iOS, and the OS choice enters no calculation here.
 */

/** The family left on the node. Code's `style` is an array; the others', an object. */
function familyOf(node: ReactTestInstance): unknown {
  for (const layer of [node.props?.style].flat(3)) {
    const family = (layer as { fontFamily?: unknown } | null | undefined)?.fontFamily;
    if (family !== undefined) return family;
  }
  return undefined;
}

function monoNodes(screen: ReactTestRenderer): ReactTestInstance[] {
  return screen.root.findAll((node) => typeof node.type === "string" && familyOf(node) === mono);
}

describe("the mono font", () => {
  test("is the name of an installed font, and never the CSS generic family", () => {
    expect(mono).not.toBe("ui-monospace");
    expect(["Menlo", "monospace"]).toContain(mono);

    // A single family: RN does not read a fallback list, and the comma would
    // become a whole name no device has.
    expect(mono).not.toContain(",");
  });

  test("Code comes out in the code typeface through style, not through a class", () => {
    const screen = render(<Code>app.json</Code>);
    const [piece] = monoNodes(screen);

    expect(piece).toBeDefined();
    expect(piece!.props.className).not.toContain("font-mono");
    expect(piece!.props.className).toContain("bg-surface-raised");
  });

  test("the consumer's class keeps winning, with the style underneath", () => {
    const screen = render(<Code className="text-danger-text">emitida_em</Code>);
    const [piece] = monoNodes(screen);

    expect(piece!.props.className).toContain("text-danger-text");
    expect(piece!.props.className).not.toContain("text-fg-muted");
  });

  test("a consumer's style wins over the piece's, without losing the rest", () => {
    const screen = render(<Code style={{ fontFamily: "Courier New" }}>app.json</Code>);
    const [piece] = screen.root.findAll(
      (node) => typeof node.type === "string" && node.type === "Text",
    );

    expect(familyOf(piece!)).toBe(mono);
    // The last layer is the consumer's: it is the one RN applies.
    expect([piece!.props.style].flat(3).at(-1)).toEqual({ fontFamily: "Courier New" });
  });

  test("the Timeline stamp aligns by fixed width", () => {
    const screen = render(
      <Timeline items={[{ title: "Nota emitida", at: "12/03 às 14:20", by: "Ana Duarte" }]} />,
    );

    expect(monoNodes(screen).length).toBe(1);
  });

  test("the Calendar's seven weekday initials come out at the same width", () => {
    const screen = render(<Calendar value="2026-08-10" onValueChange={() => {}} />);

    expect(monoNodes(screen).length).toBeGreaterThanOrEqual(7);
  });

  test("the ColorPicker hexadecimal field does not jitter with the typed color", () => {
    const screen = render(<ColorPicker value="#d4f34a" onValueChange={() => {}} />);
    const field = byLabel(screen, "Código hexadecimal da cor")[0]!;

    expect(familyOf(field)).toBe(mono);
    expect(field.props.className).not.toContain("font-mono");
  });

  test("no piece of the native package asks for a font class", async () => {
    const offenders: string[] = [];
    const trees = ["native/src/**/*.{ts,tsx}", "examples/native/**/*.{ts,tsx}"];
    const files: string[] = [];
    for (const tree of trees) {
      for await (const found of new Glob(tree).scan(".")) {
        if (found.includes("node_modules")) continue;
        files.push(found);
      }
    }

    expect(files.length).toBeGreaterThan(60);

    for (const file of files) {
      if (file === REFUSAL_REGISTRY) continue;

      const code = (await Bun.file(file).text())
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      if (/font-(mono|sans|display)/.test(code)) offenders.push(file);
    }

    expect(offenders).toEqual([]);

    expect(familyClassesIn("font-sans font-serif font-mono font-display")).toEqual([
      "font-sans",
      "font-serif",
      "font-mono",
      "font-display",
    ]);
  });

  test("only text.tsx writes fontFamily: the rest asks for the role and the provider answers", async () => {
    const offenders: string[] = [];
    const files = await Array.fromAsync(new Glob("native/src/**/*.{ts,tsx}").scan("."));

    expect(files.length).toBeGreaterThan(60);

    for (const file of files) {
      if (file === "native/src/text.tsx") continue;
      if (file in OWN_FAMILY) continue;

      const code = (await Bun.file(file).text())
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      if (code.includes("fontFamily")) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});
