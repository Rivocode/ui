import { afterEach, expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { EventCalendar, type CalendarEvent } from "../src/components/event-calendar";
import { RivoProvider } from "../src/provider/rivo-provider";

const ANCHOR = new Date(2026, 2, 17);

function at(hour: number, minute = 0, day = 17): Date {
  return new Date(2026, 2, day, hour, minute);
}

const EVENTS: CalendarEvent[] = [
  { id: "1", title: "Reunião com o contador", start: at(9), end: at(10) },
  { id: "2", title: "Almoço com o cliente", start: at(12), end: at(13, 30), tone: "accent" },
  { id: "3", title: "Fechamento do mês", start: at(9, 0, 18), end: at(11, 0, 18), tone: "warning" },
];

function calendar(props: Partial<React.ComponentProps<typeof EventCalendar>> = {}) {
  return render(
    <RivoProvider scope="local">
      <EventCalendar
        defaultDate={ANCHOR}
        defaultView="week"
        events={EVENTS}
        label="Agenda da equipe"
        {...props}
      />
    </RivoProvider>,
  );
}

const items = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>("[data-rc-event]"),
];

const onMobile = () => {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
};

test("the week draws seven days, and each day says how many appointments it has", () => {
  const { container } = calendar();

  const groups = [...container.querySelectorAll("[data-rc-day]")];
  expect(groups).toHaveLength(7);

  const tuesday = container.querySelector("[data-rc-day='1']")!;
  expect(tuesday.getAttribute("aria-label")).toContain("17 de março");
  expect(tuesday.getAttribute("aria-label")).toContain("2 compromissos");

  const wednesday = container.querySelector("[data-rc-day='2']")!;
  expect(wednesday.getAttribute("aria-label")).toContain("1 compromisso");
});

test("each appointment is a list item with the real count of the day", () => {
  const { container } = calendar();
  const drawn = items(container);

  expect(drawn).toHaveLength(3);

  const first = drawn[0]!.closest("[role='listitem']")!;
  expect(first.getAttribute("aria-posinset")).toBe("1");
  expect(first.getAttribute("aria-setsize")).toBe("2");
  expect(drawn[0]!.getAttribute("aria-label")).toContain("Reunião com o contador");
  expect(drawn[0]!.getAttribute("aria-label")).toContain("às");
});

test("the grid scaffolding does not reach screen reader users", () => {
  const { container } = calendar();

  const hidden = container.querySelectorAll("[aria-hidden='true']");
  expect(hidden.length).toBeGreaterThan(0);
  expect(container.querySelector("[role='grid']")).toBeNull();
  expect(container.querySelectorAll("[role='gridcell']")).toHaveLength(0);
});

test("clicking an appointment returns the appointment, not the clicked slot", () => {
  const picked = mock();
  const slot = mock();
  const { container } = calendar({ onEventSelect: picked, onSlotSelect: slot });

  fireEvent.click(items(container)[0]!);

  expect(picked).toHaveBeenCalledTimes(1);
  expect(picked.mock.calls[0]![0].id).toBe("1");
  expect(slot).not.toHaveBeenCalled();
});

test("clicking empty space returns the slot rounded to half an hour", () => {
  const slot = mock();
  const { container } = calendar({ onSlotSelect: slot, dayStart: 8 });

  fireEvent.click(container.querySelector("[data-rc-day='1']")!);

  expect(slot).toHaveBeenCalledTimes(1);
  const range = slot.mock.calls[0]![0];
  expect(range.start.getHours()).toBe(8);
  expect(range.start.getMinutes()).toBe(0);
  expect(range.end.getHours()).toBe(8);
  expect(range.end.getMinutes()).toBe(30);
});

test("all-day goes up to the band, and the night that crosses midnight stays in the grid", () => {
  const { container } = calendar({
    events: [
      { id: "feriado", title: "Feriado municipal", start: at(0), end: at(0, 0, 18), allDay: true },
      { id: "plantao", title: "Plantão", start: at(22), end: at(9, 0, 18) },
    ],
  });

  const band = screen.getByRole("group", { name: "Dia inteiro" });
  expect(band.textContent).toContain("Feriado municipal");
  expect(band.textContent).not.toContain("Plantão");

  const drawn = items(container).filter((node) =>
    node.getAttribute("aria-label")?.includes("Plantão"),
  );
  expect(drawn).toHaveLength(2);
  expect(drawn[0]!.getAttribute("aria-label")).toContain("continua no dia seguinte");
  expect(drawn[1]!.getAttribute("aria-label")).toContain("continua do dia anterior");
});

