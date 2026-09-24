import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, create } from "react-test-renderer";

import * as native from "../src";
import {
  useCounter,
  useDebouncedCallback,
  useDebouncedValue,
  useDisclosure,
  useInterval,
  useIsFirstRender,
  useListState,
  usePrevious,
  useSetState,
  useThrottledCallback,
  useTimeout,
  useToggle,
} from "../src";

function renderHook<Props, Result>(hook: (props: Props) => Result, initialProps: Props) {
  const result = { current: undefined as Result };
  function Probe({ props }: { props: Props }) {
    result.current = hook(props);
    return null;
  }
  let renderer!: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Probe props={initialProps} />);
  });
  return {
    result,
    rerender: (props: Props) => act(() => renderer.update(<Probe props={props} />)),
    unmount: () => act(() => renderer.unmount()),
  };
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("os hooks que atravessam para o nativo", () => {
  test("a raiz do nativo exporta os doze, e nenhum hook de navegador", () => {
    const exported = Object.keys(native).filter((name) => /^use[A-Z]/.test(name));
    for (const name of [
      "useCounter",
      "useDebouncedCallback",
      "useDebouncedValue",
      "useDisclosure",
      "useInterval",
      "useIsFirstRender",
      "useListState",
      "usePrevious",
      "useSetState",
      "useThrottledCallback",
      "useTimeout",
      "useToggle",
    ]) {
      expect(exported).toContain(name);
    }
    for (const name of ["useLocalStorage", "useHotkeys", "useClickOutside", "useNetworkStatus"]) {
      expect(exported).not.toContain(name);
    }
  });

  test("estado: disclosure, counter, toggle, lista, setState e previous", () => {
    const { result, rerender } = renderHook(
      (value: number) => ({
        disclosure: useDisclosure(),
        counter: useCounter(0, { max: 2 }),
        toggle: useToggle(["a", "b"] as const),
        list: useListState([1, 2, 3]),
        state: useSetState({ page: 1, query: "" }),
        previous: usePrevious(value),
        first: useIsFirstRender(),
      }),
      10,
    );
    expect(result.current.first).toBe(true);

    act(() => {
      result.current.disclosure[1].toggle();
      result.current.counter[1].increment();
      result.current.toggle[1]();
      result.current.list[1].reorder({ from: 0, to: 2 });
      result.current.state[1]({ query: "nota" });
    });
    act(() => result.current.counter[1].set(9));
    rerender(20);

    expect(result.current.disclosure[0]).toBe(true);
    expect(result.current.counter[0]).toBe(2);
    expect(result.current.toggle[0]).toBe("b");
    expect(result.current.list[0]).toEqual([2, 3, 1]);
    expect(result.current.state[0]).toEqual({ page: 1, query: "nota" });
    expect(result.current.previous).toBe(10);
    expect(result.current.first).toBe(false);
  });

  test("tempo: debounce, throttle, interval e timeout limpam no desmonte", () => {
    const debounced = mock(() => {});
    const throttled = mock(() => {});
    const tick = mock(() => {});
    const done = mock(() => {});
    const { result, rerender, unmount } = renderHook(
      (value: string) => ({
        value: useDebouncedValue(value, 100)[0],
        debounced: useDebouncedCallback(debounced, 100),
        throttled: useThrottledCallback(throttled, 100),
        interval: useInterval(tick, 50),
        timeout: useTimeout(done, 1000),
      }),
      "a",
    );

    rerender("ab");
    act(() => {
      result.current.debounced();
      result.current.throttled();
      result.current.throttled();
    });
    act(() => void jest.advanceTimersByTime(100));

    expect(result.current.value).toBe("ab");
    expect(debounced).toHaveBeenCalledTimes(1);
    expect(throttled).toHaveBeenCalledTimes(2);
    expect(tick).toHaveBeenCalledTimes(2);
    expect(done).not.toHaveBeenCalled();

    act(() => result.current.debounced());
    act(() => result.current.throttled());
    unmount();
    act(() => void jest.advanceTimersByTime(2000));
    expect(debounced).toHaveBeenCalledTimes(1);
    expect(throttled).toHaveBeenCalledTimes(2);
    expect(tick).toHaveBeenCalledTimes(2);
    expect(done).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
