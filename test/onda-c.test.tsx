import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

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

test("a tabela mostra os dados quando eles chegam", () => {
  table();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(screen.getByText("R$ 940,00")).toBeDefined();
});

test("carregando, ela mostra o formato do que vem, e nao os dados velhos", () => {
  const { container } = table({ isLoading: true, skeletonRows: 3 });
  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(9);
});

test("sem dados nenhum, ela ja entra carregando", () => {
  const { container } = table({ data: undefined });
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

test("o erro vence o carregando, e oferece nova tentativa", () => {
  let tentativas = 0;
  table({ isError: true, isLoading: true, onRetry: () => (tentativas += 1) });

  expect(screen.getByRole("alert")).toBeDefined();
  fireEvent.click(screen.getByText("Tentar de novo"));
  expect(tentativas).toBe(1);
});

test("a lista vazia explica o vazio e oferece saida", () => {
  table({ data: [] });
  expect(screen.getByText("Nenhuma nota")).toBeDefined();
  expect(screen.getByText("Emita a primeira para ela aparecer.")).toBeDefined();
});

test("o vazio nao aparece enquanto a consulta esta em pe", () => {
  table({ data: [], isLoading: true });
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("a linha avisa quem clicou nela", () => {
  let clicada: Invoice | undefined;
  table({ onRowClick: (nota) => (clicada = nota) });
  fireEvent.click(screen.getByText("Clinica Sao Lucas"));
  expect(clicada?.number).toBe("4813");
});

const PASSOS: Step[] = [
  { id: "dados", title: "Dados" },
  { id: "itens", title: "Itens" },
  { id: "revisao", title: "Revisao" },
];

function Wizard() {
  const wizard = useWizard(PASSOS);
  return (
    <RivoProvider scope="local">
      <Steps steps={PASSOS} current={wizard.step} onStepClick={wizard.goTo} />
      <p>Agora: {wizard.current?.title}</p>
      <button onClick={() => wizard.next()}>Avancar</button>
      <button onClick={() => wizard.next(() => false)}>Avancar travado</button>
      <button onClick={wizard.back}>Voltar</button>
    </RivoProvider>
  );
}

test("o assistente anda e volta", () => {
  render(<Wizard />);
  expect(screen.getByText("Agora: Dados")).toBeDefined();

  fireEvent.click(screen.getByText("Avancar"));
  expect(screen.getByText("Agora: Itens")).toBeDefined();

  fireEvent.click(screen.getByText("Voltar"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("checagem que reprova segura o passo", () => {
  render(<Wizard />);
  fireEvent.click(screen.getByText("Avancar travado"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("a regua marca o passo atual e so deixa voltar", () => {
  render(<Wizard />);
  fireEvent.click(screen.getByText("Avancar"));

  const botoes = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-current"));
  expect(botoes[0]!.textContent).toContain("Itens");

  const dataStep = screen.getByText("Dados").closest("button") as HTMLButtonElement;
  const passoDeRevisao = screen.getByText("Revisao").closest("button") as HTMLButtonElement;
  expect(dataStep.disabled).toBe(false);
  expect(passoDeRevisao.disabled).toBe(true);
});
