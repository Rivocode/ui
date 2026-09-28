import { describe, expect, mock, test } from "bun:test";
import { createElement, useState, type ReactElement } from "react";
import type { View as NativeView } from "react-native";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import {
  ActionBar,
  Banner,
  Button,
  Calendar,
  Carousel,
  Checkbox,
  ColorPicker,
  CurrencyInput,
  Editable,
  FilterBar,
  FilterChip,
  Highlight,
  ImageViewer,
  Indicator,
  InputGroup,
  Menu,
  Meter,
  NotificationCenter,
  PageHeader,
  PasswordInput,
  PostalCodeField,
  Progress,
  QueryBoundary,
  Rating,
  ScrollArea,
  Slider,
  Spoiler,
  Switch,
  TagsInput,
  Text,
  TimePicker,
  Tour,
  Tracker,
  TransferList,
  buildPixPayload,
} from "../src";
import { act, byLabel, byType, render } from "./helpers";

mock.module("react-native-svg", () => {
  const host = (name: string) => (props: Record<string, unknown>) => createElement(name, props);

  return {
    default: host("Svg"),
    Svg: host("Svg"),
    Circle: host("Circle"),
    Line: host("Line"),
    Path: host("Path"),
    Rect: host("Rect"),
    G: host("G"),
    Text: host("SvgText"),
  };
});

const { ChartFunnel, ChartGauge, ChartHeatmap, ChartTreemap, PixCode, QRCode, SignaturePad } =
  await import("../src/chart");
const { Conversation, Message, PromptInput, ToolCall } = await import("../src/ai");

type Is = string | ((node: ReactTestInstance) => boolean);

type Case = {
  name: string;
  mount: (classNames: Record<string, string>) => ReactTestRenderer | Promise<ReactTestRenderer>;
  parts: Record<string, Is>;
  count?: Record<string, number>;
};

const tokenOf = (part: string) => `rc-parte-${part}`;

const tokens = (node: ReactTestInstance, prop = "className") =>
  String(node.props[prop] ?? "").split(" ");

const carrying = (screen: ReactTestRenderer, token: string) =>
  screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      (tokens(node).includes(token) || tokens(node, "contentContainerClassName").includes(token)),
  );

const says = (text: string) => (node: ReactTestInstance) =>
  node.findAll((child) => child.props?.children === text).length > 0;

const labelled = (label: string | RegExp) => (node: ReactTestInstance) =>
  typeof label === "string"
    ? node.props.accessibilityLabel === label
    : label.test(String(node.props.accessibilityLabel ?? ""));

const both =
  (...checks: Is[]) =>
  (node: ReactTestInstance) =>
    checks.every((check) =>
      typeof check === "string" ? tokens(node).includes(check) : check(node),
    );

const ofType = (type: string) => (node: ReactTestInstance) => node.type === type;

const mentions = (pattern: RegExp) => (node: ReactTestInstance) =>
  node.findAll(ofType("Text")).some((text) => pattern.test(String(text.props.children)));

const noop = () => {};

const holds = (check: (node: ReactTestInstance) => boolean) => (node: ReactTestInstance) =>
  node.findAll(check).length > 0;

function pressing(screen: ReactTestRenderer, label: string, handler = "onPress") {
  act(() => byLabel(screen, label)[0]!.props[handler]());
  return screen;
}

const TODAY = new Date();
const TODAY_LABEL = [
  String(TODAY.getDate()).padStart(2, "0"),
  String(TODAY.getMonth() + 1).padStart(2, "0"),
  TODAY.getFullYear(),
].join("/");

const FILTERS = [
  { id: "cliente", label: "Cliente", value: "Acme" },
  { id: "status", label: "Status", value: "Pago" },
];

function measured(box: { x: number; y: number; width: number; height: number }) {
  return {
    current: {
      measureInWindow: (done: (...values: number[]) => void) =>
        done(box.x, box.y, box.width, box.height),
    } as unknown as NativeView,
  };
}

function TypedPostalCode(props: {
  lookup: () => Promise<null>;
  classNames: Record<string, string>;
}) {
  const [value, setValue] = useState("");
  return <PostalCodeField {...props} value={value} onValueChange={setValue} />;
}

