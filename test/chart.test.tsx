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

test("a moldura publica uma variavel por serie, na ordem da paleta", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartContainer config={CONFIG} className="h-40">
        <svg />
      </ChartContainer>
    </RivoProvider>,
  );

  const estilo = container.querySelector("style")!.innerHTML;
  expect(estilo).toContain("--color-emitidas: var(--rc-chart-1);");
  expect(estilo).toContain("--color-pagas: var(--rc-chart-2);");
});

test("a serie com cor propria nao entra na fila da paleta", () => {
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

test("dois graficos na mesma pagina nao misturam as cores", () => {
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

  const molduras = [...container.querySelectorAll("[data-rc-chart]")];
  const ids = molduras.map((node) => node.getAttribute("data-rc-chart"));
  expect(new Set(ids).size).toBe(2);
});

test("a dica mostra o nome da serie, e nao a chave crua", () => {
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

test("a dica formata o valor quando pedem", () => {
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

test("a dica desaparece quando o ponteiro sai", () => {
  const { container } = render(
    <RivoProvider scope="local">
      <ChartTooltipContent active={false} config={CONFIG} payload={[] as never} />
    </RivoProvider>,
  );
  expect(container.querySelector("[class*=bg-surface-raised]")).toBeNull();
});

test("a legenda usa o nome do config", () => {
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

test("na pizza, o nome da fatia manda, e nao o dataKey compartilhado", () => {
  // Toda fatia de uma pizza divide o mesmo `dataKey`. Olhar so ele faria a
  // legenda inteira cair no mesmo nome.
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

test("a dica da pizza tambem usa o nome da fatia", () => {
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

test("o grafico carregando mostra esqueleto, e nao a moldura vazia", () => {
  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }} isLoading className="h-40">
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );
  expect(document.querySelector(".animate-pulse")).not.toBeNull();
});

test("o erro oferece nova tentativa quando ha para onde tentar", () => {
  let tentou = 0;
  withTheme(
    <ChartContainer
      config={{ pagas: { label: "Pagas" } }}
      isError
      onRetry={() => tentou++}
      className="h-40"
    >
      <LineChart data={[]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  fireEvent.click(screen.getByRole("button", { name: /Tentar de novo/ }));
  expect(tentou).toBe(1);
});

test("consulta vazia mostra o convite, e nao um grafico sem ponto", () => {
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

test("moldura com largura e sem altura e acusada: a Recharts desenharia em 0px", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }}>
      <LineChart data={[{ pagas: 1 }]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  const moldura = document.querySelector<HTMLElement>("[data-rc-chart]")!;
  Object.defineProperty(moldura, "clientWidth", { configurable: true, value: 620 });
  Object.defineProperty(moldura, "clientHeight", { configurable: true, value: 0 });

  await Bun.sleep(260);

  const complaints = ours(warn);
  expect(complaints).toHaveLength(1);
  expect(complaints[0]).toContain("altura");
  warn.mockRestore();
});

test("moldura com altura medida cala a peca, e caixa sem medida nenhuma tambem", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {});

  withTheme(
    <ChartContainer config={{ pagas: { label: "Pagas" } }} className="h-40">
      <LineChart data={[{ pagas: 1 }]}>
        <Line dataKey="pagas" />
      </LineChart>
    </ChartContainer>,
  );

  const moldura = document.querySelector<HTMLElement>("[data-rc-chart]")!;
  Object.defineProperty(moldura, "clientWidth", { configurable: true, value: 620 });
  Object.defineProperty(moldura, "clientHeight", { configurable: true, value: 160 });

  await Bun.sleep(260);

  expect(ours(warn)).toHaveLength(0);
  warn.mockRestore();
});

test("o aviso de caixa chata mede largura e altura, e nao uma das duas", () => {
  expect(flatBoxComplaint(620, 0)).toContain("0px");
  expect(flatBoxComplaint(620, 1)).toBeUndefined();
  expect(flatBoxComplaint(0, 0)).toBeUndefined();
});
