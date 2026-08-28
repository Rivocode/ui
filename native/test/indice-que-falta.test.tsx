import { describe, expect, test } from "bun:test";

import { Alert, Badge, Button } from "../src";
import { MonthView } from "../src/calendar";
import { byClass, byRole, byType, render, textOf } from "./helpers";

const classesOf = (node: { props: { className?: string } }) =>
  (node.props.className ?? "").split(" ");

describe("indice que falta nao derruba a peca", () => {
  test("o Badge com tom desconhecido veste o neutro, e nao nada", () => {
    const screen = render(<Badge tone="inexistente">rascunho</Badge>);
    const [box] = byClass(screen, /rounded-pill/);

    expect(classesOf(box!)).toContain("bg-surface-raised");
    expect(textOf(screen)).toContain("rascunho");
  });

  test("o Alert com tom desconhecido veste o info, e nao nada", () => {
    const screen = render(<Alert tone="inexistente" title="Aviso" />);
    const [box] = byRole(screen, "alert");

    expect(classesOf(box!)).toContain("bg-info-subtle");
    expect(classesOf(box!)).not.toContain("bg-danger-subtle");
  });

  test("o spinner de variante desconhecida pinta o mesmo do secundario", () => {
    const unknown = render(
      <Button loading variant="inexistente">
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

  test("o mes fora da faixa da a volta em vez de quebrar", () => {
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
