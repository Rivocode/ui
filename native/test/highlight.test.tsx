import { describe, expect, test } from "bun:test";

import { Highlight } from "../src";
import { byClass, render, textOf } from "./helpers";

const MARK = /(^| )bg-warning( |$)/;

const marks = (screen: ReturnType<typeof render>) =>
  byClass(screen, MARK).map((node) => node.props.children);

describe("Highlight", () => {
  test("o termo sem acento acha o trecho acentuado, e o texto sai inteiro", () => {
    const screen = render(<Highlight query="sao">Clínica São Lucas</Highlight>);

    expect(marks(screen)).toEqual(["São"]);
    expect(textOf(screen)).toBe("Clínica São Lucas");
  });

  test("varios termos, e caixa nao importa", () => {
    const screen = render(
      <Highlight query={["NOTA", "paga"]}>Nota fiscal cancelada, nota paga</Highlight>,
    );

    expect(marks(screen)).toEqual(["Nota", "nota", "paga"]);
  });

  test("termo vazio nao destaca nada", () => {
    const screen = render(<Highlight query="  ">Recife</Highlight>);

    expect(marks(screen)).toEqual([]);
    expect(textOf(screen)).toBe("Recife");
  });

  test("o trecho achado veste o fundo cheio de atencao com a tinta dele, e nao o fundo sutil", () => {
    const screen = render(
      <Highlight query="pix" classNames={{ mark: "rc-mark" }} tone="muted">
        Pague por Pix
      </Highlight>,
    );
    const [mark] = byClass(screen, MARK);
    const classes = String(mark!.props.className).split(" ");

    expect(classes).toContain("bg-warning");
    expect(classes).toContain("text-warning-fg");
    expect(classes).not.toContain("bg-warning-subtle");
    expect(classes).not.toContain("text-fg");
    expect(classes).not.toContain("text-fg-muted");
    expect(classes).toContain("rc-mark");
  });
});
