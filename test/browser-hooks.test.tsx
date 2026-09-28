import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useEffect, useState } from "react";

import {
  Clipboard,
  RivoProvider,
  useClickOutside,
  useClipboard,
  useDocumentTitle,
  useElementSize,
  useHotkeys,
  useIdle,
  useInfiniteScroll,
  useIntersection,
  useLocalStorage,
  useNetworkStatus,
  useReducedMotion,
  useSessionStorage,
} from "../src";
import { isApple, isTypingTarget, matchesHotkey, parseHotkey } from "../src/lib/hotkey";

function withoutDom<T>(run: () => T): T {
  const names = ["window", "document", "navigator", "localStorage", "sessionStorage"] as const;
  const saved = names.map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );
  for (const name of names) delete (globalThis as Record<string, unknown>)[name];
  try {
    return run();
  } finally {
    for (const [name, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    }
  }
}

describe("useLocalStorage e useSessionStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test("le o padrao, grava em JSON e remove", () => {
    const { result } = renderHook(() =>
      useLocalStorage({ key: "filtros", defaultValue: { page: 1 } }),
    );
    expect(result.current[0]).toEqual({ page: 1 });

    act(() => result.current[1]({ page: 3 }));
    expect(result.current[0]).toEqual({ page: 3 });
    expect(localStorage.getItem("filtros")).toBe('{"page":3}');

    act(() => result.current[1]((current) => ({ page: current.page + 1 })));
    expect(result.current[0]).toEqual({ page: 4 });

    act(() => result.current[2]());
    expect(localStorage.getItem("filtros")).toBeNull();
    expect(result.current[0]).toEqual({ page: 1 });
  });

  test("duas chamadas com a mesma chave andam juntas na mesma aba", () => {
    const { result } = renderHook(() => ({
      one: useLocalStorage({ key: "tema", defaultValue: "claro" }),
      other: useLocalStorage({ key: "tema", defaultValue: "claro" }),
    }));
    act(() => result.current.one[1]("escuro"));
    expect(result.current.other[0]).toBe("escuro");
  });

  test("o evento storage de outra aba atualiza o valor", () => {
    const { result } = renderHook(() => useLocalStorage({ key: "tema", defaultValue: "claro" }));

    localStorage.setItem("tema", '"escuro"');
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "tema",
          newValue: '"escuro"',
          storageArea: localStorage,
        }),
      );
    });
    expect(result.current[0]).toBe("escuro");
  });

  test("valor gravado que nao se le cai no padrao, sem lancar", () => {
    localStorage.setItem("quebrado", "{nao e json");
    const { result } = renderHook(() => useLocalStorage({ key: "quebrado", defaultValue: 7 }));
    expect(result.current[0]).toBe(7);
  });

  test("armazenamento que lanca nao derruba a tela, e o valor segue em memoria", () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("QuotaExceededError");
    };
    try {
      const { result } = renderHook(() => useLocalStorage({ key: "cheio", defaultValue: 0 }));
      act(() => result.current[1](5));
      expect(result.current[0]).toBe(5);
    } finally {
      Storage.prototype.setItem = original;
    }
    const { result } = renderHook(() => useLocalStorage({ key: "cheio", defaultValue: 0 }));
    act(() => result.current[2]());
    expect(result.current[0]).toBe(0);
  });

  test("a sessao usa o sessionStorage, e nao o local", () => {
    const { result } = renderHook(() => useSessionStorage({ key: "passo", defaultValue: 1 }));
    act(() => result.current[1](2));
    expect(sessionStorage.getItem("passo")).toBe("2");
    expect(localStorage.getItem("passo")).toBeNull();
  });

  test("padrao escrito como literal nao muda de identidade a cada render", () => {
    let effects = 0;
    function Probe() {
      const [value] = useLocalStorage({ key: "vazia", defaultValue: { page: 1 } });
      const [, setCount] = useState(0);
      useEffect(() => {
        effects += 1;
        if (effects < 10) setCount((count) => count + 1);
      }, [value]);
      return null;
    }
    render(<Probe />);
    expect(effects).toBe(1);
  });

  test("o setter com funcao parte do padrao inicial, e o setter e estavel", () => {
    const { result, rerender } = renderHook(() =>
      useSessionStorage({ key: "vazia", defaultValue: { page: 1 } }),
    );
    const [first, setter] = result.current;
    rerender();
    expect(result.current[0]).toBe(first);
    expect(result.current[1]).toBe(setter);
    act(() => result.current[1]((current) => ({ page: current.page + 1 })));
    expect(result.current[0]).toEqual({ page: 2 });
  });

  test("desmontar tira a escuta da janela", () => {
    const removed: string[] = [];
    const original = window.removeEventListener.bind(window);
    window.removeEventListener = ((...args: Parameters<typeof window.removeEventListener>) => {
      removed.push(args[0]);
      return original(...args);
    }) as typeof window.removeEventListener;
    try {
      const { unmount } = renderHook(() => useLocalStorage({ key: "x", defaultValue: 0 }));
      unmount();
    } finally {
      window.removeEventListener = original;
    }
    expect(removed).toContain("storage");
  });
});

