import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type ItemProps = {
  /** The text that names the row. Truncates with an ellipsis, never wraps into two lines. */
  title: string;
  /** The second, smaller line: the complement that fits. It also truncates. */
  description?: string;
  /** The left corner: `Avatar`, icon, thumbnail. */
  media?: ReactNode;
  /** The right corner: value, `Badge`, `Button`, `Indicator`. */
  actions?: ReactNode;
  /** `plain` for a list inside a card or sheet; `outline` for a grid of choices. */
  variant?: "plain" | "outline";
  /**
   * Tap and go. Inside a `DataList` with `onRowPress`, do NOT pass this:
   * `DataList` already wraps each row, and a `Pressable` inside another holds
   * the touch in the inner one - the row would respond here and never there.
   */
  onPress?: () => void;
  /**
   * What the screen reader announces on the row. By default, the title and
   * description in one sentence.
   */
  accessibilityLabel?: string;
  className?: string;
};

export function Item({
  title,
  description,
  media,
  actions,
  variant = "plain",
  onPress,
  accessibilityLabel,
  className,
}: ItemProps) {
  const label = accessibilityLabel ?? [title, description].filter(Boolean).join(", ");

  const body = (
    <>
      {media !== undefined && <View className="shrink-0">{media}</View>}

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base text-fg">
          {title}
        </Text>
        {description !== undefined && (
          <Text numberOfLines={1} className="text-sm text-fg-muted">
            {description}
          </Text>
        )}
      </View>
    </>
  );

  const frame = cn(
    "w-full flex-row items-center gap-3",
    variant === "outline" ? "rounded-lg border border-border bg-surface p-3" : "px-1 py-2",
    onPress !== undefined && "min-h-11",
    className,
  );

  if (onPress !== undefined && actions === undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={cn(frame, "active:bg-selected")}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View className={frame}>
      {onPress !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          className="-my-1 flex-1 flex-row items-center gap-3 rounded-md py-1 active:bg-selected"
        >
          {body}
        </Pressable>
      ) : (
        <View className="flex-1 flex-row items-center gap-3">{body}</View>
      )}

      {actions !== undefined && (
        <View className="shrink-0 flex-row items-center gap-2">{actions}</View>
      )}
    </View>
  );
}
