import { expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, type ChartConfig } from "../src/chart/chart";
import { Checkbox } from "../src/components/checkbox";
import { Clipboard } from "../src/components/clipboard";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxInput,
  ComboboxValue,
} from "../src/components/combobox";
import { DataTable, type Column } from "../src/components/data-table";
import { Editable } from "../src/components/editable";
import { EventCalendar } from "../src/components/event-calendar";
import { PasswordInput } from "../src/components/password-input";
import { QueryBoundary } from "../src/components/query-boundary";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";
import { TagsInput } from "../src/components/tags-input";
import { VirtualList } from "../src/components/virtual-list";
import { LOADED_ANNOUNCEMENT, LOADING_ANNOUNCEMENT } from "../src/lib/loading-announcement";

/*
 * As quatro divergencias que a auditoria mediu entre pecas IRMAS de
 * formulario. Nenhuma estava quebrada: cada uma cobrava um preco diferente
 * para fazer a mesma coisa duas telas adiante.
 *
 * O que este arquivo guarda e o contrato, e nao o desenho: que `defaultValue`
 * funciona sem `value`, que a classe de cada parte cai no no certo, e que o
 * botao de remover tem nome de verdade.
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

/* --- 1. controlado-obrigatorio virou o par das cinco irmas --------------- */

test("o TagsInput guarda a propria lista quando so recebe defaultValue", () => {
  // Um filtro de tela nao envia nada e nao guarda nada: pagar um `useState`
  // para existir era o preco que so esta peca cobrava.
  withTheme(<TagsInput aria-label="Palavras do filtro" defaultValue={["nf-e"]} />);

  const field = screen.getByLabelText("Palavras do filtro");
  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByText("nf-e")).toBeDefined();
  expect(screen.getByText("urgente")).toBeDefined();
});

test("o xis tira a ficha tambem com a lista por conta da peca", () => {
  withTheme(<TagsInput aria-label="Marcadores" defaultValue={["nf-e", "urgente"]} />);

  fireEvent.click(screen.getByRole("button", { name: "Remover urgente" }));

  expect(screen.queryByText("urgente")).toBeNull();
  expect(screen.getByText("nf-e")).toBeDefined();
});

