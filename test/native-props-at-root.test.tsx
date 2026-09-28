import { expect, test } from "bun:test";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { CalendarPanel } from "../src/components/calendar-panel";
import { ColorPicker } from "../src/components/color-picker";
import { Command } from "../src/components/command";
import { FileUpload } from "../src/components/file-upload";
import { Stat } from "../src/components/stat";
import { Tree } from "../src/components/tree";
import { ChartContainer } from "../src/chart/chart";
import { ChartDonut } from "../src/chart/chart-donut";
import { ChartRadial } from "../src/chart/chart-radial";

/*
 * Nine pieces had their props type written as a closed object, and so they did
 * not accept `id`, `data-*` or `aria-*`. It is not a detail: without `id` there
 * is no `aria-describedby` pointing at them, without `data-*` there is no
 * end-to-end test selector nor analytics tagging, and the workaround was always
 * the same - wrapping the piece in a `div` just to hang the attribute, which
 * changes the layout of whoever sits in a grid or in flex.
 *
 * The guard mounts each of the nine with the three attributes and looks for
 * them in the DOM. It catches both defects: the type that does not accept
 * them, which stops at the compiler, and the forgotten `...rest`, which only
 * mounting reveals.
 */

const ID = "root-under-test";
const LABEL = "Rotulo escrito por quem chama";

/** The three attributes, the way whoever builds the screen would write them. */
const MARKS = { id: ID, "data-test": "yes", "aria-label": LABEL } as const;

const SLICES = [
  { natureza: "servico", total: 148_200 },
  { natureza: "produto", total: 62_400 },
];

const PIECES: { name: string; node: ReactNode }[] = [
  { name: "Stat", node: <Stat {...MARKS} label="Faturado" value="R$ 246,7 mil" /> },
  { name: "Tree", node: <Tree {...MARKS} items={[{ id: "financeiro", label: "Financeiro" }]} /> },
  { name: "ColorPicker", node: <ColorPicker {...MARKS} swatches={["#123456"]} /> },
  {
    name: "Command",
    node: <Command {...MARKS} open onOpenChange={() => {}} groups={[]} />,
  },
  { name: "FileUpload", node: <FileUpload {...MARKS} label="Arraste o XML da nota" /> },
  {
    name: "CalendarPanel",
    node: (
      <CalendarPanel
        {...MARKS}
        open
        onOpenChange={() => {}}
        trigger={<button type="button">Abrir</button>}
        title="Vencimento"
      >
        <p>Calendário</p>
      </CalendarPanel>
    ),
  },
  {
    name: "ChartContainer",
    node: (
      <ChartContainer {...MARKS} config={{ pagas: { label: "Pagas" } }} className="h-40">
        <svg />
      </ChartContainer>
    ),
  },
  {
    name: "ChartDonut",
    node: <ChartDonut {...MARKS} data={SLICES} valueKey="total" nameKey="natureza" />,
  },
  { name: "ChartRadial", node: <ChartRadial {...MARKS} value={82} /> },
];

for (const piece of PIECES) {
  test(`${piece.name} carries id, data-* and aria-* to the root`, () => {
    render(<RivoProvider scope="local">{piece.node}</RivoProvider>);

    // By `id`, and not by the render container: the palette and the calendar
    // shell paint their root inside the portal, outside the mounted tree.
    const root = document.getElementById(ID);

    expect(root).not.toBeNull();
    expect(root!.getAttribute("data-test")).toBe("yes");
    expect(root!.getAttribute("aria-label")).toBe(LABEL);
  });
}

/*
 * The caller's `aria-label` beats the piece's own.
 *
 * Two of the nine already wrote their own `aria-label` - the calendar shell
 * takes it from `title`, and the arc takes it from the percentage. In them the
 * spread has to come AFTER the attribute, or the piece's default swallows the
 * label written from outside and nobody finds out: nothing breaks, the name
 * is just wrong. The guard above would already fail, but only here is the why
 * written down.
 */
test("the caller's label beats the piece's default, and not the other way around", () => {
  render(
    <RivoProvider scope="local">
      <ChartRadial value={82} label="Da meta do mês" aria-label={LABEL} />
    </RivoProvider>,
  );

  const arc = document.querySelector("[role=img]");
  expect(arc!.getAttribute("aria-label")).toBe(LABEL);
});

/*
 * The tree is the only one of the nine whose root already had its own
 * `onKeyDown` - and arrow navigation lives in it. Spreading the props
 * carelessly left only one of the two standing, and the silent choice would
 * belong to whoever wrote the piece, and not to whoever uses it.
 */
test("the caller's onKeyDown runs alongside the tree arrows", () => {
  let heard = 0;

  const { container } = render(
    <RivoProvider scope="local">
      <Tree
        items={[{ id: "financeiro", label: "Financeiro" }]}
        onKeyDown={() => {
          heard += 1;
        }}
      />
    </RivoProvider>,
  );

  const tree = container.querySelector("[role=tree]")!;
  const row = container.querySelector<HTMLElement>("[role=treeitem]")!;
  row.focus();

  const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true });
  tree.dispatchEvent(event);

  expect(heard).toBe(1);
});
