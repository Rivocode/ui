import { useState, type ReactNode } from "react";
import { ActivityIndicator, Image, View } from "react-native";

import { cn } from "./cn";
import { Entrance, Fill } from "./motion";
import { useRivo } from "./provider";
import { percent, resolveFormat, type Format } from "./shared/format";
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
  /**
   * Escreve o rotulo acima da barra e a porcentagem ao lado dele. O mesmo nome
   * do web; sem ele, o rotulo so existe para o leitor de tela.
   */
  showValue?: boolean;
  /**
   * Como o numero e escrito: nome de formatador da casa (`percent`,
   * `currencyShort`, `integer`...) ou funcao propria, o mesmo vocabulario do
   * web. Recebe o `value` ja preso entre 0 e 100, e o texto vale na tela e no
   * anuncio.
   */
  format?: Format;
  className?: string;
};

export function Progress({ value, label, showValue, format, className }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const written = write?.(clamped);
  const bar = (
    <Fill percent={clamped} enter className="h-full rounded-pill bg-accent-text" />
  );
  const range = {
    min: 0,
    max: 100,
    now: Math.round(clamped),
    ...(written === undefined ? {} : { text: written }),
  };

  if (!showValue) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={range}
        className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", className)}
      >
        {bar}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={range}
      className={cn("gap-2", className)}
    >
      <View className="flex-row items-baseline justify-between gap-4">
        <Text className="text-sm text-fg">{label}</Text>
        <Text className="text-xs text-fg-subtle">{written ?? percent(clamped)}</Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-pill bg-skeleton">{bar}</View>
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
      <Text className={`font-rc-medium text-fg-muted ${text}`}>{fallback}</Text>
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
    <Entrance
      accessibilityRole="alert"
      className={cn("gap-1 rounded-md border p-4", styles.box, className)}
    >
      <Text className={`text-sm font-rc-medium ${styles.text}`}>{title}</Text>
      {children && <Text className="text-sm text-fg-muted">{children}</Text>}
    </Entrance>
  );
}