test("com `value`, quem manda continua sendo de fora", () => {
  // O par nao pode ter virado "o defaultValue vence": passar `value` e dizer
  // que a lista mora no app, e a peca nao pode desenhar outra.
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      value={["nf-e"]}
      defaultValue={["ignorada"]}
      onValueChange={() => {}}
    />,
  );

  const field = screen.getByLabelText("Marcadores");
  fireEvent.change(field, { target: { value: "urgente" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByText("nf-e")).toBeDefined();
  expect(screen.queryByText("urgente")).toBeNull();
  expect(screen.queryByText("ignorada")).toBeNull();
});

test("o Editable guarda o proprio texto quando so recebe defaultValue", () => {
  withTheme(<Editable defaultValue="Clínica São Lucas" label="Cliente" />);

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");
  fireEvent.change(field, { target: { value: "Clínica Aurora" } });
  fireEvent.keyDown(field, { key: "Enter" });

  expect(screen.getByRole("button", { name: /Clínica Aurora/ })).toBeDefined();
});

test("o Editable solto ainda desfaz no Escape", () => {
  withTheme(<Editable defaultValue="Clínica São Lucas" label="Cliente" />);

  fireEvent.click(screen.getByRole("button", { name: /Clínica São Lucas/ }));
  const field = screen.getByLabelText("Cliente");
  fireEvent.change(field, { target: { value: "outra coisa" } });
  fireEvent.keyDown(field, { key: "Escape" });

  expect(screen.getByRole("button", { name: /Clínica São Lucas/ })).toBeDefined();
});

/* --- 2. um nome so para o botao de remover ------------------------------- */

test("a ficha do TagsInput diz o que se remove, por `labels`", () => {
  withTheme(
    <TagsInput
      aria-label="Marcadores"
      defaultValue={["nf-e"]}
      labels={{ remove: (tag) => `Tirar o marcador ${tag}` }}
    />,
  );

  expect(screen.getByRole("button", { name: "Tirar o marcador nf-e" })).toBeDefined();
});

const CUSTOMERS = ["Clinica Sao Lucas", "Transportes Cabo Branco"];

function chips(chip: (customer: string) => React.ReactNode) {
  return withTheme(
    <Combobox items={CUSTOMERS} multiple defaultValue={CUSTOMERS}>
      <ComboboxChips>
        <ComboboxValue>{(chosen: string[]) => chosen.map(chip)}</ComboboxValue>
        <ComboboxInput placeholder="Buscar cliente" />
      </ComboboxChips>
    </Combobox>,
  );
}

test("o xis da ficha do Combobox nomeia a ficha, sem pedir nada", () => {
  // Era o caso mais grave dos quatro: `aria-label="Remover"` cravado no
  // componente, sem prop nenhuma - nao havia como traduzir nem como dizer o
  // que se remove, e tres fichas se anunciavam "Remover, Remover, Remover".
  chips((customer) => <ComboboxChip key={customer}>{customer}</ComboboxChip>);

  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Remover Transportes Cabo Branco" })).toBeDefined();
});

test("a ficha que nao e texto cai no proprio aria-label", () => {
  chips((customer) => (
    <ComboboxChip key={customer} aria-label={customer}>
      <span>{customer}</span>
    </ComboboxChip>
  ));

  expect(screen.getByRole("button", { name: "Remover Clinica Sao Lucas" })).toBeDefined();
});

test("o xis da ficha do Combobox aceita outro verbo, por `labels`", () => {
  chips((customer) => (
    <ComboboxChip key={customer} labels={{ remove: (label) => `Tirar ${label} da seleção` }}>
      {customer}
    </ComboboxChip>
  ));

  expect(screen.getByRole("button", { name: "Tirar Clinica Sao Lucas da seleção" })).toBeDefined();
});

test("trocar um nome do Clipboard nao apaga o outro", () => {
  // O objeto exigia os dois: quem trocava so o verbo perdia a confirmacao, e o
  // TypeScript e que cobrava - agora cada nome tem o proprio padrao.
  withTheme(<Clipboard value="4813" labels={{ copy: "Copiar a chave" }} />);

  expect(screen.getByRole("button", { name: "Copiar a chave" })).toBeDefined();
});

test("trocar um nome do PasswordInput nao apaga o outro", () => {
  withTheme(<PasswordInput aria-label="Senha" labels={{ show: "Revelar a senha" }} />);

  const eye = screen.getByRole("button", { name: "Revelar a senha" });
  fireEvent.click(eye);

  expect(screen.getByRole("button", { name: "Esconder senha" })).toBeDefined();
});

/* --- 3. a moldura da senha ganhou nome de parte -------------------------- */

test("a senha veste moldura, campo e botao pelo nome", () => {
  const { container } = withTheme(
    <PasswordInput
      aria-label="Senha"
      classNames={{ wrapper: "moldura-p", input: "campo-p", action: "olho-p" }}
    />,
  );

  wears(container, "moldura-p", "--rc-control-md");
  wears(container, "campo-p", "h-[var(--rc-control-md)]");
  expect(container.ownerDocument.querySelector(".campo-p")!.tagName).toBe("INPUT");
  expect(container.ownerDocument.querySelector(".olho-p")!.tagName).toBe("BUTTON");

  // A moldura e a moldura: a classe dela nao pode escorregar para o campo, que
  // e onde o `className` solto cai.
  expect(screen.getByLabelText("Senha").className).not.toContain("moldura-p");
});

test("o className da senha continua vestindo o campo, e nao a moldura", () => {
  // A peca e a unica do catalogo em que a raiz nao e o alvo do `className`.
  // Mudar isso agora trocaria em silencio a largura de toda tela de login.
  withTheme(<PasswordInput aria-label="Senha" className="campo-velho" />);

  expect(screen.getByLabelText("Senha").className).toContain("campo-velho");
});

/* --- 4. os tres controles da mesma lista -------------------------------- */

test("o circulo do Radio tem nome de fora, como a caixa do Checkbox", () => {
  const { container } = withTheme(
    <RadioGroup defaultValue="pix">
      <Radio value="pix" classNames={{ circle: "circulo-r" }}>
        Pix
      </Radio>
    </RadioGroup>,
  );

  wears(container, "circulo-r", "rounded-pill");
  expect(container.ownerDocument.querySelector(".circulo-r")!.getAttribute("role")).toBe("radio");
});

test("os tres controles poem o mesmo respiro entre o controle e o rotulo", () => {
  // Eles aparecem lado a lado na mesma tela de formulario, e o Checkbox usava
  // `gap-2` contra o `gap-3` dos outros dois: os rotulos nao alinhavam.
  withTheme(
    <>
      <Checkbox>ISS retido</Checkbox>
      <RadioGroup defaultValue="pix">
        <Radio value="pix">Pix</Radio>
      </RadioGroup>
      <Switch>Enviar o XML</Switch>
    </>,
  );

  for (const text of ["ISS retido", "Pix", "Enviar o XML"]) {
    const label = screen.getByText(text).closest("label")!;
    expect(`${text}: ${label.className.includes("gap-2")}`).toBe(`${text}: true`);
  }
});

test("nenhum dos tres desabilita por opacidade", () => {
  // `opacity-60` rebaixa borda, marca e texto de uma vez, e o `check:contrast`
  // nao mede opacidade: o par aprovado no arquivo de tema podia reprovar na
  // tela sem nada acusar.
  const { container } = withTheme(
    <>
      <Checkbox disabled>ISS retido</Checkbox>
      <RadioGroup defaultValue="pix" disabled>
        <Radio value="pix">Pix</Radio>
      </RadioGroup>
      <Switch disabled>Enviar o XML</Switch>
    </>,
  );

  for (const role of ["checkbox", "radio", "switch"]) {
    const control = container.ownerDocument.querySelector(`[role="${role}"]`)!;
    expect(`${role}: ${control.className.includes("opacity-")}`).toBe(`${role}: false`);
    expect(`${role}: ${control.className.includes("data-[disabled]:cursor-not-allowed")}`).toBe(
      `${role}: true`,
    );
    // A borda desce um degrau nos tres, e nao dois. Quando este teste nasceu a
    // decisao era nao mexer nela - `--rc-border` some a 1,30:1 contra o
    // preenchimento, e `border-strong` deixa travado igual a vivo -, e a saida
    // era nao ter saida. O `--rc-border-disabled` nasceu para essa faixa do
    // meio no mesmo dia, entao a regra passa a ser a oposta: quem trava, desce.
    expect(`${role}: ${control.className.includes("data-[disabled]:border-border-disabled")}`).toBe(
      `${role}: true`,
    );
    expect(`${role}: ${control.className.includes("data-[disabled]:bg-surface-raised")}`).toBe(
      `${role}: ${role !== "switch"}`,
    );
  }
});

test("a marca dos tres apaga junto com o controle", () => {
  // Sem isso a marca fica branca sobre a superficie apagada e some - e no
  // Switch o pino e o unico lugar onde se le se a chave esta ligada.
  const { container } = withTheme(
    <>
      <Checkbox defaultChecked disabled aria-label="ISS" />
      <RadioGroup defaultValue="pix" disabled>
        <Radio value="pix" aria-label="Pix" />
      </RadioGroup>
      <Switch defaultChecked disabled aria-label="XML" />
    </>,
  );

  const box = container.ownerDocument.querySelector('[role="checkbox"]')!;
  expect(box.className).toContain("data-[disabled]:text-fg-disabled");

  for (const selector of ['[role="radio"] > span', '[role="switch"] > span']) {
    const mark = container.ownerDocument.querySelector(selector)!;
    expect(`${selector}: ${mark.className.includes("data-[disabled]:bg-fg-disabled")}`).toBe(
      `${selector}: true`,
    );
  }
});

test("o acento so pinta o controle vivo, sem depender da ordem das classes", () => {
  // O Tailwind emite as variantes `data-[...]` em ordem alfabetica, entao
  // `data-[disabled]` vencia `data-[checked]` por sorte e PERDIA para
  // `data-[indeterminate]`: a caixa de selecionar-todas desabilitada, em
  // estado misto, saia pintada de acento cheio.
  const { container } = withTheme(
    <Checkbox indeterminate disabled aria-label="Selecionar todas" />,
  );

  const box = container.ownerDocument.querySelector('[role="checkbox"]')!;
  const classes = box.className.split(" ");
  expect(classes).toContain("data-[indeterminate]:not-data-disabled:bg-accent-text");
  expect(classes).not.toContain("data-[indeterminate]:bg-accent-text");
  expect(classes).not.toContain("data-[indeterminate]:not-data-disabled:bg-accent");
});

/* --- 5. as irmas dos finais de uma consulta ------------------------------
 *
 * Sao CINCO desde 27/08, e nao quatro: o EventCalendar nasceu ja com os
 * quatro finais. A tabela abaixo e o que impede a sexta de nascer torta, e
 * por isso ela se chama pelo papel e nao pelo numero - um numero no nome
 * envelhece na primeira peca nova, e foi o que aconteceu com o JSDoc que
 * dizia "as quatro pecas de consulta".
 * ----------------------------------------------------------------------- */

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Clinica Sao Lucas" },
  { id: "2", customer: "Transportes Cabo Branco" },
];

