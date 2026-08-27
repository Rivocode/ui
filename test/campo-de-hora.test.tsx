import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { TimeField } from "../src/components/time-field";
import { TimePicker } from "../src/components/time-picker";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

function field() {
  return screen.getByPlaceholderText("hh:mm") as HTMLInputElement;
}

function open() {
  fireEvent.click(screen.getByLabelText("Abrir seletor de horário"));
}

function optionsOf(name: string) {
  const column = screen.getByRole("listbox", { name });
  return [...column.querySelectorAll('[role="option"]')].map((node) => node.textContent);
}

test("digitar poe os dois pontos sozinho", () => {
  withTheme(<TimeField aria-label="Entrada" />);

  fireEvent.change(field(), { target: { value: "1430" } });

  expect(field().value).toBe("14:30");
});

test("hora pela metade nao avisa ninguem ainda", () => {
  let avisos = 0;
  withTheme(<TimeField aria-label="Entrada" onValueChange={() => avisos++} />);

  fireEvent.change(field(), { target: { value: "14" } });

  expect(avisos).toBe(0);
});

test("a hora inteira chega em quem escuta, e sempre com dois digitos", () => {
  let recebida = "";
  withTheme(<TimeField aria-label="Entrada" onValueChange={(hora) => (recebida = hora)} />);

  fireEvent.change(field(), { target: { value: "0805" } });

  expect(recebida).toBe("08:05");
});

test("25:99 nao vira valor nenhum, e o campo se marca invalido na hora", () => {
  let avisos = 0;
  withTheme(<TimeField aria-label="Entrada" onValueChange={() => avisos++} />);

  fireEvent.change(field(), { target: { value: "2599" } });

  expect(field().value).toBe("25:99");
  expect(field().getAttribute("aria-invalid")).toBe("true");
  expect(avisos).toBe(0);
});

test("o texto impossivel volta para a ultima hora valida ao sair do campo", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="08:00" />);

  fireEvent.change(field(), { target: { value: "2599" } });
  fireEvent.blur(field());

  expect(field().value).toBe("08:00");
  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("apagar o campo limpa o valor", () => {
  let recebida = "08:00";
  withTheme(
    <TimeField
      aria-label="Entrada"
      defaultValue="08:00"
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  fireEvent.change(field(), { target: { value: "" } });

  expect(recebida).toBe("");
});

test("a seta para cima pousa na grade do passo, e nao soma o passo cru", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="14:07" step={15} />);

  fireEvent.keyDown(field(), { key: "ArrowUp" });

  expect(field().value).toBe("14:15");
});

test("a seta para baixo para na primeira hora da janela", () => {
  withTheme(<TimeField aria-label="Entrada" defaultValue="08:10" step={15} min="08:00" />);

  fireEvent.keyDown(field(), { key: "ArrowDown" });

  expect(field().value).toBe("08:00");
});

test("com o campo vazio, a seta para cima comeca na abertura da janela", () => {
  withTheme(<TimeField aria-label="Entrada" min="09:30" max="18:00" />);

  fireEvent.keyDown(field(), { key: "ArrowUp" });

  expect(field().value).toBe("09:30");
});

test("hora fora da janela chega em quem escuta, e o campo diz que ela esta fora", () => {
  let recebida = "";
  withTheme(
    <TimeField
      aria-label="Entrada"
      min="08:00"
      max="18:00"
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  fireEvent.change(field(), { target: { value: "0700" } });

  expect(recebida).toBe("07:00");
  expect(field().getAttribute("aria-invalid")).toBe("true");
});

test("hora digitada fora da grade do passo continua valendo", () => {
  let recebida = "";
  withTheme(
    <TimeField aria-label="Entrada" step={30} onValueChange={(hora) => (recebida = hora)} />,
  );

  fireEvent.change(field(), { target: { value: "1407" } });

  expect(recebida).toBe("14:07");
  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("com name, o formulario nativo recebe a hora inteira e nunca o texto pela metade", () => {
  const { container } = withTheme(<TimeField aria-label="Entrada" name="entrada" />);

  fireEvent.change(field(), { target: { value: "08" } });
  const hidden = container.querySelector('input[type="hidden"][name="entrada"]');
  expect((hidden as HTMLInputElement).value).toBe("");

  fireEvent.change(field(), { target: { value: "0830" } });
  expect((hidden as HTMLInputElement).value).toBe("08:30");
});

test("o campo espelha a hora que muda de fora", () => {
  function Controlled() {
    const [hora, setHora] = useState("08:00");
    return (
      <RivoProvider scope="local">
        <TimeField aria-label="Entrada" value={hora} onValueChange={setHora} />
        <button onClick={() => setHora("19:45")}>Fechamento</button>
      </RivoProvider>
    );
  }
  render(<Controlled />);

  fireEvent.click(screen.getByText("Fechamento"));

  expect(field().value).toBe("19:45");
});

test("o campo desabilitado nao aceita digitacao", () => {
  withTheme(<TimeField aria-label="Entrada" disabled />);

  expect(field().disabled).toBe(true);
});

test("o painel abre pelo relogio do campo, com as duas colunas", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();

  expect(screen.getByRole("listbox", { name: "Hora" })).toBeDefined();
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
});

test("o passo decide quantos minutos a coluna oferece", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" step={15} />);

  open();

  expect(optionsOf("Minuto")).toEqual(["00", "15", "30", "45"]);
});

test("a janela recorta as horas oferecidas, em vez de so avisar depois", () => {
  withTheme(<TimePicker aria-label="Entrega" min="08:00" max="10:00" step={30} />);

  open();

  expect(optionsOf("Hora")).toEqual(["08", "09", "10"]);
});

test("a ultima hora da janela so oferece os minutos que cabem nela", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="10:00" min="08:00" max="10:00" />);

  open();

  expect(optionsOf("Minuto")).toEqual(["00"]);
});

