import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import { TableOfContents, type TableOfContentsProps } from "../src/components/table-of-contents";
import { RivoProvider } from "../src/provider/rivo-provider";

type Watched = { callback: () => void; nodes: Element[]; options: IntersectionObserverInit };

const observers: Watched[] = [];
const saved = { intersection: globalThis.IntersectionObserver, scrollTo: window.scrollTo };
const tops = new Map<string, number>();
let restoreRect: (() => void) | null = null;

beforeEach(() => {
  observers.length = 0;
  tops.clear();
  class FakeObserver {
    watched: Watched;
    constructor(callback: () => void, options: IntersectionObserverInit) {
      this.watched = { callback, nodes: [], options };
      observers.push(this.watched);
    }
    observe(node: Element) {
      this.watched.nodes.push(node);
    }
    unobserve() {}
    disconnect() {
      this.watched.nodes = [];
    }
  }
  globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;

  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const top = tops.get(this.id) ?? 0;
    return { top, bottom: top + 20, left: 0, right: 0, width: 0, height: 20, x: 0, y: top } as DOMRect;
  };
  restoreRect = () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
  Object.defineProperty(window, "innerHeight", { value: 1000, configurable: true });
});

afterEach(() => {
  globalThis.IntersectionObserver = saved.intersection;
  window.scrollTo = saved.scrollTo;
  restoreRect?.();
});

function page(toc: ReactNode) {
  return render(
    <RivoProvider scope="local">
      <article>
        <h2 id="emissao">Emissão</h2>
        <p>texto</p>
        <h3 id="impostos">Impostos</h3>
        <h3 id="retencoes">Retenções</h3>
        <h2 id="cancelamento">Cancelamento</h2>
      </article>
      {toc}
    </RivoProvider>,
  );
}

function scrollTo(positions: Record<string, number>) {
  for (const [id, top] of Object.entries(positions)) tops.set(id, top);
  act(() => {
    for (const observer of observers) observer.callback();
  });
}

const BELOW = { emissao: 800, impostos: 1200, retencoes: 1600, cancelamento: 2000 };

const toc = (props: Partial<TableOfContentsProps> = {}) => <TableOfContents {...props} />;

test("reads the page headings and renders in a named nav", () => {
  page(toc());
  const nav = screen.getByRole("navigation", { name: "Nesta página" });
  const links = Array.from(nav.querySelectorAll("a")).map((link) => link.getAttribute("href"));
  expect(links).toEqual(["#emissao", "#impostos", "#retencoes", "#cancelamento"]);
});

test("the h3 lives in a list inside the item of the h2 before it", () => {
  page(toc());
  const taxes = screen.getByRole("link", { name: "Impostos" });
  const parent = taxes.closest("ul")!.closest("li")!;
  expect(parent.querySelector("a")!.textContent).toBe("Emissão");
  const cancel = screen.getByRole("link", { name: "Cancelamento" });
  expect(cancel.closest("ul")!.closest("li")).toBeNull();
  expect(taxes.className.split(" ")).toContain("ps-6");
  expect(cancel.className.split(" ")).toContain("ps-3");
});

test("marks with aria-current the last section that crossed the line on scroll", () => {
  const changes: (string | null)[] = [];
  for (const [id, top] of Object.entries(BELOW)) tops.set(id, top);
  page(toc({ onActiveChange: (id) => changes.push(id) }));
  const all = observers.flatMap((observer) => observer.nodes.map((node) => node.id));
  expect(all).toEqual(["emissao", "impostos", "retencoes", "cancelamento"]);

  scrollTo({ emissao: 10, impostos: 200, retencoes: 600, cancelamento: 900 });
  const taxes = screen.getByRole("link", { name: "Impostos" });
  expect(taxes.getAttribute("aria-current")).toBe("location");
  expect(taxes.className.split(" ")).toContain("border-accent-text");
  expect(screen.getByRole("link", { name: "Emissão" }).getAttribute("aria-current")).toBeNull();

  scrollTo({ emissao: -900, impostos: -700, retencoes: -300, cancelamento: 100 });
  expect(screen.getByRole("link", { name: "Cancelamento" }).getAttribute("aria-current")).toBe(
    "location",
  );
  expect(changes).toEqual(["impostos", "cancelamento"]);
});

