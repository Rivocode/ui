import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Command, type CommandGroup } from "../src/components/command";
import { RivoProvider } from "../src/provider/rivo-provider";

function palette(props: Partial<React.ComponentProps<typeof Command>> = {}) {
  const onOpenChange = mock((open: boolean) => void open);
  const onSelect = mock(() => {});
  const groups: CommandGroup[] = [{ items: [{ id: "nota", label: "Emitir nota", onSelect }] }];
  render(
    <RivoProvider scope="local">
      <input aria-label="Busca" />
      <div contentEditable suppressContentEditableWarning data-testid="editor">
        texto
      </div>
      <Command open={false} onOpenChange={onOpenChange} groups={groups} {...props} />
    </RivoProvider>,
  );
  return { onOpenChange, onSelect };
}

function press(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, cancelable: true, ...init }),
    );
  });
}

test("Ctrl+K outside a field opens the palette", () => {
  const { onOpenChange } = palette();
  press(document.body, "k");
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

test("Ctrl+K inside a field or an editor does not open the palette", () => {
  const { onOpenChange } = palette();
  press(screen.getByLabelText("Busca"), "k");
  press(screen.getByTestId("editor"), "k");
  expect(onOpenChange).not.toHaveBeenCalled();
});

test("Ctrl+K that someone already handled does not open the palette", () => {
  const { onOpenChange } = palette();
  const claim = (event: Event) => event.preventDefault();
  document.body.addEventListener("keydown", claim);
  try {
    press(document.body.firstElementChild!, "k");
  } finally {
    document.body.removeEventListener("keydown", claim);
  }
  expect(onOpenChange).not.toHaveBeenCalled();
});

test("an uppercase shortcut matches the key", () => {
  const { onOpenChange } = palette({ shortcut: "K" });
  press(document.body, "k");
  expect(onOpenChange).toHaveBeenCalledWith(true);
});

test("with the palette open, Ctrl+K in its own field closes it", () => {
  const { onOpenChange } = palette({ open: true });
  press(screen.getByRole("combobox"), "k");
  expect(onOpenChange).toHaveBeenCalledWith(false);
});

test("Enter during IME composition does not run the command", () => {
  const { onSelect, onOpenChange } = palette({ open: true });
  const field = screen.getByRole("combobox");

  fireEvent.keyDown(field, { key: "Enter", isComposing: true });
  expect(onSelect).not.toHaveBeenCalled();

  fireEvent.keyDown(field, { key: "Enter" });
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
