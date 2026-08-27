import { Download, MoreHorizontal, Plus, Wallet } from "lucide-react";
import { createRoot } from "react-dom/client";

import {
  AspectRatio,
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Code,
  CodeBlock,
  DescriptionItem,
  DescriptionList,
  Kbd,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  PageHeader,
  RelativeTime,
  RivoProvider,
  Splitter,
  Stat,
  Timeline,
  TimelineItem,
  Tracker,
  type RivoDensity,
  type RivoTheme,
  type TrackerPoint,
} from "../src/index";
import { Sparkline, currencyShort } from "../src/chart";

const NOW = new Date("2026-08-25T18:00:00Z");

const BILLED = [128, 155, 142, 189, 205, 247];
const RECEIVED = [96, 130, 121, 154, 168, 198];
const OVERDUE = [2, 3, 3, 5, 4, 6];

const EMISSIONS: TrackerPoint[] = Array.from({ length: 30 }, (_, index) => {
  const day = 30 - index;
  if (day === 12) return { tone: "danger", label: `Dia ${day}: 3 rejeitadas` };
  if (day === 11) return { tone: "warning", label: `Dia ${day}: fila acima do normal` };
  if (day === 4) return { tone: "neutral", label: `Dia ${day}: sem emissao` };
  return { tone: "success", label: `Dia ${day}: todas autorizadas` };
});

const INVOICES = [
  { id: "4813", cliente: "Clinica Sao Lucas", value: "R$ 2.480,00" },
  { id: "4814", cliente: "Transportes Cabo Branco", value: "R$ 940,00" },
  { id: "4815", cliente: "Supermercado Tambau", value: "R$ 12.300,00" },
  { id: "4816", cliente: "Construtora Litoral", value: "R$ 6.150,00" },
];

const RETURN = `{
  "numero": "4813",
  "situacao": "autorizada",
  "chave": "35240612345678000199550010000048131234567890"
}`;

const DANFE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180">',
      '<rect width="320" height="180" fill="#8b9199" fill-opacity="0.22"/>',
      '<rect x="20" y="20" width="120" height="12" rx="6" fill="#8b9199"/>',
      '<rect x="20" y="44" width="200" height="8" rx="4" fill="#8b9199" fill-opacity="0.7"/>',
      '<rect x="20" y="60" width="164" height="8" rx="4" fill="#8b9199" fill-opacity="0.7"/>',
      '<rect x="20" y="92" width="280" height="1" fill="#8b9199"/>',
      '<rect x="20" y="106" width="280" height="26" rx="4" fill="#8b9199" fill-opacity="0.45"/>',
      '<rect x="20" y="146" width="96" height="14" rx="7" fill="#8b9199"/>',
      '<rect x="236" y="146" width="64" height="14" rx="7" fill="#8b9199" fill-opacity="0.7"/>',
      "</svg>",
    ].join(""),
  );

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function Numbers() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Stat
          label="Faturado em agosto"
          value={currencyShort(246_700)}
          delta={20}
          deltaLabel="sobre julho"
          icon={<Wallet size={18} aria-hidden="true" />}
          hint="Tudo que foi emitido no mes, pago ou nao."
          chart={
            <Sparkline
              data={BILLED}
              variant="area"
              trend="auto"
              label="Faturado nos ultimos seis meses"
              className="h-8 w-full"
            />
          }
        />

        <Stat
          label="Recebido"
          value={currencyShort(198_300)}
          delta={12_400}
          deltaFormat="currencyShort"
          deltaLabel="sobre julho"
          deltaVariant="pill"
          chart={
            <Sparkline
              data={RECEIVED}
              variant="bar"
              label="Recebido nos ultimos seis meses"
              className="h-8 w-full"
            />
          }
          actions={
            <Menu>
              <MenuTrigger
                render={<Button variant="ghost" size="iconSm" aria-label="Acoes do indicador" />}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </MenuTrigger>
              <MenuContent>
                <MenuItem>Ver recebimentos</MenuItem>
                <MenuItem>Exportar planilha</MenuItem>
              </MenuContent>
            </Menu>
          }
        />

        <Stat
          label="Vencidas"
          value="6"
          delta={50}
          deltaLabel="sobre julho"
          invert
          hint="Notas com vencimento passado e sem baixa."
          chart={
            <Sparkline
              data={OVERDUE.map((point) => -point)}
              variant="area"
              trend="auto"
              label="Vencidas nos ultimos seis meses"
              className="h-8 w-full"
            />
          }
        />
      </div>

      <Stat
        label="Emissoes autorizadas"
        value="1.284"
        delta={4}
        deltaLabel="sobre o mes passado"
        deltaVariant="pill"
        className="max-w-md"
        footer={<Tracker label="Emissoes dos ultimos 30 dias" data={EMISSIONS} />}
      />
    </div>
  );
}

