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

const SPINNER_SIZE = { sm: "small", md: "small", lg: "large" } as const;

export type SpinnerProps = {
  /**
   * The web names. `ActivityIndicator` has only two spinners, so `sm` and `md`
   * draw the small one and `lg` the large one.
   */
  size?: "sm" | "md" | "lg";
  /** What the screen reader announces. Empty hides the spinner from reading. */
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
      size={SPINNER_SIZE[size]}
      color={colors["fg-subtle"]}
    />
  );
}

export type ProgressProps = {
  /** 0 to 100. Progress moves toward the end and finishes; how-much-of-capacity is Meter. */
  value: number;
  label: string;
  /**
   * Writes the label above the bar and the percentage next to it. The same name
   * as the web; without it, the label exists only for the screen reader.
   */
  showValue?: boolean;
  /**
   * How the number is written: the name of a house formatter (`percent`,
   * `currencyShort`, `integer`...) or your own function, the same vocabulary as
   * the web. Receives `value` already clamped between 0 and 100, and the text
   * applies on screen and in the announcement.
   */
  format?: Format;
  /** Styles the root: without `showValue`, the track, the same node as `classNames.track`. */
  className?: string;
  /**
   * Class per part: `label` and `value` (the two texts, only with `showValue`),
   * `track` (the track) and `indicator` (the fill).
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
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label}
        accessibilityValue={range}
        className={cn(
          "h-1.5 overflow-hidden rounded-pill bg-skeleton",
          className,
          classNames?.track,
        )}
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
   * The initials that hold the place while the photo downloads, and that come
   * back if it fails - which is why they remain required even with `src`.
   */
  fallback: string;
  /**
   * The photo, by address: `https://` from the network, `file://` from the
   * device, embedded `data:`. The same name as the web.
   */
  src?: string;
  /**
   * Description of the photo for the screen reader, empty when the name already
   * appears beside it - otherwise it reads the person twice.
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

const INFO_TONE = {
  box: "border-info bg-info-subtle",
  text: "text-info-text",
  cross: "bg-info-text",
};

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
  danger: {
    box: "border-danger bg-danger-subtle",
    text: "text-danger-text",
    cross: "bg-danger-text",
  },
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
   * The symbol to the left of the text, hidden from the screen reader. The
   * package ships no icon: the form that paints in the tone color is the
   * function - `icon={({ color, size }) => <TriangleAlert color={color}
   * size={size} />}`.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /**
   * Turns on the X that closes the notice, in the right corner. The caller is
   * the one who makes the notice go away.
   */
  onDismiss?: () => void;
  className?: string;
  /**
   * The component's texts, to change the language: `dismiss` is the name of the
   * X, "Fechar aviso" without it.
   */
  labels?: Partial<AlertLabels>;
};

export type AlertLabels = {
  dismiss: string;
};

export function Alert({
  tone = "info",
  title,
  children,
  icon,
  onDismiss,
  labels,
  className,
}: AlertProps) {
  const dismissLabel = labels?.dismiss ?? "Fechar aviso";
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
