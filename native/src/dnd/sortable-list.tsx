import { useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  PanResponder,
  View,
  type AccessibilityActionEvent,
  type GestureResponderHandlers,
  type LayoutChangeEvent,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { cn } from "../cn";
import { useTween } from "../motion";
import { SORTABLE_LIST_LABELS, moveItem, type SortableListLabels } from "../shared/sortable";

export type { SortableListLabels };

export type SortableHandleProps = GestureResponderHandlers & {
  accessible: true;
  accessibilityHint: string;
  accessibilityActions: { name: string; label: string }[];
  onAccessibilityAction: (event: AccessibilityActionEvent) => void;
};

export type SortableItemState = {
  /**
   * O gesto e as acoes do leitor de tela que fazem uma `View` virar a alca.
   * Espalhe numa `View` sua quando `handle` for `false`; com a alca da peca
   * ligada ela ja recebeu tudo isto.
   */
  handleProps: SortableHandleProps;
  /** O item esta sob o dedo agora. */
  isDragging: boolean;
  /** A posicao do item na lista, contando do zero. */
  index: number;
};

export type SortableListMove = {
  /** A chave do item que andou, a mesma que `getKey` devolveu. */
  key: string | number;
  /** De onde ele saiu, contando do zero. */
  from: number;
  /** Onde ele parou, contando do zero. */
  to: number;
};

export type NativeSortableListLabels = SortableListLabels & {
  earlier: string;
  later: string;
};

export type SortableListProps<Item> = {
  /** Os itens, na ordem de agora. A peca e controlada: a ordem nova volta por `onReorder`. */
  items: readonly Item[];
  /** A identidade de cada item. Tem que ser unica e nao pode mudar quando o item anda. */
  getKey: (item: Item) => string | number;
  /** O desenho de cada item. */
  renderItem: (item: Item, state: SortableItemState) => ReactNode;
  /**
   * A ordem nova, ja montada, ao soltar num lugar diferente de onde o item
   * saiu, ou a cada acao de mover do leitor de tela.
   */
  onReorder: (items: Item[], move: SortableListMove) => void;
  /** O nome do item nos anuncios e no nome da alca: "Nota 1043". Sem ele, sai a chave. */
  getLabel?: (item: Item) => string;
  /**
   * Desenha a alca de 44pt no inicio de cada item, e so ela arrasta: o resto
   * da linha continua rolando a tela. Com `false`, quem arrasta e a `View`
   * onde voce espalhar `handleProps`.
   */
  handle?: boolean;
  /** O eixo da lista. Muda o gesto, o deslocamento e o nome das acoes de mover. */
  orientation?: "vertical" | "horizontal";
  /** Trava o gesto e as acoes de mover. */
  disabled?: boolean;
  /**
   * Os textos dos anuncios, do nome da alca, da dica e das duas acoes de mover
   * (`earlier` e `later`), para outra lingua.
   */
  labels?: Partial<NativeSortableListLabels>;
  className?: string;
  classNames?: { item?: string; handle?: string; content?: string };
};

type Drag = { from: number; to: number; delta: number };

type Slot = { start: number; size: number };

const HINT = "Arraste pela alça, ou use as ações de mover do leitor de tela.";

const INERT_HANDLE: SortableHandleProps = {
  accessible: true,
  accessibilityHint: "",
  accessibilityActions: [],
  onAccessibilityAction: () => {},
};

function targetOf(slots: Slot[], from: number, delta: number): number {
  const moving = slots[from];
  if (!moving) return from;
  const center = moving.start + moving.size / 2 + delta;
  let before = 0;
  slots.forEach((slot, index) => {
    if (index !== from && slot.start + slot.size / 2 < center) before += 1;
  });
  return before;
}

function leadOf(slots: Slot[], from: number): number {
  const moving = slots[from];
  if (!moving) return 0;
  const next = slots[from + 1];
  const previous = slots[from - 1];
  if (next) return next.start - moving.start;
  if (previous) return moving.start - previous.start;
  return moving.size;
}

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
}: SortableListProps<Item>) {
  const horizontal = orientation === "horizontal";
  const labels: NativeSortableListLabels = {
    ...SORTABLE_LIST_LABELS,
    instructions: HINT,
    earlier: horizontal ? "Mover para a esquerda" : "Mover para cima",
    later: horizontal ? "Mover para a direita" : "Mover para baixo",
    ...written,
  };
  const [drag, setDrag] = useState<Drag | null>(null);
  const slots = useRef<Slot[]>([]);
  const latest = useRef({ items, drag, disabled, labels, onReorder });
  latest.current = { items, drag, disabled, labels, onReorder };

  const total = items.length;
  const labelOf = (index: number) => {
    const item = latest.current.items[index];
    if (item === undefined) return "";
    return getLabel ? getLabel(item) : String(getKey(item));
  };

  function commit(from: number, to: number) {
    const current = latest.current;
    if (from === to) return;
    const item = current.items[from];
    if (item === undefined) return;
    current.onReorder(moveItem(current.items, from, to), { key: getKey(item), from, to });
  }

  const controller = {
    grant(index: number) {
      if (latest.current.disabled) return;
      const next = { from: index, to: index, delta: 0 };
      latest.current.drag = next;
      setDrag(next);
      AccessibilityInfo.announceForAccessibility(
        latest.current.labels.picked(labelOf(index), index + 1, total),
      );
    },
    move(delta: number) {
      const current = latest.current.drag;
      if (!current) return;
      const to = targetOf(slots.current.slice(0, total), current.from, delta);
      const next = { ...current, to, delta };
      latest.current.drag = next;
      setDrag(next);
      if (to !== current.to) {
        AccessibilityInfo.announceForAccessibility(
          latest.current.labels.moved(labelOf(current.from), to + 1, total),
        );
      }
    },
    release() {
      const current = latest.current.drag;
      latest.current.drag = null;
      setDrag(null);
      if (!current) return;
      AccessibilityInfo.announceForAccessibility(
        latest.current.labels.dropped(labelOf(current.from), current.to + 1, total),
      );
      commit(current.from, current.to);
    },
    cancel() {
      const current = latest.current.drag;
      latest.current.drag = null;
      setDrag(null);
      if (!current) return;
      AccessibilityInfo.announceForAccessibility(
        latest.current.labels.canceled(labelOf(current.from), current.from + 1, total),
      );
    },
    step(index: number, by: number) {
      if (latest.current.disabled) return;
      const to = index + by;
      if (to < 0 || to >= total) return;
      AccessibilityInfo.announceForAccessibility(
        latest.current.labels.moved(labelOf(index), to + 1, total),
      );
      commit(index, to);
    },
  };

  const lead = drag ? leadOf(slots.current.slice(0, total), drag.from) : 0;
  const lifted = drag ? items[drag.from] : undefined;
  const liftedSlot = drag ? slots.current[drag.from] : undefined;

  return (
    <View
      accessibilityRole="list"
      className={cn(horizontal ? "flex-row gap-2" : "gap-2", className)}
    >
      {items.map((item, index) => {
        let shift = 0;
        if (drag && index !== drag.from) {
          if (drag.from < drag.to && index > drag.from && index <= drag.to) shift = -lead;
          if (drag.to < drag.from && index >= drag.to && index < drag.from) shift = lead;
        }
        return (
          <SortableRow
            key={getKey(item)}
            index={index}
            label={labelOf(index)}
            labels={labels}
            horizontal={horizontal}
            handle={handle}
            disabled={disabled}
            dragging={drag?.from === index}
            shift={shift}
            controller={controller}
            classNames={classNames}
            onSlot={(slot) => {
              slots.current[index] = slot;
            }}
            render={(state) => renderItem(item, state)}
          />
        );
      })}
      {drag && lifted !== undefined && liftedSlot && (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={
            horizontal
              ? { top: 0, bottom: 0, left: liftedSlot.start, transform: [{ translateX: drag.delta }] }
              : { left: 0, right: 0, top: liftedSlot.start, transform: [{ translateY: drag.delta }] }
          }
          className={cn(
            "absolute flex-row items-center gap-2 rounded-md border border-border-strong",
            "bg-surface-raised",
            classNames?.item,
          )}
        >
          {handle && (
            <View className={cn("size-11 items-center justify-center rounded-md", classNames?.handle)}>
              <GripGlyph />
            </View>
          )}
          <View className={cn("min-w-0 flex-1", classNames?.content)}>
            {renderItem(lifted, {
              handleProps: INERT_HANDLE,
              isDragging: true,
              index: drag.from,
            })}
          </View>
        </View>
      )}
    </View>
  );
}

