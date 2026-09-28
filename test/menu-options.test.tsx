import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "../src/components/menu";

/*
 * The menu that chooses, and not only the one that acts.
 *
 * "Which columns to show" and "sort by" could only be built with a Popover
 * and loose Checkboxes inside. What was lost was not style: the `aria-checked`
 * of each row, which is how the screen reader says whether the column is on,
 * and menu navigation, which moves by arrow and by first letter. Both come for
 * free from Base UI and were sitting inside the package.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

const COLUMNS = ["Numero", "Cliente", "Valor"];

function ColumnsMenu() {
  return (
    <Menu defaultOpen>
      <MenuTrigger aria-label="Colunas">Colunas</MenuTrigger>
      <MenuContent>
        {COLUMNS.map((column) => (
          <MenuCheckboxItem key={column} defaultChecked={column !== "Valor"}>
            {column}
          </MenuCheckboxItem>
        ))}
      </MenuContent>
    </Menu>
  );
}

test("the column that is on announces itself on, and the one that is off, off", () => {
  withTheme(<ColumnsMenu />);

  const items = screen.getAllByRole("menuitemcheckbox");
  expect(items).toHaveLength(3);
  expect(items.map((item) => item.getAttribute("aria-checked"))).toEqual(["true", "true", "false"]);
});

test("checking a column does not close the menu, because whoever picks columns picks several", () => {
  withTheme(<ColumnsMenu />);

  const amount = screen.getByRole("menuitemcheckbox", { name: "Valor" });
  fireEvent.click(amount);

  expect(screen.getByRole("menuitemcheckbox", { name: "Valor" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(3);
});

test("the check mark has its own column, which exists even on the unchecked item", () => {
  // Without a column that always exists, turning on a row pushed the text of
  // all the others sideways: the Base UI indicator only mounts when the item
  // is checked.
  const { container } = withTheme(<ColumnsMenu />);

  const marks = container.ownerDocument.querySelectorAll('[role="menuitemcheckbox"] > span.size-4');
  expect(marks).toHaveLength(3);
});

test("the check mark column is named from outside, like the bar track", () => {
  withTheme(
    <Menu defaultOpen>
      <MenuTrigger aria-label="Colunas">Colunas</MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem classNames={{ indicator: "marca-x" }}>Numero</MenuCheckboxItem>
      </MenuContent>
    </Menu>,
  );

  const mark = document.querySelector(".marca-x")!;
  expect(mark.className).toContain("text-accent-text");
});

test("the check mark dims along with the disabled item", () => {
  // The sibling rule: in Checkbox and Radio the mark follows the dimmed
  // control. Here it stayed full green next to dimmed text, and the column
  // that could not be turned off was the most vivid in the list.
  withTheme(
    <Menu defaultOpen>
      <MenuTrigger aria-label="Colunas">Colunas</MenuTrigger>
      <MenuContent>
        <MenuCheckboxItem defaultChecked disabled classNames={{ indicator: "marca-y" }}>
          Numero
        </MenuCheckboxItem>
      </MenuContent>
    </Menu>,
  );

  const mark = document.querySelector(".marca-y")!;
  expect(mark.className).toContain("group-data-[disabled]/item:text-fg-disabled");
  expect(mark.closest('[role="menuitemcheckbox"]')!.className).toContain("group/item");
});

function SortMenu(props: { onValueChange?: (value: string) => void } = {}) {
  return (
    <Menu defaultOpen>
      <MenuTrigger aria-label="Ordenar">Ordenar</MenuTrigger>
      <MenuContent>
        <MenuRadioGroup defaultValue="data" label="Ordenar por" {...props}>
          <MenuRadioItem value="data">Data de emissão</MenuRadioItem>
          <MenuRadioItem value="valor">Valor</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

test("the menu single choice marks only one option, and says which", () => {
  withTheme(<SortMenu />);

  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((option) => option.getAttribute("aria-checked"))).toEqual(["true", "false"]);
});

test("choosing another order unselects the previous one", () => {
  const seen: string[] = [];
  withTheme(<SortMenu onValueChange={(value) => seen.push(value)} />);

  fireEvent.click(screen.getByRole("menuitemradio", { name: "Valor" }));

  expect(seen).toEqual(["valor"]);
  expect(
    screen.getAllByRole("menuitemradio").map((option) => option.getAttribute("aria-checked")),
  ).toEqual(["false", "true"]);
});

test("the group title names the group, and does not float loose next to it", () => {
  // The `label` comes along because Base UI wires the group's `aria-labelledby`
  // to the title that lives inside it. A title written outside names nothing,
  // and that breaks no type check at all.
  withTheme(<SortMenu />);

  const group = screen.getByRole("group");
  const title = screen.getByText("Ordenar por");

  expect(group.getAttribute("aria-labelledby")).toBe(title.id);
  expect(group.contains(title)).toBe(true);
});

function BranchMenu() {
  return (
    <Menu defaultOpen>
      <MenuTrigger aria-label="Ações">Ações</MenuTrigger>
      <MenuContent>
        <MenuItem>Baixar PDF</MenuItem>
        <MenuSeparator />
        <MenuSubmenu>
          <MenuSubmenuTrigger>Exportar</MenuSubmenuTrigger>
          <MenuContent>
            <MenuItem>XML</MenuItem>
            <MenuItem>CSV</MenuItem>
          </MenuContent>
        </MenuSubmenu>
      </MenuContent>
    </Menu>
  );
}

test("the closed branch does not render the items inside", () => {
  withTheme(<BranchMenu />);

  expect(screen.getByText("Exportar")).toBeDefined();
  expect(screen.queryByText("XML")).toBeNull();
});

test("the item that opens the branch announces itself as having a menu below", () => {
  withTheme(<BranchMenu />);

  const branch = screen.getByRole("menuitem", { name: "Exportar" });
  expect(branch.getAttribute("aria-haspopup")).toBe("menu");
  expect(branch.getAttribute("aria-expanded")).toBe("false");

  fireEvent.click(branch);

  expect(screen.getByRole("menuitem", { name: "Exportar" }).getAttribute("aria-expanded")).toBe(
    "true",
  );
  expect(screen.getByText("XML")).toBeDefined();
});

test("the item that navigates renders as a real anchor", () => {
  // The gain is what only an anchor has: middle click opens another tab, right
  // click copies the address, and the browser bar shows where it leads.
  withTheme(
    <Menu defaultOpen>
      <MenuTrigger aria-label="Conta">Conta</MenuTrigger>
      <MenuContent>
        <MenuLinkItem href="/perfil">Meu perfil</MenuLinkItem>
      </MenuContent>
    </Menu>,
  );

  const link = screen.getByRole("menuitem", { name: "Meu perfil" });
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("/perfil");
});