async function typePostalCode(
  lookup: () => Promise<null>,
  classNames: Record<string, string>,
): Promise<ReactTestRenderer> {
  const screen = render(<TypedPostalCode lookup={lookup} classNames={classNames} />);
  const input = byType(screen, "TextInput")[0]!;
  await act(async () => input.props.onChangeText("58038000"));
  return screen;
}

function withLayout(screen: ReactTestRenderer, height: number): ReactTestRenderer {
  const inner = byType(screen, "View").find((node) => typeof node.props.onLayout === "function");
  act(() => inner!.props.onLayout({ nativeEvent: { layout: { height, width: 320, x: 0, y: 0 } } }));
  return screen;
}

const PAYLOAD = buildPixPayload({
  key: "+5583988112233",
  name: "Clínica São Lucas",
  city: "João Pessoa",
  amount: 1284.5,
  txid: "NF4813",
});

const PHOTOS = [
  { src: "https://exemplo.com/a.jpg", alt: "Fachada da loja", caption: "A fachada" },
  { src: "https://exemplo.com/b.jpg", alt: "Balcão" },
];

const NOTICE = {
  id: "1",
  title: "Nota 4813 autorizada",
  time: new Date("2026-09-01T10:00:00Z"),
  read: false,
};

const CASES: Case[] = [
  {
    name: "Highlight",
    mount: (classNames) =>
      render(
        <Highlight query="pix" classNames={classNames}>
          Pague por Pix
        </Highlight>,
      ),
    parts: { mark: "bg-warning" },
  },
  {
    name: "Indicator",
    mount: (classNames) =>
      render(
        <Indicator count={3} label="3 notificações" classNames={classNames}>
          <Text>Sino</Text>
        </Indicator>,
      ),
    parts: { badge: "bg-danger" },
  },
  {
    name: "CurrencyInput",
    mount: (classNames) =>
      render(
        <CurrencyInput
          value={1250}
          onValueChange={noop}
          accessibilityLabel="Valor"
          classNames={classNames}
        />,
      ),
    parts: { input: both(ofType("TextInput"), "pl-11"), prefix: says("R$") },
  },
  {
    name: "PostalCodeField buscando",
    mount: (classNames) => typePostalCode(() => new Promise<null>(noop), classNames),
    parts: {
      input: both(ofType("TextInput"), "pr-11"),
      suffix: (node) => byType({ root: node } as ReactTestRenderer, "ActivityIndicator").length > 0,
    },
  },
  {
    name: "PostalCodeField com falha",
    mount: (classNames) => typePostalCode(() => Promise.reject(new Error("rede")), classNames),
    parts: {
      message: both(ofType("Text"), "text-xs"),
      retry: both((node) => node.props.accessibilityRole === "button", says("Tentar de novo")),
    },
  },
  {
    name: "ActionBar",
    mount: (classNames) =>
      render(
        <ActionBar count={2} onClear={noop} classNames={classNames}>
          <Button size="sm">Excluir</Button>
        </ActionBar>,
      ),
    parts: {
      bar: "bg-surface-raised",
      count: both(ofType("Text"), says("2 selecionados")),
      clear: both("ml-auto", says("Limpar seleção")),
    },
  },
  {
    name: "Banner",
    mount: (classNames) =>
      render(
        <Banner
          title="Certificado vencendo"
          description="Renove até sexta."
          icon={<Text>!</Text>}
          actions={<Button size="sm">Renovar</Button>}
          onDismiss={noop}
          classNames={classNames}
        />,
      ),
    parts: {
      icon: says("!"),
      content: "flex-1",
      title: says("Certificado vencendo"),
      description: says("Renove até sexta."),
      actions: says("Renovar"),
      dismiss: labelled("Fechar aviso"),
    },
  },
  {
    name: "Spoiler",
    mount: (classNames) =>
      withLayout(
        render(
          <Spoiler maxHeight={120} classNames={classNames}>
            <Text>Texto longo</Text>
          </Spoiler>,
        ),
        400,
      ),
    parts: {
      content: (node) => [node.props.style].flat().some((style) => style?.maxHeight === 120),
      trigger: both((node) => node.props.accessibilityRole === "button", says("Ler mais")),
    },
  },
  {
    name: "TransferList",
    mount: (classNames) =>
      render(
        <TransferList
          items={[
            { value: "a", label: "Alfa" },
            { value: "b", label: "Beta" },
          ]}
          value={["a", "b"]}
          onValueChange={noop}
          classNames={classNames}
        />,
      ),
    parts: {
      panel: "bg-surface",
      header: both("justify-between", mentions(/Disponíveis|Escolhidos/)),
      search: (node) => byType({ root: node } as ReactTestRenderer, "TextInput").length === 1,
      list: ofType("ScrollView"),
      option: both("min-h-11", mentions(/Alfa|Beta/)),
      actions: "border-t",
      empty: says("Nenhum item"),
    },
  },
  {
    name: "Tour",
    mount: (classNames) =>
      render(
        <Tour
          steps={[
            {
              target: measured({ x: 20, y: 100, width: 120, height: 44 }),
              title: "Crie um cliente",
              description: "Comece pelo cadastro.",
            },
            { target: measured({ x: 20, y: 200, width: 120, height: 44 }), title: "Ache" },
          ]}
          open
          onOpenChange={noop}
          step={0}
          onStepChange={noop}
          classNames={classNames}
        />,
      ),
    parts: {
      mask: "bg-overlay",
      counter: says("Passo 1 de 2"),
      title: says("Crie um cliente"),
      description: says("Comece pelo cadastro."),
      footer: says("Pular tour"),
    },
  },
  {
    name: "Carousel",
    mount: (classNames) =>
      render(
        <Carousel
          label="Planos"
          items={["Básico", "Pro", "Empresa"]}
          renderItem={(item) => <Text>{item}</Text>}
          index={0}
          onIndexChange={noop}
          indicators
          classNames={classNames}
        />,
      ),
    parts: {
      viewport: (node) => typeof node.props.onLayout === "function",
      slide: (node) => "marginRight" in (node.props.style ?? {}),
      footer: both("justify-center", (node) => node.findAll(labelled("Slide anterior")).length > 0),
      previous: labelled("Slide anterior"),
      next: labelled("Próximo slide"),
      indicators: "flex-wrap",
      indicator: labelled(/^Ir para o slide/),
    },
  },
  {
    name: "ImageViewer",
    mount: (classNames) =>
      render(
        <ImageViewer images={PHOTOS} index={0} onIndexChange={noop} classNames={classNames} />,
      ),
    parts: {
      thumbnails: (node) =>
        node.findAll((child) => child.props?.accessibilityRole === "imagebutton").length >= 2,
      thumbnail: (node) => node.props.accessibilityRole === "imagebutton",
      viewer: (node) => node.props.accessibilityViewIsModal === true,
      toolbar: both("pb-3", (node) => node.findAll(labelled("Fechar")).length > 0),
      counter: says("1 de 2"),
      stage: (node) => typeof node.props.onLayout === "function",
      image: both(ofType("Image"), (node) => node.props.accessibilityLabel !== undefined),
      caption: says("A fachada"),
    },
  },
  {
    name: "NotificationCenter com itens",
    mount: (classNames) =>
      render(
        <NotificationCenter
          items={[NOTICE]}
          open
          onOpenChange={noop}
          icon={() => null}
          onMarkRead={noop}
          onMarkAllRead={noop}
          now={new Date("2026-09-01T11:00:00Z")}
          classNames={classNames}
        />,
      ),
    parts: {
      trigger: labelled(/notifica/i),
      panel: "shrink",
      header: "justify-between",
      filters: (node) => node.findAll((child) => child.props?.children === "Todas").length > 0,
      list: ofType("FlatList"),
      item: says("Nota 4813 autorizada"),
    },
  },
  {
    name: "NotificationCenter vazio",
    mount: (classNames) =>
      render(
        <NotificationCenter
          items={[]}
          open
          onOpenChange={noop}
          icon={() => null}
          classNames={classNames}
        />,
      ),
    parts: { empty: "items-center" },
  },
  {
    name: "Rating",
    mount: (classNames) =>
      render(<Rating value={3} onValueChange={noop} classNames={classNames} />),
    parts: {
      item: (node) => node.props.testID === "rating-star",
      empty: both(ofType("Text"), "text-border-strong"),
      filled: both(ofType("Text"), "text-warning"),
    },
  },
  {
    name: "QRCode",
    mount: (classNames) =>
      render(
        <QRCode
          value="https://rivocode.com.br"
          label="Site"
          logo={<Text>R</Text>}
          classNames={classNames}
        />,
      ),
    parts: { logo: says("R") },
  },
  {
    name: "PixCode",
    mount: (classNames) => render(<PixCode payload={PAYLOAD} classNames={classNames} />),
    parts: {
      code: (node) => node.props.accessibilityRole === "image",
      amount: both(ofType("Text"), "text-2xl"),
      receiver: both(ofType("Text"), "text-fg-muted"),
      payload: says(PAYLOAD),
    },
  },
  {
    name: "SignaturePad",
    mount: (classNames) =>
      render(
        <SignaturePad
          value={null}
          onValueChange={noop}
          defaultMode="type"
          classNames={classNames}
        />,
      ),
    parts: {
      pad: (node) => node.props.accessibilityRole === "image",
      placeholder: ofType("Text"),
      actions: "justify-between",
      input: ofType("TextInput"),
    },
  },
  {
    name: "PromptInput",
    mount: (classNames) =>
      render(
        <PromptInput
          value="Oi"
          onValueChange={noop}
          onSubmit={noop}
          showCount
          attachments={<Text>nota.pdf</Text>}
          classNames={classNames}
        />,
      ),
    parts: {
      attachments: says("nota.pdf"),
      textarea: ofType("TextInput"),
      footer: (node) => node.findAll(labelled("Enviar mensagem")).length > 0,
      count: says("2"),
      submit: labelled("Enviar mensagem"),
    },
  },
  {
    name: "PromptInput respondendo",
    mount: (classNames) =>
      render(
        <PromptInput
          value=""
          onValueChange={noop}
          onSubmit={noop}
          streaming
          classNames={classNames}
        />,
      ),
    parts: { submit: labelled("Parar resposta") },
  },
  {
    name: "Message",
    mount: (classNames) =>
      render(
        <Message
          role="user"
          avatar={<Text>EB</Text>}
          error="Falhou"
          onCopy={noop}
          classNames={classNames}
        >
          Emita a nota
        </Message>,
      ),
    parts: {
      avatar: says("EB"),
      bubble: "bg-accent-subtle",
      content: both(ofType("Text"), says("Emita a nota")),
      error: says("Falhou"),
      actions: says("Copiar"),
    },
  },
  {
    name: "Message chegando",
    mount: (classNames) =>
      render(
        <Message role="assistant" streaming classNames={classNames}>
          Um momento
        </Message>,
      ),
    parts: { indicator: "py-1.5" },
  },
  {
    name: "Conversation",
    mount: (classNames) => {
      const screen = render(
        <Conversation
          items={["Oi", "Tudo bem?"]}
          renderItem={(item) => <Text>{item}</Text>}
          keyExtractor={(item) => item}
          classNames={classNames}
        />,
      );
      const list = byType(screen, "FlatList")[0]!;
      act(() => list.props.onScroll({ nativeEvent: { contentOffset: { y: 400 } } }));
      return screen;
    },
    parts: {
      viewport: both(ofType("FlatList"), (node) => tokens(node).includes(tokenOf("viewport"))),
      content: both(ofType("FlatList"), (node) =>
        tokens(node, "contentContainerClassName").includes(tokenOf("content")),
      ),
      scrollButton: says("Ir para o fim"),
    },
  },
  {
    name: "Conversation vazia",
    mount: (classNames) =>
      render(
        <Conversation
          items={[]}
          renderItem={() => null}
          keyExtractor={String}
          empty={{ title: "Pergunte", description: "Sobre suas notas.", suggestions: ["Emitir"] }}
          onSuggestion={noop}
          classNames={classNames}
        />,
      ),
    parts: { empty: says("Pergunte"), suggestions: says("Emitir") },
  },
  {
    name: "ToolCall",
    mount: (classNames) =>
      render(
        <ToolCall
          name="buscar_notas"
          status="approval"
          input={{ mes: 9 }}
          error="Sem permissão"
          onApprove={noop}
          onReject={noop}
          classNames={classNames}
        />,
      ),
    parts: {
      trigger: both((node) => node.props.accessibilityRole === "button", "min-h-12"),
      name: says("buscar_notas"),
      status: "gap-1.5",
      panel: "border-t",
      error: says("Sem permissão"),
      actions: says("Aprovar"),
    },
  },
  {
    name: "Checkbox",
    mount: (classNames) =>
      render(
        <Checkbox checked onCheckedChange={noop} classNames={classNames}>
          ISS retido
        </Checkbox>,
      ),
    parts: {
      box: "size-5",
      indicator: "-rotate-45",
      label: both(ofType("Text"), says("ISS retido")),
    },
  },
  {
    name: "Checkbox indeterminado",
    mount: (classNames) =>
      render(
        <Checkbox
          label="Todas"
          checked={false}
          indeterminate
          onCheckedChange={noop}
          classNames={classNames}
        />,
      ),
    parts: { indicator: "h-0.5" },
  },
  {
    name: "Switch",
    mount: (classNames) =>
      render(
        <Switch checked onCheckedChange={noop} classNames={classNames}>
          Avisar por e-mail
        </Switch>,
      ),
    parts: { label: both(ofType("Text"), says("Avisar por e-mail")) },
  },
  {
    name: "Meter",
    mount: (classNames) =>
      render(<Meter value={8} max={15} label="Disco" showValue classNames={classNames} />),
    parts: {
      label: both(ofType("Text"), says("Disco")),
      value: both(ofType("Text"), "text-xs"),
      track: "bg-skeleton",
      indicator: "bg-accent-text",
    },
  },
  {
    name: "Progress",
    mount: (classNames) =>
      render(<Progress value={40} label="Envio" showValue classNames={classNames} />),
    parts: {
      label: both(ofType("Text"), says("Envio")),
      value: both(ofType("Text"), "text-xs"),
      track: "bg-skeleton",
      indicator: "bg-accent-text",
    },
  },
  {
    name: "Progress sem showValue",
    mount: (classNames) => render(<Progress value={40} label="Envio" classNames={classNames} />),
    parts: {
      track: (node) => node.props.accessibilityRole === "progressbar",
      indicator: "bg-accent-text",
    },
  },
  {
    name: "Slider",
    mount: (classNames) =>
      render(
        <Slider value={30} onValueChange={noop} label="Volume" showValue classNames={classNames} />,
      ),
    parts: {
      control: (node) => node.props.accessibilityRole === "adjustable",
      track: "bg-skeleton",
      indicator: "bg-accent-text",
      thumb: "size-5",
      label: both(ofType("Text"), says("Volume")),
      value: both(ofType("Text"), "text-xs"),
    },
  },
  {
    name: "PageHeader",
    mount: (classNames) =>
      render(
        <PageHeader
          title="Notas fiscais"
          description="Emitidas neste mês."
          actions={<Button size="sm">Emitir</Button>}
          classNames={classNames}
        />,
      ),
    parts: {
      row: "justify-between",
      heading: "min-w-0",
      title: says("Notas fiscais"),
      description: says("Emitidas neste mês."),
      actions: holds(says("Emitir")),
    },
  },
  {
    name: "InputGroup",
    mount: (classNames) =>
      render(
        <InputGroup
          value="4813"
          onValueChange={noop}
          prefix="R$"
          suffix="kg"
          actions={[{ label: "Copiar", onPress: noop, children: "C" }]}
          classNames={classNames}
        />,
      ),
    parts: {
      input: ofType("TextInput"),
      prefix: both("border-r", says("R$")),
      suffix: both("border-l", says("kg")),
      action: labelled("Copiar"),
    },
  },
  {
    name: "Menu",
    mount: (classNames) =>
      render(
        <Menu
          open
          onOpenChange={noop}
          title="Nota 4813"
          actions={[
            { label: "Baixar o PDF", onSelect: noop },
            { label: "Cancelar a nota", onSelect: noop, tone: "danger" },
          ]}
          classNames={classNames}
        >
          <Text>Nota 4813</Text>
        </Menu>,
      ),
    parts: {
      trigger: (node) => typeof node.props.onLongPress === "function",
      content: both("gap-1", says("Baixar o PDF"), says("Cancelar a nota")),
      item: (node) =>
        node.props.accessibilityRole === "button" && mentions(/Baixar|Cancelar/)(node),
    },
    count: { trigger: 1, content: 1, item: 2 },
  },
  {
    name: "ScrollArea",
    mount: (classNames) =>
      render(
        <ScrollArea footer={<Button>Emitir nota</Button>} classNames={classNames}>
          <Text>Descrição</Text>
        </ScrollArea>,
      ),
    parts: { footer: both("border-t", says("Emitir nota")) },
  },
  {
    name: "PasswordInput",
    mount: (classNames) =>
      render(<PasswordInput value="segredo" onValueChange={noop} classNames={classNames} />),
    parts: {
      wrapper: "overflow-hidden",
      input: ofType("TextInput"),
      action: labelled("Mostrar senha"),
    },
  },
  {
    name: "Editable lendo",
    mount: (classNames) =>
      render(<Editable value="Acme" onValueChange={noop} label="Cliente" classNames={classNames} />),
    parts: { preview: labelled("Cliente: Acme") },
  },
  {
    name: "Editable editando",
    mount: (classNames) =>
      pressing(
        render(
          <Editable value="Acme" onValueChange={noop} label="Cliente" classNames={classNames} />,
        ),
        "Cliente: Acme",
        "onLongPress",
      ),
    parts: { input: both(ofType("TextInput"), labelled("Cliente")) },
  },
  {
    name: "ColorPicker",
    mount: (classNames) =>
      render(
        <ColorPicker
          value="#0f8a5f"
          onValueChange={noop}
          label="Cor da marca"
          swatches={["#0f8a5f", "#d4f34a"]}
          classNames={classNames}
        />,
      ),
    parts: {
      label: says("Cor da marca"),
      swatches: (node) => node.props.accessibilityRole === "radiogroup",
      swatch: (node) => node.props.accessibilityRole === "radio",
      field: holds(ofType("TextInput")),
      preview: "size-12",
      input: ofType("TextInput"),
    },
  },
  {
    name: "FilterChip",
    mount: (classNames) =>
      render(<FilterChip label="Cliente" value="Acme" onRemove={noop} classNames={classNames} />),
    parts: {
      label: says("Cliente"),
      value: says("Acme"),
      remove: labelled("Remover filtro Cliente: Acme"),
    },
  },
  {
    name: "FilterBar com filtros",
    mount: (classNames) =>
      render(<FilterBar filters={FILTERS} onFiltersChange={noop} classNames={classNames} />),
    parts: {
      list: (node) => node.props.horizontal === true,
      item: holds(mentions(/Acme|Pago/)),
      chip: both("h-11", holds(mentions(/Acme|Pago/))),
      clear: holds(says("Limpar 2 filtros")),
    },
  },
  {
    name: "FilterBar vazia",
    mount: (classNames) =>
      render(<FilterBar filters={[]} onFiltersChange={noop} classNames={classNames} />),
    parts: { empty: says("Nenhum filtro aplicado") },
  },
  {
    name: "TagsInput",
    mount: (classNames) =>
      render(<TagsInput value={["fiscal"]} onValueChange={noop} classNames={classNames} />),
    parts: {
      field: "flex-wrap",
      tag: holds(says("fiscal")),
      remove: labelled("Remover fiscal"),
      input: ofType("TextInput"),
    },
  },
  {
    name: "TimePicker aberto",
    mount: (classNames) =>
      pressing(
        render(
          <TimePicker
            value="09:30"
            onValueChange={noop}
            label="Horário da coleta"
            classNames={classNames}
          />,
        ),
        "Horário da coleta",
      ),
    parts: {
      trigger: labelled("Horário da coleta"),
      panel: holds(says("Hora")),
      column: labelled(/^(Hora|Minuto)$/),
      option: labelled(/^(Hora|Minuto) \d\d$/),
    },
    count: { column: 2, option: 28 },
  },
  {
    name: "Tracker",
    mount: (classNames) =>
      render(
        <Tracker
          label="Emissões"
          data={[
            { tone: "success", label: "Segunda: ok" },
            { tone: "danger", label: "Terça: falhou" },
          ]}
          classNames={classNames}
        />,
      ),
    parts: {
      track: (node) => node.props.accessibilityRole === "adjustable",
      cell: "h-7",
    },
  },
  {
    name: "QueryBoundary carregando",
    mount: (classNames) =>
      render(
        <QueryBoundary data={undefined} classNames={classNames}>
          <Text>Lista</Text>
        </QueryBoundary>,
      ),
    parts: { loading: (node) => node.props.accessibilityState?.busy === true },
  },
  {
    name: "QueryBoundary com erro",
    mount: (classNames) =>
      render(
        <QueryBoundary data={undefined} isError onRetry={noop} classNames={classNames}>
          <Text>Lista</Text>
        </QueryBoundary>,
      ),
    parts: { error: both("items-start", holds(says("Tentar de novo"))) },
  },
  {
    name: "QueryBoundary vazio",
    mount: (classNames) =>
      render(
        <QueryBoundary
          data={[]}
          empty={{ title: "Nenhuma nota", description: "Emita a primeira." }}
          classNames={classNames}
        >
          <Text>Lista</Text>
        </QueryBoundary>,
      ),
    parts: { empty: holds(says("Nenhuma nota")) },
  },
  {
    name: "Calendar",
    mount: (classNames) =>
      render(
        <Calendar
          value="2026-09-10"
          onValueChange={noop}
          min="2026-09-05"
          classNames={classNames}
        />,
      ),
    parts: {
      root: "gap-3",
      nav: holds(labelled("Mês anterior")),
      button_previous: labelled("Mês anterior"),
      button_next: labelled("Mês seguinte"),
      caption_label: mentions(/Setembro/),
      weekdays: holds(says("D")),
      weekday: both(ofType("Text"), "uppercase"),
      month_grid: "flex-wrap",
      day: "w-[14.28%]",
      day_button: both("size-10", labelled(/^\d\d\/09\/2026$/)),
      selected: holds(labelled("10/09/2026")),
      disabled: both(holds(labelled(/^0[1-4]\/09\/2026$/)), (node) => !node.findAll(labelled("10/09/2026")).length),
    },
  },
  {
    name: "Calendar hoje",
    mount: (classNames) =>
      render(<Calendar value={null} onValueChange={noop} classNames={classNames} />),
    parts: { today: holds(labelled(TODAY_LABEL)) },
  },
  {
    name: "ChartFunnel",
    mount: (classNames) =>
      render(
        <ChartFunnel
          data={[
            { etapa: "Visitas", total: 1000 },
            { etapa: "Cadastros", total: 400 },
          ]}
          valueKey="total"
          nameKey="etapa"
          classNames={classNames}
        />,
      ),
    parts: {
      stage: labelled(/^(Visitas|Cadastros):/),
      bar: "h-full",
      rate: holds(says("↓")),
    },
  },
  {
    name: "ChartGauge",
    mount: (classNames) =>
      render(<ChartGauge value={72} centerLabel="Atenção" classNames={classNames} />),
    parts: { value: says("72"), label: says("Atenção") },
  },
  {
    name: "ChartHeatmap",
    mount: (classNames) =>
      render(
        <ChartHeatmap
          data={[
            { dia: "Seg", hora: "9h", total: 3 },
            { dia: "Ter", hora: "9h", total: 5 },
          ]}
          rowKey="dia"
          columnKey="hora"
          valueKey="total"
          label="Emissões por hora"
          classNames={classNames}
        />,
      ),
    parts: {
      grid: (node) => node.props.accessibilityRole === "adjustable",
      cell: both("rounded-sm", "flex-1"),
      legend: "flex-wrap",
    },
  },
  {
    name: "ChartTreemap",
    mount: (classNames) => {
      const screen = render(
        <ChartTreemap
          data={[
            { area: "Vendas", total: 60 },
            { area: "Suporte", total: 40 },
          ]}
          valueKey="total"
          nameKey="area"
          classNames={classNames}
        />,
      );
      const box = byType(screen, "View").find((node) => typeof node.props.onLayout === "function");
      act(() =>
        box!.props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 256 } } }),
      );
      return screen;
    },
    parts: {
      cell: "p-2",
      label: holds(mentions(/Vendas|Suporte/)),
    },
  },
];

