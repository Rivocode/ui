import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Spoiler } from "../src/components/spoiler";

const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return Number(this.firstElementChild?.getAttribute("data-height") ?? 0);
    },
  });
});

afterAll(() => {
  if (original) Object.defineProperty(HTMLElement.prototype, "scrollHeight", original);
});

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

function Long({ height = 400 }: { height?: number }) {
  return (
    <p data-height={height}>
      A nota fiscal foi cancelada dentro do prazo de vinte e quatro horas, e o XML de
      cancelamento ja esta disponivel para download no painel.
    </p>
  );
}

const viewport = (container: HTMLElement) =>
  container.querySelector("[data-clipped], [id]") as HTMLElement;

test("texto que cabe na altura nao ganha botao, nem corte, nem degrade", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long height={80} />
    </Spoiler>,
  );

  expect(screen.queryByRole("button")).toBeNull();
  const box = viewport(container);
  expect(box.hasAttribute("data-clipped")).toBe(false);
  expect(box.style.maxHeight).toBe("");
  expect(tokens(box)).not.toContain("mask-b-to-100%");
});

test("texto que estoura corta na altura, com degrade, e o botao diz Ler mais recolhido", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const button = screen.getByRole("button", { name: "Ler mais" });
  const box = viewport(container);

  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(button.getAttribute("aria-controls")).toBe(box.id);
  expect(box.style.maxHeight).toBe("120px");
  expect(box.hasAttribute("data-clipped")).toBe(true);
  expect(tokens(box)).toContain("mask-b-to-100%");
});

test("Ler mais abre na altura inteira e anuncia expandido; Ler menos volta", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const button = screen.getByRole("button", { name: "Ler mais" });
  const box = viewport(container);

  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(button.textContent).toBe("Ler menos");
  expect(box.style.maxHeight).toBe("400px");
  expect(box.hasAttribute("data-clipped")).toBe(false);
  expect(tokens(box)).not.toContain("mask-b-to-100%");

  fireEvent.click(button);
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(button.textContent).toBe("Ler mais");
  expect(box.style.maxHeight).toBe("120px");
});

test("controlado, quem manda e o expanded, e o clique so avisa", () => {
  const onExpandedChange = mock((_: boolean) => {});
  const { rerender } = render(
    <Spoiler maxHeight={120} expanded={false} onExpandedChange={onExpandedChange}>
      <Long />
    </Spoiler>,
  );
  const button = screen.getByRole("button");

  fireEvent.click(button);
  expect(onExpandedChange).toHaveBeenLastCalledWith(true);
  expect(button.getAttribute("aria-expanded")).toBe("false");

  rerender(
    <Spoiler maxHeight={120} expanded onExpandedChange={onExpandedChange}>
      <Long />
    </Spoiler>,
  );
  expect(button.getAttribute("aria-expanded")).toBe("true");
});

test("defaultExpanded nasce aberto, e labels troca os dois textos", () => {
  render(
    <Spoiler defaultExpanded labels={{ more: "Ver tudo", less: "Ver menos" }}>
      <Long />
    </Spoiler>,
  );
  const button = screen.getByRole("button", { name: "Ver menos" });

  expect(button.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(button);
  expect(button.textContent).toBe("Ver tudo");
});

test("o foco que entra num link escondido abaixo do corte abre o bloco", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const link = document.createElement("a");
  link.href = "#xml";
  link.textContent = "Baixar o XML";
  link.getBoundingClientRect = () => ({ top: 300, bottom: 320 }) as DOMRect;
  viewport(container).firstElementChild!.appendChild(link);

  fireEvent.focusIn(link);
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
});

test("o foco que entra no que ja esta a vista nao abre nada", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const link = document.createElement("a");
  link.href = "#topo";
  link.textContent = "Topo";
  link.getBoundingClientRect = () => ({ top: 10, bottom: 30 }) as DOMRect;
  viewport(container).firstElementChild!.appendChild(link);

  fireEvent.focusIn(link);
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("false");
});

test("classNames alcanca a caixa que corta e o botao", () => {
  const { container } = render(
    <Spoiler classNames={{ content: "rc-content", trigger: "rc-trigger" }}>
      <Long />
    </Spoiler>,
  );

  expect(tokens(viewport(container))).toContain("rc-content");
  expect(tokens(screen.getByRole("button"))).toContain("rc-trigger");
});
