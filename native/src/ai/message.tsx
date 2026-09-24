import { useEffect, type ReactNode } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Button } from "../button";
import { cn } from "../cn";
import { useMotion } from "../motion";
import { MESSAGE_AUTHOR as AUTHOR, type MessageRole } from "../shared/ai";
import { Text } from "../text";

export type { MessageRole };

const HIDDEN = {
  accessibilityElementsHidden: true,
  importantForAccessibility: "no-hide-descendants",
} as const;

function Dot({ delay }: { delay: number }) {
  const motion = useMotion();
  const fade = useSharedValue(1);

  useEffect(() => {
    if (motion.reduced) {
      cancelAnimation(fade);
      fade.value = 1;
      return;
    }
    const timer = setTimeout(() => {
      fade.value = withRepeat(
        withSequence(withTiming(0.3, motion.pulse), withTiming(1, motion.pulse)),
        -1,
      );
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimation(fade);
    };
  }, [motion, delay, fade]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: fade.value };
  });

  return <Animated.View style={style} className="size-1.5 rounded-pill bg-fg-subtle" />;
}

function TypingIndicator() {
  return (
    <View {...HIDDEN} className="flex-row items-center gap-1 py-1.5">
      <Dot delay={0} />
      <Dot delay={150} />
      <Dot delay={300} />
    </View>
  );
}

export type MessageProps = {
  /**
   * Quem fala. Decide o alinhamento e o desenho: `user` e o balao a direita,
   * `assistant` e o texto corrido a esquerda, `system` e a linha discreta no
   * centro.
   */
  role: MessageRole;
  /** O nome de quem fala, para o leitor de tela. Sem ele: "Você", "Assistente" ou "Sistema". */
  author?: string;
  /** O `Avatar` ao lado da mensagem. Nao sai em `system`. */
  avatar?: ReactNode;
  /**
   * O conteudo. Texto solto vira `Text` no corpo da casa; no aceito, para quem
   * renderiza markdown.
   */
  children?: ReactNode;
  /** O texto ainda esta chegando: anuncia `busy`, mostra o indicador e esconde as acoes. */
  streaming?: boolean;
  /**
   * Liga o botao de copiar. A peca nao copia: o `expo-clipboard` mora em
   * `@rivocode/ui-native/clipboard`, e quem copia e quem chamou.
   */
  onCopy?: () => void;
  /** Liga o botao de tentar de novo, que pede outra resposta. */
  onRetry?: () => void;
  /** Os nomes dos botoes de acao. Sem eles: "Copiar" e "Tentar de novo". */
  labels?: { copy?: string; retry?: string };
  /** Os botoes proprios, depois do copiar e do tentar de novo. */
  actions?: ReactNode;
  /** A resposta falhou: a frase sai embaixo do conteudo, no tom de perigo. */
  error?: string;
  className?: string;
};

export function Message({
  role,
  author,
  avatar,
  children,
  streaming = false,
  onCopy,
  onRetry,
  labels = {},
  actions,
  error,
  className,
}: MessageProps) {
  const isUser = role === "user";
  const name = author ?? AUTHOR[role] ?? AUTHOR.assistant;
  const body =
    typeof children === "string" || typeof children === "number" ? (
      <Text className="text-base text-fg">{children}</Text>
    ) : (
      children
    );
  const hasContent = children !== undefined && children !== null && children !== "";
  const showActions = !streaming && (onCopy || onRetry || actions);

  if (role === "system") {
    return (
      <View accessibilityLabel={name} className={cn("w-full items-center px-4 py-1", className)}>
        {typeof children === "string" ? (
          <Text className="text-center text-sm text-fg-muted">{children}</Text>
        ) : (
          children
        )}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={name}
      accessibilityState={{ busy: streaming }}
      className={cn("w-full gap-3", isUser ? "flex-row-reverse" : "flex-row", className)}
    >
      {avatar ? <View className="pt-0.5">{avatar}</View> : null}

      <View className={cn("min-w-0 gap-1.5", isUser ? "max-w-[85%] items-end" : "flex-1")}>
        <View
          className={cn(isUser ? "rounded-lg rounded-br-sm bg-accent-subtle px-3.5 py-2.5" : "")}
        >
          {hasContent ? body : null}
          {streaming ? <TypingIndicator /> : null}
        </View>

        {error ? <Text className="text-sm text-danger-text">{error}</Text> : null}

        {showActions ? (
          <View className="flex-row flex-wrap items-center gap-1">
            {onCopy ? (
              <Button variant="ghost" size="sm" onPress={onCopy}>
                {labels.copy ?? "Copiar"}
              </Button>
            ) : null}
            {onRetry ? (
              <Button variant="ghost" size="sm" onPress={onRetry}>
                {labels.retry ?? "Tentar de novo"}
              </Button>
            ) : null}
            {actions}
          </View>
        ) : null}
      </View>
    </View>
  );
}
