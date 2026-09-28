import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AccessibilityInfo } from "react-native";

import { AlertDialog, type AlertDialogProps } from "../src";
import { act, byRole, byType, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const base = {
  open: true,
  title: "Cancelar a nota?",
  description: "Não dá para desfazer.",
  labels: { confirm: "Cancelar nota" },
};

function mount(props: Partial<AlertDialogProps> = {}) {
  const onOpenChange = mock((_open: boolean) => {});
  const screen = render(
    <AlertDialog {...base} onOpenChange={onOpenChange} onConfirm={() => {}} {...props} />,
  );
  const buttons = () => byRole(screen, "button");
  const cancel = () => buttons()[0]!;
  const action = () => buttons()[1]!;
  return { screen, onOpenChange, action, cancel };
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

const tokens = (node: { props: { className?: string } }) => (node.props.className ?? "").split(" ");

describe("AlertDialog: tom", () => {
  test("o padrão continua destrutivo", () => {
    const { action } = mount();
    expect(tokens(action())).toContain("bg-danger");
    expect(tokens(action())).not.toContain("bg-accent");
  });

  test("tone neutral pinta o botão primário, para o que se desfaz", () => {
    const { action } = mount({ tone: "neutral" });
    expect(tokens(action())).toContain("bg-accent");
    expect(tokens(action())).not.toContain("bg-danger");
  });
});

describe("AlertDialog: ação que devolve promessa", () => {
  test("ação que devolve outro valor fecha na hora, como antes da promessa", () => {
    const onConfirm = mock(() => 42);
    const { onOpenChange, action } = mount({ onConfirm });

    act(() => action().props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(action().props.accessibilityState.busy).toBe(false);
  });

  test("segura o modal aberto, trava o botão e anuncia a espera até resolver", async () => {
    const running = deferred();
    const onConfirm = mock(() => running.promise);
    const { onOpenChange, action, cancel } = mount({ onConfirm });

    act(() => action().props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(action().props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(cancel().props.accessibilityState.disabled).toBe(true);
    expect(spoken.announced).toContain("Cancelar nota: ação em andamento. Aguarde.");

    act(() => action().props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await act(async () => {
      running.resolve();
      await running.promise;
    });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(action().props.accessibilityState.busy).toBe(false);
  });

  test("promessa que rejeita devolve o modal ao estado anterior, aberto", async () => {
    const running = deferred();
    const { onOpenChange, action, cancel } = mount({ onConfirm: () => running.promise });

    act(() => action().props.onPress());
    await act(async () => {
      running.reject(new Error("falhou"));
      await running.promise.catch(() => {});
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(action().props.accessibilityState).toEqual({ disabled: false, busy: false });
    expect(cancel().props.accessibilityState.disabled).toBe(false);
  });

  test("voltar do sistema durante a espera não fecha, e diz por quê", () => {
    const running = deferred();
    const { screen, onOpenChange, action } = mount({ onConfirm: () => running.promise });

    act(() => action().props.onPress());
    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(spoken.announced).toContain("Não dá para cancelar enquanto a ação está em andamento.");
  });

  test("fora da espera, o voltar do sistema fecha como sempre", () => {
    const { screen, onOpenChange } = mount();
    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("loading de fora também trava, e labels.busy troca o que se ouve", () => {
    const onConfirm = mock(() => {});
    const { action } = mount({ loading: true, labels: { busy: "Cancelando a nota 4813." }, onConfirm });

    expect(action().props.accessibilityState.busy).toBe(true);
    expect(spoken.announced).toContain("Cancelando a nota 4813.");
    act(() => action().props.onPress());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("fechado, a espera não fala nada", () => {
    mount({ open: false, loading: true });
    expect(spoken.announced).toEqual([]);
  });
});

describe("AlertDialog: saída sem confirmar", () => {
  test("o botão de cancelar e o voltar do sistema chamam o onCancel", () => {
    const onCancel = mock(() => {});
    const { screen, cancel } = mount({ onCancel });

    act(() => cancel().props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(1);

    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test("confirmar não chama o onCancel", () => {
    const onCancel = mock(() => {});
    const { action } = mount({ onCancel });
    act(() => action().props.onPress());
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("durante a espera o voltar não chama o onCancel, e o aviso sai de labels.blocked", () => {
    const onCancel = mock(() => {});
    const running = deferred();
    const { screen, action } = mount({
      onCancel,
      onConfirm: () => running.promise,
      labels: { confirm: "Cancelar nota", blocked: "Espere a nota ser cancelada." },
    });

    act(() => action().props.onPress());
    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());

    expect(onCancel).not.toHaveBeenCalled();
    expect(spoken.announced).toContain("Espere a nota ser cancelada.");
  });

  test("sem labels, os botões dizem Cancelar e Confirmar, como o Popconfirm do web", () => {
    const screen = render(
      <AlertDialog
        open
        title="Arquivar?"
        description="Dá para desfazer."
        onOpenChange={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(textOf(screen)).toContain("Cancelar");
    expect(textOf(screen)).toContain("Confirmar");
  });
});
