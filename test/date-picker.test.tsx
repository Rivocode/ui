import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { DatePicker } from "../src/components/date-picker";
import { DateRangePicker } from "../src/components/date-range-picker";
import { Calendar } from "../src/components/calendar";

function campo() {
  return screen.getByPlaceholderText("dd/mm/aaaa") as HTMLInputElement;
}

test("digitar poe as barras sozinho", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker />
    </RivoProvider>,
  );
  fireEvent.change(campo(), { target: { value: "03032026" } });
  expect(campo().value).toBe("03/03/2026");
});

test("a data digitada chega em quem escuta", () => {
  let recebida: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={(d) => (recebida = d)} />
    </RivoProvider>,
  );
  fireEvent.change(campo(), { target: { value: "25/12/2026" } });
  expect(recebida?.getFullYear()).toBe(2026);
  expect(recebida?.getMonth()).toBe(11);
  expect(recebida?.getDate()).toBe(25);
});

test("data pela metade nao avisa ninguem ainda", () => {
  let avisos = 0;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={() => avisos++} />
    </RivoProvider>,
  );
  fireEvent.change(campo(), { target: { value: "0303" } });
  expect(avisos).toBe(0);
});

test("apagar o campo limpa a data", () => {
  let recebida: Date | undefined = new Date(2026, 2, 3);
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={recebida} onValueChange={(d) => (recebida = d)} />
    </RivoProvider>,
  );
  fireEvent.change(campo(), { target: { value: "" } });
  expect(recebida).toBeUndefined();
});

test("texto que nao virou data volta para a ultima data ao sair do campo", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  fireEvent.change(campo(), { target: { value: "31/02" } });
  fireEvent.blur(campo());
  expect(campo().value).toBe("03/03/2026");
});

test("o campo espelha a data que muda de fora", () => {
  function Controlado() {
    const [data, setData] = useState<Date | undefined>(new Date(2026, 2, 3));
    return (
      <RivoProvider scope="local">
        <DatePicker value={data} onValueChange={setData} />
        <button onClick={() => setData(new Date(2026, 11, 25))}>Natal</button>
      </RivoProvider>
    );
  }
  render(<Controlado />);
  fireEvent.click(screen.getByText("Natal"));
  expect(campo().value).toBe("25/12/2026");
});

test("com name, o formulario nativo recebe aaaa-mm-dd", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <DatePicker name="vencimento" defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  const escondido = container.querySelector('input[type="hidden"][name="vencimento"]');
  expect((escondido as HTMLInputElement).value).toBe("2026-03-03");
});

test("o calendario abre pelo botao do campo", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByLabelText("Abrir calendario"));
  expect(screen.getByRole("grid")).toBeDefined();
});

test("o calendario fala portugues por padrao", () => {
  render(
    <RivoProvider scope="local">
      <Calendar mode="single" month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("março");
});

test("o gatilho do intervalo mostra o periodo escolhido", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 10) }} />
    </RivoProvider>,
  );
  expect(screen.getByText("03/03/2026 – 10/03/2026")).toBeDefined();
});

test("sem intervalo, o gatilho mostra o convite", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha o periodo")).toBeDefined();
});

test("no celular o calendario mostra um mes so, mesmo pedindo dois", () => {
  // O happy-dom nao implementa matchMedia com resposta verdadeira, entao o
  // teste troca a resposta para simular a tela estreita.
  const original = window.matchMedia;
  window.matchMedia = ((consulta: string) =>
    ({
      matches: consulta.includes("max-width"),
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    render(
      <RivoProvider scope="local">
        <Calendar mode="range" numberOfMonths={2} month={new Date(2026, 2, 1)} />
      </RivoProvider>,
    );
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  } finally {
    window.matchMedia = original;
  }
});

test("na largura de mesa os dois meses aparecem", () => {
  render(
    <RivoProvider scope="local">
      <Calendar mode="range" numberOfMonths={2} month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("grid")).toHaveLength(2);
});

test("com rodape, o clique no dia e so rascunho ate o Aplicar", async () => {
  let recebida: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker confirmar onValueChange={(d) => (recebida = d)} />
    </RivoProvider>,
  );

  fireEvent.click(screen.getByLabelText("Abrir calendario"));
  fireEvent.click(screen.getAllByRole("gridcell")[10]!.querySelector("button")!);
  expect(recebida).toBeUndefined();

  fireEvent.click(screen.getByText("Aplicar"));
  expect(recebida).toBeDefined();
});

test("sem rodape, o clique no dia ja vale e o painel fecha", () => {
  let recebida: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={(d) => (recebida = d)} />
    </RivoProvider>,
  );

  fireEvent.click(screen.getByLabelText("Abrir calendario"));
  fireEvent.click(screen.getAllByRole("gridcell")[10]!.querySelector("button")!);
  expect(recebida).toBeDefined();
  expect(screen.queryByRole("grid")).toBeNull();
});

test("o Aplicar do intervalo so libera com o periodo fechado", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("Escolha o periodo"));

  const aplicar = screen.getByText("Aplicar").closest("button")!;
  expect(aplicar.disabled).toBe(true);

  // O primeiro clique ja fecha um periodo de um dia so, que e escolha
  // legitima. O que o Aplicar barra e o periodo vazio.
  const dias = screen.getAllByRole("gridcell");
  fireEvent.click(dias[10]!.querySelector("button")!);
  expect((screen.getByText("Aplicar").closest("button") as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(dias[14]!.querySelector("button")!);
  expect((screen.getByText("Aplicar").closest("button") as HTMLButtonElement).disabled).toBe(false);
});

test("o calendario mostra a inicial do dia numa letra so", () => {
  render(
    <RivoProvider scope="local">
      <Calendar mode="single" month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  const colunas = [...document.querySelectorAll("th")].map((c) => c.textContent);
  expect(colunas).toEqual(["D", "S", "T", "Q", "Q", "S", "S"]);
});

test("a legenda do mes vira lista de mes e ano", () => {
  render(
    <RivoProvider scope="local">
      <Calendar mode="single" month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  const listas = screen.getAllByRole("combobox");
  expect(listas.length).toBe(2);
});
