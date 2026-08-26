import { describe, expect, test } from "bun:test";
import { Text } from "react-native";

import { Code } from "../src/code";
import { Timeline, type TimelineEvent } from "../src/timeline";
import { byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const HISTORY: TimelineEvent[] = [
  { title: "Nota emitida", at: "12/03 às 14:20", by: "Ana Duarte", tone: "neutral" },
  {
    title: "Autorizada pela Sefaz",
    at: "12/03 às 14:22",
    by: "Sistema",
    tone: "success",
    description: "Protocolo 135250000123456",
  },
  { title: "Pagamento", at: "em 3 dias", tone: "accent", pending: true },
];

describe("Timeline", () => {
  test("a linha é uma lista e cada evento é uma parada só, com posição", () => {
    const screen = render(<Timeline items={HISTORY} label="Histórico da nota 4471" />);

    expect(byLabel(screen, "Histórico da nota 4471").length).toBe(1);
    expect(byRole(screen, "list").length).toBe(1);

    // Uma parada por evento, e nenhuma a mais: título, carimbo e autor não se
    // quebram em três paradas de leitor de tela.
    const stops = screen.root.findAll(
      (node) => typeof node.type === "string" && node.props?.accessible === true,
    );
    expect(stops.length).toBe(HISTORY.length);
  });

  test("o rótulo de cada evento diz o que mudou, quando, por quem e onde está", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byLabel(screen, "1 de 3: Nota emitida, 12/03 às 14:20, por Ana Duarte").length).toBe(1);
    expect(
      byLabel(
        screen,
        "2 de 3: Autorizada pela Sefaz, 12/03 às 14:22, por Sistema. Protocolo 135250000123456",
      ).length,
    ).toBe(1);
  });

  test("o evento futuro diz que ainda não aconteceu, e o marcador fica vazado", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byLabel(screen, "3 de 3: Pagamento, ainda não aconteceu, em 3 dias").length).toBe(1);

    // Vazado é borda sem preenchimento - e nunca a cor do tom, que prometeria
    // que o evento já ocorreu.
    const hollow = byClass(screen, /border-border-strong/);
    expect(hollow.length).toBe(1);
    expect(hollow[0].props.className).toContain("bg-bg");
    expect(hollow[0].props.className).not.toContain("bg-accent");
  });

  test("o tom pinta o marcador, evento a evento", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byClass(screen, /bg-border-strong/).length).toBe(1);
    expect(byClass(screen, /bg-success/).length).toBe(1);
  });

  test("o último evento não pendura fio nem folga embaixo dele", () => {
    const screen = render(<Timeline items={HISTORY} />);

    expect(byClass(screen, /w-px/).length).toBe(HISTORY.length - 1);
    expect(byClass(screen, /pb-5/).length).toBe(HISTORY.length - 1);
  });

  test("o carimbo e o autor saem na mesma linha, e o detalhe embaixo", () => {
    const screen = render(<Timeline items={HISTORY} />);
    const text = textOf(screen);

    expect(text).toContain("12/03 às 14:20 · Ana Duarte");
    expect(text).toContain("Protocolo 135250000123456");
  });

  test("um rótulo escrito à mão vence a frase montada", () => {
    const screen = render(
      <Timeline
        items={[{ title: "Cancelada", accessibilityLabel: "Nota cancelada pelo emitente" }]}
      />,
    );

    expect(byLabel(screen, "Nota cancelada pelo emitente").length).toBe(1);
    expect(byLabel(screen, "1 de 1: Cancelada").length).toBe(0);
  });

  test("sem evento nenhum não desenha linha vazia", () => {
    const screen = render(<Timeline items={[]} />);
    expect(byRole(screen, "list").length).toBe(0);
  });
});

describe("Code", () => {
  test("sai na letra do código, com fundo, e o toque longo copia", () => {
    const screen = render(<Code>app.json</Code>);
    const [piece] = byType(screen, "Text");

    expect(textOf(screen)).toContain("app.json");
    expect(piece.props.className).toContain("bg-surface-raised");
    // A letra do codigo entra por style, e nao por classe - `fonte-mono.test.tsx`
    // conta por que.
    expect([piece.props.style].flat(3)[0]).toHaveProperty("fontFamily");
    expect(piece.props.selectable).toBe(true);
  });

  test("não rola de lado nem corta: o trecho quebra junto com a frase", () => {
    const screen = render(
      <Text className="text-base text-fg">
        Abra o <Code>node_modules/@rivocode/ui-native/src/index.ts</Code> e confira.
      </Text>,
    );

    // Rolagem própria é do CodeBlock, que é outra peça: dentro de um parágrafo
    // ela seria uma armadilha para o dedo que rola a tela.
    expect(byType(screen, "ScrollView").length).toBe(0);
    for (const node of byType(screen, "Text")) {
      expect(node.props.numberOfLines).toBeUndefined();
    }
  });

  test("não crava corpo de letra: dentro da frase ele herda o do texto de fora", () => {
    const screen = render(<Code>slug</Code>);
    const [piece] = byType(screen, "Text");

    expect(piece.props.className).not.toMatch(/(^|\s)text-(xs|sm|base|md|lg|xl)(\s|$)/);
  });

  test("a classe de quem usa vence a da peça, e o selecionar se desliga", () => {
    const screen = render(
      <Code className="text-danger-text" selectable={false}>
        emitida_em
      </Code>,
    );
    const [piece] = byType(screen, "Text");

    expect(piece.props.className).toContain("text-danger-text");
    expect(piece.props.className).not.toContain("text-fg-muted");
    expect(piece.props.selectable).toBe(false);
  });
});
