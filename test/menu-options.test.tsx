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
 * O menu que escolhe, e nao so o que age.
 *
 * "Quais colunas mostrar" e "ordenar por" so davam para montar com um Popover
 * e Checkbox soltos dentro. O que se perdia nao era estilo: o `aria-checked`
 * de cada linha, que e como o leitor de tela diz se a coluna esta ligada, e a
 * navegacao de menu, que anda por seta e por primeira letra. Os dois vem de
 * graca da Base UI e ficavam do lado de dentro do pacote.
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

test("a coluna ligada se anuncia ligada, e a desligada desligada", () => {
  withTheme(<ColumnsMenu />);

  const items = screen.getAllByRole("menuitemcheckbox");
  expect(items).toHaveLength(3);
  expect(items.map((item) => item.getAttribute("aria-checked"))).toEqual(["true", "true", "false"]);
});

test("marcar uma coluna nao fecha o menu, porque quem escolhe colunas escolhe varias", () => {
  withTheme(<ColumnsMenu />);

  const amount = screen.getByRole("menuitemcheckbox", { name: "Valor" });
  fireEvent.click(amount);

  expect(screen.getByRole("menuitemcheckbox", { name: "Valor" }).getAttribute("aria-checked")).toBe(
    "true",
  );
  expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(3);
});

test("a marca tem coluna propria, que existe mesmo no item desmarcado", () => {
  // Sem uma coluna que existe sempre, ligar uma linha empurrava o texto de
  // todas as outras para o lado: o indicador da Base UI so monta quando o item
  // esta marcado.
  const { container } = withTheme(<ColumnsMenu />);

  const marks = container.ownerDocument.querySelectorAll('[role="menuitemcheckbox"] > span.size-4');
  expect(marks).toHaveLength(3);
});

test("a coluna da marca tem nome de fora, como a trilha da barra", () => {
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

test("a marca apaga junto com o item desabilitado", () => {
  // A regra das irmas: no Checkbox e no Radio a marca acompanha o controle
  // apagado. Aqui ela ficava verde cheia ao lado de um texto apagado, e a
  // coluna que nao pode ser desligada era a mais viva da lista.
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

test("a escolha unica do menu marca uma opcao so, e diz qual", () => {
  withTheme(<SortMenu />);

  const options = screen.getAllByRole("menuitemradio");
  expect(options.map((option) => option.getAttribute("aria-checked"))).toEqual(["true", "false"]);
});

test("escolher outra ordem desescolhe a anterior", () => {
  const seen: string[] = [];
  withTheme(<SortMenu onValueChange={(value) => seen.push(value)} />);

  fireEvent.click(screen.getByRole("menuitemradio", { name: "Valor" }));

  expect(seen).toEqual(["valor"]);
  expect(
    screen.getAllByRole("menuitemradio").map((option) => option.getAttribute("aria-checked")),
  ).toEqual(["false", "true"]);
});

test("o titulo do grupo nomeia o grupo, e nao fica solto ao lado dele", () => {
  // O `label` vem junto porque a Base UI liga o `aria-labelledby` do grupo ao
  // titulo que vive dentro dele. Titulo escrito por fora nao nomeia nada, e
  // isso nao quebra teste de tipo nenhum.
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

test("o ramo fechado nao entrega os itens de dentro", () => {
  withTheme(<BranchMenu />);

  expect(screen.getByText("Exportar")).toBeDefined();
  expect(screen.queryByText("XML")).toBeNull();
});

test("o item que abre o ramo se anuncia como quem tem menu embaixo", () => {
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

test("o item que navega sai como ancora de verdade", () => {
  // O ganho e o que so a ancora tem: botao do meio em outra aba, botao direito
  // copia o endereco, e a barra do navegador mostra para onde ele leva.
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
