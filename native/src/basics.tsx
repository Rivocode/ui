import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { tokens } from "../tokens";
import { cn } from "./cn";
import { useRivo } from "./provider";

/* ---------------------------------------------------------------------------
 * As pecas pequenas que traduzem direto: separador, espera, progresso,
 * avatar e o aviso que fica na tela. Cada uma e um arquivo no web; aqui
 * dividem um, porque nenhuma passa de trinta linhas.
 * ------------------------------------------------------------------------- */

export function Separator({ className }: { className?: string }) {
  return <View accessibilityRole="none" className={`h-px bg-border ${className ?? ""}`} />;
}

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  const { theme } = useRivo();
  return (
    <ActivityIndicator
      accessibilityLabel="Carregando"
      size={size}
      color={tokens.themes[theme]["fg-subtle"]}
    />
  );
}

export type ProgressProps = {
  /** 0 a 100. O Progress anda para o fim e termina; quanto-de-capacidade e Meter. */
  value: number;
  label: string;
  className?: string;
};

export function Progress({ value, label, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", className)}
    >
      <View className="h-full rounded-pill bg-accent" style={{ width: `${clamped}%` }} />
    </View>
  );
}

export type AvatarProps = {
  /** As iniciais. Imagem chega depois, com expo-image; o fallback ja e o produto. */
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Avatar({ initials, size = "md", className }: AvatarProps) {
  const box = { sm: "size-8", md: "size-10", lg: "size-12" }[size];
  const text = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  return (
    <View
      className={cn(
        "items-center justify-center rounded-pill border border-border bg-surface-raised",
        box,
        className,
      )}
    >
      <Text className={`font-medium text-fg-muted ${text}`}>{initials}</Text>
    </View>
  );
}

const ALERT_TONE: Record<string, { box: string; text: string }> = {
  info: { box: "border-info bg-info-subtle", text: "text-info-text" },
  success: { box: "border-success bg-success-subtle", text: "text-success-text" },
  warning: { box: "border-warning bg-warning-subtle", text: "text-warning-text" },
  danger: { box: "border-danger bg-danger-subtle", text: "text-danger-text" },
};

export type AlertProps = {
  tone?: keyof typeof ALERT_TONE;
  title: string;
  children?: ReactNode;
  className?: string;
};

/** O aviso que fica na tela - o que precisa continuar visivel nunca e Toast. */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const styles = ALERT_TONE[tone];
  return (
    <View accessibilityRole="alert" className={cn("gap-1 rounded-md border p-4", styles.box, className)}>
      <Text className={`text-sm font-medium ${styles.text}`}>{title}</Text>
      {children && <Text className="text-sm text-fg-muted">{children}</Text>}
    </View>
  );
}
