"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import { defaultRangeExtractor, useVirtualizer, type Range } from "@tanstack/react-virtual";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "../lib/cn";
import { formatDate } from "../lib/date";
import { daysBetween, startOfDay } from "../lib/event-layout";
import {
  arrowPath,
  buildRows,
  dayOffset,
  dragTask,
  headerTiers,
  isMilestone,
  lastDay,
  moveTask,
  PX_PER_DAY,
  resizeTask,
  scaleRange,
  spokenDay,
  spokenRange,
  totalDays,
  type GanttRange,
  type GanttRow,
  type HeaderCell,
  type GanttScale,
} from "../lib/gantt-layout";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import { useMobile } from "../lib/screen";
import { useRivoContext } from "../provider/rivo-provider";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";
import { Toggle, ToggleGroup } from "./toggle";

export type { GanttRange, GanttScale } from "../lib/gantt-layout";

export type GanttTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export type GanttTask = {
  id: string;
  /** O nome da linha: a celula de titulo e o que o leitor de tela anuncia primeiro. */
  title: string;
  start: Date;
  /**
   * O instante em que a tarefa acaba, exclusivo: a tarefa de 12 a 18 de outubro
   * termina em 19/10 a 00:00. Igual ao `start`, a tarefa vira marco.
   */
  end: Date;
  /** Quanto ja foi feito, de 0 a 100. Pinta a parte cheia da barra e entra no rotulo. */
  progress?: number;
  /** Os `id` das tarefas que precisam acabar antes desta comecar. Cada um vira uma seta. */
  dependsOn?: string[];
  /** O nome do grupo. Tarefas com o mesmo grupo ficam sob uma linha que recolhe. */
  group?: string;
  /** Quem faz. Aparece na coluna `assignee`, que so entra sozinha quando alguma tarefa tem. */
  assignee?: string;
  /** O vocabulario fechado da casa, o mesmo do EventCalendar e do Badge. */
  tone?: GanttTone;
};

export type GanttColumn<Task extends GanttTask = GanttTask> =
  | "title"
  | "start"
  | "end"
  | "assignee"
  | {
      id: string;
      header?: string;
      cell?: (task: Task) => ReactNode;
      width?: number;
    };

export type GanttTaskChange = {
  start: Date;
  end: Date;
  /** `move` preserva a duracao; `resize` muda uma das pontas. */
  kind: "move" | "resize";
};

export type GanttProps<Task extends GanttTask = GanttTask> = Omit<
  ComponentProps<"div">,
  "children" | "onChange" | "defaultValue"
> & {
  /** As tarefas, na ordem das linhas. `undefined` e o mesmo que carregando. */
  tasks: Task[] | undefined;
  /** O nome da grade para o leitor de tela. Sem ele, "Cronograma". */
  label?: string;

  /** A escala mostrada, quando quem usa controla o estado. */
  scale?: GanttScale;
  /** A escala inicial. Dia vale 40px, semana 18px por dia, mes 5px por dia. */
  defaultScale?: GanttScale;
  onScaleChange?: (scale: GanttScale) => void;
  /** Quais escalas o seletor oferece. Com uma so, o seletor some. */
  scales?: GanttScale[];

  /**
   * As colunas da tabela, na ordem. Aceita as quatro da casa pelo nome e colunas
   * proprias com `cell`. O titulo sempre entra, e no celular e o unico que fica.
   */
  columns?: GanttColumn<Task>[];

  /**
   * Liga a edicao. Arrastar a barra, arrastar uma borda e as setas do teclado
   * chamam isto com as datas novas, e a peca nao muda nada sozinha: a barra so
   * anda quando o `tasks` voltar mudado.
   */
  onTaskChange?: (task: Task, change: GanttTaskChange) => void;
  /** Clique no titulo e `Enter` na linha. */
  onTaskSelect?: (task: Task) => void;

  /** Os grupos recolhidos, quando quem usa controla o estado. */
  collapsedGroups?: string[];
  defaultCollapsedGroups?: string[];
  onCollapsedGroupsChange?: (groups: string[]) => void;

  /** O dia que a linha de hoje marca. Sem ele, o relogio do aparelho. */
  today?: Date;
  /** O periodo desenhado. Sem ele, as tarefas com folga de uma unidade de cada lado. */
  range?: GanttRange;
  /** Altura maxima da moldura que rola. Numero vira pixel. */
  maxHeight?: number | string;
  /**
   * Altura de cada linha, em pixel. Sem ela, a do controle medio da densidade:
   * 40 no confortavel, 32 no compacto, e 44 no celular em qualquer densidade.
   */
  rowHeight?: number;
  /** Largura inicial da tabela da esquerda, em pixel. A divisoria muda depois. */
  defaultTableWidth?: number;

  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  /** O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar". */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /** O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo". */
  retryLabel?: ReactNode;
  /** O que aparece quando a consulta volta sem tarefa. */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

  /**
   * Classe por parte: `toolbar`, `frame`, `header`, `row`, `cell`, `timeline`,
   * `bar`, `milestone` e `handle`.
   */
  classNames?: Slots<
    "toolbar" | "frame" | "header" | "row" | "cell" | "timeline" | "bar" | "milestone" | "handle"
  >;
};

