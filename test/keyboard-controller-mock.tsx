import { createContext, createElement, useEffect, useReducer, useRef, type ReactNode } from "react";

type KeyboardEvent = { height: number; progress: number; duration: number; target: number };
type Handler = {
  onStart?: (event: KeyboardEvent) => void;
  onMove?: (event: KeyboardEvent) => void;
  onInteractive?: (event: KeyboardEvent) => void;
  onEnd?: (event: KeyboardEvent) => void;
};

const listeners = new Set<() => void>();
let heightNow = 0;
let progressNow = 0;

const shared = (read: () => number, write: (next: number) => void) => ({
  _isReanimatedSharedValue: true,
  get value() {
    return read();
  },
  set value(next: number) {
    write(next);
    for (const listener of listeners) listener();
  },
});

const height = shared(
  () => heightNow,
  (next) => {
    heightNow = next;
  },
);
const progress = shared(
  () => progressNow,
  (next) => {
    progressNow = next;
  },
);

type Value = { value: number; _isReanimatedSharedValue?: boolean };

const plain = (value: number): Value => ({ value });

export const KeyboardContext = createContext<{
  enabled: boolean;
  reanimated: { height: Value; progress: Value };
}>({
  enabled: true,
  reanimated: { height: plain(0), progress: plain(0) },
});

const REAL = { enabled: true, reanimated: { height, progress } };

let mounted = 0;

export function KeyboardProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    mounted += 1;
    return () => {
      mounted -= 1;
    };
  }, []);
  return createElement(KeyboardContext.Provider, { value: REAL }, children);
}

export function useReanimatedKeyboardAnimation() {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);
  return { height, progress };
}

const handlers = new Set<{ current: Handler }>();

export function useKeyboardHandler(handler: Handler) {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const entry = latest;
    handlers.add(entry);
    return () => {
      handlers.delete(entry);
    };
  }, []);
}

const event = (to: number): KeyboardEvent => ({
  height: to,
  progress: to > 0 ? 1 : 0,
  duration: 250,
  target: 1,
});

function fire(phase: keyof Handler, to: number) {
  for (const entry of handlers) entry.current[phase]?.(event(to));
}

export const keyboard = {
  get providers() {
    return mounted;
  },
  get listening() {
    return handlers.size;
  },
  start(to: number) {
    fire("onStart", to);
  },
  frame(at: number, to: number) {
    height.value = -at;
    progress.value = to === 0 ? 0 : at / to;
    fire("onMove", at);
  },
  end(to: number) {
    height.value = -to;
    progress.value = to > 0 ? 1 : 0;
    fire("onEnd", to);
  },
  reset() {
    heightNow = 0;
    progressNow = 0;
  },
};

const host = (name: string) => {
  const Component = (props: Record<string, unknown>) => createElement(name, props);
  Component.displayName = name;
  return Component;
};

export const KeyboardAwareScrollView = host("KeyboardAwareScrollView");
export const KeyboardStickyView = host("KeyboardStickyView");
