import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Button } from "../src/components/button";
import { Popconfirm } from "../src/components/popconfirm";
import { RivoProvider } from "../src/provider/rivo-provider";

function Example(props: Partial<React.ComponentProps<typeof Popconfirm>> = {}) {
  return (
    <RivoProvider scope="local">
      <Popconfirm
        defaultOpen
        trigger={<Button variant="ghost">Excluir linha</Button>}
        title="Excluir a nota 4813?"
        description="A linha sai da lista e o cliente deixa de ver o documento."
        labels={{ confirm: "Excluir" }}
        onConfirm={() => {}}
        {...props}
      />
    </RivoProvider>
  );
}

function panel() {
  return screen.getByRole("alertdialog");
}

async function settle(ms = 40) {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

test("the question renders in an h2, like the house DialogTitle and AlertDialogTitle", () => {
  render(<Example />);

  expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Excluir a nota 4813?");
});

test("titleAs lowers the question level, so the panel inside a Card does not invert the outline", () => {
  render(<Example titleAs="h4" />);

  expect(screen.getByRole("heading", { level: 4 }).textContent).toBe("Excluir a nota 4813?");
  expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
});

test("the confirmation opens anchored, with the question as the panel name", () => {
  render(<Example />);

  const dialog = panel();
  expect(dialog.textContent).toContain("Excluir a nota 4813?");
  expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
  expect(dialog.getAttribute("aria-describedby")).toBeTruthy();

  const trigger = screen.getByRole("button", { name: "Excluir linha" });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(trigger.getAttribute("aria-controls")).toBeTruthy();
});

test("focus starts on the button that does nothing", async () => {
  render(<Example />);
  const cancelButton = screen.getByRole("button", { name: "Cancelar" });
  await settle();
  expect(document.activeElement).toBe(cancelButton);
});

test("confirming calls the action once and closes the panel", () => {
  const onConfirm = mock(() => {});
  render(<Example onConfirm={onConfirm} />);

  fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

  expect(onConfirm).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("the exit button closes without running, and notifies the cancel listener", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("Escape cancels, because the safe way out is doing nothing", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.keyDown(panel(), { key: "Escape" });

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("clicking outside cancels, and the destructive action still requires the button", () => {
  const onConfirm = mock(() => {});
  const onCancel = mock(() => {});
  render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

  fireEvent.pointerDown(document.body);
  fireEvent.mouseDown(document.body);
  fireEvent.click(document.body);

  expect(onConfirm).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("the pending promise holds the panel and the second click does not delete twice", async () => {
  let release: () => void = () => {};
  const remove = mock(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  render(<Example onConfirm={remove} />);

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);

  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");
  expect(panel()).toBeDefined();

  fireEvent.click(confirmButton);
  expect(remove).toHaveBeenCalledTimes(1);

  await act(async () => {
    release();
  });
  await settle();

  expect(screen.queryByRole("alertdialog")).toBeNull();
});

test("while the call runs, Esc does not close the panel from under it", async () => {
  let release: () => void = () => {};
  const onCancel = mock(() => {});
  render(
    <Example
      onCancel={onCancel}
      onConfirm={() =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);
  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");

  fireEvent.keyDown(panel(), { key: "Escape" });
  expect(screen.queryByRole("alertdialog")).not.toBeNull();
  expect(onCancel).not.toHaveBeenCalled();

  // Cancelar refuses the press through `aria-disabled`, and NOT through
  // `disabled`. That difference is what separates this piece from a keyboard
  // trap: with the attribute, both buttons left the tab order at the same time,
  // the `alertdialog` was left with ZERO focusables, focus fell to `<body>` and
  // Tab leaked into the background that Base UI marked aria-hidden. Measured in
  // Chrome before the fix: "remaining focusables: NONE". It is a WCAG 2.1.2 failure.
  const cancel = screen.getByRole("button", { name: "Cancelar" });
  expect(cancel.getAttribute("aria-disabled")).toBe("true");
  expect(cancel.hasAttribute("disabled")).toBe(false);

  // The guarantee that matters, written as the screen reader feels it: at least
  // one focus target remains inside the panel while the call runs.
  const focusable = panel().querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  expect(focusable.length).toBeGreaterThan(0);

  // And the wait is not silent: there is a live region saying it is running.
  const notice = panel().querySelector('[role="status"]');
  expect(notice?.textContent).toBeTruthy();

  await act(async () => {
    release();
  });
});

test("a rejecting promise gives the panel back, with the text still on screen", async () => {
  let fail: (reason: Error) => void = () => {};
  render(
    <Example
      onConfirm={() =>
        new Promise<void>((_, reject) => {
          fail = reject;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  fireEvent.click(confirmButton);
  await settle();
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");

  await act(async () => {
    fail(new Error("rede fora"));
  });
  await settle();

  expect(confirmButton.getAttribute("aria-busy")).toBeNull();
  expect(panel().textContent).toContain("Excluir a nota 4813?");
  expect(screen.getByRole("button", { name: "Cancelar" }).hasAttribute("disabled")).toBe(false);
});

test("a wait coming from outside also locks the button", () => {
  render(<Example loading />);
  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  expect(confirmButton.getAttribute("aria-busy")).toBe("true");
  expect(confirmButton.hasAttribute("disabled")).toBe(true);
});

test("the danger tone wears the filled red, and the neutral one does not", () => {
  const { unmount } = render(<Example />);
  expect(screen.getByRole("button", { name: "Excluir" }).className.split(" ")).toContain(
    "bg-danger",
  );
  unmount();

  render(<Example tone="neutral" labels={{ confirm: "Arquivar" }} />);
  const archive = screen.getByRole("button", { name: "Arquivar" });
  expect(archive.className.split(" ")).toContain("bg-accent");
  expect(archive.className).not.toContain("bg-danger");
});

test("each part of the panel accepts a class, without reaching into internals by selector", () => {
  render(
    <Example
      className="painel-x"
      classNames={{
        title: "titulo-x",
        description: "descricao-x",
        footer: "rodape-x",
        confirm: "executa-x",
        cancel: "sai-x",
      }}
    />,
  );

  for (const [marker, expected] of [
    ["titulo-x", "text-fg"],
    ["descricao-x", "text-fg-muted"],
    ["rodape-x", "flex"],
    ["executa-x", "bg-danger"],
    ["sai-x", "border-border-strong"],
  ] as const) {
    const target = document.querySelector(`.${marker}`);
    expect(target).not.toBeNull();
    expect(target!.className).toContain(expected);
  }
  expect(panel().className).toContain("painel-x");
});

test("without a description the panel does not promise text that does not exist", () => {
  render(<Example description={undefined} />);
  expect(panel().getAttribute("aria-describedby")).toBeNull();
});

test("on a narrow screen the confirmation becomes a bottom sheet, with full-width buttons", () => {
  const realMatchMedia = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    render(<Example />);
    const sheet = panel();
    expect(sheet.className).toContain("rounded-t-xl");
    expect(sheet.textContent).toContain("Excluir a nota 4813?");
    expect(document.querySelector(".flex-col-reverse")).not.toBeNull();
  } finally {
    window.matchMedia = realMatchMedia;
  }
});

test("focus moves TO cancel when confirm starts waiting", async () => {
  // 0.8.0 fixed only half: cancel started refusing through `aria-disabled` and
  // stayed focusable, but nothing MOVED focus to it. Whoever presses confirm
  // holds focus on it, `loading` marks it truly `disabled`, and the browser
  // drops focus on `<body>` - the next Tab leaves the panel.
  //
  // The defect only shows in Chromium and Firefox: WebKit keeps focus inside on
  // its own, so a suite run only in Safari passes with the defect standing.
  let release = () => {};
  render(
    <Example
      onConfirm={() =>
        new Promise<void>((resolve) => {
          release = resolve;
        })
      }
    />,
  );

  const confirmButton = screen.getByRole("button", { name: "Excluir" });
  confirmButton.focus();
  expect(document.activeElement).toBe(confirmButton);

  fireEvent.click(confirmButton);
  await settle();

  const cancel = screen.getByRole("button", { name: "Cancelar" });
  expect(document.activeElement).toBe(cancel);
  expect(panel().contains(document.activeElement)).toBe(true);

  await act(async () => {
    release();
  });
});
