import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Breadcrumb, type Crumb } from "../src/components/breadcrumb";
import { Pagination } from "../src/components/pagination";

const CRUMBS: Crumb[] = ["A", "B", "C", "D", "E"].map((label, index, all) =>
  index === all.length - 1 ? { label } : { label, href: `/${label}` },
);

function trail(items: Crumb[], max?: number) {
  const { container, unmount } = render(<Breadcrumb items={items} max={max} />);
  const shown = [...container.querySelectorAll("ol > li:not([aria-hidden])")].map(
    (item) => item.textContent,
  );
  unmount();
  return shown.join(" ");
}

test("a trilha dobrada mostra a primeira e as max - 1 ultimas", () => {
  expect(trail(CRUMBS, 4)).toBe("A ... C D E");
  expect(trail(CRUMBS, 3)).toBe("A ... D E");
  expect(trail(CRUMBS)).toBe("A ... C D E");
});

test("com max abaixo de 3 a trilha nao mostra mais migalhas nem repete nenhuma", () => {
  expect(trail(CRUMBS, 2)).toBe("A ... E");
  expect(trail(CRUMBS, 1)).toBe("A ... E");
  expect(trail(CRUMBS, 0)).toBe("A ... E");
  expect(trail(CRUMBS.slice(-2), 1)).toBe("D E");
  expect(trail(CRUMBS.slice(-3), 1)).toBe("C ... E");
});

test("a reticencia so aparece quando esconde ao menos uma migalha", () => {
  expect(trail(CRUMBS.slice(0, 4), 4)).toBe("A B C D");
  expect(trail(CRUMBS.slice(0, 3), 2)).toBe("A ... C");
  expect(trail(CRUMBS.slice(0, 2), 2)).toBe("A B");
});

function pager(page: number, pageCount: number) {
  const onPageChange = mock((next: number) => void next);
  const view = render(<Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} />);
  const previous = screen.getByRole("button", { name: "Página anterior" }) as HTMLButtonElement;
  const next = screen.getByRole("button", { name: "Próxima página" }) as HTMLButtonElement;
  const position = view.container.querySelector("nav > span")!.textContent;
  const current = view.container.querySelector("[aria-current=page]")?.textContent ?? null;
  return { onPageChange, previous, next, position, current };
}

test("sem paginas, a paginacao nao escreve 1 de 0 e trava as duas setas", () => {
  const { position, previous, next } = pager(1, 0);
  expect(position).toBe("1 de 1");
  expect(previous.disabled).toBe(true);
  expect(next.disabled).toBe(true);
});

test("com uma pagina so, as duas setas ficam travadas", () => {
  const { previous, next, current } = pager(1, 1);
  expect(previous.disabled).toBe(true);
  expect(next.disabled).toBe(true);
  expect(current).toBe("1");
});

test("a pagina alem do fim aparece presa na ultima, marcada, e a seta volta uma so", () => {
  const { position, current, previous, next, onPageChange } = pager(9, 5);
  expect(position).toBe("5 de 5");
  expect(current).toBe("5");
  expect(next.disabled).toBe(true);

  fireEvent.click(previous);
  expect(onPageChange).toHaveBeenCalledWith(4);
});

test("a pagina antes do comeco aparece presa na primeira", () => {
  const { position, current, previous, next, onPageChange } = pager(-3, 5);
  expect(position).toBe("1 de 5");
  expect(current).toBe("1");
  expect(previous.disabled).toBe(true);

  fireEvent.click(next);
  expect(onPageChange).toHaveBeenCalledWith(2);
});

function phoneTrail(items: Crumb[], max?: number) {
  const { container, unmount } = render(<Breadcrumb items={items} max={max} />);
  const kept = [...container.querySelectorAll("ol > li")].filter(
    (item) => !item.className.split(" ").includes("max-sm:hidden"),
  );
  const shown = kept
    .filter((item) => !item.hasAttribute("aria-hidden"))
    .map((item) => item.textContent);
  const links = kept.filter((item) => item.querySelector("a")).length;
  unmount();
  return { shown: shown.join(" "), links };
}

test("no celular a trilha guarda a pagina atual e um link de volta, mesmo com a reticencia no meio", () => {
  for (const max of [0, 1, 2, 3, 4]) {
    const { shown, links } = phoneTrail(CRUMBS, max);
    expect(shown.endsWith("E")).toBe(true);
    expect(shown).not.toContain("...");
    expect(links).toBe(1);
  }
  expect(phoneTrail(CRUMBS, 2).shown).toBe("A E");
  expect(phoneTrail(CRUMBS, 4).shown).toBe("D E");
});