type ResolvedColumn<Task extends GanttTask> = {
  id: string;
  header: string;
  width: number;
  cell: (task: Task) => ReactNode;
};

type Drag = { id: string; edge: "move" | "start" | "end"; x: number; days: number };

type Watch = { id: string; start: number; end: number };

const ALL_SCALES: GanttScale[] = ["day", "week", "month"];

const SCALE_LABEL: Record<GanttScale, string> = { day: "Dia", week: "Semana", month: "Mês" };

const UNIT_LABEL: Record<GanttScale, string> = {
  day: "um dia",
  week: "uma semana",
  month: "um mês",
};

const BAR: Record<GanttTone, string> = {
  neutral: "bg-surface-raised",
  accent: "bg-accent-subtle",
  success: "bg-success-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-danger-subtle",
  info: "bg-info-subtle",
};

const FILL: Record<GanttTone, string> = {
  neutral: "bg-fg-muted",
  accent: "bg-accent-text",
  success: "bg-success-text",
  warning: "bg-warning-text",
  danger: "bg-danger-text",
  info: "bg-info-text",
};

const HEADER = 48;
const TITLE_MIN = 120;
const TITLE_DEFAULT = 200;
const PHONE_TABLE = 160;
const TIMELINE_MIN = 160;
const HANDLE_STEP = 16;
const ARROW_CLEARANCE = 8;

