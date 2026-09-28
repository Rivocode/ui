import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Button, IconButton } from "../src";
import { byRole, byType, paintedColor, render } from "./helpers";

type Catalog = Record<string, { props: { name: string; type: string }[] }>;

const read = (file: string): Catalog =>
  JSON.parse(readFileSync(join(import.meta.dir, "../../apps/docs/src", file), "utf8"));

const literals = (catalog: Catalog, piece: string, prop: string) => {
  const found = catalog[piece]?.props.find((entry) => entry.name === prop);
  expect(found).toBeDefined();
  return found!.type
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part !== "null")
    .sort();
};

const classesOf = (node: { props: { className?: string } }) =>
  (node.props.className ?? "").split(" ");

describe("the variant vocabulary is the web's", () => {
  const web = read("component-props.json");
  const native = read("native-props.json");

  test.each([
    ["Button", "variant"],
    ["IconButton", "variant"],
    ["Badge", "tone"],
    ["Alert", "tone"],
  ])("%s.%s e uniao fechada, com os mesmos literais do web", (piece, prop) => {
    const nativeSide = literals(native, piece, prop);
    expect(nativeSide).not.toContain("string");
    expect(nativeSide.length).toBeGreaterThan(3);
    expect(nativeSide).toEqual(literals(web, piece, prop));
  });

  test("IconButton is named through label, the same name as the web", () => {
    const names = (catalog: Catalog) =>
      catalog.IconButton?.props.map((entry) => entry.name) ?? [];
    expect(names(web)).toContain("label");
    expect(names(native)).toContain("label");
  });
});

describe("outline", () => {
  test("the outline Button is only the thick border, without background, with the label in fg", () => {
    const screen = render(<Button variant="outline">Exportar</Button>);
    const box = classesOf(byRole(screen, "button")[0]!);
    const label = classesOf(byType(screen, "Text")[0]!);

    expect(box).toContain("border-2");
    expect(box).toContain("border-border-strong");
    expect(box.some((token) => token.startsWith("bg-"))).toBe(false);
    expect(label).toContain("text-fg");
    expect(label).not.toContain("text-fg-muted");
  });

  test("the outline border paints in both themes", () => {
    const [button] = byRole(render(<Button variant="outline">Exportar</Button>), "button");
    expect(paintedColor(button!, "border-color", "light")).toBeDefined();
    expect(paintedColor(button!, "border-color", "dark")).toBeDefined();
  });

  test("the outline IconButton wears the same classes as Button", () => {
    const icon = classesOf(
      byRole(
        render(
          <IconButton label="Atualizar" variant="outline">
            {null}
          </IconButton>,
        ),
        "button",
      )[0]!,
    );
    expect(icon).toContain("border-2");
    expect(icon).toContain("border-border-strong");
  });

  test("the outline icon paints in fg, like secondary, and not in ghost's fg-muted", () => {
    const colorOf = (variant: "outline" | "secondary" | "ghost") => {
      const seen: string[] = [];
      render(
        <IconButton label="Atualizar" variant={variant}>
          {({ color }) => {
            seen.push(color);
            return null;
          }}
        </IconButton>,
      );
      return seen[0];
    };
    expect(colorOf("outline")).toBeDefined();
    expect(colorOf("outline")).toBe(colorOf("secondary"));
    expect(colorOf("outline")).not.toBe(colorOf("ghost"));
  });
});