test("the agenda lists only the days that have appointments, in time order", () => {
  const { container } = calendar({ defaultView: "agenda" });

  const sections = [...container.querySelectorAll("[data-rc-day]")];
  expect(sections).toHaveLength(2);

  const titles = items(container).map((node) => node.textContent);
  expect(titles[0]).toContain("Reunião com o contador");
  expect(titles[1]).toContain("Almoço com o cliente");
  expect(titles[2]).toContain("Fechamento do mês");
});

test("the month draws whole weeks, and what does not fit in the cell becomes more", () => {
  const many: CalendarEvent[] = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    title: `Nota ${index + 1}`,
    start: at(9 + index),
    end: at(10 + index),
  }));

  const { container } = calendar({ defaultView: "month", events: many, maxLanes: 3 });

  const cells = [...container.querySelectorAll("[data-rc-day]")];
  expect(cells.length % 7).toBe(0);
  expect(cells.length).toBeGreaterThanOrEqual(35);

  const more = screen.getByRole("button", { name: /Mais 2 em/ });
  expect(more.textContent).toBe("+2 mais");

  const day = [...container.querySelectorAll("[data-rc-day]")].find((cell) =>
    cell.getAttribute("aria-label")?.includes("17 de março"),
  )!;
  expect(day.getAttribute("aria-label")).toContain("5 compromissos");
});

test("more is an item of the day list, has a 24 pixel target, and the day of the neighboring month exceeds 4.5", () => {
  const many: CalendarEvent[] = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    title: `Nota ${index + 1}`,
    start: at(9 + index),
    end: at(10 + index),
  }));

  const { container } = calendar({ defaultView: "month", events: many, maxLanes: 3 });

  const more = screen.getByRole("button", { name: /Mais 2 em/ });
  const holder = more.closest("[role=listitem]")!;
  expect(holder).not.toBeNull();
  expect(holder.parentElement!.getAttribute("role")).toBe("list");

  const tokens = more.className.split(" ");
  expect(tokens).toContain("h-5");
  expect(tokens).toContain("relative");
  expect(tokens).toContain("after:absolute");
  expect(tokens).toContain("after:-inset-y-0.5");

  const numbers = [...container.querySelectorAll("[data-rc-day] > span[aria-hidden]")];
  expect(numbers.length).toBeGreaterThanOrEqual(35);
  const outside = numbers.filter((node) => node.className.split(" ").includes("text-fg-subtle"));
  expect(outside.length).toBeGreaterThan(0);
  for (const node of numbers) expect(node.className.split(" ")).not.toContain("text-fg-disabled");
});

test("more opens that day's list, which is its agenda", async () => {
  const many: CalendarEvent[] = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    title: `Nota ${index + 1}`,
    start: at(9 + index),
    end: at(10 + index),
  }));

  calendar({ defaultView: "month", events: many, maxLanes: 3 });

  expect(screen.queryByText("Nota 5")).toBeNull();

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Mais 2 em/ }));
  });

  expect(screen.getByText("Nota 5")).toBeDefined();
  expect(screen.getByText("Nota 4")).toBeDefined();
});

test("the whole grid is one tab stop, and focus moves between appointments", () => {
  const { container } = calendar();
  const drawn = items(container);

  expect(drawn.filter((node) => node.tabIndex === 0)).toHaveLength(1);
  expect(drawn[0]!.tabIndex).toBe(0);

  act(() => drawn[0]!.focus());
  fireEvent.keyDown(drawn[0]!, { key: "ArrowDown" });
  expect(document.activeElement).toBe(items(container)[1]!);

  fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
  expect(document.activeElement!.getAttribute("aria-label")).toContain("Fechamento do mês");

  fireEvent.keyDown(document.activeElement!, { key: "Home" });
  expect(document.activeElement!.getAttribute("aria-label")).toContain("Reunião com o contador");

  fireEvent.keyDown(document.activeElement!, { key: "End" });
  expect(document.activeElement!.getAttribute("aria-label")).toContain("Fechamento do mês");
});

test("the block is positioned by logical property, and the height floor belongs only to the drawing", () => {
  const { container } = calendar();
  const block = items(container)[0]!;
  const box = block.closest("[role='listitem']") as HTMLElement;

  expect(box.style.left).toBe("");
  expect(box.style.insetInlineStart).toBe("0%");
  expect(box.style.width).toBe("100%");
  expect(box.style.height).toBe("48px");
  expect(block.className).toContain("min-h-[var(--rc-control-md)]");
  expect(block.className).toContain("max-sm:min-h-11");
});

