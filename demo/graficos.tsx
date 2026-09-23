import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RivoProvider,
  type RivoTheme,
} from "../src/index";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartDonut,
  ChartRadial,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  useChartMotion,
  XAxis,
  YAxis,
  type ChartConfig,
} from "../src/chart";

const MONTHS = [
  { mes: "Mar", emitidas: 38, pagas: 30 },
  { mes: "Abr", emitidas: 45, pagas: 39 },
  { mes: "Mai", emitidas: 41, pagas: 40 },
  { mes: "Jun", emitidas: 52, pagas: 44 },
  { mes: "Jul", emitidas: 58, pagas: 51 },
  { mes: "Ago", emitidas: 63, pagas: 47 },
];

const MONTHS_BEFORE = [
  { mes: "Mar", emitidas: 52, pagas: 20 },
  { mes: "Abr", emitidas: 31, pagas: 28 },
  { mes: "Mai", emitidas: 60, pagas: 51 },
  { mes: "Jun", emitidas: 44, pagas: 30 },
  { mes: "Jul", emitidas: 39, pagas: 36 },
  { mes: "Ago", emitidas: 70, pagas: 58 },
];

const INVOICES = {
  emitidas: { label: "Emitidas" },
  pagas: { label: "Pagas" },
} satisfies ChartConfig;

const SALES = [
  { mes: "Mar", servico: 42000, produto: 12000 },
  { mes: "Abr", servico: 51000, produto: 15000 },
  { mes: "Mai", servico: 47000, produto: 11000 },
  { mes: "Jun", servico: 62000, produto: 18000 },
];

const SALES_BEFORE = [
  { mes: "Mar", servico: 30000, produto: 21000 },
  { mes: "Abr", servico: 64000, produto: 9000 },
  { mes: "Mai", servico: 39000, produto: 16000 },
  { mes: "Jun", servico: 48000, produto: 25000 },
];

const REVENUE = {
  servico: { label: "Servico" },
  produto: { label: "Produto" },
} satisfies ChartConfig;

const STATUS = [
  { name: "pagas", value: 47 },
  { name: "abertas", value: 12 },
  { name: "vencidas", value: 4 },
];

const STATUS_BEFORE = [
  { name: "pagas", value: 28 },
  { name: "abertas", value: 21 },
  { name: "vencidas", value: 11 },
];

const SWAPPABLE = new URLSearchParams(window.location.search).has("trocar");

const STATUSES = {
  pagas: { label: "Pagas" },
  abertas: { label: "Abertas" },
  vencidas: { label: "Vencidas", color: "var(--rc-danger)" },
} satisfies ChartConfig;

function dinheiro(value: number) {
  return `R$ ${(value / 1000).toLocaleString("pt-BR")}k`;
}

function Sample({ theme }: { theme: RivoTheme }) {
  const motion = useChartMotion();
  const [before, setBefore] = useState(false);
  const months = before ? MONTHS_BEFORE : MONTHS;
  const sales = before ? SALES_BEFORE : SALES;
  const status = before ? STATUS_BEFORE : STATUS;
  const total = status.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[820px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      {SWAPPABLE && (
        <Button
          variant="secondary"
          className="mb-6"
          onClick={() => setBefore((current) => !current)}
        >
          Trocar os dados
        </Button>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Notas por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={INVOICES} className="h-64">
              <LineChart data={months} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
                <ChartLegend content={<ChartLegendContent config={INVOICES} />} />
                <Line
                  dataKey="emitidas"
                  stroke="var(--color-emitidas)"
                  strokeWidth={2}
                  dot={false}
                  {...motion}
                />
                <Line
                  dataKey="pagas"
                  stroke="var(--color-pagas)"
                  strokeWidth={2}
                  dot={false}
                  {...motion}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={REVENUE} className="h-64">
              <BarChart data={sales} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={dinheiro} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      config={REVENUE}
                      formatValue={(value) => `R$ ${value.toLocaleString("pt-BR")}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent config={REVENUE} />} />
                <Bar
                  dataKey="servico"
                  stackId="a"
                  fill="var(--color-servico)"
                  radius={[0, 0, 4, 4]}
                  {...motion}
                />
                <Bar
                  dataKey="produto"
                  stackId="a"
                  fill="var(--color-produto)"
                  radius={[4, 4, 0, 0]}
                  {...motion}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Emissao acumulada</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={INVOICES} className="h-56">
              <AreaChart data={months} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent config={INVOICES} />} />
                <Area
                  dataKey="emitidas"
                  stroke="var(--color-emitidas)"
                  fill="var(--color-emitidas)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  {...motion}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Situacao das notas</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartDonut
              data={status}
              valueKey="value"
              nameKey="name"
              config={STATUSES}
              format="integer"
              centerValue={String(total)}
              centerLabel="notas no mes"
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Meta de faturamento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ChartRadial
              value={before ? 57 : 82}
              centerLabel="da meta do mes"
              label={`${before ? 57 : 82}% da meta do mes`}
            />
            <ChartRadial
              value={64}
              variant="segmented"
              centerValue="64%"
              centerLabel="dos clientes ativos"
              label="64% dos clientes ativos"
            />
          </CardContent>
        </Card>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" />
    <Sample theme="rivocode-light" />
  </div>,
);