function reduceMotion() {
  const real = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = real;
  };
}

function scrollBox(height: number, client: number, top: number) {
  const box = document.createElement("div");
  Object.defineProperty(box, "scrollHeight", { value: height, configurable: true });
  Object.defineProperty(box, "clientHeight", { value: client, configurable: true });
  box.scrollTop = top;
  box.getBoundingClientRect = () =>
    ({ top: 0, bottom: client, height: client, left: 0, right: 0, width: 0, x: 0, y: 0 }) as DOMRect;
  document.body.appendChild(box);
  return box;
}

test("at the end of the scroll, the last visible section is marked even without crossing the line", () => {
  const box = scrollBox(1600, 400, 1200);
  for (const [id, top] of Object.entries(BELOW)) tops.set(id, top);
  page(toc({ root: box }));

  scrollTo({ emissao: -500, impostos: -200, retencoes: 60, cancelamento: 300 });
  expect(screen.getByRole("link", { name: "Cancelamento" }).getAttribute("aria-current")).toBe(
    "location",
  );

  box.scrollTop = 1100;
  act(() => {
    box.dispatchEvent(new Event("scroll"));
  });
  scrollTo({ emissao: -400, impostos: -100, retencoes: 60, cancelamento: 400 });
  expect(screen.getByRole("link", { name: "Retenções" }).getAttribute("aria-current")).toBe(
    "location",
  );
  box.remove();
});

