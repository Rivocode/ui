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
   * The gesture and the screen reader actions that turn a `View` into the
   * handle. Spread them on a `View` of your own when `handle` is `false`; with
   * the component's handle on, it has already received all of this.
   */
  handleProps: SortableHandleProps;
  /** The item is under the finger right now. */
  isDragging: boolean;
  /** The item's position in the list, counting from zero. */
  index: number;
};

export type SortableListMove = {
  /** The key of the item that moved, the same one `getKey` returned. */
  key: string | number;
  /** Where it came from, counting from zero. */
  from: number;
  /** Where it stopped, counting from zero. */
  to: number;
};

export type NativeSortableListLabels = SortableListLabels & {
  earlier: string;
  later: string;
};

export type SortableListProps<Item> = {
  /**
   * The items, in the current order. The component is controlled: the new order
   * comes back through `onReorder`.
   */
  items: readonly Item[];
  /** Each item's identity. It must be unique and cannot change when the item moves. */
  getKey: (item: Item) => string | number;
  /** How each item is drawn. */
  renderItem: (item: Item, state: SortableItemState) => ReactNode;
  /**
   * The new order, already assembled, on dropping in a place different from
   * where the item came from, or on each screen reader move action.
   */
  onReorder: (items: Item[], move: SortableListMove) => void;
  /**
   * The item's name in the announcements and in the handle's name: "Nota 1043".
   * Without it, the key is used.
   */
  getLabel?: (item: Item) => string;
  /**
   * Draws the 44pt handle at the start of each item, and only it drags: the
   * rest of the row keeps scrolling the screen. With `false`, the drag comes
   * from the `View` where you spread `handleProps`.
   */
  handle?: boolean;
  /** The list axis. Changes the gesture, the offset and the names of the move actions. */
  orientation?: "vertical" | "horizontal";
  /** Locks the gesture and the move actions. */
  disabled?: boolean;
  /**
   * The texts of the announcements, the handle's name, the hint and the two
   * move actions (`earlier` and `later`), for another language.
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
