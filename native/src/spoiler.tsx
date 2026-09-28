import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { cn, type Slots } from "./cn";
import { useMotion } from "./motion";
import { useRivo } from "./provider";
import { SPOILER_CLIPPED, SPOILER_HEIGHT, SPOILER_LESS, SPOILER_MORE } from "./shared/spoiler";
import { Text } from "./text";

const FADE = 40;
const BANDS = 8;

export type SpoilerProps = {
  /** The long content. */
  children: ReactNode;
  /**
   * The collapsed height, in points. Below it the button does not even appear;
   * above it, the content is cut here and the last 40 points fade out.
   */
  maxHeight?: number;
  /** Open, for controlled use. Without it, the component keeps its own state. */
  open?: boolean;
  /** Open on first paint, uncontrolled. The same name as the web. */
  defaultOpen?: boolean;
  /** Receives the new state on every tap on "Ler mais" and "Ler menos". */
  onOpenChange?: (open: boolean) => void;
  /** The button texts, the same as the web. */
  labels?: { more?: string; less?: string };
  /**
   * The background the block sits on, for the fade to blend into it: on the
   * phone there is no mask, and the fade is painted in the background color.
   * Default: `bg`.
   */
  fadeOver?: "bg" | "surface" | "surface-raised";
  className?: string;
  /** Class per part: `content` (the clipping box) and `trigger` (the button). */
  classNames?: Slots<"content" | "trigger">;
};

export function Spoiler({
  children,
  maxHeight = SPOILER_HEIGHT,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  labels = {},
  fadeOver = "bg",
  className,
  classNames,
}: SpoilerProps) {
  const motion = useMotion();
  const { colors } = useRivo();
  const [own, setOwn] = useState(defaultOpen);
  const [full, setFull] = useState(0);
  const open = openProp ?? own;
  const overflowing = full > maxHeight + 1;
  const clipped = overflowing && !open;

  function change(next: boolean) {
    if (openProp === undefined) setOwn(next);
    onOpenChange?.(next);
  }

  return (
    <View className={cn("items-start gap-1", className)}>
      <Animated.View
        layout={motion.reflow}
        className={cn("w-full", classNames?.content)}
        style={{ maxHeight: clipped ? maxHeight : undefined, overflow: "hidden" }}
      >
        <View
          accessible={clipped}
          accessibilityHint={clipped ? SPOILER_CLIPPED : undefined}
          onLayout={(event) => setFull(event.nativeEvent.layout.height)}
        >
          {children}
        </View>
        {clipped ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            className="absolute inset-x-0 bottom-0"
            style={{ height: FADE }}
          >
            {Array.from({ length: BANDS }, (_, band) => (
              <View
                key={band}
                style={{
                  flex: 1,
                  backgroundColor: colors[fadeOver],
                  opacity: (band + 1) / (BANDS + 1),
                }}
              />
            ))}
          </View>
        ) : null}
      </Animated.View>

      {overflowing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => change(!open)}
          hitSlop={8}
          className={cn("min-h-11 justify-center", classNames?.trigger)}
        >
          <Text className="text-sm font-rc-medium text-accent-text">
            {open ? (labels.less ?? SPOILER_LESS) : (labels.more ?? SPOILER_MORE)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
