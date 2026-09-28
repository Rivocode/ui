"use client";

import {
  DndContext,
  DragOverlay,
  closestCorners,
  defaultDropAnimationSideEffects,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TriangleAlert } from "lucide-react";
import {
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Badge } from "../components/badge";
import { cn } from "../lib/cn";
import { layerLevel, useParentLayer } from "../lib/layer";
import { useRivoContext } from "../provider/rivo-provider";
import { useMediaQuery } from "../lib/screen";
import type { Slots } from "../lib/slots";
import { moveItem } from "../shared/sortable";
import {
  REDUCED_MOTION,
  SLIDING,
  readMotion,
  handlePropsOf,
  transformOf,
  useAnnouncer,
  useDragSensors,
  type TokenMotion,
} from "./drag";

export type KanbanColumn<Item> = {
  /** The column's identity. Comes back in `from` and `to` of `onMove`. */
  id: string;
  /** The column's name, in the header and in the announcements: "Em análise". */
  title: string;
  /** The cards, in their current order. */
  items: readonly Item[];
  /**
   * The work-in-progress limit. Above it the count turns to warning and
   * says "acima do limite" in text; the card can still come in, because the
   * limit warns and does not lock.
   */
  limit?: number;
};

export type KanbanMove = {
  /** The card's key, the same one `getKey` returned. */
  itemId: UniqueIdentifier;
  /** The `id` of the column the card left from. */
  from: string;
  /** The `id` of the column where it stopped. Equal to `from` when only its position changed. */
  to: string;
  /** The final position inside `to`, counting from zero. */
  index: number;
};

export type KanbanCardState = {
  /** The card is being dragged right now. Also applies to the copy that follows the pointer. */
  isDragging: boolean;
};

export type KanbanLabels = {
  instructions: string;
  roleDescription: string;
  empty: string;
  overLimit: string;
  count: (count: number, limit?: number) => string;
  picked: (card: string, column: string, position: number, total: number) => string;
  moved: (card: string, column: string, position: number, total: number) => string;
  dropped: (card: string, column: string, position: number, total: number) => string;
  canceled: (card: string, column: string, position: number, total: number) => string;
  limitReached: (column: string, limit: number) => string;
};

export type KanbanProps<Item> = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /**
   * The columns, with each one's cards. The piece is controlled: during the
   * drag it shows where the card will land, and on drop it asks for the change through
   * `onMove` and goes back to drawing whatever arrives here.
   */
  columns: readonly KanbanColumn<Item>[];
  /** The identity of each card, unique across the whole board, not just in the column. */
  getKey: (item: Item) => UniqueIdentifier;
  /** The card's content. The frame, the handle and the focus are the piece's. */
  renderCard: (item: Item, state: KanbanCardState) => ReactNode;
  /**
   * Called on dropping the card in a place different from where it left, in another
   * column or the same one. Dropping in the same place or canceling with Esc does not call it.
   */
  onMove: (move: KanbanMove) => void;
  /** The card's name in the announcements: "Nota 1043". Without it, the key is used. */
  getLabel?: (item: Item) => string;
  /** Locks dragging on the whole board. The columns keep scrolling and the cards stay focusable. */
  disabled?: boolean;
  /**
   * The texts of the count, the empty column, the limit and the announcements, for another
   * language.
   */
  labels?: Partial<KanbanLabels>;
  classNames?: Slots<"column" | "header" | "title" | "count" | "list" | "card" | "empty">;
};

const COLUMN = "kanban-column:";

