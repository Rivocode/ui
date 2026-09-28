import { describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";

import {
  useCounter,
  useDisclosure,
  useIsFirstRender,
  useListState,
  useMounted,
  usePrevious,
  useSetState,
  useToggle,
} from "../src";
import {
  appendItems,
  insertItems,
  removeItems,
  reorderItems,
  replaceItem,
  swapItems,
} from "../src/shared/list";
import { clampCount, mergeState, nextOption } from "../src/shared/state";

describe("useDisclosure", () => {
  test("opens, closes and toggles, and only notifies on state transitions", () => {
    const onOpen = mock(() => {});
    const onClose = mock(() => {});
    const { result } = renderHook(() => useDisclosure(false, { onOpen, onClose }));

    expect(result.current[0]).toBe(false);
    act(() => result.current[1].open());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1].open());
    expect(onOpen).toHaveBeenCalledTimes(1);

    act(() => result.current[1].toggle());
    expect(result.current[0]).toBe(false);
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => result.current[1].close());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("respects the initial state", () => {
    const { result } = renderHook(() => useDisclosure(true));
    expect(result.current[0]).toBe(true);
  });

  test("two calls in the same act read the state from the first, and not the render's", () => {
    const onOpen = mock(() => {});
    const onClose = mock(() => {});
    const { result } = renderHook(() => useDisclosure(false, { onOpen, onClose }));

    act(() => {
      result.current[1].toggle();
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      result.current[1].open();
      result.current[1].open();
    });
    expect(result.current[0]).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  test("the handlers are the same across renders, opening or closing", () => {
    const { result } = renderHook(() => useDisclosure(false, { onOpen: () => {} }));
    const before = result.current[1];
    act(() => result.current[1].open());
    expect(result.current[1]).toBe(before);
  });

  test("the onOpen called is the one from the newest render", () => {
    const first = mock(() => {});
    const second = mock(() => {});
    const { result, rerender } = renderHook(({ onOpen }) => useDisclosure(false, { onOpen }), {
      initialProps: { onOpen: first },
    });
    rerender({ onOpen: second });
    act(() => result.current[1].open());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("useCounter", () => {
  test("moves by step and stops at the floor and ceiling", () => {
    const { result } = renderHook(() => useCounter(1, { min: 0, max: 3, step: 2 }));

    act(() => result.current[1].increment());
    expect(result.current[0]).toBe(3);
    act(() => result.current[1].increment());
    expect(result.current[0]).toBe(3);
    act(() => result.current[1].decrement());
    act(() => result.current[1].decrement());
    expect(result.current[0]).toBe(0);
    act(() => result.current[1].set(99));
    expect(result.current[0]).toBe(3);
    act(() => result.current[1].reset());
    expect(result.current[0]).toBe(1);
  });

  test("an initial value outside the range starts clamped to it", () => {
    const { result } = renderHook(() => useCounter(10, { max: 5 }));
    expect(result.current[0]).toBe(5);
  });

  test("clampCount without limits returns the value itself", () => {
    expect(clampCount(-7)).toBe(-7);
    expect(clampCount(4, 5, 9)).toBe(5);
  });
});

describe("useToggle", () => {
  test("without options, toggles between false and true", () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
    act(() => result.current[1](true));
    expect(result.current[0]).toBe(true);
  });

  test("with options, cycles through them and accepts an explicit value", () => {
    const options = ["claro", "escuro", "sistema"] as const;
    const { result } = renderHook(() => useToggle(options));

    act(() => result.current[1]());
    expect(result.current[0]).toBe("escuro");
    act(() => result.current[1]());
    act(() => result.current[1]());
    expect(result.current[0]).toBe("claro");
    act(() => result.current[1]("sistema"));
    expect(result.current[0]).toBe("sistema");
  });

  test("an argument that is not an option, like an onClick event, just toggles", () => {
    const { result } = renderHook(() => useToggle());
    const toggle = result.current[1] as (value?: unknown) => void;
    act(() => toggle({ type: "click" }));
    expect(result.current[0]).toBe(true);
  });

  test("nextOption goes back to the start after the last one", () => {
    expect(nextOption(["a", "b"], "b")).toBe("a");
  });

  test("nextOption without options returns the current value, and not undefined", () => {
    expect(nextOption([], "a")).toBe("a");
    expect(nextOption<number>([], 0)).toBe(0);
  });
});

describe("useListState", () => {
  test("each operation returns a new list, without touching the previous one", () => {
    const { result } = renderHook(() => useListState(["a", "b", "c"]));
    const before = result.current[0];

    act(() => result.current[1].append("d", "e"));
    expect(result.current[0]).toEqual(["a", "b", "c", "d", "e"]);
    expect(before).toEqual(["a", "b", "c"]);
    expect(result.current[0]).not.toBe(before);

    act(() => result.current[1].prepend("z"));
    expect(result.current[0]).toEqual(["z", "a", "b", "c", "d", "e"]);

    act(() => result.current[1].remove(0, 5));
    expect(result.current[0]).toEqual(["a", "b", "c", "d"]);

    act(() => result.current[1].reorder({ from: 0, to: 3 }));
    expect(result.current[0]).toEqual(["b", "c", "d", "a"]);

    act(() => result.current[1].swap({ from: 0, to: 3 }));
    expect(result.current[0]).toEqual(["a", "c", "d", "b"]);

    act(() => result.current[1].insert(1, "x"));
    expect(result.current[0]).toEqual(["a", "x", "c", "d", "b"]);

    act(() => result.current[1].replace(1, "y"));
    expect(result.current[0]).toEqual(["a", "y", "c", "d", "b"]);

    act(() =>
      result.current[1].update(
        (item) => item.toUpperCase(),
        (item) => item !== "y",
      ),
    );
    expect(result.current[0]).toEqual(["A", "y", "C", "D", "B"]);

    act(() => result.current[1].filter((item) => item !== "y"));
    expect(result.current[0]).toEqual(["A", "C", "D", "B"]);

    act(() => result.current[1].set([]));
    expect(result.current[0]).toEqual([]);
  });

  test("the handlers are the same across renders", () => {
    const { result, rerender } = renderHook(() => useListState<number>());
    const first = result.current[1];
    rerender();
    expect(result.current[1]).toBe(first);
  });

  test("an index outside the list breaks nothing", () => {
    const list = Object.freeze([1, 2, 3]);
    expect(reorderItems(list, 0, 9)).toEqual([1, 2, 3]);
    expect(swapItems(list, -1, 2)).toEqual([1, 2, 3]);
    expect(replaceItem(list, 7, 0)).toEqual([1, 2, 3]);
    expect(removeItems(list, [8])).toEqual([1, 2, 3]);
    expect(insertItems(list, 99, [4])).toEqual([1, 2, 3, 4]);
    expect(appendItems(list, [])).not.toBe(list);
  });

  test("insertItems with a non-number index puts at the end, and a fraction rounds down", () => {
    const list = Object.freeze([1, 2, 3]);
    expect(insertItems(list, Number.NaN, [4])).toEqual([1, 2, 3, 4]);
    expect(insertItems(list, Number.POSITIVE_INFINITY, [4])).toEqual([1, 2, 3, 4]);
    expect(insertItems(list, Number.NEGATIVE_INFINITY, [4])).toEqual([4, 1, 2, 3]);
    expect(insertItems(list, 1.7, [4])).toEqual([1, 4, 2, 3]);
  });
});

describe("useSetState", () => {
  test("merges the partial instead of replacing", () => {
    const { result } = renderHook(() => useSetState({ page: 1, query: "", open: false }));

    act(() => result.current[1]({ query: "nota" }));
    expect(result.current[0]).toEqual({ page: 1, query: "nota", open: false });

    act(() => result.current[1]((current) => ({ page: current.page + 1 })));
    expect(result.current[0]).toEqual({ page: 2, query: "nota", open: false });
  });

  test("mergeState does not mutate the previous object", () => {
    const before: { a: number; b: number } = Object.freeze({ a: 1, b: 2 });
    expect(mergeState(before, { b: 3 })).toEqual({ a: 1, b: 3 });
  });
});

describe("usePrevious", () => {
  test("returns the previous different value, and not the previous render's", () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 1 },
    });
    expect(result.current).toBeUndefined();

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(1);

    rerender({ value: 5 });
    expect(result.current).toBe(2);
  });
});

describe("useIsFirstRender and useMounted", () => {
  test("useIsFirstRender is true only on the first render", () => {
    const { result, rerender } = renderHook(() => useIsFirstRender());
    expect(result.current).toBe(true);
    rerender();
    expect(result.current).toBe(false);
  });

  test("useMounted becomes true after mount", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });

  test("on the server, useMounted is false and useIsFirstRender is true", () => {
    function Probe() {
      const mounted = useMounted();
      const first = useIsFirstRender();
      return <p>{`${mounted}-${first}`}</p>;
    }
    expect(renderToString(<Probe />)).toContain("false-true");
  });
});