const INVOICE_COLUMNS: Column<Invoice>[] = [{ key: "customer", header: "Cliente" }];

const CHART_CONFIG: ChartConfig = { pagas: { label: "Pagas" } };

type Query = {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  retryLabel?: ReactNode;
};

const SISTERS: Record<string, (query: Query) => ReactNode> = {
  VirtualList: (query) => (
    <VirtualList
      items={query.isLoading ? undefined : INVOICES}
      itemKey={(invoice) => invoice.id}
      renderItem={(invoice) => <span>{invoice.customer}</span>}
      maxHeight={200}
      label="Notas"
      {...query}
    />
  ),
  QueryBoundary: (query) => (
    <QueryBoundary data={query.isLoading ? undefined : INVOICES} {...query}>
      {(invoices) => <p>{invoices.length} notas</p>}
    </QueryBoundary>
  ),
  DataTable: (query) => (
    <DataTable
      data={query.isLoading ? undefined : INVOICES}
      columns={INVOICE_COLUMNS}
      rowKey={(invoice) => invoice.id}
      {...query}
    />
  ),
  ChartContainer: (query) => (
    <ChartContainer config={CHART_CONFIG} className="h-40" {...query}>
      <svg />
    </ChartContainer>
  ),
  EventCalendar: (query) => (
    <EventCalendar
      label="Agenda"
      view="agenda"
      events={query.isLoading ? undefined : []}
      {...query}
    />
  ),
};

