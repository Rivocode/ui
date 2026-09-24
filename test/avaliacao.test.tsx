import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import { useState } from "react";

import { Rating, type RatingProps } from "../src/components/rating";
import { RivoProvider } from "../src/provider/rivo-provider";

function rating(props: Partial<RatingProps> = {}) {
  const onValueChange = mock<(value: number) => void>(() => {});
  const view = render(
    <RivoProvider scope="local">
      <Rating onValueChange={onValueChange} {...props} />
    </RivoProvider>,
  );
  return { ...view, onValueChange };
}

function Controlled(props: Partial<RatingProps>) {
  const [value, setValue] = useState(props.defaultValue ?? 0);
  return (
    <RivoProvider scope="local">
      <Rating {...props} value={value} onValueChange={setValue} />
      <output data-testid="nota">{value}</output>
    </RivoProvider>
  );
}

const fills = (container: HTMLElement) =>
  [...container.querySelectorAll("[data-fill]")].map((node) => node.getAttribute("data-fill"));

test("e um radiogroup com o nome Avaliacao e uma opcao por estrela", () => {
  rating();
  const group = screen.getByRole("radiogroup", { name: "Avaliação" });
  const radios = screen.getAllByRole("radio");
  expect(group).toBeDefined();
  expect(radios).toHaveLength(5);
  expect(radios.map((radio) => radio.getAttribute("aria-label"))).toEqual([
    "1 estrela",
    "2 estrelas",
    "3 estrelas",
    "4 estrelas",
    "5 estrelas",
  ]);
});

test("max muda quantas estrelas, e o padrao e cinco", () => {
  rating({ max: 10 });
  expect(screen.getAllByRole("radio")).toHaveLength(10);
});

test("sem nota, nenhuma opcao marcada e o foco entra pela primeira", () => {
  rating();
  const radios = screen.getAllByRole("radio");
  expect(radios.every((radio) => radio.getAttribute("aria-checked") === "false")).toBe(true);
  expect(radios.map((radio) => radio.tabIndex)).toEqual([0, -1, -1, -1, -1]);
});

test("clicar escolhe a nota, pinta ate ela e so a marcada fica no tab", () => {
  const { container } = render(<Controlled />);
  fireEvent.click(screen.getByRole("radio", { name: "3 estrelas" }));

  expect(screen.getByTestId("nota").textContent).toBe("3");
  const checked = screen.getByRole("radio", { checked: true });
  expect(checked.getAttribute("aria-label")).toBe("3 estrelas");
  expect(checked.tabIndex).toBe(0);
  expect(fills(container)).toEqual(["1", "1", "1", "0", "0"]);
});

test("as setas andam uma estrela, param nas pontas, e o foco vai junto", () => {
  render(<Controlled defaultValue={2} />);
  const radio = screen.getByRole("radio", { name: "2 estrelas" });
  radio.focus();

  fireEvent.keyDown(radio, { key: "ArrowRight" });
  expect(screen.getByTestId("nota").textContent).toBe("3");
  expect(document.activeElement?.getAttribute("aria-label")).toBe("3 estrelas");

  fireEvent.keyDown(document.activeElement!, { key: "ArrowLeft" });
  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
  expect(screen.getByTestId("nota").textContent).toBe("1");

  fireEvent.keyDown(document.activeElement!, { key: "End" });
  expect(screen.getByTestId("nota").textContent).toBe("5");
  fireEvent.keyDown(document.activeElement!, { key: "ArrowUp" });
  expect(screen.getByTestId("nota").textContent).toBe("5");

  fireEvent.keyDown(document.activeElement!, { key: "Home" });
  expect(screen.getByTestId("nota").textContent).toBe("1");
});

test("allowHalf divide cada estrela em duas metades, com nome de meio", () => {
  const { container } = render(<Controlled allowHalf defaultValue={2.5} />);
  const radios = screen.getAllByRole("radio");
  expect(radios).toHaveLength(10);
  expect(radios[0]!.getAttribute("aria-label")).toBe("Meia estrela");
  expect(radios[2]!.getAttribute("aria-label")).toBe("1,5 estrela");
  expect(radios[4]!.getAttribute("aria-label")).toBe("2,5 estrelas");
  expect(screen.getByRole("radio", { checked: true }).getAttribute("aria-label")).toBe(
    "2,5 estrelas",
  );
  expect(fills(container)).toEqual(["1", "1", "0.5", "0", "0"]);

  fireEvent.keyDown(screen.getByRole("radio", { checked: true }), { key: "ArrowRight" });
  expect(screen.getByTestId("nota").textContent).toBe("3");
});

test("sem clearable, clicar de novo na nota nao limpa", () => {
  const { onValueChange } = rating({ defaultValue: 4 });
  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(onValueChange).toHaveBeenLastCalledWith(4);
});

