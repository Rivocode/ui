import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { cn } from "./cn";
import { useMotion } from "./motion";

export function Skeleton({ className }: { className?: string }) {
  const motion = useMotion();
  const glow = useSharedValue(1);

  useEffect(() => {
    if (motion.reduced) {
      cancelAnimation(glow);
      glow.value = 1;
      return;
    }
    glow.value = withRepeat(
      withSequence(withTiming(0.5, motion.pulse), withTiming(1, motion.pulse)),
      -1,
    );
    return () => cancelAnimation(glow);
  }, [motion, glow]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: glow.value };
  });

  return <Animated.View className={cn("rounded-sm bg-skeleton", className)} style={style} />;
}