function TopTier({
  cells,
  ppd,
  tableWidth,
  rtl,
  viewport,
}: {
  cells: HeaderCell[];
  ppd: number;
  tableWidth: number;
  rtl: boolean;
  viewport: RefObject<HTMLDivElement | null>;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const read = () => setOffset(Math.round(Math.abs(element.scrollLeft)));
    read();
    element.addEventListener("scroll", read, { passive: true });
    return () => element.removeEventListener("scroll", read);
  }, [viewport, rtl]);

  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2">
      {cells.map((cell) => {
        const from = cell.from * ppd;
        const to = from + cell.days * ppd;
        const room = to - Math.max(from, offset) - 16;
        return (
          <span
            key={cell.key}
            style={{ insetInlineStart: from, width: cell.days * ppd }}
            className="absolute inset-y-0 flex items-center border-s border-border text-xs font-rc-medium text-fg-muted"
          >
            <span
              data-rc-month=""
              style={{ insetInlineStart: tableWidth + 8, maxWidth: Math.max(room, 0) }}
              className="sticky ms-2 block truncate"
            >
              {cell.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function clampProgress(value: number | undefined): number | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return Math.min(Math.max(Math.round(value), 0), 100);
}

function builtInColumns<Task extends GanttTask>(): Record<string, ResolvedColumn<Task>> {
  return {
    title: { id: "title", header: "Tarefa", width: TITLE_DEFAULT, cell: (task) => task.title },
    start: { id: "start", header: "Início", width: 100, cell: (task) => formatDate(task.start) },
    end: { id: "end", header: "Fim", width: 100, cell: (task) => formatDate(lastDay(task)) },
    assignee: {
      id: "assignee",
      header: "Responsável",
      width: 132,
      cell: (task) => task.assignee ?? "—",
    },
  };
}

function resolveColumns<Task extends GanttTask>(
  wanted: GanttColumn<Task>[] | undefined,
  tasks: Task[],
): ResolvedColumn<Task>[] {
  const known = builtInColumns<Task>();
  const list: GanttColumn<Task>[] =
    wanted ??
    (tasks.some((task) => task.assignee)
      ? ["title", "start", "end", "assignee"]
      : ["title", "start", "end"]);

  const resolved = list.map((column) => {
    if (typeof column === "string") return known[column]!;
    const base = known[column.id];
    return {
      id: column.id,
      header: column.header ?? base?.header ?? column.id,
      width: column.width ?? base?.width ?? 120,
      cell: column.cell ?? base?.cell ?? (() => null),
    };
  });

  const title = resolved.find((column) => column.id === "title");
  if (!title) return [known.title!, ...resolved];
  return [title, ...resolved.filter((column) => column !== title)];
}

function taskSpeech<Task extends GanttTask>(task: Task, byId: Map<string, Task>): string {
  const parts = [isMilestone(task) ? `marco em ${spokenRange(task)}` : spokenRange(task)];
  const progress = clampProgress(task.progress);
  if (progress !== undefined && !isMilestone(task)) parts.push(`${progress}% concluído`);

  for (const id of task.dependsOn ?? []) {
    const before = byId.get(id);
    if (!before) continue;
    parts.push(
      task.start.getTime() < before.end.getTime()
        ? `depende de ${before.title}, e começa antes de ela terminar`
        : `depende de ${before.title}`,
    );
  }
  return parts.join(", ");
}

export function Gantt<Task extends GanttTask = GanttTask>({
  tasks,
  label = "Cronograma",
  scale: scaleProp,
  defaultScale = "week",
  onScaleChange,
  scales = ALL_SCALES,
  columns: columnsProp,
  onTaskChange,
  onTaskSelect,
  collapsedGroups,
  defaultCollapsedGroups,
  onCollapsedGroupsChange,
  today: todayProp,
  range: rangeProp,
  maxHeight = 480,
  rowHeight: rowHeightProp,
  defaultTableWidth,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar o cronograma.",
  retryLabel = "Tentar de novo",
  empty,
  className,
  classNames,
  ...props
}: GanttProps<Task>) {
  const rtl = useDirection() === "rtl";
  const isMobile = useMobile();
  const { density } = useRivoContext();
  const hintId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);

  const [scaleState, setScaleState] = useState<GanttScale>(defaultScale);
  const [collapsedState, setCollapsedState] = useState<string[]>(defaultCollapsedGroups ?? []);
  const [tableWidthState, setTableWidthState] = useState<number | undefined>(defaultTableWidth);
  const [active, setActive] = useState<{ row: string; col: number } | null>(null);
  const [drag, setDragState] = useState<Drag | null>(null);
  const dragging = useRef<Drag | null>(null);
  const setDrag = (next: Drag | null) => {
    dragging.current = next;
    setDragState(next);
  };
  const [watch, setWatch] = useState<Watch | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const focusWanted = useRef(false);
  const stopTableDrag = useRef<(() => void) | null>(null);

  useEffect(() => () => stopTableDrag.current?.(), []);

  const offered = scales.length > 0 ? scales : ALL_SCALES;
  const wantedScale = scaleProp ?? scaleState;
  const scale = offered.includes(wantedScale) ? wantedScale : offered[0]!;
  const ppd = PX_PER_DAY[scale];

  const editable = onTaskChange !== undefined;
  const loading = isLoading || tasks === undefined;
  const list = useMemo(() => (loading ? [] : (tasks ?? [])), [loading, tasks]);
  const rowHeight = rowHeightProp ?? (isMobile ? 44 : density === "compact" ? 32 : 40);

  useEffect(() => {
    if (todayProp) return;
    const timer = setInterval(() => setNow(new Date()), 300000);
    return () => clearInterval(timer);
  }, [todayProp]);

  const today = startOfDay(todayProp ?? now);

  const collapsed = useMemo(
    () => new Set(collapsedGroups ?? collapsedState),
    [collapsedGroups, collapsedState],
  );

  const byId = useMemo(() => new Map(list.map((task) => [task.id, task])), [list]);
  const leading = useMemo(() => new Set(list.flatMap((task) => task.dependsOn ?? [])), [list]);

  const allColumns = useMemo(() => resolveColumns(columnsProp, list), [columnsProp, list]);
  const columns = isMobile ? allColumns.slice(0, 1) : allColumns;
  const others = columns.slice(1).reduce((sum, column) => sum + column.width, 0);
  const tableMin = others + TITLE_MIN;
  const requested = isMobile
    ? PHONE_TABLE
    : (tableWidthState ?? others + (columns[0]?.width ?? TITLE_DEFAULT));
  const tableWidth = isMobile ? PHONE_TABLE : Math.max(requested, tableMin);
  const titleWidth = tableWidth - others;
  const C = columns.length;

  const rangeStart = rangeProp?.start.getTime();
  const rangeEnd = rangeProp?.end.getTime();
  const range = useMemo<GanttRange>(() => {
    if (rangeStart !== undefined && rangeEnd !== undefined) {
      return { start: startOfDay(new Date(rangeStart)), end: startOfDay(new Date(rangeEnd)) };
    }
    return scaleRange(list, scale, today);
  }, [rangeStart, rangeEnd, list, scale, today.getTime()]);

  const origin = range.start;
  const days = totalDays(range);
  const timelineWidth = days * ppd;
  const totalWidth = tableWidth + timelineWidth;
  const [topTier, bottomTier] = useMemo(() => headerTiers(range, scale), [range, scale]);

  const rows = useMemo(() => buildRows(list, collapsed), [list, collapsed]);
  const rowIndex = useMemo(() => new Map(rows.map((row, index) => [row.key, index])), [rows]);
  const hasGroups = rows.some((row) => row.kind === "group");

  const activeKey = (() => {
    if (rows.length === 0) return null;
    if (active && rowIndex.has(active.row)) return active.row;
    if (active?.row.startsWith("t:")) {
      const task = byId.get(active.row.slice(2));
      if (task?.group && rowIndex.has(`g:${task.group}`)) return `g:${task.group}`;
    }
    return rows[0]!.key;
  })();
  const activeIndex = activeKey === null ? -1 : (rowIndex.get(activeKey) ?? -1);
  const activeRow = activeIndex >= 0 ? rows[activeIndex] : undefined;
  const normalizeCol = (row: GanttRow<Task> | undefined, col: number) => {
    const clamped = Math.min(Math.max(col, 0), C);
    if (row?.kind === "group" && clamped > 0 && clamped < C) return 0;
    return clamped;
  };
  const activeCol = normalizeCol(activeRow, active?.col ?? 0);

  const rangeExtractor = useCallback(
    (visible: Range) => {
      const indexes = defaultRangeExtractor(visible);
      if (activeIndex >= 0 && !indexes.includes(activeIndex)) {
        indexes.push(activeIndex);
        indexes.sort((one, other) => one - other);
      }
      return indexes;
    },
    [activeIndex],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewport.current,
    estimateSize: () => rowHeight,
    overscan: 8,
    scrollMargin: HEADER,
    scrollPaddingStart: HEADER,
    rangeExtractor,
    getItemKey: (index) => rows[index]?.key ?? index,
  });

  const xOf = useCallback((date: Date) => dayOffset(origin, date) * ppd, [origin, ppd]);

  const shownDates = useCallback(
    (task: Task) => {
      if (drag && drag.id === task.id && drag.days !== 0) return dragTask(task, drag.edge, drag.days);
      return { start: task.start, end: task.end };
    },
    [drag],
  );

  const setScrollOffset = (element: HTMLElement, value: number) => {
    element.scrollLeft = rtl ? -value : value;
  };

  const reveal = useCallback(
    (from: number, to: number) => {
      const element = viewport.current;
      if (!element) return;
      const offset = rtl ? -element.scrollLeft : element.scrollLeft;
      const visibleWidth = element.clientWidth - tableWidth;
      const margin = 24;
      if (from < offset + margin) {
        element.scrollLeft = (rtl ? -1 : 1) * Math.max(from - margin, 0);
      } else if (to > offset + visibleWidth - margin && visibleWidth > 0) {
        const next = Math.min(to - visibleWidth + margin, from - margin);
        element.scrollLeft = (rtl ? -1 : 1) * Math.max(next, 0);
      }
    },
    [rtl, tableWidth],
  );

  const todayX = (daysBetween(origin, today) + 0.5) * ppd;
  const todayVisible = todayX >= 0 && todayX <= timelineWidth;

  const firstStart = list.length > 0 ? xOf(list[0]!.start) : 0;
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element || loading) return;
    const target = todayVisible ? todayX : firstStart;
    const visibleWidth = element.clientWidth - tableWidth;
    setScrollOffset(element, Math.max(target - Math.max(visibleWidth, 0) / 3, 0));
  }, [scale, loading]);

  useEffect(() => {
    if (!focusWanted.current) return;
    focusWanted.current = false;
    if (activeKey === null) return;
    const cell = viewport.current?.querySelector<HTMLElement>(
      `[data-rc-cell="${CSS.escape(`${activeKey}|${activeCol}`)}"]`,
    );
    if (!cell) return;
    if (cell !== document.activeElement) cell.focus({ preventScroll: true });
    if (activeCol === C && activeRow) {
      if (activeRow.kind === "task") {
        const dates = shownDates(activeRow.task);
        reveal(xOf(dates.start), Math.max(xOf(dates.end), xOf(dates.start) + 14));
      } else {
        reveal(xOf(activeRow.start), xOf(activeRow.end));
      }
    }
  });

  function changeScale(next: GanttScale) {
    if (scaleProp === undefined) setScaleState(next);
    onScaleChange?.(next);
  }

  function setGroup(name: string, open: boolean) {
    const current = [...collapsed];
    const next = open ? current.filter((group) => group !== name) : [...current, name];
    if (collapsedGroups === undefined) setCollapsedState(next);
    onCollapsedGroupsChange?.(next);
  }

  function go(index: number, col: number) {
    const target = rows[Math.min(Math.max(index, 0), rows.length - 1)];
    if (!target) return;
    focusWanted.current = true;
    setActive({ row: target.key, col: normalizeCol(target, col) });
    virtualizer.scrollToIndex(rowIndex.get(target.key) ?? 0, { align: "auto" });
  }

  function commit(task: Task, next: { start: Date; end: Date }, kind: GanttTaskChange["kind"]) {
    if (next.start.getTime() === task.start.getTime() && next.end.getTime() === task.end.getTime()) {
      return;
    }
    setWatch({ id: task.id, start: task.start.getTime(), end: task.end.getTime() });
    onTaskChange?.(task, { start: next.start, end: next.end, kind });
  }

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const address = (event.target as HTMLElement).dataset.rcCell;
    if (!address) return;
    const split = address.lastIndexOf("|");
    const here = rowIndex.get(address.slice(0, split)) ?? -1;
    const row = rows[here];
    if (!row) return;
    const col = normalizeCol(row, Number(address.slice(split + 1)));
    const forward = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const page = Math.max(
      1,
      Math.floor(((viewport.current?.clientHeight ?? 0) - HEADER) / rowHeight) - 1,
    );

    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };

    if (event.key === "Escape" && drag) {
      setDrag(null);
      handled();
      return;
    }

    if (event.key === "ArrowDown") return (handled(), go(here + 1, col));
    if (event.key === "ArrowUp") return (handled(), go(here - 1, col));
    if (event.key === "PageDown") return (handled(), go(here + page, col));
    if (event.key === "PageUp") return (handled(), go(here - page, col));
    if (event.key === "Home") {
      handled();
      return event.ctrlKey || event.metaKey ? go(0, col) : go(here, 0);
    }
    if (event.key === "End") {
      handled();
      return event.ctrlKey || event.metaKey ? go(rows.length - 1, col) : go(here, C);
    }

    if (event.key === "Enter" || event.key === " ") {
      handled();
      if (row.kind === "group") setGroup(row.name, !row.expanded);
      else onTaskSelect?.(row.task);
      return;
    }

    if (event.key !== forward && event.key !== back) return;
    const ahead = event.key === forward;
    handled();

    if (row.kind === "task" && col === C && editable) {
      const amount = ahead ? 1 : -1;
      if (event.shiftKey) {
        if (!isMilestone(row.task)) commit(row.task, resizeTask(row.task, scale, amount), "resize");
      } else {
        commit(row.task, moveTask(row.task, scale, amount), "move");
      }
      focusWanted.current = true;
      setActive({ row: row.key, col: C });
      return;
    }

    if (row.kind === "group" && col === 0) {
      if (ahead) {
        if (!row.expanded) setGroup(row.name, true);
        else go(here, C);
      } else if (row.expanded) {
        setGroup(row.name, false);
      }
      return;
    }

    if (row.kind === "task" && col === 0 && !ahead && row.level === 2 && row.task.group) {
      const parent = rowIndex.get(`g:${row.task.group}`);
      if (parent !== undefined) go(parent, 0);
      return;
    }

    if (row.kind === "group" && col === C && !ahead) return go(here, 0);
    go(here, col + (ahead ? 1 : -1));
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, task: Task, edge: Drag["edge"]) {
    if (!editable || event.button !== 0 || event.pointerType === "touch") return;
    if (edge !== "move" && isMilestone(task)) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    focusWanted.current = true;
    setActive({ row: `t:${task.id}`, col: C });
    setDrag({ id: task.id, edge, x: event.clientX, days: 0 });
  }

  function daysFrom(event: ReactPointerEvent<HTMLElement>, current: Drag) {
    return Math.round(((event.clientX - current.x) / ppd) * (rtl ? -1 : 1));
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const current = dragging.current;
    if (!current) return;
    const days = daysFrom(event, current);
    if (days !== current.days) setDrag({ ...current, days });
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    const current = dragging.current;
    if (!current) return;
    const days = daysFrom(event, current);
    const task = byId.get(current.id);
    setDrag(null);
    if (task && days !== 0) {
      commit(task, dragTask(task, current.edge, days), current.edge === "move" ? "move" : "resize");
    }
  }

  function resizeTable(next: number) {
    const width = frame.current?.offsetWidth ?? next + TIMELINE_MIN;
    setTableWidthState(Math.round(Math.min(Math.max(next, tableMin), Math.max(width - TIMELINE_MIN, tableMin))));
  }

  function startTableDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const box = frame.current?.getBoundingClientRect();
    if (!box) return;
    event.preventDefault();
    const handle = event.currentTarget;
    handle.setPointerCapture?.(event.pointerId);

    stopTableDrag.current?.();

    const onMove = (pointer: PointerEvent) => {
      resizeTable(rtl ? box.right - pointer.clientX : pointer.clientX - box.left);
    };
    const endings = ["pointerup", "pointercancel", "lostpointercapture"] as const;
    const stop = () => {
      handle.removeEventListener("pointermove", onMove);
      for (const name of endings) handle.removeEventListener(name, stop);
      if (stopTableDrag.current === stop) stopTableDrag.current = null;
    };
    handle.addEventListener("pointermove", onMove);
    for (const name of endings) handle.addEventListener(name, stop);
    stopTableDrag.current = stop;
  }

  const watched = watch ? byId.get(watch.id) : undefined;
  const spoken =
    watch &&
    watched &&
    (watched.start.getTime() !== watch.start || watched.end.getTime() !== watch.end)
      ? `${watched.title}: ${spokenRange(watched)}`
      : "";

  const arrows = useMemo(() => {
    const drawn: { key: string; d: string; head: string; late: boolean }[] = [];
    const center = (index: number) => index * rowHeight + rowHeight / 2;

    for (const [index, row] of rows.entries()) {
      if (row.kind !== "task") continue;
      const task = row.task;
      const to = shownDates(task);
      const milestoneTo = isMilestone(to);

      for (const id of task.dependsOn ?? []) {
        const before = byId.get(id);
        const beforeIndex = rowIndex.get(`t:${id}`);
        if (!before || beforeIndex === undefined) continue;

        const from = shownDates(before);
        const fromX = isMilestone(from) ? xOf(from.start) + 7 : xOf(from.end);
        const toX = milestoneTo ? xOf(to.start) - 7 : xOf(to.start);
        const point = { x: toX, y: center(index) };

        drawn.push({
          key: `${id}>${task.id}`,
          d: arrowPath({ x: fromX, y: center(beforeIndex) }, point, rowHeight),
          head: `M ${point.x} ${point.y} L ${point.x - 5} ${point.y - 4} L ${point.x - 5} ${point.y + 4} Z`,
          late: to.start.getTime() < from.end.getTime(),
        });
      }
    }
    return drawn;
  }, [rows, rowIndex, byId, shownDates, xOf, rowHeight]);

  const cellClass = cn(
    "flex h-full min-w-0 shrink-0 items-center px-3 text-sm",
    "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    classNames?.cell,
  );

  const cellProps = (row: GanttRow<Task>, col: number) => ({
    "data-rc-cell": `${row.key}|${col}`,
    tabIndex: row.key === activeKey && col === activeCol ? 0 : -1,
    "aria-colindex": col + 1,
    onFocus: () => {
      if (row.key !== activeKey || col !== activeCol) setActive({ row: row.key, col });
    },
  });

  function renderTaskTimeline(task: Task) {
    const dates = shownDates(task);
    const tone = task.tone ?? "neutral";
    const x0 = xOf(dates.start);
    const x1 = xOf(dates.end);
    const milestone = isMilestone(dates);
    const progress = clampProgress(task.progress);
    const held = drag?.id === task.id;
    const barHeight = Math.round(rowHeight * 0.55);
    const top = Math.round((rowHeight - barHeight) / 2);
    const caption = progress !== undefined && !milestone ? `${task.title} · ${progress}%` : task.title;
    const clearance = leading.has(task.id) ? ARROW_CLEARANCE : 0;
    const label = (
      <span data-rc-caption="" className="rounded-sm bg-surface px-1">
        {caption}
      </span>
    );

    if (milestone) {
      const size = 14;
      return (
        <>
          <div
            aria-hidden="true"
            data-rc-milestone=""
            onPointerDown={(event) => startDrag(event, task, "move")}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={() => setDrag(null)}
            style={{
              insetInlineStart: x0 - size / 2,
              top: (rowHeight - size) / 2,
              width: size,
              height: size,
            }}
            className={cn(
              "absolute rotate-45 rounded-sm",
              "group-focus-visible/cell:outline-2 group-focus-visible/cell:outline-offset-2 group-focus-visible/cell:outline-ring",
              FILL[tone],
              editable && (held ? "cursor-grabbing" : "cursor-grab"),
              classNames?.milestone,
            )}
          />
          <span
            aria-hidden="true"
            style={{ insetInlineStart: x0 + size + clearance, height: rowHeight }}
            className="pointer-events-none absolute top-0 flex items-center whitespace-nowrap text-xs text-fg-muted"
          >
            {label}
          </span>
        </>
      );
    }

    return (
      <>
        <div
          aria-hidden="true"
          data-rc-bar=""
          data-rc-tone={tone}
          onPointerDown={(event) => startDrag(event, task, "move")}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={() => setDrag(null)}
          style={{
            insetInlineStart: x0,
            width: Math.max(x1 - x0, 4),
            top,
            height: barHeight,
          }}
          className={cn(
            "absolute overflow-hidden rounded-sm border border-border-strong",
            "group-focus-visible/cell:outline-2 group-focus-visible/cell:outline-offset-2 group-focus-visible/cell:outline-ring",
            BAR[tone],
            editable && (held ? "cursor-grabbing" : "cursor-grab"),
            held && "shadow-2",
            classNames?.bar,
          )}
        >
          {progress !== undefined && progress > 0 && (
            <span
              data-rc-progress=""
              style={{ width: `${progress}%` }}
              className={cn("absolute inset-y-0 start-0", FILL[tone])}
            />
          )}
          {editable && (
            <>
              <span
                data-rc-edge="start"
                onPointerDown={(event) => startDrag(event, task, "start")}
                className="absolute inset-y-0 start-0 w-2 cursor-ew-resize"
              />
              <span
                data-rc-edge="end"
                onPointerDown={(event) => startDrag(event, task, "end")}
                className="absolute inset-y-0 end-0 w-2 cursor-ew-resize"
              />
            </>
          )}
        </div>
        <span
          aria-hidden="true"
          style={{ insetInlineStart: Math.max(x1, x0 + 4) + 8 + clearance, height: rowHeight }}
          className="pointer-events-none absolute top-0 flex items-center whitespace-nowrap text-xs text-fg-muted"
        >
          {label}
        </span>
      </>
    );
  }

  function renderRow(row: GanttRow<Task>, index: number, start: number) {
    const tree = hasGroups
      ? {
          "aria-level": row.kind === "group" ? 1 : row.level,
          "aria-posinset": row.position,
          "aria-setsize": row.size,
          "aria-expanded": row.kind === "group" ? row.expanded : undefined,
        }
      : {};

    return (
      <div
        key={row.key}
        role="row"
        aria-rowindex={index + 2}
        data-rc-row={row.kind}
        {...tree}
        style={{
          position: "absolute",
          top: 0,
          insetInlineStart: 0,
          width: totalWidth,
          height: rowHeight,
          transform: `translateY(${start - HEADER}px)`,
        }}
        className={cn("flex", classNames?.row)}
      >
        <div
          style={{ width: tableWidth }}
          className="sticky start-0 z-[var(--rc-z-sticky)] flex h-full shrink-0 border-e border-b border-e-border-strong border-b-border bg-surface"
        >
          {row.kind === "group" ? (
            <div
              role="rowheader"
              aria-colspan={C > 1 ? C : undefined}
              {...cellProps(row, 0)}
              onClick={() => setGroup(row.name, !row.expanded)}
              title={row.name}
              style={{ width: tableWidth }}
              className={cn(cellClass, "cursor-pointer gap-1.5 font-rc-medium text-fg")}
            >
              {row.expanded ? (
                <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-fg-muted" />
              ) : (
                <ChevronRight
                  size={16}
                  aria-hidden="true"
                  className={cn("shrink-0 text-fg-muted", rtl && "rotate-180")}
                />
              )}
              <span className={isMobile ? "line-clamp-2 break-words" : "truncate"}>{row.name}</span>
              <span className="shrink-0 text-xs font-rc-regular text-fg-subtle max-sm:hidden">
                {row.tasks.length === 1 ? "1 tarefa" : `${row.tasks.length} tarefas`}
              </span>
            </div>
          ) : (
            columns.map((column, col) => (
              <div
                key={column.id}
                role={col === 0 ? "rowheader" : "gridcell"}
                {...cellProps(row, col)}
                onClick={col === 0 && onTaskSelect ? () => onTaskSelect(row.task) : undefined}
                title={col === 0 ? row.task.title : undefined}
                style={{ width: col === 0 ? titleWidth : column.width }}
                className={cn(
                  cellClass,
                  col === 0
                    ? cn("text-fg", row.level === 2 && "ps-8 max-sm:ps-6", onTaskSelect && "cursor-pointer hover:underline")
                    : "text-fg-muted tabular-nums",
                )}
              >
                <span className={col === 0 && isMobile ? "line-clamp-2 break-words" : "truncate"}>
                  {column.cell(row.task)}
                </span>
              </div>
            ))
          )}
        </div>

        <div
          role="gridcell"
          {...cellProps(row, C)}
          aria-describedby={row.kind === "task" && editable ? hintId : undefined}
          style={{ width: timelineWidth }}
          className={cn(
            "group/cell relative h-full shrink-0 overflow-hidden border-b border-border",
            "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            classNames?.timeline,
          )}
        >
          <span className="sr-only">
            {row.kind === "group"
              ? `${row.tasks.length === 1 ? "1 tarefa" : `${row.tasks.length} tarefas`}, ${spokenRange(row)}`
              : taskSpeech(row.task, byId)}
          </span>
          {row.kind === "group" ? (
            <span
              aria-hidden="true"
              style={{
                insetInlineStart: xOf(row.start),
                width: Math.max(xOf(row.end) - xOf(row.start), 4),
                top: rowHeight / 2 - 3,
              }}
              className="absolute h-1.5 rounded-pill bg-fg-muted"
            />
          ) : (
            renderTaskTimeline(row.task)
          )}
        </div>
      </div>
    );
  }

  const header = (
    <div
      role="rowgroup"
      style={{ width: totalWidth, height: HEADER }}
      className={cn(
        "sticky top-0 z-[calc(var(--rc-z-sticky)+1)] border-b border-border-strong bg-surface",
        classNames?.header,
      )}
    >
      <div role="row" aria-rowindex={1} className="flex h-full">
        <div
          style={{ width: tableWidth }}
          className="sticky start-0 z-[var(--rc-z-sticky)] flex h-full shrink-0 border-e border-border-strong bg-surface"
        >
          {columns.map((column, col) => (
            <div
              key={column.id}
              role="columnheader"
              aria-colindex={col + 1}
              style={{ width: col === 0 ? titleWidth : column.width }}
              className="flex h-full shrink-0 items-end px-3 pb-2 text-xs font-rc-medium text-fg-muted"
            >
              <span className="truncate">{column.header}</span>
            </div>
          ))}
        </div>
        <div
          role="columnheader"
          aria-colindex={C + 1}
          style={{ width: timelineWidth }}
          className="relative h-full shrink-0"
        >
          <span className="sr-only">
            {`${label}, de ${spokenDay(origin, true)} a ${spokenDay(lastDay(range), true)}`}
          </span>
          {todayVisible && (
            <span
              aria-hidden="true"
              data-rc-today=""
              style={{ insetInlineStart: todayX - 1 }}
              className="absolute bottom-0 h-1/2 w-0.5 bg-danger"
            />
          )}
          <TopTier cells={topTier} ppd={ppd} tableWidth={tableWidth} rtl={rtl} viewport={viewport} />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 border-t border-border">
            {bottomTier.map((cell) => (
              <span
                key={cell.key}
                style={{ insetInlineStart: cell.from * ppd, width: cell.days * ppd }}
                className={cn(
                  "absolute inset-y-0 flex items-center truncate border-s border-border text-xs",
                  scale === "day" ? "justify-center" : "px-2",
                  cell.weekend ? "bg-bg text-fg-subtle" : "text-fg-muted",
                )}
              >
                <span
                  data-rc-label=""
                  className={cn("rounded-sm px-0.5", cell.weekend ? "bg-bg" : "bg-surface")}
                >
                  {cell.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const bodyHeight = rows.length * rowHeight;

  const backdrop = (
    <div
      aria-hidden="true"
      style={{ insetInlineStart: tableWidth, width: timelineWidth, height: bodyHeight }}
      className="pointer-events-none absolute top-0"
    >
      {bottomTier.map((cell) => (
        <span
          key={cell.key}
          style={{ insetInlineStart: cell.from * ppd, width: cell.days * ppd }}
          className={cn("absolute inset-y-0 border-s border-border", cell.weekend && "bg-bg")}
        />
      ))}
      <svg
        width={timelineWidth}
        height={bodyHeight}
        style={rtl ? { transform: "scaleX(-1)" } : undefined}
        className="absolute inset-0 overflow-visible"
      >
        {arrows.map((arrow) => (
          <g
            key={arrow.key}
            data-rc-arrow={arrow.late ? "late" : ""}
            className={arrow.late ? "text-danger-text" : "text-fg-subtle"}
          >
            <path
              d={arrow.d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeDasharray={arrow.late ? "4 3" : undefined}
            />
            <path d={arrow.head} fill="currentColor" />
          </g>
        ))}
      </svg>
      {todayVisible && (
        <span
          data-rc-today=""
          style={{ insetInlineStart: todayX - 1 }}
          className="absolute inset-y-0 w-0.5 bg-danger"
        />
      )}
    </div>
  );

  const skeleton = (
    <div aria-hidden="true" style={{ width: "100%" }}>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={`carregando-${index}`}
          style={{ height: rowHeight }}
          className="flex items-center gap-4 border-b border-border px-3"
        >
          <Skeleton className="h-4 w-32 shrink-0" />
          <Skeleton
            className="h-4"
            style={{ marginInlineStart: `${(index * 7) % 30}%`, width: `${20 + ((index * 11) % 25)}%` }}
          />
        </div>
      ))}
    </div>
  );

  const showEmpty = !loading && !isError && list.length === 0 && empty;
  const showToolbar = offered.length > 1 || (!loading && todayVisible);

  return (
    <div {...props} className={cn("flex w-full min-w-0 flex-col gap-3 font-sans text-fg", className)}>
      {showToolbar && !isError && (
        <div
          data-rc-toolbar=""
          className={cn("flex flex-wrap items-center gap-2", classNames?.toolbar)}
        >
          {!loading && todayVisible && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const element = viewport.current;
                if (!element) return;
                const visibleWidth = element.clientWidth - tableWidth;
                setScrollOffset(element, Math.max(todayX - Math.max(visibleWidth, 0) / 2, 0));
              }}
            >
              Hoje
            </Button>
          )}
          <div className="flex-1" />
          {offered.length > 1 && (
            <ToggleGroup
              value={[scale]}
              onValueChange={(next) => {
                const picked = next[0] as GanttScale | undefined;
                if (picked) changeScale(picked);
              }}
              aria-label="Escala do cronograma"
            >
              {offered.map((option) => (
                <Toggle key={option} value={option}>
                  {SCALE_LABEL[option]}
                </Toggle>
              ))}
            </ToggleGroup>
          )}
        </div>
      )}

      <LoadingAnnouncement loading={loading} />
      <div role="status" aria-live="polite" data-rc-change="" className="sr-only">
        {spoken}
      </div>
      <span id={hintId} className="sr-only">
        {`Setas movem ${UNIT_LABEL[scale]}, Shift com setas muda a duração, Home volta ao título.`}
      </span>

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
      ) : showEmpty ? (
        <EmptyState
          icon={empty.icon}
          title={empty.title}
          description={empty.description}
          action={empty.action}
        />
      ) : (
        <div ref={frame} className="relative w-full min-w-0">
          <div
            ref={viewport}
            role={loading ? "group" : hasGroups ? "treegrid" : "grid"}
            aria-label={label}
            aria-busy={loading || undefined}
            aria-rowcount={loading ? undefined : rows.length + 1}
            aria-colcount={loading ? undefined : C + 1}
            aria-readonly={loading || editable ? undefined : true}
            tabIndex={loading || rows.length === 0 ? 0 : undefined}
            onKeyDown={loading ? undefined : onGridKeyDown}
            style={{ maxHeight }}
            className={cn(
              "w-full overflow-auto rounded-md border border-border-strong bg-surface",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              classNames?.frame,
            )}
          >
            {loading ? (
              skeleton
            ) : (
              <>
                {header}
                <div
                  role="rowgroup"
                  style={{ width: totalWidth, height: bodyHeight }}
                  className="relative"
                >
                  {backdrop}
                  {virtualizer
                    .getVirtualItems()
                    .map((item) => {
                      const row = rows[item.index];
                      return row ? renderRow(row, item.index, item.start) : null;
                    })}
                </div>
              </>
            )}
          </div>

          {!loading && !isMobile && (
            <div
              role="separator"
              tabIndex={0}
              aria-label="Largura da tabela"
              aria-orientation="vertical"
              aria-valuenow={tableWidth}
              aria-valuemin={tableMin}
              aria-valuemax={Math.max((frame.current?.offsetWidth ?? tableWidth + TIMELINE_MIN) - TIMELINE_MIN, tableMin)}
              aria-valuetext={`${tableWidth} pixels`}
              onPointerDown={startTableDrag}
              onKeyDown={(event) => {
                const grow = rtl ? "ArrowLeft" : "ArrowRight";
                const shrink = rtl ? "ArrowRight" : "ArrowLeft";
                if (event.key === grow) resizeTable(tableWidth + HANDLE_STEP);
                else if (event.key === shrink) resizeTable(tableWidth - HANDLE_STEP);
                else if (event.key === "Home") resizeTable(tableMin);
                else if (event.key === "End") resizeTable(Number.MAX_SAFE_INTEGER);
                else return;
                event.preventDefault();
              }}
              style={{ insetInlineStart: tableWidth }}
              className={cn(
                "absolute inset-y-px z-[calc(var(--rc-z-sticky)+2)] w-0.5 cursor-col-resize",
                "transition-colors duration-[var(--rc-duration-fast)] ease-rc",
                "hover:bg-line-hover focus-visible:bg-accent-text",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "after:absolute after:inset-y-0 after:-inset-x-3",
                classNames?.handle,
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
