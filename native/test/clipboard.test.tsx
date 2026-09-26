import { describe, expect, mock, test } from "bun:test";

import { act, byClass, byLabel, byRole, render, textOf } from "./helpers";

/*
 * O expo-clipboard nao esta instalado onde a suite roda, e nao vai estar: ele
 * e peer OPCIONAL e modulo nativo do Expo, entao o unico lugar do repositorio
 * que o tem e `examples/native`, que nao e workspace - e onde o
 * `check:native:types` vai buscar os tipos. Aqui ele entra como duble, e o
 * duble e util por si: `setStringAsync` devolvendo `false` e o caso que
 * nenhum aparelho reproduz sob demanda.
 *
 * O `mock.module` PRECISA correr antes de a peca ser avaliada, e `import` e
 * icado para o topo do arquivo: por isso a peca entra por `await import` logo
 * abaixo. E a mesma armadilha de `chart-svg.test.tsx`.
 */
let written: string[] = [];
let accepts = true;

mock.module("expo-clipboard", () => ({
  setStringAsync: async (text: string) => {
    written.push(text);
    return accepts;
  },
}));

const { Clipboard } = await import("../src/clipboard/clipboard");

const CHAVE = "35240612345678000199550010000048131000048139";

function reset() {
  written = [];
  accepts = true;
}

/** O toque, com o await que a copia assincrona pede. */
async function press(node: { props: { onPress: () => unknown } }) {
  await act(async () => {
    await node.props.onPress();
  });
}

describe("Clipboard", () => {
  test("copia o valor e confirma nos dois canais: o botao e o aviso", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} />);

    const [button] = byLabel(screen, "Copiar");
    await press(button!);

    expect(written).toEqual([CHAVE]);
    // O botao: o nome falado passa a ser a confirmacao.
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(byLabel(screen, "Copiar")).toHaveLength(0);
    // O aviso: e ele que fala sozinho, porque trocar o accessibilityLabel de
    // um Pressable ja focado nao e reanunciado por leitor de tela nenhum.
    expect(textOf(screen)).toContain("Copiado");
  });

  test("a area de transferencia que recusa nao confirma nada", async () => {
    reset();
    accepts = false;
    const screen = render(<Clipboard value={CHAVE} />);

    await press(byLabel(screen, "Copiar")[0]!);

    // Mentir que copiou e pior do que nao confirmar: a pessoa cola o que
    // tinha antes e so descobre no destino.
    expect(byLabel(screen, "Copiar")).toHaveLength(1);
    expect(byLabel(screen, "Copiado")).toHaveLength(0);
    expect(textOf(screen)).not.toContain("Copiado");
  });

  test("o onCopy so dispara quando copiou de verdade", async () => {
    reset();
    const onCopy = mock(() => {});

    accepts = false;
    const refused = render(<Clipboard value={CHAVE} onCopy={onCopy} />);
    await press(byLabel(refused, "Copiar")[0]!);
    expect(onCopy).toHaveBeenCalledTimes(0);

    accepts = true;
    const done = render(<Clipboard value={CHAVE} onCopy={onCopy} />);
    await press(byLabel(done, "Copiar")[0]!);
    expect(onCopy).toHaveBeenCalledWith(CHAVE);
  });

  test("a confirmacao volta sozinha, senao o botao fica preso num estado que passou", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} timeout={5} />);

    await press(byLabel(screen, "Copiar")[0]!);
    expect(byLabel(screen, "Copiado")).toHaveLength(1);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(byLabel(screen, "Copiar")).toHaveLength(1);
  });

  test("toast desligado deixa so a confirmacao do botao", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} toast={false} />);

    await press(byLabel(screen, "Copiar")[0]!);

    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).not.toContain("Copiado");
  });

  test("os dois nomes trocam um sem o outro, e o texto visivel segue o falado", async () => {
    reset();
    const screen = render(
      <Clipboard value={CHAVE} labels={{ copy: "Copiar a chave" }}>
        Copiar a chave
      </Clipboard>,
    );

    expect(textOf(screen)).toContain("Copiar a chave");
    await press(byLabel(screen, "Copiar a chave")[0]!);

    // Trocar so o verbo nao obriga a reescrever a confirmacao junto.
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).toContain("Copiado");
  });

  test("o children e o texto do botao enquanto nao copiou, e o copied entra depois", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE}>Copiar a chave de acesso</Clipboard>);

    expect(textOf(screen)).toContain("Copiar a chave de acesso");
    const [button] = byLabel(screen, "Copiar a chave de acesso");
    expect(button).toBeDefined();

    await press(button!);
    expect(byLabel(screen, "Copiado")).toHaveLength(1);
    expect(textOf(screen)).not.toContain("Copiar a chave de acesso");
  });

  test("so de icone o alvo e quadrado e cheio, sem depender de hitSlop", () => {
    reset();
    const icon = render(<Clipboard value={CHAVE} />);
    expect(byLabel(icon, "Copiar")[0]!.props.className).toContain("h-11 w-11");

    const withText = render(<Clipboard value={CHAVE}>Copiar</Clipboard>);
    expect(byLabel(withText, "Copiar")[0]!.props.className).toContain("h-11 px-4");
  });

  test("desabilitado nao copia e diz que esta desabilitado", async () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} disabled />);
    const [button] = byRole(screen, "button");

    expect(button!.props.accessibilityState).toEqual({ disabled: true });
    expect(button!.props.disabled).toBe(true);
  });

  test("a classe de quem usa vence a da peca", () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} className="h-14" />);
    const className = byLabel(screen, "Copiar")[0]!.props.className as string;

    expect(className).toContain("h-14");
    expect(className).not.toContain("h-11 w-11");
  });
});

