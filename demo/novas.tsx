import {
  Download,
  FileText,
  Heart,
  Home,
  Pencil,
  RefreshCw,
  Settings,
  Trash2,
  Users,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  ActionBar,
  AppShell,
  Badge,
  Banner,
  buildPixPayload,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Carousel,
  CookieConsent,
  CurrencyInput,
  DataTable,
  Field,
  FieldDescription,
  FieldLabel,
  FilterBar,
  FilterChip,
  formatTime,
  Heading,
  IconButton,
  ImageViewer,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Link,
  NotificationCenter,
  parseTime,
  PixCode,
  Popconfirm,
  PostalCodeField,
  QRCode,
  QueryBoundary,
  Rating,
  RivoProvider,
  SearchInput,
  SidebarBrand,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  Skeleton,
  Text,
  TimeField,
  TimePicker,
  type AppliedFilter,
  type Column,
  type NotificationItem,
  type PostalAddress,
  type RivoDensity,
  type RivoTheme,
  useMobile,
  VirtualList,
} from "../src/index";
import { stepTime, timeWindow } from "../src/components/time-field";
import { PHOTOS } from "./fotos";

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

type BatchRow = { id: string; number: string; customer: string; amount: string };

const BATCH: BatchRow[] = [
  { id: "1", number: "1042", customer: "Padaria Aurora", amount: "R$ 1.280,00" },
  { id: "2", number: "1043", customer: "Transportes Cabo Branco", amount: "R$ 4.950,00" },
  { id: "3", number: "1044", customer: "Clinica Sao Lucas", amount: "R$ 2.310,00" },
  { id: "4", number: "1045", customer: "Mercado Tambau", amount: "R$ 860,00" },
];

const BATCH_COLUMNS: Column<BatchRow>[] = [
  { key: "number", header: "Nota" },
  { key: "customer", header: "Cliente" },
  { key: "amount", header: "Valor", align: "right" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section data-rc-shot={title} className="flex flex-col gap-3">
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

function Headings() {
  return (
    <div className="flex flex-col gap-2">
      <Heading level={2}>Notas fiscais</Heading>
      <Heading level={3}>Emitidas em agosto</Heading>
      <Heading level={4}>Clínica São Lucas</Heading>
      <Heading level={2} size="md">
        Nivel 2 no corpo md
      </Heading>
      <div className="w-56">
        <Heading level={3} truncate>
          Clínica São Lucas Serviços Médicos Ltda
        </Heading>
      </div>
    </div>
  );
}

function Texts() {
  return (
    <div className="flex max-w-md flex-col gap-2">
      <Text size="base" tone="neutral">
        Texto corrido, com{" "}
        <Text render={<span />} weight="semibold">
          R$ 48.310,00
        </Text>{" "}
        no meio.
      </Text>
      <Text size="base" tone="muted">
        Secundario, no tom muted.
      </Text>
      <Text size="sm" tone="subtle">
        Legenda no tom subtle.
      </Text>
      <div className="flex flex-wrap gap-4">
        <Text size="sm" tone="accent">
          accent
        </Text>
        <Text size="sm" tone="success">
          success
        </Text>
        <Text size="sm" tone="warning">
          warning
        </Text>
        <Text size="sm" tone="danger">
          danger
        </Text>
        <Text size="sm" tone="info">
          info
        </Text>
      </div>
      <div className="w-64 rounded-md bg-surface-raised p-3 shadow-2">
        <Text size="sm" tone="success">
          success sobre surface-raised
        </Text>
        <Text size="sm" tone="warning">
          warning sobre surface-raised
        </Text>
        <Text size="sm" tone="info">
          info sobre surface-raised
        </Text>
      </div>
      <div className="w-64">
        <Text size="sm" tone="muted" lineClamp={2}>
          {REASONS[0]}
        </Text>
      </div>
    </div>
  );
}

function Links() {
  return (
    <div className="flex max-w-md flex-col gap-3">
      <Text size="base" tone="muted">
        Veja o <Link href="#">espelho da nota</Link> ou o{" "}
        <Link href="https://www.gov.br/nfse" external>
          Portal da NFS-e
        </Link>
        .
      </Text>
      <nav aria-label="Rodape" className="flex gap-4 text-sm">
        <Link href="#" tone="neutral" underline="hover">
          Termos
        </Link>
        <Link href="#" tone="muted" underline="hover">
          Privacidade
        </Link>
      </nav>
      <Text size="sm" tone="danger">
        Nota rejeitada.{" "}
        <Link href="#" tone="inherit">
          Ver motivo
        </Link>
      </Text>
    </div>
  );
}

function IconButtons() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconButton label="Nova nota">
          <Pencil />
        </IconButton>
        <IconButton variant="secondary" label="Baixar PDF">
          <Download />
        </IconButton>
        <IconButton variant="outline" label="Atualizar lista">
          <RefreshCw />
        </IconButton>
        <IconButton variant="ghost" label="Editar nota" tooltip>
          <Pencil />
        </IconButton>
        <IconButton variant="destructive" label="Excluir nota">
          <Trash2 />
        </IconButton>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <IconButton size="sm" variant="secondary" label="Baixar PDF pequeno">
          <Download />
        </IconButton>
        <IconButton size="md" variant="secondary" label="Baixar PDF medio">
          <Download />
        </IconButton>
        <IconButton size="lg" variant="secondary" label="Baixar PDF grande">
          <Download />
        </IconButton>
        <IconButton variant="secondary" label="Sincronizando" loading>
          <RefreshCw />
        </IconButton>
        <IconButton variant="secondary" label="Indisponivel" disabled>
          <Download />
        </IconButton>
        <Field className="w-48">
          <FieldLabel>Mesma altura do campo</FieldLabel>
          <div className="flex items-center gap-2">
            <input
              aria-label="Numero da nota"
              className="h-[var(--rc-control-md)] min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-2 text-fg"
            />
            <IconButton variant="secondary" label="Buscar nota">
              <FileText />
            </IconButton>
          </div>
        </Field>
      </div>
    </div>
  );
}

