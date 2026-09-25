import { afterAll, beforeAll, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Calendar, type CalendarProps } from "../src/components/calendar";
import { DatePicker, type DatePickerProps } from "../src/components/date-picker";
import {
  DateRangePicker,
  type DateRangePickerProps,
  type IsoDateRange,
} from "../src/components/date-range-picker";
import { dateFromIso, formatIsoDate, isoFromDate } from "../src/shared/date";

const originalZone = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  process.env.TZ = originalZone;
});

function field() {
  return screen.getByPlaceholderText("dd/mm/aaaa") as HTMLInputElement;
}

function day(label: string, scope: HTMLElement = document.body) {
  const grid = within(scope).getAllByRole("grid")[0]!;
  return within(grid)
    .getAllByRole("button")
    .find((button) => button.textContent === label)! as HTMLButtonElement;
}

test("a data em texto e o dia do calendario, e nao meia-noite em UTC", () => {
  expect(new Date("2026-09-25").getDate()).toBe(24);

  const date = dateFromIso("2026-09-25")!;
  expect(date.getFullYear()).toBe(2026);
  expect(date.getMonth()).toBe(8);
  expect(date.getDate()).toBe(25);
  expect(isoFromDate(date)).toBe("2026-09-25");
  expect(formatIsoDate("2026-09-25")).toBe("25/09/2026");
});

test("texto que nao e dia do calendario nao vira data", () => {
  expect(dateFromIso("2026-02-31")).toBeUndefined();
  expect(dateFromIso("25/09/2026")).toBeUndefined();
  expect(dateFromIso("2026-9-5")).toBeUndefined();
  expect(dateFromIso("")).toBeUndefined();
});

test("o campo mostra a data em texto no dia certo, mesmo no fuso do pais", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker value="2026-09-25" onValueChange={() => {}} />
    </RivoProvider>,
  );
  expect(field().value).toBe("25/09/2026");
});

test("quem passa texto recebe texto, e o campo vazio chega como texto vazio", () => {
  const received: string[] = [];
  function Controlled() {
    const [date, setDate] = useState<string | null>(null);
    return (
      <RivoProvider scope="local">
        <DatePicker
          value={date}
          onValueChange={(next) => {
            received.push(next);
            setDate(next);
          }}
        />
      </RivoProvider>
    );
  }
  render(<Controlled />);

  fireEvent.change(field(), { target: { value: "25/12/2026" } });
  expect(received).toEqual(["2026-12-25"]);
  expect(field().value).toBe("25/12/2026");

  fireEvent.change(field(), { target: { value: "" } });
  expect(received).toEqual(["2026-12-25", ""]);
});

test("o texto inicial tambem responde em texto, e o calendario abre no mes dele", () => {
  let received: unknown;
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue="2026-09-25" onValueChange={(next) => (received = next)} />
    </RivoProvider>,
  );

  fireEvent.click(screen.getByLabelText("Abrir calendário"));
  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("setembro");

  fireEvent.click(day("10"));
  expect(received).toBe("2026-09-10");
});

test("quem passa Date continua recebendo Date", () => {
  let received: unknown;
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={new Date(2026, 8, 25)} onValueChange={(next) => (received = next)} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "01/10/2026" } });
  expect(received).toBeInstanceOf(Date);
  expect((received as Date).getDate()).toBe(1);
});

test("com name, a data em texto chega ao formulario do jeito que entrou", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <DatePicker name="vencimento" defaultValue="2026-09-25" />
    </RivoProvider>,
  );
  const hidden = container.querySelector('input[type="hidden"][name="vencimento"]');
  expect((hidden as HTMLInputElement).value).toBe("2026-09-25");
});

test("o min e o max do campo barram a data digitada fora da janela", () => {
  const received: string[] = [];
  render(
    <RivoProvider scope="local">
      <DatePicker
        defaultValue=""
        min="2026-09-10"
        max={new Date(2026, 8, 20, 15, 30)}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );

  fireEvent.change(field(), { target: { value: "09/09/2026" } });
  fireEvent.change(field(), { target: { value: "21/09/2026" } });
  expect(received).toEqual([]);

  fireEvent.change(field(), { target: { value: "10/09/2026" } });
  fireEvent.change(field(), { target: { value: "20/09/2026" } });
  expect(received).toEqual(["2026-09-10", "2026-09-20"]);
});

test("o min e o max do campo desabilitam os dias fora da janela no calendario", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue="2026-09-15" min="2026-09-10" max="2026-09-20" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByLabelText("Abrir calendário"));

  expect(day("9").disabled).toBe(true);
  expect(day("10").disabled).toBe(false);
  expect(day("20").disabled).toBe(false);
  expect(day("21").disabled).toBe(true);
});