describe("no servidor, sem window", () => {
  test("os hooks de navegador renderizam o padrao e nao tocam o DOM", () => {
    function Probe() {
      const [theme] = useLocalStorage({ key: "tema", defaultValue: "claro" });
      const [step] = useSessionStorage({ key: "passo", defaultValue: 1 });
      const { online } = useNetworkStatus();
      const reduced = useReducedMotion();
      const idle = useIdle(1000);
      const size = useElementSize();
      const { entry } = useIntersection();
      const { sentinelRef } = useInfiniteScroll({
        onLoadMore: () => {},
        hasMore: true,
        loading: false,
      });
      const outside = useClickOutside<HTMLParagraphElement>(() => {});
      const { copied } = useClipboard();
      useHotkeys([["mod+k", () => {}]]);
      useDocumentTitle("Faturas");
      return (
        <p ref={outside}>
          {[theme, step, online, reduced, idle, size.width, entry === null, copied].join("|")}
          <span ref={sentinelRef} />
        </p>
      );
    }

    const html = withoutDom(() => {
      expect(typeof window).toBe("undefined");
      return renderToString(<Probe />);
    });
    expect(html).toContain("claro|1|true|false|false|0|true|false");
    expect(typeof window).toBe("object");
  });
});

describe("useClickOutside", () => {
  function Panel({ onOutside, enabled }: { onOutside: () => void; enabled?: boolean }) {
    const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
    const ref = useClickOutside<HTMLDivElement>(onOutside, { nodes: [trigger], enabled });
    return (
      <div>
        <button ref={setTrigger}>gatilho</button>
        <div ref={ref}>
          <button>dentro</button>
        </div>
        <button>fora</button>
      </div>
    );
  }

  test("dispara so fora do elemento e dos nos extras", () => {
    const onOutside = mock(() => {});
    render(<Panel onOutside={onOutside} />);

    fireEvent.pointerDown(screen.getByText("dentro"));
    fireEvent.pointerDown(screen.getByText("gatilho"));
    expect(onOutside).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByText("fora"));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  test("desligado ou desmontado, nao escuta", () => {
    const onOutside = mock(() => {});
    const { rerender, unmount } = render(<Panel onOutside={onOutside} enabled={false} />);
    fireEvent.pointerDown(screen.getByText("fora"));
    expect(onOutside).not.toHaveBeenCalled();

    rerender(<Panel onOutside={onOutside} />);
    unmount();
    fireEvent.pointerDown(document.body);
    expect(onOutside).not.toHaveBeenCalled();
  });
});

describe("useHotkeys", () => {
  test("mod vira Cmd no Mac e Ctrl fora dele", () => {
    expect(isApple("MacIntel")).toBe(true);
    expect(isApple("macOS")).toBe(true);
    expect(isApple("Win32")).toBe(false);
    expect(parseHotkey("mod+k", true)).toMatchObject({ key: "k", meta: true, ctrl: false });
    expect(parseHotkey("mod+k", false)).toMatchObject({ key: "k", meta: false, ctrl: true });
    expect(parseHotkey("ctrl+shift+Esc", false)).toMatchObject({
      key: "escape",
      ctrl: true,
      shift: true,
    });
    expect(parseHotkey("alt++", false)).toMatchObject({ key: "+", alt: true });
  });

  test("os modificadores precisam bater exatamente", () => {
    const hotkey = parseHotkey("mod+k", false);
    const base = {
      key: "k",
      code: "KeyK",
      altKey: false,
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    };
    expect(matchesHotkey(hotkey, base)).toBe(true);
    expect(matchesHotkey(hotkey, { ...base, shiftKey: true })).toBe(false);
    expect(matchesHotkey(hotkey, { ...base, ctrlKey: false, metaKey: true })).toBe(false);
    expect(
      matchesHotkey(parseHotkey("alt+k", false), {
        ...base,
        key: "˚",
        ctrlKey: false,
        altKey: true,
      }),
    ).toBe(true);
  });

  const press = (event: Partial<KeyboardEvent>) => ({
    key: "",
    code: "",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...event,
  });

  test("simbolo que pede shift casa pelo caractere, com o shift que o teclado exigiu", () => {
    const question = press({ key: "?", code: "Slash", shiftKey: true });
    expect(matchesHotkey(parseHotkey("?", false), question)).toBe(true);
    expect(matchesHotkey(parseHotkey("shift+/", false), question)).toBe(true);
    expect(matchesHotkey(parseHotkey("/", false), question)).toBe(false);
    expect(matchesHotkey(parseHotkey("/", false), press({ key: "/", code: "Slash" }))).toBe(true);
    expect(
      matchesHotkey(parseHotkey("mod+plus", false), press({ key: "+", code: "Equal", ctrlKey: true, shiftKey: true })),
    ).toBe(true);
    expect(
      matchesHotkey(parseHotkey("1", false), press({ key: "1", code: "Digit1", shiftKey: true })),
    ).toBe(true);
  });

  test("em letra o shift continua contando", () => {
    expect(
      matchesHotkey(parseHotkey("shift+a", false), press({ key: "A", code: "KeyA", shiftKey: true })),
    ).toBe(true);
    expect(matchesHotkey(parseHotkey("a", false), press({ key: "A", code: "KeyA", shiftKey: true }))).toBe(
      false,
    );
    expect(
      matchesHotkey(parseHotkey("space", false), press({ key: " ", code: "Space", shiftKey: true })),
    ).toBe(false);
  });

  test("a tecla fisica so vale quando o caractere nao diz qual e a tecla", () => {
    const azertyW = press({ key: "w", code: "KeyZ" });
    expect(matchesHotkey(parseHotkey("z", false), azertyW)).toBe(false);
    expect(matchesHotkey(parseHotkey("w", false), azertyW)).toBe(true);
    expect(
      matchesHotkey(parseHotkey("ctrl+c", false), press({ key: "с", code: "KeyC", ctrlKey: true })),
    ).toBe(true);
    expect(
      matchesHotkey(parseHotkey("mod+1", false), press({ key: "&", code: "Digit1", ctrlKey: true })),
    ).toBe(true);
    expect(
      matchesHotkey(parseHotkey("k", false), press({ key: "Unidentified", code: "KeyK" })),
    ).toBe(true);
    expect(
      matchesHotkey(
        parseHotkey("mod+1", false),
        press({ key: "!", code: "Digit1", ctrlKey: true, shiftKey: true }),
      ),
    ).toBe(false);
  });

  test("campo de texto e o que recebe digitacao, e caixa de marcar nao e", () => {
    const text = document.createElement("input");
    const box = document.createElement("input");
    box.type = "checkbox";
    const area = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    document.body.append(editable);
    expect(isTypingTarget(text)).toBe(true);
    expect(isTypingTarget(area)).toBe(true);
    expect(isTypingTarget(box)).toBe(false);
    expect(isTypingTarget(document.body)).toBe(false);
    editable.remove();
  });

  function Bound({ handler, ignoreFields }: { handler: () => void; ignoreFields?: boolean }) {
    useHotkeys([["ctrl+k", handler]], { ignoreFields });
    return <input aria-label="busca" />;
  }

  test("dispara no documento e ignora quem esta digitando, por padrao", () => {
    const handler = mock(() => {});
    render(<Bound handler={handler} />);

    fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(screen.getByLabelText("busca"), { key: "k", code: "KeyK", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document.body, { key: "k", code: "KeyK" });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test("com ignoreFields desligado, dispara tambem dentro do campo e previne o padrao", () => {
    const handler = mock(() => {});
    render(<Bound handler={handler} ignoreFields={false} />);
    const event = new KeyboardEvent("keydown", {
      key: "k",
      code: "KeyK",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    act(() => void screen.getByLabelText("busca").dispatchEvent(event));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  test("desmontar tira a escuta", () => {
    const handler = mock(() => {});
    const { unmount } = render(<Bound handler={handler} />);
    unmount();
    fireEvent.keyDown(document.body, { key: "k", code: "KeyK", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});

type Watched = { callback: (entries: unknown[]) => void; nodes: Element[]; disconnected: boolean };

describe("useIntersection, useInfiniteScroll e useElementSize", () => {
  const observers: Watched[] = [];
  const saved = {
    intersection: globalThis.IntersectionObserver,
    resize: globalThis.ResizeObserver,
  };

  beforeEach(() => {
    observers.length = 0;
    class FakeObserver {
      watched: Watched;
      constructor(callback: (entries: unknown[]) => void) {
        this.watched = { callback, nodes: [], disconnected: false };
        observers.push(this.watched);
      }
      observe(node: Element) {
        this.watched.nodes.push(node);
      }
      unobserve() {}
      disconnect() {
        this.watched.disconnected = true;
      }
    }
    globalThis.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver = FakeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = saved.intersection;
    globalThis.ResizeObserver = saved.resize;
  });

  const live = () => observers.filter((observer) => !observer.disconnected);

  test("useIntersection entrega a ultima entrada e desconecta no desmonte", () => {
    function Target() {
      const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 0.5 });
      return <div ref={ref}>{entry?.isIntersecting ? "visivel" : "fora"}</div>;
    }
    const { unmount } = render(<Target />);
    expect(screen.getByText("fora")).toBeDefined();
    expect(live()).toHaveLength(1);

    act(() => live()[0]!.callback([{ isIntersecting: true }]));
    expect(screen.getByText("visivel")).toBeDefined();

    unmount();
    expect(live()).toHaveLength(0);
  });

  function Feed(props: { hasMore: boolean; loading: boolean; onLoadMore: () => void }) {
    const { sentinelRef } = useInfiniteScroll(props);
    return <div ref={sentinelRef} data-testid="sentinela" />;
  }

  test("useInfiniteScroll pede mais quando a sentinela aparece, e so quando pode", () => {
    const onLoadMore = mock(() => {});
    const { rerender, unmount } = render(<Feed hasMore loading={false} onLoadMore={onLoadMore} />);
    expect(live()).toHaveLength(1);
    expect(live()[0]!.nodes[0]).toBe(screen.getByTestId("sentinela"));

    act(() => live()[0]!.callback([{ isIntersecting: false }]));
    expect(onLoadMore).not.toHaveBeenCalled();
    act(() => live()[0]!.callback([{ isIntersecting: true }]));
    expect(onLoadMore).toHaveBeenCalledTimes(1);

    rerender(<Feed hasMore loading onLoadMore={onLoadMore} />);
    expect(live()).toHaveLength(0);

    rerender(<Feed hasMore={false} loading={false} onLoadMore={onLoadMore} />);
    expect(live()).toHaveLength(0);

    rerender(<Feed hasMore loading={false} onLoadMore={onLoadMore} />);
    expect(live()).toHaveLength(1);

    unmount();
    expect(live()).toHaveLength(0);
  });

  test("useElementSize mede pelo ResizeObserver e desconecta no desmonte", () => {
    function Box() {
      const { ref, width, height } = useElementSize<HTMLDivElement>();
      return <div ref={ref}>{`${width}x${height}`}</div>;
    }
    const { unmount } = render(<Box />);
    expect(screen.getByText("0x0")).toBeDefined();

    act(() => live()[0]!.callback([{ contentRect: { width: 320, height: 180 } }]));
    expect(screen.getByText("320x180")).toBeDefined();

    unmount();
    expect(live()).toHaveLength(0);
  });

  test("sem os observers no ambiente, nada quebra", () => {
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    function Both() {
      const { ref } = useElementSize<HTMLDivElement>();
      const { sentinelRef } = useInfiniteScroll({
        onLoadMore: () => {},
        hasMore: true,
        loading: false,
      });
      return (
        <div ref={ref}>
          <span ref={sentinelRef}>ok</span>
        </div>
      );
    }
    render(<Both />);
    expect(screen.getByText("ok")).toBeDefined();
  });
});

describe("useClipboard", () => {
  const settle = () => act(async () => void (await Promise.resolve()));

  test("copied liga ao copiar e volta sozinho", async () => {
    const written: string[] = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (text: string) => void written.push(text) },
    });
    const { result } = renderHook(() => useClipboard({ timeout: 20 }));

    let ok = false;
    await act(async () => {
      ok = await result.current.copy("4813");
    });
    expect(ok).toBe(true);
    expect(written).toEqual(["4813"]);
    expect(result.current.copied).toBe(true);

    await act(() => new Promise((resolve) => setTimeout(resolve, 40)));
    expect(result.current.copied).toBe(false);
  });

  test("falha devolve false e guarda o erro, sem ligar copied", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("negado");
        },
      },
    });
    const { result } = renderHook(() => useClipboard());
    let ok = true;
    await act(async () => {
      ok = await result.current.copy("x");
    });
    expect(ok).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error?.message).toBe("negado");

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
    await settle();
  });

  test("desmontar limpa o timer da confirmacao", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => {} },
    });
    const cleared: unknown[] = [];
    const original = globalThis.clearTimeout;
    globalThis.clearTimeout = ((id?: Parameters<typeof clearTimeout>[0]) => {
      cleared.push(id);
      return original(id);
    }) as typeof clearTimeout;
    try {
      const { result, unmount } = renderHook(() => useClipboard({ timeout: 5000 }));
      await act(async () => void (await result.current.copy("x")));
      const before = cleared.length;
      unmount();
      expect(cleared.length).toBeGreaterThan(before);
    } finally {
      globalThis.clearTimeout = original;
    }
  });

  test("a peca Clipboard continua avisando onCopy so quando copiou", async () => {
    const onCopy = mock((value: string) => void value);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("negado");
        },
      },
    });
    render(
      <RivoProvider scope="local">
        <Clipboard value="1" onCopy={onCopy} />
      </RivoProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await settle();
    expect(onCopy).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Copiar" })).toBeDefined();
  });
});

