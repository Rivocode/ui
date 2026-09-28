import { afterEach, beforeEach, expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Affix, type AffixProps } from "../src/components/affix";
import { RivoProvider } from "../src/provider/rivo-provider";

let restoreRect: (() => void) | null = null;

beforeEach(() => {
  Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
  const original = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.dataset.slot !== "affix") return original.call(this);
    const top = this.style.top ? Number.parseFloat(this.style.top) : 740;
    return { top, bottom: top + 40, left: 0, right: 0, width: 120, height: 40, x: 0, y: top } as DOMRect;
  };
  restoreRect = () => {
    HTMLElement.prototype.getBoundingClientRect = original;
  };
});

afterEach(() => {
  restoreRect?.();
  document.documentElement.style.scrollPaddingTop = "";
  document.documentElement.style.scrollPaddingBottom = "";
});

function affix(props: Partial<AffixProps> = {}) {
  return render(
    <RivoProvider scope="local" theme="rivocode-light">
      <div data-testid="arvore" style={{ transform: "translateZ(0)" }}>
        <Affix {...props}>
          <button type="button">Salvar rascunho</button>
        </Affix>
      </div>
    </RivoProvider>,
  );
}

const root = () => screen.getByRole("button", { name: "Salvar rascunho" }).closest<HTMLElement>(
  "[data-slot=affix]",
)!;

test("gruda na janela pelo portal do provider, que carrega o tema", () => {
  affix();
  const node = root();
  expect(screen.getByTestId("arvore").contains(node)).toBe(false);
  expect(node.parentElement!.hasAttribute("data-rc-portal")).toBe(true);
  expect(node.parentElement!.dataset.rcTheme).toBe("rivocode-light");
  expect(node.className.split(" ")).toContain("fixed");
});

test("a posicao vem por prop, com numero em pixel e texto em medida do CSS", () => {
  affix({ position: { top: 16, left: "var(--rc-pad-panel)" } });
  const node = root();
  expect(node.style.top).toBe("16px");
  expect(node.style.left).toBe("var(--rc-pad-panel)");
  expect(node.style.bottom).toBe("");
});

test("o empilhamento sai de --rc-z-*, e nunca de numero", () => {
  affix({ layer: "overlay" });
  const tokens = root().className.split(" ");
  expect(tokens).toContain("z-[var(--rc-z-overlay)]");
  expect(tokens).not.toContain("z-[var(--rc-z-sticky)]");
  expect(tokens.some((token) => /^z-\d/.test(token))).toBe(false);
});

test("reserva o proprio espaco no scroll-padding, para o foco nao parar atras dela", () => {
  const { unmount } = affix();
  expect(document.documentElement.style.scrollPaddingBottom).toBe("68px");
  unmount();
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("grudada em cima, reserva em cima, e devolve o valor que a pagina ja tinha", () => {
  document.documentElement.style.scrollPaddingTop = "12px";
  const { unmount } = affix({ position: { top: 0 } });
  expect(document.documentElement.style.scrollPaddingTop).toBe("48px");
  unmount();
  expect(document.documentElement.style.scrollPaddingTop).toBe("12px");
});

test("reserveSpace desligado nao toca na pagina", () => {
  affix({ reserveSpace: false });
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("absolute gruda na caixa: fica na arvore e nao reserva nada na pagina", () => {
  affix({ strategy: "absolute" });
  const node = root();
  expect(screen.getByTestId("arvore").contains(node)).toBe(true);
  expect(node.className.split(" ")).toContain("absolute");
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("withinPortal desligado deixa a peca onde ela foi escrita", () => {
  affix({ withinPortal: false });
  expect(screen.getByTestId("arvore").contains(root())).toBe(true);
});
