import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, View } from "react-native";
import Animated from "react-native-reanimated";

import { Button } from "./button";
import { cn } from "./cn";
import { useMotion } from "./motion";
import {
  BATCH_ACTIONS,
  CLEAR_SELECTION,
  SELECTION_CLEARED,
  selectedLabel,
} from "./shared/selection";
import { Text } from "./text";

const GAP = 16;

export type ActionBarProps = {
  /** Quantos itens estao selecionados. Acima de zero a barra entra; em zero ela sai. */
  count: number;
  /** As acoes do lote, depois da contagem. Use `Button` `size="sm"`. */
  children?: ReactNode;
  /** Liga o "Limpar seleção". Quem zera a selecao e quem chamou. */
  onClear?: () => void;
  /**
   * A altura da area segura de baixo, em pontos: `useSafeAreaInsets().bottom`.
   * A barra fica 16 pontos acima dela.
   */
  bottomInset?: number;
  /** Os mesmos textos do web: `selected` recebe a contagem e devolve a frase. */
  labels?: {
    selected?: (count: number) => string;
    clear?: string;
    region?: string;
    cleared?: string;
  };
  className?: string;
};

export function ActionBar({
  count,
  children,
  onClear,
  bottomInset = 0,
  labels = {},
  className,
}: ActionBarProps) {
  const motion = useMotion();
  const open = count > 0;
  const say = labels.selected ?? selectedLabel;
  const sentence = open ? say(count) : "";
  const cleared = labels.cleared ?? SELECTION_CLEARED;
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      AccessibilityInfo.announceForAccessibility(sentence);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      AccessibilityInfo.announceForAccessibility(cleared);
    }
  }, [open, sentence, cleared]);

  if (!open) return null;

  return (
    <Animated.View
      entering={motion.riseIn}
      exiting={motion.sinkOut}
      className="absolute inset-x-4"
      style={{ bottom: GAP + bottomInset, pointerEvents: "box-none" }}
    >
      <View
        accessibilityLabel={labels.region ?? BATCH_ACTIONS}
        className={cn(
          "flex-row flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2",
          className,
        )}
      >
        <Text className="px-1 text-sm font-medium text-fg">{sentence}</Text>
        {children}
        {onClear ? (
          <Button size="sm" variant="ghost" onPress={onClear} className="ml-auto">
            {labels.clear ?? CLEAR_SELECTION}
          </Button>
        ) : null}
      </View>
    </Animated.View>
  );
}
