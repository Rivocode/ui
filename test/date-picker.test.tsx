import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { DatePicker } from "../src/components/date-picker";
import { DateRangePicker } from "../src/components/date-range-picker";
import { Calendar } from "../src/components/calendar";

function field() {
  return screen.getByPlaceholderText("dd/mm/aaaa") as HTMLInputElement;
}

test("typing inserts the slashes by itself", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "03032026" } });
  expect(field().value).toBe("03/03/2026");
});

test("the typed date reaches the listener", () => {
  let received: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={(d) => (received = d)} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "25/12/2026" } });
  expect(received?.getFullYear()).toBe(2026);
  expect(received?.getMonth()).toBe(11);
  expect(received?.getDate()).toBe(25);
});

test("a half-typed date notifies nobody yet", () => {
  let calls = 0;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={() => calls++} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "0303" } });
  expect(calls).toBe(0);
});

test("erasing the field clears the date", () => {
  let received: Date | undefined = new Date(2026, 2, 3);
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={received} onValueChange={(d) => (received = d)} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "" } });
  expect(received).toBeUndefined();
});

test("text that did not become a date reverts to the last date on blur", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  fireEvent.change(field(), { target: { value: "31/02" } });
  fireEvent.blur(field());
  expect(field().value).toBe("03/03/2026");
});

test("the field mirrors a date changed from outside", () => {
  function Controlled() {
    const [data, setData] = useState<Date | undefined>(new Date(2026, 2, 3));
    return (
      <RivoProvider scope="local">
        <DatePicker value={data} onValueChange={setData} />
        <button onClick={() => setData(new Date(2026, 11, 25))}>Natal</button>
      </RivoProvider>
    );
  }
  render(<Controlled />);
  fireEvent.click(screen.getByText("Natal"));
  expect(field().value).toBe("25/12/2026");
});

test("with name, the native form receives yyyy-mm-dd", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <DatePicker name="vencimento" defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  const hiddenInput = container.querySelector('input[type="hidden"][name="vencimento"]');
  expect((hiddenInput as HTMLInputElement).value).toBe("2026-03-03");
});

test("controlled from empty, going back to empty from outside clears the field, and does not revive the first date", () => {
  function Controlled() {
    const [data, setData] = useState<Date | undefined>();
    return (
      <RivoProvider scope="local">
        <DatePicker name="vencimento" value={data} onValueChange={setData} />
        <button onClick={() => setData(undefined)}>Zerar</button>
      </RivoProvider>
    );
  }
  const { container } = render(<Controlled />);

  fireEvent.change(field(), { target: { value: "10/03/2026" } });
  fireEvent.blur(field());
  fireEvent.change(field(), { target: { value: "20/03/2026" } });
  fireEvent.blur(field());
  expect(field().value).toBe("20/03/2026");

  fireEvent.click(screen.getByText("Zerar"));
  expect(field().value).toBe("");
  const hiddenInput = container.querySelector('input[type="hidden"][name="vencimento"]') as HTMLInputElement;
  expect(hiddenInput.value).toBe("");
});

test("a date typed on a disabled day does not count, as it does not in the calendar", () => {
  const calls: (Date | undefined)[] = [];
  render(
    <RivoProvider scope="local">
      <DatePicker disabledDays={{ dayOfWeek: [0] }} onValueChange={(d) => calls.push(d)} />
    </RivoProvider>,
  );

  fireEvent.change(field(), { target: { value: "15/03/2026" } });
  expect(calls).toHaveLength(0);

  fireEvent.change(field(), { target: { value: "16/03/2026" } });
  expect(calls).toHaveLength(1);
  expect(calls[0]?.getDate()).toBe(16);
});

test("the calendar controlled from empty also goes back to empty from outside", () => {
  function Controlled() {
    const [picked, setPicked] = useState<Date | undefined>();
    return (
      <RivoProvider scope="local">
        <Calendar value={picked} onValueChange={setPicked} defaultMonth={new Date(2026, 2, 1)} />
        <button onClick={() => setPicked(undefined)}>Zerar</button>
      </RivoProvider>
    );
  }
  render(<Controlled />);
  const day = (text: string) => screen.getAllByRole("button").find((node) => node.textContent === text)!;
  const selected = () =>
    [...document.querySelectorAll('[role="gridcell"][aria-selected="true"]')].map((node) => node.textContent);

  fireEvent.click(day("10"));
  fireEvent.click(day("20"));
  expect(selected()).toEqual(["20"]);

  fireEvent.click(screen.getByText("Zerar"));
  expect(selected()).toEqual([]);
});

