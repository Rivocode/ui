import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { Button } from "../src/components/button";
import { useToast } from "../src/components/toast";
import { RivoProvider } from "../src/provider/rivo-provider";

function FireToast() {
  const toast = useToast();
  return (
    <Button onClick={() => toast.add({ title: "Nota emitida", description: "Numero 4816." })}>
      Emitir
    </Button>
  );
}

test("the toast shows after the action, without the app mounting any portal", () => {
  render(
    <RivoProvider>
      <FireToast />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  expect(screen.getByText("Nota emitida")).toBeDefined();
  expect(screen.getByText("Numero 4816.")).toBeDefined();
});

test("the toast shows inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <FireToast />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container!.textContent).toContain("Nota emitida");
});

test("using the toast outside the Provider throws, instead of failing silently", () => {
  function Loose() {
    useToast();
    return null;
  }
  expect(() => render(<Loose />)).toThrow();
});

test("the manager has a stable identity, otherwise a useEffect loops", () => {
  const seen: unknown[] = [];
  function Spy() {
    seen.push(useToast());
    return null;
  }
  const { rerender } = render(
    <RivoProvider>
      <Spy />
    </RivoProvider>,
  );
  rerender(
    <RivoProvider>
      <Spy />
    </RivoProvider>,
  );
  expect(seen.length).toBeGreaterThan(1);
  expect(seen.every((v) => v === seen[0])).toBe(true);
});

test("the toast corner is chosen in the provider, and not in the consumer's CSS", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <FireToast />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const area = document.querySelector('[class*="fixed"][class*="top-4"]');
  expect(area).not.toBeNull();
  expect(area!.className).toContain("left-4");
  // The default must not linger alongside: both corners at once would leave the
  // area stuck at the bottom one, and the choice would be silently ignored.
  expect(area!.className).not.toContain("bottom-4");
});

test("the toast enters from the nearest edge, and does not cross the screen", () => {
  render(
    <RivoProvider scope="local" toastPosition="top-left">
      <FireToast />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  const alert = screen.getByText("Nota emitida").closest("[class*='rounded-lg']");
  expect(alert).not.toBeNull();
  // Anchored to the left, it slides in from the left.
  expect(alert!.className).toContain("data-[starting-style]:-translate-x-4");
});

function ToneTrigger({ type }: { type?: string }) {
  const toast = useToast();
  return (
    <Button onClick={() => toast.add({ title: "Emissao", description: "Detalhe.", type })}>
      Emitir
    </Button>
  );
}

/** The toast bubble on screen, which is what carries the tone. */
function bubble() {
  return document.querySelector('[class*="shadow-3"]') as HTMLElement;
}

test("the error toast does not look like the success one", () => {
  // The tone Base UI carries on the object was not read, and Alert and Badge
  // carefully tell these three apart in the same system: success, error and
  // warning toasts came out visually identical.
  const { rerender } = render(
    <RivoProvider>
      <ToneTrigger type="success" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  expect(bubble().className).toContain("bg-success-subtle");

  rerender(
    <RivoProvider>
      <ToneTrigger type="error" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const tones = [...document.querySelectorAll('[class*="shadow-3"]')].map((node) => node.className);
  expect(tones.some((name) => name.includes("bg-danger-subtle"))).toBe(true);
});

test("the toast without a tone stays neutral, which is the default", () => {
  render(
    <RivoProvider>
      <ToneTrigger />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));

  expect(bubble().className).toContain("bg-surface-raised");
  expect(bubble().className).not.toContain("subtle");
});

function closeButtons(count: number) {
  const found = [...document.querySelectorAll<HTMLElement>('[aria-label="Fechar aviso"]')];
  expect(found.length).toBe(count);
  return found;
}

function TwoNotices() {
  const toast = useToast();
  return (
    <Button
      onClick={() => {
        toast.add({ title: "Nota 4816 emitida", timeout: 0 });
        toast.add({ title: "Nota 4817 emitida", timeout: 0 });
      }}
    >
      Emitir duas
    </Button>
  );
}

test("closing a toast moves focus to the neighboring toast, and the last one returns focus to whoever had it before", async () => {
  render(
    <RivoProvider>
      <TwoNotices />
    </RivoProvider>,
  );
  const trigger = screen.getByRole("button", { name: "Emitir duas" });
  fireEvent.click(trigger);
  trigger.focus();

  const closers = await waitFor(() => closeButtons(2));
  closers[0]!.focus();
  fireEvent.click(closers[0]!);

  const [last] = await waitFor(() => closeButtons(1));
  await waitFor(() => expect(last!.closest("[role=dialog]")!.contains(document.activeElement)).toBe(true));

  last!.focus();
  fireEvent.click(last!);
  await waitFor(() => closeButtons(0));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});

test("the toast's x stretches its target beyond the drawing", () => {
  render(
    <RivoProvider>
      <FireToast />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Emitir" }));
  const [closer] = closeButtons(1);
  expect(closer!.getAttribute("aria-label")).toBe("Fechar aviso");
  const tokens = closer!.className.split(" ");
  expect(tokens).toContain("relative");
  expect(tokens).toContain("after:absolute");
  expect(tokens).toContain("after:-inset-1");
});
