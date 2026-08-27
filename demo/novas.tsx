import { FileText, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldLabel,
  FilterBar,
  FilterChip,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Popconfirm,
  QueryBoundary,
  RivoProvider,
  Skeleton,
  TimeField,
  TimePicker,
  VirtualList,
  formatTime,
  parseTime,
  useMobile,
  type AppliedFilter,
  type RivoDensity,
  type RivoTheme,
} from "../src/index";
import { stepTime, timeWindow } from "../src/components/time-field";

type Invoice = {
  id: string;
  cliente: string;
  value: string;
  status: "Paga" | "Aberta";
};

const ONE_FILTER: AppliedFilter[] = [{ id: "status", label: "Situacao", value: "Em aberto" }];

const SIX_FILTERS: AppliedFilter[] = [
  { id: "branch", label: "Filial", value: "Matriz", removable: false },
  { id: "status", label: "Situacao", value: "Em aberto" },
  { id: "customer", label: "Cliente", value: "Clinica Sao Lucas Servicos Medicos Ltda" },
  { id: "period", label: "Emissao", value: "01/08 a 31/08" },
  { id: "seller", label: "Vendedor", value: "Ana Beatriz do Nascimento" },
  { id: "city", label: "Cidade", value: "Joao Pessoa" },
];

const REASONS = [
  "Rejeitada pela prefeitura por divergencia no codigo de servico informado na emissao, e devolvida para correcao manual.",
  "Aguardando retorno.",
  "Cancelada a pedido do cliente depois de duas tentativas de reenvio no mesmo dia.",
  "Emitida.",
];

type Note = { id: string; cliente: string; reason: string };

const NOTES: Note[] = Array.from({ length: 2000 }, (_, index) => ({
  id: String(index),
  cliente: `Cliente ${index + 1}`,
  reason: REASONS[index % REASONS.length]!,
}));

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-xs tracking-widest text-fg-subtle uppercase">{title}</p>
      {children}
    </section>
  );
}

function Invoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center justify-between gap-3">
          <span className="text-base text-fg">{invoice.cliente}</span>
          <Badge tone={invoice.status === "Paga" ? "success" : "neutral"}>{invoice.status}</Badge>
        </li>
      ))}
    </ul>
  );
}

function Boundaries() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Carregando</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryBoundary<Invoice[]> isLoading skeletonRows={3} className="min-h-36">
            {(invoices) => <Invoices invoices={invoices} />}
          </QueryBoundary>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carregando com molde</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryBoundary<Invoice[]>
            isLoading
            className="min-h-36"
            skeleton={
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((line) => (
                  <div key={line} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-16 rounded-pill" />
                  </div>
                ))}
              </div>
            }
          >
            {(invoices) => <Invoices invoices={invoices} />}
          </QueryBoundary>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryBoundary<Invoice[]>
            isError
            onRetry={() => {}}
            errorTitle="Nao foi possivel carregar as notas"
            errorMessage="A prefeitura nao respondeu. Tente de novo em alguns minutos."
            className="min-h-36"
          >
            {(invoices) => <Invoices invoices={invoices} />}
          </QueryBoundary>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vazio</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryBoundary
            data={[] as Invoice[]}
            className="min-h-36"
            empty={{
              icon: <FileText aria-hidden="true" />,
              title: "Nenhuma nota por aqui",
              description: "Quando voce emitir a primeira, ela aparece nesta lista.",
              action: <Button size="sm">Emitir nota</Button>,
            }}
          >
            {(invoices) => <Invoices invoices={invoices} />}
          </QueryBoundary>
        </CardContent>
      </Card>
    </div>
  );
}

function Filters() {
  const [one, setOne] = useState(ONE_FILTER);
  const [many, setMany] = useState(SIX_FILTERS);

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-xl">
        <p className="mb-2 text-sm text-fg-subtle">Um filtro</p>
        <FilterBar filters={one} onFiltersChange={setOne} clearFrom={1} />
      </div>

      <div className="max-w-xl">
        <p className="mb-2 text-sm text-fg-subtle">Seis filtros, transbordando</p>
        <FilterBar filters={many} onFiltersChange={setMany} />
      </div>

      <div className="max-w-xl">
        <p className="mb-2 text-sm text-fg-subtle">A linha guardada, sem filtro nenhum</p>
        <FilterBar filters={[]} onFiltersChange={() => {}} />
      </div>

      <div className="max-w-xl">
        <p className="mb-2 text-sm text-fg-subtle">Enquanto a consulta refaz</p>
        <FilterBar filters={SIX_FILTERS} onFiltersChange={() => {}} disabled />
      </div>
    </div>
  );
}

