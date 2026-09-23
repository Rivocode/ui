import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";

import { Alert, AlertTitle } from "../src/components/alert";
import { DataTable, type Column } from "../src/components/data-table";
import { EmptyState } from "../src/components/empty-state";
import { FileUploadItem } from "../src/components/file-upload";
import { FilterBar, type AppliedFilter } from "../src/components/filter-bar";
import { Indicator } from "../src/components/indicator";
import { Meter } from "../src/components/meter";
import { Progress } from "../src/components/progress";
import { Stat } from "../src/components/stat";
import { TagsInput } from "../src/components/tags-input";
import { Timeline, TimelineItem } from "../src/components/timeline";
import { Tracker } from "../src/components/tracker";
import { cn } from "../src/lib/cn";
import { RivoProvider } from "../src/provider/rivo-provider";

const shape = await Bun.file("src/tokens/forma.css").text();
const contract = await Bun.file("src/tokens/contract.css").text();

const tokensOf = (element: Element | null | undefined) => {
  expect(element).toBeTruthy();
  return (element!.getAttribute("class") ?? "").split(" ").filter(Boolean);
};

const ENTRANCES = ["enter", "appear", "pop", "fill", "reveal"];

test("cada entrada dura um token, curva da casa, e nao prende estado depois de acabar", () => {
  for (const name of ENTRANCES) {
    const hit = new RegExp(`--animate-${name}:\\s*([\\w-]+) var\\(--rc-duration-(\\w+)\\) var\\(--rc-ease\\) (\\w+);`).exec(
      contract,
    );
    expect(hit).not.toBeNull();
    const [, keyframe, duration, fill] = hit!;
    expect(["fast", "base", "slow"]).toContain(duration!);
    expect(fill).toBe("backwards");
    expect(shape).toMatch(new RegExp(`@keyframes ${keyframe}\\s*\\{`));
  }

  for (const keyframe of ["rc-enter", "rc-pop", "rc-fill", "rc-reveal"]) {
    const body = new RegExp(`@keyframes ${keyframe}\\s*\\{([\\s\\S]*?)\\n\\}`).exec(shape)![1]!;
    expect(body).toContain("from");
    expect(body).not.toMatch(/\bto\b\s*\{/);
  }

  const reduced = shape.slice(shape.indexOf("@media (prefers-reduced-motion: reduce)"));
  for (const duration of ["fast", "base", "slow"]) {
    expect(reduced).toContain(`--rc-duration-${duration}: 0ms;`);
  }
});

test("quem usa desliga a entrada com animate-none, e o cn fica so com ela", () => {
  for (const name of ENTRANCES) {
    expect(cn(`animate-${name}`, "animate-none").split(" ")).toEqual(["animate-none"]);
  }
});

const cases: [string, () => ReactElement, (root: HTMLElement) => Element | null, string][] = [
  [
    "Alert",
    () => (
      <Alert tone="success">
        <AlertTitle>Nota emitida</AlertTitle>
      </Alert>
    ),
    () => screen.getByRole("status"),
    "animate-enter",
  ],
  [
    "EmptyState",
    () => <EmptyState title="Nenhuma nota" description="Ainda." />,
    (root) => root.firstElementChild,
    "animate-enter",
  ],
  [
    "Stat",
    () => <Stat label="Faturado" value="R$ 10" />,
    () => screen.getByText("R$ 10").closest(".py-4"),
    "animate-appear",
  ],
  [
    "Progress",
    () => <Progress value={40} label="Envio" />,
    () => screen.getByRole("progressbar").querySelector(".bg-accent-text"),
    "animate-fill",
  ],
  [
    "Meter",
    () => <Meter value={3} max={4} label="Cota" />,
    () => screen.getByRole("meter").querySelector(".bg-accent-text"),
    "animate-fill",
  ],
  [
    "Tracker",
    () => (
      <RivoProvider>
        <Tracker data={[{ label: "ok", tone: "success" }]} label="Uptime" />
      </RivoProvider>
    ),
    (root) => root.querySelector("[tabindex]"),
    "animate-reveal",
  ],
  [
    "Indicator",
    () => (
      <Indicator count={3} label="3 novas">
        <button type="button">Sino</button>
      </Indicator>
    ),
    (root) => root.querySelector("[aria-hidden='true']"),
    "animate-pop",
  ],
  [
    "TimelineItem",
    () => (
      <Timeline>
        <TimelineItem title="Nota emitida" />
      </Timeline>
    ),
    (root) => root.querySelector("li"),
    "animate-enter",
  ],
  [
    "FileUploadItem",
    () => <FileUploadItem name="nota.xml" size={100} onRemove={() => {}} />,
    (root) => root.querySelector("li"),
    "animate-enter",
  ],
];

for (const [name, element, find, token] of cases) {
  test(`${name} entra na montagem com ${token}`, () => {
    const { container } = render(element());
    let target: Element | null = null;
    try {
      target = find(container);
    } catch {
      target = null;
    }
    expect(tokensOf(target)).toContain(token);
  });
}

test("a barra do Progress e do Meter enche da esquerda, e o indeterminado troca a entrada pelo vaivem", () => {
  render(<Progress value={40} label="Envio" />);
  const fill = tokensOf(screen.getByRole("progressbar").querySelector(".bg-accent-text"));
  expect(fill).toContain("origin-left");
  expect(fill).toContain("data-[indeterminate]:animate-indeterminate");
});

type Invoice = { id: string; amount: number };
const columns: Column<Invoice>[] = [{ key: "amount", header: "Valor", sortable: true }];
const invoices: Invoice[] = [
  { id: "1", amount: 3 },
  { id: "2", amount: 1 },
];

test("o corpo da tabela esmaece uma vez ao sair do esqueleto, e ordenar nao repete", () => {
  const table = (data: Invoice[] | undefined) => (
    <DataTable data={data} columns={columns} rowKey={(row) => row.id} />
  );
  const view = render(table(undefined));
  const waiting = view.container.querySelector("tbody")!;
  expect(tokensOf(waiting)).not.toContain("animate-appear");

  view.rerender(table(invoices));
  const arrived = view.container.querySelector("tbody")!;
  expect(arrived).not.toBe(waiting);
  expect(tokensOf(arrived)).toContain("animate-appear");
  expect(arrived.querySelectorAll("tr[data-rc-row], tr").length).toBeGreaterThan(1);

  fireEvent.click(screen.getByRole("button", { name: /valor/i }));
  expect(view.container.querySelector("tbody")).toBe(arrived);
});

test("so a ficha que chega depois cresce; as que ja estavam nascem paradas e assim ficam", () => {
  const tags = (value: string[]) => (
    <TagsInput value={value} onValueChange={() => {}} aria-label="Etiquetas" />
  );
  const view = render(tags(["nfse"]));
  const chip = (text: string) => screen.getByText(text).closest("span")!;
  expect(tokensOf(chip("nfse"))).not.toContain("animate-pop");

  view.rerender(tags(["nfse", "iss"]));
  expect(tokensOf(chip("nfse"))).not.toContain("animate-pop");
  expect(tokensOf(chip("iss"))).toContain("animate-pop");

  view.rerender(tags(["nfse", "iss", "pis"]));
  expect(tokensOf(chip("iss"))).toContain("animate-pop");
  expect(tokensOf(chip("nfse"))).not.toContain("animate-pop");

  const filters = (list: AppliedFilter[]) => <FilterBar filters={list} onFiltersChange={() => {}} />;
  const cliente = { id: "cliente", label: "Cliente", value: "Acme" };
  const status = { id: "status", label: "Status", value: "Paga" };
  const bar = render(filters([cliente]));
  const item = (text: string) => screen.getByText(text).closest("li")!;
  expect(tokensOf(item("Acme"))).not.toContain("animate-pop");
  bar.rerender(filters([cliente, status]));
  expect(tokensOf(item("Paga"))).toContain("animate-pop");
  expect(tokensOf(item("Acme"))).not.toContain("animate-pop");
});