const PIECES = new Set(CASES.map((entry) => entry.name.split(" ")[0]));

describe("classNames no nativo", () => {
  test("a tabela cobre as quarenta pecas que ganharam classNames", () => {
    expect(PIECES.size).toBeGreaterThanOrEqual(40);
    expect(CASES.flatMap((entry) => Object.keys(entry.parts)).length).toBeGreaterThan(160);
  });

  test("parte so se veste por classNames, e nunca por uma prop <parte>ClassName", async () => {
    const read = async (path: string) =>
      (await Bun.file(new URL(path, import.meta.url)).json()) as Record<
        string,
        { props: { name: string }[] }
      >;
    const catalogs = {
      native: await read("../../apps/docs/src/native-props.json"),
      web: await read("../../apps/docs/src/component-props.json"),
    };

    const THIRD_PARTY = new Set([
      "web:Calendar.modifiersClassNames",
      "web:ChartTooltip.labelClassName",
      "web:ChartTooltip.wrapperClassName",
    ]);
    const OWN_NAME = new Set(["className", "classNames", "contentContainerClassName"]);

    const found: string[] = [];
    const excused = new Set<string>();
    let seen = 0;
    for (const [side, catalog] of Object.entries(catalogs)) {
      expect(Object.keys(catalog).length).toBeGreaterThan(80);
      for (const [piece, entry] of Object.entries(catalog)) {
        for (const prop of entry.props) {
          if (!/[cC]lassNames?$/.test(prop.name)) continue;
          seen += 1;
          const id = `${side}:${piece}.${prop.name}`;
          if (THIRD_PARTY.has(id)) excused.add(id);
          else if (!OWN_NAME.has(prop.name)) found.push(id);
        }
      }
    }

    expect(seen).toBeGreaterThan(150);
    expect([...excused].sort()).toEqual([...THIRD_PARTY].sort());
    expect(found).toEqual([]);
  });

  test("toda parte que o tipo publica tem caso aqui", async () => {
    const published = (await Bun.file(
      new URL("../../apps/docs/src/native-props.json", import.meta.url),
    ).json()) as Record<string, { props: { name: string; type: string }[] }>;

    const calendarSource = await Bun.file(new URL("../src/calendar.tsx", import.meta.url)).text();
    const union = /type CalendarPart =([^;]+);/.exec(calendarSource)?.[1] ?? "";
    const CALENDAR_PARTS = [...union.matchAll(/"(\w+)"/g)].map((match) => match[1]!);
    expect(CALENDAR_PARTS.length).toBeGreaterThan(10);

    const covered = new Map<string, Set<string>>();
    for (const entry of CASES) {
      const piece = entry.name.split(" ")[0]!;
      const seen = covered.get(piece) ?? new Set<string>();
      for (const part of Object.keys(entry.parts)) seen.add(part);
      covered.set(piece, seen);
    }

    const missing: string[] = [];
    let checked = 0;
    for (const [piece, entry] of Object.entries(published)) {
      if (piece === "SortableList") continue;
      const type = entry.props.find((prop) => prop.name === "classNames")?.type;
      if (!type) continue;
      const declared = [...type.matchAll(/"(\w+)"/g)].map((match) => match[1]!);
      const names = declared.length > 0 ? declared : piece === "Calendar" ? CALENDAR_PARTS : [];
      expect({ piece, readable: names.length > 0 }).toEqual({ piece, readable: true });
      checked += 1;
      for (const part of names) if (!covered.get(piece)?.has(part)) missing.push(`${piece}.${part}`);
    }

    expect(checked).toBeGreaterThanOrEqual(40);
    expect(missing).toEqual([]);
  });

  for (const entry of CASES) {
    test(`${entry.name}: cada parte veste o no dela, e so ele`, async () => {
      const classNames = Object.fromEntries(
        Object.keys(entry.parts).map((part) => [part, tokenOf(part)]),
      );
      const screen = await entry.mount(classNames);

      for (const [part, is] of Object.entries(entry.parts)) {
        const nodes = carrying(screen, tokenOf(part));
        const matches = typeof is === "string" ? both(is) : is;

        expect({ part, found: nodes.length > 0 }).toEqual({ part, found: true });
        for (const node of nodes) {
          expect({ part, right: matches(node) }).toEqual({ part, right: true });
        }
        const expected = entry.count?.[part];
        if (expected !== undefined) expect({ part, count: nodes.length }).toEqual({ part, count: expected });
      }
    });
  }
});
