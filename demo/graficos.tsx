import { createRoot } from "react-dom/client";
import {
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
  Cell,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Line,
  LineChart,
  Pie,
  PieChart,
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

const INVOICES = { emitidas: { label: "Emitidas" }, pagas: { label: "Pagas" } } satisfies ChartConfig;

const SALES = [
  { mes: "Mar", servico: 42000, produto: 12000 },
  { mes: "Abr", servico: 51000, produto: 15000 },
  { mes: "Mai", servico: 47000, produto: 11000 },
  { mes: "Jun", servico: 62000, produto: 18000 },
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

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[820px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Notas por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={INVOICES} className="h-64">
              <LineChart data={MONTHS} margin={{ left: -20, right: 8, top: 8 }}>
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
              <BarChart data={SALES} margin={{ left: -8, right: 8, top: 8 }}>
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
              <AreaChart data={MONTHS} margin={{ left: -20, right: 8, top: 8 }}>
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
            <ChartContainer config={STATUSES} className="h-56">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent config={STATUSES} hideIndicator />} />
                <Pie
                  data={STATUS}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={48}
                  strokeWidth={0}
                  {...motion}
                >
                  {STATUS.map((fatia) => (
                    <Cell key={fatia.name} fill={`var(--color-${fatia.name})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent config={STATUSES} />} />
              </PieChart>
            </ChartContainer>
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
