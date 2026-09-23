import { useEffect, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { cn } from "./cn";
import { useMotion } from "./motion";
import { Text } from "./text";

const CLIP = { overflow: "hidden" } as const;
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
  defaultOpen?: boolean;
  className?: string;
};

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  className,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const motion = useMotion();

  return (
    <Animated.View layout={motion.reflow} style={CLIP}>
      <View className={cn("border-b border-border", className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          className="min-h-12 flex-row items-center justify-between gap-3 py-3"
        >
          <Text className="flex-1 text-base font-medium text-fg">{title}</Text>
          <Chevron open={open} />
        </Pressable>
        <Body open={open}>
          <View className="pb-4">{children}</View>
        </Body>
      </View>
    </Animated.View>
  );
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={cn("border-t border-border", className)}>{children}</View>;
}

export type CollapsibleProps = {
  /** O rotulo do gatilho: "Ver os detalhes do calculo". */
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function Collapsible({ label, children, defaultOpen = false, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const motion = useMotion();

  return (
    <Animated.View layout={motion.reflow} style={CLIP}>
      <View className={cn(className)}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen(!open)}
          className="min-h-11 flex-row items-center gap-2 py-2"
        >
          <Chevron open={open} />
          <Text className="text-sm font-medium text-fg-muted">{label}</Text>
        </Pressable>
        <Body open={open}>
          <View className="pt-1">{children}</View>
        </Body>
      </View>
    </Animated.View>
  );
}
