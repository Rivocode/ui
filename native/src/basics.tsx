import { useState, type ReactNode } from "react";
import { ActivityIndicator, Image, View } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { Text } from "./text";

export function Separator({ className }: { className?: string }) {
  return <View accessibilityRole="none" className={`h-px bg-border ${className ?? ""}`} />;
}

export function Spinner({ size = "small" }: { size?: "small" | "large" }) {
  const { colors } = useRivo();
  return (
    <ActivityIndicator accessibilityLabel="Carregando" size={size} color={colors["fg-subtle"]} />
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
  /**
   * As iniciais que ocupam o lugar enquanto a foto baixa, e que voltam se ela
   * falhar - por isso continuam obrigatorias mesmo com `src`.
   */
  fallback: string;
  /**
   * A foto, por endereco: `https://` da rede, `file://` do aparelho, `data:`
   * embutida. O mesmo nome do web.
   */
  src?: string;
  /**
   * Descricao da foto para o leitor de tela, vazia quando o nome ja aparece do
   * lado - senao ele fala a pessoa duas vezes.
   */
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Avatar({ fallback, src, alt, size = "md", className }: AvatarProps) {
  const [broken, setBroken] = useState<string | null>(null);
  const box = { sm: "size-8", md: "size-10", lg: "size-12" }[size];
  const text = { sm: "text-xs", md: "text-sm", lg: "text-base" }[size];
  const photo = src !== undefined && src !== broken;
  return (
    <View
      className={cn(
        "items-center justify-center overflow-hidden rounded-pill border border-border bg-surface-raised",
        box,
        className,
      )}
    >
      <Text className={`font-medium text-fg-muted ${text}`}>{fallback}</Text>
      {photo && (
        <Image
          source={{ uri: src }}
          onError={() => setBroken(src)}
          resizeMode="cover"
          accessible={alt !== undefined && alt !== ""}
          accessibilityRole="image"
          accessibilityLabel={alt}
          className="absolute size-full"
        />
      )}
    </View>
  );
}

const INFO_TONE = { box: "border-info bg-info-subtle", text: "text-info-text" };

const ALERT_TONE: Record<string, { box: string; text: string }> = {
  info: INFO_TONE,
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

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const styles = ALERT_TONE[tone] ?? INFO_TONE;
  return (
    <View
      accessibilityRole="alert"
      className={cn("gap-1 rounded-md border p-4", styles.box, className)}
    >
      <Text className={`text-sm font-medium ${styles.text}`}>{title}</Text>
      {children && <Text className="text-sm text-fg-muted">{children}</Text>}
    </View>
  );
}
