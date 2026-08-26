import { describe, expect, mock, test } from "bun:test";

import { act, byLabel, byRole, render, textOf } from "./helpers";

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
