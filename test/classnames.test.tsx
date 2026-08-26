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
import { Sheet, SheetContent } from "../src/components/sheet";
import { DataTable, type Column } from "../src/components/data-table";

/*
 * O gancho de estilo por parte.
 *
 * Abaixo da raiz, cada peca era no selado: a trilha do Progress, o pino do
 * Slider, a marca do Checkbox, a linha da tabela e a tarja do dialogo - que e
 * irma do painel dentro do portal, e por isso nem className nem variante de
 * descendente alcancavam. O contorno que sobrava era [&_tbody_tr], que acopla
 * a tela de quem usa a arvore interna da peca: uma div que vira span dentro da
 * biblioteca quebra a tela de alguem sem aviso e sem erro.
 *
 * Os nomes das partes sao os mesmos da secao "Partes" de cada pagina.
 */

function comTema(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** A parte vestida, conferindo que a classe caiu no no certo e nao na raiz. */
function veste(container: HTMLElement, marca: string, base: string) {
  const alvo = container.ownerDocument.querySelector(`.${marca}`);
  expect(alvo).not.toBeNull();
  expect(alvo!.className).toContain(base);
}

test("a barra deixa vestir trilha e indicador", () => {
  const { container } = comTema(
    <Progress
      value={40}
      aria-label="Enviando"
      classNames={{ track: "trilha-x", indicator: "indicador-x" }}
    />,
  );

  veste(container, "trilha-x", "bg-skeleton");
  veste(container, "indicador-x", "bg-accent");
});

test("a medida deixa vestir as mesmas partes que a barra", () => {
  const { container } = comTema(
    <Meter value={62} aria-label="Cota" classNames={{ track: "trilha-y", indicator: "ind-y" }} />,
  );

  veste(container, "trilha-y", "bg-skeleton");
  veste(container, "ind-y", "bg-accent");
});

test("a faixa deixa vestir trilha, indicador e pino", () => {
  const { container } = comTema(
    <Slider
      defaultValue={30}
      thumbLabel="Desconto"
      classNames={{ track: "trilha-z", indicator: "ind-z", thumb: "pino-z" }}
    />,
  );

  veste(container, "trilha-z", "bg-skeleton");
  veste(container, "ind-z", "bg-accent");
  veste(container, "pino-z", "rounded-pill");
});

test("a caixa deixa vestir o quadrado e o rotulo", () => {
  const { container } = comTema(
    <Checkbox classNames={{ box: "caixa-x", label: "rotulo-x" }}>ISS retido</Checkbox>,
  );

  veste(container, "caixa-x", "rounded-sm");
  veste(container, "rotulo-x", "text-fg");
});

test("labelClassName continua valendo, com o nome antigo", () => {
  // Era o unico gancho de parte da biblioteca inteira. Quem ja usa nao paga
  // por termos generalizado.
  const { container } = comTema(<Checkbox labelClassName="rotulo-velho">Aceito</Checkbox>);

  veste(container, "rotulo-velho", "text-fg");
});

test("a chave deixa vestir o pino", () => {
  const { container } = comTema(<Switch aria-label="Avisar" classNames={{ thumb: "pino-s" }} />);

  veste(container, "pino-s", "rounded-pill");
});

test("o circulo deixa vestir a marca de dentro", () => {
  const { container } = comTema(
    <RadioGroup defaultValue="pix">
      <Radio value="pix" classNames={{ indicator: "marca-r" }}>
        Pix
      </Radio>
    </RadioGroup>,
  );

  veste(container, "marca-r", "rounded-pill");
});

test("o dialogo deixa vestir a tarja, que e irma do painel no portal", () => {
  // O nivel 6: nem className nem [&_x] alcancam, porque a tarja nao esta
  // dentro do painel - as duas sao filhas do portal.
  const { container } = comTema(
    <Dialog open>
      <DialogContent classNames={{ backdrop: "tarja-d" }}>Corpo</DialogContent>
    </Dialog>,
  );

  veste(container, "tarja-d", "bg-overlay");
});

test("a folha lateral deixa vestir a tarja tambem", () => {
  const { container } = comTema(
    <Sheet open>
      <SheetContent classNames={{ backdrop: "tarja-f" }}>Corpo</SheetContent>
    </Sheet>,
  );

  veste(container, "tarja-f", "bg-overlay");
});

type Nota = { id: string; numero: string };
const COLUNAS: Column<Nota>[] = [{ key: "numero", header: "Numero" }];
const NOTAS: Nota[] = [{ id: "1", numero: "4813" }];

test("a tabela deixa vestir linha, celula e cabecalho", () => {
  // O contorno de hoje e [&_tbody_tr:hover]:bg-accent-subtle, que so funciona
  // enquanto a arvore interna nao mudar.
  const { container } = comTema(
    <DataTable
      data={NOTAS}
      columns={COLUNAS}
      rowKey={(nota) => nota.id}
      classNames={{ row: "linha-t", cell: "celula-t", head: "cabeca-t" }}
    />,
  );

  veste(container, "cabeca-t", "uppercase");
  veste(container, "linha-t", "border-b");
  veste(container, "celula-t", "align-middle");
  expect(screen.getByText("4813")).toBeDefined();
});
