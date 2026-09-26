import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";

import { useToast, type ToastApi } from "../src";
import { act, byClass, render, textOf } from "./helpers";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function mount() {
  const seen: ToastApi[] = [];
  function Probe() {
    seen.push(useToast());
    return null;
  }
  const screen = render(<Probe />);
  return { screen, api: () => seen[seen.length - 1]!, seen };
}

const boxOf = (screen: ReturnType<typeof render>, title: string) =>
  byClass(screen, /rounded-md border/).find(
    (node) => node.findAll((child) => child.props?.children === title).length > 0,
  );

const classesOf = (screen: ReturnType<typeof render>, title: string) =>
  (boxOf(screen, title)!.props.className as string).split(" ");

describe("useToast nativo, com o contrato do web", () => {
  test("add devolve o id, e o type escolhe o tom do Alert; sem type sai neutro", () => {
    const { screen, api } = mount();
    let id = "";
    act(() => {
      id = api().add({ title: "Falhou", type: "danger" });
      api().add({ title: "Salvo" });
      api().add({ title: "Quebrou", type: "error" });
    });
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);

    expect(classesOf(screen, "Falhou")).toContain("bg-danger-subtle");
    expect(classesOf(screen, "Falhou")).not.toContain("bg-surface-raised");
    expect(classesOf(screen, "Quebrou")).toContain("bg-danger-subtle");
    expect(classesOf(screen, "Salvo")).toContain("bg-surface-raised");
  });

  test("sem timeout sai em 4s; timeout 0 fica ate o close(id), que chama o onClose", () => {
    const { screen, api } = mount();
    const onClose = mock(() => {});
    let sticky = "";
    act(() => {
      api().add({ title: "Passageiro" });
      sticky = api().add({ title: "Fixo", timeout: 0, onClose });
    });
    act(() => jest.advanceTimersByTime(4000));
    expect(textOf(screen)).not.toContain("Passageiro");

    act(() => jest.advanceTimersByTime(60_000));
    expect(textOf(screen)).toContain("Fixo");
    expect(onClose).not.toHaveBeenCalled();

    act(() => api().close(sticky));
    expect(textOf(screen)).not.toContain("Fixo");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("update reescreve o aviso que esta na tela", () => {
    const { screen, api } = mount();
    let id = "";
    act(() => {
      id = api().add({ title: "Enviando", timeout: 0 });
    });
    act(() => api().update(id, { title: "Enviado", type: "success" }));
    expect(textOf(screen)).not.toContain("Enviando");
    expect(classesOf(screen, "Enviado")).toContain("bg-success-subtle");
  });

  test("promise e um aviso so, que troca de texto e de tom quando a promessa resolve", async () => {
    const { screen, api } = mount();
    let finish!: (value: number) => void;
    const pending = new Promise<number>((resolve) => {
      finish = resolve;
    });
    let result!: Promise<number>;
    act(() => {
      result = api().promise(pending, {
        loading: { title: "Emitindo a nota" },
        success: (number) => ({ title: `Nota ${number} emitida` }),
        error: { title: "A emissão falhou" },
      });
    });
    expect(textOf(screen)).toContain("Emitindo a nota");
    act(() => jest.advanceTimersByTime(10_000));
    expect(textOf(screen)).toContain("Emitindo a nota");

    await act(async () => {
      finish(4816);
      await result;
    });
    expect(textOf(screen)).not.toContain("Emitindo a nota");
    expect(classesOf(screen, "Nota 4816 emitida")).toContain("bg-success-subtle");
    expect(byClass(screen, /rounded-md border/)).toHaveLength(1);

    act(() => jest.advanceTimersByTime(4000));
    expect(textOf(screen)).not.toContain("Nota 4816 emitida");
  });

  test("promise que falha vira o tom de erro e devolve a rejeicao", async () => {
    const { screen, api } = mount();
    let caught: unknown;
    await act(async () => {
      await api()
        .promise(Promise.reject(new Error("rede")), {
          loading: "Emitindo",
          success: "Emitida",
          error: (error) => ({ title: `Falhou: ${(error as Error).message}` }),
        })
        .catch((error: unknown) => {
          caught = error;
        });
    });
    expect((caught as Error).message).toBe("rede");
    expect(classesOf(screen, "Falhou: rede")).toContain("bg-danger-subtle");
  });

  test("o objeto do gancho tem identidade estavel entre renderizacoes", () => {
    const { api, seen } = mount();
    act(() => {
      api().add({ title: "Um" });
    });
    expect(seen.length).toBeGreaterThanOrEqual(1);
    expect(new Set(seen).size).toBe(1);
  });
});
