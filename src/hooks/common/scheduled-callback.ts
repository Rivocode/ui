"use client";

import { useEffect, useMemo } from "react";

import { debounce, throttle, type Scheduled } from "../../shared/timing";
import { useLatest } from "./latest";

export type ScheduledCallback<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
  flush: () => void;
  isPending: () => boolean;
};

function useScheduled<Args extends unknown[]>(
  schedule: typeof debounce,
  callback: (...args: Args) => void,
  wait: number,
): ScheduledCallback<Args> {
  const latest = useLatest(callback);

  const scheduled: Scheduled<Args> = useMemo(
    () => schedule((...args: Args) => latest.current(...args), wait),
    [schedule, latest, wait],
  );

  useEffect(() => () => scheduled.cancel(), [scheduled]);

  return useMemo(
    () =>
      Object.assign((...args: Args) => scheduled.run(...args), {
        cancel: scheduled.cancel,
        flush: scheduled.flush,
        isPending: scheduled.isPending,
      }),
    [scheduled],
  );
}

export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
): ScheduledCallback<Args> {
  return useScheduled(debounce, callback, wait);
}

export function useThrottledCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  wait: number,
): ScheduledCallback<Args> {
  return useScheduled(throttle, callback, wait);
}
