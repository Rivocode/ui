import { expect, mock, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createRef, useState } from "react";

import { ActionBar, type ActionBarProps } from "../src/components/action-bar";
import { Button } from "../src/components/button";
import { DataTable, type Column } from "../src/components/data-table";
import { RivoProvider } from "../src/provider/rivo-provider";

function bar(props: Partial<ActionBarProps> = {}) {
  const view = render(
    <RivoProvider scope="local">
      <ActionBar count={0} {...props} />
    </RivoProvider>,
  );
  const again = (next: Partial<ActionBarProps>) =>
    view.rerender(
      <RivoProvider scope="local">
        <ActionBar count={0} {...props} {...next} />
      </RivoProvider>,
    );
  const root = view.container.querySelector("[data-position]") as HTMLElement;
  const region = view.container.querySelector("[role='region']") as HTMLElement;
  const status = view.container.querySelector("[role='status'][aria-live='polite']") as HTMLElement;
  return { ...view, again, root, region, status };
}

const tokens = (element: Element) => (element.getAttribute("class") ?? "").split(" ");

test("com zero selecionados a barra fica fora de cena: inerte, invisivel e sem anuncio", () => {
  const { region, status, root } = bar();

  expect(region.hasAttribute("inert")).toBe(true);
  expect(tokens(region)).toContain("invisible");
  expect(tokens(root)).toContain("grid-rows-[0fr]");
  expect(root.hasAttribute("data-open")).toBe(false);
  expect(status.textContent).toBe("");
});

test("acima de zero ela entra, e diz a contagem com o plural certo", () => {
  const { region, again, root } = bar({ count: 1 });

  expect(region.hasAttribute("inert")).toBe(false);
  expect(tokens(region)).toContain("visible");
  expect(tokens(region)).not.toContain("invisible");
  expect(tokens(root)).toContain("grid-rows-[1fr]");
  expect(within(region).getByText("1 selecionado")).toBeDefined();

  again({ count: 3 });
  expect(within(region).getByText("3 selecionados")).toBeDefined();

  again({ count: 1234 });
  expect(within(region).getByText("1.234 selecionados")).toBeDefined();
});

test("a regiao viva existe antes da selecao, e anuncia a contagem e a limpeza", () => {
  const { status, again, container } = bar();

  again({ count: 2 });
  const same = container.querySelector("[role='status'][aria-live='polite']");
  expect(same).toBe(status);
  expect(status.textContent).toBe("2 selecionados");

  again({ count: 0 });
  expect(status.textContent).toBe("Seleção limpa");
});

test("ao sair, a barra continua dizendo o ultimo numero, e nao zero", () => {
  const { region, again } = bar({ count: 4 });

  again({ count: 0 });
  expect(within(region).getByText("4 selecionados")).toBeDefined();
  expect(within(region).queryByText("0 selecionados")).toBeNull();
});

test("o Limpar seleção so existe com onClear, e chama quem controla", () => {
  const onClear = mock(() => {});
  const first = bar({ count: 2 });
  expect(within(first.region).queryByRole("button", { name: "Limpar seleção" })).toBeNull();
  first.unmount();

  const { region } = bar({ count: 2, onClear });
  fireEvent.click(within(region).getByRole("button", { name: "Limpar seleção" }));
  expect(onClear).toHaveBeenCalledTimes(1);
});

test("as acoes entram como filhas, dentro da regiao nomeada", () => {
  bar({
    count: 2,
    children: (
      <Button size="sm" variant="secondary">
        Exportar
      </Button>
    ),
  });

  const region = screen.getByRole("region", { name: "Ações em lote" });
  expect(within(region).getByRole("button", { name: "Exportar" })).toBeDefined();
});

test("quando a barra sai com o foco dentro, o foco vai para a raiz dela", () => {
  const { region, again, root } = bar({ count: 2, onClear: () => {} });

  const clear = within(region).getByRole("button", { name: "Limpar seleção" });
  clear.focus();
  expect(document.activeElement).toBe(clear);

  again({ count: 0 });
  expect(document.activeElement).toBe(root);
});

test("sem finalFocus, o foco volta para onde estava antes de entrar na barra", () => {
  const checkbox = document.createElement("button");
  document.body.appendChild(checkbox);
  const { region, again, root } = bar({ count: 1, onClear: () => {} });

  checkbox.focus();
  within(region).getByRole("button", { name: "Limpar seleção" }).focus();
  again({ count: 0 });

  expect(document.activeElement).toBe(checkbox);
  expect(document.activeElement).not.toBe(root);
  checkbox.remove();
});

