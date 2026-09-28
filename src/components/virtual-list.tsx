"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useImperativeHandle, useRef, type ReactNode, type Ref } from "react";

import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import type { Slots } from "../lib/slots";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { Skeleton } from "./skeleton";

export type VirtualListHandle = {
  scrollToIndex: (
    index: number,
    options?: { align?: "start" | "center" | "end" | "auto"; behavior?: "auto" | "smooth" },
  ) => void;
};

export type VirtualListProps<Item> = {
  items: Item[] | undefined;
  /** What each item shows. Receives the index for the visible numbering. */
  renderItem: (item: Item, index: number) => ReactNode;
  /**
   * The item's identity, and not just a React key: it is how the measured height
   * follows the item when the list reorders or filters.
   */
  itemKey: (item: Item, index: number) => string;

  /**
   * Max height of the frame. A number becomes pixels.
   *
   * Required, unlike its `DataTable` sibling: without a height there is nothing to
   * fit, and a virtualized list without a frame draws a single item.
   */
  maxHeight: number | string;

  /**
   * The estimated height of an item, in pixels, or a function per index.
   *
   * It is what holds up the scrollbar before the item exists. With `measure`
   * on it only needs to be close; with `measure` off it is the law, and an
   * item taller than this overlaps the one below.
   */
  itemHeight?: number | ((index: number) => number);
  /**
   * Each drawn item reports its real height, and the scroll corrects itself.
   *
   * On out of the box, because it is what holds text that wraps into two lines at
   * 390px. Turn it off when the height is fixed by CSS: it saves one
   * observer per visible item.
   */
  measure?: boolean;
  /** How many items to draw beyond the frame, on each side. */
  overscan?: number;
  /** Gap between one item and the next, in pixels. */
  gap?: number;

  isLoading?: boolean;
  isError?: boolean;
  /** Without this, the error offers no retry. */
  onRetry?: () => void;
  /** The title of the error notice. Without it, "Nao foi possivel carregar". */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * What appears when the query comes back empty. The description is required
   * because "nenhum resultado" hands the person the work of finding out
   * why.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
  /** How many placeholder items the loading state shows. */
  skeletonItems?: number;

  /**
   * The list's name for the screen reader. Without it, the list has no name - and the
   * frame, which is a tab target, is also an unnamed stop.
   *
   * The inner list repeats this name with the real count attached: the reader
   * counts the children that are in the DOM and announces "lista com 15 itens" on a list
   * of four thousand, and the name is the only place where that can be corrected.
   * What writes that count is `labels.count`.
   */
  label?: string;
  /**
   * The piece's texts, to change the language: `retry` is the button that runs
   * `onRetry` - the same key in every piece that handles the four endings
   * -, and `count` the count that goes into the list's name, attached to `label`. Without
   * `count`, the count comes out in Portuguese stuck to an already translated `label`.
   * The default agrees with the singular: "1 item", and not "1 itens".
   * `loading` and `loaded` are what the screen reader hears when the query
   * goes out and when it comes back. Pass only the ones that change.
   */
  labels?: Partial<VirtualListLabels>;
  className?: string;
  /**
   * Class per part: `list` is the full-height strip that scrolls inside the
   * frame, `item` is each item's positioned box. Avoids `[&>div>div]`,
   * which couples the consumer's screen to the piece's internal tree.
   */
  classNames?: Slots<"list" | "item">;
  /**
   * Receives a `VirtualListHandle`, with `scrollToIndex(index, { align })`.
   *
   * It is the only way to reach an item that is not in the DOM: with no element,
   * `scrollIntoView` has nothing to reach.
   */
  ref?: Ref<VirtualListHandle>;
};

export type VirtualListLabels = {
  retry: string;
  count: (total: number) => string;
  loading: string;
  loaded: string;
};

export function VirtualList<Item>({
  items,
  renderItem,
  itemKey,
  maxHeight,
  itemHeight = 44,
  measure = true,
  overscan = 10,
  gap,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar",
  errorMessage = "Não foi possível carregar a lista.",
  empty,
  skeletonItems = 5,
  label,
  labels,
  className,
  classNames,
  ref,
}: VirtualListProps<Item>) {
  const viewport = useRef<HTMLDivElement>(null);

  const countLabel =
    labels?.count ?? ((total: number) => (total === 1 ? "1 item" : `${total} itens`));

  const estimate = typeof itemHeight === "function" ? itemHeight : () => itemHeight;

  const list = items ?? [];
  const loading = isLoading || items === undefined;
  const count = loading ? 0 : list.length;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => viewport.current,
    estimateSize: estimate,
    overscan,
    gap,
    getItemKey: (index) => {
      const item = list[index];
      return item === undefined ? index : itemKey(item, index);
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index, options) => virtualizer.scrollToIndex(index, options),
    }),
    [virtualizer],
  );

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
            {labels?.retry ?? "Tentar de novo"}
          </Button>
        )}
      </Alert>
    );
  }

  if (!loading && list.length === 0 && empty) {
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

  return (
    <div
      ref={viewport}
      data-rc-viewport=""
      tabIndex={0}
      role="group"
      aria-label={label}
      style={{ maxHeight }}
      className={cn(
        "w-full overflow-auto rounded-md border border-border-strong bg-surface",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <LoadingAnnouncement loading={loading} labels={labels} />

      {loading ? (
        <div aria-hidden="true">
          {Array.from({ length: skeletonItems }, (_, index) => (
            <div
              key={`carregando-${index}`}
              style={{ height: estimate(index) }}
              className="flex items-center px-3"
            >
              <Skeleton className="h-4 w-full max-w-[24ch]" />
            </div>
          ))}
        </div>
      ) : (
        <div
          role="list"
          aria-label={label === undefined ? undefined : `${label}, ${countLabel(count)}`}
          style={{ height: virtualizer.getTotalSize() }}
          className={cn("relative w-full", classNames?.list)}
        >
          {virtualizer.getVirtualItems().map((entry) => {
            const item = list[entry.index];
            if (item === undefined) return null;

            return (
              <div
                key={entry.key}
                role="listitem"
                aria-setsize={count}
                aria-posinset={entry.index + 1}
                data-index={entry.index}
                ref={measure ? virtualizer.measureElement : undefined}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: measure ? undefined : entry.size,
                  transform: `translateY(${entry.start}px)`,
                }}
                className={classNames?.item}
              >
                {renderItem(item, entry.index)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
