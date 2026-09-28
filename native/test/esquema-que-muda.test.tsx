import { afterEach, describe, expect, test } from "bun:test";
import { Platform } from "react-native";
import type { ReactTestRenderer } from "react-test-renderer";

import { useRivo, type RivoNativeColors } from "../src";
import { act, render } from "./helpers";

const DAY = "rgb(1, 2, 3)";
const NIGHT = "rgb(9, 8, 7)";

let seen: RivoNativeColors;
let paints = 0;

function Probe() {
  seen = useRivo().colors;
  paints += 1;
  return null;
}

const undo: (() => void)[] = [];

afterEach(async () => {
  while (undo.length > 0) {
    const stop = undo.pop()!;
    await act(async () => {
      stop();
    });
  }
});

function keep(stop: () => void) {
  undo.push(stop);
}

function sheet(css: string) {
  const node = document.createElement("style");
  node.textContent = css;
  document.head.appendChild(node);
  keep(() => node.remove());
}

function onWeb() {
  const kept = Platform.OS;
  (Platform as { OS: string }).OS = "web";
  keep(() => {
    (Platform as { OS: string }).OS = kept;
  });
}

function cleanRoot() {
  const root = document.documentElement;
  keep(() => {
    root.removeAttribute("class");
    root.removeAttribute("style");
  });
}

function mount(): ReactTestRenderer {
  paints = 0;
  const screen = render(<Probe />, { theme: "rivocode-dark" });
  keep(() => screen.unmount());
  return screen;
}

async function tick(ms: number) {
  await act(async () => {
    await new Promise((done) => setTimeout(done, ms));
  });
}

async function settle() {
  for (let round = 0; round < 8; round++) await tick(16);
}

async function waitFor(ready: () => boolean) {
  for (let round = 0; round < 60 && !ready(); round++) await tick(16);
}

describe("a paleta relê quando o esquema do documento muda", () => {
  test("a classe escrita na raiz depois da montagem chega ao contexto", async () => {
    onWeb();
    cleanRoot();
    sheet(
      `:root { --probe-accent: ${DAY}; }` +
        `.night { --probe-accent: ${NIGHT}; }` +
        ".bg-accent { background-color: var(--probe-accent); }",
    );

    mount();
    expect(seen.accent).toBe(DAY);

    await act(async () => {
      document.documentElement.classList.add("night");
    });

    expect(seen.accent).toBe(NIGHT);
  });

  test("o color-scheme escrito no style da raiz depois da montagem chega ao contexto", async () => {
    onWeb();
    cleanRoot();
    sheet(
      `:root { --probe-accent: ${DAY}; }` +
        `:root[style*="dark"] { --probe-accent: ${NIGHT}; }` +
        ".bg-accent { background-color: var(--probe-accent); }",
    );

    mount();
    expect(seen.accent).toBe(DAY);

    await act(async () => {
      document.documentElement.style.setProperty("color-scheme", "dark");
    });

    expect(seen.accent).toBe(NIGHT);
  });

  test("a folha que o app injeta sem tocar na raiz chega no quadro seguinte", async () => {
    onWeb();
    cleanRoot();
    sheet(`.bg-accent { background-color: ${DAY}; }`);

    mount();
    expect(seen.accent).toBe(DAY);

    sheet(`.bg-accent { background-color: ${NIGHT}; }`);
    await waitFor(() => seen.accent === NIGHT);

    expect(seen.accent).toBe(NIGHT);
  });

  test("mexer na raiz sem mudar cor nenhuma não repinta o contexto", async () => {
    onWeb();
    cleanRoot();
    sheet(`.bg-accent { background-color: ${DAY}; }`);

    mount();
    const first = seen;
    const quiet = paints;

    for (const mark of ["a", "b", "c"]) {
      await act(async () => {
        document.documentElement.classList.add(mark);
      });
    }
    await settle();

    expect(seen).toBe(first);
    expect(paints).toBe(quiet);
  });

  test("o listener de prefers-color-scheme entra e sai junto com o provider", async () => {
    onWeb();
    cleanRoot();
    sheet(`.bg-accent { background-color: ${DAY}; }`);

    const asked: string[] = [];
    const listeners = new Set<() => void>();
    const kept = globalThis.matchMedia;
    globalThis.matchMedia = ((query: string) => {
      asked.push(query);
      return {
        matches: false,
        media: query,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      };
    }) as typeof globalThis.matchMedia;
    keep(() => {
      globalThis.matchMedia = kept;
    });

    const screen = mount();
    expect(asked).toContain("(prefers-color-scheme: dark)");
    expect(listeners.size).toBe(1);

    sheet(`.bg-accent { background-color: ${NIGHT}; }`);
    await act(async () => {
      for (const listener of listeners) listener();
    });
    expect(seen.accent).toBe(NIGHT);

    await act(async () => {
      screen.unmount();
    });
    expect(listeners.size).toBe(0);
  });

  test("fora da web o caminho é inerte: nada de document, nada de aviso", async () => {
    const spoke = console.warn;
    const said: string[] = [];
    console.warn = (...args: unknown[]) => said.push(args.map(String).join(" "));
    keep(() => {
      console.warn = spoke;
    });

    cleanRoot();
    sheet(`.bg-accent { background-color: ${NIGHT}; }`);
    expect(Platform.OS).not.toBe("web");

    mount();
    await act(async () => {
      document.documentElement.style.setProperty("color-scheme", "light");
    });
    await settle();

    expect(seen.accent).not.toBe(NIGHT);
    expect(said.join("\n")).not.toContain("color-scheme");
  });
});