test("a scroll that reaches the end without crossing the line also marks, through the scroll event", async () => {
  const box = scrollBox(1600, 400, 1100);
  tops.set("emissao", -400);
  tops.set("impostos", -100);
  tops.set("retencoes", 60);
  tops.set("cancelamento", 400);
  page(toc({ root: box }));
  expect(screen.getByRole("link", { name: "Retenções" }).getAttribute("aria-current")).toBe(
    "location",
  );

  tops.set("cancelamento", 300);
  box.scrollTop = 1200;
  await act(async () => {
    box.dispatchEvent(new Event("scroll"));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  expect(screen.getByRole("link", { name: "Cancelamento" }).getAttribute("aria-current")).toBe(
    "location",
  );
  box.remove();
});

test("with reduced motion, the clicked section holds the mark until the person scrolls", () => {
  const restore = reduceMotion();
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  try {
    page(toc());
    fireEvent.click(screen.getByRole("link", { name: "Cancelamento" }));
    scrollTo({ emissao: -900, impostos: -700, retencoes: 100, cancelamento: 500 });
    expect(screen.getByRole("link", { name: "Cancelamento" }).getAttribute("aria-current")).toBe(
      "location",
    );

    fireEvent.wheel(window);
    scrollTo({ emissao: -950, impostos: -750, retencoes: 50, cancelamento: 450 });
    expect(screen.getByRole("link", { name: "Retenções" }).getAttribute("aria-current")).toBe(
      "location",
    );
  } finally {
    restore();
  }
});

test("a long word without spaces wraps inside the link, instead of overflowing the page", () => {
  page(toc({ items: [{ id: "emissao", label: "Notafiscaldeservicoeletronicamunicipal" }] }));
  expect(screen.getByRole("link").className.split(" ")).toContain("wrap-anywhere");
});

test("before the first heading nothing is marked", () => {
  for (const [id, top] of Object.entries(BELOW)) tops.set(id, top);
  page(toc());
  expect(document.querySelector("[aria-current]")).toBeNull();
});

test("the band that counts as visible discounts the fixed header offset", () => {
  for (const [id, top] of Object.entries(BELOW)) tops.set(id, top);
  page(toc({ offset: 64 }));
  expect(observers[0]!.options.rootMargin).toBe("-64px 0px -70% 0px");
  scrollTo({ emissao: 300, impostos: 340 });
  expect(screen.getByRole("link", { name: "Impostos" }).getAttribute("aria-current")).toBe(
    "location",
  );
});

test("clicking scrolls smoothly to the heading, discounts the offset and moves focus to it", () => {
  const calls: ScrollToOptions[] = [];
  window.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof window.scrollTo;
  tops.set("retencoes", 500);
  page(toc({ offset: 64 }));

  fireEvent.click(screen.getByRole("link", { name: "Retenções" }));

  expect(calls).toEqual([{ top: window.scrollY + 500 - 64, behavior: "smooth" }]);
  const heading = document.getElementById("retencoes")!;
  expect(document.activeElement).toBe(heading);
  expect(heading.getAttribute("tabindex")).toBe("-1");
  expect(screen.getByRole("link", { name: "Retenções" }).getAttribute("aria-current")).toBe(
    "location",
  );
});

test("with reduce motion the scroll is instant", () => {
  const real = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("reduce"),
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
      onchange: null,
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  const calls: ScrollToOptions[] = [];
  window.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof window.scrollTo;
  try {
    page(toc());
    fireEvent.click(screen.getByRole("link", { name: "Emissão" }));
    expect(calls[0]!.behavior).toBe("auto");
  } finally {
    window.matchMedia = real;
  }
});

test("onItemClick with preventDefault hands the link back to the browser", () => {
  const scroll = mock(() => {});
  window.scrollTo = scroll as unknown as typeof window.scrollTo;
  page(toc({ onItemClick: (_item, event) => event.preventDefault() }));
  fireEvent.click(screen.getByRole("link", { name: "Emissão" }));
  expect(scroll).not.toHaveBeenCalled();
});

test("updateHash writes the address without stacking history", () => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  const length = window.history.length;
  page(toc({ updateHash: true }));
  fireEvent.click(screen.getByRole("link", { name: "Cancelamento" }));
  expect(window.location.hash).toBe("#cancelamento");
  expect(window.history.length).toBe(length);
  window.history.replaceState(null, "", window.location.pathname);
});

test("a heading without an id gets a readable, unique id", () => {
  render(
    <RivoProvider scope="local">
      <section>
        <h2>Nota de crédito</h2>
        <h2>Nota de crédito</h2>
      </section>
      <TableOfContents />
    </RivoProvider>,
  );
  const hrefs = Array.from(document.querySelectorAll("nav a")).map((link) =>
    link.getAttribute("href"),
  );
  expect(hrefs).toEqual(["#nota-de-credito", "#nota-de-credito-2"]);
});

test("a ready list skips the reading and the selector picks the levels", () => {
  page(
    toc({
      items: [
        { id: "emissao", label: "Como emitir", level: 2 },
        { id: "cancelamento", label: "Como cancelar", level: 2 },
      ],
    }),
  );
  expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Como emitir",
    "Como cancelar",
  ]);
});

test("only the h2s, when the selector asks for only them", () => {
  page(toc({ selector: "h2" }));
  expect(screen.getAllByRole("link")).toHaveLength(2);
});

test("with no heading at all, no empty nav is left over", () => {
  render(
    <RivoProvider scope="local">
      <p>Pagina curta.</p>
      <TableOfContents />
    </RivoProvider>,
  );
  expect(screen.queryByRole("navigation")).toBeNull();
});

test("hideLabel removes the visible title and keeps the nav name", () => {
  page(toc({ hideLabel: true, label: "Sumário" }));
  expect(screen.queryByText("Sumário")).toBeNull();
  expect(screen.getByRole("navigation", { name: "Sumário" })).toBeDefined();
});

test("classNames reaches each part by name", () => {
  page(toc({ classNames: { label: "c-label", list: "c-list", item: "c-item", link: "c-link" } }));
  const nav = screen.getByRole("navigation");
  expect(nav.querySelector("p")!.className.split(" ")).toContain("c-label");
  expect(nav.querySelector("ul")!.className.split(" ")).toContain("c-list");
  expect(nav.querySelector("li")!.className.split(" ")).toContain("c-item");
  expect(nav.querySelector("a")!.className.split(" ")).toContain("c-link");
});

test("without IntersectionObserver in the environment, the index shows and nothing breaks", () => {
  globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
  page(toc());
  expect(screen.getAllByRole("link")).toHaveLength(4);
});
