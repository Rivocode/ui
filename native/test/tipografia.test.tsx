import { describe, expect, test } from "bun:test";
import { Linking } from "react-native";
import { act, type ReactTestInstance } from "react-test-renderer";

import { Heading, Link, Text } from "../src";
import { byRole, render } from "./helpers";

const hostTexts = (screen: ReturnType<typeof render>) =>
  screen.root.findAll((node) => node.type === "Text");

const tokens = (node: ReactTestInstance) => String(node.props.className ?? "").split(" ");

const opened = () => (Linking as unknown as { opened: string[] }).opened;

describe("Heading nativo", () => {
  test("se anuncia como cabecalho", () => {
    const screen = render(<Heading level={2}>Notas</Heading>);
    const [heading] = byRole(screen, "header");

    expect(heading).toBeDefined();
    expect(tokens(heading!)).toContain("text-xl");
    expect(tokens(heading!)).toContain("text-fg");
  });

  test("o tamanho acompanha o nivel, e muda sem mexer no nivel", () => {
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

  test("truncate corta em uma linha", () => {
    const screen = render(
      <Heading level={3} truncate>
        Clínica São Lucas
      </Heading>,
    );

    expect(byRole(screen, "header")[0]!.props.numberOfLines).toBe(1);
  });
});

describe("Text nativo", () => {
  test("sem prop nova, a classe de quem chama passa intacta", () => {
    const screen = render(<Text className="text-xs text-fg-muted">Legenda</Text>);
    const [node] = hostTexts(screen);

    expect(node!.props.className).toBe("text-xs text-fg-muted");
  });

  test("tom, corpo e peso viram os mesmos papeis do web", () => {
    const screen = render(
      <Text size="sm" tone="danger" weight="medium">
        Rejeitada
      </Text>,
    );
    const classes = tokens(hostTexts(screen)[0]!);

    expect(classes).toContain("text-sm");
    expect(classes).toContain("text-danger-text");
    expect(classes).not.toContain("text-danger");
    expect(classes).toContain("font-medium");
  });

  test("lineClamp vence truncate, e truncate e uma linha", () => {
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

describe("Link nativo", () => {
  test("e link para o leitor de tela, sublinhado no tom de acento", () => {
    const screen = render(<Link href="https://rivocode.com.br">Site</Link>);
    const [link] = byRole(screen, "link");

    expect(link).toBeDefined();
    expect(tokens(link!)).toContain("underline");
    expect(tokens(link!)).toContain("text-accent-text");
  });

  test("sem onPress, o toque abre o href pelo Linking", () => {
    const screen = render(<Link href="mailto:contato@rivocode.com.br">Escrever</Link>);
    const before = opened().length;

    act(() => byRole(screen, "link")[0]!.props.onPress({}));

    expect(opened().length).toBe(before + 1);
    expect(opened().at(-1)).toBe("mailto:contato@rivocode.com.br");
  });

  test("com onPress, quem navega e o router, e o Linking fica quieto", () => {
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

  test("external desenha a seta e avisa pela dica, sem a seta no nome", () => {
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

  test("sem external nao ha seta nem dica", () => {
    const screen = render(<Link href="/notas">Notas</Link>);
    const link = byRole(screen, "link")[0]!;

    expect(link.props.accessibilityHint).toBeUndefined();
    expect(link.props.children).not.toContain(" ↗");
  });
});
