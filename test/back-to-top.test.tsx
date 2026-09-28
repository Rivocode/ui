import { afterEach, expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { ScrollToTop, type ScrollToTopProps } from "../src/components/scroll-to-top";
import { RivoProvider } from "../src/provider/rivo-provider";

const saved = { scrollTo: window.scrollTo, matchMedia: window.matchMedia };

afterEach(() => {
  window.scrollTo = saved.scrollTo;
  window.matchMedia = saved.matchMedia;
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
});

function scrollWindow(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event("scroll"));
  });
}

function Page(props: Partial<ScrollToTopProps>) {
  return (
    <RivoProvider scope="local">
      <main>
        <h1>Notas fiscais</h1>
        <a href="#primeira">Primeira nota</a>
      </main>
      <ScrollToTop {...props} />
    </RivoProvider>
  );
}

test("only exists after scrolling past the threshold", () => {
  render(<Page threshold={400} />);
  expect(screen.queryByRole("button", { name: "Voltar ao topo" })).toBeNull();

  scrollWindow(400);
  expect(screen.queryByRole("button", { name: "Voltar ao topo" })).toBeNull();

  scrollWindow(401);
  expect(screen.getByRole("button", { name: "Voltar ao topo" })).toBeDefined();

  scrollWindow(0);
  expect(screen.queryByRole("button", { name: "Voltar ao topo" })).toBeNull();
});

test("scrolls up smoothly and takes focus to main, since the button disappears right after", () => {
  const calls: ScrollToOptions[] = [];
  window.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof window.scrollTo;
  let climbed = 0;
  render(<Page onScrollToTop={() => (climbed += 1)} />);
  scrollWindow(2000);

  fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));

  expect(calls).toEqual([{ top: 0, behavior: "smooth" }]);
  const main = screen.getByRole("main");
  expect(document.activeElement).toBe(main);
  expect(main.getAttribute("tabindex")).toBe("-1");
  expect(climbed).toBe(1);

  act(() => main.blur());
  expect(main.hasAttribute("tabindex")).toBe(false);
});

test("with reduced motion, the scroll up is instant", () => {
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
  render(<Page />);
  scrollWindow(2000);
  fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
  expect(calls).toEqual([{ top: 0, behavior: "auto" }]);
});

test("focusTarget picks another destination for focus", () => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  function WithTarget() {
    const [title, setTitle] = useState<HTMLElement | null>(null);
    return (
      <RivoProvider scope="local">
        <h1 ref={setTitle}>Relatório</h1>
        <ScrollToTop focusTarget={title} />
      </RivoProvider>
    );
  }
  render(<WithTarget />);
  scrollWindow(1000);
  fireEvent.click(screen.getByRole("button", { name: "Voltar ao topo" }));
  expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Relatório" }));
});

test("inside a scrolling box, it measures and scrolls the box, and focus goes to it", () => {
  const calls: ScrollToOptions[] = [];
  function Box() {
    const [box, setBox] = useState<HTMLDivElement | null>(null);
    return (
      <RivoProvider scope="local">
        <div className="relative">
          <div ref={setBox} data-testid="caixa" className="overflow-auto">
            <p>Lista longa</p>
          </div>
          <ScrollToTop target={box} strategy="absolute" threshold={100} />
        </div>
      </RivoProvider>
    );
  }
  render(<Box />);
  const box = screen.getByTestId("caixa");
  box.scrollTo = ((options: ScrollToOptions) => calls.push(options)) as typeof box.scrollTo;

  scrollWindow(5000);
  expect(screen.queryByRole("button")).toBeNull();

  box.scrollTop = 150;
  act(() => {
    box.dispatchEvent(new Event("scroll"));
  });
  const button = screen.getByRole("button", { name: "Voltar ao topo" });
  expect(button.closest("[data-slot=affix]")!.className.split(" ")).toContain("absolute");

  fireEvent.click(button);
  expect(calls).toEqual([{ top: 0, behavior: "smooth" }]);
  expect(document.activeElement).toBe(box);
});

test("the button is the house IconButton, with a replaceable name and the sticky layer", () => {
  render(<Page label="Ir para o começo" classNames={{ button: "c-botao" }} />);
  scrollWindow(3000);
  const button = screen.getByRole("button", { name: "Ir para o começo" });
  expect(button.className.split(" ")).toContain("c-botao");
  expect(button.className.split(" ")).toContain("rounded-pill");
  expect(button.querySelector("svg")!.closest("[aria-hidden=true]")).not.toBeNull();
  const affix = button.closest("[data-slot=affix]")!;
  expect(affix.className.split(" ")).toContain("fixed");
  expect(affix.className.split(" ")).toContain("z-[var(--rc-z-sticky)]");
});
