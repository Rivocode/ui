import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type ItemProps = {
  /** O texto que nomeia a linha. Corta com reticências, nunca quebra em duas. */
  title: string;
  /** A segunda linha, menor: o complemento que cabe. Também corta. */
  description?: string;
  /** O canto da esquerda: `Avatar`, ícone, miniatura. */
  media?: ReactNode;
  /** O canto da direita: valor, `Badge`, `Button`, `Indicator`. */
  actions?: ReactNode;
  /** `plain` para lista dentro de card ou folha; `outline` para grade de escolhas. */
  variant?: "plain" | "outline";
  /**
   * Toca e vai. Dentro de um `DataList` com `onRowPress`, NÃO passe isto: o
   * `DataList` já embrulha cada linha, e um `Pressable` dentro do outro
   * segura o toque no de dentro - a linha responderia aqui e nunca lá.
   */
  onPress?: () => void;
  /**
   * O que o leitor de tela anuncia na linha. Por padrão, o título e a
   * descrição na mesma frase.
   */
  accessibilityLabel?: string;
  className?: string;
};

export function Item({
  title,
  description,
  media,
  actions,
  variant = "plain",
  onPress,
  accessibilityLabel,
  className,
}: ItemProps) {
  const label = accessibilityLabel ?? [title, description].filter(Boolean).join(", ");

  const body = (
    <>
      {media !== undefined && <View className="shrink-0">{media}</View>}

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="text-base text-fg">
          {title}
        </Text>
        {description !== undefined && (
          <Text numberOfLines={1} className="text-sm text-fg-muted">
            {description}
          </Text>
        )}
      </View>
    </>
  );

  const frame = cn(
    "w-full flex-row items-center gap-3",
    variant === "outline" ? "rounded-lg border border-border bg-surface p-3" : "px-1 py-2",
    onPress !== undefined && "min-h-11",
    className,
  );

  if (onPress !== undefined && actions === undefined) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={cn(frame, "active:bg-selected")}
      >
        {body}
      </Pressable>
    );
  }

  return (
    <View className={frame}>
      {onPress !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          className="-my-1 flex-1 flex-row items-center gap-3 rounded-md py-1 active:bg-selected"
        >
          {body}
        </Pressable>
      ) : (
        <View className="flex-1 flex-row items-center gap-3">{body}</View>
      )}

      {actions !== undefined && (
        <View className="shrink-0 flex-row items-center gap-2">{actions}</View>
      )}
    </View>
  );
}
