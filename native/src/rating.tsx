import type { ReactNode } from "react";
import { I18nManager, Pressable, View, type GestureResponderEvent } from "react-native";

import { cn, type Slots } from "./cn";
import { useRivo } from "./provider";
import { RATING_LABELS, starFill, type RatingLabels as RatingText } from "./shared/rating";
import { Text } from "./text";

const GLYPH = { sm: 18, md: 26, lg: 34 } as const;
const GLYPH_CLASS = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" } as const;
const TARGET = 44;

const HIDDEN = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type RatingProps = {
  /** The rating, controlled. `0` is none. */
  value: number;
  /**
   * Called with the new rating: by tapping a star or by the screen reader's
   * adjust gesture. Without it, the component only displays.
   */
  onValueChange?: (value: number) => void;
  /** How many stars. Default 5. */
  max?: number;
  /**
   * Accepts half stars: a tap on the reading-start half (the left, or the right
   * in rtl) gives `n - 0.5`, and the adjust moves in halves.
   */
  allowHalf?: boolean;
  /** Tapping the chosen rating again resets it to zero. Off by default. */
  clearable?: boolean;
  /**
   * Only displays: a product's average. Accepts any fraction and comes out as a
   * single image for the screen reader, named "4,3 de 5".
   */
  readOnly?: boolean;
  /** Turns off choosing. The whole layer fades, as everywhere in the native package. */
  disabled?: boolean;
  /**
   * The drawing size. Each star's touch target is always 44pt: `sm` only
   * shrinks the drawing, not the target.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Replaces the star. The function receives the color already resolved from
   * the theme, the size and whether that layer is the full or the empty one:
   * `icon={({ color, size }) => <Heart color={color} fill={color} size={size}
   * />}`.
   */
  icon?: (glyph: { color: string; size: number; filled: boolean }) => ReactNode;
  /**
   * The texts the screen reader hears: the group name, the name of each rating
   * and of the average, and `increment` and `decrement`, the names of the two
   * adjust actions.
   */
  labels?: Partial<RatingLabels>;
  className?: string;
  /**
   * Class per part: `item` (each star's box), `empty` and `filled` (the empty
   * and full star). The last two style the house star; with `icon`, the color
   * arrives through the function.
   */
  classNames?: Slots<"item" | "empty" | "filled">;
};

export type RatingLabels = RatingText & {
  increment: string;
  decrement: string;
};

const LABELS: RatingLabels = { ...RATING_LABELS, increment: "Aumentar", decrement: "Diminuir" };

export function Rating({
  value,
  onValueChange,
  max = 5,
  allowHalf = false,
  clearable = false,
  readOnly = false,
  disabled = false,
  size = "md",
  icon,
  labels,
  className,
  classNames,
}: RatingProps) {
  const { colors } = useRivo();
  const text = { ...LABELS, ...labels };
  const step = allowHalf ? 0.5 : 1;
  const shown = readOnly ? Math.min(max, Math.max(0, value)) : Math.round(value / step) * step;
  const interactive = !readOnly && !disabled && onValueChange !== undefined;
  const box = readOnly ? GLYPH[size] : TARGET;
  const rtl = I18nManager.getConstants().isRTL;

  const commit = (next: number) => {
    const bounded = Math.min(max, Math.max(0, next));
    if (bounded !== shown) onValueChange?.(bounded);
  };

  const press = (index: number, event: GestureResponderEvent) => {
    if (!interactive) return;
    const x = event.nativeEvent.locationX;
    const first = allowHalf && (rtl ? x > box / 2 : x < box / 2);
    const option = first ? index + 0.5 : index + 1;
    commit(clearable && option === shown ? 0 : option);
  };

  const layer = (filled: boolean) => {
    if (icon)
      return icon({
        color: colors[filled ? "warning" : "border-strong"],
        size: GLYPH[size],
        filled,
      });
    return (
      <Text
        className={cn(
          GLYPH_CLASS[size],
          filled ? "text-warning" : "text-border-strong",
          filled ? classNames?.filled : classNames?.empty,
        )}
      >
        ★
      </Text>
    );
  };

  const stars = Array.from({ length: max }, (_, index) => {
    const fill = starFill(shown, index);
    const drawing = (
      <View
        {...HIDDEN}
        pointerEvents="none"
        testID="rating-star"
        className={cn("items-center justify-center", classNames?.item)}
        style={{ width: box, height: box }}
      >
        {layer(false)}
        <View
          testID="rating-fill"
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ start: 0, width: box * fill }}
        >
          <View className="items-center justify-center" style={{ width: box, height: box }}>
            {layer(true)}
          </View>
        </View>
      </View>
    );

    if (!interactive) return <View key={index}>{drawing}</View>;

    return (
      <Pressable key={index} {...HIDDEN} onPress={(event) => press(index, event)}>
        {drawing}
      </Pressable>
    );
  });

  if (readOnly) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={text.value(shown, max)}
        className={cn("flex-row items-center self-start", className)}
      >
        {stars}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={text.group}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max, now: shown, text: text.item(shown) }}
      accessibilityActions={
        interactive
          ? [
              { name: "increment", label: text.increment },
              { name: "decrement", label: text.decrement },
            ]
          : undefined
      }
      onAccessibilityAction={(event) => {
        if (!interactive) return;
        const delta = event.nativeEvent.actionName === "increment" ? step : -step;
        commit(Math.max(step, shown + delta));
      }}
      className={cn("flex-row items-center self-start", disabled && "opacity-50", className)}
    >
      {stars}
    </View>
  );
}
