import type { ReactNode } from "react";
import { View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type FieldsetProps = {
  /** O titulo do grupo: "Endereço de cobrança". */
  legend: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Fieldset({ legend, description, children, className }: FieldsetProps) {
  return (
    <View className={cn("gap-4", className)}>
      <View className="gap-0.5">
        <Text font="display" className="text-base font-medium text-fg">{legend}</Text>
        {description && <Text className="text-sm text-fg-muted">{description}</Text>}
      </View>
      {children}
    </View>
  );
}
