import { expect, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { DataTable, type Column } from "../src/components/data-table";
import { Steps, useWizard, type Step } from "../src/components/steps";

type Invoice = { id: string; number: string; customer: string; amount: string };

const INVOICES: Invoice[] = [
  { id: "1", number: "4813", customer: "Clinica Sao Lucas", amount: "R$ 2.480,00" },
  { id: "2", number: "4814", customer: "Transportes Cabo Branco", amount: "R$ 940,00" },
];

const COLUMNS: Column<Invoice>[] = [
  { key: "number", header: "Numero" },
  { key: "customer", header: "Cliente" },
  { key: "amount", header: "Valor", align: "right", hideOnMobile: true },
];

function table(props: Partial<React.ComponentProps<typeof DataTable<Invoice>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={INVOICES}
        columns={COLUMNS}
        rowKey={(invoice) => invoice.id}
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
        {...props}
      />
    </RivoProvider>,
  );
}

test("the table shows the data when it arrives", () => {
  table();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(screen.getByText("R$ 940,00")).toBeDefined();
});

test("while loading, it shows the shape of what is coming, and not the stale data", () => {
  const { container } = table({ isLoading: true, skeletonRows: 3 });
  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(9);
});

test("with no data at all, it starts in loading", () => {
  const { container } = table({ data: undefined });
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

test("error beats loading, and offers a retry", () => {
  let retries = 0;
  table({ isError: true, isLoading: true, onRetry: () => (retries += 1) });

  expect(screen.getByRole("alert")).toBeDefined();
  fireEvent.click(screen.getByText("Tentar de novo"));
  expect(retries).toBe(1);
});

test("the empty list explains the emptiness and offers a way out", () => {
  table({ data: [] });
  expect(screen.getByText("Nenhuma nota")).toBeDefined();
  expect(screen.getByText("Emita a primeira para ela aparecer.")).toBeDefined();
});

test("the empty state does not show while the query is in flight", () => {
  table({ data: [], isLoading: true });
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("the row notifies whoever clicked it", () => {
  let clicked: Invoice | undefined;
  table({ onRowClick: (invoice) => (clicked = invoice) });
  fireEvent.click(screen.getByText("Clinica Sao Lucas"));
  expect(clicked?.number).toBe("4813");
});

const STEPS: Step[] = [
  { id: "dados", title: "Dados" },
  { id: "itens", title: "Itens" },
  { id: "revisao", title: "Revisao" },
];

function Wizard() {
  const wizard = useWizard(STEPS);
  return (
    <RivoProvider scope="local">
      <Steps steps={STEPS} step={wizard.step} onStepChange={wizard.goTo} />
      <p>Agora: {wizard.current?.title}</p>
      <button onClick={() => wizard.next()}>Avancar</button>
      <button onClick={() => wizard.next(() => false)}>Avancar travado</button>
      <button onClick={wizard.back}>Voltar</button>
    </RivoProvider>
  );
}

test("the wizard moves forward and back", () => {
  render(<Wizard />);
  expect(screen.getByText("Agora: Dados")).toBeDefined();

  fireEvent.click(screen.getByText("Avancar"));
  expect(screen.getByText("Agora: Itens")).toBeDefined();

  fireEvent.click(screen.getByText("Voltar"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("a failing check holds the step", () => {
  render(<Wizard />);
  fireEvent.click(screen.getByText("Avancar travado"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("two clicks on next during the async check advance a single step", async () => {
  let release!: (ok: boolean) => void;
  let calls = 0;
  const validate = () => {
    calls += 1;
    return new Promise<boolean>((resolve) => {
      release = resolve;
    });
  };
  function Hurried() {
    const wizard = useWizard(STEPS);
    return (
      <>
        <p>Agora: {wizard.current?.title}</p>
        <button onClick={() => void wizard.next(validate)}>Avancar validando</button>
      </>
    );
  }
  render(<Hurried />);
  fireEvent.click(screen.getByText("Avancar validando"));
  fireEvent.click(screen.getByText("Avancar validando"));
  expect(calls).toBe(1);
  await act(async () => {
    release(true);
  });
  expect(screen.getByText("Agora: Itens")).toBeDefined();
});

test("the ruler marks the current step and only allows going back", () => {
  render(<Wizard />);
  fireEvent.click(screen.getByText("Avancar"));

  const buttons = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-current"));
  expect(buttons[0]!.textContent).toContain("Itens");

  const dataStep = screen.getByText("Dados").closest("button") as HTMLButtonElement;
  const reviewStep = screen.getByText("Revisao").closest("button") as HTMLButtonElement;
  expect(dataStep.disabled).toBe(false);
  expect(reviewStep.disabled).toBe(true);
});