const KANBAN_LABELS: KanbanLabels = {
  instructions:
    "Para mover um cartão, pressione Espaço para pegá-lo. Use as setas para mover entre posições e colunas, Espaço para soltar e Esc para cancelar.",
  roleDescription: "cartão arrastável",
  empty: "Nenhum cartão. Solte um aqui.",
  overLimit: "Acima do limite",
  count: (count, limit) =>
    limit === undefined
      ? `${count} ${count === 1 ? "cartão" : "cartões"}`
      : `${count} de ${limit} cartões`,
  picked: (card, column, position, total) =>
    `Cartão ${card} pego, na coluna ${column}. Posição ${position} de ${total}.`,
  moved: (card, column, position, total) =>
    `Cartão ${card} movido para ${column}, posição ${position} de ${total}.`,
  dropped: (card, column, position, total) =>
    `Cartão ${card} solto em ${column}, posição ${position} de ${total}.`,
  canceled: (card, column, position, total) =>
    `Movimento cancelado. Cartão ${card} voltou para ${column}, posição ${position} de ${total}.`,
  limitReached: (column, limit) => `A coluna ${column} passa do limite de ${limit}.`,
};

type Board = Record<string, UniqueIdentifier[]>;

type Drag = {
  key: UniqueIdentifier;
  from: string;
  fromIndex: number;
  board: Board;
};

