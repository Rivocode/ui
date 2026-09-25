import { useState, type ReactNode } from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";

import { cn, type Slots } from "./cn";
import { Entrance, Fill } from "./motion";
import { useRivo } from "./provider";
import { percent, resolveFormat, type Format } from "./shared/format";
import { Text } from "./text";

export function Separator({ className }: { className?: string }) {
  return <View accessibilityRole="none" className={`h-px bg-border ${className ?? ""}`} />;
}

const SPINNER_SIZE = { sm: "small", md: "small", lg: "large", small: "small", large: "large" } as const;

export type SpinnerProps = {
  /**
   * Os nomes do web. O `ActivityIndicator` so tem dois giros, entao `sm` e `md`
   * desenham o pequeno e `lg` o grande. `small` e `large` seguem aceitos e
   * estao obsoletos: use `md` e `lg`.
   */
  size?: "sm" | "md" | "lg" | "small" | "large";
  /** O que o leitor de tela anuncia. Vazio esconde o giro da leitura. */
  label?: string;
};

export function Spinner({ size = "md", label = "Carregando" }: SpinnerProps) {
  const { colors } = useRivo();
  const named = label !== "";
  return (
    <ActivityIndicator
      accessibilityLabel={named ? label : undefined}
      accessibilityElementsHidden={!named}
      importantForAccessibility={named ? "auto" : "no-hide-descendants"}
      size={SPINNER_SIZE[size] ?? "small"}
      color={colors["fg-subtle"]}
    />
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
  /** Veste a raiz: sem `showValue`, o trilho, o mesmo no de `classNames.track`. */
  className?: string;
  /**
   * Classe por parte: `label` e `value` (os dois textos, so com `showValue`),
   * `track` (o trilho) e `indicator` (o preenchimento).
   */
  classNames?: Slots<"label" | "value" | "track" | "indicator">;
};

export function Progress({
  value,
  label,
  showValue,
  format,
  className,
  classNames,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const write = resolveFormat(format) as ((value: number) => string) | undefined;
  const written = write?.(clamped);
  const bar = (
    <Fill
      percent={clamped}
      enter
      className={cn("h-full rounded-pill bg-accent-text", classNames?.indicator)}
    />
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
        className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", className, classNames?.track)}
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
        <Text className={cn("text-sm text-fg", classNames?.label)}>{label}</Text>
        <Text className={cn("text-xs text-fg-subtle", classNames?.value)}>
          {written ?? percent(clamped)}
        </Text>
      </View>
      <View className={cn("h-1.5 overflow-hidden rounded-pill bg-skeleton", classNames?.track)}>
        {bar}
      </View>
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

const INFO_TONE = { box: "border-info bg-info-subtle", text: "text-info-text", cross: "bg-info-text" };

const ALERT_TONE = {
  info: INFO_TONE,
  success: {
    box: "border-success bg-success-subtle",
    text: "text-success-text",
    cross: "bg-success-text",
  },
  warning: {
    box: "border-warning bg-warning-subtle",
    text: "text-warning-text",
    cross: "bg-warning-text",
  },
  danger: { box: "border-danger bg-danger-subtle", text: "text-danger-text", cross: "bg-danger-text" },
} satisfies Record<string, { box: string; text: string; cross: string }>;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type AlertProps = {
  tone?: keyof typeof ALERT_TONE;
  title: string;
  children?: ReactNode;
  /**
   * O simbolo a esquerda do texto, escondido do leitor de tela. O pacote nao
   * traz icone: a forma que pinta na cor do tom e a funcao -
   * `icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /** Liga o xis que fecha o aviso, no canto direito. Quem some com o aviso e quem chamou. */
  onDismiss?: () => void;
  /** O nome acessivel do xis. Sem ele, "Fechar aviso". */
  dismissLabel?: string;
  className?: string;
};

export function Alert({
  tone = "info",
  title,
  children,
  icon,
  onDismiss,
  dismissLabel = "Fechar aviso",
  className,
}: AlertProps) {
  const { colors } = useRivo();
  const known = Object.prototype.hasOwnProperty.call(ALERT_TONE, tone) ? tone : "info";
  const styles = ALERT_TONE[known];
  const glyph =
    typeof icon === "function" ? icon({ color: colors[`${known}-text`], size: 16 }) : icon;
  return (
    <Entrance
      accessibilityRole="alert"
      className={cn("flex-row items-start gap-3 rounded-md border p-4", styles.box, className)}
    >
      {glyph ? (
        <View {...HIDDEN} className="mt-0.5">
          {glyph}
        </View>
      ) : null}
      <View className="flex-1 gap-1">
        <Text className={`text-sm font-rc-medium ${styles.text}`}>{title}</Text>
        {children && <Text className="text-sm text-fg-muted">{children}</Text>}
      </View>
      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
          hitSlop={10}
          className="-my-1 -mr-1 size-6 items-center justify-center"
        >
          <View className={cn("absolute h-[1.5px] w-3.5 rotate-45 rounded-pill", styles.cross)} />
          <View className={cn("absolute h-[1.5px] w-3.5 -rotate-45 rounded-pill", styles.cross)} />
        </Pressable>
      ) : null}
    </Entrance>
  );
}
