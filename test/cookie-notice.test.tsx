import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";

import {
  CookieConsent,
  type CookieChoice,
  type CookieConsentProps,
} from "../src/components/cookie-consent";
import { RivoProvider } from "../src/provider/rivo-provider";

function consent(props: Partial<CookieConsentProps> = {}) {
  const onDecision = mock((_choice: CookieChoice) => {});
  const tree = (next: Partial<CookieConsentProps>) => (
    <RivoProvider scope="local">
      <button type="button">Botão da página</button>
      <CookieConsent
        open
        onDecision={onDecision}
        policyHref="/privacidade"
        {...props}
        {...next}
      />
    </RivoProvider>
  );
  const view = render(tree({}));
  const dialog = view.container.querySelector("[role='dialog']") as HTMLElement;
  const again = (next: Partial<CookieConsentProps>) => view.rerender(tree(next));
  return { ...view, dialog, again, onDecision };
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");
const button = (dialog: HTMLElement, name: string) => within(dialog).getByRole("button", { name });

test("when open, it is a non-modal dialog with name and description, and focus goes to it", () => {
  const { dialog } = consent();

  expect(dialog.getAttribute("aria-modal")).toBe("false");
  expect(screen.getByRole("dialog", { name: "Cookies e privacidade" })).toBe(dialog);
  expect(document.getElementById(dialog.getAttribute("aria-describedby")!)!.textContent).toMatch(
    /^Usamos cookies necessários/,
  );
  expect(document.activeElement).toBe(dialog);
  expect(dialog.hasAttribute("inert")).toBe(false);
});

test("when closed, it stays inert and invisible, and does not take focus", () => {
  const { dialog } = consent({ open: false });

  expect(dialog.hasAttribute("inert")).toBe(true);
  expect(tokens(dialog)).toContain("invisible");
  expect(document.activeElement).not.toBe(dialog);
});

test("opening after mount also takes focus to the notice", () => {
  const { dialog, again } = consent({ open: false });
  const page = screen.getByRole("button", { name: "Botão da página" });
  page.focus();

  again({ open: true });

  expect(document.activeElement).toBe(dialog);
});

test("it does not trap the page: nothing outside it becomes inert or hidden", () => {
  const { container } = consent();
  const page = screen.getByRole("button", { name: "Botão da página" });

  expect(page.closest("[inert]")).toBeNull();
  expect(page.closest("[aria-hidden='true']")).toBeNull();
  expect(container.querySelector("[data-rc-overlay], .bg-overlay")).toBeNull();

  page.focus();
  expect(document.activeElement).toBe(page);
});

test("Esc does not dismiss without a choice", () => {
  const { dialog, onDecision } = consent();

  fireEvent.keyDown(dialog, { key: "Escape" });
  fireEvent.keyDown(document, { key: "Escape" });

  expect(onDecision).not.toHaveBeenCalled();
  expect(dialog.hasAttribute("inert")).toBe(false);
});

test("Aceitar todos turns everything on", () => {
  const { dialog, onDecision } = consent();

  fireEvent.click(button(dialog, "Aceitar todos"));

  expect(onDecision).toHaveBeenCalledWith({
    action: "acceptAll",
    categories: { necessary: true, analytics: true, marketing: true },
  });
});

test("Recusar não essenciais leaves only the necessary", () => {
  const { dialog, onDecision } = consent();

  fireEvent.click(button(dialog, "Recusar não essenciais"));

  expect(onDecision).toHaveBeenCalledWith({
    action: "rejectOptional",
    categories: { necessary: true, analytics: false, marketing: false },
  });
});

test("reject has the same visual weight as accept", () => {
  const { dialog } = consent();

  const accept = tokens(button(dialog, "Aceitar todos")).toSorted();
  const reject = tokens(button(dialog, "Recusar não essenciais")).toSorted();

  expect(reject).toEqual(accept);
  expect(accept).toContain("bg-surface");
  expect(accept).not.toContain("bg-accent");

  fireEvent.click(button(dialog, "Personalizar"));
  const pair = button(dialog, "Aceitar todos").parentElement!;
  expect(button(dialog, "Recusar não essenciais").parentElement).toBe(pair);
  expect(pair.children).toHaveLength(2);
});

test("the Tab order is the order mobile shows, and desktop only reverses the drawing", () => {
  const { dialog } = consent();
  fireEvent.click(button(dialog, "Personalizar"));

  const order = [...dialog.querySelectorAll("button")]
    .map((node) => node.textContent)
    .filter((text) => text !== "");
  expect(order).toEqual(["Aceitar todos", "Recusar não essenciais", "Salvar escolhas", "Personalizar"]);

  const inner = button(dialog, "Aceitar todos").parentElement!;
  const outer = button(dialog, "Personalizar").parentElement!;
  for (const row of [inner, outer]) {
    expect(tokens(row)).toContain("flex-col");
    expect(tokens(row)).not.toContain("flex-col-reverse");
    expect(tokens(row)).toContain("sm:flex-row-reverse");
    expect(tokens(row)).not.toContain("sm:flex-row");
  }
});

test("Personalizar opens the categories: necessary ones on and locked, the rest off", () => {
  const { dialog } = consent();
  const customize = button(dialog, "Personalizar");

  expect(customize.getAttribute("aria-expanded")).toBe("false");
  expect(within(dialog).queryByRole("switch")).toBeNull();

  fireEvent.click(customize);

  expect(customize.getAttribute("aria-expanded")).toBe("true");
  const list = within(dialog).getByRole("list", { name: "Categorias de cookies" });
  expect(customize.getAttribute("aria-controls")).toBe(list.id);

  const switches = within(list).getAllByRole("switch");
  expect(switches).toHaveLength(3);
  const [necessary, analytics, marketing] = switches;
  expect(necessary!.getAttribute("aria-checked")).toBe("true");
  expect(necessary!.hasAttribute("data-disabled")).toBe(true);
  expect(analytics!.getAttribute("aria-checked")).toBe("false");
  expect(marketing!.getAttribute("aria-checked")).toBe("false");
  expect(within(list).getByText(/sempre ativos/)).toBeDefined();
});

test("Salvar escolhas returns what was turned on by hand", () => {
  const { dialog, onDecision } = consent();

  fireEvent.click(button(dialog, "Personalizar"));
  fireEvent.click(within(dialog).getByText("Análise"));
  const [, analytics] = within(dialog).getAllByRole("switch");
  expect(analytics!.getAttribute("aria-checked")).toBe("true");
  fireEvent.click(button(dialog, "Salvar escolhas"));

  expect(onDecision).toHaveBeenCalledWith({
    action: "save",
    categories: { necessary: true, analytics: true, marketing: false },
  });
});

test("categories and the previous choice come by prop, and the required one cannot be turned off", () => {
  const { dialog, onDecision } = consent({
    categories: [
      { id: "essential", label: "Essenciais", required: true },
      { id: "support", label: "Chat de suporte", description: "O balão de conversa no canto." },
    ],
    defaultValue: { essential: false, support: true },
  });

  fireEvent.click(button(dialog, "Personalizar"));
  const [essential, support] = within(dialog).getAllByRole("switch");
  expect(essential!.getAttribute("aria-checked")).toBe("true");
  expect(support!.getAttribute("aria-checked")).toBe("true");
  expect(support!.getAttribute("aria-describedby")).toBe(
    within(dialog).getByText("O balão de conversa no canto.").id,
  );

  fireEvent.click(button(dialog, "Salvar escolhas"));
  expect(onDecision).toHaveBeenCalledWith({
    action: "save",
    categories: { essential: true, support: true },
  });
});

test("the policy link goes to the given address", () => {
  const { dialog } = consent({ policyHref: "https://exemplo.com.br/privacidade" });

  const link = within(dialog).getByRole("link", { name: "Política de privacidade" });
  expect(link.getAttribute("href")).toBe("https://exemplo.com.br/privacidade");
});

test("when closing with focus inside, focus returns to where it was before opening", () => {
  const { dialog, again } = consent({ open: false });
  const page = screen.getByRole("button", { name: "Botão da página" });
  page.focus();

  again({ open: true });
  button(dialog, "Aceitar todos").focus();
  again({ open: false });

  expect(document.activeElement).toBe(page);
});

test("reopening starts from scratch: without the previously open Personalizar", () => {
  const { dialog, again } = consent();

  fireEvent.click(button(dialog, "Personalizar"));
  again({ open: false });
  again({ open: true });

  expect(button(dialog, "Personalizar").getAttribute("aria-expanded")).toBe("false");
  expect(within(dialog).queryByRole("switch")).toBeNull();
});

test("stacks by the token and enters and leaves through the motion curves", () => {
  const { dialog, again, container } = consent();
  const root = container.querySelector("[data-open]") as HTMLElement;

  expect(tokens(root)).toContain("z-[var(--rc-z-overlay)]");
  expect(tokens(root)).toContain("fixed");
  expect(tokens(dialog)).toContain("ease-rc-enter");

  again({ open: false });
  expect(tokens(dialog)).toContain("ease-rc-exit");
  expect(tokens(dialog)).not.toContain("ease-rc-enter");
});
