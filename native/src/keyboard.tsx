import { useContext, type ReactNode } from "react";
import {
  KeyboardContext,
  KeyboardProvider,
  useKeyboardHandler,
  useReanimatedKeyboardAnimation,
} from "react-native-keyboard-controller";
import type { LayoutChangeEvent } from "react-native";
import Animated, { isSharedValue, useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { useMotion } from "./motion";

export function KeyboardRoot({ children }: { children: ReactNode }) {
  const outer = useContext(KeyboardContext);
  if (isSharedValue(outer.reanimated.height)) return <>{children}</>;
  return <KeyboardProvider>{children}</KeyboardProvider>;
}

export function useKeyboardLift() {
  const { reduced } = useMotion();
  const { height } = useReanimatedKeyboardAnimation();
  const landed = useSharedValue(0);

  useKeyboardHandler(
    {
      onStart: (event) => {
        "worklet";
        landed.value = event.height;
      },
      onInteractive: (event) => {
        "worklet";
        landed.value = event.height;
      },
      onEnd: (event) => {
        "worklet";
        landed.value = event.height;
      },
    },
    [],
  );

  return { reduced, height, landed };
}

export function useKeyboardPadding() {
  const { reduced, height, landed } = useKeyboardLift();
  return useAnimatedStyle(() => {
    "worklet";
    return { paddingBottom: reduced ? landed.value : Math.max(0, -height.value) };
  }, [reduced]);
}

function useKeyboardRise() {
  const { reduced, height, landed } = useKeyboardLift();
  return useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ translateY: reduced ? -landed.value : Math.min(0, height.value) }] };
  }, [reduced]);
}

export function KeyboardRiser({
  className,
  onLayout,
  children,
}: {
  className?: string;
  onLayout?: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const rise = useKeyboardRise();
  return (
    <Animated.View style={rise} onLayout={onLayout} className={className}>
      {children}
    </Animated.View>
  );
}