function ListAndDetail() {
  return (
    <div className="h-80 w-full max-w-3xl">
      <Splitter
        label="Lista e detalhe"
        defaultSize={38}
        min={25}
        className="h-full overflow-hidden rounded-xl border border-border bg-surface"
        start={
          <ul className="flex flex-col py-2">
            {INVOICES.map((invoice, index) => (
              <li
                key={invoice.id}
                className={
                  "flex flex-col gap-0.5 px-3 py-2 " + (index === 0 ? "bg-accent-subtle" : "")
                }
              >
                <span className="truncate text-base text-fg">{invoice.cliente}</span>
                <span className="font-mono text-xs text-fg-subtle">
                  {invoice.id} · {invoice.value}
                </span>
              </li>
            ))}
          </ul>
        }
        end={
          <div className="flex flex-col gap-3 p-4">
            <p className="font-display text-lg text-fg">Nota 4813</p>
            <DescriptionList>
              <DescriptionItem label="CNPJ">
                <span className="font-mono">12.345.678/0001-90</span>
              </DescriptionItem>
              <DescriptionItem label="Emissao">05/08/2026</DescriptionItem>
              <DescriptionItem label="Vencimento">17/09/2026</DescriptionItem>
              <DescriptionItem label="Situacao">
                <Badge tone="success" size="sm">
                  Paga
                </Badge>
              </DescriptionItem>
              <DescriptionItem label="Valor">
                <span className="font-mono">{currencyShort(2480)}</span>
              </DescriptionItem>
            </DescriptionList>
          </div>
        }
      />
    </div>
  );
}

function Trail() {
  return (
    <Timeline>
      <TimelineItem
        title="Emitida"
        tone="accent"
        by="Ana Prado"
        at={<RelativeTime value={new Date("2026-08-25T12:04:00Z")} now={NOW} />}
      />
      <TimelineItem
        title="Autorizada pela prefeitura"
        tone="success"
        at={<RelativeTime value={new Date("2026-08-25T12:05:00Z")} now={NOW} />}
      >
        Protocolo 2026.4813.99
      </TimelineItem>
      <TimelineItem
        title="Enviada por email"
        by="Rotina das 18h"
        at={<RelativeTime value={new Date("2026-08-22T18:00:00Z")} now={NOW} cutoff="month" />}
      />
      <TimelineItem
        title="Cancelada"
        tone="danger"
        by="Carlos Nunes"
        at={<RelativeTime value={new Date("2026-02-11T10:00:00Z")} now={NOW} cutoff="month" />}
      >
        Motivo: dados do destinatario incorretos
      </TimelineItem>
      <TimelineItem title="Substituicao pendente" pending />
    </Timeline>
  );
}

function Sample({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="flex flex-col gap-12">
        <PageHeader
          title="Notas fiscais"
          titleAs="h2"
          description="Tudo que foi emitido no mes, pago ou nao."
          breadcrumb={
            <Breadcrumb
              items={[
                { label: "RivoCode", href: "#" },
                { label: "Financeiro", href: "#" },
                { label: "Notas fiscais" },
              ]}
            />
          }
          actions={
            <>
              <Button variant="secondary">
                <Download size={16} aria-hidden="true" />
                Exportar
              </Button>
              <Button>
                <Plus size={16} aria-hidden="true" />
                Nova nota
              </Button>
            </>
          }
        />

        <Block title="Stat, Sparkline e Tracker">
          <Numbers />
        </Block>

        <Block title="Splitter e DescriptionList">
          <ListAndDetail />
        </Block>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Trilha da nota</CardTitle>
            </CardHeader>
            <CardContent>
              <Trail />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retorno da prefeitura</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-base text-fg-muted">
                A consulta bate em <Code>POST /notas</Code> e devolve a chave de acesso.
              </p>
              <CodeBlock title="POST /notas" lineNumbers copyable>
                {RETURN}
              </CodeBlock>
              <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
                Copie a chave com <Kbd size="sm" keys="mod+c" /> ou abra a paleta com{" "}
                <Kbd size="sm" keys="mod+k" />.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Previa do DANFE</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <AspectRatio
                ratio={16 / 9}
                className="overflow-hidden rounded-lg border border-border bg-surface-raised"
              >
                <img
                  src={DANFE}
                  alt="Previa do DANFE da nota 4813"
                  className="size-full object-cover"
                />
              </AspectRatio>
              <p className="text-sm text-fg-muted">
                A moldura ja tem altura antes de a imagem chegar, entao a pagina nao pula.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" density="comfortable" />
    <Sample theme="rivocode-light" density="compact" />
  </div>,
);
