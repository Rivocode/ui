import type { ReactNode } from "react";
import { ActivityIndicator, type PressableProps } from "react-native";
import { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { AnimatedPressable, useMotion } from "./motion";
import { useRivo } from "./provider";
import { Text } from "./text";

const CONTAINER: Record<string, string> = {
  primary: "bg-accent active:bg-accent-active",
  secondary: "bg-surface border border-border-strong active:bg-surface-raised",
  ghost: "active:bg-accent-subtle",
  destructive: "bg-danger active:opacity-90",
};

const LABEL: Record<string, string> = {
  primary: "text-accent-fg",
  secondary: "text-fg",
  ghost: "text-fg-muted",
  destructive: "text-danger-fg",
};

const PRESSED_SCALE = 0.97;

const SPINNER_TOKEN: Record<string, keyof (typeof tokens.themes)["rivocode-dark"]> = {
  primary: "accent-fg",
  secondary: "fg",
  ghost: "fg-muted",
  destructive: "danger-fg",
};

function ButtonSpinner({ variant }: { variant: string }) {
  const { colors } = useRivo();
  const token = SPINNER_TOKEN[variant] ?? "fg";
  return (
    <ActivityIndicator
      accessibilityElementsHidden
      importantForAccessibility="no"
      size="small"
      color={colors[token]}
    />
  );
}

export type ButtonProps = Omit<PressableProps, "children"> & {
  children: ReactNode;
  variant?: keyof typeof CONTAINER;
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
  const motion = useMotion();
  const pressed = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ scale: 1 - (1 - PRESSED_SCALE) * pressed.value }] };
  });
  const scales = !motion.reduced && typeof style !== "function";
  const blocked = disabled || loading;
  const height = { sm: "h-8", md: "h-11", lg: "h-12" }[size];
  const pad = { sm: "px-3", md: "px-4", lg: "px-5" }[size];
  const hitSlop = size === "sm" ? { top: 6, bottom: 6, left: 0, right: 0 } : undefined;
  const text = { sm: "text-sm", md: "text-base", lg: "text-md" }[size];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...props}
      style={scales ? [pressStyle, style] : style}
      onPressIn={(event) => {
        if (scales) pressed.value = withTiming(1, motion.timing("fast"));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        if (scales) pressed.value = withTiming(0, motion.timing("base"));
        onPressOut?.(event);
      }}
      disabled={blocked}
      accessibilityState={{ disabled: Boolean(blocked), busy: loading }}
      hitSlop={hitSlop}
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-md",
        height,
        pad,
        CONTAINER[variant],
        blocked && "opacity-50",
        className,
      )}
    >
      {loading && <ButtonSpinner variant={variant} />}
      <Text className={cn("font-medium", text, LABEL[variant])}>{children}</Text>
    </AnimatedPressable>
  );
}