test("in rtl the arrow that moves forward is the left one", () => {
  const { container } = render(
    <RivoProvider scope="local" dir="rtl">
      <EventCalendar defaultDate={ANCHOR} defaultView="week" events={EVENTS} label="Agenda" />
    </RivoProvider>,
  );

  const drawn = items(container);
  act(() => drawn[0]!.focus());

  fireEvent.keyDown(drawn[0]!, { key: "ArrowLeft" });
  expect(document.activeElement!.getAttribute("aria-label")).toContain("Fechamento do mês");

  fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
  expect(document.activeElement!.getAttribute("aria-label")).toContain("Almoço com o cliente");
});

test("page keys change the period, and escape returns focus to the toolbar", () => {
  const moved = mock();
  const { container } = calendar({ onDateChange: moved });

  const drawn = items(container);
  act(() => drawn[0]!.focus());

  fireEvent.keyDown(drawn[0]!, { key: "PageDown" });
  expect(moved).toHaveBeenCalledTimes(1);
  expect(moved.mock.calls[0]![0].getDate()).toBe(24);

  const again = items(container)[0];
  if (again) {
    act(() => again.focus());
    fireEvent.keyDown(again, { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByLabelText("Período anterior"));
  }
});

test("the visible period comes out with an exclusive end, and changes when the view changes", () => {
  const range = mock();
  calendar({ onRangeChange: range });

  expect(range).toHaveBeenCalledTimes(1);
  const week = range.mock.calls[0]![0];
  expect(week.start.getDate()).toBe(16);
  expect(week.end.getDate()).toBe(23);
  expect(week.end.getHours()).toBe(0);

  fireEvent.click(screen.getByRole("button", { name: "Próximo período" }));
  expect(range.mock.calls[1]![0].start.getDate()).toBe(23);
});

test("the period change is announced aloud, with the count", () => {
  calendar();

  const live = document.querySelectorAll("[aria-live='polite']");
  const spoken = [...live].map((node) => node.textContent).join(" ");
  expect(spoken).toContain("de março de 2026");
  expect(spoken).toContain("3 compromissos");
});

test("on mobile the week disappears from the switcher, and whoever asked for week gets the agenda", () => {
  const restore = onMobile();

  try {
    const { container } = calendar({ view: "week" });

    expect(container.querySelector("[data-rc-view]")!.getAttribute("data-rc-view")).toBe("agenda");
    expect(screen.queryByRole("button", { name: "Semana" })).toBeNull();
    expect(screen.getByRole("button", { name: "Agenda" })).toBeDefined();
  } finally {
    restore();
  }
});

test("the four endings come in the house order", () => {
  const retry = mock();
  const { container, rerender } = calendar({ isError: true, onRetry: retry, isLoading: true });

  expect(screen.getByText("Não foi possível carregar")).toBeDefined();
  expect(container.querySelector("[data-rc-day]")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(retry).toHaveBeenCalledTimes(1);

  rerender(
    <RivoProvider scope="local">
      <EventCalendar
        defaultDate={ANCHOR}
        defaultView="agenda"
        events={undefined}
        isLoading
        label="Agenda da equipe"
      />
    </RivoProvider>,
  );
  expect(document.querySelector("[data-rc-status]")!.textContent).toBe("Carregando…");

  rerender(
    <RivoProvider scope="local">
      <EventCalendar
        defaultDate={ANCHOR}
        defaultView="agenda"
        events={[]}
        label="Agenda da equipe"
        empty={{ title: "Nada marcado", description: "Nenhum compromisso neste período." }}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("Nada marcado")).toBeDefined();
  expect(document.querySelector("[data-rc-status]")!.textContent).toBe("Conteúdo carregado");
});

test("in the grid the empty state sits on top, because the grid is also where you click", () => {
  const { container } = calendar({
    defaultView: "day",
    events: [],
    empty: { title: "Semana livre", description: "Nenhum compromisso neste dia." },
  });

  expect(screen.getByText("Semana livre")).toBeDefined();
  expect(container.querySelector("[data-rc-day]")).not.toBeNull();
});

afterEach(() => {
  document.body.innerHTML = "";
});

function inZone<T>(zone: string, run: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = zone;
  try {
    return run();
  } finally {
    process.env.TZ = previous;
  }
}

test("on the daylight saving day the 10am click returns 10am wall time", () => {
  inZone("America/New_York", () => {
    const slot = mock();
    const { container } = calendar({
      defaultDate: new Date(2026, 2, 8),
      defaultView: "day",
      events: [],
      onSlotSelect: slot,
      dayStart: 8,
      hourHeight: 48,
    });

    fireEvent.click(container.querySelector("[data-rc-day='0']")!, { clientY: 2 * 48 });

    const range = slot.mock.calls[0]![0];
    expect(range.start.getDate()).toBe(8);
    expect(range.start.getHours()).toBe(10);
    expect(range.start.getMinutes()).toBe(0);
    expect(range.end.getHours()).toBe(10);
    expect(range.end.getMinutes()).toBe(30);
  });
});

test("in the repeated hour at the end of daylight saving the slot ends after it starts, in wall time", () => {
  inZone("America/New_York", () => {
    const slot = mock();
    const { container } = calendar({
      defaultDate: new Date(2026, 10, 1),
      defaultView: "day",
      events: [],
      onSlotSelect: slot,
      dayStart: 0,
      hourHeight: 48,
    });

    fireEvent.click(container.querySelector("[data-rc-day='0']")!, { clientY: 1.5 * 48 });

    const range = slot.mock.calls[0]![0];
    expect(range.end.getTime()).toBeGreaterThan(range.start.getTime());
    const wall = (date: Date) => date.getHours() * 60 + date.getMinutes();
    expect(wall(range.end)).toBeGreaterThan(wall(range.start));
  });
});

test("the 10:58 click returns the clicked slot, 10:30 to 11:00", () => {
  const slot = mock();
  const { container } = calendar({ onSlotSelect: slot, dayStart: 8, hourHeight: 48 });

  fireEvent.click(container.querySelector("[data-rc-day='1']")!, {
    clientY: (2 + 58 / 60) * 48,
  });

  const range = slot.mock.calls[0]![0];
  expect(range.start.getHours()).toBe(10);
  expect(range.start.getMinutes()).toBe(30);
  expect(range.end.getHours()).toBe(11);
  expect(range.end.getMinutes()).toBe(0);
});

test("clicking inside the more panel does not pick the day underneath", async () => {
  const many: CalendarEvent[] = Array.from({ length: 5 }, (_, index) => ({
    id: String(index),
    title: `Nota ${index + 1}`,
    start: at(9 + index),
    end: at(10 + index),
  }));
  const slot = mock();
  calendar({ defaultView: "month", events: many, maxLanes: 3, onSlotSelect: slot });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /Mais 2 em/ }));
  });
  const panel = screen.getByRole("dialog");
  fireEvent.click(panel);
  fireEvent.click(panel.firstElementChild ?? panel);

  expect(slot).not.toHaveBeenCalled();
});

