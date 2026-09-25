import { describe, expect, test } from "bun:test";
import { useState, type ReactElement } from "react";
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";

import { CurrencyInput, Highlight, Indicator, PostalCodeField, Text } from "../src";
import { act, byType, render } from "./helpers";

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

const both =
  (...checks: Is[]) =>
  (node: ReactTestInstance) =>
    checks.every((check) =>
      typeof check === "string" ? tokens(node).includes(check) : check(node),
    );

const ofType = (type: string) => (node: ReactTestInstance) => node.type === type;

const noop = () => {};

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
];

const PIECES = new Set(CASES.map((entry) => entry.name.split(" ")[0]));

describe("classNames no nativo", () => {
  test("a tabela cobre as pecas que ganharam classNames", () => {
    expect(PIECES.size).toBeGreaterThanOrEqual(4);
    expect(CASES.flatMap((entry) => Object.keys(entry.parts)).length).toBeGreaterThan(6);
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
