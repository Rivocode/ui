import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Spoiler } from "../src/components/spoiler";
import { revealsFocus } from "../src/shared/spoiler";

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

function linkAt(container: HTMLElement, bottom: number, scrollTop: number) {
  const box = viewport(container);
  const inner = box.firstElementChild as HTMLElement;
  const link = document.createElement("a");
  link.href = "#xml";
  link.textContent = "Baixar o XML";
  inner.appendChild(link);
  box.scrollTop = scrollTop;
  inner.getBoundingClientRect = () => ({ top: -scrollTop, bottom: 400 - scrollTop }) as DOMRect;
  link.getBoundingClientRect = () =>
    ({ top: bottom - 20 - scrollTop, bottom: bottom - scrollTop }) as DOMRect;
  return { box, link };
}

test("o foco num link que o navegador ja rolou para dentro do corte abre o bloco, volta o texto ao comeco e traz o link a vista", async () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const { box, link } = linkAt(container, 205, 105);
  const shown = mock((_: ScrollIntoViewOptions) => {});
  link.scrollIntoView = shown as unknown as typeof link.scrollIntoView;

  fireEvent.focusIn(link);
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
  expect(box.scrollTop).toBe(0);
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(shown).toHaveBeenCalledWith({ block: "nearest" });
});

test("o foco num link parado dentro do degrade abre o bloco, mesmo sem rolagem", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const { link } = linkAt(container, 110, 0);

  fireEvent.focusIn(link);
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("true");
});

test("o foco que entra no que ja esta a vista nao abre nada", () => {
  const { container } = render(
    <Spoiler maxHeight={120}>
      <Long />
    </Spoiler>,
  );
  const { link } = linkAt(container, 30, 0);

  fireEvent.focusIn(link);
  expect(screen.getByRole("button").getAttribute("aria-expanded")).toBe("false");
});

test("a decisao do foco mede dentro do conteudo, desconta o degrade e abre com qualquer rolagem", () => {
  expect(revealsFocus({ bottom: 30, scrollTop: 0, maxHeight: 120, fade: 48 })).toBe(false);
  expect(revealsFocus({ bottom: 72, scrollTop: 0, maxHeight: 120, fade: 48 })).toBe(false);
  expect(revealsFocus({ bottom: 73, scrollTop: 0, maxHeight: 120, fade: 48 })).toBe(true);
  expect(revealsFocus({ bottom: 30, scrollTop: 1, maxHeight: 120, fade: 48 })).toBe(true);
  expect(revealsFocus({ bottom: 205, scrollTop: 105, maxHeight: 96, fade: 48 })).toBe(true);
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
