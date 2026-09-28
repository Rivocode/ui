import { describe, expect, test } from "bun:test";

import { Highlight } from "../src";
import { byClass, render, textOf } from "./helpers";

const MARK = /(^| )bg-warning( |$)/;

const marks = (screen: ReturnType<typeof render>) =>
  byClass(screen, MARK).map((node) => node.props.children);

describe("Highlight", () => {
  test("the unaccented term finds the accented stretch, and the text comes out whole", () => {
    const screen = render(<Highlight query="sao">Clínica São Lucas</Highlight>);

    expect(marks(screen)).toEqual(["São"]);
    expect(textOf(screen)).toBe("Clínica São Lucas");
  });

  test("several terms, and case does not matter", () => {
    const screen = render(
      <Highlight query={["NOTA", "paga"]}>Nota fiscal cancelada, nota paga</Highlight>,
    );

    expect(marks(screen)).toEqual(["Nota", "nota", "paga"]);
  });

  test("an empty term highlights nothing", () => {
    const screen = render(<Highlight query="  ">Recife</Highlight>);

    expect(marks(screen)).toEqual([]);
    expect(textOf(screen)).toBe("Recife");
  });

  test("the found stretch wears the full attention background with its own ink, not the subtle background", () => {
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
