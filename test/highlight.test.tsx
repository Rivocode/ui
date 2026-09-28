import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Highlight } from "../src/components/highlight";
import { compose, contrastRatio, readTokens } from "../src/lib/contrast";
import { splitHighlight } from "../src/shared/highlight";

const marks = (container: HTMLElement) =>
  [...container.querySelectorAll("mark")].map((mark) => mark.textContent);

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

test("an unaccented term finds the accented stretch, and the highlight returns the original text", () => {
  const { container } = render(<Highlight query="sao">Clínica São Lucas</Highlight>);

  expect(marks(container)).toEqual(["São"]);
  expect(container.textContent).toBe("Clínica São Lucas");
});

test("an accented term finds the unaccented text, and case does not matter", () => {
  const { container } = render(<Highlight query="JOÃO">joao pessoa, JOAO e João</Highlight>);

  expect(marks(container)).toEqual(["joao", "JOAO", "João"]);
});

test("several terms highlight each one, and the ones that touch become a single stretch", () => {
  const { container } = render(
    <Highlight query={["nota", "fiscal", "cancel"]}>Nota fiscal cancelada, nota paga</Highlight>,
  );

  expect(marks(container)).toEqual(["Nota", "fiscal", "cancel", "nota"]);

  const joined = render(<Highlight query={["mar", "arco"]}>Recebido em março</Highlight>);
  expect(marks(joined.container)).toEqual(["marco".replace("c", "ç")]);
});

test("an empty or whitespace-only term highlights nothing, and does not drop the text", () => {
  for (const query of ["", "   ", [] as string[], ["", " "]]) {
    const { container, unmount } = render(<Highlight query={query}>Recife</Highlight>);
    expect(container.querySelectorAll("mark")).toHaveLength(0);
    expect(container.textContent).toBe("Recife");
    unmount();
  }
});

test("with no occurrence, the text comes out whole and without a mark", () => {
  const { container } = render(<Highlight query="manaus">Natal e Fortaleza</Highlight>);

  expect(container.querySelectorAll("mark")).toHaveLength(0);
  expect(container.textContent).toBe("Natal e Fortaleza");
});

test("an accent written in two code points stays inside the highlight, and not loose after it", () => {
  const decomposed = "São Paulo";
  const { container } = render(<Highlight query="sao">{decomposed}</Highlight>);

  expect(marks(container)).toEqual(["São"]);
  expect(container.textContent).toBe(decomposed);
});

test("the mark paints on the full warning fill with its own ink, and not on the subtle fill", () => {
  const { container } = render(
    <Highlight query="pix" classNames={{ mark: "rc-mark" }} className="rc-root">
      Pague por Pix
    </Highlight>,
  );
  const mark = container.querySelector("mark")!;

  expect(tokens(mark)).toContain("bg-warning");
  expect(tokens(mark)).toContain("text-warning-fg");
  expect(tokens(mark)).not.toContain("bg-warning-subtle");
  expect(tokens(mark)).not.toContain("text-fg");
  expect(tokens(mark)).toContain("rc-mark");
  expect(tokens(container.firstElementChild!)).toContain("rc-root");
});

test("the mark fill stands out from the surrounding background and its ink reads on it, in both themes", async () => {
  const { container } = render(<Highlight query="pix">Pague por Pix</Highlight>);
  const classes = tokens(container.querySelector("mark")!);
  const fill = classes.find((name) => name.startsWith("bg-"))!.slice(3);
  const ink = classes.find((name) => /^text-(fg|warning-fg|accent-fg)/.test(name))!.slice(5);
  const palette = await Bun.file("src/tokens/palette.css").text();
  const measured: number[] = [];

  for (const theme of ["rivocode-light", "rivocode-dark"]) {
    const css = await Bun.file(`src/tokens/themes/${theme}.css`).text();
    const colors = readTokens(`${palette}\n${css}`);
    for (const around of ["bg", "surface", "surface-raised"]) {
      const under = colors[`--rc-${around}`]!;
      const paint = compose(colors[`--rc-${fill}`]!, under);
      measured.push(contrastRatio(paint, under));
      expect(contrastRatio(paint, under)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(colors[`--rc-${ink}`]!, paint)).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(measured).toHaveLength(6);
});

test("the pure function splits on the original text, with overlaps merged", () => {
  expect(splitHighlight("Ação e acao", "acao")).toEqual([
    { text: "Ação", match: true },
    { text: " e ", match: false },
    { text: "acao", match: true },
  ]);
  expect(splitHighlight("aaaa", ["aa", "aaa"])).toEqual([{ text: "aaaa", match: true }]);
  expect(splitHighlight("", "x")).toEqual([]);
});
