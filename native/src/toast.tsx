import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { announce, spokenSentence } from "./announce";
import { cn } from "./cn";
import { useMotion } from "./motion";
import { Text } from "./text";

export type ToastOptions = {
  /** Reusar um `id` que ainda esta na tela reescreve aquele aviso e reinicia a contagem. */
  id?: string;
  title?: string;
  description?: string;
  /**
   * O tom, no vocabulario do `Alert`: `info`, `success`, `warning` e `danger`
   * (`error` vale como `danger`). Sem ele o aviso sai neutro. `loading` fica
   * na tela ate um `update` trocar o tipo.
   */
  type?: string;
  /** Quanto tempo o aviso fica, em ms. `0` deixa na tela ate um `close`. Sem ele, 4000. */
  timeout?: number;
  /** `high` anuncia com urgencia. */
  priority?: "low" | "high";
  /** Chamado quando o aviso sai, pela contagem ou por `close`. */
  onClose?: () => void;
};

export type ToastUpdate = Omit<ToastOptions, "id">;

type ToastState = ToastUpdate & { id: string };

type Phase<Value> = string | ToastUpdate | ((value: Value) => string | ToastUpdate);

export type ToastPromiseStates<Value> = {
  loading: string | ToastUpdate;
  success: Phase<Value>;
  error: Phase<unknown>;
};

export type ToastApi = {
  add: (options: ToastOptions) => string;
  update: (id: string, options: ToastUpdate | ((previous: ToastState) => ToastUpdate)) => void;
  close: (id?: string) => void;
  promise: <Value>(promise: Promise<Value>, states: ToastPromiseStates<Value>) => Promise<Value>;
};

const DEFAULT_TIMEOUT = 4000;

const TONE: Record<string, { box: string; title: string }> = {
  info: { box: "border-info bg-info-subtle", title: "text-info-text" },
  success: { box: "border-success bg-success-subtle", title: "text-success-text" },
  warning: { box: "border-warning bg-warning-subtle", title: "text-warning-text" },
  danger: { box: "border-danger bg-danger-subtle", title: "text-danger-text" },
  error: { box: "border-danger bg-danger-subtle", title: "text-danger-text" },
};

const NEUTRAL = { box: "border-border bg-surface-raised", title: "text-fg" };

const resolvePhase = <Value,>(phase: Phase<Value>, value?: Value): ToastUpdate => {
  const resolved = typeof phase === "function" ? phase(value as Value) : phase;
  return typeof resolved === "string" ? { description: resolved } : resolved;
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast precisa de um RivoProvider acima.");
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const listRef = useRef<ToastState[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  useEffect(() => {
    const running = timers.current;
    return () => {
      running.forEach((timer) => clearTimeout(timer));
      running.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(() => {
    const commit = (next: ToastState[]) => {
      listRef.current = next;
      setToasts(next);
    };

    const clearTimer = (id: string) => {
      const timer = timers.current.get(id);
      if (timer !== undefined) clearTimeout(timer);
      timers.current.delete(id);
    };

    const speak = (toast: ToastState) => {
      if (!toast.title && !toast.description) return;
      announce(spokenSentence(toast.title ?? "", toast.description), { liveRegion: true });
    };

    const close = (id?: string) => {
      const leaving = listRef.current.filter((toast) => id === undefined || toast.id === id);
      if (leaving.length === 0) return;
      for (const toast of leaving) clearTimer(toast.id);
      commit(listRef.current.filter((toast) => !leaving.includes(toast)));
      for (const toast of leaving) toast.onClose?.();
    };

    const schedule = (toast: ToastState, force: boolean) => {
      const wait = toast.timeout ?? DEFAULT_TIMEOUT;
      const wanted = toast.type !== "loading" && wait > 0;
      if (!wanted) {
        clearTimer(toast.id);
        return;
      }
      if (!force && timers.current.has(toast.id)) return;
      clearTimer(toast.id);
      timers.current.set(
        toast.id,
        setTimeout(() => close(toast.id), wait),
      );
    };

    const update: ToastApi["update"] = (id, options) => {
      const previous = listRef.current.find((toast) => toast.id === id);
      if (!previous) return;
      const changes = typeof options === "function" ? options(previous) : options;
      const next: ToastState = { ...previous, ...changes, id };
      commit(listRef.current.map((toast) => (toast.id === id ? next : toast)));
      schedule(
        next,
        Object.prototype.hasOwnProperty.call(changes, "timeout") || previous.type === "loading",
      );
      if (next.title !== previous.title || next.description !== previous.description) speak(next);
    };

    const add: ToastApi["add"] = (options) => {
      const { id: asked, ...rest } = options;
      if (asked !== undefined && listRef.current.some((toast) => toast.id === asked)) {
        const previous = listRef.current.find((toast) => toast.id === asked)!;
        const next: ToastState = { ...previous, ...rest, id: asked };
        commit(listRef.current.map((toast) => (toast.id === asked ? next : toast)));
        schedule(next, true);
        speak(next);
        return asked;
      }
      const id = asked ?? `rc-toast-${nextId.current++}`;
      const toast: ToastState = { ...rest, id };
      commit([...listRef.current, toast]);
      schedule(toast, true);
      speak(toast);
      return id;
    };

    const promise: ToastApi["promise"] = (pending, states) => {
      const id = add({ ...resolvePhase(states.loading), type: "loading" });
      return pending.then(
        (result) => {
          const done = resolvePhase(states.success, result);
          update(id, { ...done, type: "success", timeout: done.timeout });
          return result;
        },
        (error: unknown) => {
          const failed = resolvePhase(states.error, error);
          update(id, { ...failed, type: "error", timeout: failed.timeout });
          throw error;
        },
      );
    };

    return { add, update, close, promise };
  }, []);

  const motion = useMotion();

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toasts.length > 0 && (
        <Animated.View
          exiting={motion.sinkOut}
          pointerEvents="none"
          className="absolute inset-x-4 bottom-10 gap-2"
        >
          {toasts.map((toast) => {
            const tone = (toast.type && TONE[toast.type]) || NEUTRAL;
            return (
              <Animated.View
                key={toast.id}
                entering={motion.riseIn}
                exiting={motion.sinkOut}
                layout={motion.reflow}
              >
                <View
                  accessibilityLiveRegion={toast.priority === "high" ? "assertive" : "polite"}
                  className={cn("rounded-md border px-4 py-3", tone.box)}
                >
                  {toast.title ? (
                    <Text className={cn("text-sm font-rc-medium", tone.title)}>{toast.title}</Text>
                  ) : null}
                  {toast.description ? (
                    <Text className={cn("text-xs text-fg-muted", toast.title && "mt-0.5")}>
                      {toast.description}
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
            );
          })}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
