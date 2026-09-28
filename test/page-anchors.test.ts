import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";

import { anchor } from "../apps/docs/src/anchor";
import { findParent } from "../apps/docs/src/parts";
import { renderMarkdown } from "../apps/docs/src/render-markdown";


const ROOT = ".design-sync";

const names = readdirSync(`${ROOT}/docs`)
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""));

const bodyOf = async (name: string) => {
  const raw = await Bun.file(`${ROOT}/docs/${name}.md`).text();
  return raw.replace(/^---\n[\s\S]*?\n---\n/, "").replace(/^\s*#\s+\S.*\n+/, "");
};

const idsOf = (html: string) => [...html.matchAll(/<h\d id="([^"]+)"/g)].map((match) => match[1]);

test("two equal headings in the same document do not compete for the same id", () => {
  const html = renderMarkdown("## When to use\n\ntext\n\n## When to use\n");

  expect(idsOf(html)).toEqual(["when-to-use", "when-to-use-2"]);
});

test("a part's document signs the id with the part name", () => {
  const html = renderMarkdown("## In React Native\n", { idPrefix: "button-group" });

  expect(idsOf(html)).toEqual(["button-group-in-react-native"]);
});

test("a part's heading goes down a level, because it lives inside its h3", () => {
  const html = renderMarkdown("## In React Native\n", { headingOffset: 2 });

  expect(html).toContain("<h4 ");
});

test("without the signature, the Button page would write the same id twice", async () => {
  const button = idsOf(renderMarkdown(await bodyOf("Button")));
  const group = idsOf(renderMarkdown(await bodyOf("ButtonGroup")));

  expect(button.filter((id) => group.includes(id))).toEqual(["in-react-native"]);
});

test("no piece page repeats a heading id", async () => {
  const repeated: string[] = [];

  expect(names.length).toBeGreaterThan(150);

  for (const name of names) {
    if (findParent(name, names)) continue;

    const parts = names.filter((other) => findParent(other, names) === name);
    const ids = [
      "when-to-use",
      ...idsOf(renderMarkdown(await bodyOf(name))),
      "api",
      ...(parts.length ? ["the-parts"] : []),
      ...(
        await Promise.all(
          parts.map(async (part) => [
            anchor(part),
            ...idsOf(
              renderMarkdown(await bodyOf(part), {
                idPrefix: anchor(part),
                headingOffset: 2,
              }),
            ),
          ]),
        )
      ).flat(),
    ];

    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) repeated.push(`${name}#${id}`);
      seen.add(id);
    }
  }

  expect(repeated).toEqual([]);
});
