import { describe, expect, mock, test } from "bun:test";
import { useState } from "react";

import { TimeField, TimePicker, applyTimeMask, formatTime, parseTime } from "../src";
import type { TimeFieldProps, TimePickerProps } from "../src";
import { act, byLabel, byType, render, textOf } from "./helpers";

type FieldHarnessProps = Omit<TimeFieldProps, "value" | "onValueChange"> & {
  initial: string;
  record?: (value: string) => void;
};

function ControlledField({ initial, record, ...props }: FieldHarnessProps) {
  const [value, setValue] = useState(initial);

  return (
    <TimeField
      {...props}
      value={value}
      onValueChange={(next) => {
        record?.(next);
        setValue(next);
      }}
    />
  );
}

type PickerHarnessProps = Omit<TimePickerProps, "value" | "onValueChange"> & {
  initial: string;
  record?: (value: string) => void;
};

function ControlledPicker({ initial, record, ...props }: PickerHarnessProps) {
  const [value, setValue] = useState(initial);

  return (
    <TimePicker
      {...props}
      value={value}
      onValueChange={(next) => {
        record?.(next);
        setValue(next);
      }}
    />
  );
}

describe("as regras do valor", () => {
  test("a mascara poe os dois pontos e para em quatro digitos", () => {
    expect(applyTimeMask("8")).toBe("8");
    expect(applyTimeMask("0830")).toBe("08:30");
    expect(applyTimeMask("083045")).toBe("08:30");
    expect(applyTimeMask("a8b3")).toBe("83");
  });

  test("parseTime recusa o impossivel em vez de consertar", () => {
    expect(parseTime("14:30")).toBe(870);
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("25:99")).toBeUndefined();
    expect(parseTime("23:60")).toBeUndefined();
    expect(parseTime("14")).toBeUndefined();
  });

  test("formatTime devolve texto de cinco casas, e vazio sem hora", () => {
    expect(formatTime(870)).toBe("14:30");
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(undefined)).toBe("");
  });
});

