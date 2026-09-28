import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { Meter } from "../src/components/meter";
import { Progress } from "../src/components/progress";

function read(ui: React.ReactElement) {
  const { container } = render(ui);
  const root = container.querySelector("[aria-valuetext], [role=progressbar], [role=meter]")!;
  const indicator = container.querySelector<HTMLElement>("[style*='width']");
  return {
    text: container.textContent ?? "",
    spoken: root.getAttribute("aria-valuetext"),
    width: indicator?.style.width,
  };
}

test("indeterminate progress with format writes NaN neither on screen nor to the screen reader", () => {
  for (const value of [null, undefined as unknown as null, Number.NaN]) {
    const { text, spoken } = read(
      <Progress value={value} showValue format="percent" label="Enviando" />,
    );
    expect(text).not.toContain("NaN");
    expect(spoken ?? "").not.toContain("NaN");
    expect(spoken).toBe("indeterminate progress");
  }
});

test("progress above the maximum with format writes the maximum, like the bar", () => {
  const { text, spoken, width } = read(
    <Progress value={150} showValue format="percent" label="Enviando" />,
  );
  expect(width).toBe("100%");
  expect(text).toContain("100%");
  expect(text).not.toContain("150");
  expect(spoken).toBe("100%");
});

test("the meter below the minimum with format writes the minimum, and above the maximum writes the maximum", () => {
  const below = read(<Meter value={-20} showValue format="integer" label="Cota" />);
  expect(below.text).not.toContain("-20");
  expect(below.spoken).toBe("0");

  const above = read(<Meter value={150} showValue format="percent" label="Cota" />);
  expect(above.text).toContain("100%");
  expect(above.spoken).toBe("100%");
});

test("within range format keeps writing the value", () => {
  expect(read(<Progress value={42} showValue format="percent" label="Enviando" />).spoken).toBe(
    "42%",
  );
  expect(
    read(<Meter value={7} min={0} max={10} showValue format="integer" label="Cota" />).spoken,
  ).toBe("7");
});
