import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { cn } from "./cn";
import { useMotion } from "./motion";
import { useSilentMisuse } from "./silent-misuse";
import { Text } from "./text";

const CLIP = { overflow: "hidden" } as const;

type AccordionRoot = { value: string[]; toggle: (item: string) => void };

const AccordionContext = createContext<AccordionRoot | null>(null);

function useOpenState(
  open: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange: ((open: boolean) => void) | undefined,
) {
  const [selfOpen, setSelfOpen] = useState(defaultOpen);
  const current = open ?? selfOpen;
  const toggle = () => {
    if (open === undefined) setSelfOpen(!current);
    onOpenChange?.(!current);
  };
  return [current, toggle] as const;
}
const GLYPH_BOX = { width: 20, height: 20, alignItems: "center", justifyContent: "center" } as const;

function Chevron({ open }: { open: boolean }) {
  const motion = useMotion();
  const turn = useSharedValue(open ? 1 : 0);

  useEffect(() => {
    turn.value = withTiming(open ? 1 : 0, motion.timing("base"));
  }, [open, motion, turn]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ rotate: `${turn.value * 180}deg` }] };
  });

  return (
    <Animated.View style={[GLYPH_BOX, style]}>
      <View className="-mt-1 size-2.5 rotate-45 border-r-2 border-b-2 border-fg-subtle" />
    </Animated.View>
  );
}

function Body({ open, children }: { open: boolean; children: ReactNode }) {
  const motion = useMotion();
  if (!open) return null;
  return (
    <Animated.View entering={motion.fadeIn} exiting={motion.fadeOut}>
      {children}
    </Animated.View>
  );
}

export type AccordionItemProps = {
  title: string;
  children: ReactNode;
  /**
   * O nome do item dentro do `value` da raiz. Com ele, quem decide o aberto e
   * o `Accordion`, e `defaultOpen` deixa de valer: use o `defaultValue` da
   * raiz. Sem ele, o item abre sozinho, como sempre abriu.
   */
  value?: string;
  /** O aberto na montagem, para item sem `value`. */
  defaultOpen?: boolean;
  className?: string;
};

export function AccordionItem({
  title,
  children,
  value,
  defaultOpen = false,
  className,
}: AccordionItemProps) {
  const root = useContext(AccordionContext);
  const [selfOpen, toggleSelf] = useOpenState(undefined, defaultOpen, undefined);
  const motion = useMotion();

  const managed = root !== null && value !== undefined;
  const open = managed ? root.value.includes(value) : selfOpen;
  const toggle = () => (managed ? root.toggle(value) : toggleSelf());

  useSilentMisuse(
    managed && defaultOpen,
    `AccordionItem "${title}": com \`value\`, quem abre o item é o Accordion, e \`defaultOpen\` não vale. ` +
      "Passe o valor no `defaultValue` da raiz.",
  );

  return (
    <Animated.View layout={motion.reflow} style={CLIP}>
      <View className={cn("border-b border-border", className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={toggle}
          className="min-h-12 flex-row items-center justify-between gap-3 py-3"
        >
          <Text className="flex-1 text-base font-rc-medium text-fg">{title}</Text>
          <Chevron open={open} />
        </Pressable>
        <Body open={open}>
          <View className="pb-4">{children}</View>
        </Body>
      </View>
    </Animated.View>
  );
}

export type AccordionProps = {
  children: ReactNode;
  className?: string;
  /**
   * Os itens abertos, pelo `value` de cada `AccordionItem`. Com ela a raiz e
   * controlada: abrir por link, lembrar o estado entre telas.
   */
  value?: string[];
  /** Os abertos na montagem, para quem nao controla. */
  defaultValue?: string[];
  /** Recebe a lista inteira de abertos a cada toque num item com `value`. */
  onValueChange?: (value: string[]) => void;
  /**
   * Deixa varios abertos ao mesmo tempo. Sem ela, abrir um fecha o outro, como
   * no web. Vale so entre itens com `value`.
   */
  multiple?: boolean;
};

export function Accordion({
  children,
  className,
  value,
  defaultValue,
  onValueChange,
  multiple = false,
}: AccordionProps) {
  const [selfValue, setSelfValue] = useState<string[]>(defaultValue ?? []);
  const current = value ?? selfValue;

  const toggle = (item: string) => {
    const next = current.includes(item)
      ? current.filter((other) => other !== item)
      : multiple
        ? [...current, item]
        : [item];
    if (value === undefined) setSelfValue(next);
    onValueChange?.(next);
  };

  return (
    <AccordionContext.Provider value={{ value: current, toggle }}>
      <View className={cn("border-t border-border", className)}>{children}</View>
    </AccordionContext.Provider>
  );
}

export type CollapsibleProps = {
  /** O rotulo do gatilho: "Ver os detalhes do calculo". */
  label: string;
  children: ReactNode;
  /** Deixa o aberto por conta de quem usa. Sem ela, a peca se controla. */
  open?: boolean;
  /** O aberto na montagem, para quem nao controla. */
  defaultOpen?: boolean;
  /** Avisa todo toque no gatilho, controlado ou nao. */
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export function Collapsible({
  label,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
}: CollapsibleProps) {
  const [open, toggle] = useOpenState(openProp, defaultOpen, onOpenChange);
  const motion = useMotion();

  return (
    <Animated.View layout={motion.reflow} style={CLIP}>
      <View className={cn(className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={toggle}
          className="min-h-11 flex-row items-center gap-2 py-2"
        >
          <Chevron open={open} />
          <Text className="text-sm font-rc-medium text-fg-muted">{label}</Text>
        </Pressable>
        <Body open={open}>
          <View className="pt-1">{children}</View>
        </Body>
      </View>
    </Animated.View>
  );
}
