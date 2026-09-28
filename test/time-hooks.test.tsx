import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, fireEvent, renderHook } from "@testing-library/react";

import {
  useDebouncedCallback,
  useDebouncedValue,
  useIdle,
  useInterval,
  useThrottledCallback,
  useTimeout,
} from "../src";
import { debounce, throttle } from "../src/shared/timing";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

const advance = (ms: number) => act(() => void jest.advanceTimersByTime(ms));

describe("pure debounce and throttle", () => {
  test("debounce runs only once, with the last argument", () => {
    const seen: number[] = [];
    const scheduled = debounce((value: number) => seen.push(value), 100);
    scheduled.run(1);
    scheduled.run(2);
    expect(scheduled.isPending()).toBe(true);
    jest.advanceTimersByTime(100);
    expect(seen).toEqual([2]);
    expect(scheduled.isPending()).toBe(false);
  });

  test("debounce: flush runs now, and cancel discards", () => {
    const seen: number[] = [];
    const scheduled = debounce((value: number) => seen.push(value), 100);
    scheduled.run(1);
    scheduled.flush();
    expect(seen).toEqual([1]);
    scheduled.run(2);
    scheduled.cancel();
    jest.advanceTimersByTime(500);
    expect(seen).toEqual([1]);
  });

  test("throttle runs immediately, holds the rest and delivers the last one at the end of the window", () => {
    const seen: number[] = [];
    const scheduled = throttle((value: number) => seen.push(value), 100);
    scheduled.run(1);
    scheduled.run(2);
    scheduled.run(3);
    expect(seen).toEqual([1]);
    jest.advanceTimersByTime(100);
    expect(seen).toEqual([1, 3]);
    scheduled.run(4);
    expect(seen).toEqual([1, 3]);
    jest.advanceTimersByTime(100);
    expect(seen).toEqual([1, 3, 4]);
    jest.advanceTimersByTime(100);
    scheduled.run(5);
    expect(seen).toEqual([1, 3, 4, 5]);
  });

  test("throttle: flush delivers what was waiting, and cancel discards", () => {
    const seen: number[] = [];
    const scheduled = throttle((value: number) => seen.push(value), 100);
    scheduled.run(1);
    scheduled.run(2);
    scheduled.flush();
    expect(seen).toEqual([1, 2]);
    scheduled.run(3);
    scheduled.run(4);
    scheduled.cancel();
    jest.advanceTimersByTime(500);
    expect(seen).toEqual([1, 2, 3]);
  });
});

describe("useDebouncedValue", () => {
  test("settles only after the pause, and cancel keeps the previous value", () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: "a" },
    });

    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current[0]).toBe("a");
    advance(199);
    expect(result.current[0]).toBe("a");
    advance(1);
    expect(result.current[0]).toBe("abc");

    rerender({ value: "abcd" });
    act(() => result.current[1]());
    advance(500);
    expect(result.current[0]).toBe("abc");
  });

  test("unmounting clears the timer", () => {
    const { unmount, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useDebouncedCallback and useThrottledCallback", () => {
  test("debounce calls the newest function, once", () => {
    const first = mock((value: string) => void value);
    const second = mock((value: string) => void value);
    const { result, rerender } = renderHook(({ callback }) => useDebouncedCallback(callback, 100), {
      initialProps: { callback: first },
    });

    act(() => result.current("a"));
    act(() => result.current("b"));
    rerender({ callback: second });
    advance(100);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith("b");
  });

  test("the returned function is stable across renders with the same wait", () => {
    const { result, rerender } = renderHook(() => useDebouncedCallback(() => {}, 100));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });

  test("unmounting cancels what was scheduled", () => {
    const callback = mock(() => {});
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 100));
    act(() => result.current());
    expect(result.current.isPending()).toBe(true);
    unmount();
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });

  test("throttle delivers the first one immediately and the last one at the end of the window", () => {
    const callback = mock((value: number) => void value);
    const { result, unmount } = renderHook(() => useThrottledCallback(callback, 100));

    act(() => {
      result.current(1);
      result.current(2);
      result.current(3);
    });
    expect(callback.mock.calls).toEqual([[1]]);
    advance(100);
    expect(callback.mock.calls).toEqual([[1], [3]]);

    act(() => result.current(4));
    act(() => result.current(5));
    unmount();
    jest.advanceTimersByTime(500);
    expect(callback.mock.calls).toEqual([[1], [3]]);
  });
});

