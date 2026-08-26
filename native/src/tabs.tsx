import { Pressable, View } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type TabItem = { label: string; value: string };

export type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  return (
    <View className={cn("flex-row rounded-md border border-border bg-bg p-0.5", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onValueChange(item.value)}
            className={`h-9 flex-1 items-center justify-center rounded-sm ${
              active ? "bg-surface-raised" : ""
            }`}
          >
            <Text className={`text-sm ${active ? "font-medium text-fg" : "text-fg-subtle"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