describe("TimeField", () => {
  test("so hora inteira avisa quem escuta", () => {
    const record = mock((_value: string) => {});
    const screen = render(<ControlledField initial="" label="Horário" record={record} />);
    const input = byType(screen, "TextInput")[0]!;

    act(() => input.props.onChangeText("08"));
    expect(record).not.toHaveBeenCalled();
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("08");

    act(() => byType(screen, "TextInput")[0]!.props.onChangeText("0830"));
    expect(record).toHaveBeenCalledWith("08:30");
  });

  test("esvaziar o campo avisa com string vazia", () => {
    const record = mock((_value: string) => {});
    const screen = render(<ControlledField initial="08:30" label="Horário" record={record} />);

    act(() => byType(screen, "TextInput")[0]!.props.onChangeText(""));
    expect(record).toHaveBeenCalledWith("");
  });

  test("25:99 marca invalido, nao emite, e sair volta ao ultimo valido", () => {
    const record = mock((_value: string) => {});
    const screen = render(<ControlledField initial="08:00" label="Horário" record={record} />);
    const frame = () => byLabel(screen, "Horário")[0]!.props.className as string;
    const input = () => byType(screen, "TextInput")[0]!;

    act(() => input().props.onChangeText("25"));
    expect(frame()).not.toContain("border-danger");

    act(() => input().props.onChangeText("2599"));
    expect(input().props.value).toBe("25:99");
    expect(frame()).toContain("border-danger");
    expect(record).not.toHaveBeenCalled();

    act(() => input().props.onBlur());
    expect(input().props.value).toBe("08:00");
    expect(frame()).not.toContain("border-danger");
  });

  test("os dois botoes pousam na grade, e nao somam o passo cru", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledField initial="14:07" label="Horário" step={15} record={record} />,
    );

    act(() => byLabel(screen, "Aumentar Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("14:15");

    act(() => byLabel(screen, "Diminuir Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("14:00");
  });

  test("com o campo vazio o botao de mais comeca na abertura da janela", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledField initial="" label="Horário" min="08:00" max="18:00" record={record} />,
    );

    act(() => byLabel(screen, "Aumentar Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("08:00");
  });

  test("o passo nao vira regra: hora fora da grade continua valendo", () => {
    const screen = render(<ControlledField initial="14:07" label="Horário" step={30} />);
    expect(byLabel(screen, "Horário")[0]!.props.className).not.toContain("border-danger");
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("14:07");
  });

  test("fora da janela marca invalido sem apagar o que a pessoa digitou", () => {
    const screen = render(
      <ControlledField initial="19:00" label="Horário" min="08:00" max="18:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).toContain("border-danger");
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("19:00");
  });

  test("janela invertida e ignorada, e o dia inteiro vale", () => {
    const screen = render(
      <ControlledField initial="03:00" label="Horário" min="22:00" max="06:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).not.toContain("border-danger");
  });

  test("o teclado que abre e o numerico", () => {
    const screen = render(<ControlledField initial="" label="Horário" />);
    expect(byType(screen, "TextInput")[0]!.props.keyboardType).toBe("number-pad");
  });
});

describe("TimePicker", () => {
  test("o gatilho mostra a hora, e sem escolha mostra o molde", () => {
    const cheio = render(<ControlledPicker initial="14:30" label="Horário da coleta" />);
    expect(textOf(cheio)).toContain("14:30");

    const vazio = render(<ControlledPicker initial="" label="Horário da coleta" />);
    expect(textOf(vazio)).toContain("Escolha o horário");
  });

  test("a hora nao fecha a folha e preserva o minuto; o minuto fecha", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledPicker initial="14:30" label="Horário da coleta" step={15} record={record} />,
    );

    act(() => byLabel(screen, "Horário da coleta")[0]!.props.onPress());
    expect(byLabel(screen, "Hora 16").length).toBe(1);

    act(() => byLabel(screen, "Hora 16")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("16:30");
    expect(byLabel(screen, "Minuto 30").length).toBe(1);

    act(() => byLabel(screen, "Minuto 45")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("16:45");
    expect(byLabel(screen, "Minuto 45").length).toBe(0);
  });

  test("a janela recorta a grade sem deslocar a grade", () => {
    const screen = render(
      <ControlledPicker initial="" label="Horário" min="08:10" max="10:00" step={15} />,
    );
    act(() => byLabel(screen, "Horário")[0]!.props.onPress());

    expect(byLabel(screen, "Hora 07").length).toBe(0);
    expect(byLabel(screen, "Hora 08").length).toBe(1);
    expect(byLabel(screen, "Hora 10").length).toBe(1);
    expect(byLabel(screen, "Hora 11").length).toBe(0);
    expect(byLabel(screen, "Minuto 00").length).toBe(0);
    expect(byLabel(screen, "Minuto 15").length).toBe(1);
  });

  test("a hora nova encosta no limite da janela em vez de sair", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledPicker
        initial="09:45"
        label="Horário"
        min="08:00"
        max="10:00"
        step={15}
        record={record}
      />,
    );

    act(() => byLabel(screen, "Horário")[0]!.props.onPress());
    act(() => byLabel(screen, "Hora 10")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("10:00");
  });

  test("cada opcao passa dos 44pt de alvo", () => {
    const screen = render(<ControlledPicker initial="14:30" label="Horário" />);
    act(() => byLabel(screen, "Horário")[0]!.props.onPress());

    expect(byLabel(screen, "Hora 14")[0]!.props.className).toContain("h-12");
    expect(byLabel(screen, "Minuto 30")[0]!.props.className).toContain("h-12");
  });

  test("valor fora da janela pinta o gatilho de erro sem apagar", () => {
    const screen = render(
      <ControlledPicker initial="19:00" label="Horário" min="08:00" max="18:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).toContain("border-danger");
    expect(textOf(screen)).toContain("19:00");
  });

  test("os nomes das colunas trocam um sem apagar o outro", () => {
    const screen = render(
      <ControlledPicker initial="14:30" label="Horário" labels={{ hours: "Hora da coleta" }} />,
    );
    act(() => byLabel(screen, "Horário")[0]!.props.onPress());

    expect(byLabel(screen, "Hora da coleta 14").length).toBe(1);
    expect(byLabel(screen, "Minuto 30").length).toBe(1);
  });
});