describe("changing wait with a pending call", () => {
  test("debounce delivers the pending call, and the returned function stays the same", () => {
    const callback = mock((value: string) => void value);
    const { result, rerender } = renderHook(({ wait }) => useDebouncedCallback(callback, wait), {
      initialProps: { wait: 100 },
    });
    const before = result.current;

    act(() => result.current("a"));
    rerender({ wait: 300 });
    expect(result.current).toBe(before);
    expect(result.current.isPending()).toBe(true);
    advance(100);
    expect(callback.mock.calls).toEqual([["a"]]);

    act(() => result.current("b"));
    advance(299);
    expect(callback).toHaveBeenCalledTimes(1);
    advance(1);
    expect(callback.mock.calls).toEqual([["a"], ["b"]]);
  });

  test("throttle delivers the waiting call at the end of the window, and the next window uses the new wait", () => {
    const callback = mock((value: number) => void value);
    const { result, rerender } = renderHook(({ wait }) => useThrottledCallback(callback, wait), {
      initialProps: { wait: 100 },
    });

    act(() => {
      result.current(1);
      result.current(2);
    });
    rerender({ wait: 300 });
    expect(result.current.isPending()).toBe(true);
    advance(100);
    expect(callback.mock.calls).toEqual([[1], [2]]);

    act(() => result.current(3));
    advance(299);
    expect(callback.mock.calls).toEqual([[1], [2]]);
    advance(1);
    expect(callback.mock.calls).toEqual([[1], [2], [3]]);
  });

  test("unmounting after changing wait still cancels", () => {
    const callback = mock(() => {});
    const { result, rerender, unmount } = renderHook(
      ({ wait }) => useDebouncedCallback(callback, wait),
      { initialProps: { wait: 100 } },
    );
    act(() => result.current());
    rerender({ wait: 50 });
    unmount();
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useInterval and useTimeout", () => {
  test("the interval repeats, pauses with null and stops on unmount", () => {
    const tick = mock(() => {});
    const { rerender, unmount } = renderHook(({ delay }) => useInterval(tick, delay), {
      initialProps: { delay: 100 as number | null },
    });

    advance(350);
    expect(tick).toHaveBeenCalledTimes(3);

    rerender({ delay: null });
    advance(500);
    expect(tick).toHaveBeenCalledTimes(3);

    rerender({ delay: 100 });
    advance(100);
    expect(tick).toHaveBeenCalledTimes(4);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("the interval calls the newest function without restarting the count", () => {
    const first = mock(() => {});
    const second = mock(() => {});
    const { rerender } = renderHook(({ callback }) => useInterval(callback, 100), {
      initialProps: { callback: first },
    });
    advance(60);
    rerender({ callback: second });
    advance(40);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("the timeout runs once, clear cancels and reset restarts", () => {
    const done = mock(() => {});
    const { result, unmount } = renderHook(() => useTimeout(done, 100));

    advance(100);
    expect(done).toHaveBeenCalledTimes(1);
    advance(500);
    expect(done).toHaveBeenCalledTimes(1);

    act(() => result.current.reset());
    act(() => result.current.clear());
    advance(500);
    expect(done).toHaveBeenCalledTimes(1);

    act(() => result.current.reset());
    advance(100);
    expect(done).toHaveBeenCalledTimes(2);

    act(() => result.current.reset());
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("with null the timeout schedules nothing", () => {
    const done = mock(() => {});
    renderHook(() => useTimeout(done, null));
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useIdle", () => {
  test("becomes idle after the timeout, and any activity wakes it", () => {
    const { result, unmount } = renderHook(() => useIdle(1000));
    expect(result.current).toBe(false);

    advance(1000);
    expect(result.current).toBe(true);

    act(() => void fireEvent.keyDown(window, { key: "a" }));
    expect(result.current).toBe(false);
    advance(999);
    expect(result.current).toBe(false);
    advance(1);
    expect(result.current).toBe(true);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  test("unmounting removes the window listener", () => {
    const { unmount } = renderHook(() => useIdle(1000));
    unmount();
    fireEvent.keyDown(window, { key: "a" });
    expect(jest.getTimerCount()).toBe(0);
  });
});
