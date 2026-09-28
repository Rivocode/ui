import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { FLOATING_SIDE_OFFSET } from "../src/lib/positioning";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "../src/components/menu";
import { Popover, PopoverContent, PopoverTrigger } from "../src/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../src/components/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "../src/components/combobox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../src/components/tooltip";

/*
 * The five pieces that share `floatingPanel` shared the look and not the
 * contract: Popover exposed `side`, `align` and `sideOffset`, Tooltip only
 * `side`, and Menu, Select and Combobox none of the three. Whoever wrote the
 * screen found the difference one piece at a time, and the workaround was to
 * assemble Base UI's `Positioner` by hand - which is what the skill says never
 * to do.
 *
 * Side and alignment are measurable without a browser: Base UI mirrors both
 * on the popup itself, in `data-side` and `data-align`. The offset is not - it
 * only exists after layout, which happy-dom does not compute - and that is why
 * the source test at the end of the file guards it.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** The popup, found by the text it carries. */
function panelOf(text: string) {
  return screen.getByText(text).closest("[data-side]")!;
}

const CUSTOMERS = ["Clinica Sao Lucas"];
const OPTIONS = [{ label: "Abertas", value: "abertas" }];

test("the free-content panel accepts side and alignment", () => {
  withTheme(
    <Popover defaultOpen>
      <PopoverTrigger>Filtros</PopoverTrigger>
      <PopoverContent side="right" align="start">
        <span>Corpo do popover</span>
      </PopoverContent>
    </Popover>,
  );

  const panel = panelOf("Corpo do popover");
  expect(panel.getAttribute("data-side")).toBe("right");
  expect(panel.getAttribute("data-align")).toBe("start");
});

test("the menu accepts side and alignment", () => {
  withTheme(
    <Menu defaultOpen>
      <MenuTrigger aria-label="Mais acoes">...</MenuTrigger>
      <MenuContent side="top" align="end">
        <MenuItem>Baixar PDF</MenuItem>
      </MenuContent>
    </Menu>,
  );

  const panel = panelOf("Baixar PDF");
  expect(panel.getAttribute("data-side")).toBe("top");
  expect(panel.getAttribute("data-align")).toBe("end");
});

test("the select list accepts side and alignment", () => {
  withTheme(
    <Select items={OPTIONS} defaultOpen>
      <SelectTrigger aria-label="Status">Abertas</SelectTrigger>
      <SelectContent side="right" align="start">
        <SelectItem value="abertas">Abertas</SelectItem>
      </SelectContent>
    </Select>,
  );

  const panel = screen.getAllByText("Abertas").at(-1)!.closest("[data-side]")!;
  expect(panel.getAttribute("data-side")).toBe("right");
  expect(panel.getAttribute("data-align")).toBe("start");
});

test("with no side requested, the select keeps aligning by the chosen item", () => {
  // Base UI's default mode lays the panel over the trigger to match the chosen
  // item with its text, and in that mode the positioner answers
  // `data-side="none"`. It is what the select always did, and it keeps doing
  // so for whoever asks for nothing - it is the three new props that turn the
  // mode off, otherwise they would be three props with no effect.
  withTheme(
    <Select items={OPTIONS} defaultOpen>
      <SelectTrigger aria-label="Status">Abertas</SelectTrigger>
      <SelectContent>
        <SelectItem value="abertas">Abertas</SelectItem>
      </SelectContent>
    </Select>,
  );

  const panel = screen.getAllByText("Abertas").at(-1)!.closest("[data-side]")!;
  expect(panel.getAttribute("data-side")).toBe("none");
});

test("the search panel accepts side and alignment", () => {
  withTheme(
    <Combobox items={CUSTOMERS} defaultOpen>
      <ComboboxInput placeholder="Buscar cliente" />
      <ComboboxContent side="top" align="end">
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>,
  );

  const panel = panelOf("Clinica Sao Lucas");
  expect(panel.getAttribute("data-side")).toBe("top");
  expect(panel.getAttribute("data-align")).toBe("end");
});

test("the tooltip gains the alignment that only the popover had", () => {
  withTheme(
    <Tooltip defaultOpen>
      <TooltipTrigger aria-label="Excluir">x</TooltipTrigger>
      <TooltipContent side="left" align="end">
        Excluir nota
      </TooltipContent>
    </Tooltip>,
  );

  const panel = panelOf("Excluir nota");
  expect(panel.getAttribute("data-side")).toBe("left");
  expect(panel.getAttribute("data-align")).toBe("end");
});

test("all five take the default offset from the same place", async () => {
  // Popover opened at 8 and the other four at 6, and the difference only shows
  // with two panels open side by side - which is where nobody will check. The
  // number is now a single one, and this test guards that no piece goes back
  // to hardcoding its own: what the source may write is the constant's name.
  const files = ["popover", "menu", "select", "combobox", "tooltip"];

  expect(FLOATING_SIDE_OFFSET).toBe(6);

  for (const file of files) {
    const source = await Bun.file(`src/components/${file}.tsx`).text();
    expect(`${file}: ${/sideOffset=\{\d/.test(source)}`).toBe(`${file}: false`);
    expect(`${file}: ${source.includes("FLOATING_SIDE_OFFSET")}`).toBe(`${file}: true`);
  }
});
