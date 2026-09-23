import { createElement, useReducer, useRef } from "react";

import { AccessibilityInfo } from "./react-native-mock";

type Config = Record<string, unknown>;

export const ReduceMotion = { System: "system", Always: "always", Never: "never" } as const;

export const Easing = {
  bezier: (x1: number, y1: number, x2: number, y2: number) => ({ bezier: [x1, y1, x2, y2] }),
};

export type TimingCall = { to: number; config: Config | undefined };

export const timingCalls: TimingCall[] = [];

export function withTiming(to: number, config?: Config) {
  timingCalls.push({ to, config });
  return to;
}

export function useSharedValue<T>(initial: T) {
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const ref = useRef<{ value: T } | null>(null);
  if (!ref.current) {
    let current = initial;
    ref.current = {
      get value() {
        return current;
      },
      set value(next: T) {
        current = next;
        rerender();
      },
    };
  }
  return ref.current;
}

export function useAnimatedStyle<T>(worklet: () => T): T {
  return worklet();
}

export function useReducedMotion() {
  return AccessibilityInfo.reduceMotionNow;
}

export type LayoutBuilder = {
  preset: string;
  config: Config;
  duration: (value: number) => LayoutBuilder;
  easing: (value: unknown) => LayoutBuilder;
  reduceMotion: (value: unknown) => LayoutBuilder;
};

function builder(preset: string, config: Config = {}): LayoutBuilder {
  const next = (key: string) => (value: unknown) => builder(preset, { ...config, [key]: value });
  return {
    preset,
    config,
    duration: next("duration"),
    easing: next("easing"),
    reduceMotion: next("reduceMotion"),
  };
}

export const FadeIn = builder("FadeIn");
export const FadeOut = builder("FadeOut");
export const FadeInDown = builder("FadeInDown");
export const FadeOutDown = builder("FadeOutDown");
export const LinearTransition = builder("LinearTransition");

const View = (props: Record<string, unknown>) => createElement("View", props);
View.displayName = "Animated.View";

export const createAnimatedComponent = <T,>(component: T): T => component;

const Animated = { View, createAnimatedComponent };

export default Animated;