type Controller = {
  grant: (index: number) => void;
  move: (delta: number) => void;
  release: () => void;
  cancel: () => void;
  step: (index: number, by: number) => void;
};

function SortableRow({
  index,
  label,
  labels,
  horizontal,
  handle,
  disabled,
  dragging,
  shift,
  controller,
  classNames,
  onSlot,
  render,
}: {
  index: number;
  label: string;
  labels: NativeSortableListLabels;
  horizontal: boolean;
  handle: boolean;
  disabled: boolean;
  dragging: boolean;
  shift: number;
  controller: Controller;
  classNames?: SortableListProps<unknown>["classNames"];
  onSlot: (slot: Slot) => void;
  render: (state: SortableItemState) => ReactNode;
}) {
  const live = useRef({ index, controller, horizontal });
  live.current = { index, controller, horizontal };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => live.current.controller.grant(live.current.index),
      onPanResponderMove: (_event, gesture) =>
        live.current.controller.move(live.current.horizontal ? gesture.dx : gesture.dy),
      onPanResponderRelease: () => live.current.controller.release(),
      onPanResponderTerminate: () => live.current.controller.cancel(),
    }),
  ).current;

  const moved = useTween(shift, "base");
  const neighbour = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: horizontal ? [{ translateX: moved.value }] : [{ translateY: moved.value }],
    };
  });
  const handleProps: SortableHandleProps = {
    ...(disabled ? {} : pan.panHandlers),
    accessible: true,
    accessibilityHint: labels.instructions,
    accessibilityActions: disabled
      ? []
      : [
          { name: "moveEarlier", label: labels.earlier },
          { name: "moveLater", label: labels.later },
        ],
    onAccessibilityAction: (event) => {
      const by = event.nativeEvent.actionName === "moveEarlier" ? -1 : 1;
      live.current.controller.step(live.current.index, by);
    },
  };

  return (
    <Animated.View
      onLayout={(event: LayoutChangeEvent) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        onSlot(horizontal ? { start: x, size: width } : { start: y, size: height });
      }}
      style={neighbour}
      className={cn(
        "flex-row items-center gap-2 rounded-md",
        dragging && "opacity-0",
        classNames?.item,
      )}
    >
      {handle && (
        <View
          {...handleProps}
          accessibilityLabel={labels.handle(label)}
          accessibilityState={{ disabled }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className={cn(
            "size-11 items-center justify-center rounded-md",
            disabled && "opacity-50",
            classNames?.handle,
          )}
        >
          <GripGlyph />
        </View>
      )}
      <View className={cn("min-w-0 flex-1", classNames?.content)}>
        {render({ handleProps, isDragging: dragging, index })}
      </View>
    </Animated.View>
  );
}

function GripGlyph() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="flex-row gap-1"
    >
      {[0, 1].map((column) => (
        <View key={column} className="gap-1">
          {[0, 1, 2].map((dot) => (
            <View key={dot} className="size-1 rounded-pill bg-fg-muted" />
          ))}
        </View>
      ))}
    </View>
  );
}