function Batch() {
  const [selected, setSelected] = useState<string[]>(["2", "3"]);

  return (
    <div className="flex flex-col gap-3">
      <DataTable
        data={BATCH}
        columns={BATCH_COLUMNS}
        rowKey={(row) => row.id}
        selectable
        value={selected}
        onValueChange={setSelected}
      />
      <ActionBar count={selected.length} onClear={() => setSelected([])}>
        <Button size="sm" variant="secondary">
          <Download size={14} aria-hidden="true" />
          Exportar XML
        </Button>
        <Button size="sm" variant="destructive">
          <Trash2 size={14} aria-hidden="true" />
          Cancelar notas
        </Button>
      </ActionBar>
    </div>
  );
}

const TAMBAU: PostalAddress = {
  street: "Avenida Epitacio Pessoa",
  district: "Tambau",
  city: "Joao Pessoa",
  state: "PB",
};

const NEVER = () => new Promise<PostalAddress | null>(() => {});

function typeInto(root: HTMLElement | null, text: string) {
  const input = root?.querySelector("input");
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, text);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function Typed({
  label,
  text,
  lookup,
}: {
  label: string;
  text: string;
  lookup: (postalCode: string) => Promise<PostalAddress | null>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState<PostalAddress | null>(null);

  useEffect(() => typeInto(box.current, text), [text]);

  return (
    <div ref={box}>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <PostalCodeField lookup={lookup} onAddress={setAddress} />
        {address && (
          <FieldDescription>
            {address.street}, {address.district}, {address.city} - {address.state}
          </FieldDescription>
        )}
      </Field>
    </div>
  );
}

function Currencies() {
  const [charge, setCharge] = useState<number | null>(248000);
  const [adjustment, setAdjustment] = useState<number | null>(-1590);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel>Valor da cobranca</FieldLabel>
        <CurrencyInput value={charge} onValueChange={setCharge} />
        <FieldDescription>{charge === null ? "Vazio" : `${charge} centavos`}</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Vazio</FieldLabel>
        <CurrencyInput />
      </Field>
      <Field>
        <FieldLabel>Ajuste com sinal</FieldLabel>
        <CurrencyInput value={adjustment} onValueChange={setAdjustment} allowNegative />
      </Field>
      <Field invalid>
        <FieldLabel>Acima do limite</FieldLabel>
        <CurrencyInput defaultValue={750000} max={500000} />
        <FieldDescription>Ate R$ 5.000,00 por transferencia.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Pequeno</FieldLabel>
        <CurrencyInput size="sm" defaultValue={1990} />
      </Field>
      <Field disabled>
        <FieldLabel>Desabilitado</FieldLabel>
        <CurrencyInput defaultValue={48000} disabled />
      </Field>
    </div>
  );
}

