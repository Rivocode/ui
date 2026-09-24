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
   * O que faz um elemento virar a alca: ref, ouvintes de ponteiro e de
   * teclado, `role`, `tabIndex` e a instrucao para o leitor de tela. Espalhe
   * num elemento seu quando `handle` for `false`; com a alca da peca ligada
   * ela ja recebeu tudo isto.
   */
  handleProps: SortableHandleProps;
  /** O item esta sendo arrastado agora, por ponteiro ou por teclado. */
  isDragging: boolean;
  /** A posicao do item na lista, contando do zero. */
  index: number;
};

export type SortableListMove = {
  /** A chave do item que andou, a mesma que `getKey` devolveu. */
  key: UniqueIdentifier;
  /** De onde ele saiu, contando do zero. */
  from: number;
  /** Onde ele parou, contando do zero. */
  to: number;
};

export type SortableListProps<Item> = Omit<
  ComponentPropsWithoutRef<"ul">,
  "children" | "onChange"
> & {
  /** Os itens, na ordem de agora. A peca e controlada: a ordem nova volta por `onReorder`. */
  items: readonly Item[];
  /** A identidade de cada item. Tem que ser unica e nao pode mudar quando o item anda. */
  getKey: (item: Item) => UniqueIdentifier;
  /** O desenho de cada item. A peca embrulha cada um num `li` que anda sozinho. */
  renderItem: (item: Item, state: SortableItemState) => ReactNode;
  /**
   * A ordem nova, ja montada, ao soltar num lugar diferente de onde o item
   * saiu. Soltar no mesmo lugar ou cancelar com Esc nao chama.
   */
  onReorder: (items: Item[], move: SortableListMove) => void;
  /**
   * O nome do item nos anuncios e no nome da alca: "Nota 1043" vira "Item
   * Nota 1043 movido para a posicao 3 de 8". Sem ele, sai a chave.
   */
  getLabel?: (item: Item) => string;
  /**
   * Desenha a alca, um `IconButton` com o icone de pegar, no inicio de cada
   * item, e so ela arrasta. Com `false` nenhuma alca e desenhada, e quem
   * arrasta e o elemento onde voce espalhar `handleProps`: a sua propria alca,
   * ou a linha inteira.
   */
  handle?: boolean;
  /** O eixo da lista. `horizontal` vira fileira que rola de lado quando nao cabe. */
  orientation?: "vertical" | "horizontal";
  /** Trava o arrasto inteiro, e a alca sai desabilitada. */
  disabled?: boolean;
  /**
   * Os textos dos anuncios, da instrucao e do nome da alca, para outra lingua
   * ou outro nome de coisa ("Etapa" em vez de "Item").
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
          aria-orientation={orientation}
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
