import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { version } from "../src/index";
import manifesto from "../package.json";

/*
 * Compared with the manifest, and not with a number written here: pinning the version
 * in the test makes every `npm version` break the suite for a reason that is not a
 * defect. What matters is that the two never drift apart, because whoever reads the exported
 * `version` is asking which package is installed.
 */
test("the exported version is the same as the package's", () => {
  expect(version).toBe(manifesto.version);
});

test("the test environment has a DOM", () => {
  render(<p>ok</p>);
  expect(screen.getByText("ok")).toBeDefined();
});
