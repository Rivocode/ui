import type { ReactNode } from "react";
import { Text, View } from "react-native";

export type EmptyStateProps = {
  title: string;
  /** Obrigatoria pelo mesmo motivo do web: "nenhum resultado" sem o porque
   * transfere o trabalho para a pessoa, e ela quase nunca descobre. */
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View className="items-center gap-2 px-6 py-10">
      <Text className="text-lg font-semibold text-fg">{title}</Text>
      <Text className="text-center text-sm text-fg-muted">{description}</Text>
      {action && <View className="mt-2">{action}</View>}
    </View>
  );
}
