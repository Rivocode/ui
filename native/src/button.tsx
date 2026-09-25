import type { ReactNode } from "react";
import { ActivityIndicator, type PressableProps } from "react-native";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { AnimatedPressable, usePressScale } from "./motion";
import { useRivo } from "./provider";
import { Text } from "./text";

export const BUTTON_CONTAINER = {
  primary: "bg-accent active:bg-accent-active",
  secondary: "bg-surface border border-border-strong active:bg-surface-raised",
  ghost: "active:bg-accent-subtle",
  outline: "border-2 border-border-strong active:bg-accent-subtle",
  danger: "bg-danger active:opacity-90",
} satisfies Record<string, string>;

export type ButtonVariant = keyof typeof BUTTON_CONTAINER;

export const BUTTON_LABEL: Record<ButtonVariant, string> = {
  primary: "text-accent-fg",
  secondary: "text-fg",
  ghost: "text-fg-muted",
  outline: "text-fg",
  danger: "text-danger-fg",
};

export const BUTTON_INK: Record<ButtonVariant, keyof (typeof tokens.themes)["rivocode-dark"]> = {
  primary: "accent-fg",
  secondary: "fg",
  ghost: "fg-muted",
  outline: "fg",
  danger: "danger-fg",
};

export function ButtonSpinner({ variant }: { variant: ButtonVariant }) {
  const { colors } = useRivo();
  const token = BUTTON_INK[variant] ?? "fg";
  return (
    <ActivityIndicator
      accessibilityElementsHidden
      importantForAccessibility="no"
      size="small"
      color={colors[token]}
    />
  );
}

export type ButtonProps = Omit<PressableProps, "children" | "className"> & {
  children: ReactNode;
  /**
   * O desenho do botao, com os nomes do web. `outline` e so a borda grossa, sem
   * fundo: a acao que fica ao lado da principal sem competir com ela.
   */
  variant?: keyof typeof BUTTON_CONTAINER;
  size?: "sm" | "md" | "lg";
  /** Em espera: nao aceita toque e anuncia `busy`. O mesmo nome do web. */
  loading?: boolean;
};

export function Button({
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
}: ButtonProps & { className?: string }) {
  const press = usePressScale({ style, onPressIn, onPressOut });
  const blocked = disabled || loading;
  const height = { sm: "h-8", md: "h-11", lg: "h-12" }[size];
  const pad = { sm: "px-3", md: "px-4", lg: "px-5" }[size];
  const hitSlop = size === "sm" ? { top: 6, bottom: 6, left: 0, right: 0 } : undefined;
  const text = { sm: "text-sm", md: "text-base", lg: "text-md" }[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...props}
      {...press}
      disabled={blocked}
      accessibilityState={{ disabled: Boolean(blocked), busy: loading }}
      hitSlop={hitSlop}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        height,
        pad,
        BUTTON_CONTAINER[variant],
        blocked && "opacity-50",
        className,
      )}
    >
      {loading && <ButtonSpinner variant={variant} />}
      <Text className={cn("font-rc-medium", text, BUTTON_LABEL[variant])}>{children}</Text>
    </AnimatedPressable>
  );
}
