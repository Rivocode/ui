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
} from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip";
import { cn } from "../lib/cn";
import { resolveFormat, type Format } from "../shared/format";
import type { Slots } from "../lib/slots";
import { axisOrder, cellNumber, heatStep } from "../shared/chart-layout";

export type ChartHeatmapProps<Cell> = Omit<ComponentProps<"div">, "children" | "color"> & {
  /**
   * Uma linha por celula preenchida, no formato longo que a consulta devolve:
   * `{ dia: "Seg", hora: "14h", total: 12 }`. Combinacao que nao aparece aqui
   * vira celula vazia, e nao zero.
   */
  data: Cell[];
  /** De onde sai a linha da grade (o eixo vertical). */
  rowKey: keyof Cell & string;
  /** De onde sai a coluna da grade (o eixo horizontal). */
  columnKey: keyof Cell & string;
  /**
   * De onde sai o numero. `null`, `undefined` ou numero invalido e celula
   * vazia, desenhada com borda tracejada e sem tinta; `0` e valor, e pinta o
   * primeiro degrau da escala.
   */
  valueKey: keyof Cell & string;
  /**
   * A ordem das linhas, e as que existem mesmo sem dado nenhum. Sem ela, a
   * ordem em que aparecem em `data`: domingo sem emissao some da grade.
   */
  rows?: readonly string[];
  /** A ordem das colunas, pela mesma regra de `rows`. */
  columns?: readonly string[];
  /**
   * A cor do degrau mais forte. Os quatro de baixo sao ela mesma em tinta mais
   * rala sobre o fundo. Sem ela, `var(--rc-chart-1)`; aceita qualquer
   * `var(--rc-chart-N)`, que sao as oito medidas contra o fundo nos dois temas.
   */
  color?: string;
  /**
   * O intervalo da escala, `[menor, maior]`. Sem ele, de zero (ou do menor
   * valor, se houver negativo) ate o maior valor presente. Fixe quando duas
   * grades lado a lado precisam da mesma regua.
   */
  domain?: readonly [number, number];
  /** Como o numero e escrito, na dica, na legenda e na tabela do leitor de tela. */
  format?: Format;
  /**
   * O que a grade mede, por extenso: vira o nome do grupo e a legenda da
   * tabela que o leitor de tela le no lugar do desenho.
   */
  label: string;
  /** O que a dica e a tabela dizem na celula sem dado. Sem ele, "Sem dado". */
  emptyLabel?: string;
  /** A regua de cor embaixo da grade, do menor ao maior. Ligada por padrao. */
  legend?: boolean;
  /** Classe por parte: `grid`, `cell`, `legend`. */
  classNames?: Slots<"grid" | "cell" | "legend">;
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
  emptyLabel = "Sem dado",
  legend = true,
  classNames,
  className,
  ...props
}: ChartHeatmapProps<Cell>) {
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
