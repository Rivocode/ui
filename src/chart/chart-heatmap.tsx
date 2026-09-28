"use client";

import { useDirection } from "@base-ui/react/direction-provider";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

import { EmptyState } from "../components/empty-state";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";
import { axisOrder, cellNumber, heatStep } from "../shared/chart-layout";

export type ChartHeatmapProps<Cell> = Omit<ComponentProps<"div">, "children" | "color"> & {
  /**
   * One row per filled cell, in the long format the query returns:
   * `{ dia: "Seg", hora: "14h", total: 12 }`. A combination that does not appear here
   * becomes an empty cell, not zero.
   */
  data: Cell[];
  /** Where the grid row comes from (the vertical axis). */
  rowKey: keyof Cell & string;
  /** Where the grid column comes from (the horizontal axis). */
  columnKey: keyof Cell & string;
  /**
   * Where the number comes from. `null`, `undefined` or an invalid number is an empty
   * cell, drawn with a dashed border and no ink; `0` is a value, and paints the
   * first step of the scale.
   */
  valueKey: keyof Cell & string;
  /**
   * The order of the rows, and the ones that exist even with no data at all. Without it, the
   * order in which they appear in `data`: a Sunday with no issuance disappears from the grid.
   */
  rows?: readonly string[];
  /** The order of the columns, by the same rule as `rows`. */
  columns?: readonly string[];
  /**
   * The color of the strongest step. The four below are the same color in thinner
   * ink over the background. Without it, `var(--rc-chart-1)`; accepts any
   * `var(--rc-chart-N)`, which are the eight measured against the background in both themes.
   */
  color?: string;
  /**
   * The scale's range, `[min, max]`. Without it, from zero (or from the smallest
   * value, if there is a negative one) up to the largest value present. Pin it when two
   * grids side by side need the same ruler.
   */
  domain?: readonly [number, number];
  /** How the number is written, in the tooltip, the legend and the screen reader table. */
  format?: Format;
  /**
   * What the grid measures, spelled out: becomes the group's name and the caption of the
   * table the screen reader reads in place of the drawing.
   */
  label: string;
  /** The color ruler below the grid, from smallest to largest. On by default. */
  legend?: boolean;
  /**
   * The piece's texts, to change the language: `empty` is what the reading says for a
   * cell with no data, "Sem dado" without it.
   */
  labels?: Partial<ChartHeatmapLabels>;
  /** Class per part: `grid`, `cell`, `legend`. */
  classNames?: Slots<"grid" | "cell" | "legend">;
  /**
   * What appears in place of the drawing when there is nothing to paint: an empty list,
   * no cell with a number, or all of them at zero. The same shape as
   * `ChartContainer` and `DataTable`.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
};

type Reading = { row: number; column: number };

const LABEL_WIDTH = 40;

const STEP = [
  "bg-[color-mix(in_srgb,var(--rc-heat)_14%,transparent)]",
  "bg-[color-mix(in_srgb,var(--rc-heat)_32%,transparent)]",
  "bg-[color-mix(in_srgb,var(--rc-heat)_50%,transparent)]",
  "bg-[color-mix(in_srgb,var(--rc-heat)_72%,transparent)]",
  "bg-(--rc-heat)",
] as const;

export type ChartHeatmapLabels = {
  empty: string;
};

export function ChartHeatmap<Cell extends Record<string, unknown>>({
  data,
  rowKey,
  columnKey,
  valueKey,
  rows: writtenRows,
  columns: writtenColumns,
  color = "var(--rc-chart-1)",
  domain,
  format,
  label,
  legend = true,
  labels,
  classNames,
  className,
  empty,
  ...props
}: ChartHeatmapProps<Cell>) {
  const emptyLabel = labels?.empty ?? "Sem dado";
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (write ? write(value) : value.toLocaleString("pt-BR"));

  const seenRows: string[] = [];
  const seenColumns: string[] = [];
  const values = new Map<string, number | null>();

  for (const cell of data) {
    const row = String(cell[rowKey]);
    const column = String(cell[columnKey]);
    if (!seenRows.includes(row)) seenRows.push(row);
    if (!seenColumns.includes(column)) seenColumns.push(column);
    values.set(`${row}\u0000${column}`, cellNumber(cell[valueKey]));
  }

  const rows = axisOrder(writtenRows, seenRows);
  const columns = axisOrder(writtenColumns, seenColumns);
  const valueAt = (row: number, column: number) =>
    values.get(`${rows[row]}\u0000${columns[column]}`) ?? null;

  const present = [...values.values()].filter((value): value is number => value !== null);
  const low = domain?.[0] ?? Math.min(0, ...present);
  const high = domain?.[1] ?? (present.length > 0 ? Math.max(...present) : 0);
  const hasEmpty = rows.some((_, row) =>
    columns.some((__, column) => valueAt(row, column) === null),
  );

  const rtl = useDirection() === "rtl";
  const group = useRef<HTMLDivElement>(null);

  const [hovered, setHovered] = useState<Reading | null>(null);
  const [focused, setFocused] = useState<Reading | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [anchor, setAnchor] = useState<CSSProperties>({});
  const [cellsWidth, setCellsWidth] = useState(0);

  useLayoutEffect(() => {
    const element = group.current;
    if (!element) return;
    const corner = element.querySelector<HTMLElement>("[data-rc-heat-corner]");
    const measure = () =>
      setCellsWidth(Math.max(0, element.clientWidth - (corner?.offsetWidth ?? 0)));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (corner) observer.observe(corner);
    return () => observer.disconnect();
  }, []);

  const reading = hovered ?? focused;
  const open = reading !== null && !dismissed && rows.length > 0 && columns.length > 0;

  const describe = (at: Reading) => {
    const value = valueAt(at.row, at.column);
    return `${rows[at.row]}, ${columns[at.column]}: ${value === null ? emptyLabel : say(value)}`;
  };

  useLayoutEffect(() => {
    if (!reading || !group.current) return;
    const cell = group.current.querySelector<HTMLElement>(
      `[data-rc-cell="${reading.row}-${reading.column}"]`,
    );
    if (!cell) return;
    setAnchor({
      left: cell.offsetLeft,
      top: cell.offsetTop,
      width: cell.offsetWidth,
      height: cell.offsetHeight,
    });
  }, [reading?.row, reading?.column]);

  function read(event: PointerEvent<HTMLDivElement>) {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-rc-cell]");
    if (!cell) return;
    const [row, column] = (cell.dataset.rcCell ?? "").split("-").map(Number);
    if (row === undefined || column === undefined) return;
    setHovered({ row, column });
    setDismissed(false);
  }

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    if (rows.length === 0 || columns.length === 0) return;

    if (event.key === "Escape") {
      setDismissed(true);
      return;
    }

    const from = focused ?? { row: 0, column: 0 };
    const ahead = rtl ? "ArrowLeft" : "ArrowRight";
    const back = rtl ? "ArrowRight" : "ArrowLeft";
    const lastRow = rows.length - 1;
    const lastColumn = columns.length - 1;
    const clamp = (value: number, last: number) => Math.min(Math.max(value, 0), last);

    const next: Reading | null =
      event.key === ahead
        ? { row: from.row, column: clamp(from.column + 1, lastColumn) }
        : event.key === back
          ? { row: from.row, column: clamp(from.column - 1, lastColumn) }
          : event.key === "ArrowDown"
            ? { row: clamp(from.row + 1, lastRow), column: from.column }
            : event.key === "ArrowUp"
              ? { row: clamp(from.row - 1, lastRow), column: from.column }
              : event.key === "Home"
                ? { row: event.ctrlKey ? 0 : from.row, column: 0 }
                : event.key === "End"
                  ? { row: event.ctrlKey ? lastRow : from.row, column: lastColumn }
                  : null;

    if (!next) return;

    event.preventDefault();
    setHovered(null);
    setFocused(next);
    setDismissed(false);
  }

  if (empty && present.every((value) => value === 0)) {
    return (
      <div {...props} className={cn("w-full", className)}>
        <EmptyState
          title={empty.title}
          description={empty.description}
          icon={empty.icon}
          action={empty.action}
        />
      </div>
    );
  }

  const fitting = cellsWidth > 0 ? Math.max(1, Math.floor(cellsWidth / LABEL_WIDTH)) : 12;
  const every = Math.max(1, Math.ceil(columns.length / fitting));

  return (
    <div
      {...props}
      style={{ ...props.style, "--rc-heat": color } as CSSProperties}
      className={cn("flex w-full flex-col gap-3", className)}
    >
      <div
        ref={group}
        role="group"
        aria-label={label}
        tabIndex={0}
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHovered(null)}
        onPointerCancel={() => setHovered(null)}
        onKeyDown={walk}
        onFocus={() => setFocused((current) => current ?? { row: 0, column: 0 })}
        onBlur={() => {
          setFocused(null);
          setDismissed(false);
        }}
        style={{
          gridTemplateColumns: `fit-content(min(40%, 10rem)) repeat(${columns.length}, minmax(0, 1fr))`,
        }}
        className={cn(
          "relative grid w-full animate-appear items-center gap-0.5 rounded-sm",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "focus-visible:ring-offset-surface",
          classNames?.grid,
        )}
      >
        <span aria-hidden="true" data-rc-heat-corner="" />
        {columns.map((column, index) => (
          <span
            key={column}
            aria-hidden="true"
            className={cn(
              "relative mb-1 h-4 text-xs text-fg-subtle",
              index % every !== 0 && "invisible",
            )}
          >
            <span className="absolute start-1/2 -translate-x-1/2 whitespace-nowrap rtl:translate-x-1/2">
              {column}
            </span>
          </span>
        ))}

        {rows.map((row, rowIndex) => [
          <span
            key={`${row}-label`}
            aria-hidden="true"
            className="truncate pe-2 text-end text-xs text-fg-subtle"
          >
            {row}
          </span>,
          ...columns.map((column, columnIndex) => {
            const value = valueAt(rowIndex, columnIndex);
            const step = value === null ? null : heatStep(value, low, high, STEP.length);

            return (
              <div
                key={`${row}-${column}`}
                data-rc-cell={`${rowIndex}-${columnIndex}`}
                data-rc-step={step ?? "empty"}
                className={cn(
                  "h-6 min-w-0 rounded-sm",
                  step !== null && STEP[step],
                  "transition-colors duration-[var(--rc-duration-slow)] ease-rc",
                  step === null && "border border-dashed border-border-strong",
                  classNames?.cell,
                )}
              />
            );
          }),
        ])}

        <Tooltip
          open={open}
          onOpenChange={(next) => {
            if (!next) setDismissed(true);
          }}
        >
          <TooltipTrigger
            render={
              <div
                aria-hidden="true"
                data-rc-heat-cursor=""
                style={anchor}
                className={cn(
                  "pointer-events-none absolute rounded-sm outline-2 outline-offset-1 outline-fg",
                  "transition-opacity duration-[var(--rc-duration-fast)] ease-rc",
                  open ? "opacity-100 outline-solid" : "opacity-0",
                )}
              />
            }
          />
          <TooltipContent>{reading ? describe(reading) : null}</TooltipContent>
        </Tooltip>
      </div>

      {legend && (
        <div
          aria-hidden="true"
          data-rc-heat-legend=""
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle",
            classNames?.legend,
          )}
        >
          <span className="flex items-center gap-1.5">
            <span className="font-mono">{say(low)}</span>
            <span className="flex gap-0.5">
              {STEP.map((paint) => (
                <span key={paint} className={cn("h-3 w-5 rounded-sm", paint)} />
              ))}
            </span>
            <span className="font-mono">{say(high)}</span>
          </span>
          {hasEmpty && (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-sm border border-dashed border-border-strong" />
              {emptyLabel}
            </span>
          )}
        </div>
      )}

      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <td />
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {columns.map((column, columnIndex) => {
                  const value = valueAt(rowIndex, columnIndex);
                  return <td key={column}>{value === null ? emptyLabel : say(value)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {hovered === null && focused !== null ? describe(focused) : null}
      </div>
    </div>
  );
}
