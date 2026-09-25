import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RivoProvider,
  type RivoDensity,
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
  ChartFunnel,
  ChartGauge,
  ChartHeatmap,
  ChartRadial,
  ChartTreemap,
  type ChartGaugeBand,
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


const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
const HOURS = Array.from({ length: 12 }, (_, index) => `${index + 8}h`);
const WEIGHT: Record<string, number> = { Seg: 1.2, Ter: 1, Qua: 1.1, Qui: 0.9, Sex: 1.4, Sab: 0.3 };

const EMISSIONS = DAYS.flatMap((day) =>
  HOURS.map((hour, index) => ({
    day,
    hour,
    total:
      day === "Dom"
        ? null
        : Math.round((WEIGHT[day] ?? 0) * (6 + 10 * Math.sin((index / 11) * Math.PI))),
  })),
).filter((cell) => !(cell.day === "Sab" && Number.parseInt(cell.hour) > 13));

const OVERDUE: ChartGaugeBand[] = [
  { until: 5, tone: "success", label: "Em dia" },
  { until: 12, tone: "warning", label: "Atencao" },
  { until: 20, tone: "danger", label: "Critico" },
];

const ONBOARDING = [
  { stage: "Visitaram a pagina de precos", total: 12480 },
  { stage: "Criaram conta", total: 3120 },
  { stage: "Configuraram o certificado", total: 1406 },
  { stage: "Emitiram a primeira nota", total: 988 },
];

const SERVICES = [
  { service: "Suporte tecnico", total: 182400 },
  { service: "Consultoria", total: 96300 },
  { service: "Hospedagem", total: 71900 },
  { service: "Obras", total: 38200 },
  { service: "Manutencao", total: 22700 },
  { service: "Intermediacao", total: 9800 },
  { service: "Funerarios", total: 3100 },
];

function Repertoire({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quando as notas saem</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartHeatmap
              data={EMISSIONS}
              rowKey="day"
              columnKey="hour"
              valueKey="total"
              rows={DAYS}
              columns={HOURS}
              label="Notas emitidas por dia da semana e hora"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inadimplencia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ChartGauge value={3.1} max={20} bands={OVERDUE} centerValue="3,1%" />
            <ChartGauge value={8.4} max={20} bands={OVERDUE} centerValue="8,4%" />
            <ChartGauge value={17.9} max={20} bands={OVERDUE} centerValue="17,9%" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adesao em agosto</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartFunnel
              data={ONBOARDING}
              valueKey="total"
              nameKey="stage"
              format="integer"
              label="Funil de adesao em agosto"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento por servico</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartTreemap
              data={SERVICES}
              valueKey="total"
              nameKey="service"
              format="currencyShort"
              label="Faturamento do mes por servico"
              className="h-72"
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
    <Repertoire theme="rivocode-dark" density="comfortable" />
    <Repertoire theme="rivocode-light" density="comfortable" />
    <Repertoire theme="rivocode-dark" density="compact" />
    <Repertoire theme="rivocode-light" density="compact" />
  </div>,
);
