import { View } from "react-native";

export function Skeleton({ className }: { className?: string }) {
  return <View className={`rounded-sm bg-skeleton ${className ?? ""}`} />;
}