test("o Calendar fala value e onValueChange, no formato de quem chama", () => {
  const received: string[] = [];
  function Controlled() {
    const [date, setDate] = useState<string | null>("2026-09-25");
    return (
      <RivoProvider scope="local">
        <Calendar
          value={date}
          onValueChange={(next) => {
            received.push(next);
            setDate(next);
          }}
        />
      </RivoProvider>
    );
  }
  render(<Controlled />);

  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("setembro");
  expect(day("25").closest("td")!.getAttribute("aria-selected")).toBe("true");

  fireEvent.click(day("12"));
  expect(received).toEqual(["2026-09-12"]);
  expect(day("12").closest("td")!.getAttribute("aria-selected")).toBe("true");

  fireEvent.click(day("12"));
  expect(received).toEqual(["2026-09-12", "2026-09-12"]);
  expect(day("12").closest("td")!.getAttribute("aria-selected")).toBe("true");
});

test("o Calendar com Date responde com Date", () => {
  let received: unknown;
  render(
    <RivoProvider scope="local">
      <Calendar value={new Date(2026, 8, 25)} onValueChange={(next) => (received = next)} />
    </RivoProvider>,
  );
  fireEvent.click(day("3"));
  expect(received).toBeInstanceOf(Date);
  expect((received as Date).getDate()).toBe(3);
});

test("o min e o max do Calendar desabilitam os dias de fora e param a navegacao", () => {
  render(
    <RivoProvider scope="local">
      <Calendar value="2026-09-15" min="2026-09-10" max="2026-09-20" onValueChange={() => {}} />
    </RivoProvider>,
  );

  expect(day("9").disabled).toBe(true);
  expect(day("10").disabled).toBe(false);
  expect(day("21").disabled).toBe(true);

  const previous = screen.getByLabelText(/anterior/i) as HTMLButtonElement;
  const next = screen.getByLabelText(/próximo|seguinte/i) as HTMLButtonElement;
  expect(previous.getAttribute("aria-disabled")).toBe("true");
  expect(next.getAttribute("aria-disabled")).toBe("true");
  expect(previous.className.split(" ")).toContain("aria-disabled:text-fg-disabled");
});

test("o intervalo em texto aparece no gatilho e sai em texto pelo Aplicar", () => {
  const received: Array<IsoDateRange | null> = [];
  render(
    <RivoProvider scope="local">
      <DateRangePicker
        defaultValue={{ from: "2026-09-03", to: "2026-09-10" }}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("03/09/2026 – 10/09/2026")).toBeDefined();

  fireEvent.click(screen.getByText("03/09/2026 – 10/09/2026"));
  fireEvent.click(day("14"));
  fireEvent.click(day("18"));
  fireEvent.click(screen.getByText("Aplicar"));
  expect(received).toHaveLength(1);
  expect(received[0]!.from < received[0]!.to).toBe(true);
  expect(typeof received[0]!.from).toBe("string");
  expect(received[0]!.to).toBe("2026-09-18");
});

test("o Limpar do intervalo em texto responde null, como no nativo", () => {
  const received: Array<IsoDateRange | null> = [];
  render(
    <RivoProvider scope="local">
      <DateRangePicker
        value={{ from: "2026-09-03", to: "2026-09-10" }}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("03/09/2026 – 10/09/2026"));
  fireEvent.click(screen.getByText("Limpar"));
  expect(received).toEqual([null]);
});

test("o min do intervalo desabilita os dias antes dele", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker defaultValue={{ from: "2026-09-12", to: "2026-09-14" }} min="2026-09-10" />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("12/09/2026 – 14/09/2026"));
  expect(day("9").disabled).toBe(true);
  expect(day("10").disabled).toBe(false);
});

function OwnDatePicker(props: DatePickerProps) {
  return <DatePicker {...props} />;
}

function OwnRangePicker(props: DateRangePickerProps) {
  return <DateRangePicker {...props} />;
}

function OwnCalendar(props: CalendarProps) {
  return <Calendar {...props} />;
}

test("o componente de quem embrulha com o tipo de props exportado continua repassando tudo", () => {
  let received: unknown;
  render(
    <RivoProvider scope="local">
      <OwnDatePicker defaultValue="2026-09-25" onValueChange={(next) => (received = next)} />
      <OwnRangePicker placeholder="Periodo" />
      <OwnCalendar mode="single" month={new Date(2026, 8, 1)} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "01/10/2026" } });
  expect(received).toBe("2026-10-01");
  expect(screen.getByText("Periodo")).toBeTruthy();
});
