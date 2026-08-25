import { View } from "react-native";

/** A marca de lugar do carregamento. Estatica por ora: pulso entra quando a
 * fase de movimento nativo chegar, e nao antes. */
export function Skeleton({ className }: { className?: string }) {
  return <View className={`rounded-sm bg-skeleton ${className ?? ""}`} />;
}
