import { expect, test } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";

import { useToast } from "../src/components/toast";
import { RivoProvider } from "../src/provider/rivo-provider";

function Removed({ onUndo }: { onUndo: () => void }) {
  const toast = useToast();
  useEffect(() => {
    const id = toast.add({
      title: "Nota 4816 excluída",
      timeout: 0,
      actionProps: {
        children: "Desfazer",
        onClick: () => {
          onUndo();
          toast.close(id);
        },
      },
    });
  }, [toast, onUndo]);
  return null;
}

function Plain() {
  const toast = useToast();
  useEffect(() => {
    toast.add({ title: "Nota 4816 emitida", timeout: 0 });
  }, [toast]);
  return null;
}

test("a toast with actionProps draws the undo button, and the click calls whoever asked for it", async () => {
  let undone = 0;
  render(
    <RivoProvider>
      <Removed onUndo={() => (undone += 1)} />
    </RivoProvider>,
  );

  const undo = await screen.findByRole("button", { name: "Desfazer" });
  expect(undo.getAttribute("type")).toBe("button");
  await act(async () => {
    fireEvent.click(undo);
  });

  expect(undone).toBe(1);
  await waitFor(() => expect(screen.queryByText("Nota 4816 excluída")).toBeNull());
});

test("a toast without actionProps gets no action button, only the close x", async () => {
  render(
    <RivoProvider>
      <Plain />
    </RivoProvider>,
  );

  const title = await screen.findByText("Nota 4816 emitida");
  const toast =
    title.closest("[data-rc-toast-close]")?.parentElement ?? title.parentElement!.parentElement!;
  const buttons = [...toast.querySelectorAll("button")];

  expect(buttons.length).toBeGreaterThan(0);
  expect(buttons.every((button) => button.hasAttribute("data-rc-toast-close"))).toBe(true);
});
