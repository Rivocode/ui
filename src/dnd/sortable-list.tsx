"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from "react";

import { IconButton } from "../components/icon-button";
import { cn } from "../lib/cn";
import type { Slots } from "../lib/slots";
import { SORTABLE_LIST_LABELS, moveItem, type SortableListLabels } from "../shared/sortable";
import {
  SLIDING,
  handlePropsOf,
  transformOf,
  useAnnouncer,
  useDragSensors,
  type SortableHandleProps,
} from "./drag";

export type { SortableHandleProps, SortableListLabels };

export type SortableItemState = {
  /**
   * What makes an element become the handle: ref, pointer and keyboard
   * listeners, `role`, `tabIndex` and the instruction for the screen reader. Spread it
   * on an element of yours when `handle` is `false`; with the piece's handle on
   * it has already received all of this.
   */
  handleProps: SortableHandleProps;
  /** The item is being dragged right now, by pointer or by keyboard. */
  isDragging: boolean;
  /** The item's position in the list, counting from zero. */
  index: number;
};

export type SortableListMove = {
  /** The key of the item that moved, the same one `getKey` returned. */
  key: UniqueIdentifier;
  /** Where it left from, counting from zero. */
  from: number;
  /** Where it stopped, counting from zero. */
  to: number;
};

export type SortableListProps<Item> = Omit<
  ComponentPropsWithoutRef<"ul">,
  "children" | "onChange"
> & {
  /**
   * The items, in their current order. The piece is controlled: the new order comes back through
   * `onReorder`.
   */
  items: readonly Item[];
  /** The identity of each item. Must be unique and cannot change when the item moves. */
  getKey: (item: Item) => UniqueIdentifier;
  /** The drawing of each item. The piece wraps each one in an `li` that moves by itself. */
  renderItem: (item: Item, state: SortableItemState) => ReactNode;
  /**
   * The new order, already assembled, on dropping in a place different from where the item
   * left. Dropping in the same place or canceling with Esc does not call it.
   */
  onReorder: (items: Item[], move: SortableListMove) => void;
  /**
   * The item's name in the announcements and in the handle's name: "Nota 1043" becomes "Item
   * Nota 1043 movido para a posicao 3 de 8". Without it, the key is used.
   */
  getLabel?: (item: Item) => string;
  /**
   * Draws the handle, an `IconButton` with the grab icon, at the start of each
   * item, and only it drags. With `false` no handle is drawn, and what
   * drags is the element where you spread `handleProps`: your own handle,
   * or the whole row.
   */
  handle?: boolean;
  /** The list's axis. `horizontal` becomes a row that scrolls sideways when it does not fit. */
  orientation?: "vertical" | "horizontal";
  /** Locks all dragging, and the handle is rendered disabled. */
  disabled?: boolean;
  /**
   * The texts of the announcements, the instruction and the handle's name, for another language
   * or another name for the thing ("Etapa" instead of "Item").
   */
  labels?: Partial<SortableListLabels>;
  classNames?: Slots<"item" | "handle" | "content">;
};

const onlyVertical: Modifier = ({ transform }) => ({ ...transform, x: 0 });
const onlyHorizontal: Modifier = ({ transform }) => ({ ...transform, y: 0 });

