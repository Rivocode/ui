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
 * As cinco pecas que dividem o `floatingPanel` dividiam a aparencia e nao o
 * contrato: o Popover expunha `side`, `align` e `sideOffset`, o Tooltip so o
 * `side`, e o Menu, o Select e o Combobox nenhum dos tres. Quem escrevia a
 * tela descobria a diferenca uma peca de cada vez, e o contorno era montar o
 * `Positioner` da Base UI na mao - que e o que a skill manda nunca fazer.
 *
 * O lado e o alinhamento sao mensuraveis sem navegador: a Base UI espelha os
 * dois no proprio popup, em `data-side` e `data-align`. A folga nao e - ela
 * so existe depois do calculo de layout, que o happy-dom nao faz - e por isso
 * quem a guarda e o teste de fonte no fim do arquivo.
 */

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** O popup, achado pelo texto que ele carrega. */
function panelOf(text: string) {
  return screen.getByText(text).closest("[data-side]")!;
}

const CUSTOMERS = ["Clinica Sao Lucas"];
const OPTIONS = [{ label: "Abertas", value: "abertas" }];

test("o painel de conteudo livre aceita lado e alinhamento", () => {
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

test("o menu aceita lado e alinhamento", () => {
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

test("a lista do select aceita lado e alinhamento", () => {
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

test("sem pedido de lado, o select mantem o alinhamento pelo item escolhido", () => {
  // O modo padrao da Base UI sobrepoe o painel ao gatilho para casar o item
  // escolhido com o texto dele, e nesse modo o posicionador responde
  // `data-side="none"`. E o que o select sempre fez, e continua fazendo para
  // quem nao pede nada - as tres props novas e que desligam o modo, senao
  // seriam tres props sem efeito.
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

test("o painel da busca aceita lado e alinhamento", () => {
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

test("a dica ganha o alinhamento que so o popover tinha", () => {
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

test("as cinco tiram a folga padrao do mesmo lugar", async () => {
  // O Popover abria a 8 e as outras quatro a 6, e a diferenca so aparece com
  // dois paineis abertos lado a lado - que e onde ninguem vai conferir. O
  // numero agora e um so, e este teste guarda que nenhuma peca volte a cravar
  // o proprio: o que a fonte pode escrever e o nome da constante.
  const files = ["popover", "menu", "select", "combobox", "tooltip"];

  expect(FLOATING_SIDE_OFFSET).toBe(6);

  for (const file of files) {
    const source = await Bun.file(`src/components/${file}.tsx`).text();
    expect(`${file}: ${/sideOffset=\{\d/.test(source)}`).toBe(`${file}: false`);
    expect(`${file}: ${source.includes("FLOATING_SIDE_OFFSET")}`).toBe(`${file}: true`);
  }
});
