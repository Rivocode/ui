import {
  addDays,
  addMonths,
  daysBetween,
  minutesOfDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "./event-layout";

export type GanttScale = "day" | "week" | "month";

export type GanttTaskLike = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  group?: string;
};

export type GanttRange = { start: Date; end: Date };

export type HeaderCell = {
  key: string;
  label: string;
  from: number;
  days: number;
  weekend?: boolean;
};

export type GanttRow<Task extends GanttTaskLike> =
  | {
      kind: "group";
      key: string;
      name: string;
      tasks: Task[];
      start: Date;
      end: Date;
      expanded: boolean;
      position: number;
      size: number;
    }
  | {
      kind: "task";
      key: string;
      task: Task;
      level: 1 | 2;
      position: number;
      size: number;
    };

export const PX_PER_DAY: Record<GanttScale, number> = { day: 40, week: 18, month: 5 };

export type GanttWords = {
  locale: string;
  range: (from: string, to: string) => string;
};

export const GANTT_WORDS: GanttWords = {
  locale: "pt-BR",
  range: (from, to) => `${from} a ${to}`,
};

const shortMonth = (date: Date, locale: string) =>
  date.toLocaleDateString(locale, { month: "short" }).replace(/\.$/, "");

const weekdayInitial = (date: Date, locale: string) =>
  date.toLocaleDateString(locale, { weekday: "narrow" });

export function isMilestone(task: { start: Date; end: Date }): boolean {
  return task.end.getTime() <= task.start.getTime();
}

export function lastDay(task: { start: Date; end: Date }): Date {
  if (isMilestone(task)) return startOfDay(task.start);
  return startOfDay(new Date(task.end.getTime() - 1));
}

export function dayOffset(origin: Date, date: Date): number {
  return daysBetween(origin, date) + minutesOfDay(date) / 1440;
}

function withTime(day: Date, source: Date): Date {
  const copy = new Date(day);
  copy.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
  return copy;
}

export function shiftDate(date: Date, scale: GanttScale, amount: number): Date {
  if (amount === 0) return new Date(date);
  if (scale === "day") return addDays(date, amount);
  if (scale === "week") return addDays(date, amount * 7);
  return withTime(addMonths(date, amount), date);
}

export function moveTask(task: { start: Date; end: Date }, scale: GanttScale, amount: number) {
  const start = shiftDate(task.start, scale, amount);
  const end = withTime(addDays(startOfDay(start), daysBetween(task.start, task.end)), task.end);
  return { start, end };
}

export function resizeTask(task: { start: Date; end: Date }, scale: GanttScale, amount: number) {
  const floor = addDays(task.start, 1);
  const wanted = shiftDate(task.end, scale, amount);
  const end = wanted.getTime() < floor.getTime() ? floor : wanted;
  return { start: new Date(task.start), end };
}

export function dragTask(
  task: { start: Date; end: Date },
  edge: "move" | "start" | "end",
  days: number,
) {
  if (edge === "move") return { start: addDays(task.start, days), end: addDays(task.end, days) };

  if (edge === "end") {
    const floor = addDays(task.start, 1);
    const end = addDays(task.end, days);
    return { start: new Date(task.start), end: end.getTime() < floor.getTime() ? floor : end };
  }

  const ceiling = addDays(task.end, -1);
  const start = addDays(task.start, days);
  return {
    start: start.getTime() > ceiling.getTime() ? ceiling : start,
    end: new Date(task.end),
  };
}