function PostalCodes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Typed label="Buscando" text="58038000" lookup={NEVER} />
      <Typed label="Achou" text="58038000" lookup={async () => TAMBAU} />
      <Typed label="Nao achou" text="99999999" lookup={async () => null} />
      <Typed
        label="Falha de rede"
        text="01310100"
        lookup={async () => {
          throw new Error("offline");
        }}
      />
    </div>
  );
}

function Consent({ customize }: { customize?: boolean }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customize) return;
    const toggle = [...(box.current?.querySelectorAll("button") ?? [])].find(
      (button) => button.getAttribute("aria-expanded") === "false",
    );
    toggle?.click();
  }, [customize]);

  return (
    <div
      ref={box}
      className="relative h-[44rem] overflow-hidden rounded-lg border border-dashed border-border sm:h-[34rem]"
    >
      <CookieConsent
        open
        policyHref="#privacidade"
        onDecision={() => {}}
        className="absolute"
        classNames={{ panel: "max-h-[calc(44rem-2rem)] sm:max-h-[calc(34rem-2rem)]" }}
      />
    </div>
  );
}

function Consents() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Consent />
      <Consent customize />
    </div>
  );
}

function Banners() {
  return (
    <div className="flex flex-col gap-3">
      <Banner
        tone="info"
        title="Manutencao programada"
        description="A emissao de notas fica fora do ar domingo, 28/09, das 2h as 4h."
        onDismiss={() => {}}
      />
      <Banner
        tone="success"
        description="Sua conta foi verificada. A emissao em producao esta liberada."
      />
      <Banner
        tone="warning"
        title="Voce esta no modo de teste"
        description="As notas emitidas aqui nao tem validade fiscal."
        actions={
          <Button size="sm" variant="secondary">
            Ir para producao
          </Button>
        }
      />
      <Banner
        tone="danger"
        title="Fatura em atraso"
        description="A fatura de agosto venceu ha 5 dias. A emissao sera suspensa em 10/10."
        actions={
          <>
            <Button size="sm" variant="secondary">
              Ver fatura
            </Button>
            <Button size="sm" variant="secondary">
              Pagar com Pix
            </Button>
          </>
        }
        onDismiss={() => {}}
      />
    </div>
  );
}

const PLANS = [
  { name: "Basico", price: "R$ 49", notes: "30 notas por mes" },
  { name: "Profissional", price: "R$ 99", notes: "150 notas por mes" },
  { name: "Empresa", price: "R$ 199", notes: "600 notas por mes" },
  { name: "Contador", price: "R$ 349", notes: "Ate 20 empresas" },
  { name: "Franquia", price: "Sob consulta", notes: "Unidades ilimitadas" },
];

function PlanCard({ plan }: { plan: (typeof PLANS)[number] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{plan.notes}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-display text-2xl text-fg">{plan.price}</p>
      </CardContent>
    </Card>
  );
}

