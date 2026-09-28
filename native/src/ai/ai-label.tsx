import { useState } from "react";
import { Pressable, View } from "react-native";

import { cn } from "../cn";
import { Sheet } from "../sheet";
import { Text } from "../text";

const TONE = {
  accent: { box: "border-border-strong bg-accent-subtle", text: "text-accent-text" },
  neutral: { box: "border-border-strong bg-surface-raised", text: "text-fg-muted" },
} as const;

const SIZE = {
  sm: { box: "h-5 min-w-5 px-1", text: "text-xs" },
  md: { box: "h-6 min-w-6 px-1.5", text: "text-sm" },
} as const;

export type AILabelProps = {
  /** The badge text. Without it, "IA". */
  text?: string;
  /**
   * What the screen reader hears instead of the badge, which on its own would
   * be spelled out. Without it, "Conteúdo gerado por IA". With `explanation`,
   * it becomes the button's name.
   */
  label?: string;
  tone?: keyof typeof TONE;
  size?: keyof typeof SIZE;
  /**
   * The explanation: who generated it, from what data, what to check. With it
   * the badge becomes a button and opens a `Sheet`, because a panel anchored to
   * the touch sits under the finger.
   */
  explanation?: string;
  /** The title of the explanation sheet. Without it, "Gerado por IA". */
  title?: string;
  className?: string;
};

export function AILabel({
  text = "IA",
  label = "Conteúdo gerado por IA",
  tone = "accent",
  size = "sm",
  explanation,
  title = "Gerado por IA",
  className,
}: AILabelProps) {
  const [open, setOpen] = useState(false);
  const look = TONE[tone] ?? TONE.accent;
  const scale = SIZE[size] ?? SIZE.sm;

  const badge = (
    <View
      className={cn(
        "items-center justify-center self-start rounded-sm border",
        look.box,
        scale.box,
        className,
      )}
    >
      <Text className={cn("font-rc-strong tracking-wide", look.text, scale.text)}>{text}</Text>
    </View>
  );

  if (!explanation) {
    return (
      <View accessible accessibilityLabel={label} className="self-start">
        {badge}
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={12}
        onPress={() => setOpen(true)}
        className="self-start"
      >
        {badge}
      </Pressable>
      <Sheet open={open} onOpenChange={setOpen} title={title} description={explanation} />
    </>
  );
}
