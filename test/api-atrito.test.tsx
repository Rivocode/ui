import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Menu, MenuContent, MenuItem } from "../src/components/menu";
import { Menubar, MenubarTrigger } from "../src/components/menubar";
import { InputGroup, InputPrefix } from "../src/components/input-group";
import { Input } from "../src/components/field";
import { Command, type CommandGroup } from "../src/components/command";

/*
 * O atrito que a auditoria mediu: nada aqui estava quebrado, e cada item
 * custava uma ida ao .d.ts que a documentacao deveria ter poupado.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

test("a barra de menus tem gatilho proprio, com o estilo dentro da peca", () => {
  // O MenuTrigger sai sem estilo de proposito, porque o uso comum dele e
  // render={<Button/>} e duas fontes de estilo brigariam. Quem paga por isso e
  // a Menubar: o exemplo da doc repetia as mesmas cinco classes em cada item,
  // e toda barra da organizacao ia repetir de novo.
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

test("a moldura de campo acompanha os tres tamanhos do campo", () => {
  // O Input tem sm, md e lg; a moldura cravava a altura media, entao um campo
  // pequeno dentro dela saia com o respiro do medio.
  withTheme(
    <InputGroup size="sm">
      <InputPrefix>R$</InputPrefix>
      <Input aria-label="Valor" size="sm" />
    </InputGroup>,
  );

  const frame = screen.getByLabelText("Valor").parentElement!;
  expect(frame.className).toContain("--rc-control-sm");
});

test("as palavras que acham o item podem ser uma lista", () => {
  // O JSDoc descrevia uma lista de palavras e o tipo aceitava uma string so.
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
