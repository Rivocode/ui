import { describe, expect, mock, test } from "bun:test";
import { createElement, useState, type ReactElement } from "react";
import type { View as NativeView } from "react-native";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import {
  ActionBar,
  Banner,
  Button,
  Carousel,
  CurrencyInput,
  Highlight,
  ImageViewer,
  Indicator,
  NotificationCenter,
  PostalCodeField,
  Rating,
  Spoiler,
  Text,
  Tour,
  TransferList,
  buildPixPayload,
} from "../src";
import { act, byType, render } from "./helpers";

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

const { PixCode, QRCode, SignaturePad } = await import("../src/chart");
const { Conversation, Message, PromptInput, ToolCall } = await import("../src/ai");

type Is = string | ((node: ReactTestInstance) => boolean);

type Case = {
  name: string;
  mount: (classNames: Record<string, string>) => ReactTestRenderer | Promise<ReactTestRenderer>;
  parts: Record<string, Is>;
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
];

const PIECES = new Set(CASES.map((entry) => entry.name.split(" ")[0]));

describe("classNames no nativo", () => {
  test("a tabela cobre as vinte pecas que ganharam classNames", () => {
    expect(PIECES.size).toBeGreaterThanOrEqual(20);
    expect(CASES.flatMap((entry) => Object.keys(entry.parts)).length).toBeGreaterThan(80);
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
      }
    });
  }
});

const classOf = (screen: ReactTestRenderer, token: string) => {
  const [node] = carrying(screen, token);
  return node ? tokens(node) : [];
};

describe("as props de uma parte so, obsoletas", () => {
  const LEGACY: {
    name: string;
    mount: (legacy?: string, modern?: string) => ReactElement;
    base: string;
  }[] = [
    {
      name: "Highlight markClassName",
      mount: (legacy, modern) => (
        <Highlight
          query="pix"
          markClassName={legacy}
          classNames={modern ? { mark: modern } : undefined}
        >
          Pague por Pix
        </Highlight>
      ),
      base: "bg-warning",
    },
    {
      name: "Indicator badgeClassName",
      mount: (legacy, modern) => (
        <Indicator
          count={3}
          label="3 notificações"
          badgeClassName={legacy}
          classNames={modern ? { badge: modern } : undefined}
        >
          <Text>Sino</Text>
        </Indicator>
      ),
      base: "bg-danger",
    },
    {
      name: "CurrencyInput inputClassName",
      mount: (legacy, modern) => (
        <CurrencyInput
          value={100}
          onValueChange={noop}
          inputClassName={legacy}
          classNames={modern ? { input: modern } : undefined}
        />
      ),
      base: "pl-11",
    },
    {
      name: "PostalCodeField inputClassName",
      mount: (legacy, modern) => (
        <PostalCodeField
          value=""
          onValueChange={noop}
          lookup={async () => null}
          inputClassName={legacy}
          classNames={modern ? { input: modern } : undefined}
        />
      ),
      base: "pr-11",
    },
  ];

  for (const entry of LEGACY) {
    test(`${entry.name} sozinha continua vestindo a parte`, () => {
      const screen = render(entry.mount("rc-legado"));
      const classes = classOf(screen, "rc-legado");

      expect(classes).toContain(entry.base);
    });

    test(`${entry.name} com classNames: as duas somam, e classNames vence no conflito`, () => {
      const screen = render(entry.mount("rc-legado mt-1", "rc-novo mt-3"));
      const classes = classOf(screen, "rc-novo");

      expect(classes).toContain(entry.base);
      expect(classes).toContain("rc-legado");
      expect(classes).toContain("mt-3");
      expect(classes).not.toContain("mt-1");
    });
  }
});
