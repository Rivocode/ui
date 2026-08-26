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

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/** A parte vestida, conferindo que a classe caiu no no certo e nao na raiz. */
function wears(container: HTMLElement, marker: string, base: string) {
  const target = container.ownerDocument.querySelector(`.${marker}`);
  expect(target).not.toBeNull();
  expect(target!.className).toContain(base);
}

test("a barra deixa vestir trilha e indicador", () => {
  const { container } = withTheme(
    <Progress
      value={40}
      aria-label="Enviando"
      classNames={{ track: "trilha-x", indicator: "indicador-x" }}
    />,
  );

  wears(container, "trilha-x", "bg-skeleton");
  wears(container, "indicador-x", "bg-accent");
});

test("a medida deixa vestir as mesmas partes que a barra", () => {
  const { container } = withTheme(
    <Meter value={62} aria-label="Cota" classNames={{ track: "trilha-y", indicator: "ind-y" }} />,
  );

  wears(container, "trilha-y", "bg-skeleton");
  wears(container, "ind-y", "bg-accent");
});

test("a faixa deixa vestir trilha, indicador e pino", () => {
  const { container } = withTheme(
    <Slider
      defaultValue={30}
      thumbLabel="Desconto"
      classNames={{ track: "trilha-z", indicator: "ind-z", thumb: "pino-z" }}
    />,
  );

  wears(container, "trilha-z", "bg-skeleton");
  wears(container, "ind-z", "bg-accent");
  wears(container, "pino-z", "rounded-pill");
});

test("a caixa deixa vestir o quadrado e o rotulo", () => {
  const { container } = withTheme(
    <Checkbox classNames={{ box: "caixa-x", label: "rotulo-x" }}>ISS retido</Checkbox>,
  );

  wears(container, "caixa-x", "rounded-sm");
  wears(container, "rotulo-x", "text-fg");
});

test("labelClassName continua valendo, com o nome antigo", () => {
  // Era o unico gancho de parte da biblioteca inteira. Quem ja usa nao paga
  // por termos generalizado.
  const { container } = withTheme(<Checkbox labelClassName="rotulo-velho">Aceito</Checkbox>);

  wears(container, "rotulo-velho", "text-fg");
});

test("a chave deixa vestir o pino", () => {
  const { container } = withTheme(<Switch aria-label="Avisar" classNames={{ thumb: "pino-s" }} />);

  wears(container, "pino-s", "rounded-pill");
});

test("o circulo deixa vestir a marca de dentro", () => {
  const { container } = withTheme(
    <RadioGroup defaultValue="pix">
      <Radio value="pix" classNames={{ indicator: "marca-r" }}>
        Pix
      </Radio>
    </RadioGroup>,
  );

  wears(container, "marca-r", "rounded-pill");
});

test("o dialogo deixa vestir a tarja, que e irma do painel no portal", () => {
  // O nivel 6: nem className nem [&_x] alcancam, porque a tarja nao esta
  // dentro do painel - as duas sao filhas do portal.
  const { container } = withTheme(
    <Dialog open>
      <DialogContent classNames={{ backdrop: "tarja-d" }}>Corpo</DialogContent>
    </Dialog>,
  );

  wears(container, "tarja-d", "bg-overlay");
});

test("a folha lateral deixa vestir a tarja tambem", () => {
  const { container } = withTheme(
    <Sheet open>
      <SheetContent classNames={{ backdrop: "tarja-f" }}>Corpo</SheetContent>
    </Sheet>,
  );

  wears(container, "tarja-f", "bg-overlay");
});

type Invoice = { id: string; numero: string };
const COLUMNS: Column<Invoice>[] = [{ key: "numero", header: "Numero" }];
const INVOICES: Invoice[] = [{ id: "1", numero: "4813" }];

test("a tabela deixa vestir linha, celula e cabecalho", () => {
  // O contorno de hoje e [&_tbody_tr:hover]:bg-accent-subtle, que so funciona
  // enquanto a arvore interna nao mudar.
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
