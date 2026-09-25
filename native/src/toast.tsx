import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";

import { useMotion } from "./motion";
import { Text } from "./text";

type ToastData = { id: number; title: string; description?: string };

type ToastContextValue = {
  add: (toast: { title: string; description?: string }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast precisa de um RivoProvider acima.");
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);

  const add = useCallback((toast: { title: string; description?: string }) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, ...toast }]);
    setTimeout(() => {
      setToasts((current) => current.filter((other) => other.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ add }), [add]);
  const motion = useMotion();

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <Animated.View
          exiting={motion.sinkOut}
          pointerEvents="none"
          className="absolute inset-x-4 bottom-10 gap-2"
        >
          {toasts.map((toast) => (
            <Animated.View
              key={toast.id}
              entering={motion.riseIn}
              exiting={motion.sinkOut}
              layout={motion.reflow}
            >
              <View
                accessibilityLiveRegion="polite"
                className="rounded-md border border-border bg-surface-raised px-4 py-3"
              >
                <Text className="text-sm font-rc-medium text-fg">{toast.title}</Text>
                {toast.description && (
                  <Text className="mt-0.5 text-xs text-fg-muted">{toast.description}</Text>
                )}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
