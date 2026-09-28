import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Progress } from "../src/components/progress";
import { Meter } from "../src/components/meter";
import { Slider } from "../src/components/slider";
import { Checkbox } from "../src/components/checkbox";
import { Switch } from "../src/components/switch";
import { Radio, RadioGroup } from "../src/components/radio";
import { Dialog, DialogContent } from "../src/components/dialog";
import { AlertDialog, AlertDialogContent } from "../src/components/alert-dialog";
import { Sheet, SheetContent } from "../src/components/sheet";
import { Combobox, ComboboxInput } from "../src/components/combobox";
import { DataTable, type Column } from "../src/components/data-table";

/*
 * The per-part style hook.
 *
 * Below the root, each piece was a sealed node: the Progress track, the Slider
 * thumb, the Checkbox indicator, the table row and the dialog backdrop - which
 * is a sibling of the panel inside the portal, so neither className nor a
 * descendant variant reached it. The workaround left was [&_tbody_tr], which
 * couples the consumer's screen to the piece's internal tree: a div that
 * becomes a span inside the library breaks someone's screen with no warning
 * and no error.
 *
 * The part names are the same as the "Parts" section of each page.
 *
 * The root is not proven here. This file handles what sits **below** it, which
 * is case by case by nature - each piece has its own parts. The root
 * `className`, which holds for the whole catalog, is swept export by export in
 * `root-class.test.tsx`: the lack of that sweep is what let `ToastViewport`
 * and `SidebarMenuSkeleton` through without accepting `className`.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** The dressed part, checking the class landed on the right node and not on the root. */
function wears(container: HTMLElement, marker: string, base: string) {
  const target = container.ownerDocument.querySelector(`.${marker}`);
  expect(target).not.toBeNull();
  expect(target!.className.split(" ")).toContain(base);
}

test("the progress bar lets you dress track and indicator", () => {
  const { container } = withTheme(
    <Progress
      value={40}
      aria-label="Enviando"
      classNames={{ track: "trilha-x", indicator: "indicador-x" }}
    />,
  );

  wears(container, "trilha-x", "bg-skeleton");
  wears(container, "indicador-x", "bg-accent-text");
});

test("the meter lets you dress the same parts as the progress bar", () => {
  const { container } = withTheme(
    <Meter value={62} aria-label="Cota" classNames={{ track: "trilha-y", indicator: "ind-y" }} />,
  );

  wears(container, "trilha-y", "bg-skeleton");
  wears(container, "ind-y", "bg-accent-text");
});

test("the slider lets you dress track, indicator and thumb", () => {
  const { container } = withTheme(
    <Slider
      defaultValue={30}
      thumbLabel="Desconto"
      classNames={{ track: "trilha-z", indicator: "ind-z", thumb: "pino-z" }}
    />,
  );

  wears(container, "trilha-z", "bg-skeleton");
  wears(container, "ind-z", "bg-accent-text");
  wears(container, "pino-z", "rounded-pill");
});

test("the checkbox lets you dress the square and the label", () => {
  const { container } = withTheme(
    <Checkbox classNames={{ box: "caixa-x", label: "rotulo-x" }}>ISS retido</Checkbox>,
  );

  wears(container, "caixa-x", "rounded-sm");
  wears(container, "rotulo-x", "text-fg");
});

test("the switch and the radio dress the label through the same classNames.label as the checkbox", () => {
  const { container } = withTheme(
    <>
      <Switch classNames={{ label: "rotulo-s" }}>Avisar</Switch>
      <RadioGroup defaultValue="pix">
        <Radio value="pix" classNames={{ label: "rotulo-r" }}>
          Pix
        </Radio>
      </RadioGroup>
    </>,
  );

  wears(container, "rotulo-s", "text-fg");
  wears(container, "rotulo-r", "text-fg");
});

test("the switch lets you dress the thumb", () => {
  const { container } = withTheme(<Switch aria-label="Avisar" classNames={{ thumb: "pino-s" }} />);

  wears(container, "pino-s", "rounded-pill");
});

