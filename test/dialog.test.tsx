import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "../src/components/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogFooter } from "../src/components/alert-dialog";
import { RivoProvider } from "../src/provider/rivo-provider";

function Example() {
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <DialogTitle>Excluir projeto</DialogTitle>
        <DialogDescription>Esta acao nao pode ser desfeita.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

test("the open dialog shows title and description", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  expect(screen.getByText("Excluir projeto")).toBeDefined();
  expect(screen.getByText("Esta acao nao pode ser desfeita.")).toBeDefined();
});

test("in scoped mode the dialog renders inside the container that carries the theme", () => {
  render(
    <RivoProvider scope="local" theme="rivocode-light">
      <Example />
    </RivoProvider>,
  );
  const container = document.querySelector('[data-rc-portal][data-rc-theme="rivocode-light"]');
  expect(container).not.toBeNull();
  expect(container!.contains(screen.getByText("Excluir projeto"))).toBe(true);
});

test("stacking comes from the scale, never from a hardcoded number", () => {
  render(
    <RivoProvider>
      <Example />
    </RivoProvider>,
  );
  const popup = screen.getByRole("dialog");
  expect(popup.className).toContain("--rc-z-dialog");
  expect(popup.className).not.toMatch(/z-\d+/);
});

test("the dialog requires the Provider and says so clearly", () => {
  expect(() => render(<Example />)).toThrow(/RivoProvider/);
});

/** The backdrop class, found by the marker the piece let through. */
function backdrop(marker: string) {
  return document.querySelector(`.${marker}`)!.className;
}

test("the dialog backdrop enters and leaves animated, like the alert dialog's", () => {
  // `transition-opacity` alone animates nothing: without both states the
  // transition has nowhere to start from nor to go, and the dimming snapped in
  // and out. The alert dialog and the sheet already had both, and the dialog
  // was the only one that blinked - with the transition class in place, hiding
  // the gap.
  render(
    <RivoProvider scope="local">
      <Dialog open>
        <DialogContent classNames={{ backdrop: "tarja-dg" }}>Corpo</DialogContent>
      </Dialog>
      <AlertDialog open>
        <AlertDialogContent classNames={{ backdrop: "tarja-ad" }}>Corpo</AlertDialogContent>
      </AlertDialog>
    </RivoProvider>,
  );

  for (const marker of ["tarja-dg", "tarja-ad"]) {
    expect(`${marker}: ${backdrop(marker).includes("data-[starting-style]:opacity-0")}`).toBe(
      `${marker}: true`,
    );
    expect(`${marker}: ${backdrop(marker).includes("data-[ending-style]:opacity-0")}`).toBe(
      `${marker}: true`,
    );
  }
});

test("both footers stack on mobile, and not only the alert dialog's", () => {
  // Both panels already sit at the bottom on mobile; what differed was the
  // footer, and two actions side by side in a panel that wide come out too
  // narrow. `flex-col-reverse` lifts the last one in markup - the confirming
  // one - to the top of the stack, and leaves the exit close to the thumb.
  const { container } = render(
    <RivoProvider scope="local">
      <DialogFooter data-testid="rodape-dg">Acoes</DialogFooter>
      <AlertDialogFooter data-testid="rodape-ad">Acoes</AlertDialogFooter>
    </RivoProvider>,
  );

  for (const id of ["rodape-dg", "rodape-ad"]) {
    const footer = container.ownerDocument.querySelector(`[data-testid="${id}"]`)!;
    expect(`${id}: ${footer.className.includes("max-sm:flex-col-reverse")}`).toBe(`${id}: true`);
    expect(`${id}: ${footer.className.includes("max-sm:[&>*]:w-full")}`).toBe(`${id}: true`);
  }
});

test("both panels fit on screen and scroll inside, like the sheet's", () => {
  const panels = [
    [
      "dialog",
      <Dialog open key="dg">
        <DialogContent>Corpo</DialogContent>
      </Dialog>,
    ],
    [
      "alertdialog",
      <AlertDialog open key="ad">
        <AlertDialogContent>Corpo</AlertDialogContent>
      </AlertDialog>,
    ],
  ] as const;

  for (const [role, node] of panels) {
    const { unmount } = render(<RivoProvider scope="local">{node}</RivoProvider>);
    const classes = screen.getByRole(role).className.split(" ");

    expect(`${role}: ${classes.includes("max-h-[85dvh]")}`).toBe(`${role}: true`);
    expect(`${role}: ${classes.includes("overflow-y-auto")}`).toBe(`${role}: true`);
    expect(`${role}: ${classes.includes("overscroll-contain")}`).toBe(`${role}: true`);
    expect(`${role}: ${classes.includes("flex")}`).toBe(`${role}: true`);
    expect(`${role}: ${classes.includes("flex-col")}`).toBe(`${role}: true`);
    expect(classes).not.toContain("overflow-hidden");

    unmount();
  }
});
