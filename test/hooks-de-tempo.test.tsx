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

describe("debounce e throttle puros", () => {
  test("debounce roda uma vez so, com o ultimo argumento", () => {
    const seen: number[] = [];
    const scheduled = debounce((value: number) => seen.push(value), 100);
    scheduled.run(1);
    scheduled.run(2);
    expect(scheduled.isPending()).toBe(true);
    jest.advanceTimersByTime(100);
    expect(seen).toEqual([2]);
    expect(scheduled.isPending()).toBe(false);
  });

  test("debounce: flush roda ja, e cancel descarta", () => {
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

  test("throttle roda na hora, segura o resto e entrega o ultimo no fim da janela", () => {
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

  test("throttle: flush entrega o que esperava, e cancel descarta", () => {
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
  test("so assenta depois da pausa, e cancel segura o valor de antes", () => {
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

  test("desmontar limpa o timer", () => {
    const { unmount, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useDebouncedCallback e useThrottledCallback", () => {
  test("o debounce chama a funcao mais nova, uma vez", () => {
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

  test("a funcao devolvida e estavel entre renders com o mesmo wait", () => {
    const { result, rerender } = renderHook(() => useDebouncedCallback(() => {}, 100));
    const before = result.current;
    rerender();
    expect(result.current).toBe(before);
  });

  test("desmontar cancela o que estava agendado", () => {
    const callback = mock(() => {});
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 100));
    act(() => result.current());
    expect(result.current.isPending()).toBe(true);
    unmount();
    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
  });

  test("o throttle entrega o primeiro na hora e o ultimo no fim da janela", () => {
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

describe("useInterval e useTimeout", () => {
  test("o intervalo repete, pausa com null e para no desmonte", () => {
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

  test("o intervalo chama a funcao mais nova sem reiniciar a contagem", () => {
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

  test("o timeout roda uma vez, clear cancela e reset recomeca", () => {
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

  test("com null o timeout nao agenda nada", () => {
    const done = mock(() => {});
    renderHook(() => useTimeout(done, null));
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useIdle", () => {
  test("fica ocioso depois do prazo, e qualquer atividade acorda", () => {
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

  test("desmontar tira a escuta da janela", () => {
    const { unmount } = renderHook(() => useIdle(1000));
    unmount();
    fireEvent.keyDown(window, { key: "a" });
    expect(jest.getTimerCount()).toBe(0);
  });
});