test("the radio lets you dress the inner indicator", () => {
  const { container } = withTheme(
    <RadioGroup defaultValue="pix">
      <Radio value="pix" classNames={{ indicator: "marca-r" }}>
        Pix
      </Radio>
    </RadioGroup>,
  );

  wears(container, "marca-r", "rounded-pill");
});

test("the dialog lets you dress the backdrop, which is a sibling of the panel in the portal", () => {
  // Level 6: neither className nor [&_x] reach it, because the backdrop is not
  // inside the panel - both are children of the portal.
  const { container } = withTheme(
    <Dialog open>
      <DialogContent classNames={{ backdrop: "tarja-d" }}>Corpo</DialogContent>
    </Dialog>,
  );

  wears(container, "tarja-d", "bg-overlay");
});

test("the alert dialog lets you dress the backdrop, as its two siblings already did", () => {
  // AlertDialogContent only accepted `children`: its backdrop was the only one
  // of the three unreachable from outside, and it is the piece where people
  // most want to touch it - the destructive confirmation is where a
  // `backdrop-blur` or a deeper dark is usually requested.
  const { container } = withTheme(
    <AlertDialog open>
      <AlertDialogContent classNames={{ backdrop: "tarja-a" }}>Corpo</AlertDialogContent>
    </AlertDialog>,
  );

  wears(container, "tarja-a", "bg-overlay");
});

test("the sheet lets you dress the backdrop too", () => {
  const { container } = withTheme(
    <Sheet open>
      <SheetContent classNames={{ backdrop: "tarja-f" }}>Corpo</SheetContent>
    </Sheet>,
  );

  wears(container, "tarja-f", "bg-overlay");
});

type Invoice = { id: string; number: string };
const COLUMNS: Column<Invoice>[] = [{ key: "number", header: "Numero" }];
const INVOICES: Invoice[] = [{ id: "1", number: "4813" }];

test("the table lets you dress row, cell and header", () => {
  // Today's workaround is [&_tbody_tr:hover]:bg-accent-subtle, which only works
  // while the internal tree does not change.
  const { container } = withTheme(
    <DataTable
      data={INVOICES}
      columns={COLUMNS}
      rowKey={(invoice) => invoice.id}
      classNames={{ row: "linha-t", cell: "celula-t", head: "cabeca-t" }}
    />,
  );

  wears(container, "cabeca-t", "uppercase");
  wears(container, "linha-t", "border-b");
  wears(container, "celula-t", "align-middle");
  expect(screen.getByText("4813")).toBeDefined();
});

const CUSTOMERS = ["Clinica Sao Lucas"];

test("the search field separates the frame from the input itself", () => {
  // The ComboboxInput `className` always landed on the frame, and the inner
  // `<input>` had no target at all - while AutocompleteInput, which the doc
  // presents as the sibling piece, dresses the input directly. Whoever wrote
  // both screens with the same class saw one work and the other not.
  const { container } = withTheme(
    <Combobox items={CUSTOMERS}>
      <ComboboxInput
        placeholder="Buscar cliente"
        className="moldura-c"
        classNames={{ input: "campo-c" }}
      />
    </Combobox>,
  );

  wears(container, "moldura-c", "relative");
  wears(container, "campo-c", "h-[var(--rc-control-md)]");
  expect(container.ownerDocument.querySelector(".campo-c")!.tagName).toBe("INPUT");
  // The old contract still stands: `className` dresses the root, which here is
  // the frame, and not the input.
  expect(container.ownerDocument.querySelector("input")!.className).not.toContain("moldura-c");
});

test("the frame has its own name, besides the root className", () => {
  const { container } = withTheme(
    <Combobox items={CUSTOMERS}>
      <ComboboxInput placeholder="Buscar cliente" classNames={{ wrapper: "moldura-w" }} />
    </Combobox>,
  );

  wears(container, "moldura-w", "relative");
});
