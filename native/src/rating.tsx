import type { ReactNode } from "react";
import { I18nManager, Pressable, View, type GestureResponderEvent } from "react-native";

import { cn } from "./cn";
import { useRivo } from "./provider";
import { RATING_LABELS, starFill, type RatingLabels } from "./shared/rating";
import { Text } from "./text";

const GLYPH = { sm: 18, md: 26, lg: 34 } as const;
const GLYPH_CLASS = { sm: "text-lg", md: "text-2xl", lg: "text-3xl" } as const;
const TARGET = 44;

const HIDDEN = {
  accessible: false,
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

export type RatingProps = {
  /** A nota, controlada. `0` e nenhuma. */
  value: number;
  /**
   * Chamado com a nota nova: pelo toque na estrela ou pelo gesto de ajuste do
   * leitor de tela. Sem ele, a peca so exibe.
   */
  onValueChange?: (value: number) => void;
  /** Quantas estrelas. Padrao 5. */
  max?: number;
  /**
   * Aceita meia estrela: o toque na metade de inicio da leitura (a esquerda, ou
   * a direita em rtl) da `n - 0,5`, e o ajuste anda de meio em meio.
   */
  allowHalf?: boolean;
  /** Tocar de novo na nota escolhida volta a zero. Desligado por padrao. */
  clearable?: boolean;
  /**
   * So exibe: a media de um produto. Aceita fracao qualquer e sai como uma
   * imagem so para o leitor de tela, com o nome "4,3 de 5".
   */
  readOnly?: boolean;
  /** Desliga a escolha. A camada inteira esmaece, como em todo o pacote nativo. */
  disabled?: boolean;
  /**
   * O tamanho do desenho. O alvo de toque de cada estrela e sempre 44pt: o
   * `sm` so encolhe o desenho, e nao o alvo.
   */
  size?: "sm" | "md" | "lg";
  /**
   * Troca a estrela. A funcao recebe a cor ja resolvida do tema, o tamanho e se
   * aquela camada e a cheia ou a vazia:
   * `icon={({ color, size }) => <Heart color={color} fill={color} size={size} />}`.
   */
  icon?: (glyph: { color: string; size: number; filled: boolean }) => ReactNode;
  /** Os textos que o leitor de tela ouve: o nome do grupo, o de cada nota e o da media. */
  labels?: Partial<RatingLabels>;
  className?: string;
};

export function Rating({
  value,
  onValueChange,
  max = 5,
  allowHalf = false,
  clearable = false,
  readOnly = false,
  disabled = false,
  size = "md",
  icon,
  labels,
  className,
}: RatingProps) {
  const { colors } = useRivo();
  const text = { ...RATING_LABELS, ...labels };
  const step = allowHalf ? 0.5 : 1;
  const shown = readOnly ? Math.min(max, Math.max(0, value)) : Math.round(value / step) * step;
  const interactive = !readOnly && !disabled && onValueChange !== undefined;
  const box = readOnly ? GLYPH[size] : TARGET;
  const rtl = I18nManager.getConstants().isRTL;

  const commit = (next: number) => {
    const bounded = Math.min(max, Math.max(0, next));
    if (bounded !== shown) onValueChange?.(bounded);
  };

  const press = (index: number, event: GestureResponderEvent) => {
    if (!interactive) return;
    const x = event.nativeEvent.locationX;
    const first = allowHalf && (rtl ? x > box / 2 : x < box / 2);
    const option = first ? index + 0.5 : index + 1;
    commit(clearable && option === shown ? 0 : option);
  };

  const layer = (filled: boolean) => {
    if (icon)
      return icon({
        color: colors[filled ? "warning" : "border-strong"],
        size: GLYPH[size],
        filled,
      });
    return (
      <Text className={cn(GLYPH_CLASS[size], filled ? "text-warning" : "text-border-strong")}>
        ★
      </Text>
    );
  };

  const stars = Array.from({ length: max }, (_, index) => {
    const fill = starFill(shown, index);
    const drawing = (
      <View
        {...HIDDEN}
        pointerEvents="none"
        testID="rating-star"
        className="items-center justify-center"
        style={{ width: box, height: box }}
      >
        {layer(false)}
        <View
          testID="rating-fill"
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ start: 0, width: box * fill }}
        >
          <View className="items-center justify-center" style={{ width: box, height: box }}>
            {layer(true)}
          </View>
        </View>
      </View>
    );

    if (!interactive) return <View key={index}>{drawing}</View>;

    return (
      <Pressable key={index} {...HIDDEN} onPress={(event) => press(index, event)}>
        {drawing}
      </Pressable>
    );
  });

  if (readOnly) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={text.value(shown, max)}
        className={cn("flex-row items-center self-start", className)}
      >
        {stars}
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={text.group}
      accessibilityState={{ disabled }}
      accessibilityValue={{ min: 0, max, now: shown, text: text.item(shown) }}
      accessibilityActions={
        interactive
          ? [
              { name: "increment", label: "Aumentar" },
              { name: "decrement", label: "Diminuir" },
            ]
          : undefined
      }
      onAccessibilityAction={(event) => {
        if (!interactive) return;
        const delta = event.nativeEvent.actionName === "increment" ? step : -step;
        commit(Math.max(step, shown + delta));
      }}
      className={cn("flex-row items-center self-start", disabled && "opacity-50", className)}
    >
      {stars}
    </View>
  );
}

export type { RatingLabels };
