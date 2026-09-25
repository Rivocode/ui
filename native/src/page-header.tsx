import type { ReactNode } from "react";
import { View } from "react-native";

import { cn, type Slots } from "./cn";
import { Text } from "./text";

export type PageHeaderProps = {
  title: string;
  /** A frase de contexto embaixo do titulo, nao um subtitulo decorativo. */
  description?: string;
  /** A etiqueta ao lado do titulo: um Badge, tipicamente. */
  badge?: ReactNode;
  /** As acoes da tela: um Button primario, no maximo dois. */
  actions?: ReactNode;
  /** Veste a raiz, a mesma fileira de `classNames.row`. */
  className?: string;
  /**
   * Classe por parte: `row` (a fileira do titulo com as acoes), `heading` (a
   * coluna do titulo e da descricao), `title`, `description` e `actions`.
   */
  classNames?: Slots<"row" | "heading" | "title" | "description" | "actions">;
};

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  classNames,
}: PageHeaderProps) {
  return (
    <View
      className={cn("flex-row items-start justify-between gap-3", className, classNames?.row)}
    >
      <View className={cn("min-w-0 flex-1", classNames?.heading)}>
        <View className="flex-row items-center gap-2.5">
          <Text
            font="display"
            className={cn("text-2xl font-rc-display text-fg", classNames?.title)}
            numberOfLines={1}
          >
            {title}
          </Text>
          {badge}
        </View>
        {description && (
          <Text className={cn("mt-0.5 text-sm text-fg-muted", classNames?.description)}>
            {description}
          </Text>
        )}
      </View>
      {actions && (
        <View className={cn("flex-row items-center gap-2", classNames?.actions)}>{actions}</View>
      )}
    </View>
  );
}
