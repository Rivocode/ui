"use client";

import {
  columnFilteringFeature,
  constructFilterFn,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowSelectionState,
  type Updater,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowUp, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { EmptyState } from "./empty-state";
import { Pagination, type PaginationLabels } from "./pagination";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export type Column<Row> = {
  /** The column's key. Must be unique in the table. */
  key: string;
  header: ReactNode;
  /** What the cell shows. Without this, the raw value of the key. */
  cell?: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Hidden on the phone. Use it for what can be found out some other way. */
  hideOnMobile?: boolean;
  /** The header becomes a button that toggles ascending, descending, unsorted. */
  sortable?: boolean;
  /**
   * Raw value for sorting and filtering, when `cell` returns JSX or the key
   * is not a direct field of the row. Without it, `row[key]` applies.
   */
  value?: (row: Row) => string | number | Date | null | undefined;
  /**
   * What this column shows in the footer: the sibling of `cell`, one column up.
   * Where `cell` summarizes a row, this one summarizes the whole column.
   *
   * The rows that arrive are **the ones left after the filter, from all
   * pages** - the total of a search is the total of the search, and turning the page does not
   * change how much is owed. It takes just one column declaring `total` for the `<tfoot>` to
   * exist; the others are rendered blank, aligned with what is above.
   *
   * Money is shown abbreviated, like in the rest of the house:
   * `total: (rows) => currencyShort(rows.reduce((sum, row) => sum + row.amount, 0))`.
   */
  total?: (rows: Row[]) => ReactNode;
};

export type DataTableProps<Row> = {
  data: Row[] | undefined;
  columns: Column<Row>[];
  /** The row's identity. An index works, but breaks when the list reorders. */
  rowKey: (row: Row, index: number) => string;

  isLoading?: boolean;
  isError?: boolean;
  /** Without this, the error offers no retry. */
  onRetry?: () => void;
  /**
   * The title of the error notice. Without it, "Nao foi possivel carregar".
   *
   * It exists for the same reason as `errorMessage`: a screen that loads three
   * different listings has to say which one failed, and a product that does not
   * speak Portuguese has to say it in another language.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * The discreet line for when the search finds nothing. Without it, "Nenhum
   * resultado para a busca."
   *
   * Not to be confused with `empty`: a filter that zeroed out is not an empty query, and the
   * remedy for one - clearing the search - does not serve the other.
   */
  noResultsMessage?: ReactNode;

  /**
   * What appears when the query comes back empty. The description is required
   * because "nenhum resultado" hands the person the work of finding out
   * why, and they almost never do.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };

  onRowClick?: (row: Row) => void;
  /** How many placeholder rows the loading state shows. */
  skeletonRows?: number;
  className?: string;
  caption?: string;

  /**
   * Turns on client-side pagination, with a footer: count on the left, pages on the
   * right. Whoever paginates on the server does not use this: show the page that came and
   * put the house `Pagination` outside.
   */
  pageSize?: number;

  /**
   * Controlled global filter: the app puts the search field wherever it wants and passes
   * the text; the table filters all columns, ignoring case and accents.
   */
  filter?: string;

  /**
   * Max height of the table. With it the list gets its own frame: scrolls
   * internally instead of pushing the page, and the header sticks to the top.
   *
   * A number becomes pixels. On its own, it virtualizes nothing - the rows stay
   * all in the DOM, and that is enough up to a few thousand.
   */
  maxHeight?: number | string;

  /**
   * Draws only the rows that fit in the frame, and the middle path appears:
   * a hundred thousand rows with `sortable` and `filter` still working, without
   * sending the person to server-side pagination.
   *
   * Needs `maxHeight` - without a height there is nothing to fit. Does not combine with
   * `pageSize`: paginating already solves the same problem another way.
   */
  virtual?: boolean;

  /**
   * The height of a row, in pixels, when `virtual` is on.
   *
   * It is not a guess: virtualizing only adds up with a row of known height -
   * and the space for what was not drawn comes out of that multiplication. That is why the
   * virtualized row receives this height, and the default follows the comfortable
   * density. In a dense list, or with a two-line cell, pass your own.
   */
  rowHeight?: number;

  /** Checkbox column on the left. The keys come from `rowKey`. */
  selectable?: boolean;
  /**
   * The checked keys, when the consumer controls the selection. Without it, the table
   * keeps its own and prunes by itself the row that leaves `data`; controlled, the
   * pruning belongs to whoever controls it, along with the deletion.
   */
  value?: string[];
  /** The checked keys on the way out, when the table controls its own selection. */
  defaultValue?: string[];
  onValueChange?: (keys: string[]) => void;

  /**
   * The piece's texts, to change the language: `retry` is the button that runs
   * `onRetry` - the same key in every piece that handles the four endings -,
   * `selectAll` and `selectRow` the names of the checkboxes, `range` the
   * count in the pagination footer and `pagination` the texts of the inner `Pagination`,
   * with its keys.
   * `loading` and `loaded` are what the screen reader hears when the query
   * goes out and when it comes back. Pass only the ones that change.
   */
  labels?: Partial<DataTableLabels>;
  /**
   * Class per part: `table`, `head`, `row`, `cell`, `footer`. Avoids
   * `[&_tbody_tr]`, which couples the consumer's screen to the piece's internal tree.
   *
   * `footer` is the pagination bar below the table, not the totals
   * row - that one lives inside `<tfoot>` and is dressed through what each column's `total`
   * returns.
   */
  classNames?: Slots<"table" | "head" | "row" | "cell" | "footer">;
};

const FEATURES = tableFeatures({
  rowSortingFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns,
});

const flatten = (text: unknown) =>
  String(text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const accentFreeFilter = constructFilterFn({
  filter: (dataValue, filterValue: string) => flatten(dataValue).includes(filterValue),
  resolveFilterValue: (value: unknown) => flatten(value),
  autoRemove: (value: unknown) => !value,
});

const NO_PAGINATION = Number.MAX_SAFE_INTEGER;

const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

function blank(raw: unknown): unknown {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === "number" && Number.isNaN(raw)) return undefined;
  if (raw instanceof Date && Number.isNaN(raw.getTime())) return undefined;
  return raw;
}

function compareValues(a: unknown, b: unknown): number {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

const keysOf = (selection: RowSelectionState) =>
  Object.keys(selection).filter((key) => selection[key]);

export type DataTableLabels = {
  retry: string;
  selectAll: string;
  selectRow: string;
  range: (first: number, last: number, total: number) => string;
  pagination: Partial<PaginationLabels>;
  loading: string;
  loaded: string;
};

export function DataTable<Row>({
  data,
  columns,
  rowKey,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar a lista.",
  noResultsMessage = "Nenhum resultado para a busca.",
  empty,
  onRowClick,
  skeletonRows = 5,
  labels,
  className,
  caption,
  pageSize,
  filter,
  maxHeight,
  virtual,
  rowHeight = 44,
  selectable,
  value,
  defaultValue,
  onValueChange,
  classNames,
}: DataTableProps<Row>) {
  const retryLabel = labels?.retry ?? "Tentar de novo";
  const [pageIndex, setPageIndex] = useState(0);

  const [seenFilter, setSeenFilter] = useState(filter);
  if (filter !== seenFilter) {
    setSeenFilter(filter);
    setPageIndex(0);
  }

  const [internalSelection, setInternalSelection] = useState<RowSelectionState>(() =>
    Object.fromEntries((defaultValue ?? []).map((key) => [key, true])),
  );

  const [seenData, setSeenData] = useState(data);
  const [pruned, setPruned] = useState<string[] | null>(null);
  if (data !== seenData) {
    setSeenData(data);
    if (data && !value) {
      const present = new Set(data.map((row, index) => rowKey(row, index)));
      const kept = keysOf(internalSelection).filter((key) => present.has(key));
      if (kept.length !== keysOf(internalSelection).length) {
        setInternalSelection(Object.fromEntries(kept.map((key) => [key, true])));
        setPruned(kept);
      }
    }
  }

  useEffect(() => {
    if (pruned === null) return;
    setPruned(null);
    onValueChange?.(pruned);
  }, [pruned, onValueChange]);

  const selection: RowSelectionState = useMemo(
    () => (value ? Object.fromEntries(value.map((key) => [key, true])) : internalSelection),
    [value, internalSelection],
  );

  type EngineRow = Record<string, unknown>;

  const defs = useMemo<ColumnDef<typeof FEATURES, EngineRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row: EngineRow) =>
          blank(column.value ? column.value(row as Row) : row[column.key]),
        enableSorting: column.sortable ?? false,
        sortUndefined: "last" as const,
        sortFn: (
          rowA: { getValue: (id: string) => unknown },
          rowB: { getValue: (id: string) => unknown },
        ) => compareValues(rowA.getValue(column.key), rowB.getValue(column.key)),
        enableGlobalFilter: true,
      })),
    [columns],
  );

  const table = useTable<typeof FEATURES, EngineRow>({
    features: FEATURES,
    columns: defs,
    data: (data ?? []) as unknown as EngineRow[],
    getRowId: (row, index) => rowKey(row as unknown as Row, index),
    enableRowSelection: selectable ?? false,
    sortDescFirst: false,
    globalFilterFn: accentFreeFilter,
    getColumnCanGlobalFilter: () => true,
    onPaginationChange: (updater: Updater<{ pageIndex: number; pageSize: number }>) => {
      setPageIndex((atual) => {
        const proximo =
          typeof updater === "function"
            ? updater({ pageIndex: atual, pageSize: pageSize ?? NO_PAGINATION })
            : updater;
        return proximo.pageIndex;
      });
    },
    onRowSelectionChange: (updater: Updater<RowSelectionState>) => {
      const proxima = typeof updater === "function" ? updater(selection) : updater;
      if (!value) setInternalSelection(proxima);
      const keys = keysOf(proxima);
      onValueChange?.(keys);
    },
    state: {
      globalFilter: filter || undefined,
      pagination: { pageIndex, pageSize: pageSize ?? NO_PAGINATION },
      rowSelection: selection,
    },
  });

  function openRow(event: MouseEvent<HTMLTableRowElement>, row: Row) {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "a,button,input,select,textarea,label,[role='menuitem'],[role='checkbox'],[data-rc-keep-row]",
      )
    ) {
      return;
    }
    onRowClick?.(row);
  }

  const rows = table.getRowModel().rows;

  const viewport = useRef<HTMLDivElement>(null);
  const virtualized = virtual === true && maxHeight !== undefined;

  const virtualizer = useVirtualizer({
    count: virtualized ? rows.length : 0,
    getScrollElement: () => viewport.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const visible = virtualized ? virtualizer.getVirtualItems() : [];
  const firstVisible = visible[0];
  const lastVisible = visible[visible.length - 1];
  const spaceBefore = firstVisible ? firstVisible.start : 0;
  const spaceAfter = lastVisible ? virtualizer.getTotalSize() - lastVisible.end : 0;

  if (isError) {
    return (
      <Alert tone="danger" className={className}>
        <AlertTitle>{errorTitle}</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
        {onRetry && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3 w-fit"
            onClick={onRetry}
          >
            {retryLabel}
          </Button>
        )}
      </Alert>
    );
  }

  const loading = isLoading || data === undefined;

  if (!loading && data.length === 0 && empty) {
    return (
      <EmptyState
        className={className}
        icon={empty.icon}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );
  }

  const filteredTotal = table.getFilteredRowModel().rows.length;
  const lastPage = pageSize ? Math.max(0, Math.ceil(filteredTotal / pageSize) - 1) : 0;
  if (!loading && pageIndex > lastPage) setPageIndex(lastPage);
  const columnCount = columns.length + (selectable ? 1 : 0);

  const first = pageIndex * (pageSize ?? NO_PAGINATION) + 1;
  const last = Math.min(first + (pageSize ?? NO_PAGINATION) - 1, filteredTotal);

  const head = (
    <TableHeader
      className={cn(
        maxHeight !== undefined && [
          "sticky top-0 z-[var(--rc-z-sticky)] bg-surface",
          "shadow-[inset_0_-1px_0_var(--rc-border)]",
        ],
      )}
    >
      <TableRow aria-rowindex={virtualized ? 1 : undefined} className="hover:bg-transparent">
        {selectable && (
          <TableHead className={cn("w-10", classNames?.head)}>
            <Checkbox
              aria-label={labels?.selectAll ?? "Selecionar todas as linhas da página"}
              checked={table.getIsAllPageRowsSelected()}
              indeterminate={table.getIsSomePageRowsSelected()}
              onCheckedChange={() =>
                table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())
              }
            />
          </TableHead>
        )}
        {columns.map((column) => {
          const engineColumn = table.getColumn(column.key);
          const direcao = engineColumn?.getIsSorted();
          return (
            <TableHead
              key={column.key}
              aria-sort={
                direcao === "asc" ? "ascending" : direcao === "desc" ? "descending" : undefined
              }
              className={cn(
                column.align === "right" && "text-right",
                column.hideOnMobile && "max-sm:hidden",
                classNames?.head,
              )}
            >
              {column.sortable && engineColumn ? (
                <button
                  type="button"
                  onClick={() => {
                    setPageIndex(0);
                    engineColumn.toggleSorting();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm",
                    "uppercase",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "transition-colors duration-[var(--rc-duration-fast)] ease-rc-effects hover:text-fg",
                    direcao && "text-fg",
                  )}
                >
                  {column.header}
                  {direcao ? (
                    <ArrowUp
                      className={cn(
                        "size-3.5 text-accent-text",
                        "transition-transform duration-[var(--rc-duration-base)] ease-rc",
                        direcao === "desc" && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronsUpDown className="size-3.5 text-fg-subtle" aria-hidden="true" />
                  )}
                </button>
              ) : (
                column.header
              )}
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );

  const drawn: { row: (typeof rows)[number]; index: number }[] = virtualized
    ? visible.flatMap((item) => {
        const row = rows[item.index];
        return row ? [{ row, index: item.index }] : [];
      })
    : rows.map((row, index) => ({ row, index }));

  const spacer = (height: number, side: string) => (
    <tr key={`espaco-${side}`} aria-hidden="true">
      <td colSpan={columnCount} style={{ height }} />
    </tr>
  );

  const summed = columns.some((column) => column.total)
    ? table.getFilteredRowModel().rows.map((row) => row.original as unknown as Row)
    : undefined;

  const foot = summed && !loading && rows.length > 0 && (
    <TableFooter
      className={cn(
        maxHeight !== undefined && [
          "sticky bottom-0 z-[var(--rc-z-sticky)] bg-surface",
          "shadow-[inset_0_1px_0_var(--rc-border)]",
        ],
      )}
    >
      <TableRow
        aria-rowindex={virtualized ? rows.length + 2 : undefined}
        className="border-b-0 hover:bg-transparent"
      >
        {selectable && <TableCell className="w-10" />}
        {columns.map((column) => (
          <TableCell
            key={column.key}
            className={cn(
              column.align === "right" && "text-right",
              column.hideOnMobile && "max-sm:hidden",
            )}
          >
            {column.total?.(summed)}
          </TableCell>
        ))}
      </TableRow>
    </TableFooter>
  );

  const body = (
    <TableBody
      key={loading ? "loading" : "rows"}
      className={loading ? undefined : "animate-appear"}
    >
      {loading ? (
        Array.from({ length: skeletonRows }, (_, row) => (
          <TableRow key={`carregando-${row}`}>
            {selectable && (
              <TableCell className="w-10">
                <Skeleton className="size-4" />
              </TableCell>
            )}
            {columns.map((column) => (
              <TableCell key={column.key} className={cn(column.hideOnMobile && "max-sm:hidden")}>
                <Skeleton className="h-4 w-full max-w-[12ch]" />
              </TableCell>
            ))}
          </TableRow>
        ))
      ) : rows.length === 0 && filter && filteredTotal === 0 ? (
        <TableRow>
          <TableCell colSpan={columnCount} className="py-8 text-center text-fg-muted">
            {noResultsMessage}
          </TableCell>
        </TableRow>
      ) : (
        <>
          {spaceBefore > 0 && spacer(spaceBefore, "antes")}
          {drawn.map(({ row: linha, index }) => (
            <TableRow
              key={linha.id}
              aria-rowindex={virtualized ? index + 2 : undefined}
              style={virtualized ? { height: rowHeight } : undefined}
              onClick={
                onRowClick ? (event) => openRow(event, linha.original as unknown as Row) : undefined
              }
              className={cn(
                "data-[selected]:bg-selected data-[selected]:shadow-[inset_2px_0_0_var(--rc-accent)]",
                onRowClick && "cursor-pointer",
                classNames?.row,
              )}
              data-selected={linha.getIsSelected() || undefined}
            >
              {selectable && (
                <TableCell className={cn("w-10", classNames?.cell)}>
                  <Checkbox
                    aria-label={labels?.selectRow ?? "Selecionar linha"}
                    checked={linha.getIsSelected()}
                    onCheckedChange={(checked) => linha.toggleSelected(checked === true)}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    column.align === "right" && "text-right",
                    column.hideOnMobile && "max-sm:hidden",
                    classNames?.cell,
                  )}
                >
                  {column.cell
                    ? column.cell(linha.original as unknown as Row)
                    : String(linha.original[column.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
          {spaceAfter > 0 && spacer(spaceAfter, "depois")}
        </>
      )}
    </TableBody>
  );

  return (
    <div className={className}>
      <LoadingAnnouncement loading={loading} labels={labels} />

      {maxHeight === undefined ? (
        <Table className={classNames?.table}>
          {caption && <caption className="sr-only">{caption}</caption>}
          {head}
          {body}
          {foot}
        </Table>
      ) : (
        <div
          ref={viewport}
          data-rc-viewport=""
          style={{ maxHeight }}
          className="relative w-full overflow-auto rounded-md border border-border bg-surface"
        >
          <table
            aria-rowcount={virtualized ? rows.length + (foot ? 2 : 1) : undefined}
            className={cn("w-full border-collapse text-base", classNames?.table)}
          >
            {caption && <caption className="sr-only">{caption}</caption>}
            {head}
            {body}
            {foot}
          </table>
        </div>
      )}

      {pageSize !== undefined && !loading && filteredTotal > 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 pt-3",
            classNames?.footer,
          )}
        >
          <p className="text-sm text-fg-muted">
            {labels?.range
              ? labels.range(first, last, filteredTotal)
              : `${first}–${last} de ${filteredTotal}`}
          </p>
          <Pagination
            page={pageIndex + 1}
            pageCount={Math.max(1, table.getPageCount())}
            onPageChange={(page) => setPageIndex(page - 1)}
            labels={labels?.pagination}
          />
        </div>
      )}
    </div>
  );
}