test("com clearable, clicar de novo na nota volta a zero", () => {
  render(<Controlled clearable defaultValue={4} />);
  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(screen.getByTestId("nota").textContent).toBe("0");
  expect(screen.queryByRole("radio", { checked: true })).toBeNull();
});

test("o ponteiro por cima mostra a previa sem mudar a nota, e sair apaga a previa", () => {
  const { container } = render(<Controlled defaultValue={1} />);
  fireEvent.pointerEnter(screen.getByRole("radio", { name: "4 estrelas" }));
  expect(fills(container)).toEqual(["1", "1", "1", "1", "0"]);
  expect(screen.getByTestId("nota").textContent).toBe("1");

  fireEvent.pointerLeave(screen.getByRole("radiogroup"));
  expect(fills(container)).toEqual(["1", "0", "0", "0", "0"]);
});

test("a estrela cheia pinta com warning e a vazia com border-strong, medidas a 3:1", () => {
  const { container } = rating({ defaultValue: 1 });
  const filled = container.querySelector("[data-fill] > span")!;
  expect(filled.className.split(" ")).toContain("text-warning");
  const empty = container.querySelector("[aria-hidden='true']")!;
  expect(empty.className.split(" ")).toContain("text-border-strong");
});

test("desabilitado: ninguem entra pelo tab, clique nao muda, e as cores sao de desabilitado", () => {
  const { container, onValueChange } = rating({ disabled: true, defaultValue: 2 });
  expect(screen.getByRole("radiogroup").getAttribute("aria-disabled")).toBe("true");
  expect(screen.getAllByRole("radio").every((radio) => radio.tabIndex === -1)).toBe(true);

  fireEvent.click(screen.getByRole("radio", { name: "4 estrelas" }));
  fireEvent.keyDown(screen.getByRole("radio", { name: "2 estrelas" }), { key: "ArrowRight" });
  expect(onValueChange).not.toHaveBeenCalled();

  const filled = container.querySelector("[data-fill] > span")!;
  expect(filled.className.split(" ")).toContain("text-fg-disabled");
  expect(filled.className.split(" ")).not.toContain("text-warning");
});

test("readOnly sai como uma imagem so, com a media dita em portugues", () => {
  const { container } = rating({ readOnly: true, value: 4.5 });
  expect(screen.queryByRole("radiogroup")).toBeNull();
  expect(screen.queryAllByRole("radio")).toHaveLength(0);
  expect(screen.getByRole("img", { name: "4,5 de 5" })).toBeDefined();
  expect(fills(container)).toEqual(["1", "1", "1", "1", "0.5"]);
});

test("readOnly aceita fracao qualquer e pinta a parte que ela vale", () => {
  const { container } = rating({ readOnly: true, value: 4.3 });
  expect(screen.getByRole("img", { name: "4,3 de 5" })).toBeDefined();
  const last = container.querySelectorAll<HTMLElement>("[data-fill]")[4]!;
  expect(last.getAttribute("data-fill")).toBe("0.3");
  expect(last.style.width).toBe("30%");
});

test("labels troca os textos do leitor de tela", () => {
  rating({
    labels: { group: "Nota do atendimento", item: (value) => `${value} de 5` },
  });
  expect(screen.getByRole("radiogroup", { name: "Nota do atendimento" })).toBeDefined();
  expect(screen.getByRole("radio", { name: "2 de 5" })).toBeDefined();
});

test("aria-labelledby toma o lugar do nome padrao", () => {
  render(
    <RivoProvider scope="local">
      <p id="titulo">Como foi a entrega?</p>
      <Rating aria-labelledby="titulo" />
    </RivoProvider>,
  );
  expect(screen.getByRole("radiogroup", { name: "Como foi a entrega?" })).toBeDefined();
});

test("icon troca o desenho nas duas camadas", () => {
  const { container } = rating({ icon: <Heart data-testid="coracao" />, max: 3 });
  expect(screen.getAllByTestId("coracao")).toHaveLength(6);
  expect(container.querySelector(".lucide-star")).toBeNull();
});

test("name leva a nota num input escondido para o formulario", () => {
  const { container } = rating({ name: "nota", defaultValue: 3 });
  const input = container.querySelector<HTMLInputElement>("input[type='hidden']")!;
  expect(input.name).toBe("nota");
  expect(input.value).toBe("3");
});

test("cada estrela tem caixa de pelo menos 24px de alvo nos tres tamanhos", () => {
  for (const [size, box] of [
    ["sm", "size-6"],
    ["md", "size-7"],
    ["lg", "size-9"],
  ] as const) {
    const { container, unmount } = rating({ size });
    const item = container.querySelector("[role='radiogroup'] > span")!;
    expect(item.className.split(" ")).toContain(box);
    unmount();
  }
});
