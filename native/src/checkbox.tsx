import type { ReactNode } from "react";
import { Pressable, View, type PressableProps } from "react-native";

import { cn, type Slots } from "./cn";
import { Presence } from "./motion";
import { Text } from "./text";

type CheckboxName =
  | {
      /** The visible label. As on the web, tapping the text also checks it. */
      children: ReactNode;
      /**
       * The spoken name, required when there are no `children`. With text
       * beside it, replaces the name the screen reader reads.
       */
      label?: string;
    }
  | {
      children?: undefined;
      /**
       * The spoken name of a box with no text beside it - the one that checks a
       * list row. Required here: without it the screen reader reads "caixa de
       * selecao, marcado" and the person does not learn what they checked.
       */
      label: string;
    };

export type CheckboxProps = CheckboxName & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /**
   * The third state, that of the master box of a partly checked list: draws a
   * dash instead of the tick and announces `mixed`. It wins over `checked` in
   * the drawing, and the tap checks everything.
   */
  indeterminate?: boolean;
  /**
   * Touch area beyond the drawing. The box draws 20px, well below Apple's 44pt
   * and Android's 48dp, and whoever places it with no label beside it loses the
   * rest of the target the text provided.
   */
  hitSlop?: PressableProps["hitSlop"];
  className?: string;
  /**
   * Class per part: `box` (the drawn box), `indicator` (the tick or dash inside
   * it) and `label` (the text beside it).
   */
  classNames?: Slots<"box" | "indicator" | "label">;
};

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled,
  indeterminate = false,
  label,
  hitSlop,
  className,
  classNames,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: indeterminate ? "mixed" : checked, disabled }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={() => onCheckedChange(indeterminate ? true : !checked)}
      className={cn("flex-row items-center gap-2.5", disabled && "opacity-50", className)}
    >
      <View
        className={cn(
          "size-5 items-center justify-center rounded-sm border",
          filled ? "border-accent-text bg-accent-text" : "border-border-strong bg-surface",
          classNames?.box,
        )}
      >
        <Presence show={filled} swapKey={indeterminate ? "mixed" : "checked"} enter="popIn">
          {indeterminate ? (
            <View
              className={cn("h-0.5 w-2.5 rounded-pill bg-surface-raised", classNames?.indicator)}
            />
          ) : (
            <View
              className={cn(
                "mb-0.5 h-2 w-3 -rotate-45 border-b-2 border-l-2 border-surface-raised",
                classNames?.indicator,
              )}
            />
          )}
        </Presence>
      </View>
      {children && <Text className={cn("text-base text-fg", classNames?.label)}>{children}</Text>}
    </Pressable>
  );
}
