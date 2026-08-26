import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

const TONE: Record<string, { box: string; label: string }> = {
  neutral: { box: "bg-surface-raised border border-border", label: "text-fg-muted" },
  accent: { box: "bg-accent-subtle", label: "text-accent-text" },
  success: { box: "bg-success-subtle", label: "text-success-text" },
  warning: { box: "bg-warning-subtle", label: "text-warning-text" },
  danger: { box: "bg-danger-subtle", label: "text-danger-text" },
  info: { box: "bg-info-subtle", label: "text-info-text" },
};

export type BadgeProps = {
  children: ReactNode;
  tone?: keyof typeof TONE;
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const styles = TONE[tone];
  return (
    <View className={cn("self-start rounded-pill px-2.5 py-0.5", styles.box, className)}>
      <Text className={`text-xs font-medium ${styles.label}`}>{children}</Text>
    </View>
  );
}
