import { beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo } from "react-native";

import { PostalCodeField, type PostalAddress, type PostalCodeFieldProps } from "../src";
import { act, byRole, byType, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const AURORA: PostalAddress = {
  street: "Avenida Epitácio Pessoa",
  district: "Tambaú",
  city: "João Pessoa",
  state: "PB",
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => {
    resolve = yes;
  });
  return { promise, resolve };
}

function Controlled(props: Omit<PostalCodeFieldProps, "value" | "onValueChange">) {
  const [value, setValue] = useState("");
  return <PostalCodeField {...props} value={value} onValueChange={setValue} />;
}

function mount(props: Omit<PostalCodeFieldProps, "value" | "onValueChange">) {
  const screen = render(<Controlled {...props} />);
  const input = () => byType(screen, "TextInput")[0]!;
  const type = async (text: string) => {
    await act(async () => input().props.onChangeText(text));
  };
  return { screen, input, type };
}

describe("PostalCodeField", () => {
  test("mostra a mascara, guarda so os digitos e abre o teclado numerico", async () => {
    const onValueChange = mock((_digits: string, _masked: string) => {});
    const screen = render(
      <PostalCodeField value="58038000" onValueChange={onValueChange} lookup={async () => null} />,
    );
    const input = byType(screen, "TextInput")[0]!;

    expect(input.props.value).toBe("58038-000");
    expect(input.props.keyboardType).toBe("number-pad");
    expect(input.props.textContentType).toBe("postalCode");

    act(() => input.props.onChangeText("58038-00"));
    expect(onValueChange).toHaveBeenLastCalledWith("5803800", "58038-00");
  });

  test("so busca ao completar os 8 digitos, e anuncia a espera e o achado", async () => {
    const pending = deferred<PostalAddress | null>();
    const lookup = mock((_code: string) => pending.promise);
    const onAddress = mock((_address: PostalAddress, _code: string) => {});
    const { screen, input, type } = mount({ lookup, onAddress });

    await type("5803800");
    expect(lookup).not.toHaveBeenCalled();

    await type("58038000");
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(input().props.accessibilityState.busy).toBe(true);
    expect(byType(screen, "ActivityIndicator")).toHaveLength(1);
    expect(spoken.announced).toEqual(["Buscando endereço…"]);

    await act(async () => pending.resolve(AURORA));
    expect(onAddress).toHaveBeenCalledWith(AURORA, "58038000");
    expect(byType(screen, "ActivityIndicator")).toHaveLength(0);
    expect(spoken.announced).toEqual(["Buscando endereço…", "Endereço encontrado."]);
  });

  test("nao achou: aviso em portugues e campo invalido", async () => {
    const { screen, input, type } = mount({ lookup: async () => null });

    await type("99999999");

    expect(textOf(screen)).toContain("CEP não encontrado");
    expect(input().props.className.split(" ")).toContain("border-danger");
    expect(spoken.announced.at(-1)).toMatch(/^CEP não encontrado/);
  });

  test("falha de rede: aviso neutro, campo nao invalido, e o botao tenta de novo", async () => {
    let calls = 0;
    const lookup = mock(async () => {
      calls += 1;
      if (calls === 1) throw new TypeError("Network request failed");
      return AURORA;
    });
    const onAddress = mock(() => {});
    const { screen, input, type } = mount({ lookup, onAddress });

    await type("58038000");

    expect(textOf(screen)).toContain("Não foi possível buscar o CEP");
    expect(input().props.className.split(" ")).not.toContain("border-danger");

    const [retry] = byRole(screen, "button");
    await act(async () => retry!.props.onPress());
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(onAddress).toHaveBeenCalledTimes(1);
    expect(textOf(screen)).not.toContain("Não foi possível buscar o CEP");
  });

  test("trocar o CEP no meio cancela a busca anterior, e a resposta velha nao entra", async () => {
    const first = deferred<PostalAddress | null>();
    const second = deferred<PostalAddress | null>();
    const answers = [first, second];
    const signals: AbortSignal[] = [];
    const lookup = (_code: string, signal: AbortSignal) => {
      signals.push(signal);
      return answers[signals.length - 1]!.promise;
    };
    const onAddress = mock((_address: PostalAddress, _code: string) => {});
    const { type } = mount({ lookup, onAddress });

    await type("58038000");
    await type("01310100");
    expect(signals[0]!.aborted).toBe(true);

    await act(async () => first.resolve(AURORA));
    expect(onAddress).not.toHaveBeenCalled();

    await act(async () => second.resolve({ ...AURORA, city: "São Paulo", state: "SP" }));
    expect(onAddress).toHaveBeenCalledTimes(1);
    expect(onAddress.mock.calls[0]![1]).toBe("01310100");
  });
});
