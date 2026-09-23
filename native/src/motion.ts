import { useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, Pressable } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  ReduceMotion,
  useReducedMotion as useReducedMotionAtLaunch,
} from "react-native-reanimated";

import { tokens } from "../tokens";

export type MotionDuration = "fast" | "base" | "slow" | "sheet";
export type MotionCurve = keyof typeof tokens.easings;

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function useReducedMotion(): boolean {
  const atLaunch = useReducedMotionAtLaunch();
  const [reduced, setReduced] = useState(atLaunch);

  useEffect(() => {
    let answered = false;
    const listen = (enabled: boolean) => {
      answered = true;
      setReduced(enabled);
    };
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!answered && enabled !== atLaunch) listen(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", listen);
    return () => {
      answered = true;
      subscription.remove();
    };
  }, [atLaunch]);

  return reduced;
}

const curve = (name: MotionCurve) => {
  const [x1, y1, x2, y2] = tokens.easings[name];
  return Easing.bezier(x1, y1, x2, y2);
};

const milliseconds = (duration: MotionDuration) => tokens.scales[`duration-${duration}`];

export function useMotion() {
  const reduced = useReducedMotion();

  return useMemo(() => {
    const ease = curve("ease");
    const still = reduced ? ReduceMotion.Always : ReduceMotion.Never;

    return {
      reduced,
      timing: (duration: MotionDuration, easing: MotionCurve = "ease") => ({
        duration: reduced ? 0 : milliseconds(duration),
        easing: curve(easing),
        reduceMotion: still,
      }),
      fadeIn: reduced
        ? undefined
        : FadeIn.duration(milliseconds("base")).easing(ease).reduceMotion(still),
      fadeOut: reduced
        ? undefined
        : FadeOut.duration(milliseconds("fast")).easing(ease).reduceMotion(still),
      riseIn: reduced
        ? undefined
        : FadeInDown.duration(milliseconds("slow")).easing(ease).reduceMotion(still),
      sinkOut: reduced
        ? undefined
        : FadeOutDown.duration(milliseconds("base")).easing(ease).reduceMotion(still),
      reflow: reduced
        ? undefined
        : LinearTransition.duration(milliseconds("base")).easing(ease).reduceMotion(still),
    };
  }, [reduced]);
}