export function Kanban<Item>({
  columns,
  getKey,
  renderCard,
  onMove,
  getLabel,
  disabled = false,
  labels: written,
  className,
  classNames,
  ...props
}: KanbanProps<Item>) {
  const labels = { ...KANBAN_LABELS, ...written };
  const reduced = useMediaQuery(REDUCED_MOTION);
  const [drag, setDrag] = useState<Drag | null>(null);
  const overlayLevel = layerLevel("dropdown", useParentLayer());
  const { portalContainer } = useRivoContext();
  const { say, announcements } = useAnnouncer();
  const spoken = useRef("");
  const [motion, setMotion] = useState<TokenMotion | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);

  const committed = useMemo<Board>(
    () => Object.fromEntries(columns.map((column) => [column.id, column.items.map(getKey)])),
    [columns, getKey],
  );
  const items = useMemo(() => {
    const map = new Map<UniqueIdentifier, Item>();
    for (const column of columns) for (const item of column.items) map.set(getKey(item), item);
    return map;
  }, [columns, getKey]);
  const titles = useMemo(
    () => new Map(columns.map((column) => [column.id, column.title])),
    [columns],
  );

  const board = drag?.board ?? committed;
  const labelOf = (key: UniqueIdentifier) => {
    const item = items.get(key);
    return item !== undefined && getLabel ? getLabel(item) : String(key);
  };
  const columnOf = (id: UniqueIdentifier, from: Board) => {
    if (typeof id === "string" && id.startsWith(COLUMN)) return id.slice(COLUMN.length);
    return Object.keys(from).find((column) => from[column]!.includes(id));
  };

  const sensors = useDragSensors(true);

  function update(next: Drag | null) {
    dragRef.current = next;
    setDrag(next);
  }

  function limitNote(column: string, total: number, crossed: boolean) {
    const limit = columns.find((entry) => entry.id === column)?.limit;
    if (!crossed || limit === undefined || total <= limit) return "";
    return ` ${labels.limitReached(titles.get(column) ?? column, limit)}`;
  }

  function start({ active }: DragStartEvent) {
    const from = columnOf(active.id, committed);
    if (from === undefined) return;
    const fromIndex = committed[from]!.indexOf(active.id);
    update({ key: active.id, from, fromIndex, board: committed });
    spoken.current = `${from}:${fromIndex}`;
    setMotion(readMotion(root.current, reduced));
    say(
      labels.picked(
        labelOf(active.id),
        titles.get(from) ?? from,
        fromIndex + 1,
        committed[from]!.length,
      ),
    );
  }

  function over({ active, over: target }: DragOverEvent) {
    const current = dragRef.current;
    if (!current || !target) return;
    const source = columnOf(active.id, current.board);
    const destination = columnOf(target.id, current.board);
    if (source === undefined || destination === undefined) return;

    let next = current.board;
    if (source !== destination) {
      const list = next[destination]!.filter((key) => key !== active.id);
      const at = list.indexOf(target.id);
      list.splice(at < 0 ? list.length : at, 0, active.id);
      next = {
        ...next,
        [source]: next[source]!.filter((key) => key !== active.id),
        [destination]: list,
      };
      update({ ...current, board: next });
    }

    const list = next[destination]!;
    const at = list.indexOf(target.id);
    const position = at < 0 ? list.indexOf(active.id) : at;
    const place = `${destination}:${position}`;
    if (place === spoken.current) return;
    spoken.current = place;
    say(
      labels.moved(
        labelOf(active.id),
        titles.get(destination) ?? destination,
        position + 1,
        list.length,
      ) + limitNote(destination, list.length, destination !== current.from),
    );
  }

  function end({ active, over: target }: DragEndEvent) {
    const current = dragRef.current;
    update(null);
    if (!current) return;

    let next = current.board;
    const destination = columnOf(active.id, next) ?? current.from;
    if (target) {
      const list = next[destination]!;
      const from = list.indexOf(active.id);
      const to = list.indexOf(target.id);
      if (from >= 0 && to >= 0 && from !== to) {
        next = { ...next, [destination]: moveItem(list, from, to) };
      }
    }
    const index = next[destination]!.indexOf(active.id);
    const title = titles.get(destination) ?? destination;
    const total = next[destination]!.length;

    if (!target || (destination === current.from && index === current.fromIndex)) {
      say(
        labels.dropped(
          labelOf(active.id),
          titles.get(current.from) ?? current.from,
          current.fromIndex + 1,
          committed[current.from]!.length,
        ),
      );
      return;
    }

    say(
      labels.dropped(labelOf(active.id), title, index + 1, total) +
        limitNote(destination, total, destination !== current.from),
    );
    onMove({ itemId: active.id, from: current.from, to: destination, index });
  }

  function cancel() {
    const current = dragRef.current;
    update(null);
    if (!current) return;
    say(
      labels.canceled(
        labelOf(current.key),
        titles.get(current.from) ?? current.from,
        current.fromIndex + 1,
        committed[current.from]!.length,
      ),
    );
  }

  const target = drag ? columnOf(drag.key, drag.board) : undefined;
  const moving = drag ? items.get(drag.key) : undefined;

  const overlay = (
    <DragOverlay
      dropAnimation={
        motion
          ? {
              ...motion,
              sideEffects: defaultDropAnimationSideEffects({
                styles: { active: { opacity: "0" } },
              }),
            }
          : null
      }
      style={{ zIndex: overlayLevel }}
      transition={(event) =>
        motion && event && "key" in event
          ? ["transform", `${motion.duration}ms`, motion.easing].join(" ")
          : undefined
      }
    >
      {moving !== undefined ? (
        <div
          className={cn(
            "cursor-grabbing rounded-md border border-border-strong bg-surface-raised p-3",
            "text-sm text-fg shadow-3",
            classNames?.card,
          )}
        >
          {renderCard(moving, { isDragging: true })}
        </div>
      ) : null}
    </DragOverlay>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: labels.instructions },
      }}
      onDragStart={start}
      onDragOver={over}
      onDragEnd={end}
      onDragCancel={cancel}
    >
      <div
        {...props}
        ref={root}
        className={cn(
          "flex min-w-0 snap-x snap-mandatory scroll-px-1 items-start gap-3 overflow-x-auto",
          "px-1 pt-1 pb-2 font-sans",
          "sm:snap-none",
          className,
        )}
      >
        {columns.map((column) => (
          <KanbanLane
            key={column.id}
            column={column}
            keys={board[column.id] ?? []}
            items={items}
            renderCard={renderCard}
            isTarget={drag !== null && target === column.id}
            disabled={disabled}
            labels={labels}
            classNames={classNames}
          />
        ))}
      </div>
      {portalContainer ? createPortal(overlay, portalContainer) : overlay}
    </DndContext>
  );
}