test("com finalFocus, o foco vai para onde quem usa mandou", () => {
  const target = document.createElement("button");
  document.body.appendChild(target);
  const finalFocus = createRef<HTMLElement>();
  (finalFocus as { current: HTMLElement | null }).current = target;

  const { region, again } = bar({ count: 1, onClear: () => {}, finalFocus });
  within(region).getByRole("button", { name: "Limpar seleção" }).focus();
  again({ count: 0 });

  expect(document.activeElement).toBe(target);
  target.remove();
});

test("foco fora da barra nao e roubado quando ela sai", () => {
  const outside = document.createElement("input");
  document.body.appendChild(outside);
  const { again } = bar({ count: 1 });

  outside.focus();
  again({ count: 0 });

  expect(document.activeElement).toBe(outside);
  outside.remove();
});

test("entra com a curva de entrada e sai com a de saida, pelos tokens de movimento", () => {
  const { region, root, again } = bar({ count: 1 });

  for (const node of [region, root]) {
    expect(tokens(node)).toContain("ease-rc-enter");
    expect(tokens(node)).toContain("duration-[var(--rc-duration-base)]");
    expect(tokens(node)).not.toContain("ease-rc-exit");
  }

  again({ count: 0 });
  for (const node of [region, root]) {
    expect(tokens(node)).toContain("ease-rc-exit");
    expect(tokens(node)).toContain("duration-[var(--rc-duration-fast)]");
    expect(tokens(node)).not.toContain("ease-rc-enter");
  }
});

test("empilha pelo token, sticky por padrao e fixed quando pedido", () => {
  const sticky = bar({ count: 1 });
  expect(tokens(sticky.root)).toContain("z-[var(--rc-z-sticky)]");
  expect(tokens(sticky.root)).toContain("sticky");
  expect(tokens(sticky.root)).not.toContain("fixed");
  sticky.unmount();

  const fixed = bar({ count: 1, position: "fixed" });
  expect(tokens(fixed.root)).toContain("fixed");
  expect(tokens(fixed.root)).not.toContain("sticky");
  expect(tokens(fixed.root)).toContain("bottom-[max(1rem,env(safe-area-inset-bottom))]");
});

test("labels nomeia o item, e classNames alcanca cada parte", () => {
  const { region, status } = bar({
    count: 2,
    onClear: () => {},
    children: <Button size="sm">Excluir</Button>,
    labels: {
      selected: (count) => (count === 1 ? "1 nota selecionada" : `${count} notas selecionadas`),
      clear: "Desmarcar",
    },
    classNames: { bar: "parte-bar", count: "parte-count", actions: "parte-actions", clear: "parte-clear" },
  });

  expect(status.textContent).toBe("2 notas selecionadas");
  expect(tokens(region)).toContain("parte-bar");
  expect(tokens(within(region).getByText("2 notas selecionadas"))).toContain("parte-count");
  expect(tokens(within(region).getByRole("button", { name: "Excluir" }).parentElement!)).toContain(
    "parte-actions",
  );
  expect(tokens(within(region).getByRole("button", { name: "Desmarcar" }))).toContain("parte-clear");
});

type Invoice = { id: string; customer: string };

const INVOICES: Invoice[] = [
  { id: "1", customer: "Padaria Aurora" },
  { id: "2", customer: "Transportes Cabo Branco" },
  { id: "3", customer: "Clínica São Lucas" },
];

const COLUMNS: Column<Invoice>[] = [{ key: "customer", header: "Cliente", cell: (row) => row.customer }];

function Screen() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(row) => row.id}
        selectable
        value={selected}
        onValueChange={setSelected}
      />
      <ActionBar count={selected.length} onClear={() => setSelected([])}>
        <Button size="sm" variant="secondary">
          Exportar
        </Button>
      </ActionBar>
    </RivoProvider>
  );
}

test("com o DataTable: marcar linha abre a barra, e limpar desmarca a tabela", () => {
  const { container } = render(<Screen />);
  const region = container.querySelector("[role='region']") as HTMLElement;

  fireEvent.click(within(screen.getByText("Padaria Aurora").closest("tr")!).getByRole("checkbox"));
  fireEvent.click(within(screen.getByText("Clínica São Lucas").closest("tr")!).getByRole("checkbox"));

  expect(region.hasAttribute("inert")).toBe(false);
  expect(within(region).getByText("2 selecionados")).toBeDefined();

  fireEvent.click(within(region).getByRole("button", { name: "Limpar seleção" }));

  expect(region.hasAttribute("inert")).toBe(true);
  for (const checkbox of within(container.querySelector("tbody")!).getAllByRole("checkbox")) {
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
  }
});