export function SortableList<Item>({
  items,
  getKey,
  renderItem,
  onReorder,
  getLabel,
  handle = true,
  orientation = "vertical",
  disabled = false,
  labels: written,
  className,
  classNames,
  ...props
}: SortableListProps<Item>) {
  const labels = { ...SORTABLE_LIST_LABELS, ...written };
  const { say, announcements } = useAnnouncer();
  const [activeKey, setActiveKey] = useState<UniqueIdentifier | null>(null);
  const origin = useRef(-1);
  const spoken = useRef(-1);

  const keys = useMemo(() => items.map(getKey), [items, getKey]);
  const labelOf = (key: UniqueIdentifier) => {
    const item = items[keys.indexOf(key)];
    return item !== undefined && getLabel ? getLabel(item) : String(key);
  };

  const sensors = useDragSensors(!handle);

  const total = items.length;

  function start({ active }: DragStartEvent) {
    origin.current = keys.indexOf(active.id);
    spoken.current = origin.current;
    setActiveKey(active.id);
    say(labels.picked(labelOf(active.id), origin.current + 1, total));
  }

  function over({ active, over: target }: DragOverEvent) {
    if (!target) return;
    const position = keys.indexOf(target.id);
    if (position < 0 || position === spoken.current) return;
    spoken.current = position;
    say(labels.moved(labelOf(active.id), position + 1, total));
  }

  function end({ active, over: target }: DragEndEvent) {
    setActiveKey(null);
    const from = keys.indexOf(active.id);
    const to = target ? keys.indexOf(target.id) : -1;
    if (from < 0 || to < 0 || from === to) {
      say(labels.dropped(labelOf(active.id), from + 1, total));
      return;
    }
    say(labels.dropped(labelOf(active.id), to + 1, total));
    onReorder(moveItem(items, from, to), { key: active.id, from, to });
  }

  function cancel() {
    const key = activeKey;
    setActiveKey(null);
    if (key === null) return;
    say(labels.canceled(labelOf(key), origin.current + 1, total));
  }

  const horizontal = orientation === "horizontal";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[horizontal ? onlyHorizontal : onlyVertical]}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: labels.instructions },
      }}
      onDragStart={start}
      onDragOver={over}
      onDragEnd={end}
      onDragCancel={cancel}
    >
      <SortableContext
        items={keys}
        strategy={horizontal ? horizontalListSortingStrategy : verticalListSortingStrategy}
        disabled={disabled}
      >
        <ul
          {...props}
          data-orientation={orientation}
          className={cn(
            "flex min-w-0 gap-2 font-sans",
            horizontal ? "flex-row overflow-x-auto pb-1" : "flex-col",
            className,
          )}
        >
          {items.map((item, index) => (
            <SortableRow
              key={keys[index]}
              id={keys[index]!}
              index={index}
              label={labelOf(keys[index]!)}
              labels={labels}
              handle={handle}
              disabled={disabled}
              horizontal={horizontal}
              classNames={classNames}
              render={(state) => renderItem(item, state)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  index,
  label,
  labels,
  handle,
  disabled,
  horizontal,
  classNames,
  render,
}: {
  id: UniqueIdentifier;
  index: number;
  label: string;
  labels: SortableListLabels;
  handle: boolean;
  disabled: boolean;
  horizontal: boolean;
  classNames?: Slots<"item" | "handle" | "content">;
  render: (state: SortableItemState) => ReactNode;
}) {
  const sortable = useSortable({
    id,
    disabled,
    attributes: { roleDescription: labels.roleDescription },
  });
  const handleProps = handlePropsOf(sortable);

  const style: CSSProperties = { transform: transformOf(sortable.transform) };

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      data-dragging={sortable.isDragging || undefined}
      className={cn(
        "relative flex min-w-0 items-center gap-2 rounded-md",
        horizontal && "shrink-0",
        sortable.transition && SLIDING,
        sortable.isDragging && "z-[var(--rc-z-sticky)] bg-surface-raised shadow-2",
        classNames?.item,
      )}
    >
      {handle && (
        <IconButton
          type="button"
          {...handleProps}
          label={labels.handle(label)}
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "touch-none text-fg-muted",
            disabled ? "cursor-not-allowed" : "cursor-grab data-[dragging]:cursor-grabbing",
            classNames?.handle,
          )}
          data-dragging={sortable.isDragging || undefined}
        >
          <GripVertical />
        </IconButton>
      )}
      <div className={cn("min-w-0 flex-1", classNames?.content)}>
        {render({ handleProps, isDragging: sortable.isDragging, index })}
      </div>
    </li>
  );
}
