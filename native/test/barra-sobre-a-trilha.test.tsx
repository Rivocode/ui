import { expect, test } from "bun:test";
import type { ReactTestRenderer } from "react-test-renderer";

import { Meter, Progress, Tracker } from "../src";
import { byClass, render } from "./helpers";

function paintedTokens(screen: ReactTestRenderer): string[] {
  return byClass(screen, /./).flatMap((node) => String(node.props.className).split(" "));
}

test("a medida do toque pinta o acento escuro sobre a trilha, e nao o acento cru", () => {
  const painted = paintedTokens(render(<Meter value={72} label="Cota" />));

  expect(painted).toContain("bg-skeleton");
  expect(painted).toContain("bg-accent-text");
  expect(painted).not.toContain("bg-accent");
});

test("a barra de progresso do toque pinta o acento escuro sobre a trilha", () => {
  const painted = paintedTokens(render(<Progress value={40} label="Enviando" />));

  expect(painted).toContain("bg-skeleton");
  expect(painted).toContain("bg-accent-text");
  expect(painted).not.toContain("bg-accent");
});

test("a faixa do toque separa o tom de acento do periodo neutro", () => {
  const painted = paintedTokens(
    render(
      <Tracker
        label="Emissões dos últimos dias"
        data={[{ tone: "accent", label: "Terça" }, { label: "Quarta" }]}
      />,
    ),
  );

  expect(painted).toContain("bg-skeleton");
  expect(painted).toContain("bg-accent-text");
  expect(painted).not.toContain("bg-accent");
});
