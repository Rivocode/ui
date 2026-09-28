import { describe, expect, spyOn, test } from "bun:test";
import { Linking } from "react-native";
import { act, type ReactTestInstance } from "react-test-renderer";

import { Heading, Link, Text } from "../src";
import { byRole, render } from "./helpers";

const hostTexts = (screen: ReturnType<typeof render>) =>
  screen.root.findAll((node) => node.type === "Text");

const tokens = (node: ReactTestInstance) => String(node.props.className ?? "").split(" ");

const opened = () => (Linking as unknown as { opened: string[] }).opened;

describe("native Heading", () => {
  test("announces itself as a header", () => {
    const screen = render(<Heading level={2}>Notas</Heading>);
    const [heading] = byRole(screen, "header");

    expect(heading).toBeDefined();
    expect(tokens(heading!)).toContain("text-xl");
    expect(tokens(heading!)).toContain("text-fg");
  });

  test("the size follows the level, and changes without touching the level", () => {
    const first = render(<Heading level={1}>Painel</Heading>);
    expect(tokens(byRole(first, "header")[0]!)).toContain("text-2xl");

    const small = render(
      <Heading level={1} size="md">
        Painel
      </Heading>,
    );
    const classes = tokens(byRole(small, "header")[0]!);

    expect(classes).toContain("text-md");
    expect(classes).not.toContain("text-2xl");
  });

  test("truncate cuts at one line", () => {
    const screen = render(
      <Heading level={3} truncate>
        Clínica São Lucas
      </Heading>,
    );

    expect(byRole(screen, "header")[0]!.props.numberOfLines).toBe(1);
  });
});

describe("native Text", () => {
  test("with no new prop, the caller's class passes intact", () => {
    const screen = render(<Text className="text-xs text-fg-muted">Legenda</Text>);
    const [node] = hostTexts(screen);

    expect(node!.props.className).toBe("text-xs text-fg-muted");
  });

  test("tone, size and weight become the same roles as the web", () => {
    const screen = render(
      <Text size="sm" tone="danger" weight="medium">
        Rejeitada
      </Text>,
    );
    const classes = tokens(hostTexts(screen)[0]!);

    expect(classes).toContain("text-sm");
    expect(classes).toContain("text-danger-text");
    expect(classes).not.toContain("text-danger");
    expect(classes).toContain("font-rc-medium");
  });

  test("lineClamp wins over truncate, and truncate is one line", () => {
    const one = render(<Text truncate>Uma</Text>);
    expect(hostTexts(one)[0]!.props.numberOfLines).toBe(1);

    const three = render(
      <Text truncate lineClamp={3}>
        Tres
      </Text>,
    );
    expect(hostTexts(three)[0]!.props.numberOfLines).toBe(3);
  });
});

describe("native Link", () => {
  test("is a link for the screen reader, underlined in the accent tone", () => {
    const screen = render(<Link href="https://rivocode.com.br">Site</Link>);
    const [link] = byRole(screen, "link");

    expect(link).toBeDefined();
    expect(tokens(link!)).toContain("underline");
    expect(tokens(link!)).toContain("text-accent-text");
  });

  test("without onPress, a tap opens href through Linking", () => {
    const screen = render(<Link href="mailto:contato@rivocode.com.br">Escrever</Link>);
    const before = opened().length;

    act(() => byRole(screen, "link")[0]!.props.onPress({}));

    expect(opened().length).toBe(before + 1);
    expect(opened().at(-1)).toBe("mailto:contato@rivocode.com.br");
  });

  test("an address Linking refuses does not become an unhandled rejected promise: it becomes a dev warning", async () => {
    const linking = Linking as unknown as { openURL: (url: string) => Promise<unknown> };
    const original = linking.openURL;
    const warn = spyOn(console, "warn").mockImplementation(() => {});
    linking.openURL = () => Promise.reject(new Error("No app to open /notas"));
    try {
      const screen = render(<Link href="/notas">Notas</Link>);
      act(() => byRole(screen, "link")[0]!.props.onPress({}));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]![0])).toContain('"/notas"');
    } finally {
      linking.openURL = original;
      warn.mockRestore();
    }
  });

  test("with onPress, the router is what navigates, and Linking stays quiet", () => {
    const visits: string[] = [];
    const screen = render(
      <Link href="/notas" onPress={() => visits.push("/notas")}>
        Notas
      </Link>,
    );
    const before = opened().length;

    act(() => byRole(screen, "link")[0]!.props.onPress({}));

    expect(visits).toEqual(["/notas"]);
    expect(opened().length).toBe(before);
  });

  test("external draws the arrow and signals through the hint, without the arrow in the name", () => {
    const screen = render(
      <Link href="https://www.gov.br/nfse" external>
        Portal da NFS-e
      </Link>,
    );
    const link = byRole(screen, "link")[0]!;

    expect(link.props.accessibilityHint).toBe("Abre fora do app.");
    expect(link.props.accessibilityLabel).toBe("Portal da NFS-e");
    expect(link.props.children).toContain(" ↗");
  });

  test("without external there is no arrow nor hint", () => {
    const screen = render(<Link href="/notas">Notas</Link>);
    const link = byRole(screen, "link")[0]!;

    expect(link.props.accessibilityHint).toBeUndefined();
    expect(link.props.children).not.toContain(" ↗");
  });
});
