import { describe, expect, test } from "bun:test";
import { Text } from "react-native";

import { Grid, Stack } from "../src";
import { tokens } from "../tokens";
import { act, byType, render, textOf } from "./helpers";

const classesOf = (node: { props: { className?: string } }) =>
  String(node.props.className ?? "").split(/\s+/);

const outer = (screen: ReturnType<typeof render>) => {
  const [first] = byType(screen, "View").filter((node) => node.props.style?.gap !== undefined);
  expect(first).toBeDefined();
  return first;
};

const layout = (width: number) => ({ nativeEvent: { layout: { width, height: 0, x: 0, y: 0 } } });

describe("Stack", () => {
  test("nasce em coluna com o vao medio da escala comitada", () => {
    const screen = render(
      <Stack>
        <Text>Um</Text>
        <Text>Dois</Text>
      </Stack>,
    );
    const stack = outer(screen);
    expect(classesOf(stack)).toContain("flex-col");
    expect(classesOf(stack)).not.toContain("flex-row");
    expect(stack.props.style.gap).toBe(tokens.scales["gap-md"]);
    expect(tokens.scales["gap-md"]).toBe(12);
    expect(textOf(screen)).toBe("Um Dois");
  });

  test("em linha alinha, distribui, quebra e zera o vao com none", () => {
    const screen = render(
      <Stack direction="row" gap="none" align="center" justify="between" wrap>
        <Text>Um</Text>
      </Stack>,
    );
    const stack = outer(screen);
    const classes = classesOf(stack);
    expect(classes).toContain("flex-row");
    expect(classes).toContain("items-center");
    expect(classes).toContain("justify-between");
    expect(classes).toContain("flex-wrap");
    expect(stack.props.style.gap).toBe(0);
  });
});

describe("Grid", () => {
  const five = ["A", "B", "C", "D", "E"].map((letter) => <Text key={letter}>{letter}</Text>);

  const rowsOf = (screen: ReturnType<typeof render>) =>
    byType(screen, "View").filter((node) => classesOf(node).includes("flex-row"));

  test("colunas fixas: a ultima linha guarda o lugar das que faltam", () => {
    const screen = render(<Grid columns={3}>{five}</Grid>);
    const rows = rowsOf(screen);
    expect(rows).toHaveLength(2);
    expect(rows[0].children).toHaveLength(3);
    expect(rows[1].children).toHaveLength(3);
    expect(textOf(screen)).toBe("A B C D E");
  });

  test("largura minima: uma coluna antes da medida, e quantas couberem depois", () => {
    const screen = render(
      <Grid minItemWidth={100} gap="lg">
        {five}
      </Grid>,
    );
    expect(rowsOf(screen)).toHaveLength(5);

    const grid = outer(screen);
    expect(grid.props.style.gap).toBe(tokens.scales["gap-lg"]);
    act(() => grid.props.onLayout(layout(360)));

    const rows = rowsOf(screen);
    expect(rows).toHaveLength(2);
    expect(rows[0].children).toHaveLength(3);
  });

  test("mais estreita que o minimo, sai uma coluna, e nunca zero", () => {
    const screen = render(<Grid minItemWidth={400}>{five}</Grid>);
    const grid = outer(screen);
    act(() => grid.props.onLayout(layout(320)));
    expect(rowsOf(screen)).toHaveLength(5);
  });

  test("sem filho, a grade nao desenha linha nenhuma", () => {
    const screen = render(<Grid columns={2} />);
    expect(rowsOf(screen)).toHaveLength(0);
  });
});
