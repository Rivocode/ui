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
  expect(`${marker} na arvore: ${target !== null}`).toBe(`${marker} na arvore: true`);
  return target!.className.split(" ");
}

test("a medida pinta o acento escuro sobre a trilha, e nao o acento cru", () => {
  const { container } = withTheme(
    <Meter value={72} aria-label="Cota" classNames={{ track: "trilha-m", indicator: "barra-m" }} />,
  );

  expect(classesOf(container, ".trilha-m")).toContain("bg-skeleton");
  expect(classesOf(container, ".barra-m")).toContain("bg-accent-text");
  expect(classesOf(container, ".barra-m")).not.toContain("bg-accent");
});

test("a barra de progresso pinta o acento escuro sobre a trilha", () => {
  const { container } = withTheme(
    <Progress
      value={40}
      aria-label="Enviando"
      classNames={{ track: "trilha-p", indicator: "barra-p" }}
    />,
  );

  expect(classesOf(container, ".trilha-p")).toContain("bg-skeleton");
  expect(classesOf(container, ".barra-p")).toContain("bg-accent-text");
  expect(classesOf(container, ".barra-p")).not.toContain("bg-accent");
});

test("a barra indeterminada parada tece as faixas com o acento escuro", () => {
  const { container } = withTheme(
    <Progress value={null} aria-label="Sincronizando" classNames={{ indicator: "barra-i" }} />,
  );

  const classes = classesOf(container, ".barra-i");
  const woven = classes.filter((name) => name.includes("repeating-linear-gradient"));

  expect(woven.length).toBe(1);
  expect(woven[0]).toContain("var(--rc-accent-text)");
  expect(woven[0]).not.toContain("var(--rc-accent)_");
});

test("a faixa do tracker separa o tom de acento do periodo neutro", () => {
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

test("a guarda mede a barra sobre a trilha nos tres fundos em que ela pousa", () => {
  for (const background of ["--rc-bg", "--rc-surface", "--rc-surface-raised"]) {
    const measured = CSS_BOUNDARIES.some(
      ([front, over]) =>
        front === "--rc-accent-text" &&
        Array.isArray(over) &&
        over[0] === "--rc-skeleton" &&
        over[1] === background,
    );

    expect(`${background} medido: ${measured}`).toBe(`${background} medido: true`);
  }
});

test("toda barra que enche uma trilha usa o acento escuro, e nenhuma ficou para tras", async () => {
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
