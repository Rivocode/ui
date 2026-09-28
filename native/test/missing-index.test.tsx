import { describe, expect, test } from "bun:test";

import { Alert, Badge, Button } from "../src";
import { MonthView } from "../src/calendar";
import { byClass, byRole, byType, render, textOf } from "./helpers";

const classesOf = (node: { props: { className?: string } }) =>
  (node.props.className ?? "").split(" ");

describe("a missing index does not bring the piece down", () => {
  test("a Badge with an unknown tone wears neutral, not nothing", () => {
    const screen = render(<Badge tone={"inexistente" as never}>rascunho</Badge>);
    const [box] = byClass(screen, /rounded-pill/);

    expect(classesOf(box!)).toContain("bg-surface-raised");
    expect(textOf(screen)).toContain("rascunho");
  });

  test("an Alert with an unknown tone wears info, not nothing", () => {
    const screen = render(<Alert tone={"inexistente" as never} title="Aviso" />);
    const [box] = byRole(screen, "alert");

    expect(classesOf(box!)).toContain("bg-info-subtle");
    expect(classesOf(box!)).not.toContain("bg-danger-subtle");
  });

  test("the spinner of an unknown variant paints the same as secondary", () => {
    const unknown = render(
      <Button loading variant={"inexistente" as never}>
        Emitindo
      </Button>,
    );
    const secondary = render(
      <Button loading variant="secondary">
        Emitindo
      </Button>,
    );

    const color = byType(unknown, "ActivityIndicator")[0]!.props.color;

    expect(typeof color).toBe("string");
    expect(color).toBe(byType(secondary, "ActivityIndicator")[0]!.props.color);
  });

  test("an out-of-range month wraps around instead of breaking", () => {
    const month = (value: number) =>
      textOf(
        render(
          <MonthView
            year={2026}
            month={value}
            onMonthChange={() => {}}
            paintOf={() => ({ chosen: false })}
            onDayPress={() => {}}
          />,
        ),
      );

    expect(month(0)).toContain("Janeiro de 2026");
    expect(month(11)).toContain("Dezembro de 2026");
    expect(month(12)).toContain("Janeiro de 2026");
    expect(month(-1)).toContain("Dezembro de 2026");
  });
});
