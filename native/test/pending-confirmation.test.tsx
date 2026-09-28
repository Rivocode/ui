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

describe("AlertDialog: tone", () => {
  test("the default stays destructive", () => {
    const { action } = mount();
    expect(tokens(action())).toContain("bg-danger");
    expect(tokens(action())).not.toContain("bg-accent");
  });

  test("tone neutral paints the primary button, for what can be undone", () => {
    const { action } = mount({ tone: "neutral" });
    expect(tokens(action())).toContain("bg-accent");
    expect(tokens(action())).not.toContain("bg-danger");
  });
});

describe("AlertDialog: an action that returns a promise", () => {
  test("an action that returns another value closes at once, as before the promise", () => {
    const onConfirm = mock(() => 42);
    const { onOpenChange, action } = mount({ onConfirm });

    act(() => action().props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(action().props.accessibilityState.busy).toBe(false);
  });

  test("holds the modal open, locks the button and announces the wait until it resolves", async () => {
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

  test("a rejecting promise returns the modal to its previous state, open", async () => {
    const running = deferred();
    const { onOpenChange, action, cancel } = mount({ onConfirm: () => running.promise });

    act(() => action().props.onPress());
    await act(async () => {
      running.reject(new Error("failed"));
      await running.promise.catch(() => {});
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(action().props.accessibilityState).toEqual({ disabled: false, busy: false });
    expect(cancel().props.accessibilityState.disabled).toBe(false);
  });

  test("system back during the wait does not close, and says why", () => {
    const running = deferred();
    const { screen, onOpenChange, action } = mount({ onConfirm: () => running.promise });

    act(() => action().props.onPress());
    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(spoken.announced).toContain("Não dá para cancelar enquanto a ação está em andamento.");
  });

  test("outside the wait, system back closes as always", () => {
    const { screen, onOpenChange } = mount();
    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  test("an outside loading also locks, and labels.busy changes what is heard", () => {
    const onConfirm = mock(() => {});
    const { action } = mount({ loading: true, labels: { busy: "Cancelando a nota 4813." }, onConfirm });

    expect(action().props.accessibilityState.busy).toBe(true);
    expect(spoken.announced).toContain("Cancelando a nota 4813.");
    act(() => action().props.onPress());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("closed, the wait says nothing", () => {
    mount({ open: false, loading: true });
    expect(spoken.announced).toEqual([]);
  });
});

describe("AlertDialog: leaving without confirming", () => {
  test("the cancel button and system back call onCancel", () => {
    const onCancel = mock(() => {});
    const { screen, cancel } = mount({ onCancel });

    act(() => cancel().props.onPress());
    expect(onCancel).toHaveBeenCalledTimes(1);

    const [modal] = byType(screen, "Modal");
    act(() => modal!.props.onRequestClose());
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  test("confirming does not call onCancel", () => {
    const onCancel = mock(() => {});
    const { action } = mount({ onCancel });
    act(() => action().props.onPress());
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("during the wait back does not call onCancel, and the notice comes from labels.blocked", () => {
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

  test("without labels, the buttons say Cancelar and Confirmar, like the web Popconfirm", () => {
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
