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
   * The item's name within the root's `value`. With it, the `Accordion` decides
   * what is open, and `defaultOpen` no longer applies: use the root's
   * `defaultValue`. Without it, the item opens on its own, as it always did.
   */
  value?: string;
  /** Open on mount, for an item without `value`. */
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
    `AccordionItem "${title}": with \`value\`, the Accordion opens the item, and \`defaultOpen\` does not apply. ` +
      "Pass the value in the root's `defaultValue`.",
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
   * The open items, by the `value` of each `AccordionItem`. With it the root is
   * controlled: open from a link, remember the state across screens.
   */
  value?: string[];
  /** The items open on mount, for uncontrolled use. */
  defaultValue?: string[];
  /** Receives the whole list of open items on every tap on an item with `value`. */
  onValueChange?: (value: string[]) => void;
  /**
   * Lets several items stay open at once. Without it, opening one closes the
   * other, as on the web. Applies only among items with `value`.
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
  /** The trigger label: "Ver os detalhes do calculo". */
  label: string;
  children: ReactNode;
  /** Leaves the open state to the consumer. Without it, the component controls itself. */
  open?: boolean;
  /** Open on mount, for uncontrolled use. */
  defaultOpen?: boolean;
  /** Reports every tap on the trigger, controlled or not. */
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