describe("useDocumentTitle, useNetworkStatus e useReducedMotion", () => {
  test("o titulo muda, ignora vazio e so volta se pedido", () => {
    document.title = "Antes";
    const { rerender, unmount } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: "Faturas" },
    });
    expect(document.title).toBe("Faturas");
    rerender({ title: "  " });
    expect(document.title).toBe("Faturas");
    unmount();
    expect(document.title).toBe("Faturas");

    document.title = "Antes";
    const restoring = renderHook(() => useDocumentTitle("Notas", { restoreOnUnmount: true }));
    expect(document.title).toBe("Notas");
    restoring.unmount();
    expect(document.title).toBe("Antes");
  });

  test("a rede segue os eventos online e offline", () => {
    let online = true;
    Object.defineProperty(navigator, "onLine", { configurable: true, get: () => online });
    const { result, unmount } = renderHook(() => useNetworkStatus());
    expect(result.current.online).toBe(true);

    online = false;
    act(() => void window.dispatchEvent(new Event("offline")));
    expect(result.current.online).toBe(false);

    online = true;
    act(() => void window.dispatchEvent(new Event("online")));
    expect(result.current.online).toBe(true);
    unmount();
  });

  test("movimento reduzido le a media query do sistema", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;
    try {
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(true);
    } finally {
      window.matchMedia = original;
    }
  });
});
