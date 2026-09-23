import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
  ReduceMotion,
  ZoomIn,
  useAnimatedStyle,
  useReducedMotion as useReducedMotionAtLaunch,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "../tokens";

export type MotionDuration = "fast" | "base" | "slow" | "sheet";
export type MotionCurve = keyof typeof tokens.easings;

const PULSE_HALF = 1000;
const PULSE_CURVE = [0.4, 0, 0.6, 1] as const;
const PRESSED_SCALE = 0.97;

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
      pulse: {
        duration: reduced ? 0 : PULSE_HALF,
        easing: Easing.bezier(...PULSE_CURVE),
        reduceMotion: still,
      },
      fadeIn: reduced
        ? undefined
        : FadeIn.duration(milliseconds("base")).easing(ease).reduceMotion(still),
      fadeOut: reduced
        ? undefined
        : FadeOut.duration(milliseconds("fast")).easing(ease).reduceMotion(still),
      popIn: reduced
        ? undefined
        : ZoomIn.duration(milliseconds("fast")).easing(ease).reduceMotion(still),
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

export function useSettled(): boolean {
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);
  return settled.current;
}

export function usePressScale({
  style,
  onPressIn,
  onPressOut,
}: Pick<PressableProps, "style" | "onPressIn" | "onPressOut">) {
  const motion = useMotion();
  const pressed = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ scale: 1 - (1 - PRESSED_SCALE) * pressed.value }] };
  });
  const scales = !motion.reduced && typeof style !== "function";

  return {
    style: scales ? [pressStyle, style] : style,
    onPressIn: (event: GestureResponderEvent) => {
      if (scales) pressed.value = withTiming(1, motion.timing("fast"));
      onPressIn?.(event);
    },
    onPressOut: (event: GestureResponderEvent) => {
      if (scales) pressed.value = withTiming(0, motion.timing("base"));
      onPressOut?.(event);
    },
  };
}

export function Presence({
  show = true,
  swapKey,
  enter = "fadeIn",
  exit = "fadeOut",
  className,
  children,
}: {
  show?: boolean;
  swapKey?: string;
  enter?: "fadeIn" | "popIn";
  exit?: "fadeOut" | "none";
  className?: string;
  children: ReactNode;
}) {
  const motion = useMotion();
  const settled = useSettled();
  if (!show) return null;
  return (
    <Animated.View
      key={swapKey}
      entering={settled ? motion[enter] : undefined}
      exiting={exit === "none" ? undefined : motion[exit]}
      className={className}
    >
      {children}
    </Animated.View>
  );
}

export function Fill({ percent, className }: { percent: number; className?: string }) {
  const motion = useMotion();
  const width = useSharedValue(percent);

  useEffect(() => {
    width.value = withTiming(percent, motion.timing("slow"));
  }, [percent, motion, width]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { width: `${width.value}%` };
  });

  return <Animated.View className={className} style={style} />;
}
