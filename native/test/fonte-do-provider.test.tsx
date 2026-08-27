import { describe, expect, spyOn, test } from "bun:test";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { Card, CardTitle } from "../src/card";
import { Code } from "../src/code";
import { mono, systemFonts, useRivoFonts } from "../src/font";
import { Text } from "../src/text";
import { render, textOf } from "./helpers";

function familyOf(node: ReactTestInstance): unknown {
  for (const layer of [node.props?.style].flat(3)) {
    const family = (layer as { fontFamily?: unknown } | null | undefined)?.fontFamily;
    if (family !== undefined) return family;
  }
  return undefined;
}

function families(screen: ReactTestRenderer): unknown[] {
  return screen.root.findAll((node) => node.type === "Text").map((node) => familyOf(node));
}

const BRAND = { sans: "Manrope", display: "Poppins", mono: "JetBrainsMono" };

function warned(run: () => void): string[] {
  const warn = spyOn(console, "warn").mockImplementation(() => {});
  try {
    run();
    return warn.mock.calls.map((call) => String(call[0]));
  } finally {
    warn.mockRestore();
  }
}

describe("a fonte que o app declara", () => {
  test("sem `fonts`, o texto corrido sai na do sistema e a mono na do aparelho", () => {
    expect(systemFonts.sans).toBeUndefined();
    expect(systemFonts.display).toBeUndefined();

    expect(families(render(<Text>Nota emitida</Text>))).toEqual([undefined]);
    expect(families(render(<Code>app.json</Code>))).toEqual([mono]);
  });

  test("declarada uma vez, ela veste corrido, titulo e largura fixa", () => {
    expect(families(render(<Text>Nota emitida</Text>, { fonts: BRAND }))).toEqual(["Manrope"]);
    expect(families(render(<Code>app.json</Code>, { fonts: BRAND }))).toEqual(["JetBrainsMono"]);

    const card = render(
      <Card>
        <CardTitle>Faturamento</CardTitle>
      </Card>,
      { fonts: BRAND },
    );

    expect(families(card)).toEqual(["Poppins"]);
  });

  test("o titulo cai na `sans` quando o app so carregou uma familia", () => {
    const card = render(
      <Card>
        <CardTitle>Faturamento</CardTitle>
      </Card>,
      { fonts: { sans: "Manrope" } },
    );

    expect(families(card)).toEqual(["Manrope"]);
  });

  test("declarar so a `sans` nao tira a mono de quem precisa dela", () => {
    expect(families(render(<Code>app.json</Code>, { fonts: { sans: "Manrope" } }))).toEqual([mono]);
  });

  test("o estilo de quem chama continua vencendo, com o do provider por baixo", () => {
    const screen = render(<Text style={{ fontFamily: "Courier New" }}>emitida_em</Text>, {
      fonts: BRAND,
    });
    const node = screen.root.findAll((item) => item.type === "Text")[0]!;

    expect([node.props.style].flat(3).at(-1)).toEqual({ fontFamily: "Courier New" });
  });

  test("fora do provider, o hook devolve a do sistema em vez de explodir", () => {
    function Probe() {
      return <Text>{String(useRivoFonts().sans)}</Text>;
    }

    const screen = render(<Probe />);
    expect(textOf(screen)).toBe("undefined");
  });
});

describe("o nome de fonte errado", () => {
  test("uma pilha de CSS é acusada, e não sai calada na fonte do sistema", () => {
    const [message] = warned(() =>
      render(<Text>Nota</Text>, { fonts: { sans: "Manrope, system-ui, sans-serif" } }),
    );

    expect(message).toContain("[rivocode/ui-native]");
    expect(message).toContain("sans");
    expect(message).toContain("Manrope, system-ui, sans-serif");
  });

  test("a familia generica do CSS é acusada - foi ela que derrubou a mono", () => {
    const [message] = warned(() => render(<Text>Nota</Text>, { fonts: { mono: "ui-monospace" } }));

    expect(message).toContain("ui-monospace");
    expect(message).toContain("genérica");
  });

  test("aspas, variavel de CSS e nome vazio saem todos no mesmo aviso", () => {
    const [message] = warned(() =>
      render(<Text>Nota</Text>, {
        fonts: { sans: '"Manrope"', display: "var(--rc-font-display)", mono: "  " },
      }),
    );

    expect(message).toContain("aspas");
    expect(message).toContain("variável");
    expect(message).toContain("vazia");
  });

  test("`monospace` só vale no Android, e o duble responde iOS", () => {
    const [message] = warned(() => render(<Text>Nota</Text>, { fonts: { mono: "monospace" } }));

    expect(message).toContain("Android");
  });

  test("com o `isLoaded` do expo-font, a familia que nao chegou ao aparelho é nomeada", () => {
    const loaded = new Set(["Manrope"]);
    const [message] = warned(() =>
      render(<Text>Nota</Text>, {
        fonts: BRAND,
        isFontLoaded: (family) => loaded.has(family),
      }),
    );

    expect(message).toContain("Poppins");
    expect(message).toContain("JetBrainsMono");
    expect(message).not.toContain('"Manrope" não');
  });

  test("nome real e carregado nao rende aviso nenhum", () => {
    const messages = warned(() =>
      render(<Text>Nota</Text>, { fonts: BRAND, isFontLoaded: () => true }),
    );

    expect(messages).toEqual([]);
  });
});
