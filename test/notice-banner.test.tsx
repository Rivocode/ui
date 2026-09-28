import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { Wrench } from "lucide-react";

import { Banner, type BannerProps } from "../src/components/banner";
import { Button } from "../src/components/button";
import { RivoProvider } from "../src/provider/rivo-provider";

function banner(props: Partial<BannerProps> = {}) {
  return render(
    <RivoProvider scope="local">
      <Banner description="O sistema fica fora do ar domingo, das 2h às 4h." {...props} />
    </RivoProvider>,
  );
}

test("info and success wait for the sentence to finish: role status", () => {
  for (const tone of ["info", "success"] as const) {
    const { unmount } = banner({ tone });
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
    unmount();
  }
});

test("warning and danger interrupt: role alert", () => {
  for (const tone of ["warning", "danger"] as const) {
    const { unmount } = banner({ tone });
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.queryByRole("status")).toBeNull();
    unmount();
  }
});

test("without a tone, it is born info", () => {
  banner();
  const root = screen.getByRole("status");
  expect(root.getAttribute("data-tone")).toBe("info");
  expect(root.className.split(" ")).toContain("bg-info-subtle");
});

test("it takes the full width and paints the tone background, without card corners", () => {
  banner({ tone: "warning" });
  const tokens = screen.getByRole("alert").className.split(" ");
  expect(tokens).toContain("w-full");
  expect(tokens).toContain("bg-warning-subtle");
  expect(tokens).toContain("border-b");
  expect(tokens.some((token) => token.startsWith("rounded"))).toBe(false);
});

test("the title names the banner and comes before the description", () => {
  banner({ tone: "danger", title: "Conta em atraso" });
  const root = screen.getByRole("alert", { name: "Conta em atraso" });
  const title = screen.getByText("Conta em atraso");
  const description = screen.getByText(/fora do ar/);
  expect(root.contains(title)).toBe(true);
  expect(title.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("without a title, the banner points to no name", () => {
  banner();
  expect(screen.getByRole("status").getAttribute("aria-labelledby")).toBeNull();
});

test("the tone icon appears on its own and silent", () => {
  const { container } = banner({ tone: "warning" });
  const icon = container.querySelector("svg")!;
  expect(icon).not.toBeNull();
  expect(icon.closest("[aria-hidden='true']")).not.toBeNull();
});

test("icon replaces the symbol, and null removes it", () => {
  const { unmount } = banner({ icon: <Wrench data-testid="wrench" /> });
  expect(screen.getByTestId("wrench")).toBeDefined();
  unmount();

  const second = banner({ icon: null });
  expect(second.container.querySelector("svg")).toBeNull();
});

test("actions go into the banner, and without them there is no button at all", () => {
  const { unmount } = banner();
  expect(screen.queryByRole("button")).toBeNull();
  unmount();

  banner({
    tone: "danger",
    actions: (
      <Button size="sm" variant="secondary">
        Pagar agora
      </Button>
    ),
  });
  expect(screen.getByRole("button", { name: "Pagar agora" })).toBeDefined();
});

test("onDismiss turns on the cross with a Portuguese name, and whoever hides it is the caller", () => {
  const onDismiss = mock(() => {});
  banner({ onDismiss });

  const close = screen.getByRole("button", { name: "Fechar aviso" });
  fireEvent.click(close);

  expect(onDismiss).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("status")).toBeDefined();
});

test("the cross name can be replaced", () => {
  banner({ onDismiss: () => {}, labels: { dismiss: "Dispensar aviso de manutenção" } });
  expect(screen.getByRole("button", { name: "Dispensar aviso de manutenção" })).toBeDefined();
});

test("classNames reaches each part by name", () => {
  banner({
    title: "Modo de teste",
    actions: <Button size="sm">Sair</Button>,
    onDismiss: () => {},
    classNames: {
      icon: "part-icon",
      content: "part-content",
      title: "part-title",
      description: "part-description",
      actions: "part-actions",
      dismiss: "part-dismiss",
    },
  });

  for (const part of [
    "part-icon",
    "part-content",
    "part-title",
    "part-description",
    "part-actions",
    "part-dismiss",
  ]) {
    expect(document.querySelectorAll(`.${part}`)).toHaveLength(1);
  }
});

test("a long label wraps inside the action button, and the banner does not widen the page at 320px", () => {
  banner({ actions: <Button size="sm">Reagendar a manutenção para outro domingo</Button> });

  const action = screen.getByRole("button", { name: /Reagendar/ });
  const actions = (action.parentElement!.getAttribute("class") ?? "").split(" ");
  for (const token of [
    "min-w-0",
    "[&>button]:h-auto",
    "[&>button]:min-h-[var(--rc-control-sm)]",
    "[&>button]:max-w-full",
    "[&>button]:shrink",
    "[&>button]:whitespace-normal",
  ]) {
    expect(actions).toContain(token);
  }
  expect(actions).not.toContain("shrink-0");
});
