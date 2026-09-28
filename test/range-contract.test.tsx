import { afterAll, beforeAll, expect, test } from "bun:test";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Calendar } from "../src/components/calendar";
import { DateRangePicker, type DateRange } from "../src/components/date-range-picker";

const originalZone = process.env.TZ;
beforeAll(() => {
  process.env.TZ = "America/Sao_Paulo";
});
afterAll(() => {
  process.env.TZ = originalZone;
});

function day(label: string) {
  const grid = screen.getAllByRole("grid")[0]!;
  return within(grid)
    .getAllByRole("button")
    .find((button) => button.textContent === label)! as HTMLButtonElement;
}

type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

test("the Date range has both ends required, like the native one", () => {
  const from: Same<DateRange["from"], Date> = true;
  const to: Same<DateRange["to"], Date> = true;
  expect(from && to).toBe(true);
});

test("with Date, Limpar answers null, and not undefined", () => {
  const received: unknown[] = [];
  render(
    <RivoProvider scope="local">
      <DateRangePicker
        defaultValue={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 10) }}
        onValueChange={(next) => {
          const exact: Same<typeof next, DateRange | null> = true;
          expect(exact).toBe(true);
          received.push(next);
        }}
      />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("03/09/2026 – 10/09/2026"));
  fireEvent.click(screen.getByText("Limpar"));
  expect(received).toEqual([null]);
  expect(screen.getByText("Escolha o período")).toBeDefined();
});

test("with Date and without confirm, every output is a closed range, and clearing answers null", () => {
  const received: Array<DateRange | null> = [];
  render(
    <RivoProvider scope="local">
      <DateRangePicker
        confirm={false}
        defaultValue={{ from: new Date(2026, 8, 3), to: new Date(2026, 8, 3) }}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("03/09/2026 – 03/09/2026"));
  fireEvent.click(day("3"));
  expect(received).toEqual([null]);

  fireEvent.click(day("8"));
  fireEvent.click(day("12"));
  expect(received).toHaveLength(3);
  for (const range of received.slice(1)) {
    expect(range!.from).toBeInstanceOf(Date);
    expect(range!.to).toBeInstanceOf(Date);
  }
  expect(received[2]!.from.getDate()).toBe(8);
  expect(received[2]!.to.getDate()).toBe(12);
});

test("with text and without confirm, the range comes out in the same contract, closed and as text", () => {
  const received: unknown[] = [];
  render(
    <RivoProvider scope="local">
      <DateRangePicker
        confirm={false}
        defaultValue={{ from: "2026-09-03", to: "2026-09-03" }}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("03/09/2026 – 03/09/2026"));
  fireEvent.click(day("3"));
  fireEvent.click(day("8"));
  expect(received).toEqual([null, { from: "2026-09-08", to: "2026-09-08" }]);
});

test("with Date, a parent that resets the range from outside clears the trigger", () => {
  function Filter() {
    const [range, setRange] = useState<DateRange | null>(null);
    return (
      <RivoProvider scope="local">
        <DateRangePicker value={range ?? undefined} onValueChange={setRange} />
        <button type="button" onClick={() => setRange(null)}>
          Zerar filtros
        </button>
      </RivoProvider>
    );
  }
  render(<Filter />);

  fireEvent.click(screen.getByText("Escolha o período"));
  fireEvent.click(day("8"));
  fireEvent.click(day("12"));
  fireEvent.click(screen.getByText("Aplicar"));
  expect(screen.queryByText("Escolha o período")).toBeNull();

  fireEvent.click(screen.getByText("Zerar filtros"));
  expect(screen.getByText("Escolha o período")).toBeDefined();
});

test("the Calendar accepts defaultValue as Date and keeps the day on its own", () => {
  const received: Date[] = [];
  render(
    <RivoProvider scope="local">
      <Calendar
        defaultValue={new Date(2026, 8, 25)}
        onValueChange={(next) => received.push(next)}
      />
    </RivoProvider>,
  );
  expect(day("25").closest("td")!.getAttribute("aria-selected")).toBe("true");

  fireEvent.click(day("12"));
  expect(received[0]).toBeInstanceOf(Date);
  expect(day("12").closest("td")!.getAttribute("aria-selected")).toBe("true");
  expect(day("25").closest("td")!.getAttribute("aria-selected")).not.toBe("true");
});

test("the Calendar with defaultValue as text answers as text", () => {
  const received: string[] = [];
  render(
    <RivoProvider scope="local">
      <Calendar
        defaultValue="2026-09-25"
        onValueChange={(next) => {
          const exact: Same<typeof next, string> = true;
          expect(exact).toBe(true);
          received.push(next);
        }}
      />
    </RivoProvider>,
  );
  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("setembro");
  expect(day("25").closest("td")!.getAttribute("aria-selected")).toBe("true");

  fireEvent.click(day("12"));
  expect(received).toEqual(["2026-09-12"]);
  expect(day("12").closest("td")!.getAttribute("aria-selected")).toBe("true");
});