test("the 7pm to 9am shift, longer than the hour window, keeps its time and stays out of the band", () => {
  const { container } = calendar({
    events: [{ id: "plantao", title: "Plantão", start: at(19), end: at(9, 0, 18) }],
  });

  expect(screen.queryByRole("group", { name: "Dia inteiro" })?.textContent ?? "").not.toContain(
    "Plantão",
  );
  const drawn = items(container).filter((node) =>
    node.getAttribute("aria-label")?.includes("Plantão"),
  );
  expect(drawn).toHaveLength(2);
  for (const node of drawn) expect(node.getAttribute("aria-label")).not.toContain("Dia inteiro");
});

test("in the agenda the 7pm to 9am shift says the time, not all day", () => {
  calendar({
    defaultView: "agenda",
    events: [{ id: "plantao", title: "Plantão", start: at(19), end: at(9, 0, 18) }],
  });

  expect(screen.queryAllByText("Dia inteiro")).toHaveLength(0);
  expect(screen.getAllByText(/19:00/).length).toBeGreaterThan(0);
});

test("the date picker speaks the calendar locale and starts the week on weekStartsOn", async () => {
  calendar({ defaultView: "month", locale: "en-US", weekStartsOn: 1 });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /March 2026/ }));
  });

  const panel = screen.getByRole("dialog");
  const headers = [...panel.querySelectorAll("th")].map((cell) => cell.textContent);
  expect(headers.length).toBeGreaterThanOrEqual(7);
  expect(headers.slice(0, 7)).toEqual(["M", "T", "W", "T", "F", "S", "S"]);
});
