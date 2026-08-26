import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { cn } from "./cn";

export type PageHeaderProps = {
  title: string;
  /** A frase de contexto embaixo do titulo, nao um subtitulo decorativo. */
  description?: string;
  /** A etiqueta ao lado do titulo: um Badge, tipicamente. */
  badge?: ReactNode;
  /** As acoes da tela: um Button primario, no maximo dois. */
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
  return (
    <View className={cn("flex-row items-start justify-between gap-3", className)}>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2.5">
          <Text className="text-2xl font-semibold text-fg" numberOfLines={1}>
            {title}
          </Text>
          {badge}
        </View>
        {description && <Text className="mt-0.5 text-sm text-fg-muted">{description}</Text>}
      </View>
      {actions && <View className="flex-row items-center gap-2">{actions}</View>}
    </View>
  );
}
