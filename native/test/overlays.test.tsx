import { describe, expect, mock, test } from "bun:test";
import { Text } from "react-native";

import { AlertDialog, Button, Dialog, Sheet, useToast } from "../src";
import { act, byClass, byLabel, byRole, byType, render, renderError, textOf } from "./helpers";

describe("Dialog", () => {
  test("closed mounts nothing; open shows title and body", () => {
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

  test("a tap outside closes", () => {
    const onOpenChange = mock(() => {});
    const screen = render(<Dialog open onOpenChange={onOpenChange} title="x" />);
    const [overlay] = byLabel(screen, "Fechar");
    act(() => overlay.props.onPress());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("the backdrop is a sibling of the panel, with a role, and does not wrap it", () => {
    const screen = render(
      <Dialog open onOpenChange={() => {}} title="Nota 4813">
        <Text>Detalhe</Text>
      </Dialog>,
    );
    const [overlay] = byLabel(screen, "Fechar");
    // While the whole dialog lived inside it, VoiceOver's first stop was a
    // giant button called "Fechar" that swallowed the content.
    expect(overlay.props.children).toBeUndefined();
    expect(overlay.props.accessibilityRole).toBe("button");
  });

  test("the screen reader does not leak to the screen behind, and the title is a header", () => {
    const screen = render(<Dialog open onOpenChange={() => {}} title="Nota 4813" />);
    const modal = byType(screen, "View").filter((node) => node.props.accessibilityViewIsModal);
    expect(modal).toHaveLength(1);
    expect(
      modal[0]!.findAll((node) => node.props.accessibilityRole === "header").length,
    ).toBeGreaterThan(0);
    expect(
      modal[0]!.findAll((node) => node.props.accessibilityLabel === "Fechar").length,
    ).toBeGreaterThan(0);
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
    labels: { confirm: "Cancelar nota" },
  };

  test("a tap outside does NOT close: the overlay is not even tappable", () => {
    const screen = render(<AlertDialog {...props} onOpenChange={() => {}} onConfirm={() => {}} />);
    expect(byLabel(screen, "Fechar").length).toBe(0);
  });

  test("it also traps the screen reader and announces the title as a header", () => {
    const screen = render(<AlertDialog {...props} onOpenChange={() => {}} onConfirm={() => {}} />);
    expect(
      byClass(screen, /items-center/).some((node) => node.props.accessibilityViewIsModal),
    ).toBe(true);
    expect(byRole(screen, "header")[0].props.children).toBe("Cancelar a nota?");
  });

  test("confirm acts and closes, in the web order; cancel only closes", () => {
    const calls: string[] = [];
    const screen = render(
      <AlertDialog
        {...props}
        onOpenChange={(open) => calls.push(`open:${open}`)}
        onConfirm={() => calls.push("action")}
      />,
    );

    const buttons = byRole(screen, "button");
    const danger = buttons.find((node) => /bg-danger/.test(node.props.className ?? ""));
    act(() => danger!.props.onPress());
    expect(calls).toEqual(["action", "open:false"]);

    calls.length = 0;
    const ghost = byRole(screen, "button").find(
      (node) => !/bg-danger/.test(node.props.className ?? ""),
    );
    act(() => ghost!.props.onPress());
    expect(calls).toEqual(["open:false"]);
  });
});

describe("Sheet", () => {
  test("open shows the content, and the backdrop closes on tap", () => {
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

  test("the backdrop is also a sibling of the panel, and the title is a header", () => {
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

  test("outside the provider, the error explains what was missing", () => {
    // The helper mounts with a provider; here the hook runs bare on purpose.
    expect(renderError(<Emitter />)).toContain("RivoProvider");
  });

  test("add puts the notice on screen right away", () => {
    const screen = render(<Emitter />);
    expect(textOf(screen)).not.toContain("Nota emitida");
    act(() => byRole(screen, "button")[0].props.onPress());
    expect(textOf(screen)).toContain("Nota emitida");
    expect(textOf(screen)).toContain("Foi por e-mail.");
    // The 4s exit is a real setTimeout; measuring it here would be testing the clock.
  });
});
