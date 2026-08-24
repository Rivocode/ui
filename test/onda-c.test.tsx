import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { DataTable, type Coluna } from "../src/components/data-table";
import { Steps, useWizard, type Passo } from "../src/components/steps";

type Nota = { id: string; numero: string; cliente: string; valor: string };

const NOTAS: Nota[] = [
  { id: "1", numero: "4813", cliente: "Clinica Sao Lucas", valor: "R$ 2.480,00" },
  { id: "2", numero: "4814", cliente: "Transportes Cabo Branco", valor: "R$ 940,00" },
];

const COLUNAS: Coluna<Nota>[] = [
  { key: "numero", header: "Numero" },
  { key: "cliente", header: "Cliente" },
  { key: "valor", header: "Valor", align: "right", hideOnMobile: true },
];

function tabela(props: Partial<React.ComponentProps<typeof DataTable<Nota>>> = {}) {
  return render(
    <RivoProvider scope="local">
      <DataTable
        data={NOTAS}
        columns={COLUNAS}
        rowKey={(nota) => nota.id}
        empty={{ title: "Nenhuma nota", description: "Emita a primeira para ela aparecer." }}
        {...props}
      />
    </RivoProvider>,
  );
}

test("a tabela mostra os dados quando eles chegam", () => {
  tabela();
  expect(screen.getByText("Clinica Sao Lucas")).toBeDefined();
  expect(screen.getByText("R$ 940,00")).toBeDefined();
});

test("carregando, ela mostra o formato do que vem, e nao os dados velhos", () => {
  const { container } = tabela({ isLoading: true, skeletonRows: 3 });
  expect(screen.queryByText("Clinica Sao Lucas")).toBeNull();
  expect(container.querySelectorAll(".animate-pulse").length).toBe(9);
});

test("sem dados nenhum, ela ja entra carregando", () => {
  const { container } = tabela({ data: undefined });
  expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
});

test("o erro vence o carregando, e oferece nova tentativa", () => {
  let tentativas = 0;
  tabela({ isError: true, isLoading: true, onRetry: () => (tentativas += 1) });

  expect(screen.getByRole("alert")).toBeDefined();
  fireEvent.click(screen.getByText("Tentar de novo"));
  expect(tentativas).toBe(1);
});

test("a lista vazia explica o vazio e oferece saida", () => {
  tabela({ data: [] });
  expect(screen.getByText("Nenhuma nota")).toBeDefined();
  expect(screen.getByText("Emita a primeira para ela aparecer.")).toBeDefined();
});

test("o vazio nao aparece enquanto a consulta esta em pe", () => {
  tabela({ data: [], isLoading: true });
  expect(screen.queryByText("Nenhuma nota")).toBeNull();
});

test("a linha avisa quem clicou nela", () => {
  let clicada: Nota | undefined;
  tabela({ onRowClick: (nota) => (clicada = nota) });
  fireEvent.click(screen.getByText("Clinica Sao Lucas"));
  expect(clicada?.numero).toBe("4813");
});

const PASSOS: Passo[] = [
  { id: "dados", title: "Dados" },
  { id: "itens", title: "Itens" },
  { id: "revisao", title: "Revisao" },
];

function Assistente() {
  const assistente = useWizard(PASSOS);
  return (
    <RivoProvider scope="local">
      <Steps steps={PASSOS} current={assistente.passo} onStepClick={assistente.irPara} />
      <p>Agora: {assistente.atual?.title}</p>
      <button onClick={() => assistente.avancar()}>Avancar</button>
      <button onClick={() => assistente.avancar(() => false)}>Avancar travado</button>
      <button onClick={assistente.voltar}>Voltar</button>
    </RivoProvider>
  );
}

test("o assistente anda e volta", () => {
  render(<Assistente />);
  expect(screen.getByText("Agora: Dados")).toBeDefined();

  fireEvent.click(screen.getByText("Avancar"));
  expect(screen.getByText("Agora: Itens")).toBeDefined();

  fireEvent.click(screen.getByText("Voltar"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("checagem que reprova segura o passo", () => {
  render(<Assistente />);
  fireEvent.click(screen.getByText("Avancar travado"));
  expect(screen.getByText("Agora: Dados")).toBeDefined();
});

test("a regua marca o passo atual e so deixa voltar", () => {
  render(<Assistente />);
  fireEvent.click(screen.getByText("Avancar"));

  const botoes = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-current"));
  expect(botoes[0]!.textContent).toContain("Itens");

  const passoDeDados = screen.getByText("Dados").closest("button") as HTMLButtonElement;
  const passoDeRevisao = screen.getByText("Revisao").closest("button") as HTMLButtonElement;
  expect(passoDeDados.disabled).toBe(false);
  expect(passoDeRevisao.disabled).toBe(true);
});