function Carousels() {
  return (
    <div className="flex flex-col gap-8">
      <Carousel label="Planos" slidesPerView={{ base: 1, sm: 2, lg: 3 }} indicators>
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </Carousel>

      <Carousel
        label="Planos em largura fixa"
        slidesPerView="auto"
        gap="sm"
        classNames={{ slide: "w-56" }}
      >
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </Carousel>

      <Carousel label="Novidades" autoplay={600000} indicators defaultIndex={1}>
        {PLANS.slice(0, 3).map((plan) => (
          <Card key={plan.name}>
            <CardContent>
              <p className="text-sm text-fg">
                O plano {plan.name} agora inclui o relatorio de impostos retidos.
              </p>
            </CardContent>
          </Card>
        ))}
      </Carousel>
    </div>
  );
}

const QR_LINK = "https://nfse.rivocode.com.br/consulta/35240612345678000199550010000048131234567890";
function Shells() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-[30rem] overflow-hidden rounded-lg border border-border">
        <AppShell
          contained
          container="md"
          header={
            <>
              <SearchInput placeholder="Buscar notas" className="max-w-xs" />
              <Button size="sm" className="ml-auto">
                Nova nota
              </Button>
            </>
          }
          sidebar={
            <>
              <SidebarHeader>
                <SidebarBrand mark={<Waves size={18} className="text-accent-text" />}>
                  RivoCode
                </SidebarBrand>
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup label="Operacao">
                  <SidebarMenu>
                    <SidebarMenuItem href="#" icon={<Home size={16} />}>
                      Painel
                    </SidebarMenuItem>
                    <SidebarMenuItem
                      href="#"
                      icon={<FileText size={16} />}
                      active
                      badge={<Badge size="sm">4</Badge>}
                    >
                      Notas fiscais
                    </SidebarMenuItem>
                    <SidebarMenuItem href="#" icon={<Users size={16} />}>
                      Clientes
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroup>
              </SidebarContent>
              <SidebarFooter>
                <SidebarMenu>
                  <SidebarMenuItem href="#" icon={<Settings size={16} />}>
                    Preferências
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
            </>
          }
          aside={
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-fg">Resumo do mes</p>
              <p className="text-fg-muted">42 notas emitidas, 3 canceladas.</p>
            </div>
          }
          footer="RivoCode - Emissao de notas fiscais"
        >
          <Heading level={2}>Notas fiscais</Heading>
          <Text tone="muted" className="mt-2 mb-4">
            As notas emitidas neste mes, da mais nova para a mais antiga.
          </Text>
          <Invoices
            invoices={[
              { id: "1", cliente: "Padaria Aurora", value: "R$ 1.280,00", status: "Paga" },
              { id: "2", cliente: "Mercado Tambau", value: "R$ 860,00", status: "Aberta" },
            ]}
          />
        </AppShell>
      </div>
    </div>
  );
}

const BASE_TIME = new Date("2026-09-24T12:00:00-03:00");

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Nota 1042 autorizada",
    description: "A prefeitura aceitou a nota da Padaria Aurora.",
    time: new Date(BASE_TIME.getTime() - 5 * 60_000),
    read: false,
    tone: "success",
    icon: <FileText />,
  },
  {
    id: "2",
    title: "Certificado digital vence em 5 dias",
    description: "Renove antes de 29/09 para nao parar a emissao.",
    time: new Date(BASE_TIME.getTime() - 3 * 3_600_000),
    read: false,
    tone: "warning",
  },
  {
    id: "3",
    title: "Ana Beatriz entrou na equipe",
    time: new Date(BASE_TIME.getTime() - 2 * 86_400_000),
    read: true,
    icon: <Users />,
  },
];

function Notifications({ openPanel }: { openPanel: boolean }) {
  const [items, setItems] = useState(NOTIFICATIONS);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPanel) return;
    const timer = setTimeout(() => bar.current?.querySelector("button")?.click(), 90);
    return () => clearTimeout(timer);
  }, [openPanel]);

  return (
    <div className={openPanel ? "flex min-h-[32rem] items-start gap-6" : "flex items-start gap-6"}>
      <div
        ref={bar}
        className="flex w-full max-w-md items-center justify-between rounded-lg border border-border px-4 py-2"
      >
        <span className="font-display text-base text-fg">RivoCode</span>
        <NotificationCenter
          items={items}
          now={BASE_TIME}
          onMarkRead={(id) =>
            setItems((current) =>
              current.map((item) => (item.id === id ? { ...item, read: true } : item)),
            )
          }
          onMarkAllRead={() =>
            setItems((current) => current.map((item) => ({ ...item, read: true })))
          }
          onItemClick={() => {}}
          hasMore
          onLoadMore={() => {}}
        />
      </div>
      <NotificationCenter items={[]} labels={{ trigger: "Notificacoes (vazio)" }} />
      <NotificationCenter items={[]} isLoading labels={{ trigger: "Notificacoes (carregando)" }} />
    </div>
  );
}

