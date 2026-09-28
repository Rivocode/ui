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

test("sticks to the window through the provider portal, which carries the theme", () => {
  affix();
  const node = root();
  expect(screen.getByTestId("arvore").contains(node)).toBe(false);
  expect(node.parentElement!.hasAttribute("data-rc-portal")).toBe(true);
  expect(node.parentElement!.dataset.rcTheme).toBe("rivocode-light");
  expect(node.className.split(" ")).toContain("fixed");
});

test("the position comes by prop, with a number in pixels and text as a CSS length", () => {
  affix({ position: { top: 16, left: "var(--rc-pad-panel)" } });
  const node = root();
  expect(node.style.top).toBe("16px");
  expect(node.style.left).toBe("var(--rc-pad-panel)");
  expect(node.style.bottom).toBe("");
});

test("the stacking comes from --rc-z-*, and never from a number", () => {
  affix({ layer: "overlay" });
  const tokens = root().className.split(" ");
  expect(tokens).toContain("z-[var(--rc-z-overlay)]");
  expect(tokens).not.toContain("z-[var(--rc-z-sticky)]");
  expect(tokens.some((token) => /^z-\d/.test(token))).toBe(false);
});

test("reserves its own space in scroll-padding, so focus does not land behind it", () => {
  const { unmount } = affix();
  expect(document.documentElement.style.scrollPaddingBottom).toBe("68px");
  unmount();
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("stuck to the top, it reserves at the top, and restores the value the page already had", () => {
  document.documentElement.style.scrollPaddingTop = "12px";
  const { unmount } = affix({ position: { top: 0 } });
  expect(document.documentElement.style.scrollPaddingTop).toBe("48px");
  unmount();
  expect(document.documentElement.style.scrollPaddingTop).toBe("12px");
});

test("reserveSpace off does not touch the page", () => {
  affix({ reserveSpace: false });
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("absolute sticks to the box: it stays in the tree and reserves nothing on the page", () => {
  affix({ strategy: "absolute" });
  const node = root();
  expect(screen.getByTestId("arvore").contains(node)).toBe(true);
  expect(node.className.split(" ")).toContain("absolute");
  expect(document.documentElement.style.scrollPaddingBottom).toBe("");
});

test("withinPortal off leaves the component where it was written", () => {
  affix({ withinPortal: false });
  expect(screen.getByTestId("arvore").contains(root())).toBe(true);
});
