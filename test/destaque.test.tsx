import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Highlight } from "../src/components/highlight";
import { compose, contrastRatio, readTokens } from "../src/lib/contrast";
import { splitHighlight } from "../src/shared/highlight";

const marks = (container: HTMLElement) =>
  [...container.querySelectorAll("mark")].map((mark) => mark.textContent);

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

test("o termo sem acento acha o trecho acentuado, e o destaque devolve o texto original", () => {
  const { container } = render(<Highlight query="sao">Clínica São Lucas</Highlight>);

  expect(marks(container)).toEqual(["São"]);
  expect(container.textContent).toBe("Clínica São Lucas");
});

test("o termo acentuado acha o texto sem acento, e a caixa nao importa", () => {
  const { container } = render(<Highlight query="JOÃO">joao pessoa, JOAO e João</Highlight>);

  expect(marks(container)).toEqual(["joao", "JOAO", "João"]);
});

test("varios termos destacam cada um, e os que se encostam viram um trecho so", () => {
  const { container } = render(
    <Highlight query={["nota", "fiscal", "cancel"]}>Nota fiscal cancelada, nota paga</Highlight>,
  );

  expect(marks(container)).toEqual(["Nota", "fiscal", "cancel", "nota"]);

  const joined = render(<Highlight query={["mar", "arco"]}>Recebido em março</Highlight>);
  expect(marks(joined.container)).toEqual(["marco".replace("c", "ç")]);
});

test("termo vazio ou so de espaco nao destaca nada, e nao some com o texto", () => {
  for (const query of ["", "   ", [] as string[], ["", " "]]) {
    const { container, unmount } = render(<Highlight query={query}>Recife</Highlight>);
    expect(container.querySelectorAll("mark")).toHaveLength(0);
    expect(container.textContent).toBe("Recife");
    unmount();
  }
});

test("sem ocorrencia, o texto sai inteiro e sem mark", () => {
  const { container } = render(<Highlight query="manaus">Natal e Fortaleza</Highlight>);

  expect(container.querySelectorAll("mark")).toHaveLength(0);
  expect(container.textContent).toBe("Natal e Fortaleza");
});

test("o acento escrito em duas partes fica dentro do destaque, e nao solto depois dele", () => {
  const decomposed = "São Paulo";
  const { container } = render(<Highlight query="sao">{decomposed}</Highlight>);

  expect(marks(container)).toEqual(["São"]);
  expect(container.textContent).toBe(decomposed);
});

test("o mark se pinta no fundo cheio de atencao com a tinta dele, e nao no fundo sutil", () => {
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

test("o fundo do mark se distingue do fundo em volta e a tinta se le sobre ele, nos dois temas", async () => {
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

test("a conta pura corta pelo texto original, com a sobreposicao fundida", () => {
  expect(splitHighlight("Ação e acao", "acao")).toEqual([
    { text: "Ação", match: true },
    { text: " e ", match: false },
    { text: "acao", match: true },
  ]);
  expect(splitHighlight("aaaa", ["aa", "aaa"])).toEqual([{ text: "aaaa", match: true }]);
  expect(splitHighlight("", "x")).toEqual([]);
});
