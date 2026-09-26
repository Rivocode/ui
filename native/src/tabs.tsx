import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { cn } from "./cn";
import { useMotion } from "./motion";
import { Text } from "./text";

export type TabItem = { label: string; value: string };

export type TabsProps = {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

type Frame = { x: number; width: number };

const TAB_SLOP = { top: 2, bottom: 2, left: 0, right: 0 } as const;

export function Tabs({ items, value, onValueChange, className }: TabsProps) {
  const motion = useMotion();
  const [frames, setFrames] = useState<Record<string, Frame>>({});
  const x = useSharedValue(0);
  const width = useSharedValue(0);
  const placed = useRef(false);
  const target = frames[value];

  useEffect(() => {
    if (!target) return;
    if (!placed.current) {
      placed.current = true;
      x.value = target.x;
      width.value = target.width;
      return;
    }
    x.value = withTiming(target.x, motion.timing("base"));
    width.value = withTiming(target.width, motion.timing("base"));
  }, [target, motion, x, width]);

  const indicator = useAnimatedStyle(() => {
    "worklet";
    return { left: 0, width: width.value, transform: [{ translateX: x.value }] };
  });

  return (
    <View className={cn("flex-row rounded-md border border-border bg-bg p-0.5", className)}>
      {target && (
        <Animated.View
          pointerEvents="none"
          className="absolute top-0.5 bottom-0.5 rounded-sm bg-surface-raised"
          style={indicator}
        />
      )}
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={TAB_SLOP}
            onPress={() => onValueChange(item.value)}
            onLayout={(event) => {
              const { x: left, width: size } = event.nativeEvent.layout;
              setFrames((current) =>
                current[item.value]?.x === left && current[item.value]?.width === size
                  ? current
                  : { ...current, [item.value]: { x: left, width: size } },
              );
            }}
            className={`h-10 flex-1 items-center justify-center rounded-sm ${
              active && !target ? "bg-surface-raised" : ""
            }`}
          >
            <Text className={`text-sm ${active ? "font-rc-medium text-fg" : "text-fg-subtle"}`}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