test("the calendar opens through the field button", () => {
  render(
    <RivoProvider scope="local">
      <DatePicker defaultValue={new Date(2026, 2, 3)} />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByLabelText("Abrir calendário"));
  expect(screen.getByRole("grid")).toBeDefined();
});

test("the calendar speaks Portuguese by default", () => {
  render(
    <RivoProvider scope="local">
      <Calendar month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  expect(screen.getByRole("grid").getAttribute("aria-label")).toContain("março");
});

test("the range trigger shows the chosen period", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker defaultValue={{ from: new Date(2026, 2, 3), to: new Date(2026, 2, 10) }} />
    </RivoProvider>,
  );
  expect(screen.getByText("03/03/2026 – 10/03/2026")).toBeDefined();
});

test("without a range, the trigger shows the invitation", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker />
    </RivoProvider>,
  );
  expect(screen.getByText("Escolha o período")).toBeDefined();
});

test("on mobile the calendar shows a single month, even when asked for two", () => {
  // happy-dom does not implement matchMedia with a true answer, so the test
  // swaps the answer to simulate the narrow screen.
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
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

test("at desktop width both months appear", () => {
  render(
    <RivoProvider scope="local">
      <Calendar mode="range" numberOfMonths={2} month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  expect(screen.getAllByRole("grid")).toHaveLength(2);
});

test("with a footer, clicking a day is only a draft until Aplicar", async () => {
  let received: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker confirm onValueChange={(d) => (received = d)} />
    </RivoProvider>,
  );

  fireEvent.click(screen.getByLabelText("Abrir calendário"));
  fireEvent.click(screen.getAllByRole("gridcell")[10]!.querySelector("button")!);
  expect(received).toBeUndefined();

  fireEvent.click(screen.getByText("Aplicar"));
  expect(received).toBeDefined();
});

test("without a footer, clicking a day counts right away and the panel closes", () => {
  let received: Date | undefined;
  render(
    <RivoProvider scope="local">
      <DatePicker onValueChange={(d) => (received = d)} />
    </RivoProvider>,
  );

  fireEvent.click(screen.getByLabelText("Abrir calendário"));
  fireEvent.click(screen.getAllByRole("gridcell")[10]!.querySelector("button")!);
  expect(received).toBeDefined();
  expect(screen.queryByRole("grid")).toBeNull();
});

test("the range Aplicar only unlocks with a closed period", () => {
  render(
    <RivoProvider scope="local">
      <DateRangePicker />
    </RivoProvider>,
  );
  fireEvent.click(screen.getByText("Escolha o período"));

  const apply = screen.getByText("Aplicar").closest("button")!;
  expect(apply.disabled).toBe(true);

  // The first click already closes a one-day period, which is a legitimate
  // choice. What Aplicar blocks is the empty period.
  const cells = screen.getAllByRole("gridcell");
  fireEvent.click(cells[10]!.querySelector("button")!);
  expect((screen.getByText("Aplicar").closest("button") as HTMLButtonElement).disabled).toBe(false);

  fireEvent.click(cells[14]!.querySelector("button")!);
  expect((screen.getByText("Aplicar").closest("button") as HTMLButtonElement).disabled).toBe(false);
});

test("the calendar shows the day initial as a single letter", () => {
  render(
    <RivoProvider scope="local">
      <Calendar month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  const columns = [...document.querySelectorAll("th")].map((c) => c.textContent);
  expect(columns).toEqual(["D", "S", "T", "Q", "Q", "S", "S"]);
});

test("the month caption becomes month and year lists", () => {
  render(
    <RivoProvider scope="local">
      <Calendar month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  const lists = screen.getAllByRole("combobox");
  expect(lists.length).toBe(2);
});

test("on a narrow phone the calendar day shrinks with the screen, so the seven columns fit in 320 pixels", () => {
  render(
    <RivoProvider scope="local">
      <Calendar onValueChange={() => {}} month={new Date(2026, 2, 1)} />
    </RivoProvider>,
  );
  const shrinking = "size-[min(2.75rem,calc((100vw_-_3.5rem)/7))]";
  const button = screen.getAllByRole("button").find((node) => node.textContent === "12")!;
  expect(button.className.split(" ")).toContain(shrinking);
  expect(button.className.split(" ")).not.toContain("size-11");
  expect(button.parentElement!.className.split(" ")).toContain(shrinking);
});
