import { expect, spyOn, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, flatBoxComplaint, type ChartConfig } from "../src/chart/chart";
import { ChartTooltipContent } from "../src/chart/chart-tooltip";
import { ChartLegendContent } from "../src/chart/chart-legend";
import { Line, LineChart } from "recharts";

const withTheme = (node: React.ReactNode) =>
  render(<RivoProvider scope="local">{node}</RivoProvider>);

const CONFIG: ChartConfig = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
  canceladas: { label: "Canceladas", color: "var(--rc-danger)" },
};

test("the container publishes one variable per series, in palette order", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartContainer config={CONFIG} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );

  const style = container.querySelector("style")!.innerHTML;
  expect(style).toContain("--color-emitidas: var(--rc-chart-1);");
  expect(style).toContain("--color-pagas: var(--rc-chart-2);");
});

test("a series with its own color does not take a place in the palette queue", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartContainer config={CONFIG} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );
  expect(container.querySelector("style")!.innerHTML).toContain(
    "--color-canceladas: var(--rc-danger);",
  );
});

test("two charts on the same page do not mix their colors", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartContainer config={{ a: { label: "A" } }} className="h-40">
        <svg />
      </ChartContainer>
      <ChartContainer config={{ b: { label: "B" } }} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );

  const frames = [...container.querySelectorAll("[data-rc-chart]")];
  const ids = frames.map((node) => node.getAttribute("data-rc-chart"));
  expect(new Set(ids).size).toBe(2);
});

test("the tooltip shows the series name, and not the raw key", () => {
  render(
    <RivoProvider scope="local">
      <ChartTooltipContent
        active
        label="Agosto"
        config={CONFIG}
        payload={[{ dataKey: "emitidas", value: 42, color: "var(--color-emitidas)" }] as never}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("Agosto")).toBeDefined();
  expect(screen.getByText("Emitidas")).toBeDefined();
  expect(screen.getByText("42")).toBeDefined();
});

test("the tooltip formats the value when asked", () => {
  render(
    <RivoProvider scope="local">
      <ChartTooltipContent
        active
        config={CONFIG}
        formatValue={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
        payload={[{ dataKey: "pagas", value: 2480 }] as never}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("R$ 2.480")).toBeDefined();
});

test("the tooltip disappears when the pointer leaves", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartTooltipContent active={false} config={CONFIG} payload={[] as never} />
    </RivoProvider>,
  );
  expect(container.querySelector("[class*=bg-surface-raised]")).toBeNull();
});

test("the legend uses the config name", () => {
  render(
    <RivoProvider scope="local">
      <ChartLegendContent
        config={CONFIG}
        payload={[{ dataKey: "emitidas", value: "emitidas" }] as never}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("Emitidas")).toBeDefined();
});

test("in a pie, the slice name rules, and not the shared dataKey", () => {
  // Every slice of a pie shares the same `dataKey`. Looking only at it would
  // collapse the whole legend into the same name.
  render(
    <RivoProvider scope="local">
      <ChartLegendContent
        config={CONFIG}
        payload={
          [
            { dataKey: "valor", value: "emitidas" },
            { dataKey: "valor", value: "pagas" },
          ] as never
        }
      />
    </RivoProvider>,
  );
  expect(screen.getByText("Emitidas")).toBeDefined();
  expect(screen.getByText("Pagas")).toBeDefined();
});

test("the pie tooltip also uses the slice name", () => {
  render(
    <RivoProvider scope="local">
      <ChartTooltipContent
        active
        config={CONFIG}
        payload={[{ dataKey: "valor", name: "canceladas", value: 4 }] as never}
      />
    </RivoProvider>,
  );
  expect(screen.getByText("Canceladas")).toBeDefined();
});

test("a loading chart shows a skeleton, and not the empty container", () => {
  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }} isLoading className="h-40">
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );
  expect(document.querySelector(".animate-pulse")).not.toBeNull();
});

test("the error offers a retry when there is somewhere to retry", () => {
  let retries = 0;
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      isError
      onRetry={() => retries++}
      className="h-40"
    >
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
  expect(retries).toBe(1);
});

test("an empty query shows the invitation, and not a chart without points", () => {
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      data={[]}
      empty={{ title: "Sem notas no periodo", description: "Escolha outro intervalo." }}
      className="h-40"
    >
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );
  expect(screen.getByText("Sem notas no periodo")).toBeDefined();
});

const ours = (warn: ReturnType<typeof spyOn<Console, "warn">>) =>
  warn.mock.calls.map((call) => String(call[0])).filter((line) => line.startsWith("[rivocode/ui]"));

test("a container with width and no height is reported: Recharts would draw at 0px", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }}>
      <LineChart data={[{ pagas: 1 }]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  const frame = document.querySelector<HTMLElement>("[data-rc-chart]")!;
  Object.defineProperty(frame, "clientWidth", { configurable: true, value: 620 });
  Object.defineProperty(frame, "clientHeight", { configurable: true, value: 0 });

  await Bun.sleep(260);

  const complaints = ours(warn);
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("no height");
  expect(complaints[0]).toContain("0px");
  warn.mockRestore();
});

test("a container with a measured height silences the piece, and so does a box with no measure at all", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }} className="h-40">
      <LineChart data={[{ pagas: 1 }]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  const frame = document.querySelector<HTMLElement>("[data-rc-chart]")!;
  Object.defineProperty(frame, "clientWidth", { configurable: true, value: 620 });
  Object.defineProperty(frame, "clientHeight", { configurable: true, value: 160 });

  await Bun.sleep(260);

  expect(ours(warn)).toHaveLength(0);
  warn.mockRestore();
});

test("the flat box warning measures width and height, and not just one of them", () => {
  expect(flatBoxComplaint(620, 0)).toContain("0px");
  expect(flatBoxComplaint(620, 1)).toBeUndefined();
  expect(flatBoxComplaint(0, 0)).toBeUndefined();
});
