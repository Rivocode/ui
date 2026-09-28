import type { ReactNode } from "react";
import { View, type PressableProps } from "react-native";

import { BUTTON_CONTAINER, BUTTON_INK, ButtonSpinner } from "./button";
import { cn } from "./cn";
import { AnimatedPressable, usePressScale } from "./motion";
import { useRivo } from "./provider";

const TARGET = 44;

const SQUARE = { sm: "size-8", md: "size-11", lg: "size-12" } as const;
const SIDE = { sm: 32, md: 44, lg: 48 } as const;
const GLYPH = { sm: 16, md: 16, lg: 20 } as const;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type IconButtonProps = Omit<PressableProps, "children" | "accessibilityLabel" | "className"> & {
  /**
   * The icon. Color does not flow down from the `View` to the SVG, so the form
   * that paints itself is the function: it receives the variant color and the
   * square size - `{({ color, size }) => <Trash2 color={color} size={size}
   * />}`.
   */
  children: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /** The `Button` variants, read from the same classes. */
  variant?: keyof typeof BUTTON_CONTAINER;
  /**
   * The square side: 32, 44 or 48. `sm` gets `hitSlop` up to 44, because the
   * touch target does not shrink with the drawing.
   */
  size?: "sm" | "md" | "lg";
  /** Waiting: swaps the icon for the spinner, does not accept touch and announces `busy`. */
  loading?: boolean;
  /**
   * The button name, required: it is what the screen reader announces, and the
   * button has no other text. The same name as the web. Say the action
   * ("Excluir nota"), not the drawing.
   */
  label: string;
  className?: string;
};

export function IconButton({
  label,
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  style,
  onPressIn,
  onPressOut,
  ...props
}: IconButtonProps) {
  const { colors } = useRivo();
  const press = usePressScale({ style, onPressIn, onPressOut });
  const blocked = disabled || loading;
  const slop = Math.max(0, (TARGET - SIDE[size]) / 2);
  const hitSlop = slop > 0 ? { top: slop, bottom: slop, left: slop, right: slop } : undefined;
  const color = colors[BUTTON_INK[variant] ?? "fg"];
  const glyph = typeof children === "function" ? children({ color, size: GLYPH[size] }) : children;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      hitSlop={hitSlop}
      {...props}
      accessibilityLabel={label}
      {...press}
      disabled={blocked}
      accessibilityState={{ disabled: Boolean(blocked), busy: loading }}
      className={cn(
        "items-center justify-center rounded-md",
        SQUARE[size],
        BUTTON_CONTAINER[variant],
        blocked && "opacity-50",
        className,
      )}
    >
      {loading ? <ButtonSpinner variant={variant} /> : <View {...HIDDEN}>{glyph}</View>}
    </AnimatedPressable>
  );
}
