import { useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

import { cn } from "./cn";
import { KeyboardRiser } from "./keyboard";

const GAP = 16;

export type ScrollAreaProps = Omit<
  KeyboardAwareScrollViewProps,
  "bottomOffset" | "className" | "contentContainerClassName" | "horizontal" | "ScrollViewComponent"
> & {
  children?: ReactNode;
  /**
   * O que fica preso embaixo da rolagem e sobe junto com o teclado: a acao de
   * enviar o formulario. A altura dele entra na conta de onde o campo em foco
   * tem que parar, entao nenhum campo fica escondido atras do botao.
   */
  footer?: ReactNode;
  /**
   * Em pontos, quanto o campo em foco fica acima do teclado - ou acima do
   * `footer`, quando ha um. Padrao 16.
   */
  bottomOffset?: number;
  /** Veste a caixa de fora, a que ocupa a tela. */
  className?: string;
  /** Veste o conteudo que rola: `gap-4 p-5` e o comum. */
  contentContainerClassName?: string;
  /** Veste a faixa do `footer`: fundo, borda e respiro. */
  footerClassName?: string;
};

export function ScrollArea({
  children,
  footer,
  bottomOffset = GAP,
  className,
  contentContainerClassName,
  footerClassName,
  ...props
}: ScrollAreaProps) {
  const [footerHeight, setFooterHeight] = useState(0);

  return (
    <View className={cn("flex-1", className)}>
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        {...props}
        bottomOffset={bottomOffset + (footer ? footerHeight : 0)}
        className="flex-1"
        contentContainerClassName={contentContainerClassName}
      >
        {children}
      </KeyboardAwareScrollView>
      {footer && (
        <KeyboardRiser
          onLayout={(event: LayoutChangeEvent) => setFooterHeight(event.nativeEvent.layout.height)}
          className={cn("border-t border-border bg-bg px-5 py-3", footerClassName)}
        >
          {footer}
        </KeyboardRiser>
      )}
    </View>
  );
}
