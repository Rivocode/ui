"use client";

import { useEffect, useState, type ComponentProps } from "react";

const LOCALE = "pt-BR";

const RANGES = [
  { unit: "year", seconds: 31_536_000 },
  { unit: "month", seconds: 2_592_000 },
  { unit: "week", seconds: 604_800 },
  { unit: "day", seconds: 86_400 },
  { unit: "hour", seconds: 3_600 },
  { unit: "minute", seconds: 60 },
] as const;

export type RelativeUnit = (typeof RANGES)[number]["unit"];

const REFRESH: Record<RelativeUnit | "now", number> = {
  now: 15_000,
  minute: 30_000,
  hour: 60_000,
  day: 3_600_000,
  week: 3_600_000,
  month: 3_600_000,
  year: 3_600_000,
};

const relative = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
const absolute = new Intl.DateTimeFormat(LOCALE, { dateStyle: "short" });
const full = new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeStyle: "short" });

export type RelativeTimeProps = Omit<ComponentProps<"time">, "dateTime" | "title" | "children"> & {
  /**
   * The instant being described. An invalid date is rendered as "—", with no `dateTime`, no `title`
   * and no clock.
   */
  value: Date | string | number;
  /**
   * The unit from which to stop counting and show the date. "ha 412 dias"
   * says nothing; the date does.
   */
  cutoff?: RelativeUnit;
  /**
   * The "now", for tests and for server rendering. When this is passed, the
   * text stops updating by itself - whoever pinned "now" does not want a clock.
   */
  now?: Date;
};

function describe(value: Date, now: Date, cutoff: RelativeUnit | undefined) {
  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const size = Math.abs(seconds);

  if (size < 60) return { text: "agora", unit: "now" as const };

  for (const range of RANGES) {
    if (size < range.seconds) continue;

    if (
      cutoff &&
      RANGES.findIndex((r) => r.unit === range.unit) <= RANGES.findIndex((r) => r.unit === cutoff)
    ) {
      return { text: absolute.format(value), unit: "year" as const };
    }

    const amount = Math.round(seconds / range.seconds);
    return { text: relative.format(amount, range.unit), unit: range.unit };
  }

  return { text: "agora", unit: "now" as const };
}

export function RelativeTime({ value, cutoff, now, ...props }: RelativeTimeProps) {
  const date = value instanceof Date ? value : new Date(value);
  const valid = !Number.isNaN(date.getTime());
  const [tick, setTick] = useState(0);

  const current = now ?? new Date();
  const { text, unit } = valid
    ? describe(date, current, cutoff)
    : { text: "—", unit: "now" as const };

  useEffect(() => {
    if (now || !valid) return;

    const timer = setTimeout(() => setTick((value) => value + 1), REFRESH[unit]);
    return () => clearTimeout(timer);
  }, [now, unit, tick, valid]);

  if (!valid) return <time {...props}>{text}</time>;

  return (
    <time {...props} dateTime={date.toISOString()} title={full.format(date)}>
      {text}
    </time>
  );
}
