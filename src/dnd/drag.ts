import {
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DraggableAttributes,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, type useSortable } from "@dnd-kit/sortable";
import {
  useRef,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

import { useMediaQuery } from "../lib/screen";

export type SortableHandleProps = DraggableAttributes & {
  ref: (element: HTMLElement | null) => void;
  onPointerDown?: (event: PointerEvent) => void;
  onMouseDown?: (event: MouseEvent) => void;
  onTouchStart?: (event: TouchEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
};

export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const HOLD = { delay: 250, tolerance: 5 };

export function useDragSensors(hold: boolean) {
  const reduced = useMediaQuery(REDUCED_MOTION);
  const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 4 } });
  const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 4 } });
  const touch = useSensor(TouchSensor, { activationConstraint: HOLD });
  const keyboard = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
    scrollBehavior: reduced ? "auto" : "smooth",
  });
  return useSensors(hold ? mouse : pointer, hold ? touch : null, keyboard);
}

export const SLIDING = "transition-transform duration-spatial ease-rc-spatial";

export type TokenMotion = { duration: number; easing: string };

export function readMotion(element: Element | null, reduced: boolean): TokenMotion | null {
  if (!element || reduced) return null;
  const style = getComputedStyle(element);
  const raw = style.getPropertyValue("--rc-duration-spatial").trim();
  const value = Number.parseFloat(raw);
  const duration = !Number.isFinite(value) ? 0 : raw.endsWith("ms") ? value : value * 1000;
  const easing = style.getPropertyValue("--rc-ease-spatial").trim();
  return duration > 0 && easing ? { duration, easing } : null;
}

type Sortable = ReturnType<typeof useSortable>;

export function handlePropsOf(sortable: Sortable): SortableHandleProps {
  return {
    ...sortable.attributes,
    ...(sortable.listeners as Pick<
      SortableHandleProps,
      "onPointerDown" | "onMouseDown" | "onTouchStart" | "onKeyDown"
    >),
    ref: sortable.setActivatorNodeRef,
  };
}

export function transformOf(transform: Sortable["transform"]): string | undefined {
  if (!transform) return undefined;
  return `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`;
}

export function useAnnouncer() {
  const speech = useRef<string | undefined>(undefined);
  const take = () => {
    const text = speech.current;
    speech.current = undefined;
    return text;
  };
  return {
    say: (text: string) => {
      speech.current = text;
    },
    announcements: { onDragStart: take, onDragOver: take, onDragEnd: take, onDragCancel: take },
  };
}
