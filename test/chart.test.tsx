import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { ChartContainer, type ChartConfig } from "../src/chart/chart";
import { ChartTooltipContent } from "../src/chart/chart-tooltip";
import { ChartLegendContent } from "../src/chart/chart-legend";

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
  const ids = molduras.map((no) => no.getAttribute("data-rc-chart"));
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
        formatValue={(valor) => `R$ ${valor.toLocaleString("pt-BR")}`}
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
