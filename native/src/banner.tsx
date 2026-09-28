import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { spokenSentence, useAnnounce } from "./announce";
import { cn, type Slots } from "./cn";
import { useRivo } from "./provider";
import { Text } from "./text";

const TONE = {
  info: { box: "border-info bg-info-subtle", text: "text-info-text", cross: "bg-info-text" },
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
} as const;

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type BannerProps = {
  /**
   * The tone decides color and urgency: `danger` and `warning` come out as
   * `alert` and are read right away; `info` and `success` wait, in a polite
   * live region.
   */
  tone?: keyof typeof TONE;
  /** The short sentence before the description, in the tone color. Optional. */
  title?: string;
  /** What happened and what the person does about it. It is the body of the notice. */
  description: string;
  /**
   * The symbol on the left, hidden from the screen reader. Without it, none:
   * the package ships no icon. The form that paints in the tone color is the
   * function - `icon={({ color, size }) => <TriangleAlert color={color}
   * size={size} />}`.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /** The banner buttons, below the text. Use `Button` `size="sm"` `variant="secondary"`. */
  actions?: ReactNode;
  /** Turns on the close X. The caller is the one who makes the banner go away. */
  onDismiss?: () => void;
  className?: string;
  /**
   * The component's texts, to change the language: `dismiss` is the name of the
   * X, "Fechar aviso" without it.
   */
  labels?: Partial<BannerLabels>;
  /**
   * Class per part: `icon`, `content` (the text column), `title`,
   * `description`, `actions` and `dismiss` (the X).
   */
  classNames?: Slots<"icon" | "content" | "title" | "description" | "actions" | "dismiss">;
};

export type BannerLabels = {
  dismiss: string;
};

export function Banner({
  tone = "info",
  title,
  description,
  icon,
  actions,
  onDismiss,
  labels,
  className,
  classNames,
}: BannerProps) {
  const dismissLabel = labels?.dismiss ?? "Fechar aviso";
  const { colors } = useRivo();
  const styles = TONE[tone] ?? TONE.info;
  const urgent = tone === "danger" || tone === "warning";
  const glyph =
    typeof icon === "function" ? icon({ color: colors[`${tone}-text`], size: 16 }) : icon;

  useAnnounce(spokenSentence(title, description), { liveRegion: true, onMount: urgent });

  return (
    <View
      accessibilityRole={urgent ? "alert" : "none"}
      accessibilityLiveRegion={urgent ? "assertive" : "polite"}
      className={cn("w-full flex-row items-start gap-3 border-b px-4 py-3", styles.box, className)}
    >
      {glyph ? (
        <View {...HIDDEN} className={cn("mt-0.5", classNames?.icon)}>
          {glyph}
        </View>
      ) : null}

      <View className={cn("flex-1 gap-1", classNames?.content)}>
        {title ? (
          <Text className={cn("text-sm font-rc-medium", styles.text, classNames?.title)}>
            {title}
          </Text>
        ) : null}
        <Text className={cn("text-sm text-fg", classNames?.description)}>{description}</Text>
        {actions ? (
          <View className={cn("mt-2 flex-row flex-wrap gap-2", classNames?.actions)}>
            {actions}
          </View>
        ) : null}
      </View>

      {onDismiss ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={dismissLabel}
          onPress={onDismiss}
          hitSlop={10}
          className={cn("-my-1 -mr-1 size-6 items-center justify-center", classNames?.dismiss)}
        >
          <View className={cn("absolute h-[1.5px] w-3.5 rotate-45 rounded-pill", styles.cross)} />
          <View className={cn("absolute h-[1.5px] w-3.5 -rotate-45 rounded-pill", styles.cross)} />
        </Pressable>
      ) : null}
    </View>
  );
}
