import { describe, expect, test } from "bun:test";
import type { ReactElement } from "react";

import { Spinner } from "../src";
import { byType, render } from "./helpers";

const indicator = (element: ReactElement) =>
  byType(render(element), "ActivityIndicator")[0]!.props;

describe("Spinner", () => {
  test("speaks sm, md and lg, like the web, over the system's two spinners", () => {
    expect(indicator(<Spinner size="sm" />).size).toBe("small");
    expect(indicator(<Spinner size="md" />).size).toBe("small");
    expect(indicator(<Spinner size="lg" />).size).toBe("large");
    expect(indicator(<Spinner />).size).toBe("small");
  });

  test("label is what the screen reader announces, with Carregando as the default", () => {
    expect(indicator(<Spinner />).accessibilityLabel).toBe("Carregando");
    expect(indicator(<Spinner label="Emitindo a nota" />).accessibilityLabel).toBe(
      "Emitindo a nota",
    );
  });

  test("an empty label hides the spinner from reading", () => {
    const props = indicator(<Spinner label="" />);
    expect(props.accessibilityLabel).toBeUndefined();
    expect(props.accessibilityElementsHidden).toBe(true);
    expect(props.importantForAccessibility).toBe("no-hide-descendants");
  });
});
