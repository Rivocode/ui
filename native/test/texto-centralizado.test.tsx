import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { NumberField, TimeField } from "../src";
import { byType, render } from "./helpers";
import type { ReactTestInstance } from "react-test-renderer";

const SOURCE = fileURLToPath(new URL("../src", import.meta.url));

const ALIGNMENT = new Set(["text-left", "text-center", "text-right", "text-justify"]);

function flatStyle(node: ReactTestInstance): Record<string, unknown> {
  const layers = [node.props?.style].flat(4).filter(Boolean) as Record<string, unknown>[];
  return Object.assign({}, ...layers);
}

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/.test(path)) found.push(path);
    }
  };
  walk(SOURCE);
  return found;
}

function textInputBlocks(code: string): string[] {
  const blocks: string[] = [];
  for (const hit of code.matchAll(/<TextInput\b/g)) {
    let at = hit.index! + "<TextInput".length;
    let depth = 0;
    while (at < code.length) {
      const char = code[at]!;
      if (char === "{") depth += 1;
      else if (char === "}") depth -= 1;
      else if (char === ">" && depth === 0) break;
      at += 1;
    }
    blocks.push(code.slice(hit.index!, at));
  }
  return blocks;
}

describe("o alinhamento do texto atravessa os dois alvos", () => {
  test("o NumberField centraliza o numero por style, e nao por prop", () => {
    const screen = render(<NumberField value={2} onValueChange={() => {}} label="Parcelas" />);
    const field = byType(screen, "TextInput")[0]!;

    expect(flatStyle(field).textAlign).toBe("center");
    expect(field.props.textAlign).toBeUndefined();
    expect(String(field.props.className ?? "").split(" ")).not.toContain("text-center");
  });

  test("o TimeField centraliza a hora pelo mesmo caminho", () => {
    const screen = render(<TimeField value="08:30" onValueChange={() => {}} label="Entrada" />);
    const field = byType(screen, "TextInput")[0]!;

    expect(flatStyle(field).textAlign).toBe("center");
    expect(field.props.textAlign).toBeUndefined();
  });

  test("nenhuma peca alinha texto por prop nem por classe dentro de um TextInput", () => {
    const files = sourceFiles();

    expect(
      files.length,
      "a varredura de native/src achou " +
        `${files.length} arquivo(s): lista vazia deixa a guarda abaixo verde sem ter lido nada`,
    ).toBeGreaterThan(60);

    const guilty: string[] = [];

    for (const file of files) {
      const code = readFileSync(file, "utf8");
      const short = file.slice(SOURCE.length + 1);

      for (const block of textInputBlocks(code)) {
        if (/\btextAlign\s*=/.test(block)) guilty.push(`${short}: prop textAlign`);

        for (const className of block.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
          const worn = (className[1] ?? className[2] ?? "").split(/\s+/);
          for (const token of worn) {
            if (ALIGNMENT.has(token)) guilty.push(`${short}: classe ${token}`);
          }
        }
      }
    }

    expect(
      guilty,
      "Centralizar o texto de um TextInput nao tem caminho por prop nem por classe, e os dois " +
        "modos falham em alvos diferentes do mesmo pacote. O react-native-web 0.21 nao " +
        "encaminha `textAlign` - o `pickProps` do TextInput dele so deixa passar a lista de " +
        "`forwardedProps`, e a prop sai do DOM sem aviso. No React Native de verdade a classe " +
        "morre antes: o babel do nativewind troca `react-native` por " +
        "`react-native-css/components`, e o TextInput de la declara " +
        "`nativeStyleMapping: { textAlign: true }`, que apaga o `textAlign` do style e estoura " +
        "com `path.split is not a function`. Sobra `style={{ textAlign }}`, que o React Native " +
        "le como TextStyle e o react-native-web imprime como `text-align`.",
    ).toEqual([]);
  });
});
