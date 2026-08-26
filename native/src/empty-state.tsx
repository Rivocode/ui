import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type EmptyStateProps = {
  title: string;
  /** Obrigatoria pelo mesmo motivo do web: "nenhum resultado" sem o porque
   * transfere o trabalho para a pessoa, e ela quase nunca descobre. */
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn("items-center gap-2 px-6 py-10", className)}>
      <Text className="text-lg font-semibold text-fg">{title}</Text>
      <Text className="text-center text-sm text-fg-muted">{description}</Text>
      {action && <View className="mt-2">{action}</View>}
    </View>
  );
}
