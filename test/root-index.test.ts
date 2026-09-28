import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";

import { indexLine, partNote } from "../apps/docs/src/agent-address";
import { findParent } from "../apps/docs/src/parts";

/*
 * The index an agent reads.
 *
 * A part is not a component. CardHeader, DialogFooter and SelectItem only exist
 * inside something else, and listing them at the same level makes the agent
 * count too many components, spend context opening CardTitle.md as if it were
 * independent, and lose the only information that matters about it.
 */

const names = readdirSync(".design-sync/docs")
  .filter((file) => file.endsWith(".md"))
  .map((file) => file.replace(/\.md$/, ""));

const pieces = names.filter((name) => !findParent(name, names));

test("the skill states the same component count the catalog has", async () => {
  expect(names.length).toBeGreaterThan(150);

  // The number in the skill is the first thing an agent reads, and it was the
  // only place in the system where it was right while the index counted
  // everything. It shows up in two files, and both age together.
  const skill = await Bun.file(".claude/skills/rivocode-ui/SKILL.md").text();
  const choice = await Bun.file(".claude/skills/rivocode-ui/reference/components.md").text();

  expect(/There are (\d+)/.exec(skill)?.[1]).toBe(String(pieces.length));
  expect(/catalog has (\d+) pieces/.exec(choice)?.[1]).toBe(String(pieces.length));
});

test("parts and components are not confused in the count", () => {
  expect(findParent("CardHeader", names)).toBe("Card");
  expect(findParent("Card", names)).toBeNull();
  // DataTable does not become a part of Table: the name does not start with it.
  expect(findParent("DataTable", names)).toBeNull();
  expect(pieces.length).toBeLessThan(names.length);
});

/*
 * These three used to measure the contents of `apps/docs/dist/`, and so they
 * passed on the machine that had just built and failed in CI, where `check`
 * runs before any build. A guard that depends on an artifact is not a guard: it
 * is a coin toss that looks like rigor. Now they measure the function that
 * writes the address, which is what they always meant to say.
 */

const CARD = { name: "Card", slug: "card" };

test("a part points inside the page of the component that composes it", () => {
  expect(indexLine("CardHeader", "card-header", CARD)).toBe(
    "  - [CardHeader](/componentes/card.md#cardheader): part of Card",
  );
});

test("a component keeps its own address, and no indentation", () => {
  expect(indexLine("Card", "card")).toBe("- [Card](/componentes/card.md)");
});

test("the line note follows the llmstxt.org format", () => {
  expect(indexLine("Card", "card", undefined, "Agrupa um assunto.")).toBe(
    "- [Card](/componentes/card.md): Agrupa um assunto.",
  );
  expect(indexLine("CardHeader", "card-header", CARD, "O topo.")).toBe(
    "  - [CardHeader](/componentes/card.md#cardheader): part of Card. O topo.",
  );
});

test("the part's old address answers with the path, and not with nothing", () => {
  // An agent that saved the link must not find nothing.
  const note = partNote("CardHeader", CARD);

  expect(note).toContain("is part of Card");
  expect(note).toContain("/componentes/card.md#cardheader");
});

test("the anchor the address promises is the one the page writes", async () => {
  // The `###` of the part name is what becomes `#cardheader` in markdown. If the
  // renderer changes the heading level, the link stops resolving - and nothing
  // would complain, because a broken link inside a .md fails no build.
  const { renderDoc } = await import("../apps/docs/src/render-md");
  const page = renderDoc({
    name: "Card",
    body: "O cartao.",
    importPath: "@rivocode/ui",
    props: [],
    forwardsRootProps: true,
    stories: [],
    parts: [{ name: "CardHeader", body: "O topo.", props: [] }],
    related: [],
  });

  expect(page).toContain("### CardHeader");
  expect(partNote("CardHeader", CARD)).toContain("#cardheader");
});
