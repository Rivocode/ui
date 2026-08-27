export type CalendarEventLike = {
  id: string;
  start: Date;
  end: Date;
  allDay?: boolean;
};

export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type EventCalendarView = "agenda" | "day" | "week" | "month";

export type EventSegment<Item extends CalendarEventLike> = {
  key: string;
  event: Item;
  dayIndex: number;
  start: Date;
  end: Date;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type PlacedSegment<Item extends CalendarEventLike> = EventSegment<Item> & {
  column: number;
  span: number;
  columns: number;
};

export type DayOverflow = {
  dayIndex: number;
  start: Date;
  end: Date;
  count: number;
};

export type EventBar<Item extends CalendarEventLike> = {
  key: string;
  event: Item;
  from: number;
  to: number;
  lane: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
};

export type SegmentBox = {
  top: number;
  height: number;
  outsideBefore: boolean;
  outsideAfter: boolean;
};

const MINUTES_IN_DAY = 1440;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

export function addMonths(date: Date, amount: number): Date {
  const day = date.getDate();
  const copy = startOfDay(date);
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + amount);
  const last = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(day, last));
  return copy;
}

export function isSameDay(one: Date, other: Date): boolean {
  return (
    one.getFullYear() === other.getFullYear() &&
    one.getMonth() === other.getMonth() &&
    one.getDate() === other.getDate()
  );
}

export function startOfWeek(date: Date, weekStartsOn: WeekStart = 1): Date {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() - weekStartsOn + 7) % 7));
}

export function startOfMonth(date: Date): Date {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
}

