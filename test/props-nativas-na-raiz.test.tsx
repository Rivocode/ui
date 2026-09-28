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
 * Nove pecas tinham o tipo de props escrito como objeto fechado, e por isso
 * nao aceitavam `id`, `data-*` nem `aria-*`. Nao e detalhe: sem `id` nao ha
 * `aria-describedby` apontando para elas, sem `data-*` nao ha seletor de teste
 * de ponta a ponta nem marcacao de analitica, e o contorno era sempre o mesmo
 * - embrulhar a peca numa `div` so para pendurar o atributo, o que muda o
 * layout de quem esta em grade ou em flex.
 *
 * A guarda monta cada uma das nove com os tres atributos e vai procura-los no
 * DOM. Ela pega os dois defeitos: o tipo que nao aceita, que para no
 * compilador, e o `...rest` esquecido, que so montar revela.
 */

const ID = "raiz-sob-teste";
const LABEL = "Rotulo escrito por quem chama";

/** Os tres atributos, do jeito que quem monta a tela os escreveria. */
const MARKS = { id: ID, "data-teste": "sim", "aria-label": LABEL } as const;

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
  test(`${piece.name} leva id, data-* e aria-* ate a raiz`, () => {
    render(<RivoProvider scope="local">{piece.node}</RivoProvider>);

    // Pelo `id`, e nao pelo contentor do render: a paleta e a casca do
    // calendario pintam a raiz delas dentro do portal, fora da arvore montada.
    const root = document.getElementById(ID);

    expect(root).not.toBeNull();
    expect(root!.getAttribute("data-teste")).toBe("sim");
    expect(root!.getAttribute("aria-label")).toBe(LABEL);
  });
}

/*
 * O `aria-label` de quem chama vence o da peca.
 *
 * Duas das nove ja escreviam um `aria-label` proprio - a casca do calendario
 * tira o dela do `title`, e o arco tira da porcentagem. Nelas o espalhamento
 * tem que vir DEPOIS do atributo, senao o padrao da peca engole o rotulo
 * escrito de fora e ninguem fica sabendo: nada quebra, o nome e que fica
 * errado. A guarda acima ja falharia, mas so aqui esta dito por que.
 */
test("o rotulo de quem chama vence o padrao da peca, e nao o contrario", () => {
  render(
    <RivoProvider scope="local">
      <ChartRadial value={82} label="Da meta do mês" aria-label={LABEL} />
    </RivoProvider>,
  );

  const arc = document.querySelector("[role=img]");
  expect(arc!.getAttribute("aria-label")).toBe(LABEL);
});

/*
 * A arvore e a unica das nove cuja raiz ja tinha um `onKeyDown` proprio - e a
 * navegacao por seta mora nele. Espalhar as props sem cuidado deixava so um
 * dos dois de pe, e a escolha silenciosa seria de quem escreveu a peca, e nao
 * de quem a usa.
 */
test("o onKeyDown de quem chama corre junto com as setas da arvore", () => {
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
