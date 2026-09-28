import { expect, test } from "bun:test";

import { focusIsLost } from "../src/lib/focus";

function button(setup: (element: HTMLButtonElement) => void = () => {}) {
  const element = document.createElement("button");
  document.body.appendChild(element);
  setup(element);
  return element;
}

test("with no target, and with the page body as target, focus is lost", () => {
  expect(focusIsLost(null)).toBe(true);
  expect(focusIsLost(document.body)).toBe(true);
});

test("a live focusable target does not count as lost, so nothing is stolen from whoever moved focus", () => {
  const alive = button();

  expect(focusIsLost(alive)).toBe(false);

  alive.remove();
});

test("a target that left the tree counts as lost, because there is nowhere to tab from it", () => {
  const gone = button();
  gone.remove();

  expect(focusIsLost(gone)).toBe(true);
});

test("a target still active but already `disabled` counts as lost: that is the Firefox order", () => {
  const dying = button((element) => {
    element.disabled = true;
  });

  expect(focusIsLost(dying)).toBe(true);

  dying.remove();
});
