import { expect, test } from "bun:test";
import { render } from "@testing-library/react";

import { CSS_BOUNDARIES } from "../src/lib/contrast";
import { Meter } from "../src/components/meter";
import { Progress } from "../src/components/progress";
import { Tracker } from "../src/components/tracker";
import { RivoProvider } from "../src/provider/rivo-provider";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

function classesOf(container: HTMLElement, marker: string): string[] {
  const target = container.ownerDocument.querySelector(marker);
  expect(`${marker} in the tree: ${target !== null}`).toBe(`${marker} in the tree: true`);
  return target!.className.split(" ");
}

test("the meter paints the dark accent over the track, and not the raw accent", () => {
  const { container } = withTheme(
    <Meter value={72} aria-label="Cota" classNames={{ track: "track-m", indicator: "bar-m" }} />,
  );

  expect(classesOf(container, ".track-m")).toContain("bg-skeleton");
  expect(classesOf(container, ".bar-m")).toContain("bg-accent-text");
  expect(classesOf(container, ".bar-m")).not.toContain("bg-accent");
});

test("the progress bar paints the dark accent over the track", () => {
  const { container } = withTheme(
    <Progress
      value={40}
      aria-label="Enviando"
      classNames={{ track: "track-p", indicator: "bar-p" }}
    />,
  );

  expect(classesOf(container, ".track-p")).toContain("bg-skeleton");
  expect(classesOf(container, ".bar-p")).toContain("bg-accent-text");
  expect(classesOf(container, ".bar-p")).not.toContain("bg-accent");
});

test("the still indeterminate bar weaves the stripes with the dark accent", () => {
  const { container } = withTheme(
    <Progress value={null} aria-label="Sincronizando" classNames={{ indicator: "bar-i" }} />,
  );

  const classes = classesOf(container, ".bar-i");
  const woven = classes.filter((name) => name.includes("repeating-linear-gradient"));

  expect(woven.length).toBe(1);
  expect(woven[0]).toContain("var(--rc-accent-text)");
  expect(woven[0]).not.toContain("var(--rc-accent)_");
});

test("the tracker band separates the accent tone from the neutral period", () => {
  const { container } = withTheme(
    <Tracker
      label="Emissões dos últimos dias"
      data={[{ tone: "accent", label: "Terça" }, { label: "Quarta" }]}
    />,
  );

  expect(classesOf(container, '[data-rc-track="accent"]')).toContain("bg-accent-text");
  expect(classesOf(container, '[data-rc-track="accent"]')).not.toContain("bg-accent");
  expect(classesOf(container, '[data-rc-track="neutral"]')).toContain("bg-skeleton");
});

test("the guard measures the bar over the track on the three backgrounds it lands on", () => {
  for (const background of ["--rc-bg", "--rc-surface", "--rc-surface-raised"]) {
    const measured = CSS_BOUNDARIES.some(
      ([front, over]) =>
        front === "--rc-accent-text" &&
        Array.isArray(over) &&
        over[0] === "--rc-skeleton" &&
        over[1] === background,
    );

    expect(`${background} measured: ${measured}`).toBe(`${background} measured: true`);
  }
});

test("every bar that fills a track uses the dark accent, and none was left behind", async () => {
  const files = [
    "src/components/meter.tsx",
    "src/components/progress.tsx",
    "src/components/steps.tsx",
    "src/components/file-upload.tsx",
    "native/src/meter.tsx",
    "native/src/basics.tsx",
    "native/src/steps.tsx",
    "native/src/slider.tsx",
  ];

  expect(files.length).toBeGreaterThan(6);

  const guilty: string[] = [];
  for (const file of files) {
    const source = await Bun.file(file).text();
    for (const [line, text] of source.split("\n").entries()) {
      if (!/h-full[^"']*rounded-pill/.test(text)) continue;

      const written: string[] = text.match(/[\w:[\]./%-]+/g) ?? [];
      if (written.includes("bg-accent")) guilty.push(`${file}:${line + 1}`);
    }
  }

  expect(guilty).toEqual([]);
});
