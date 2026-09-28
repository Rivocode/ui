import { useEffect, useState } from "react";
import { AppState, type TextProps } from "react-native";

import { formatDate } from "./calendar";
import { cn } from "./cn";
import { Text } from "./text";

const UNITS = [
  { unit: "year", seconds: 31_536_000, one: "ano", many: "anos" },
  { unit: "month", seconds: 2_592_000, one: "mês", many: "meses" },
  { unit: "week", seconds: 604_800, one: "semana", many: "semanas" },
  { unit: "day", seconds: 86_400, one: "dia", many: "dias" },
  { unit: "hour", seconds: 3_600, one: "hora", many: "horas" },
  { unit: "minute", seconds: 60, one: "minuto", many: "minutos" },
] as const;

export type RelativeUnit = (typeof UNITS)[number]["unit"];

export type RelativeTimeLabels = {
  now: string;
  past: (amount: number, unit: RelativeUnit) => string;
  future: (amount: number, unit: RelativeUnit) => string;
};

const wordOf = (amount: number, unit: RelativeUnit) => {
  const range = UNITS.find((one) => one.unit === unit)!;
  return amount === 1 ? range.one : range.many;
};

const LABELS: RelativeTimeLabels = {
  now: "agora",
  past: (amount, unit) => `há ${amount} ${wordOf(amount, unit)}`,
  future: (amount, unit) => `em ${amount} ${wordOf(amount, unit)}`,
};

export const REFRESH: Record<RelativeUnit | "now", number> = {
  now: 15_000,
  minute: 30_000,
  hour: 300_000,
  day: 3_600_000,
  week: 3_600_000,
  month: 3_600_000,
  year: 3_600_000,
};

const isoLocal = (date: Date) => {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export function describeRelative(
  value: Date,
  now: Date,
  cutoff?: RelativeUnit,
  labels: RelativeTimeLabels = LABELS,
) {
  if (Number.isNaN(value.getTime()) || Number.isNaN(now.getTime())) {
    return { text: "—", step: null };
  }

  const seconds = Math.round((value.getTime() - now.getTime()) / 1000);
  const size = Math.abs(seconds);
  const past = seconds <= 0;

  if (size < 60) return { text: labels.now, step: REFRESH.now };

  const cutIndex = cutoff ? UNITS.findIndex((range) => range.unit === cutoff) : -1;

  for (const [index, range] of UNITS.entries()) {
    if (size < range.seconds) continue;

    if (cutIndex >= 0 && index <= cutIndex) {
      return { text: formatDate(isoLocal(value)), step: past ? null : REFRESH.year };
    }

    const amount = Math.abs(Math.round(seconds / range.seconds));
    return {
      text: past ? labels.past(amount, range.unit) : labels.future(amount, range.unit),
      step: REFRESH[range.unit],
    };
  }

  return { text: labels.now, step: REFRESH.now };
}

export type RelativeTimeProps = Omit<TextProps, "children" | "className"> & {
  /** O instante que se descreve. */
  value: Date | string | number;
  /**
   * A partir de qual unidade parar de contar e mostrar a data. "há 412 dias"
   * não diz nada; a data diz.
   */
  cutoff?: RelativeUnit;
  /**
   * O agora, para teste e para tela congelada. Passando isto, o texto para de
   * se atualizar sozinho - quem fixou o agora não quer relógio.
   */
  now?: Date;
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `now` e o que sai no primeiro
   * minuto, e `past` e `future` escrevem a distancia, com o numero e a unidade
   * (`minute`, `hour`, `day`, `week`, `month`, `year`). Passe so os que mudam.
   */
  labels?: Partial<RelativeTimeLabels>;
};

export function RelativeTime({
  value,
  cutoff,
  now,
  className,
  labels,
  ...props
}: RelativeTimeProps) {
  const date = value instanceof Date ? value : new Date(value);
  const [tick, setTick] = useState(0);

  const current = now ?? new Date();
  const { text, step } = describeRelative(date, current, cutoff, { ...LABELS, ...labels });

  useEffect(() => {
    if (now !== undefined || step === null) return;

    const refresh = () => setTick((count) => count + 1);
    const timer = setTimeout(refresh, step);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      clearTimeout(timer);
      subscription?.remove();
    };
  }, [now, step, tick]);

  return (
    <Text {...props} className={cn("text-sm text-fg-muted", className)}>
      {text}
    </Text>
  );
}