function Chips() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterChip size="sm" label="Situacao" value="Em aberto" onRemove={() => {}} />
      <FilterChip size="md" label="Situacao" value="Em aberto" onRemove={() => {}} />
      <FilterChip size="sm" label="Vencidas" />
      <FilterChip size="md" label="Vencidas" />
      <FilterChip size="md" label="Filial" value="Matriz" />
      <FilterChip
        size="md"
        label="Cliente"
        value="Clinica Sao Lucas Servicos Medicos e Hospitalares Ltda"
        onRemove={() => {}}
      />
      <FilterChip size="md" label="Cliente" value="Otica Central" onRemove={() => {}} disabled />
    </div>
  );
}

function Stepped() {
  const [at, setAt] = useState("08:00");
  const bounds = timeWindow("08:00", "18:00");

  function walk(direction: 1 | -1) {
    setAt(formatTime(stepTime(parseTime(at), direction, 30, bounds)));
  }

  return (
    <Field className="w-56">
      <FieldLabel htmlFor="passo">Horario da entrega</FieldLabel>
      <div className="flex items-end gap-2">
        <TimeField
          id="passo"
          value={at}
          onValueChange={setAt}
          min="08:00"
          max="18:00"
          step={30}
          className="flex-1"
        />
        <Button
          variant="secondary"
          size="iconSm"
          aria-label="Meia hora antes"
          onClick={() => walk(-1)}
        >
          -
        </Button>
        <Button
          variant="secondary"
          size="iconSm"
          aria-label="Meia hora depois"
          onClick={() => walk(1)}
        >
          +
        </Button>
      </div>
      <FieldDescription>Das 08:00 as 18:00, de meia em meia hora.</FieldDescription>
    </Field>
  );
}

function Times() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <Field className="w-40">
        <FieldLabel htmlFor="entrada">Entrada</FieldLabel>
        <TimeField id="entrada" defaultValue="08:00" />
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="impossivel">Hora impossivel</FieldLabel>
        <TimeField id="impossivel" value="25:99" onValueChange={() => {}} />
        <FieldDescription>25:99 nao existe.</FieldDescription>
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="fora">Fora da janela</FieldLabel>
        <TimeField id="fora" value="19:30" onValueChange={() => {}} min="08:00" max="18:00" />
        <FieldDescription>Depois das 18:00.</FieldDescription>
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="vazio">Vazio</FieldLabel>
        <TimeField id="vazio" />
      </Field>

      <Field className="w-40">
        <FieldLabel htmlFor="travado">Travado</FieldLabel>
        <TimeField id="travado" defaultValue="08:00" disabled />
      </Field>

      <Stepped />
    </div>
  );
}

function OpenPicker({ open }: { open: boolean }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => box.current?.querySelector("button")?.click(), 60);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <Field className="w-56">
      <FieldLabel>Horario da entrega</FieldLabel>
      <div ref={box}>
        <TimePicker defaultValue="09:30" min="08:00" max="18:00" step={30} />
      </div>
      <FieldDescription>Grade recortada por min e max.</FieldDescription>
    </Field>
  );
}

function Pickers({ openPanel }: { openPanel: boolean }) {
  return (
    <div
      className={
        openPanel
          ? "flex min-h-[26rem] flex-wrap items-start gap-6"
          : "flex flex-wrap items-start gap-6"
      }
    >
      <OpenPicker open={openPanel} />

      <Field className="w-56">
        <FieldLabel htmlFor="consulta">Horario da consulta</FieldLabel>
        <TimePicker id="consulta" defaultValue="14:30" />
        <FieldDescription>Fechado, passo de quinze minutos.</FieldDescription>
      </Field>

      <Field className="w-56">
        <FieldLabel htmlFor="picker-travado">Travado</FieldLabel>
        <TimePicker id="picker-travado" defaultValue="14:30" disabled />
      </Field>
    </div>
  );
}