function Ratings() {
  const [value, setValue] = useState(3);
  const [half, setHalf] = useState(3.5);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex flex-col gap-3">
        <Rating value={value} onValueChange={setValue} clearable size="lg" />
        <Rating allowHalf value={half} onValueChange={setHalf} aria-label="Nota do produto" />
        <Rating size="sm" defaultValue={2} />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Rating readOnly value={4.3} size="sm" />
          <span className="text-sm text-fg">4,3</span>
          <span className="text-sm text-fg-muted">(128 avaliacoes)</span>
        </div>
        <Rating icon={<Heart />} max={3} defaultValue={2} labels={{ group: "Gostou?" }} />
        <Rating disabled defaultValue={2} />
        <Card className="max-w-xs">
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-fg">Sobre superficie</p>
            <Rating defaultValue={4} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QrCodes() {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col items-center gap-2">
        <Card className="p-4">
          <QRCode value={QR_LINK} label="QR Code para consultar a nota 4813" />
        </Card>
        <p className="text-xs text-fg-subtle">dentro do cartao, nivel M</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <QRCode value={QR_LINK} label="QR Code para consultar a nota 4813" level="Q" />
        <p className="text-xs text-fg-subtle">solto na pagina, nivel Q</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <QRCode
          value={QR_LINK}
          label="QR Code para consultar a nota 4813"
          size={200}
          logo={<span className="font-display text-sm font-semibold">R</span>}
        />
        <p className="text-xs text-fg-subtle">logo, nivel H</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <QRCode value="" label="QR Code ainda sem conteudo" size={120} />
        <p className="text-xs text-fg-subtle">sem valor</p>
      </div>
    </div>
  );
}

const PIX_CHARGE = buildPixPayload({
  key: "+5583988112233",
  name: "Clínica São Lucas",
  city: "João Pessoa",
  amount: 1284.5,
  txid: "NF4813",
  description: "Nota 4813",
});

function PixCodes() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      <PixCode payload={PIX_CHARGE} />
      <PixCode payload="" loading amount={1284.5} />
      <PixCode payload={PIX_CHARGE} expired onRenew={() => {}} />
      <PixCode payload={`${PIX_CHARGE.slice(0, -4)}0000`} />
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
        <Block title="PixCode">
          <PixCodes />
        </Block>

        <Block title="QRCode">
          <QrCodes />
        </Block>

        <Block title="AppShell">
          <Shells />
        </Block>

        <Block title="NotificationCenter">
          <Notifications openPanel={!openPicker && !isMobile} />
        </Block>

        <Block title="Rating">
          <Ratings />
        </Block>

        <Block title="Carousel">
          <Carousels />
        </Block>

        <Block title="ImageViewer">
          <ImageViewer images={PHOTOS} className="max-w-xl" />
        </Block>

        <Block title="ActionBar">
          <Batch />
        </Block>

        <Block title="PostalCodeField">
          <PostalCodes />
        </Block>

        <Block title="CurrencyInput">
          <Currencies />
        </Block>

        <Block title="CookieConsent">
          <Consents />
        </Block>

        <Block title="Banner">
          <Banners />
        </Block>

        <Block title="IconButton">
          <IconButtons />
        </Block>

        <Block title="Heading">
          <Headings />
        </Block>

        <Block title="Text">
          <Texts />
        </Block>

        <Block title="Link">
          <Links />
        </Block>

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
