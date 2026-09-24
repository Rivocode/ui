import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
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
   * O tom decide a cor e a urgencia: `danger` e `warning` saem como `alert` e
   * sao lidos na hora; `info` e `success` esperam, em regiao viva educada.
   */
  tone?: keyof typeof TONE;
  /** A frase curta antes da descricao, na cor do tom. Opcional. */
  title?: string;
  /** O que aconteceu e o que a pessoa faz a respeito. E o corpo do aviso. */
  description: string;
  /**
   * O simbolo a esquerda, escondido do leitor de tela. Sem ele, nenhum: o
   * pacote nao traz icone. A forma que pinta na cor do tom e a funcao -
   * `icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`.
   */
  icon?: ReactNode | ((glyph: { color: string; size: number }) => ReactNode);
  /** Os botoes da faixa, embaixo do texto. Use `Button` `size="sm"` `variant="secondary"`. */
  actions?: ReactNode;
  /** Liga o xis de fechar. Quem some com a faixa e quem chamou. */
  onDismiss?: () => void;
  /** O nome acessivel do xis. Sem ele, "Fechar aviso". */
  dismissLabel?: string;
  className?: string;
};

export function Banner({
  tone = "info",
  title,
  description,
  icon,
  actions,
  onDismiss,
  dismissLabel = "Fechar aviso",
  className,
}: BannerProps) {
  const { colors } = useRivo();
  const styles = TONE[tone] ?? TONE.info;
  const urgent = tone === "danger" || tone === "warning";
  const glyph =
    typeof icon === "function" ? icon({ color: colors[`${tone}-text`], size: 16 }) : icon;

  return (
    <View
      accessibilityRole={urgent ? "alert" : "none"}
      accessibilityLiveRegion={urgent ? "assertive" : "polite"}
      className={cn("w-full flex-row items-start gap-3 border-b px-4 py-3", styles.box, className)}
    >
      {glyph ? (
        <View {...HIDDEN} className="mt-0.5">
          {glyph}
        </View>
      ) : null}

      <View className="flex-1 gap-1">
        {title ? <Text className={cn("text-sm font-medium", styles.text)}>{title}</Text> : null}
        <Text className="text-sm text-fg">{description}</Text>
        {actions ? <View className="mt-2 flex-row flex-wrap gap-2">{actions}</View> : null}
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
    </View>
  );
}
