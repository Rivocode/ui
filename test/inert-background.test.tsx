import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { AlertDialog, AlertDialogContent, AlertDialogTitle } from "../src/components/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "../src/components/dialog";
import { Sheet, SheetContent, SheetTitle } from "../src/components/sheet";

/* ---------------------------------------------------------------------------
 * The background hidden from the screen reader must also leave keyboard reach
 *
 * Measured in the browser with the dialog open: `#root` got `aria-hidden` and
 * did not get `inert`. Half a barrier standing is worse than none: on the
 * second Tab round focus reached real controls of the page behind - the
 * sidebar search button, a navigation link - and that control was
 * `aria-hidden`, so the screen reader refused to announce it. The person
 * pressed Tab, focus went somewhere, and nothing was said. Focus on nothing.
 * Firefox passed; Chromium and WebKit failed, which is a difference in how each
 * engine treats focus inside an `aria-hidden` subtree.
 *
 * The one hiding it is Base UI, in the focus manager's `markOthers`: it knows
 * how to apply `inert`, but `FloatingFocusManager` only asks for `ariaHidden`.
 * There is no prop to ask for both, so the barrier is completed here.
 *
 * What these tests do not reach: happy-dom has no browser focus and does not
 * honor `inert` in the Tab order. Here we prove the attribute is on the right
 * element, at the right moment, and leaves when the panel closes - not that
 * Tab stops reaching the background, which is a browser engine matter.
 * ------------------------------------------------------------------------- */

/**
 * Waits for the tick in which the barrier is completed.
 *
 * Base UI only hides the background a few commits after the panel mounts, and
 * whatever mirrors that responds in a microtask. Without this wait the test
 * measures the instant before the fix, and not the fix.
 */
async function settle() {
  await Promise.resolve();
}

/**
 * The page background: the sibling of the portal container that Base UI hid
 * from the screen reader when the panel opened.
 */
function background() {
  return document.querySelector<HTMLElement>('body > div[aria-hidden="true"]');
}

test("with the dialog open the background leaves keyboard reach", async () => {
  render(
    <RivoProvider scope="local">
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
        </DialogContent>
      </Dialog>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("with the confirmation open the background leaves keyboard reach", async () => {
  render(
    <RivoProvider scope="local">
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Cancelar a nota?</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("with the sheet open the background leaves keyboard reach", async () => {
  render(
    <RivoProvider scope="local">
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Navegacao</SheetTitle>
        </SheetContent>
      </Sheet>
    </RivoProvider>,
  );

  await settle();

  const page = background();
  expect(page).not.toBeNull();
  expect(page!.hasAttribute("inert")).toBe(true);
});

test("once the dialog closes, the page comes back whole", async () => {
  render(
    <RivoProvider scope="local">
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Excluir projeto</DialogTitle>
          <DialogClose>Fechar</DialogClose>
        </DialogContent>
      </Dialog>
    </RivoProvider>,
  );

  await settle();
  expect(background()!.hasAttribute("inert")).toBe(true);

  fireEvent.click(screen.getByText("Fechar"));

  // A barrier that is not undone is worse than one that never existed: the page
  // would stay alive on screen and dead to the keyboard.
  expect(document.querySelector("[inert]")).toBeNull();
});