test("escolher a hora guarda o minuto que ja estava escolhido", () => {
  let recebida = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="14:30"
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));

  expect(recebida).toBe("16:30");
});

test("a hora nao fecha o painel, e o minuto fecha", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();

  fireEvent.click(screen.getByRole("option", { name: "45" }));
  expect(screen.queryByRole("listbox", { name: "Minuto" })).toBeNull();
});

test("a hora escolhida no painel volta escrita no campo", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  fireEvent.click(screen.getByRole("option", { name: "45" }));

  expect(field().value).toBe("14:45");
});

test("com o campo vazio, o minuto escolhido pousa na primeira hora da janela", () => {
  let recebida = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      min="09:00"
      max="18:00"
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "30" }));

  expect(recebida).toBe("09:30");
});

test("a seta na coluna anda a selecao sem fechar o painel", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  const column = screen.getByRole("listbox", { name: "Minuto" });
  fireEvent.keyDown(column, { key: "ArrowDown" });

  expect(field().value).toBe("14:45");
  expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
});

test("a coluna diz qual opcao esta escolhida, e nao so a pinta", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);

  open();
  const marked = screen
    .getAllByRole("option")
    .filter((node) => node.getAttribute("aria-selected") === "true")
    .map((node) => node.textContent);

  expect(marked).toEqual(["14", "30"]);
});

test("o relogio desabilitado nao abre o painel", () => {
  withTheme(<TimePicker aria-label="Entrega" disabled />);

  open();

  expect(screen.queryByRole("listbox", { name: "Hora" })).toBeNull();
});

test("hora vinda de fora sem o zero da frente aparece com dois digitos", () => {
  withTheme(<TimeField aria-label="Entrada" value="8:00" />);

  expect(field().value).toBe("08:00");
});

test("janela invertida e ignorada, e o campo aceita o dia inteiro", () => {
  withTheme(<TimeField aria-label="Entrada" min="22:00" max="06:00" />);

  fireEvent.change(field(), { target: { value: "1400" } });

  expect(field().getAttribute("aria-invalid")).toBeNull();
});

test("na tela estreita o painel sobe como folha, com as mesmas colunas", () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;

  try {
    withTheme(<TimePicker aria-label="Entrega" defaultValue="14:30" />);
    open();

    expect(screen.getByLabelText("Escolher horário")).toBeDefined();
    expect(screen.getByRole("listbox", { name: "Hora" })).toBeDefined();
    expect(screen.getByRole("listbox", { name: "Minuto" })).toBeDefined();
  } finally {
    window.matchMedia = original;
  }
});

test("hora impossivel vinda de fora tambem marca o campo, sem ninguem digitar", () => {
  withTheme(<TimeField aria-label="Entrada" value="25:99" />);

  expect(field().getAttribute("aria-invalid")).toBe("true");
});

test("trocar a hora preserva o minuto digitado fora da grade", () => {
  let recebida = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="14:07"
      step={15}
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "16" }));

  expect(recebida).toBe("16:07");
});

test("hora fora da janela nao deixa a coluna de minutos vazia", () => {
  withTheme(<TimePicker aria-label="Entrega" defaultValue="07:00" min="08:00" max="18:00" />);

  open();

  expect(optionsOf("Minuto").length).toBeGreaterThan(0);
});

test("escolher a hora do fim da janela nao passa do maximo", () => {
  let recebida = "";
  withTheme(
    <TimePicker
      aria-label="Entrega"
      defaultValue="09:30"
      min="08:00"
      max="10:00"
      onValueChange={(hora) => (recebida = hora)}
    />,
  );

  open();
  fireEvent.click(screen.getByRole("option", { name: "10" }));

  expect(recebida).toBe("10:00");
});
