import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Highlight } from "../src/components/highlight";
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

test("o mark se pinta no fundo de atencao com a tinta principal, que e o par medido", () => {
  const { container } = render(
    <Highlight query="pix" classNames={{ mark: "rc-mark" }} className="rc-root">
      Pague por Pix
    </Highlight>,
  );
  const mark = container.querySelector("mark")!;

  expect(tokens(mark)).toContain("bg-warning-subtle");
  expect(tokens(mark)).toContain("text-fg");
  expect(tokens(mark)).not.toContain("text-fg-muted");
  expect(tokens(mark)).toContain("rc-mark");
  expect(tokens(container.firstElementChild!)).toContain("rc-root");
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
