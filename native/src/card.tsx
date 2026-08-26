import type { ReactNode } from "react";

import { Text } from "./text";
import { View, type ViewProps } from "react-native";

export function Card({ children, className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      {...props}
      className={`rounded-lg border border-border bg-surface ${className ?? ""}`}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children }: { children: ReactNode }) {
  return <View className="gap-1 px-4 pt-4">{children}</View>;
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <Text font="display" className="text-xl font-semibold text-fg">{children}</Text>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-fg-muted">{children}</Text>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <View className={`px-4 py-4 ${className ?? ""}`}>{children}</View>;
}
