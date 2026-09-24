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

test("aberto, e um dialogo nao modal com nome e descricao, e o foco vai para ele", () => {
  const { dialog } = consent();

  expect(dialog.getAttribute("aria-modal")).toBe("false");
  expect(screen.getByRole("dialog", { name: "Cookies e privacidade" })).toBe(dialog);
  expect(document.getElementById(dialog.getAttribute("aria-describedby")!)!.textContent).toMatch(
    /^Usamos cookies necessários/,
  );
  expect(document.activeElement).toBe(dialog);
  expect(dialog.hasAttribute("inert")).toBe(false);
});

test("fechado, fica inerte e invisivel, e nao pega o foco", () => {
  const { dialog } = consent({ open: false });

  expect(dialog.hasAttribute("inert")).toBe(true);
  expect(tokens(dialog)).toContain("invisible");
  expect(document.activeElement).not.toBe(dialog);
});

test("abrir depois de montado tambem leva o foco ao aviso", () => {
  const { dialog, again } = consent({ open: false });
  const page = screen.getByRole("button", { name: "Botão da página" });
  page.focus();

  again({ open: true });

  expect(document.activeElement).toBe(dialog);
});

test("nao prende a pagina: nada fora dele fica inerte ou escondido", () => {
  const { container } = consent();
  const page = screen.getByRole("button", { name: "Botão da página" });

  expect(page.closest("[inert]")).toBeNull();
  expect(page.closest("[aria-hidden='true']")).toBeNull();
  expect(container.querySelector("[data-rc-overlay], .bg-overlay")).toBeNull();

  page.focus();
  expect(document.activeElement).toBe(page);
});

test("Esc nao dispensa sem escolha", () => {
  const { dialog, onDecision } = consent();

  fireEvent.keyDown(dialog, { key: "Escape" });
  fireEvent.keyDown(document, { key: "Escape" });

  expect(onDecision).not.toHaveBeenCalled();
  expect(dialog.hasAttribute("inert")).toBe(false);
});

test("Aceitar todos liga tudo", () => {
  const { dialog, onDecision } = consent();

  fireEvent.click(button(dialog, "Aceitar todos"));

  expect(onDecision).toHaveBeenCalledWith({
    action: "acceptAll",
    categories: { necessary: true, analytics: true, marketing: true },
  });
});

test("Recusar não essenciais deixa so o necessario", () => {
  const { dialog, onDecision } = consent();

  fireEvent.click(button(dialog, "Recusar não essenciais"));

  expect(onDecision).toHaveBeenCalledWith({
    action: "rejectOptional",
    categories: { necessary: true, analytics: false, marketing: false },
  });
});

test("recusar tem o mesmo peso visual que aceitar", () => {
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

test("Personalizar abre as categorias: necessarios ligados e travados, o resto desligado", () => {
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

test("Salvar escolhas devolve o que foi ligado a mao", () => {
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

test("categorias e escolha anterior vem por prop, e a obrigatoria nao se desliga", () => {
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

test("o link da politica vai para o endereco dado", () => {
  const { dialog } = consent({ policyHref: "https://exemplo.com.br/privacidade" });

  const link = within(dialog).getByRole("link", { name: "Política de privacidade" });
  expect(link.getAttribute("href")).toBe("https://exemplo.com.br/privacidade");
});

test("ao fechar com o foco dentro, o foco volta para onde estava antes de abrir", () => {
  const { dialog, again } = consent({ open: false });
  const page = screen.getByRole("button", { name: "Botão da página" });
  page.focus();

  again({ open: true });
  button(dialog, "Aceitar todos").focus();
  again({ open: false });

  expect(document.activeElement).toBe(page);
});

test("reabrir comeca do zero: sem o Personalizar aberto de antes", () => {
  const { dialog, again } = consent();

  fireEvent.click(button(dialog, "Personalizar"));
  again({ open: false });
  again({ open: true });

  expect(button(dialog, "Personalizar").getAttribute("aria-expanded")).toBe("false");
  expect(within(dialog).queryByRole("switch")).toBeNull();
});

test("empilha pelo token e entra e sai pelas curvas de movimento", () => {
  const { dialog, again, container } = consent();
  const root = container.querySelector("[data-open]") as HTMLElement;

  expect(tokens(root)).toContain("z-[var(--rc-z-overlay)]");
  expect(tokens(root)).toContain("fixed");
  expect(tokens(dialog)).toContain("ease-rc-enter");

  again({ open: false });
  expect(tokens(dialog)).toContain("ease-rc-exit");
  expect(tokens(dialog)).not.toContain("ease-rc-enter");
});
