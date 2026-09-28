import { describe, expect, test } from "bun:test";
import { Appearance, Text } from "react-native";

import { Field, Input, useRivo } from "../src";
import { tokens } from "../tokens";
import { render, renderError, textOf } from "./helpers";

describe("RivoProvider", () => {
  test("useRivo outside the provider explains what was missing", () => {
    function Orphan() {
      useRivo();
      return null;
    }
    expect(renderError(<Orphan />)).toContain("RivoProvider");
  });

  test("the theme prop becomes the device color scheme", () => {
    // It is this set that re-evaluates every light-dark() compiled into the classes.
    render(<Text>x</Text>, { theme: "rivocode-light" });
    expect(Appearance.getColorScheme()).toBe("light");

    render(<Text>x</Text>, { theme: "rivocode-dark" });
    expect(Appearance.getColorScheme()).toBe("dark");

    render(<Text>x</Text>, { theme: "system" });
    // "unspecified" hands the decision back to the device: the double records null.
    expect(Appearance.getColorScheme()).toBe(null);
  });

  test("there is no density: touch targets do not shrink, and the context carries no scale at all", () => {
    function Probe() {
      return <Text>{Object.keys(useRivo()).sort().join(",")}</Text>;
    }
    expect(textOf(render(<Probe />)).trim()).toBe("colors,theme");
  });

  test("whoever reads color outside the classes gets the resolved theme", () => {
    function Probe() {
      const { theme } = useRivo();
      return <Text>{theme}</Text>;
    }
    expect(textOf(render(<Probe />, { theme: "rivocode-light" }))).toContain("rivocode-light");
    // system resolves through the device; the double answers dark by default.
    render(<Text>x</Text>, { theme: "rivocode-dark" });
    expect(textOf(render(<Probe />, { theme: "system" }))).toContain("rivocode-dark");
  });
});

describe("Field and Input", () => {
  test("the error wins over the description, as on the web", () => {
    const both = render(
      <Field label="CNPJ" description="A máscara é do campo." error="CNPJ inválido">
        <Input />
      </Field>,
    );
    expect(textOf(both)).toContain("CNPJ inválido");
    expect(textOf(both)).not.toContain("A máscara é do campo.");
  });

  test("the placeholder reads with the current theme's color", () => {
    const screen = render(
      <Field label="x">
        <Input placeholder="00.000.000/0000-00" />
      </Field>,
      { theme: "rivocode-light" },
    );
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.placeholderTextColor).toBe(tokens.themes["rivocode-light"]["fg-subtle"]);
  });

  test("the border lights up on focus and invalid wins over focus", () => {
    const screen = render(
      <Field label="x">
        <Input />
      </Field>,
    );
    const input = () => screen.root.findByType("TextInput" as never);
    expect(String(input().props.className).split(" ")).toContain("border-border-strong");

    const { act } = require("react-test-renderer") as typeof import("react-test-renderer");
    act(() => input().props.onFocus({}));
    expect(String(input().props.className).split(" ")).toContain("border-accent");

    const invalid = render(
      <Field label="x">
        <Input invalid />
      </Field>,
    );
    expect(invalid.root.findByType("TextInput" as never).props.className).toContain(
      "border-danger",
    );
  });
});
