import { expect, test } from "bun:test";
import type { ReactTestRenderer } from "react-test-renderer";

import { Meter, Progress, Tracker } from "../src";
import { byClass, render } from "./helpers";

function paintedTokens(screen: ReactTestRenderer): string[] {
  return byClass(screen, /./).flatMap((node) => String(node.props.className).split(" "));
}

test("the touch meter paints the dark accent over the track, not the raw accent", () => {
  const painted = paintedTokens(render(<Meter value={72} label="Cota" />));

  expect(painted).toContain("bg-skeleton");
  expect(painted).toContain("bg-accent-text");
  expect(painted).not.toContain("bg-accent");
});

test("the touch progress bar paints the dark accent over the track", () => {
  const painted = paintedTokens(render(<Progress value={40} label="Enviando" />));

  expect(painted).toContain("bg-skeleton");
  expect(painted).toContain("bg-accent-text");
  expect(painted).not.toContain("bg-accent");
});

test("the touch band separates the accent tone from the neutral period", () => {
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
