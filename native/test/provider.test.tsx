import { describe, expect, test } from "bun:test";
import { Appearance, Text } from "react-native";

import { Field, Input, useRivo } from "../src";
import { tokens } from "../tokens";
import { render, renderError, textOf } from "./helpers";

describe("RivoProvider", () => {
  test("useRivo fora do provider explica o que faltou", () => {
    function Orphan() {
      useRivo();
      return null;
    }
    expect(renderError(<Orphan />)).toContain("RivoProvider");
  });

  test("a prop theme vira o esquema de cor do aparelho", () => {
    // É este set que reavalia todo light-dark() compilado nas classes.
    render(<Text>x</Text>, { theme: "rivocode-light" });
    expect(Appearance.getColorScheme()).toBe("light");

    render(<Text>x</Text>, { theme: "rivocode-dark" });
    expect(Appearance.getColorScheme()).toBe("dark");

    render(<Text>x</Text>, { theme: "system" });
    // "unspecified" devolve a decisão ao aparelho: o dublê registra null.
    expect(Appearance.getColorScheme()).toBe(null);
  });

  test("quem lê cor por fora das classes recebe o tema resolvido", () => {
    function Probe() {
      const { theme } = useRivo();
      return <Text>{theme}</Text>;
    }
    expect(textOf(render(<Probe />, { theme: "rivocode-light" }))).toContain("rivocode-light");
    // system resolve pelo aparelho; o dublê responde dark por padrão.
    render(<Text>x</Text>, { theme: "rivocode-dark" });
    expect(textOf(render(<Probe />, { theme: "system" }))).toContain("rivocode-dark");
  });
});

describe("Field e Input", () => {
  test("o erro vence a descrição, como no web", () => {
    const both = render(
      <Field label="CNPJ" description="A máscara é do campo." error="CNPJ inválido">
        <Input />
      </Field>,
    );
    expect(textOf(both)).toContain("CNPJ inválido");
    expect(textOf(both)).not.toContain("A máscara é do campo.");
  });

  test("o placeholder lê com a cor do tema em vigor", () => {
    const screen = render(
      <Field label="x">
        <Input placeholder="00.000.000/0000-00" />
      </Field>,
      { theme: "rivocode-light" },
    );
    const input = screen.root.findByType("TextInput" as never);
    expect(input.props.placeholderTextColor).toBe(tokens.themes["rivocode-light"]["fg-subtle"]);
  });

  test("a borda acende no foco e o invalid vence o foco", () => {
    const screen = render(
      <Field label="x">
        <Input />
      </Field>,
    );
    const input = () => screen.root.findByType("TextInput" as never);
    expect(input().props.className).toContain("border-border-strong");

    const { act } = require("react-test-renderer") as typeof import("react-test-renderer");
    act(() => input().props.onFocus({}));
    expect(input().props.className).toContain("border-accent");

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
