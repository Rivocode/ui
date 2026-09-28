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

describe("the value rules", () => {
  test("the mask adds the colon and stops at four digits", () => {
    expect(applyTimeMask("8")).toBe("8");
    expect(applyTimeMask("0830")).toBe("08:30");
    expect(applyTimeMask("083045")).toBe("08:30");
    expect(applyTimeMask("a8b3")).toBe("83");
  });

  test("parseTime refuses the impossible instead of fixing it", () => {
    expect(parseTime("14:30")).toBe(870);
    expect(parseTime("00:00")).toBe(0);
    expect(parseTime("25:99")).toBeUndefined();
    expect(parseTime("23:60")).toBeUndefined();
    expect(parseTime("14")).toBeUndefined();
  });

  test("formatTime returns five-character text, and empty without a time", () => {
    expect(formatTime(870)).toBe("14:30");
    expect(formatTime(0)).toBe("00:00");
    expect(formatTime(undefined)).toBe("");
  });
});

describe("TimeField", () => {
  test("only a whole time notifies the listener", () => {
    const record = mock((_value: string) => {});
    const screen = render(<ControlledField initial="" label="Horário" record={record} />);
    const input = byType(screen, "TextInput")[0]!;

    act(() => input.props.onChangeText("08"));
    expect(record).not.toHaveBeenCalled();
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("08");

    act(() => byType(screen, "TextInput")[0]!.props.onChangeText("0830"));
    expect(record).toHaveBeenCalledWith("08:30");
  });

  test("emptying the field notifies with an empty string", () => {
    const record = mock((_value: string) => {});
    const screen = render(<ControlledField initial="08:30" label="Horário" record={record} />);

    act(() => byType(screen, "TextInput")[0]!.props.onChangeText(""));
    expect(record).toHaveBeenCalledWith("");
  });

  test("25:99 marks invalid, does not emit, and leaving goes back to the last valid one", () => {
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

  test("both buttons land on the grid, and do not add the raw step", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledField initial="14:07" label="Horário" step={15} record={record} />,
    );

    act(() => byLabel(screen, "Aumentar Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("14:15");

    act(() => byLabel(screen, "Diminuir Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("14:00");
  });

  test("with the field empty the plus button starts at the window opening", () => {
    const record = mock((_value: string) => {});
    const screen = render(
      <ControlledField initial="" label="Horário" min="08:00" max="18:00" record={record} />,
    );

    act(() => byLabel(screen, "Aumentar Horário")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith("08:00");
  });

  test("the step does not become a rule: a time off the grid still counts", () => {
    const screen = render(<ControlledField initial="14:07" label="Horário" step={30} />);
    expect(byLabel(screen, "Horário")[0]!.props.className).not.toContain("border-danger");
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("14:07");
  });

  test("outside the window marks invalid without erasing what the person typed", () => {
    const screen = render(
      <ControlledField initial="19:00" label="Horário" min="08:00" max="18:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).toContain("border-danger");
    expect(byType(screen, "TextInput")[0]!.props.value).toBe("19:00");
  });

  test("an inverted window is ignored, and the whole day counts", () => {
    const screen = render(
      <ControlledField initial="03:00" label="Horário" min="22:00" max="06:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).not.toContain("border-danger");
  });

  test("the keyboard that opens is the numeric one", () => {
    const screen = render(<ControlledField initial="" label="Horário" />);
    expect(byType(screen, "TextInput")[0]!.props.keyboardType).toBe("number-pad");
  });
});

describe("TimePicker", () => {
  test("the trigger shows the time, and without a choice shows the mask", () => {
    const cheio = render(<ControlledPicker initial="14:30" label="Horário da coleta" />);
    expect(textOf(cheio)).toContain("14:30");

    const vazio = render(<ControlledPicker initial="" label="Horário da coleta" />);
    expect(textOf(vazio)).toContain("Escolha o horário");
  });

  test("the hour does not close the sheet and keeps the minute; the minute closes it", () => {
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

  test("the window trims the grid without shifting the grid", () => {
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

  test("the new hour sticks to the window limit instead of leaving it", () => {
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

  test("each option goes past the 44pt target", () => {
    const screen = render(<ControlledPicker initial="14:30" label="Horário" />);
    act(() => byLabel(screen, "Horário")[0]!.props.onPress());

    expect(byLabel(screen, "Hora 14")[0]!.props.className).toContain("h-12");
    expect(byLabel(screen, "Minuto 30")[0]!.props.className).toContain("h-12");
  });

  test("a value outside the window paints the trigger as an error without erasing", () => {
    const screen = render(
      <ControlledPicker initial="19:00" label="Horário" min="08:00" max="18:00" />,
    );

    expect(byLabel(screen, "Horário")[0]!.props.className).toContain("border-danger");
    expect(textOf(screen)).toContain("19:00");
  });

  test("the column names change one without erasing the other", () => {
    const screen = render(
      <ControlledPicker initial="14:30" label="Horário" labels={{ hours: "Hora da coleta" }} />,
    );
    act(() => byLabel(screen, "Horário")[0]!.props.onPress());

    expect(byLabel(screen, "Hora da coleta 14").length).toBe(1);
    expect(byLabel(screen, "Minuto 30").length).toBe(1);
  });
});
