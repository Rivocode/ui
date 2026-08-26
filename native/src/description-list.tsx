import { Children, type ReactNode } from "react";
import { Text, View } from "react-native";

import { cn } from "./cn";

export type DescriptionItemProps = {
  label: string;
  children: ReactNode;
};

export function DescriptionItem({ label, children }: DescriptionItemProps) {
  return (
    <View className="flex-row items-start justify-between gap-4 py-2.5">
      <Text className="text-sm text-fg-muted">{label}</Text>
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="flex-1 text-right text-sm text-fg">{children}</Text>
      ) : (
        <View className="flex-1 items-end">{children}</View>
      )}
    </View>
  );
}

export function DescriptionList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn(className)}>
      {Children.toArray(children).map((row, index) => (
        <View key={index} className={index > 0 ? "border-t border-border" : ""}>
          {row}
        </View>
      ))}
    </View>
  );
}
