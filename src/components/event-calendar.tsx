"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";
import {
  addDays,
  addMonths,
  isSameDay,
  layoutDay,
  minutesOfDay,
  packBars,
  segmentBox,
  spansFullWindow,
  splitEvents,
  startOfDay,
  toBars,
  visibleDays,
  type DayOverflow,
  type EventBar,
  type EventCalendarView,
  type EventSegment,
  type PlacedSegment,
  type WeekStart,
} from "../lib/event-layout";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import { useMobile } from "../lib/screen";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { CalendarPanel } from "./calendar-panel";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { Toggle, ToggleGroup } from "./toggle";

export type { EventCalendarView, WeekStart } from "../lib/event-layout";

export type CalendarEventTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export type CalendarEvent = {
  id: string;
  /** O que a pessoa le na tarja e o que o leitor de tela anuncia primeiro. */
  title: string;
  start: Date;
  end: Date;
  /** Manda o compromisso para a faixa de cima, sem hora. */
  allDay?: boolean;
  /** O vocabulario fechado da casa, o mesmo do Badge e da Timeline. */
  tone?: CalendarEventTone;
};

export type EventCalendarRange = { start: Date; end: Date };

export type CalendarEventInfo = {
  view: EventCalendarView;
  /** `block` na grade de tempo, `bar` no mes e na faixa, `row` na agenda. */
  shape: "block" | "bar" | "row";
  /** O comeco desenhado, ja cortado na meia-noite do dia em que ele aparece. */
  start: Date;
  end: Date;
  continuesBefore: boolean;
  continuesAfter: boolean;
  allDay: boolean;
};

const LOCALE = "pt-BR";

const ALL_VIEWS: EventCalendarView[] = ["agenda", "day", "week", "month"];

const VIEW_LABEL: Record<EventCalendarView, string> = {
  agenda: "Agenda",
  day: "Dia",
  week: "Semana",
  month: "Mês",
};

const TONE: Record<CalendarEventTone, string> = {
  neutral: "border-border bg-surface-raised text-fg-muted",
  accent: "border-border-strong bg-accent-subtle text-accent-text",
  success: "border-border bg-success-subtle text-success-text",
  warning: "border-border bg-warning-subtle text-warning-text",
  danger: "border-border bg-danger-subtle text-danger-text",
  info: "border-border bg-info-subtle text-info-text",
};

const TONE_MARK: Record<CalendarEventTone, string> = {
  neutral: "bg-fg-muted",
  accent: "bg-accent-text",
  success: "bg-success-text",
  warning: "bg-warning-text",
  danger: "bg-danger-text",
  info: "bg-info-text",
};

const SLOT_MINUTES = 30;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function clock(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" });
}

function weekdayName(day: Date, style: "short" | "long"): string {
  return capitalize(day.toLocaleDateString(LOCALE, { weekday: style })).replace(/\.$/, "");
}

function dayTitle(day: Date): string {
  return capitalize(
    day.toLocaleDateString(LOCALE, { weekday: "long", day: "numeric", month: "long" }),
  );
}

function monthTitle(date: Date): string {
  return capitalize(date.toLocaleDateString(LOCALE, { month: "long", year: "numeric" }));
}

function countLabel(count: number): string {
  return count === 1 ? "1 compromisso" : `${count} compromissos`;
}

