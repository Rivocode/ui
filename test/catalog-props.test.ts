import { expect, test } from "bun:test";

/*
 * The props tables of the site and of the .md files an agent reads come from
 * this JSON, and the JSON comes from the compiler - not from a hand-written
 * .d.ts snapshot.
 *
 * The defect these tests guard: the old generator read text from a 0.1.0
 * bundle and lost every callback prop, so half the controlled pieces were
 * documented without the half that controls them. And 36 pages said "has no
 * props of its own" while having them.
 */

const catalog = await Bun.file("apps/docs/src/component-props.json").json();

const namesOf = (piece: string) =>
  (catalog[piece]?.props ?? []).map((p: { name: string }) => p.name);

test("a controlled piece carries the callbacks that control it", () => {
  expect(namesOf("Select")).toContain("onValueChange");
  expect(namesOf("Select")).toContain("onOpenChange");
  expect(namesOf("Dialog")).toContain("onOpenChange");
  expect(namesOf("Checkbox")).toContain("onCheckedChange");
});

test("a piece whose prop is its reason to exist does not show up without props", () => {
  expect(namesOf("Breadcrumb")).toEqual(expect.arrayContaining(["items", "max"]));
  expect(namesOf("Pagination")).toEqual(
    expect.arrayContaining(["page", "pageCount", "onPageChange", "siblings"]),
  );
  expect(namesOf("Progress")).toEqual(expect.arrayContaining(["value", "label", "showValue"]));
  expect(namesOf("MaskedInput")).toEqual(expect.arrayContaining(["mask", "onValueChange"]));
});

test("a piece that only forwards the root element still has no props of its own", () => {
  // CardHeader is a <div> with a class: saying "has no props of its own" there
  // is true, and the table must know the difference between that and a gap.
  expect(namesOf("CardHeader")).toEqual([]);
  expect(catalog.CardHeader.forwardsRoot).toBe(true);
});

test("a required prop comes before an optional one", () => {
  const props = catalog.DataTable.props as Array<{ name: string; required: boolean }>;
  const firstOptional = props.findIndex((p) => !p.required);
  const lastRequired = props.map((p) => p.required).lastIndexOf(true);

  expect(lastRequired).toBeLessThan(firstOptional);
});

test("the prop note comes from the JSDoc, and not from a copy in the doc", () => {
  const props = catalog.DataTable.props as Array<{ name: string; note?: string }>;
  const rowKey = props.find((p) => p.name === "rowKey");

  expect(rowKey?.note).toContain("The row's identity");
});
