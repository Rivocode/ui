import type { ReactNode } from "react";
import { Text, View } from "react-native";

export type FieldsetProps = {
  /** O titulo do grupo: "Endereço de cobrança". */
  legend: string;
  description?: string;
  children: ReactNode;
};

/** Campos que pertencem um ao outro, com o titulo que explica o conjunto. */
export function Fieldset({ legend, description, children }: FieldsetProps) {
  return (
    <View className="gap-4">
      <View className="gap-0.5">
        <Text className="text-base font-medium text-fg">{legend}</Text>
        {description && <Text className="text-sm text-fg-muted">{description}</Text>}
      </View>
      {children}
    </View>
  );
}
