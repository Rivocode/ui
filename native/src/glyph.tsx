import { View } from "react-native";

import { cn } from "./cn";

export function ChevronGlyph({
  direction,
  color,
}: {
  direction: "left" | "right";
  color?: string;
}) {
  return (
    <View
      style={color ? { borderColor: color } : undefined}
      className={cn(
        "size-2.5 border-t-2 border-r-2 border-fg",
        direction === "left" ? "-rotate-135 ml-1" : "rotate-45 mr-1",
      )}
    />
  );
}

export function CrossGlyph({ color }: { color?: string }) {
  const ink = color ? { backgroundColor: color } : undefined;
  return (
    <View className="size-4 items-center justify-center">
      <View style={ink} className="absolute h-[2px] w-4 rotate-45 rounded-pill bg-fg" />
      <View style={ink} className="absolute h-[2px] w-4 -rotate-45 rounded-pill bg-fg" />
    </View>
  );
}

export function PlusGlyph({ minus = false, color }: { minus?: boolean; color?: string }) {
  const ink = color ? { backgroundColor: color } : undefined;
  return (
    <View className="size-4 items-center justify-center">
      <View style={ink} className="absolute h-[2px] w-3.5 rounded-pill bg-fg" />
      {!minus && <View style={ink} className="absolute h-3.5 w-[2px] rounded-pill bg-fg" />}
    </View>
  );
}
