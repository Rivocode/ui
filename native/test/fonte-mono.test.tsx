import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { Calendar } from "../src/calendar";
import { Code } from "../src/code";
import { ColorPicker } from "../src/color-picker";
import { mono } from "../src/font";
import { Timeline } from "../src/timeline";
import { byLabel, render } from "./helpers";

/*
 * O que esta suite mede nao e a plataforma, e sim que a letra de largura fixa
 * chega ao aparelho.
 *
 * A classe `font-mono` compilava para `{ fontFamily: "ui-monospace" }` - o
 * react-native-css guarda so a primeira familia da lista, e a generica de CSS
 * nao existe instalada em celular nenhum. O RN, sem nome que case, cai calado
 * na letra padrao: o defeito nao levantava erro, nao pintava a tela de
 * vermelho e sobreviveu meses em seis pecas.
 *
 * Por isso a afirmacao de baixo e negativa antes de ser positiva: nome real de
 * fonte, e nunca a generica. O `Platform` do duble responde iOS fixo, e a
 * escolha do OS nao entra em nenhuma conta daqui.
 */

/** A familia que sobrou no no. O `style` do Code e array; o das outras, objeto. */
function familyOf(node: ReactTestInstance): unknown {
  for (const layer of [node.props?.style].flat(3)) {
    const family = (layer as { fontFamily?: unknown } | null | undefined)?.fontFamily;
    if (family !== undefined) return family;
  }
  return undefined;
}

function monoNodes(screen: ReactTestRenderer): ReactTestInstance[] {
  return screen.root.findAll(
    (node) => typeof node.type === "string" && familyOf(node) === mono,
  );
}

describe("a fonte mono", () => {
  test("e nome de fonte instalada, e nunca a familia generica do CSS", () => {
    expect(mono).not.toBe("ui-monospace");
    expect(["Menlo", "monospace"]).toContain(mono);

    // Uma familia so: o RN nao le lista de fallback, e a virgula viraria um
    // nome inteiro que nenhum aparelho tem.
    expect(mono).not.toContain(",");
  });

  test("o Code sai na letra do codigo pelo estilo, e nao pela classe", () => {
    const screen = render(<Code>app.json</Code>);
    const [piece] = monoNodes(screen);

    expect(piece).toBeDefined();
    expect(piece!.props.className).not.toContain("font-mono");
    expect(piece!.props.className).toContain("bg-surface-raised");
  });

  test("a classe de quem usa continua vencendo, com o estilo por baixo", () => {
    const screen = render(<Code className="text-danger-text">emitida_em</Code>);
    const [piece] = monoNodes(screen);

    expect(piece!.props.className).toContain("text-danger-text");
    expect(piece!.props.className).not.toContain("text-fg-muted");
  });

  test("um style de quem usa vence o da peca, sem perder o resto", () => {
    const screen = render(<Code style={{ fontFamily: "Courier New" }}>app.json</Code>);
    const [piece] = screen.root.findAll(
      (node) => typeof node.type === "string" && node.type === "Text",
    );

    expect(familyOf(piece!)).toBe(mono);
    // A ultima camada e a de quem usa: e ela que o RN aplica.
    expect([piece!.props.style].flat(3).at(-1)).toEqual({ fontFamily: "Courier New" });
  });

  test("o carimbo da Timeline alinha por largura fixa", () => {
    const screen = render(
      <Timeline items={[{ title: "Nota emitida", at: "12/03 às 14:20", by: "Ana Duarte" }]} />,
    );

    expect(monoNodes(screen).length).toBe(1);
  });

  test("as sete iniciais de dia da semana do Calendar saem na mesma largura", () => {
    const screen = render(<Calendar value="2026-08-10" onValueChange={() => {}} />);

    expect(monoNodes(screen).length).toBeGreaterThanOrEqual(7);
  });

  test("o campo hexadecimal do ColorPicker nao dança com a cor digitada", () => {
    const screen = render(<ColorPicker value="#d4f34a" onValueChange={() => {}} />);
    const field = byLabel(screen, "Código hexadecimal da cor")[0]!;

    expect(familyOf(field)).toBe(mono);
    expect(field.props.className).not.toContain("font-mono");
  });

  test("nenhuma peça do pacote nativo pede classe de fonte", async () => {
    const offenders: string[] = [];
    const trees = ["native/src/**/*.{ts,tsx}", "examples/native/**/*.{ts,tsx}"];
    const files: string[] = [];
    for (const tree of trees) {
      for await (const found of new Glob(tree).scan(".")) {
        if (found.includes("node_modules")) continue;
        files.push(found);
      }
    }

    expect(files.length).toBeGreaterThan(60);

    for (const file of files) {
      const code = (await Bun.file(file).text())
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      if (/font-(mono|sans|display)/.test(code)) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });

  test("só o text.tsx escreve fontFamily: o resto pede o papel e o provider responde", async () => {
    const offenders: string[] = [];

    for await (const file of new Glob("native/src/**/*.{ts,tsx}").scan(".")) {
      if (file === "native/src/text.tsx") continue;

      const code = (await Bun.file(file).text())
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/[^\n]*/g, "");

      if (code.includes("fontFamily")) offenders.push(file);
    }

    expect(offenders).toEqual([]);
  });
});
