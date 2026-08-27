import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import { AlertDialog, Button, Dialog, Sheet, useToast } from "../src";
import { act, byClass, byLabel, byRole, render, renderError, textOf } from "./helpers";

describe("Dialog", () => {
  test("fechado não monta nada; aberto mostra título e corpo", () => {
    const closed = render(
      <Dialog open={false} onOpenChange={() => {}} title="Nota 4813">
        <Text>Detalhe</Text>
      </Dialog>,
    );
    expect(textOf(closed)).not.toContain("Nota 4813");

    const open = render(
      <Dialog open onOpenChange={() => {}} title="Nota 4813" description="Clínica São Lucas">
        <Text>Detalhe</Text>
      </Dialog>,
    );
    expect(textOf(open)).toContain("Nota 4813");
    expect(textOf(open)).toContain("Clínica São Lucas");
    expect(textOf(open)).toContain("Detalhe");
  });

  test("o toque fora fecha", () => {
    const onOpenChange = mock(() => {});
    const screen = render(<Dialog open onOpenChange={onOpenChange} title="x" />);
    const [overlay] = byLabel(screen, "Fechar");
    act(() => overlay.props.onPress());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("a tarja e irma do painel, com papel, e nao o embrulha", () => {
    const screen = render(
      <Dialog open onOpenChange={() => {}} title="Nota 4813">
        <Text>Detalhe</Text>
      </Dialog>,
    );
    const [overlay] = byLabel(screen, "Fechar");
    // Enquanto o dialogo inteiro morava dentro dela, a primeira parada do
    // VoiceOver era um botao gigante chamado "Fechar" que engolia o conteudo.
    expect(overlay.props.children).toBeUndefined();
    expect(overlay.props.accessibilityRole).toBe("button");
  });

  test("o leitor de tela nao vaza para a tela de tras, e o titulo e cabecalho", () => {
    const screen = render(<Dialog open onOpenChange={() => {}} title="Nota 4813" />);
    expect(
      byClass(screen, /items-center/).some((node) => node.props.accessibilityViewIsModal),
    ).toBe(true);
    const [heading] = byRole(screen, "header");
    expect(heading).toBeDefined();
    expect(heading.props.children).toBe("Nota 4813");
  });
});

describe("AlertDialog", () => {
  const props = {
    open: true,
    title: "Cancelar a nota?",
    description: "Não dá para desfazer.",
    actionLabel: "Cancelar nota",
  };

  test("o toque fora NÃO fecha: o overlay nem é tocável", () => {
    const screen = render(<AlertDialog {...props} onOpenChange={() => {}} onAction={() => {}} />);
    expect(byLabel(screen, "Fechar").length).toBe(0);
  });

  test("também prende o leitor de tela e anuncia o título como cabeçalho", () => {
    const screen = render(<AlertDialog {...props} onOpenChange={() => {}} onAction={() => {}} />);
    expect(
      byClass(screen, /items-center/).some((node) => node.props.accessibilityViewIsModal),
    ).toBe(true);
    expect(byRole(screen, "header")[0].props.children).toBe("Cancelar a nota?");
  });

  test("confirmar fecha e só então age; cancelar só fecha", () => {
    const calls: string[] = [];
    const screen = render(
      <AlertDialog
        {...props}
        onOpenChange={(open) => calls.push(`open:${open}`)}
        onAction={() => calls.push("action")}
      />,
    );

    const buttons = byRole(screen, "button");
    const destructive = buttons.find((node) => /bg-danger/.test(node.props.className ?? ""));
    act(() => destructive!.props.onPress());
    expect(calls).toEqual(["open:false", "action"]);

    calls.length = 0;
    const ghost = byRole(screen, "button").find(
      (node) => !/bg-danger/.test(node.props.className ?? ""),
    );
    act(() => ghost!.props.onPress());
    expect(calls).toEqual(["open:false"]);
  });
});

describe("Sheet", () => {
  test("aberta mostra o conteúdo, e o fundo fecha no toque", () => {
    const onOpenChange = mock(() => {});
    const screen = render(
      <Sheet open onOpenChange={onOpenChange} title="Nota 4813" description="Paga">
        <Text>Corpo da folha</Text>
      </Sheet>,
    );
    expect(textOf(screen)).toContain("Corpo da folha");
    act(() => byLabel(screen, "Fechar")[0].props.onPress());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("a tarja tambem e irma do painel, e o titulo e cabecalho", () => {
    const screen = render(
      <Sheet open onOpenChange={() => {}} title="Nota 4813">
        <Text>Corpo da folha</Text>
      </Sheet>,
    );
    const [overlay] = byLabel(screen, "Fechar");
    expect(overlay.props.children).toBeUndefined();
    expect(overlay.props.accessibilityRole).toBe("button");
    expect(byClass(screen, /justify-end/).some((node) => node.props.accessibilityViewIsModal)).toBe(
      true,
    );
    expect(byRole(screen, "header")[0].props.children).toBe("Nota 4813");
  });
});

describe("useToast", () => {
  function Emitter() {
    const toast = useToast();
    return (
      <Button onPress={() => toast.add({ title: "Nota emitida", description: "Foi por e-mail." })}>
        Emitir
      </Button>
    );
  }

  test("fora do provider, o erro explica o que faltou", () => {
    // O helper monta com provider; aqui o hook roda pelado de propósito.
    expect(renderError(<Emitter />)).toContain("RivoProvider");
  });

  test("add põe o aviso na tela na hora", () => {
    const screen = render(<Emitter />);
    expect(textOf(screen)).not.toContain("Nota emitida");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(textOf(screen)).toContain("Nota emitida");
    expect(textOf(screen)).toContain("Foi por e-mail.");
    // A saída em 4s é um setTimeout real; medi-la aqui seria testar o relógio.
  });
});
