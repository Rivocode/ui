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

describe("text alignment crosses both targets", () => {
  test("NumberField centers the number through style, not through a prop", () => {
    const screen = render(<NumberField value={2} onValueChange={() => {}} label="Parcelas" />);
    const field = byType(screen, "TextInput")[0]!;

    expect(flatStyle(field).textAlign).toBe("center");
    expect(field.props.textAlign).toBeUndefined();
    expect(String(field.props.className ?? "").split(" ")).not.toContain("text-center");
  });

  test("TimeField centers the time the same way", () => {
    const screen = render(<TimeField value="08:30" onValueChange={() => {}} label="Entrada" />);
    const field = byType(screen, "TextInput")[0]!;

    expect(flatStyle(field).textAlign).toBe("center");
    expect(field.props.textAlign).toBeUndefined();
  });

  test("no piece aligns text through a prop or a class inside a TextInput", () => {
    const files = sourceFiles();

    expect(
      files.length,
      "the scan of native/src found " +
        `${files.length} file(s): an empty list leaves the guard below green without having read anything`,
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
            if (ALIGNMENT.has(token)) guilty.push(`${short}: class ${token}`);
          }
        }
      }
    }

    expect(
      guilty,
      "Centering the text of a TextInput has no path through a prop nor a class, and both " +
        "ways fail on different targets of the same package. react-native-web 0.21 does not " +
        "forward `textAlign` - its TextInput's `pickProps` only lets through the " +
        "`forwardedProps` list, and the prop leaves the DOM without warning. On real React " +
        "Native the class dies earlier: nativewind's babel swaps `react-native` for " +
        "`react-native-css/components`, and the TextInput there declares " +
        "`nativeStyleMapping: { textAlign: true }`, which deletes `textAlign` from the style and " +
        "blows up with `path.split is not a function`. What is left is `style={{ textAlign }}`, " +
        "which React Native reads as a TextStyle and react-native-web prints as `text-align`.",
    ).toEqual([]);
  });
});
