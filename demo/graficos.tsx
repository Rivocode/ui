import { createRoot } from "react-dom/client";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  RivoProvider,
  type RivoTheme,
} from "../src/index";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartMotion,
  type ChartConfig,
} from "../src/chart";

const MESES = [
  { mes: "Mar", emitidas: 38, pagas: 30 },
  { mes: "Abr", emitidas: 45, pagas: 39 },
  { mes: "Mai", emitidas: 41, pagas: 40 },
  { mes: "Jun", emitidas: 52, pagas: 44 },
  { mes: "Jul", emitidas: 58, pagas: 51 },
  { mes: "Ago", emitidas: 63, pagas: 47 },
];

const NOTAS = { emitidas: { label: "Emitidas" }, pagas: { label: "Pagas" } } satisfies ChartConfig;

const FATURAMENTO = [
  { mes: "Mar", servico: 42000, produto: 12000 },
  { mes: "Abr", servico: 51000, produto: 15000 },
  { mes: "Mai", servico: 47000, produto: 11000 },
  { mes: "Jun", servico: 62000, produto: 18000 },
];

const RECEITA = {
  servico: { label: "Servico" },
  produto: { label: "Produto" },
} satisfies ChartConfig;

const SITUACAO = [
  { nome: "pagas", valor: 47 },
  { nome: "abertas", valor: 12 },
  { nome: "vencidas", valor: 4 },
];

const SITUACOES = {
  pagas: { label: "Pagas" },
  abertas: { label: "Abertas" },
  vencidas: { label: "Vencidas", color: "var(--rc-danger)" },
} satisfies ChartConfig;

function dinheiro(valor: number) {
  return `R$ ${(valor / 1000).toLocaleString("pt-BR")}k`;
}

function Amostra({ theme }: { theme: RivoTheme }) {
  const movimento = useChartMotion();

  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[820px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Notas por mes</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={NOTAS} className="h-64">
              <LineChart data={MESES} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent config={NOTAS} />} />
                <ChartLegend content={<ChartLegendContent config={NOTAS} />} />
                <Line
                  dataKey="emitidas"
                  stroke="var(--color-emitidas)"
                  strokeWidth={2}
                  dot={false}
                  {...movimento}
                />
                <Line
                  dataKey="pagas"
                  stroke="var(--color-pagas)"
                  strokeWidth={2}
                  dot={false}
                  {...movimento}
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
            <ChartContainer config={RECEITA} className="h-64">
              <BarChart data={FATURAMENTO} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={dinheiro} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      config={RECEITA}
                      formatValue={(valor) => `R$ ${valor.toLocaleString("pt-BR")}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent config={RECEITA} />} />
                <Bar
                  dataKey="servico"
                  stackId="a"
                  fill="var(--color-servico)"
                  radius={[0, 0, 4, 4]}
                  {...movimento}
                />
                <Bar
                  dataKey="produto"
                  stackId="a"
                  fill="var(--color-produto)"
                  radius={[4, 4, 0, 0]}
                  {...movimento}
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
            <ChartContainer config={NOTAS} className="h-56">
              <AreaChart data={MESES} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent config={NOTAS} />} />
                <Area
                  dataKey="emitidas"
                  stroke="var(--color-emitidas)"
                  fill="var(--color-emitidas)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                  {...movimento}
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
            <ChartContainer config={SITUACOES} className="h-56">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent config={SITUACOES} hideIndicator />} />
                <Pie
                  data={SITUACAO}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={48}
                  strokeWidth={0}
                  {...movimento}
                >
                  {SITUACAO.map((fatia) => (
                    <Cell key={fatia.nome} fill={`var(--color-${fatia.nome})`} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent config={SITUACOES} />} />
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
    <Amostra theme="rivocode-dark" />
    <Amostra theme="rivocode-light" />
  </div>,
);
