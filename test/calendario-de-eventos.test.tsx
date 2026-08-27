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

test("a semana desenha sete dias, e cada dia diz quantos compromissos tem", () => {
  const { container } = calendar();

  const groups = [...container.querySelectorAll("[data-rc-day]")];
  expect(groups).toHaveLength(7);

  const tuesday = container.querySelector("[data-rc-day='1']")!;
  expect(tuesday.getAttribute("aria-label")).toContain("17 de março");
  expect(tuesday.getAttribute("aria-label")).toContain("2 compromissos");

  const wednesday = container.querySelector("[data-rc-day='2']")!;
  expect(wednesday.getAttribute("aria-label")).toContain("1 compromisso");
});

test("cada compromisso e um item de lista com a contagem real do dia", () => {
  const { container } = calendar();
  const drawn = items(container);

  expect(drawn).toHaveLength(3);

  const first = drawn[0]!.closest("[role='listitem']")!;
  expect(first.getAttribute("aria-posinset")).toBe("1");
  expect(first.getAttribute("aria-setsize")).toBe("2");
  expect(drawn[0]!.getAttribute("aria-label")).toContain("Reunião com o contador");
  expect(drawn[0]!.getAttribute("aria-label")).toContain("às");
});

test("o andaime da grade nao chega a quem ouve", () => {
  const { container } = calendar();

  const hidden = container.querySelectorAll("[aria-hidden='true']");
  expect(hidden.length).toBeGreaterThan(0);
  expect(container.querySelector("[role='grid']")).toBeNull();
  expect(container.querySelectorAll("[role='gridcell']")).toHaveLength(0);
});

test("clicar num compromisso devolve o compromisso, e nao o intervalo clicado", () => {
  const picked = mock();
  const slot = mock();
  const { container } = calendar({ onEventSelect: picked, onSlotSelect: slot });

  fireEvent.click(items(container)[0]!);

  expect(picked).toHaveBeenCalledTimes(1);
  expect(picked.mock.calls[0]![0].id).toBe("1");
  expect(slot).not.toHaveBeenCalled();
});

test("clicar no vazio devolve o intervalo arredondado em meia hora", () => {
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

test("o dia inteiro sobe para a faixa, e a noite que cruza a meia-noite fica na grade", () => {
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

test("a agenda lista so os dias que tem compromisso, em ordem de hora", () => {
  const { container } = calendar({ defaultView: "agenda" });

  const sections = [...container.querySelectorAll("[data-rc-day]")];
  expect(sections).toHaveLength(2);

  const titles = items(container).map((node) => node.textContent);
  expect(titles[0]).toContain("Reunião com o contador");
  expect(titles[1]).toContain("Almoço com o cliente");
  expect(titles[2]).toContain("Fechamento do mês");
});

test("o mes desenha as semanas inteiras, e o que nao cabe na celula vira mais", () => {
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

test("o mais abre a lista daquele dia, que e a agenda dele", async () => {
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

test("a grade inteira e uma parada de tabulacao, e o foco anda entre compromissos", () => {
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

test("a tarja se posiciona por propriedade logica, e o piso de altura e so do desenho", () => {
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

test("em rtl a seta que anda para frente e a esquerda", () => {
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

test("a pagina troca o periodo, e o escape devolve o foco a barra", () => {
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

test("o periodo visivel sai com o fim exclusivo, e muda quando a vista muda", () => {
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

test("a troca de periodo se anuncia em voz alta, com a contagem", () => {
  calendar();

  const live = document.querySelectorAll("[aria-live='polite']");
  const spoken = [...live].map((node) => node.textContent).join(" ");
  expect(spoken).toContain("de março de 2026");
  expect(spoken).toContain("3 compromissos");
});

test("no celular a semana some do seletor, e quem pediu semana recebe a agenda", () => {
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

test("os quatro finais vem na ordem da casa", () => {
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

test("na grade o vazio fica por cima, porque a grade tambem e onde se clica", () => {
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
