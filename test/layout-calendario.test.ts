import { expect, test } from "bun:test";

import {
  addDays,
  eachDay,
  layoutDay,
  monthDays,
  packBars,
  segmentBox,
  spansFullWindow,
  splitEvents,
  startOfWeek,
  toBars,
  visibleDays,
} from "../src/lib/event-layout";

type Event = { id: string; start: Date; end: Date; allDay?: boolean };

const DAY = new Date(2026, 2, 17);

function at(hour: number, minute = 0, day = DAY): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute);
}

function event(id: string, from: number, to: number, minutes: [number, number] = [0, 0]): Event {
  return { id, start: at(from, minutes[0]), end: at(to, minutes[1]) };
}

const WINDOW = 13 * 60;

test("conjunto transitivo divide a largura entre os tres, e nao entre os pares", () => {
  const events = [
    event("a", 9, 10),
    event("b", 9, 10, [30, 30]),
    event("c", 10, 11, [15, 0]),
  ];

  const { placed } = layoutDay(splitEvents(events, [DAY]));
  const columns = new Map(placed.map((segment) => [segment.event.id, segment]));

  expect(placed).toHaveLength(3);
  expect(columns.get("a")!.columns).toBe(2);
  expect(columns.get("b")!.columns).toBe(2);
  expect(columns.get("c")!.columns).toBe(2);
  expect(columns.get("a")!.span).toBe(1);
  expect(columns.get("c")!.span).toBe(1);
  expect(columns.get("a")!.column).toBe(0);
  expect(columns.get("b")!.column).toBe(1);
  expect(columns.get("c")!.column).toBe(0);
});

test("quem tem espaco livre a direita cresce ate esbarrar", () => {
  const events = [
    event("longo", 9, 12),
    event("manha", 9, 10),
    event("depois", 10, 11, [30, 0]),
    event("curto", 9, 9, [0, 30]),
  ];

  const { placed } = layoutDay(splitEvents(events, [DAY]));
  const columns = new Map(placed.map((segment) => [segment.event.id, segment]));

  expect(columns.get("longo")!.span).toBe(1);
  expect(columns.get("manha")!.span).toBe(1);
  expect(columns.get("depois")!.span).toBe(2);
  expect(columns.get("depois")!.columns).toBe(3);
});

test("o que passa do teto de colunas vira um transbordo com a contagem", () => {
  const events = [event("a", 9, 11), event("b", 9, 11), event("c", 9, 11), event("d", 9, 11)];

  const { placed, overflow } = layoutDay(splitEvents(events, [DAY]), 3);

  expect(placed).toHaveLength(3);
  expect(overflow).toHaveLength(1);
  expect(overflow[0]!.count).toBe(1);
  expect(overflow[0]!.dayIndex).toBe(0);
});

test("o compromisso que cruza a meia-noite vira dois segmentos, com os sinalizadores certos", () => {
  const days = [DAY, addDays(DAY, 1)];
  const night: Event = { id: "plantao", start: at(22), end: at(9, 0, addDays(DAY, 1)) };

  const segments = splitEvents([night], days);

  expect(segments).toHaveLength(2);
  expect(segments[0]!.continuesBefore).toBe(false);
  expect(segments[0]!.continuesAfter).toBe(true);
  expect(segments[0]!.start.getHours()).toBe(22);
  expect(segments[1]!.continuesBefore).toBe(true);
  expect(segments[1]!.continuesAfter).toBe(false);
  expect(segments[1]!.start.getHours()).toBe(0);
  expect(segments[1]!.end.getHours()).toBe(9);
});

test("a noite que cruza a meia-noite nao sobe para a faixa de dia inteiro", () => {
  const night: Event = { id: "plantao", start: at(22), end: at(9, 0, addDays(DAY, 1)) };
  const trip: Event = { id: "viagem", start: at(0), end: at(0, 0, addDays(DAY, 3)) };

  expect(spansFullWindow(night, WINDOW)).toBe(false);
  expect(spansFullWindow(trip, WINDOW)).toBe(true);
  expect(spansFullWindow({ id: "feriado", start: at(9), end: at(10), allDay: true }, WINDOW)).toBe(
    true,
  );
});

test("tres barras que nao cabem em duas faixas deixam a terceira contada por dia", () => {
  const days = eachDay(DAY, 5);
  const bars = toBars(
    [
      { id: "a", start: at(0), end: at(0, 0, addDays(DAY, 3)) },
      { id: "b", start: at(0, 0, addDays(DAY, 1)), end: at(0, 0, addDays(DAY, 4)) },
      { id: "c", start: at(0, 0, addDays(DAY, 1)), end: at(0, 0, addDays(DAY, 3)) },
    ],
    days,
  );

  const packed = packBars(bars, 2, days.length);

  expect(packed.placed).toHaveLength(2);
  expect(packed.hidden).toHaveLength(1);
  expect(packed.lanes).toBe(2);
  expect(packed.hiddenByDay[0]).toBe(0);
  expect(packed.hiddenByDay[1]).toBe(1);
  expect(packed.hiddenByDay[2]).toBe(1);
});

test("o piso de altura e do desenho, e nao muda a conta de colunas", () => {
  const events = [event("um", 9, 9, [0, 10]), event("outro", 9, 9, [25, 35])];

  const segments = splitEvents(events, [DAY]);
  const { placed } = layoutDay(segments);
  const boxes = segments.map((segment) =>
    segmentBox(segment, { dayStart: 7, dayEnd: 20, hourHeight: 48 }),
  );

  expect(placed.every((segment) => segment.columns === 1)).toBe(true);
  expect(boxes[0]!.height).toBe(8);
  expect(boxes[1]!.height).toBe(8);
  expect(boxes[1]!.top - (boxes[0]!.top + boxes[0]!.height)).toBeLessThan(44);
});

test("o que cai fora da janela de horas encosta na beirada, e diz de que lado", () => {
  const early = splitEvents([event("cedo", 5, 6)], [DAY])[0]!;
  const late = splitEvents([event("tarde", 21, 22)], [DAY])[0]!;
  const window = { dayStart: 7, dayEnd: 20, hourHeight: 48 };

  expect(segmentBox(early, window).top).toBe(0);
  expect(segmentBox(early, window).height).toBe(0);
  expect(segmentBox(early, window).outsideBefore).toBe(true);
  expect(segmentBox(late, window).top).toBe(13 * 48);
  expect(segmentBox(late, window).outsideAfter).toBe(true);
});

test("a semana comeca no dia pedido, e o mes sai em semanas inteiras", () => {
  expect(startOfWeek(DAY, 1).getDay()).toBe(1);
  expect(startOfWeek(DAY, 0).getDay()).toBe(0);

  const month = monthDays(DAY, 1);
  expect(month.length % 7).toBe(0);
  expect(month[0]!.getDay()).toBe(1);
  expect(month.some((day) => day.getDate() === 1 && day.getMonth() === 2)).toBe(true);

  expect(visibleDays("day", DAY, 1)).toHaveLength(1);
  expect(visibleDays("week", DAY, 1)).toHaveLength(7);
  expect(visibleDays("agenda", DAY, 1)).toHaveLength(31);
});