function KanbanLane<Item>({
  column,
  keys,
  items,
  renderCard,
  isTarget,
  disabled,
  labels,
  classNames,
}: {
  column: KanbanColumn<Item>;
  keys: UniqueIdentifier[];
  items: Map<UniqueIdentifier, Item>;
  renderCard: (item: Item, state: KanbanCardState) => ReactNode;
  isTarget: boolean;
  disabled: boolean;
  labels: KanbanLabels;
  classNames?: KanbanProps<Item>["classNames"];
}) {
  const titleId = useId();
  const { setNodeRef } = useDroppable({ id: `${COLUMN}${column.id}`, disabled });
  const count = keys.length;
  const over = column.limit !== undefined && count > column.limit;

  return (
    <section
      aria-labelledby={titleId}
      data-over-limit={over || undefined}
      data-target={isTarget || undefined}
      className={cn(
        "relative flex w-[85%] max-w-[20rem] shrink-0 snap-start flex-col rounded-lg border border-border",
        "bg-surface sm:w-72",
        "transition-shadow duration-[var(--rc-duration-fast)] ease-rc",
        isTarget && "ring-2 ring-ring",
        classNames?.column,
      )}
    >
      <header
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border px-3 py-2.5",
          classNames?.header,
        )}
      >
        <h3
          id={titleId}
          title={column.title}
          className={cn(
            "line-clamp-2 min-w-0 flex-1 text-sm font-rc-strong break-words text-fg",
            classNames?.title,
          )}
        >
          {column.title}
        </h3>
        <Badge
          tone={over ? "warning" : "neutral"}
          size="sm"
          className={cn("tabular-nums", classNames?.count)}
        >
          <span aria-hidden="true">
            {column.limit === undefined ? count : `${count}/${column.limit}`}
          </span>
          <span className="sr-only">{labels.count(count, column.limit)}</span>
        </Badge>
        {over && (
          <span className="flex w-full items-center gap-1 text-xs text-warning-text [&_svg]:size-3.5">
            <TriangleAlert aria-hidden="true" />
            {labels.overLimit}
          </span>
        )}
      </header>
      <div ref={setNodeRef} className="flex min-h-24 flex-col p-2">
        <SortableContext items={keys} strategy={verticalListSortingStrategy} disabled={disabled}>
          <ul aria-labelledby={titleId} className={cn("flex flex-col gap-2", classNames?.list)}>
            {keys.map((key) => {
              const item = items.get(key);
              if (item === undefined) return null;
              return (
                <KanbanCard
                  key={key}
                  id={key}
                  labels={labels}
                  disabled={disabled}
                  className={classNames?.card}
                >
                  {(state) => renderCard(item, state)}
                </KanbanCard>
              );
            })}
          </ul>
        </SortableContext>
        {count === 0 && (
          <p
            className={cn(
              "flex flex-1 items-center justify-center rounded-md border border-dashed",
              "border-border-strong px-3 py-6 text-center text-sm text-fg-muted",
              classNames?.empty,
            )}
          >
            {labels.empty}
          </p>
        )}
      </div>
    </section>
  );
}

function KanbanCard({
  id,
  labels,
  disabled,
  className,
  children,
}: {
  id: UniqueIdentifier;
  labels: KanbanLabels;
  disabled: boolean;
  className?: string;
  children: (state: KanbanCardState) => ReactNode;
}) {
  const sortable = useSortable({
    id,
    disabled,
    attributes: { roleDescription: labels.roleDescription },
  });
  const { ref: activator, ...handle } = handlePropsOf(sortable);

  const style: CSSProperties = { transform: transformOf(sortable.transform) };

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      data-dragging={sortable.isDragging || undefined}
      className={cn("list-none", sortable.transition && SLIDING)}
    >
      <div
        {...handle}
        ref={activator}
        data-dragging={sortable.isDragging || undefined}
        className={cn(
          "rounded-md border border-border bg-surface-raised p-3 text-sm text-fg select-none",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? "cursor-default" : "cursor-grab",
          sortable.isDragging && "border-dashed border-border-strong bg-surface shadow-none",
          className,
        )}
      >
        <div className={cn(sortable.isDragging && "invisible")}>
          {children({ isDragging: sortable.isDragging })}
        </div>
      </div>
    </li>
  );
}
