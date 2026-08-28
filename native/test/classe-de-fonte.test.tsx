import { describe, expect, spyOn, test } from "bun:test";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { __unstable__loadDesignSystem } from "tailwindcss";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { Code } from "../src/code";
import { familyClassWarning, familyClassesIn } from "../src/font";
import { Text } from "../src/text";
import { render } from "./helpers";

const ENTRY =
  `@import "tailwindcss/theme.css" layer(theme);\n` +
  `@import "./theme.css";\n` +
  `@import "tailwindcss/utilities.css";\n`;

const FAMILY = ["font-sans", "font-serif", "font-mono", "font-display"];
const WEIGHT = ["font-medium", "font-semibold"];

async function loadStylesheet(id: string, base: string) {
  let path = isAbsolute(id) ? id : resolve(base, id);
  if (!id.startsWith(".") && !isAbsolute(id)) {
    path = join(process.cwd(), "node_modules", id);
    if (!(await Bun.file(path).exists())) path = join(path, "index.css");
  }
  return { path, base: dirname(path), content: await Bun.file(path).text() };
}

async function nativeCompiler() {
  const system = await __unstable__loadDesignSystem(ENTRY, {
    base: resolve("native"),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error("sem plugin")),
  });
  return (token: string) => system.candidatesToCss([token])[0];
}

function warned(run: () => void): string[] {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  try {
    run();
    return warn.mock.calls.map((call) => String(call[0]));
  } finally {
    warn.mockRestore();
  }
}

function aboutFamily(messages: string[]): string[] {
  return messages.filter((message) => message.includes("família de fonte"));
}

function familyOf(node: ReactTestInstance): unknown {
  for (const layer of [node.props?.style].flat(3)) {
    const family = (layer as { fontFamily?: unknown } | null | undefined)?.fontFamily;
    if (family !== undefined) return family;
  }
  return undefined;
}

function firstText(screen: ReactTestRenderer): ReactTestInstance {
  return screen.root.findAll((node) => node.type === "Text")[0]!;
}

describe("a classe de familia de fonte no nativo", () => {
  test("nenhuma das quatro gera regra, e as de peso continuam gerando", async () => {
    const compiles = await nativeCompiler();

    for (const token of FAMILY) {
      expect([token, compiles(token)]).toEqual([token, null]);
    }

    for (const token of WEIGHT) {
      expect(compiles(token)).toContain("font-weight:");
    }
  });

  test("a lista que o aviso conhece e exatamente a que o compilador recusa", async () => {
    const compiles = await nativeCompiler();

    expect(familyClassesIn(FAMILY.join(" "))).toEqual(FAMILY);
    for (const token of familyClassesIn(FAMILY.concat(WEIGHT).join(" "))) {
      expect([token, compiles(token)]).toEqual([token, null]);
    }
    expect(familyClassesIn(WEIGHT.join(" "))).toEqual([]);
  });

  test("uma peça com font-display reclama, e a reclamação nomeia o caminho que funciona", () => {
    const messages = aboutFamily(warned(() => render(<Code className="font-display">app.json</Code>)));

    expect(messages.length).toBe(1);
    expect(messages[0]).toContain("font-display");
    expect(messages[0]).toContain("RivoProvider fonts=");
    expect(messages[0]).toContain("prop `font`");
  });

  test("o Text cru também reclama, e ele não passa pelo cn", () => {
    const messages = aboutFamily(warned(() => render(<Text className="font-mono">Nota emitida</Text>)));

    expect(messages.length).toBe(1);
    expect(messages[0]).toContain("font-mono");
  });

  test("classe de peso não reclama, e continua na peça", () => {
    let screen!: ReactTestRenderer;
    const messages = aboutFamily(
      warned(() => {
        screen = render(<Code className="font-semibold">app.json</Code>);
      }),
    );

    expect(messages).toEqual([]);
    expect(String(firstText(screen).props.className).split(" ")).toContain("font-semibold");
  });

  test("a classe não troca a família: quem troca é a prop, e por isso o aviso existe", () => {
    const fonts = { sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" };

    const byClass = render(<Text className="font-display">Faturamento</Text>, { fonts });
    const byProp = render(<Text font="display">Faturamento</Text>, { fonts });

    expect(familyOf(firstText(byClass))).toBe("Manrope");
    expect(familyOf(firstText(byProp))).toBe("Poppins");
  });

  test("a reclamação sai acentuada, como todo texto que chega a quem usa", () => {
    const message = familyClassWarning(["font-display"]);

    expect(message).toContain("família");
    expect(message).toContain("silêncio");
    expect(message).toContain("peças");
  });
});