function periodTitle(view: EventCalendarView, date: Date, days: Date[]): string {
  if (view === "day") {
    return capitalize(
      date.toLocaleDateString(LOCALE, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }

  if (view === "week") {
    const first = days[0] ?? date;
    const last = days[days.length - 1] ?? date;
    const month = (day: Date) => day.toLocaleDateString(LOCALE, { month: "long" });

    if (first.getMonth() === last.getMonth()) {
      return `${first.getDate()} a ${last.getDate()} de ${month(last)} de ${last.getFullYear()}`;
    }
    return `${first.getDate()} de ${month(first)} a ${last.getDate()} de ${month(last)} de ${last.getFullYear()}`;
  }

  return monthTitle(date);
}

function toneOf(event: CalendarEvent): CalendarEventTone {
  return event.tone ?? "neutral";
}

function spokenEvent(
  segment: EventSegment<CalendarEvent>,
  allDay: boolean,
  position: string,
): string {
  const parts = [position, segment.event.title];

  parts.push(allDay ? "dia inteiro" : `das ${clock(segment.start)} às ${clock(segment.end)}`);
  if (segment.continuesBefore) parts.push("continua do dia anterior");
  if (segment.continuesAfter) parts.push("continua no dia seguinte");

  return parts.join(", ");
}

type FocusEntry = { key: string; dayIndex: number; at: number };

type DayColumn = {
  day: Date;
  dayIndex: number;
  placed: PlacedSegment<CalendarEvent>[];
  overflow: DayOverflow[];
  rank: Map<string, number>;
  size: number;
  count: number;
};

function byStart(one: { start: Date }, other: { start: Date }): number {
  return one.start.getTime() - other.start.getTime();
}

function ranks(keys: string[]): Map<string, number> {
  return new Map(keys.map((key, index) => [key, index + 1]));
}

type EventItemProps = {
  segment: EventSegment<CalendarEvent>;
  shape: CalendarEventInfo["shape"];
  view: EventCalendarView;
  allDay: boolean;
  position: number;
  total: number;
  active: boolean;
  onSelect?: (event: CalendarEvent) => void;
  onMove: (event: KeyboardEvent<HTMLElement>, key: string) => void;
  onFocused: (key: string) => void;
  renderEvent?: (event: CalendarEvent, info: CalendarEventInfo) => ReactNode;
  className?: string;
  style?: ComponentProps<"div">["style"];
  showTime?: boolean;
  keyPrefix?: string;
  roving?: boolean;
};

function EventItem({
  segment,
  shape,
  view,
  allDay,
  position,
  total,
  active,
  onSelect,
  onMove,
  onFocused,
  renderEvent,
  className,
  style,
  showTime = true,
  keyPrefix = "",
  roving = true,
}: EventItemProps) {
  const tone = toneOf(segment.event);
  const info: CalendarEventInfo = {
    view,
    shape,
    start: segment.start,
    end: segment.end,
    continuesBefore: segment.continuesBefore,
    continuesAfter: segment.continuesAfter,
    allDay,
  };

  const time = allDay ? "Dia inteiro" : clock(segment.start);

  const body = renderEvent ? (
    renderEvent(segment.event, info)
  ) : shape === "row" ? (
    <>
      <span className="w-20 shrink-0 font-mono text-sm text-fg-subtle">{time}</span>
      <span className="min-w-0 flex-1 text-base text-fg">{segment.event.title}</span>
    </>
  ) : shape === "bar" ? (
    <>
      <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-pill", TONE_MARK[tone])} />
      <span className="min-w-0 flex-1 truncate">{segment.event.title}</span>
    </>
  ) : (
    <>
      <span className="block truncate font-medium">{segment.event.title}</span>
      {showTime && <span className="block truncate">{time}</span>}
    </>
  );

  return (
    <div
      role="listitem"
      aria-setsize={total}
      aria-posinset={position}
      style={style}
      className={cn(shape === "block" && "absolute", className)}
    >
      <div
        data-rc-event=""
        data-rc-event-key={`${keyPrefix}${segment.key}`}
        data-rc-tone={tone}
        role={onSelect ? "button" : undefined}
        tabIndex={roving && !active ? -1 : 0}
        aria-label={spokenEvent(segment, allDay, `${position} de ${total}`)}
        onFocus={() => onFocused(segment.key)}
        onKeyDown={(keyboard) => {
          if ((keyboard.key === "Enter" || keyboard.key === " ") && onSelect) {
            keyboard.preventDefault();
            keyboard.stopPropagation();
            onSelect(segment.event);
            return;
          }
          if (roving) onMove(keyboard, segment.key);
        }}
        onClick={(pointer) => {
          pointer.stopPropagation();
          onSelect?.(segment.event);
        }}
        className={cn(
          "relative flex min-w-0 overflow-hidden text-start",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:z-[var(--rc-z-sticky)]",
          onSelect && "cursor-pointer",
          shape === "row" && "w-full items-start gap-3 px-3 py-2 hover:bg-accent-subtle",
          shape === "bar" &&
            cn(
              "h-5 items-center gap-1.5 rounded-sm border px-1.5 text-xs",
              TONE[tone],
              segment.continuesBefore && "rounded-s-none border-s-0",
              segment.continuesAfter && "rounded-e-none border-e-0",
            ),
          shape === "block" &&
            cn(
              "h-full min-h-[var(--rc-control-md)] max-sm:min-h-11",
              "flex-col rounded-sm border py-0.5 pe-1 ps-2.5 text-xs shadow-1",
              TONE[tone],
              segment.continuesBefore && "rounded-t-none",
              segment.continuesAfter && "rounded-b-none",
            ),
        )}
      >
        {shape === "block" && (
          <span
            aria-hidden="true"
            className={cn("absolute inset-y-0.5 start-0.5 w-0.5 rounded-pill", TONE_MARK[tone])}
          />
        )}
        {body}
      </div>
    </div>
  );
}

type OverflowChipProps = {
  count: number;
  day: Date;
  chipKey: string;
  active: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMove: (event: KeyboardEvent<HTMLElement>, key: string) => void;
  onFocused: (key: string) => void;
  className?: string;
  style?: ComponentProps<"div">["style"];
  children: ReactNode;
};

function OverflowChip({
  count,
  day,
  chipKey,
  active,
  open,
  onOpenChange,
  onMove,
  onFocused,
  className,
  style,
  children,
}: OverflowChipProps) {
  const trigger = (
    <button
      type="button"
      data-rc-event-key={chipKey}
      data-rc-overflow=""
      tabIndex={active ? 0 : -1}
      aria-label={`Mais ${count} em ${dayTitle(day)}`}
      onFocus={() => onFocused(chipKey)}
      onKeyDown={(keyboard) => {
        if (keyboard.key === "Enter" || keyboard.key === " ") return;
        onMove(keyboard, chipKey);
      }}
      onClick={(pointer) => pointer.stopPropagation()}
      className={cn(
        "flex h-5 w-full items-center rounded-sm px-1.5 text-start text-xs font-medium",
        "text-accent-text hover:bg-accent-subtle",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {`+${count} mais`}
    </button>
  );

  return (
    <div style={style} className={cn(style && "absolute")}>
      <CalendarPanel
        open={open}
        onOpenChange={onOpenChange}
        trigger={trigger}
        title={dayTitle(day)}
        align="start"
        className="w-[min(20rem,calc(100vw-2rem))] p-0"
      >
        {children}
      </CalendarPanel>
    </div>
  );
}

export type EventCalendarProps = Omit<
  ComponentProps<"div">,
  "children" | "onSelect" | "defaultValue"
> & {
  /** A vista mostrada, quando quem usa controla o estado. */
  view?: EventCalendarView;
  /** A vista inicial, quando o componente controla o proprio estado. */
  defaultView?: EventCalendarView;
  onViewChange?: (view: EventCalendarView) => void;
  /**
   * Quais vistas aparecem no seletor. Abaixo de 640px a semana sai da lista,
   * e uma vista pedida que nao esta la resolve para a agenda, sem aviso.
   */
  views?: EventCalendarView[];

  /** A data ancora do periodo visivel, quando quem usa controla o estado. */
  date?: Date;
  /** A data ancora inicial. Sem ela, hoje. */
  defaultDate?: Date;
  onDateChange?: (date: Date) => void;
  /**
   * Avisa que o periodo visivel mudou, para o app buscar. O fim e exclusivo:
   * e a meia-noite do dia seguinte ao ultimo dia mostrado.
   */
  onRangeChange?: (range: EventCalendarRange) => void;

  /** Os compromissos ja expandidos: a peca nao expande recorrencia. */
  events?: CalendarEvent[];
  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  /** O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar". */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /** O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo". */
  retryLabel?: ReactNode;
  /**
   * O que aparece quando a consulta volta sem nada no periodo. Na agenda ele
   * ocupa o lugar da lista; nas grades ele fica por cima, porque a grade
   * tambem e onde se clica para criar.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

  onEventSelect?: (event: CalendarEvent) => void;
  /**
   * Clique no vazio da grade, arredondado em meia hora. Nao dispara na agenda,
   * que nao tem geometria de tempo onde clicar.
   */
  onSlotSelect?: (range: EventCalendarRange) => void;
  /**
   * Troca so o miolo da tarja; a caixa, o foco e o rotulo continuam da peca.
   *
   * Ela corre DURANTE o render, e por isso tem que ser pura: montar JSX pode,
   * chamar `setState` de qualquer componente nao. Fazer isso rende o aviso
   * "Cannot update a component while rendering a different component", que
   * aponta para a peca de dentro e nao para a linha que causou - e por isso e
   * dificil de achar. Se voce precisa reagir a um evento, use `onEventSelect`.
   */
  renderEvent?: (event: CalendarEvent, info: CalendarEventInfo) => ReactNode;

  /** 0 domingo, 1 segunda. */
  weekStartsOn?: WeekStart;
  /** A primeira hora desenhada na grade de tempo. */
  dayStart?: number;
  /** A ultima hora desenhada. O que cai fora encosta na beirada da calha. */
  dayEnd?: number;
  /** Quantos pixels vale uma hora. E a escala que faz duracao virar altura. */
  hourHeight?: number;
  /** Quantas colunas um choque de horario pode abrir antes de virar "+N". */
  maxColumns?: number;
  /** Quantas faixas cabem na barra de dia inteiro e na celula do mes. */
  maxLanes?: number;
  /** Altura maxima da area que rola. Numero vira pixel. O mes nao rola por dentro. */
  maxHeight?: number | string;

  /** O nome do calendario para o leitor de tela. */
  label?: string;
  /**
   * Classe por parte: `toolbar`, `body`, `header`, `gutter`, `column`,
   * `event`, `band`, `cell`, `section`.
   */
  classNames?: Slots<
    "toolbar" | "body" | "header" | "gutter" | "column" | "event" | "band" | "cell" | "section"
  >;
};

export function EventCalendar({
  view: viewProp,
  defaultView = "week",
  onViewChange,
  views = ALL_VIEWS,
  date: dateProp,
  defaultDate,
  onDateChange,
  onRangeChange,
  events,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar os compromissos.",
  retryLabel = "Tentar de novo",
  empty,
  onEventSelect,
  onSlotSelect,
  renderEvent,
  weekStartsOn = 1,
  dayStart = 7,
  dayEnd = 20,
  hourHeight = 48,
  maxColumns = 3,
  maxLanes = 3,
  maxHeight = 560,
  label,
  className,
  classNames,
  ...props
}: EventCalendarProps) {
  const rtl = useDirection() === "rtl";
  const isMobile = useMobile();
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLButtonElement>(null);

  const [viewState, setViewState] = useState<EventCalendarView>(defaultView);
  const [dateState, setDateState] = useState<Date>(() => defaultDate ?? new Date());
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  const focusWanted = useRef(false);

  const offered = views.filter((option) => !(isMobile && option === "week"));
  const wanted = viewProp ?? viewState;
  const view = offered.includes(wanted)
    ? wanted
    : offered.includes("agenda")
      ? "agenda"
      : (offered[0] ?? "agenda");

  const date = dateProp ?? dateState;
  const days = useMemo(() => visibleDays(view, date, weekStartsOn), [view, date, weekStartsOn]);

  const first = days[0] ?? startOfDay(date);
  const after = addDays(startOfDay(days[days.length - 1] ?? date), 1);

  function changeView(next: EventCalendarView) {
    if (viewProp === undefined) setViewState(next);
    onViewChange?.(next);
  }

  function changeDate(next: Date) {
    if (dateProp === undefined) setDateState(next);
    onDateChange?.(next);
  }

  function shift(step: number) {
    if (view === "day") changeDate(addDays(date, step));
    else if (view === "week") changeDate(addDays(date, step * 7));
    else changeDate(addMonths(date, step));
  }

  const latestRange = useRef(onRangeChange);
  useEffect(() => {
    latestRange.current = onRangeChange;
  });

  const startMs = first.getTime();
  const endMs = after.getTime();
  useEffect(() => {
    latestRange.current?.({ start: new Date(startMs), end: new Date(endMs) });
  }, [startMs, endMs]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loading = isLoading || events === undefined;

  const shown = useMemo(() => {
    if (loading) return [];
    return (events ?? []).filter((event) => {
      const start = event.start.getTime();
      const end = Math.max(event.end.getTime(), start);
      return start < endMs && (end > startMs || (end === start && start >= startMs));
    });
  }, [events, loading, startMs, endMs]);

  const windowMinutes = Math.max(dayEnd - dayStart, 1) * 60;

  const model = useMemo(() => {
    const banded = shown.filter((event) => spansFullWindow(event, windowMinutes));
    const timed = shown.filter((event) => !spansFullWindow(event, windowMinutes));

    if (view === "month") {
      const weeks: {
        days: Date[];
        offset: number;
        bars: EventBar<CalendarEvent>[];
        all: EventBar<CalendarEvent>[];
        hiddenByDay: number[];
        lanes: number;
      }[] = [];

      for (let at = 0; at < days.length; at += 7) {
        const week = days.slice(at, at + 7);
        const packed = packBars(toBars(shown, week), maxLanes, week.length);
        weeks.push({
          days: week,
          offset: at,
          bars: packed.placed,
          all: [...packed.placed, ...packed.hidden],
          hiddenByDay: packed.hiddenByDay,
          lanes: packed.lanes,
        });
      }
      return { kind: "month" as const, weeks };
    }

    if (view === "agenda") {
      const segments = splitEvents(shown, days);
      const sections = days
        .map((day, dayIndex) => ({
          day,
          dayIndex,
          items: segments
            .filter((segment) => segment.dayIndex === dayIndex)
            .sort((one, other) => one.start.getTime() - other.start.getTime()),
        }))
        .filter((section) => section.items.length > 0);
      return { kind: "agenda" as const, sections };
    }

    const band = packBars(toBars(banded, days), maxLanes, days.length);
    const bandAll = [...band.placed, ...band.hidden].sort((one, other) =>
      byStart(one.event, other.event),
    );
    const segments = splitEvents(timed, days);

    const columns: DayColumn[] = days.map((day, dayIndex) => {
      const own = segments.filter((segment) => segment.dayIndex === dayIndex).sort(byStart);
      const laid = layoutDay(own, maxColumns);
      const inBand = bandAll.filter((bar) => bar.from <= dayIndex && dayIndex <= bar.to).length;

      return {
        day,
        dayIndex,
        placed: [...laid.placed].sort(byStart),
        overflow: laid.overflow,
        rank: ranks(own.map((segment) => segment.key)),
        size: own.length,
        count: own.length + inBand,
      };
    });

    return {
      kind: "time" as const,
      band,
      bandRank: ranks(bandAll.map((bar) => `${bar.event.id}@band`)),
      bandSize: bandAll.length,
      columns,
    };
  }, [shown, days, view, maxColumns, maxLanes, windowMinutes]);

  const entries = useMemo<FocusEntry[]>(() => {
    const list: FocusEntry[] = [];

    if (model.kind === "agenda") {
      for (const section of model.sections) {
        for (const item of section.items) {
          list.push({ key: item.key, dayIndex: section.dayIndex, at: item.start.getTime() });
        }
      }
      return list;
    }

    if (model.kind === "month") {
      for (const week of model.weeks) {
        for (const [index] of week.days.entries()) {
          const dayIndex = week.offset + index;
          const pieces = week.bars
            .filter((bar) => bar.from <= index && index <= bar.to)
            .sort((one, other) => one.event.start.getTime() - other.event.start.getTime());

          for (const piece of pieces) {
            list.push({
              key: `${piece.event.id}#${dayIndex}`,
              dayIndex,
              at: piece.event.start.getTime(),
            });
          }
          if ((week.hiddenByDay[index] ?? 0) > 0) {
            list.push({ key: `more#${dayIndex}`, dayIndex, at: Number.MAX_SAFE_INTEGER });
          }
        }
      }
      return list;
    }

    for (const bar of model.band.placed) {
      list.push({ key: `${bar.event.id}@band`, dayIndex: bar.from, at: bar.event.start.getTime() });
    }
    for (const column of model.columns) {
      if ((model.band.hiddenByDay[column.dayIndex] ?? 0) > 0) {
        list.push({
          key: `band-more#${column.dayIndex}`,
          dayIndex: column.dayIndex,
          at: Number.MIN_SAFE_INTEGER,
        });
      }
      for (const segment of column.placed) {
        list.push({
          key: segment.key,
          dayIndex: column.dayIndex,
          at: segment.start.getTime(),
        });
      }
      for (const spill of column.overflow) {
        list.push({
          key: `more#${column.dayIndex}#${spill.start.getTime()}`,
          dayIndex: column.dayIndex,
          at: spill.start.getTime(),
        });
      }
    }

    return list.sort((one, other) => one.dayIndex - other.dayIndex || one.at - other.at);
  }, [model]);

  const activeKey =
    focusedKey && entries.some((entry) => entry.key === focusedKey)
      ? focusedKey
      : (entries[0]?.key ?? null);

  useEffect(() => {
    if (!focusWanted.current) return;
    focusWanted.current = false;
    if (!activeKey) return;

    for (const node of root.current?.querySelectorAll<HTMLElement>("[data-rc-event-key]") ?? []) {
      if (node.dataset.rcEventKey === activeKey) {
        if (node !== document.activeElement) node.focus();
        return;
      }
    }
  }, [activeKey]);

  function nearest(dayIndex: number, at: number, edge?: "first" | "last"): string | null {
    const sameDay = entries.filter((entry) => entry.dayIndex === dayIndex);
    if (sameDay.length === 0) return null;
    if (edge === "first") return sameDay[0]!.key;
    if (edge === "last") return sameDay[sameDay.length - 1]!.key;

    return sameDay.reduce((best, entry) =>
      Math.abs(entry.at - at) < Math.abs(best.at - at) ? entry : best,
    ).key;
  }

  function step(key: string, from: string): string | null {
    const index = entries.findIndex((entry) => entry.key === from);
    const current = entries[index];
    if (!current) return entries[0]?.key ?? null;

    if (key === "Home") return entries[0]!.key;
    if (key === "End") return entries[entries.length - 1]!.key;

    if (key === "ArrowDown" || key === "ArrowUp") {
      const ahead = key === "ArrowDown" ? 1 : -1;
      const next = entries[index + ahead];
      if (next && (next.dayIndex === current.dayIndex || view === "agenda")) return next.key;
      if (view !== "month") return null;

      for (
        let dayIndex = current.dayIndex + ahead * 7;
        dayIndex >= 0 && dayIndex < days.length;
        dayIndex += ahead * 7
      ) {
        const found = nearest(dayIndex, current.at, ahead === 1 ? "first" : "last");
        if (found) return found;
      }
      return null;
    }

    const ahead = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    if (key !== ahead && key !== back) return null;

    const walk = key === ahead ? 1 : -1;
    for (
      let dayIndex = current.dayIndex + walk;
      dayIndex >= 0 && dayIndex < days.length;
      dayIndex += walk
    ) {
      const found = nearest(dayIndex, current.at);
      if (found) return found;
    }
    return null;
  }

  function onMove(keyboard: KeyboardEvent<HTMLElement>, key: string) {
    if (keyboard.key === "Escape") {
      keyboard.preventDefault();
      toolbar.current?.focus();
      return;
    }

    if (keyboard.key === "PageUp" || keyboard.key === "PageDown") {
      keyboard.preventDefault();
      focusWanted.current = true;
      setFocusedKey(null);
      shift(keyboard.key === "PageUp" ? -1 : 1);
      return;
    }

    const next = step(keyboard.key, key);
    if (next === null) return;

    keyboard.preventDefault();
    focusWanted.current = true;
    setFocusedKey(next);
  }

  function pickSlot(day: Date, minutes: number) {
    if (!onSlotSelect) return;
    const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
    const start = new Date(startOfDay(day).getTime() + snapped * 60000);
    onSlotSelect({ start, end: new Date(start.getTime() + SLOT_MINUTES * 60000) });
  }

  function pickDay(day: Date) {
    if (!onSlotSelect) return;
    const start = startOfDay(day);
    onSlotSelect({ start, end: addDays(start, 1) });
  }

  const today = startOfDay(now);
  const total = shown.length;
  const announcement = `${periodTitle(view, date, days)}, ${countLabel(total)}`;

  function agendaList(items: EventSegment<CalendarEvent>[], shapeKey: string) {
    return (
      <div role="list" className="flex flex-col divide-y divide-border">
        {items.map((segment, index) => (
          <EventItem
            key={`${shapeKey}${segment.key}`}
            keyPrefix={shapeKey}
            roving={shapeKey === ""}
            segment={segment}
            shape="row"
            view={view}
            allDay={segment.event.allDay === true || spansFullWindow(segment.event, windowMinutes)}
            position={index + 1}
            total={items.length}
            active={activeKey === segment.key}
            onSelect={onEventSelect}
            onMove={onMove}
            onFocused={setFocusedKey}
            renderEvent={renderEvent}
            className={classNames?.event}
          />
        ))}
      </div>
    );
  }

  function daySection(day: Date, dayIndex: number, items: EventSegment<CalendarEvent>[]) {
    return (
      <div
        key={day.toISOString()}
        role="group"
        data-rc-day={dayIndex}
        aria-current={isSameDay(day, today) ? "date" : undefined}
        aria-label={`${dayTitle(day)}${isSameDay(day, today) ? ", hoje" : ""}, ${countLabel(items.length)}`}
        className={cn("border-b border-border last:border-b-0", classNames?.section)}
      >
        <p
          aria-hidden="true"
          className={cn(
            "sticky top-0 z-[var(--rc-z-sticky)] bg-surface px-3 py-2",
            "text-sm font-medium text-fg-muted",
            isSameDay(day, today) && "text-accent-text",
          )}
        >
          {dayTitle(day)}
        </p>
        {agendaList(items, "")}
      </div>
    );
  }

  const dayHeader = (day: Date, short: boolean) => (
    <div
      aria-hidden="true"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2",
        classNames?.header,
      )}
    >
      <span className="truncate text-xs text-fg-subtle">
        {weekdayName(day, short ? "short" : "long")}
      </span>
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-pill text-base",
          isSameDay(day, today) ? "bg-accent text-accent-fg font-medium" : "text-fg",
        )}
      >
        {day.getDate()}
      </span>
    </div>
  );

  function bandBar(bar: EventBar<CalendarEvent>, position: number, count: number) {
    const width = (bar.to - bar.from + 1) / days.length;
    const segment: EventSegment<CalendarEvent> = {
      key: `${bar.event.id}@band`,
      event: bar.event,
      dayIndex: bar.from,
      start: bar.event.start,
      end: bar.event.end,
      continuesBefore: bar.continuesBefore,
      continuesAfter: bar.continuesAfter,
    };

    return (
      <EventItem
        key={segment.key}
        segment={segment}
        shape="bar"
        view={view}
        allDay
        position={position}
        total={count}
        active={activeKey === segment.key}
        onSelect={onEventSelect}
        onMove={onMove}
        onFocused={setFocusedKey}
        renderEvent={renderEvent}
        className={cn("absolute px-px", classNames?.event)}
        style={{
          insetInlineStart: `${(bar.from / days.length) * 100}%`,
          width: `${width * 100}%`,
          top: bar.lane * 22,
        }}
      />
    );
  }

  const body = () => {
    if (model.kind === "agenda") {
      if (!loading && model.sections.length === 0 && empty) {
        return (
          <EmptyState
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
            action={empty.action}
          />
        );
      }

      return (
        <div style={{ maxHeight }} className="overflow-auto">
          {loading
            ? Array.from({ length: 4 }, (_, index) => (
                <div key={index} aria-hidden="true" className="flex flex-col gap-2 px-3 py-3">
                  <Skeleton className="h-3 w-[12ch]" />
                  <Skeleton className="h-5 w-full max-w-[28ch]" />
                </div>
              ))
            : model.sections.map((section) =>
                daySection(section.day, section.dayIndex, section.items),
              )}
        </div>
      );
    }

    if (model.kind === "month") {
      return (
        <div className="flex flex-col">
          <div aria-hidden="true" className={cn("flex border-b border-border", classNames?.header)}>
            {days.slice(0, 7).map((day) => (
              <span
                key={day.toISOString()}
                className="min-w-0 flex-1 truncate px-1 py-1.5 text-center text-xs text-fg-subtle"
              >
                {weekdayName(day, "short")}
              </span>
            ))}
          </div>

          {model.weeks.map((week) => (
            <div key={week.offset} className="flex border-b border-border last:border-b-0">
              {week.days.map((day, index) => {
                const dayIndex = week.offset + index;
                const pieces = week.bars
                  .filter((bar) => bar.from <= index && index <= bar.to)
                  .sort((one, other) => byStart(one.event, other.event));
                const hidden = week.hiddenByDay[index] ?? 0;
                const order = ranks(
                  week.all
                    .filter((bar) => bar.from <= index && index <= bar.to)
                    .sort((one, other) => byStart(one.event, other.event))
                    .map((bar) => `${bar.event.id}#${dayIndex}`),
                );
                const all = pieces.length + hidden;
                const outside = day.getMonth() !== date.getMonth();

                return (
                  <div
                    key={day.toISOString()}
                    role="group"
                    data-rc-day={dayIndex}
                    aria-current={isSameDay(day, today) ? "date" : undefined}
                    aria-label={`${dayTitle(day)}${isSameDay(day, today) ? ", hoje" : ""}, ${countLabel(all)}`}
                    onClick={() => pickDay(day)}
                    className={cn(
                      "relative min-w-0 flex-1 border-s border-border first:border-s-0",
                      "flex min-h-20 flex-col gap-0.5 p-1 sm:min-h-26",
                      isSameDay(day, today) && "bg-selected",
                      onSlotSelect && "cursor-pointer",
                      classNames?.cell,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "px-1 text-xs",
                        outside ? "text-fg-disabled" : "text-fg-muted",
                        isSameDay(day, today) && "font-medium text-accent-text",
                      )}
                    >
                      {day.getDate()}
                    </span>

                    <div role={all > 0 ? "list" : undefined} className="flex flex-col gap-0.5">
                      {pieces.map((piece) => {
                        const segment: EventSegment<CalendarEvent> = {
                          key: `${piece.event.id}#${dayIndex}`,
                          event: piece.event,
                          dayIndex,
                          start: piece.event.start,
                          end: piece.event.end,
                          continuesBefore: piece.continuesBefore || index > piece.from,
                          continuesAfter: piece.continuesAfter || index < piece.to,
                        };

                        return (
                          <EventItem
                            key={segment.key}
                            segment={segment}
                            shape="bar"
                            view={view}
                            allDay={piece.event.allDay === true || piece.from !== piece.to}
                            position={order.get(`${piece.event.id}#${dayIndex}`) ?? 1}
                            total={all}
                            active={activeKey === segment.key}
                            onSelect={onEventSelect}
                            onMove={onMove}
                            onFocused={setFocusedKey}
                            renderEvent={renderEvent}
                            className={classNames?.event}
                          />
                        );
                      })}

                      {hidden > 0 && (
                        <OverflowChip
                          count={hidden}
                          day={day}
                          chipKey={`more#${dayIndex}`}
                          active={activeKey === `more#${dayIndex}`}
                          open={openDay === `more#${dayIndex}`}
                          onOpenChange={(next) => setOpenDay(next ? `more#${dayIndex}` : null)}
                          onMove={onMove}
                          onFocused={setFocusedKey}
                        >
                          {agendaList(splitEvents(shown, [day]), "panel")}
                        </OverflowChip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    }

    const hours = Array.from(
      { length: Math.max(dayEnd - dayStart, 1) },
      (_, index) => dayStart + index,
    );
    const columnHeight = hours.length * hourHeight;
    const bandSpill = model.band.hiddenByDay.reduce((sum, count) => sum + count, 0);
    const nowMinutes = minutesOfDay(now);
    const nowVisible = nowMinutes >= dayStart * 60 && nowMinutes <= dayEnd * 60;

    return (
      <div style={{ maxHeight }} className="overflow-auto [scrollbar-gutter:stable]">
        <div className="sticky top-0 z-[var(--rc-z-sticky)] bg-surface">
          <div className="flex border-b border-border">
            <div aria-hidden="true" className={cn("w-11 shrink-0", classNames?.gutter)} />
            {days.map((day) => (
              <div key={day.toISOString()} className="flex min-w-0 flex-1">
                {dayHeader(day, days.length > 1)}
              </div>
            ))}
          </div>

          {model.bandSize > 0 && (
            <div className={cn("flex border-b border-border", classNames?.band)}>
              <span
                aria-hidden="true"
                className={cn(
                  "flex w-11 shrink-0 items-start justify-end pe-1 pt-1 text-xs text-fg-subtle",
                  classNames?.gutter,
                )}
              >
                Dia
              </span>
              <div
                role="group"
                aria-label="Dia inteiro"
                className="relative min-w-0 flex-1 py-1"
                style={{
                  height: (Math.max(model.band.lanes, 1) + (bandSpill > 0 ? 1 : 0)) * 22 + 8,
                }}
              >
                <div role="list" className="absolute inset-x-0 top-1">
                  {model.band.placed.map((bar) =>
                    bandBar(bar, model.bandRank.get(`${bar.event.id}@band`) ?? 1, model.bandSize),
                  )}
                </div>

                {model.band.hiddenByDay.map((count, dayIndex) => {
                  if (count === 0) return null;
                  const chipKey = `band-more#${dayIndex}`;
                  const day = days[dayIndex]!;

                  return (
                    <OverflowChip
                      key={chipKey}
                      count={count}
                      day={day}
                      chipKey={chipKey}
                      active={activeKey === chipKey}
                      open={openDay === chipKey}
                      onOpenChange={(next) => setOpenDay(next ? chipKey : null)}
                      onMove={onMove}
                      onFocused={setFocusedKey}
                      style={{
                        top: model.band.lanes * 22 + 4,
                        insetInlineStart: `${(dayIndex / days.length) * 100}%`,
                        width: `${(1 / days.length) * 100}%`,
                      }}
                    >
                      {agendaList(splitEvents(shown, [day]), "panel")}
                    </OverflowChip>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex">
          <div aria-hidden="true" className={cn("w-11 shrink-0", classNames?.gutter)}>
            {hours.map((hour) => (
              <div
                key={hour}
                style={{ height: hourHeight }}
                className="relative border-t border-border pe-1 text-end"
              >
                <span className="absolute end-1 -top-1.5 bg-surface px-0.5 text-xs text-fg-subtle">
                  {`${String(hour).padStart(2, "0")}h`}
                </span>
              </div>
            ))}
          </div>

          {model.columns.map((column) => (
            <div
              key={column.day.toISOString()}
              role="group"
              data-rc-day={column.dayIndex}
              aria-current={isSameDay(column.day, today) ? "date" : undefined}
              aria-label={`${dayTitle(column.day)}${isSameDay(column.day, today) ? ", hoje" : ""}, ${countLabel(column.count)}`}
              onClick={(pointer) => {
                const box = pointer.currentTarget.getBoundingClientRect();
                pickSlot(
                  column.day,
                  dayStart * 60 + ((pointer.clientY - box.top) / hourHeight) * 60,
                );
              }}
              style={{ height: columnHeight }}
              className={cn(
                "relative min-w-0 flex-1 border-s border-border",
                onSlotSelect && "cursor-pointer",
                classNames?.column,
              )}
            >
              <div aria-hidden="true" className="absolute inset-0">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    style={{ height: hourHeight }}
                    className="border-t border-border"
                  />
                ))}
              </div>

              {isSameDay(column.day, today) && nowVisible && (
                <div
                  aria-hidden="true"
                  data-rc-now=""
                  style={{ top: ((nowMinutes - dayStart * 60) / 60) * hourHeight }}
                  className="absolute inset-x-0 z-[var(--rc-z-sticky)] h-0.5 bg-danger"
                />
              )}

              <div role="list" className="absolute inset-0">
                {column.placed.map((segment) => {
                  const box = segmentBox(segment, { dayStart, dayEnd, hourHeight });

                  return (
                    <EventItem
                      key={segment.key}
                      segment={segment}
                      shape="block"
                      view={view}
                      allDay={false}
                      position={column.rank.get(segment.key) ?? 1}
                      total={column.size}
                      active={activeKey === segment.key}
                      onSelect={onEventSelect}
                      onMove={onMove}
                      onFocused={setFocusedKey}
                      renderEvent={renderEvent}
                      className={cn("p-px", classNames?.event)}
                      style={{
                        top: box.height === 0 && box.outsideAfter ? undefined : box.top,
                        bottom: box.height === 0 && box.outsideAfter ? 0 : undefined,
                        height: box.height,
                        insetInlineStart: `${(segment.column / segment.columns) * 100}%`,
                        width: `${(segment.span / segment.columns) * 100}%`,
                      }}
                      showTime={box.height >= hourHeight / 2}
                    />
                  );
                })}

                {column.overflow.map((spill) => {
                  const box = segmentBox(
                    {
                      key: "",
                      event: { id: "", title: "", start: spill.start, end: spill.end },
                      dayIndex: column.dayIndex,
                      start: spill.start,
                      end: spill.end,
                      continuesBefore: false,
                      continuesAfter: false,
                    },
                    { dayStart, dayEnd, hourHeight },
                  );
                  const chipKey = `more#${column.dayIndex}#${spill.start.getTime()}`;

                  return (
                    <OverflowChip
                      key={chipKey}
                      count={spill.count}
                      day={column.day}
                      chipKey={chipKey}
                      active={activeKey === chipKey}
                      open={openDay === chipKey}
                      onOpenChange={(next) => setOpenDay(next ? chipKey : null)}
                      onMove={onMove}
                      onFocused={setFocusedKey}
                      style={{
                        top: box.top,
                        insetInlineStart: `${((maxColumns - 1) / maxColumns) * 100}%`,
                        width: `${(1 / maxColumns) * 100}%`,
                      }}
                    >
                      {agendaList(splitEvents(shown, [column.day]), "panel")}
                    </OverflowChip>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      {...props}
      ref={root}
      data-rc-view={view}
      className={cn("flex w-full flex-col gap-3 font-sans text-fg", className)}
    >
      <div
        data-rc-toolbar=""
        className={cn("flex flex-wrap items-center gap-2", classNames?.toolbar)}
      >
        <Button
          ref={toolbar}
          variant="secondary"
          size="iconSm"
          aria-label="Período anterior"
          onClick={() => shift(-1)}
        >
          {rtl ? (
            <ChevronRight size={16} aria-hidden="true" />
          ) : (
            <ChevronLeft size={16} aria-hidden="true" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="iconSm"
          aria-label="Próximo período"
          onClick={() => shift(1)}
        >
          {rtl ? (
            <ChevronLeft size={16} aria-hidden="true" />
          ) : (
            <ChevronRight size={16} aria-hidden="true" />
          )}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => changeDate(new Date())}>
          Hoje
        </Button>

        <CalendarPanel
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          title="Ir para a data"
          trigger={
            <button
              type="button"
              className={cn(
                "inline-flex h-[var(--rc-control-sm)] items-center gap-2 rounded-md px-2",
                "text-base font-medium text-fg",
                "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                "hover:bg-accent-subtle",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <CalendarDays size={16} aria-hidden="true" className="text-fg-muted" />
              {periodTitle(view, date, days)}
            </button>
          }
        >
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(picked) => {
              if (picked) changeDate(picked);
              setPickerOpen(false);
            }}
            autoFocus
          />
        </CalendarPanel>

        <div className="flex-1" />

        {offered.length > 1 && (
          <ToggleGroup
            value={[view]}
            onValueChange={(next) => {
              const picked = next[0] as EventCalendarView | undefined;
              if (picked) changeView(picked);
            }}
            aria-label="Vista do calendário"
          >
            {offered.map((option) => (
              <Toggle key={option} value={option}>
                {VIEW_LABEL[option]}
              </Toggle>
            ))}
          </ToggleGroup>
        )}
      </div>

      <LoadingAnnouncement loading={loading} />
      <div role="status" aria-live="polite" className="sr-only">
        {loading ? "" : announcement}
      </div>

      {isError ? (
        <Alert tone="danger">
          <AlertTitle>{errorTitle}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
          {onRetry && (
            <Button variant="secondary" size="sm" className="mt-3 w-fit" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
        </Alert>
      ) : (
        <div
          role="group"
          aria-label={label}
          tabIndex={entries.length === 0 ? 0 : undefined}
          className={cn(
            "relative overflow-hidden rounded-md border border-border-strong bg-surface",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            classNames?.body,
          )}
        >
          {body()}

          {loading && model.kind !== "agenda" && (
            <div
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 top-14",
                "flex flex-col gap-3 p-3",
              )}
            >
              <Skeleton className="h-14 w-1/3" />
              <Skeleton className="h-20 w-1/2 self-end" />
              <Skeleton className="h-10 w-2/5" />
            </div>
          )}

          {!loading && model.kind !== "agenda" && shown.length === 0 && empty && (
            <div className="pointer-events-none absolute inset-0 z-[var(--rc-z-sticky)] flex items-center justify-center p-4">
              <EmptyState
                icon={empty.icon}
                title={empty.title}
                description={empty.description}
                action={empty.action}
                className="pointer-events-auto max-w-sm rounded-lg border border-border bg-surface px-6 py-8 shadow-2"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