function slow() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1500));
}

function Confirms({ openPanel }: { openPanel: boolean }) {
  return (
    <div className={openPanel ? "grid gap-10 lg:grid-cols-2" : "grid gap-6 lg:grid-cols-2"}>
      <div className={openPanel ? "min-h-56" : undefined}>
        <p className="mb-2 text-sm text-fg-subtle">Perigo</p>
        <Popconfirm
          defaultOpen={openPanel}
          title="Excluir a nota 4813?"
          description="A linha sai da lista e o cliente deixa de ver o documento."
          confirmLabel="Excluir"
          trigger={
            <Button variant="ghost" size="iconSm" aria-label="Excluir a nota 4813">
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          }
          onConfirm={() => {}}
        />
      </div>

      <div className={openPanel ? "min-h-56" : undefined}>
        <p className="mb-2 text-sm text-fg-subtle">Sem perigo</p>
        <Popconfirm
          defaultOpen={openPanel}
          tone="neutral"
          title="Arquivar o orcamento?"
          description="Ele sai da lista ativa e continua na busca por arquivados."
          confirmLabel="Arquivar"
          trigger={<Button variant="secondary">Arquivar</Button>}
          onConfirm={() => {}}
        />
      </div>

      <div className={openPanel ? "min-h-56" : undefined}>
        <p className="mb-2 text-sm text-fg-subtle">Esperando a chamada</p>
        <Popconfirm
          defaultOpen={openPanel}
          loading
          title="Excluir o anexo?"
          description="O arquivo sai do servidor e o link para de responder."
          confirmLabel="Excluir"
          trigger={<Button variant="secondary">Excluir anexo</Button>}
          onConfirm={slow}
        />
      </div>

      <div className={openPanel ? "min-h-56" : undefined}>
        <p className="mb-2 text-sm text-fg-subtle">Promessa de verdade</p>
        <Popconfirm
          title="Excluir o anexo?"
          description="O arquivo sai do servidor e o link para de responder."
          confirmLabel="Excluir"
          trigger={<Button variant="secondary">Excluir anexo</Button>}
          onConfirm={slow}
        />
      </div>
    </div>
  );
}

function Lists() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="mb-2 text-sm text-fg-subtle">Duas mil notas, de altura medida</p>
        <VirtualList
          items={NOTES}
          itemKey={(note) => note.id}
          maxHeight={320}
          itemHeight={64}
          label="Notas com pendencia"
          renderItem={(note, index) => (
            <div className="flex flex-col gap-1 border-b border-border px-3 py-3">
              <p className="text-base text-fg">
                {index + 1}. {note.cliente}
              </p>
              <p className="text-sm text-fg-muted">{note.reason}</p>
            </div>
          )}
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-fg-subtle">Com respiro entre os itens</p>
        <VirtualList
          items={NOTES}
          itemKey={(note) => note.id}
          maxHeight={320}
          itemHeight={88}
          gap={8}
          className="border-none bg-transparent"
          classNames={{ item: "px-1" }}
          label="Notas em cartoes"
          renderItem={(note) => (
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>{note.cliente}</ItemTitle>
                <ItemDescription>{note.reason}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge tone="neutral">Pendente</Badge>
              </ItemActions>
            </Item>
          )}
        />
      </div>
    </div>
  );
}

function Sample({
  theme,
  density,
  openPicker,
}: {
  theme: RivoTheme;
  density: RivoDensity;
  openPicker: boolean;
}) {
  const isMobile = useMobile();

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="flex flex-col gap-12">
        <Block title="QueryBoundary">
          <Boundaries />
        </Block>

        <Block title="FilterBar">
          <Filters />
        </Block>

        <Block title="FilterChip">
          <Chips />
        </Block>

        <Block title="TimeField">
          <Times />
        </Block>

        <Block title="TimePicker">
          <Pickers openPanel={openPicker && !isMobile} />
        </Block>

        <Block title="Popconfirm">
          <Confirms openPanel={!isMobile} />
        </Block>

        <Block title="VirtualList">
          <Lists />
        </Block>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" density="comfortable" openPicker={false} />
    <Sample theme="rivocode-light" density="compact" openPicker />
  </div>,
);