export function spokenDay(day: Date, withYear = false, locale = GANTT_WORDS.locale): string {
  return day.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export function spokenRange(
  task: { start: Date; end: Date },
  words: GanttWords = GANTT_WORDS,
): string {
  const { locale, range } = words;
  const first = startOfDay(task.start);
  if (isMilestone(task)) return spokenDay(first, false, locale);

  const last = lastDay(task);
  if (first.getTime() === last.getTime()) return spokenDay(first, false, locale);

  if (first.getFullYear() !== last.getFullYear()) {
    return range(spokenDay(first, true, locale), spokenDay(last, true, locale));
  }
  if (first.getMonth() !== last.getMonth()) {
    return range(spokenDay(first, false, locale), spokenDay(last, false, locale));
  }
  return range(
    first.toLocaleDateString(locale, { day: "numeric" }),
    spokenDay(last, false, locale),
  );
}

export function scaleRange(
  tasks: { start: Date; end: Date }[],
  scale: GanttScale,
  today: Date,
): GanttRange {
  let min = startOfDay(today);
  let max = startOfDay(today);

  if (tasks.length > 0) {
    min = tasks.reduce((low, task) => (task.start < low ? task.start : low), tasks[0]!.start);
    max = tasks.reduce((high, task) => (task.end > high ? task.end : high), tasks[0]!.end);
  }

  if (scale === "day") {
    return { start: addDays(startOfDay(min), -3), end: addDays(startOfDay(max), 5) };
  }
  if (scale === "week") {
    return { start: addDays(startOfWeek(min), -7), end: addDays(startOfWeek(max), 21) };
  }
  return { start: addMonths(startOfMonth(min), -1), end: addMonths(startOfMonth(max), 2) };
}

export function totalDays(range: GanttRange): number {
  return Math.max(daysBetween(range.start, range.end), 1);
}

export function headerTiers(
  range: GanttRange,
  scale: GanttScale,
  locale = GANTT_WORDS.locale,
): [HeaderCell[], HeaderCell[]] {
  const origin = startOfDay(range.start);
  const days = totalDays(range);
  const top: HeaderCell[] = [];
  const bottom: HeaderCell[] = [];

  const push = (list: HeaderCell[], cell: HeaderCell) => {
    const from = Math.max(cell.from, 0);
    const to = Math.min(cell.from + cell.days, days);
    if (to > from) list.push({ ...cell, from, days: to - from });
  };

  if (scale === "month") {
    for (let year = origin.getFullYear(); year <= addDays(origin, days - 1).getFullYear(); year++) {
      const from = daysBetween(origin, new Date(year, 0, 1));
      const length = daysBetween(new Date(year, 0, 1), new Date(year + 1, 0, 1));
      push(top, { key: `y${year}`, label: String(year), from, days: length });
    }
    for (
      let month = startOfMonth(origin);
      daysBetween(origin, month) < days;
      month = addMonths(month, 1)
    ) {
      const from = daysBetween(origin, month);
      push(bottom, {
        key: `m${month.getFullYear()}-${month.getMonth()}`,
        label: shortMonth(month, locale),
        from,
        days: daysBetween(month, addMonths(month, 1)),
      });
    }
    return [top, bottom];
  }

  for (
    let month = startOfMonth(origin);
    daysBetween(origin, month) < days;
    month = addMonths(month, 1)
  ) {
    push(top, {
      key: `m${month.getFullYear()}-${month.getMonth()}`,
      label: month.toLocaleDateString(locale, { month: "long", year: "numeric" }),
      from: daysBetween(origin, month),
      days: daysBetween(month, addMonths(month, 1)),
    });
  }

  if (scale === "day") {
    for (let index = 0; index < days; index++) {
      const day = addDays(origin, index);
      const weekday = day.getDay();
      bottom.push({
        key: `d${index}`,
        label: `${weekdayInitial(day, locale)} ${day.getDate()}`,
        from: index,
        days: 1,
        weekend: weekday === 0 || weekday === 6,
      });
    }
    return [top, bottom];
  }

  for (let week = startOfWeek(origin); daysBetween(origin, week) < days; week = addDays(week, 7)) {
    push(bottom, {
      key: `w${week.getTime()}`,
      label: `${String(week.getDate()).padStart(2, "0")}/${String(week.getMonth() + 1).padStart(2, "0")}`,
      from: daysBetween(origin, week),
      days: 7,
    });
  }
  return [top, bottom];
}

export function buildRows<Task extends GanttTaskLike>(
  tasks: Task[],
  collapsed: ReadonlySet<string>,
): GanttRow<Task>[] {
  const order: (string | Task)[] = [];
  const groups = new Map<string, Task[]>();

  for (const task of tasks) {
    if (task.group === undefined || task.group === "") {
      order.push(task);
      continue;
    }
    const members = groups.get(task.group);
    if (members) members.push(task);
    else {
      groups.set(task.group, [task]);
      order.push(task.group);
    }
  }

  const rows: GanttRow<Task>[] = [];
  let topPosition = 0;
  const topSize = order.length;

  for (const entry of order) {
    topPosition++;
    if (typeof entry !== "string") {
      rows.push({
        kind: "task",
        key: `t:${entry.id}`,
        task: entry,
        level: 1,
        position: topPosition,
        size: topSize,
      });
      continue;
    }

    const members = groups.get(entry)!;
    const start = members.reduce(
      (low, task) => (task.start < low ? task.start : low),
      members[0]!.start,
    );
    const end = members.reduce(
      (high, task) => (task.end > high ? task.end : high),
      members[0]!.end,
    );
    const expanded = !collapsed.has(entry);

    rows.push({
      kind: "group",
      key: `g:${entry}`,
      name: entry,
      tasks: members,
      start,
      end,
      expanded,
      position: topPosition,
      size: topSize,
    });

    if (!expanded) continue;
    members.forEach((task, index) => {
      rows.push({
        kind: "task",
        key: `t:${task.id}`,
        task,
        level: 2,
        position: index + 1,
        size: members.length,
      });
    });
  }

  return rows;
}

export function arrowPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
): string {
  const gap = 8;
  const out = from.x + gap;
  const into = to.x - gap;

  if (into >= out) {
    return `M ${from.x} ${from.y} H ${out} V ${to.y} H ${to.x}`;
  }

  const between = to.y > from.y ? to.y - rowHeight / 2 : to.y + rowHeight / 2;
  return `M ${from.x} ${from.y} H ${out} V ${between} H ${into} V ${to.y} H ${to.x}`;
}
