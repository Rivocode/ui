import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated from "react-native-reanimated";

import { Button } from "./button";
import { cn, type Slots } from "./cn";
import { useMotion } from "./motion";
import {
  BATCH_ACTIONS,
  CLEAR_SELECTION,
  SELECTION_CLEARED,
  selectedLabel,
} from "./shared/selection";
import { Text } from "./text";

const GAP = 16;

export type ActionBarProps = {
  /** How many items are selected. Above zero the bar comes in; at zero it leaves. */
  count: number;
  /** The batch actions, after the count. Use `Button` `size="sm"`. */
  children?: ReactNode;
  /** Turns on "Limpar seleção". The caller is the one who clears the selection. */
  onClear?: () => void;
  /**
   * The height of the bottom safe area, in points:
   * `useSafeAreaInsets().bottom`. The bar sits 16 points above it.
   */
  bottomInset?: number;
  /** The same texts as the web: `selected` receives the count and returns the sentence. */
  labels?: {
    selected?: (count: number) => string;
    clear?: string;
    region?: string;
    cleared?: string;
  };
  /** Styles the bar panel, the same element as `classNames.bar`. */
  className?: string;
  /**
   * Class per part: `bar` (the panel), `count` (the count sentence) and `clear`
   * (the clear button).
   */
  classNames?: Slots<"bar" | "count" | "clear">;
};

export function ActionBar({
  count,
  children,
  onClear,
  bottomInset = 0,
  labels = {},
  className,
  classNames,
}: ActionBarProps) {
  const motion = useMotion();
  const open = count > 0;
  const say = labels.selected ?? selectedLabel;
  const sentence = open ? say(count) : "";
  const cleared = labels.cleared ?? SELECTION_CLEARED;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      AccessibilityInfo.announceForAccessibility(sentence);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      AccessibilityInfo.announceForAccessibility(cleared);
    }
  }, [open, sentence, cleared]);

  if (!open) return null;

  return (
    <Animated.View
      entering={motion.riseIn}
      exiting={motion.sinkOut}
      className="absolute inset-x-4"
      style={{ bottom: GAP + bottomInset, pointerEvents: "box-none" }}
    >
      <View
        accessibilityLabel={labels.region ?? BATCH_ACTIONS}
        className={cn(
          "flex-row flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2",
          className,
          classNames?.bar,
        )}
      >
        <Text className={cn("px-1 text-sm font-rc-medium text-fg", classNames?.count)}>
          {sentence}
        </Text>
        {children}
        {onClear ? (
          <Button size="sm" variant="ghost" onPress={onClear} className={cn("ml-auto", classNames?.clear)}>
            {labels.clear ?? CLEAR_SELECTION}
          </Button>
        ) : null}
      </View>
    </Animated.View>
  );
}