const sisters = Object.entries(SISTERS);

test("as irmas trocam o nome do botao de nova tentativa por `retryLabel`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isError: true, onRetry: () => {}, retryLabel: "Try again" }));
    const named = within(view.container).queryByRole("button", { name: "Try again" });

    expect(`${name}: ${named !== null}`).toBe(`${name}: true`);
    view.unmount();
  }
});

test("as quatro dizem o MESMO padrao quando ninguem passa `retryLabel`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isError: true, onRetry: () => {} }));
    const named = within(view.container).queryByRole("button", { name: "Tentar de novo" });

    expect(`${name}: ${named !== null}`).toBe(`${name}: true`);
    view.unmount();
  }
});

test("o botao das quatro executa o `onRetry`, e nao so aparece", () => {
  for (const [name, sister] of sisters) {
    let retries = 0;
    const view = withTheme(sister({ isError: true, onRetry: () => (retries += 1) }));

    fireEvent.click(within(view.container).getByRole("button", { name: "Tentar de novo" }));

    expect(`${name}: ${retries}`).toBe(`${name}: 1`);
    view.unmount();
  }
});

test("a espera das quatro sai numa regiao viva com texto, e nao so em `aria-busy`", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isLoading: true }));
    const region = view.container.querySelector("[data-rc-status]");

    expect(`${name}: ${region?.getAttribute("role")}`).toBe(`${name}: status`);
    expect(`${name}: ${region?.getAttribute("aria-live")}`).toBe(`${name}: polite`);
    expect(`${name}: ${region?.textContent}`).toBe(`${name}: ${LOADING_ANNOUNCEMENT}`);
    view.unmount();
  }
});

test("a chegada do dado fala pelo MESMO no, que nao se remonta com o conteudo", () => {
  for (const [name, sister] of sisters) {
    const view = withTheme(sister({ isLoading: true }));
    const before = view.container.querySelector("[data-rc-status]");

    view.rerender(<RivoProvider scope="local">{sister({ isLoading: false })}</RivoProvider>);
    const after = view.container.querySelector("[data-rc-status]");

    expect(`${name}: ${after === before}`).toBe(`${name}: true`);
    expect(`${name}: ${after?.textContent}`).toBe(`${name}: ${LOADED_ANNOUNCEMENT}`);
    view.unmount();
  }
});
