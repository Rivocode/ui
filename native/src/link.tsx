import type { ReactNode } from "react";
import {
  Linking,
  type GestureResponderEvent,
  type TextProps as NativeTextProps,
} from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type LinkTone = "accent" | "neutral" | "muted" | "inherit";

const TONE: Record<LinkTone, string> = {
  accent: "text-accent-text",
  neutral: "text-fg",
  muted: "text-fg-muted",
  inherit: "",
};

export type LinkProps = Omit<NativeTextProps, "accessibilityRole" | "role" | "onPress"> & {
  children: ReactNode;
  /**
   * O endereco que o toque abre pelo `Linking` do React Native: `https:`,
   * `mailto:`, `tel:`. Quando `onPress` vem junto, quem navega e o `onPress`,
   * e o `href` fica so como dado.
   */
  href?: string;
  /**
   * Quem navega dentro do app: `onPress={() => router.push("/notas")}`. E o
   * lugar do `render` do web, que aqui nao existe porque nao ha ancora.
   */
  onPress?: (event: GestureResponderEvent) => void;
  /**
   * O papel de cor, os mesmos quatro do web. `inherit` pega a cor do `Text` de
   * fora, e e o que vai dentro de um `Alert`.
   */
  tone?: LinkTone;
  /**
   * Sai do app: desenha a seta de saida e avisa o leitor de tela com o
   * `externalLabel`, como dica depois do nome.
   */
  external?: boolean;
  /** A dica que o leitor de tela le depois do nome de um link `external`. */
  externalLabel?: string;
  className?: string;
};

export function Link({
  children,
  href,
  onPress,
  tone = "accent",
  external = false,
  externalLabel = "Abre fora do app.",
  accessibilityLabel,
  accessibilityHint,
  className,
  ...props
}: LinkProps) {
  const press = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);
      return;
    }
    if (href) void Linking.openURL(href);
  };

  return (
    <Text
      {...props}
      accessibilityRole="link"
      accessibilityLabel={
        accessibilityLabel ?? (external && typeof children === "string" ? children : undefined)
      }
      accessibilityHint={accessibilityHint ?? (external ? externalLabel : undefined)}
      onPress={press}
      className={cn("underline", TONE[tone], className)}
    >
      {children}
      {external ? " ↗" : null}
    </Text>
  );
}
