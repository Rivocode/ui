import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Menu, MenuContent, MenuItem } from "../src/components/menu";
import { Menubar, MenubarTrigger } from "../src/components/menubar";
import { InputGroup, InputPrefix } from "../src/components/input-group";
import { Input } from "../src/components/field";
import { Command, type CommandGroup } from "../src/components/command";
import { NumberField } from "../src/components/number-field";

/*
 * The friction the audit measured: nothing here was broken, and each item
 * cost a trip to the .d.ts that the documentation should have saved.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("the menu bar has its own trigger, with the style inside the piece", () => {
  // The MenuTrigger ships unstyled on purpose, because its common use is
  // render={<Button/>} and two style sources would fight. The one who pays for
  // it is the Menubar: the doc example repeated the same five classes on each
  // item, and every bar in the organization would repeat them again.
  withTheme(
    <Menubar>
      <Menu>
        <MenubarTrigger>Arquivo</MenubarTrigger>
        <MenuContent>
          <MenuItem>Nova nota</MenuItem>
        </MenuContent>
      </Menu>
    </Menubar>,
  );

  const trigger = screen.getByText("Arquivo");
  expect(trigger.className).toContain("rounded-sm");
  expect(trigger.className).toContain("hover:bg-accent-subtle");
});

test("the field frame follows the three field sizes", () => {
  // The Input has sm, md and lg; the frame hardcoded the medium height, so a
  // small field inside it came out with the medium padding.
  withTheme(
    <InputGroup size="sm">
      <InputPrefix>R$</InputPrefix>
      <Input aria-label="Valor" size="sm" />
    </InputGroup>,
  );

  const frame = screen.getByLabelText("Valor").parentElement!;
  expect(frame.className).toContain("--rc-control-sm");
});

test("the number field follows the three sizes", () => {
  // Same defect as the frame, one file over: the height was hardcoded on the
  // Group and the input's `h-full` overrode the one inputVariants brought, so
  // `size="sm"` changed font and padding and the box stayed medium.
  withTheme(<NumberField size="sm" aria-label="Parcelas" defaultValue={3} />);

  const frame = screen.getByLabelText("Parcelas").closest("div")!;
  expect(frame.className).toContain("--rc-control-sm");
});

test("the words that find the item can be a list", () => {
  // The JSDoc described a list of words and the type accepted a single string.
  const groups: CommandGroup[] = [
    {
      label: "Ir para",
      items: [
        {
          id: "notas",
          label: "Notas fiscais",
          keywords: ["nf", "fatura", "boleto"],
          onSelect: () => {},
        },
      ],
    },
  ];

  withTheme(<Command open onOpenChange={() => {}} groups={groups} />);
  expect(screen.getByText("Notas fiscais")).toBeDefined();
});