export function endOfMonth(date: Date): Date {
  const copy = startOfMonth(date);
  copy.setMonth(copy.getMonth() + 1);
  return addDays(copy, -1);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

export function eachDay(from: Date, count: number): Date[] {
  return Array.from({ length: Math.max(count, 0) }, (_, index) => addDays(from, index));
}

export function monthDays(date: Date, weekStartsOn: WeekStart = 1): Date[] {
  const first = startOfWeek(startOfMonth(date), weekStartsOn);
  const last = endOfMonth(date);
  return eachDay(first, Math.ceil((daysBetween(first, last) + 1) / 7) * 7);
}

export function visibleDays(
  view: EventCalendarView,
  date: Date,
  weekStartsOn: WeekStart = 1,
): Date[] {
  if (view === "day") return [startOfDay(date)];
  if (view === "week") return eachDay(startOfWeek(date, weekStartsOn), 7);
  if (view === "month") return monthDays(date, weekStartsOn);
  return eachDay(startOfMonth(date), endOfMonth(date).getDate());
}

export function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

function endMinutes<Item extends CalendarEventLike>(segment: EventSegment<Item>): number {
  return segment.continuesAfter || !isSameDay(segment.start, segment.end)
    ? MINUTES_IN_DAY
    : minutesOfDay(segment.end);
}

export function touchesDay(event: CalendarEventLike, day: Date): boolean {
  const from = startOfDay(day).getTime();
  const to = addDays(startOfDay(day), 1).getTime();
  const start = event.start.getTime();
  const end = Math.max(event.end.getTime(), start);
  return start < to && (end > from || (end === start && start >= from));
}

export function spansFullWindow(event: CalendarEventLike, windowMinutes: number): boolean {
  if (event.allDay) return true;
  return event.end.getTime() - event.start.getTime() >= windowMinutes * 60000;
}

export function splitEvents<Item extends CalendarEventLike>(
  events: Item[],
  days: Date[],
): EventSegment<Item>[] {
  const segments: EventSegment<Item>[] = [];

  for (const event of events) {
    for (const [dayIndex, day] of days.entries()) {
      if (!touchesDay(event, day)) continue;

      const from = startOfDay(day);
      const to = addDays(from, 1);
      const start = event.start.getTime() < from.getTime() ? from : event.start;
      const end = event.end.getTime() > to.getTime() ? to : event.end;

      segments.push({
        key: `${event.id}#${dayIndex}`,
        event,
        dayIndex,
        start,
        end: end.getTime() < start.getTime() ? start : end,
        continuesBefore: event.start.getTime() < from.getTime(),
        continuesAfter: event.end.getTime() > to.getTime(),
      });
    }
  }

  return segments;
}

export function toBars<Item extends CalendarEventLike>(
  events: Item[],
  days: Date[],
): EventBar<Item>[] {
  if (days.length === 0) return [];

  const first = startOfDay(days[0]!);
  const after = addDays(startOfDay(days[days.length - 1]!), 1);
  const bars: EventBar<Item>[] = [];

  for (const event of events) {
    const touched = days.flatMap((day, index) => (touchesDay(event, day) ? [index] : []));
    if (touched.length === 0) continue;

    bars.push({
      key: event.id,
      event,
      from: touched[0]!,
      to: touched[touched.length - 1]!,
      lane: 0,
      continuesBefore: event.start.getTime() < first.getTime(),
      continuesAfter: event.end.getTime() > after.getTime(),
    });
  }

  return bars;
}

function compareSpan(
  one: { start: Date; end: Date; id: string },
  other: { start: Date; end: Date; id: string },
): number {
  return (
    one.start.getTime() - other.start.getTime() ||
    other.end.getTime() - other.start.getTime() - (one.end.getTime() - one.start.getTime()) ||
    (one.id < other.id ? -1 : one.id > other.id ? 1 : 0)
  );
}

export function packBars<Item extends CalendarEventLike>(
  bars: EventBar<Item>[],
  maxLanes: number,
  dayCount: number,
): { placed: EventBar<Item>[]; hidden: EventBar<Item>[]; hiddenByDay: number[]; lanes: number } {
  const sorted = [...bars].sort(
    (one, other) =>
      one.from - other.from ||
      other.to - other.from - (one.to - one.from) ||
      compareSpan(one.event, other.event),
  );

  const lanes: EventBar<Item>[][] = [];
  const placed: EventBar<Item>[] = [];
  const hidden: EventBar<Item>[] = [];

  for (const bar of sorted) {
    let lane = 0;
    while (lanes[lane]?.some((other) => other.from <= bar.to && bar.from <= other.to)) lane += 1;
    (lanes[lane] ??= []).push(bar);

    if (lane < maxLanes) placed.push({ ...bar, lane });
    else hidden.push(bar);
  }

  const hiddenByDay = Array.from({ length: dayCount }, () => 0);
  for (const bar of hidden) {
    for (let day = bar.from; day <= bar.to; day += 1)
      hiddenByDay[day] = (hiddenByDay[day] ?? 0) + 1;
  }

  return { placed, hidden, hiddenByDay, lanes: Math.min(lanes.length, maxLanes) };
}

function overlaps<Item extends CalendarEventLike>(
  one: EventSegment<Item>,
  other: EventSegment<Item>,
): boolean {
  return one.start.getTime() < other.end.getTime() && other.start.getTime() < one.end.getTime();
}

function placeCluster<Item extends CalendarEventLike>(
  cluster: EventSegment<Item>[],
  maxColumns: number,
): { placed: PlacedSegment<Item>[]; hidden: EventSegment<Item>[] } {
  const columns: EventSegment<Item>[][] = [];
  const columnOf = new Map<string, number>();

  for (const segment of cluster) {
    let index = 0;
    while (columns[index]?.some((other) => overlaps(other, segment))) index += 1;
    (columns[index] ??= []).push(segment);
    columnOf.set(segment.key, index);
  }

  const total = Math.max(Math.min(columns.length, maxColumns), 1);
  const hidden = columns.slice(total).flat();

  const placed = columns
    .slice(0, total)
    .flat()
    .map((segment) => {
      const column = columnOf.get(segment.key) ?? 0;
      let span = 1;
      for (let next = column + 1; next < total; next += 1) {
        if (columns[next]!.some((other) => overlaps(other, segment))) break;
        span += 1;
      }
      return { ...segment, column, span, columns: total };
    });

  return { placed, hidden };
}

export function layoutDay<Item extends CalendarEventLike>(
  segments: EventSegment<Item>[],
  maxColumns = 3,
): { placed: PlacedSegment<Item>[]; overflow: DayOverflow[] } {
  const sorted = [...segments].sort((one, other) =>
    compareSpan(
      { start: one.start, end: one.end, id: one.key },
      {
        start: other.start,
        end: other.end,
        id: other.key,
      },
    ),
  );
  const placed: PlacedSegment<Item>[] = [];
  const overflow: DayOverflow[] = [];

  let cluster: EventSegment<Item>[] = [];
  let clusterEnd = 0;

  function flush() {
    if (cluster.length === 0) return;

    const result = placeCluster(cluster, maxColumns);
    placed.push(...result.placed);

    if (result.hidden.length > 0) {
      const starts = result.hidden.map((segment) => segment.start.getTime());
      const ends = result.hidden.map((segment) => segment.end.getTime());
      overflow.push({
        dayIndex: result.hidden[0]!.dayIndex,
        start: new Date(Math.min(...starts)),
        end: new Date(Math.max(...ends)),
        count: result.hidden.length,
      });
    }

    cluster = [];
    clusterEnd = 0;
  }

  for (const segment of sorted) {
    if (cluster.length > 0 && segment.start.getTime() >= clusterEnd) flush();
    cluster.push(segment);
    clusterEnd = Math.max(clusterEnd, segment.end.getTime());
  }
  flush();

  return { placed, overflow };
}

export function segmentBox<Item extends CalendarEventLike>(
  segment: EventSegment<Item>,
  options: { dayStart: number; dayEnd: number; hourHeight: number },
): SegmentBox {
  const from = options.dayStart * 60;
  const to = options.dayEnd * 60;
  const perMinute = options.hourHeight / 60;

  const start = segment.continuesBefore ? 0 : minutesOfDay(segment.start);
  const end = Math.max(endMinutes(segment), start);

  const top = Math.min(Math.max(start, from), to);
  const bottom = Math.min(Math.max(end, from), to);

  return {
    top: (top - from) * perMinute,
    height: Math.max(bottom - top, 0) * perMinute,
    outsideBefore: start < from,
    outsideAfter: end > to,
  };
}
