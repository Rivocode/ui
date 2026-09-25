import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";

import { cn } from "./cn";
import { useMotion } from "./motion";
import { useRivo } from "./provider";
import { SPOILER_HEIGHT, SPOILER_LESS, SPOILER_MORE } from "./shared/spoiler";
import { Text } from "./text";

const FADE = 40;
const BANDS = 8;

export type SpoilerProps = {
  /** O conteudo longo. */
  children: ReactNode;
  /**
   * A altura do recolhido, em pontos. Abaixo dela o botao nem aparece; acima,
   * o conteudo corta aqui e os ultimos 40 pontos somem em degrade.
   */
  maxHeight?: number;
  /** Aberto, para quem controla. Sem ele, a peca guarda o proprio estado. */
  expanded?: boolean;
  /** Aberto na primeira pintura, sem controlar. O mesmo nome do web. */
  defaultExpanded?: boolean;
  /** Recebe o estado novo a cada toque no "Ler mais" e no "Ler menos". */
  onExpandedChange?: (expanded: boolean) => void;
  /** Os textos do botao, os mesmos do web. */
  labels?: { more?: string; less?: string };
  /**
   * O fundo em que o bloco pousa, para o degrade sumir nele: no celular nao
   * ha mascara, e o degrade e pintado na cor do fundo. Padrao: `bg`.
   */
  fadeOver?: "bg" | "surface" | "surface-raised";
  className?: string;
};

export function Spoiler({
  children,
  maxHeight = SPOILER_HEIGHT,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  labels = {},
  fadeOver = "bg",
  className,
}: SpoilerProps) {
  const motion = useMotion();
  const { colors } = useRivo();
  const [own, setOwn] = useState(defaultExpanded);
  const [full, setFull] = useState(0);
  const open = expanded ?? own;
  const overflowing = full > maxHeight + 1;
  const clipped = overflowing && !open;

  function change(next: boolean) {
    if (expanded === undefined) setOwn(next);
    onExpandedChange?.(next);
  }

  return (
    <View className={cn("items-start gap-1", className)}>
      <Animated.View
        layout={motion.reflow}
        className="w-full"
        style={{ maxHeight: clipped ? maxHeight : undefined, overflow: "hidden" }}
      >
        <View onLayout={(event) => setFull(event.nativeEvent.layout.height)}>{children}</View>
        {clipped ? (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            className="absolute inset-x-0 bottom-0"
            style={{ height: FADE }}
          >
            {Array.from({ length: BANDS }, (_, band) => (
              <View
                key={band}
                style={{
                  flex: 1,
                  backgroundColor: colors[fadeOver],
                  opacity: (band + 1) / (BANDS + 1),
                }}
              />
            ))}
          </View>
        ) : null}
      </Animated.View>

      {overflowing ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          onPress={() => change(!open)}
          hitSlop={8}
          className="min-h-11 justify-center"
        >
          <Text className="text-sm font-rc-medium text-accent-text">
            {open ? (labels.less ?? SPOILER_LESS) : (labels.more ?? SPOILER_MORE)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
