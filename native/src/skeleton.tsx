import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

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

  return <Animated.View className={`rounded-sm bg-skeleton ${className ?? ""}`} style={style} />;
}