const VARIANTS = [
  {
    variant: "primary",
    fill: ["bg-accent", "active:bg-accent-active"],
    label: "text-accent-fg",
    copy: "border-accent-fg",
    check: "border-accent-fg",
  },
  {
    variant: "secondary",
    fill: ["bg-surface", "border", "border-border-strong", "active:bg-surface-raised"],
    label: "text-fg",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "ghost",
    fill: ["active:bg-accent-subtle"],
    label: "text-fg-muted",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "outline",
    fill: ["border-2", "border-border-strong", "active:bg-accent-subtle"],
    label: "text-fg",
    copy: "border-fg-muted",
    check: "border-success-text",
  },
  {
    variant: "danger",
    fill: ["bg-danger", "active:opacity-90"],
    label: "text-danger-fg",
    copy: "border-danger-fg",
    check: "border-danger-fg",
  },
] as const;

describe("Clipboard nas variantes do Button", () => {
  test("sem variant o desenho continua o secundario", () => {
    reset();
    const screen = render(<Clipboard value={CHAVE} />);
    const tokens = (byLabel(screen, "Copiar")[0]!.props.className as string).split(" ");

    expect(tokens).toContain("bg-surface");
    expect(tokens).toContain("border-border-strong");
    expect(tokens).not.toContain("bg-accent");
  });

  for (const { variant, fill, label, copy, check } of VARIANTS) {
    test(`${variant}: o fundo, o rotulo e os dois icones sao os do Button ${variant}`, async () => {
      reset();
      const screen = render(
        <Clipboard value={CHAVE} variant={variant} toast={false}>
          Copiar
        </Clipboard>,
      );

      const button = byLabel(screen, "Copiar")[0]!;
      const tokens = (button.props.className as string).split(" ");
      for (const token of fill) expect(tokens).toContain(token);
      for (const other of VARIANTS) {
        if (other.variant === variant) continue;
        for (const token of other.fill) if (!fill.includes(token as never)) expect(tokens).not.toContain(token);
      }

      const text = byClass(screen, /font-rc-medium/);
      expect(text.length).toBeGreaterThan(0);
      for (const node of text) {
        const words = (node.props.className as string).split(" ");
        expect(words).toContain(label);
      }

      const frames = byClass(screen, /rounded-sm/);
      expect(frames).toHaveLength(2);
      for (const frame of frames) {
        expect((frame.props.className as string).split(" ")).toContain(copy);
      }

      await press(button);
      const ticks = byClass(screen, /-rotate-45/);
      expect(ticks).toHaveLength(1);
      const tick = (ticks[0]!.props.className as string).split(" ");
      expect(tick).toContain(check);
      if (check !== "border-success-text") expect(tick).not.toContain("border-success-text");
    });
  }
});
