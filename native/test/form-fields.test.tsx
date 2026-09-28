import { beforeEach, describe, expect, mock, test } from "bun:test";
import { useState } from "react";

import {
  Calendar,
  ColorPicker,
  Editable,
  Field,
  Input,
  InputGroup,
  MaskedInput,
  NumberField,
  OTPField,
  PostalCodeField,
  RivoProvider,
  SearchInput,
  Select,
  Slider,
  TagsInput,
  Textarea,
  TimeField,
} from "../src";
import { forText } from "../src/form";
import { Tree, type TreeNode } from "../src/tree";
import { act, byClass, byLabel, byRole, byType, render } from "./helpers";

type Responder = {
  onPanResponderTerminationRequest?: () => boolean;
  onPanResponderGrant: (event: unknown) => void;
  onPanResponderMove: (event: unknown) => void;
};

const { panResponders } = (await import("react-native")) as unknown as {
  panResponders: Responder[];
};

beforeEach(() => {
  panResponders.length = 0;
});

const at = (x: number) => ({ nativeEvent: { locationX: x, locationY: 0 } });

const input = (screen: ReturnType<typeof render>) => byType(screen, "TextInput")[0]!;

const hostParent = (node: { parent: unknown }) => {
  let current = node.parent as {
    type: unknown;
    parent: unknown;
    props: Record<string, unknown>;
  } | null;
  while (current && typeof current.type !== "string") current = current.parent as typeof current;
  return current;
};

describe("Slider", () => {
  test("the drag uses the current max and callback, not the ones from mount", () => {
    const first = mock((_: number) => {});
    const second = mock((_: number) => {});
    const screen = render(<Slider value={0} onValueChange={first} max={100} label="Volume" />);
    const [slider] = byRole(screen, "adjustable");
    act(() => slider!.props.onLayout({ nativeEvent: { layout: { width: 200 } } }));

    act(() =>
      screen.update(
        <RivoProvider>
          <Slider value={0} onValueChange={second} max={10} label="Volume" />
        </RivoProvider>,
      ),
    );
    act(() => panResponders[0]!.onPanResponderGrant(at(100)));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(5);
  });

  test("track and thumb do not take the touch, and the gesture does not let itself be stolen", () => {
    const screen = render(<Slider value={40} onValueChange={() => {}} label="Volume" />);
    const parts = byClass(screen, /\b(h-1\.5|size-5)\b/);

    expect(parts.length).toBe(2);
    for (const part of parts) expect(part.props.pointerEvents).toBe("none");
    expect(panResponders.at(-1)!.onPanResponderTerminationRequest?.()).toBe(false);
  });

  test("disabled, the screen reader hears the state and cannot adjust", () => {
    const onValueChange = mock(() => {});
    const screen = render(
      <Slider value={40} onValueChange={onValueChange} label="Volume" disabled />,
    );
    const [slider] = byRole(screen, "adjustable");

    expect(slider!.props.accessibilityState).toEqual({ disabled: true });
    expect(slider!.props.accessibilityActions).toEqual([]);
    act(() => slider!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("a 0.1 step comes out with the step's decimals, without the floating point remainder", () => {
    const onValueChange = mock((_: number) => {});
    const screen = render(
      <Slider value={0.2} onValueChange={onValueChange} max={1} step={0.1} label="Opacidade" />,
    );
    const [slider] = byRole(screen, "adjustable");

    act(() => slider!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
  });
});

describe("Field takes the label to the control", () => {
  test("Input, Textarea, InputGroup and MaskedInput come out with the Field's name", () => {
    const controls = [
      <Input key="input" />,
      <Textarea key="textarea" />,
      <InputGroup key="group" value="" onValueChange={() => {}} />,
      <MaskedInput key="masked" mask="cpf" value="" onValueChange={() => {}} />,
    ];

    for (const control of controls) {
      const screen = render(<Field label="Nome">{control}</Field>);
      expect(input(screen).props.accessibilityLabel).toBe("Nome");
    }
  });

  test("the name the caller passed wins over the Field's", () => {
    const screen = render(
      <Field label="Nome">
        <Input accessibilityLabel="Nome completo" />
      </Field>,
    );
    expect(input(screen).props.accessibilityLabel).toBe("Nome completo");
  });
});

describe("NumberField", () => {
  function Controlled(props: {
    min?: number;
    max?: number;
    step?: number;
    record: (n: number) => void;
  }) {
    const [value, setValue] = useState(props.min ?? 0);
    return (
      <NumberField
        label="Parcelas"
        min={props.min}
        max={props.max}
        step={props.step}
        value={value}
        onValueChange={(next) => {
          props.record(next);
          setValue(next);
        }}
      />
    );
  }

  test("the middle field has a name", () => {
    const screen = render(<NumberField value={2} onValueChange={() => {}} label="Parcelas" />);
    expect(input(screen).props.accessibilityLabel).toBe("Parcelas");
  });

  test("min waits for leaving the field, and max applies on every keystroke", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled min={10} max={100} record={record} />);

    act(() => input(screen).props.onChangeText("2"));
    act(() => input(screen).props.onChangeText("25"));
    expect(record.mock.calls.map(([n]) => n)).toEqual([25]);

    act(() => input(screen).props.onChangeText("999"));
    expect(record).toHaveBeenLastCalledWith(100);
    expect(input(screen).props.value).toBe("100");

    act(() => input(screen).props.onChangeText("5"));
    act(() => input(screen).props.onBlur());
    expect(record).toHaveBeenLastCalledWith(10);
    expect(input(screen).props.value).toBe("10");
  });

  test("accepts comma and dot as the decimal separator", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled step={0.1} record={record} />);

    expect(input(screen).props.keyboardType).toBe("decimal-pad");
    act(() => input(screen).props.onChangeText("2,5"));
    expect(record).toHaveBeenLastCalledWith(2.5);
    act(() => input(screen).props.onChangeText("3.7"));
    expect(record).toHaveBeenLastCalledWith(3.7);
  });

  test("a 0.1 step comes out with the step's decimals", () => {
    const onValueChange = mock((_: number) => {});
    const screen = render(
      <NumberField value={0.2} onValueChange={onValueChange} step={0.1} label="Taxa" />,
    );
    act(() => byLabel(screen, "Aumentar Taxa")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
  });

  test("the outside value appears mid-typing, without waiting for leaving", () => {
    let change = (_: (n: number) => number) => {};
    function Harness() {
      const [value, setValue] = useState(5);
      change = (next) => setValue(next);
      return <NumberField value={value} onValueChange={setValue} label="Parcelas" />;
    }
    const screen = render(<Harness />);

    act(() => input(screen).props.onChangeText("7"));
    expect(input(screen).props.value).toBe("7");
    act(() => change(() => 0));
    expect(input(screen).props.value).toBe("0");

    act(() => input(screen).props.onChangeText("7"));
    act(() => change((n) => n + 1));
    expect(input(screen).props.value).toBe("8");
  });

  test("the step adds from what was typed, without rounding to the step", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled step={0.5} record={record} />);

    act(() => input(screen).props.onChangeText("2,37"));
    act(() => byLabel(screen, "Aumentar Parcelas")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith(2.87);
    expect(input(screen).props.value).toBe("2,87");
  });

  test("the step starts from what was typed below min, not from the previous value", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled min={10} max={100} record={record} />);

    act(() => input(screen).props.onChangeText("40"));
    act(() => input(screen).props.onChangeText("4"));
    act(() => byLabel(screen, "Diminuir Parcelas")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith(10);
  });

  test("with a negative min it accepts the minus sign and switches keyboard", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled min={-50} record={record} />);

    expect(["number-pad", "decimal-pad"]).not.toContain(input(screen).props.keyboardType);
    act(() => input(screen).props.onChangeText("-"));
    expect(input(screen).props.value).toBe("-");
    act(() => input(screen).props.onChangeText("-12"));
    expect(record).toHaveBeenLastCalledWith(-12);
    expect(input(screen).props.value).toBe("-12");
  });

  test("without a negative min the minus sign is dropped from the text", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled record={record} />);

    expect(input(screen).props.keyboardType).toBe("number-pad");
    act(() => input(screen).props.onChangeText("-3"));
    expect(record).toHaveBeenLastCalledWith(3);
  });
});

describe("TimeField", () => {
  test("the middle field has a name", () => {
    const screen = render(<TimeField value="" onValueChange={() => {}} label="Entrega" />);
    expect(input(screen).props.accessibilityLabel).toBe("Entrega");
  });

  test("an outside reset appears mid-typing, without waiting for leaving", () => {
    let reset = () => {};
    function Harness() {
      const [value, setValue] = useState("");
      reset = () => setValue("");
      return <TimeField value={value} onValueChange={setValue} label="Entrega" />;
    }
    const screen = render(<Harness />);

    act(() => input(screen).props.onChangeText("0830"));
    act(() => input(screen).props.onChangeText("083"));
    expect(input(screen).props.value).toBe("08:3");

    act(() => reset());
    expect(input(screen).props.value).toBe("");
  });
});

describe("forText", () => {
  test("the FormField's disabled becomes editable, which is what the TextInput reads", () => {
    const row = {
      name: "nome",
      value: "Ana",
      onChange: () => {},
      onBlur: () => {},
      ref: () => {},
      disabled: true,
      accessibilityLabel: "Nome",
      invalid: false,
    };
    const screen = render(<Input {...forText(row as never)} />);
    expect(input(screen).props.editable).toBe(false);

    const open = forText({ ...row, disabled: undefined } as never);
    expect("editable" in open).toBe(false);
  });
});

describe("Select", () => {
  test("the flat list scrolls, and the 27 UFs stay reachable", () => {
    const states = Array.from({ length: 27 }, (_, index) => ({
      value: `uf${index}`,
      label: `UF ${index}`,
    }));
    const screen = render(
      <Select label="Estado" items={states} value={null} onValueChange={() => {}} />,
    );
    act(() => byLabel(screen, "Estado")[0]!.props.onPress());

    const [scroll] = byType(screen, "ScrollView");
    expect(scroll).toBeDefined();
    expect(String(scroll!.props.className).split(" ")).toContain("shrink");
    const options = scroll!.findAll(
      (node) => typeof node.type === "string" && node.props.accessibilityRole === "button",
    );
    expect(options.length).toBe(27);
  });
});

describe("pasting the formatted code", () => {
  test("OTPField does not cut the pasted text before cleaning", () => {
    const onValueChange = mock((_: string) => {});
    const screen = render(<OTPField value="" onValueChange={onValueChange} />);

    expect(input(screen).props.maxLength).toBeUndefined();
    act(() => input(screen).props.onChangeText("123 456"));
    expect(onValueChange).toHaveBeenLastCalledWith("123456");
  });

  test("PostalCodeField does not cut a CEP pasted with a dot", () => {
    const onValueChange = mock((_: string, __: string) => {});
    const screen = render(
      <PostalCodeField
        value=""
        onValueChange={onValueChange}
        lookup={() => new Promise(() => {})}
      />,
    );

    expect(input(screen).props.maxLength).toBeUndefined();
    act(() => input(screen).props.onChangeText("58.038-000"));
    expect(onValueChange.mock.calls[0]![0]).toBe("58038000");
  });
});

describe("the tappable frame does not hide its children from the screen reader", () => {
  test("OTPField and TagsInput", () => {
    const otp = render(<OTPField value="" onValueChange={() => {}} />);
    const tags = render(<TagsInput value={["pix"]} onValueChange={() => {}} />);

    for (const screen of [otp, tags]) {
      const frames = byRole(screen, "none").filter((node) => node.type === "Pressable");
      expect(frames.length).toBe(1);
      expect(frames[0]!.props.accessible).toBe(false);
    }
  });
});

describe("Editable", () => {
  test("disabled neither offers nor answers the edit action", () => {
    const screen = render(<Editable value="Ana" onValueChange={() => {}} label="Nome" disabled />);
    const [preview] = byLabel(screen, "Nome: Ana");

    expect(preview!.props.accessibilityActions).toEqual([]);
    act(() => preview!.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(byType(screen, "TextInput").length).toBe(0);
  });
});

describe("44 targets", () => {
  const SIZE: Record<string, number> = { "size-4": 16, "size-10": 40 };
  const reach = (node: { props: { className?: string; hitSlop?: number } }) => {
    const size = String(node.props.className)
      .split(" ")
      .map((token) => SIZE[token])
      .find((value) => value !== undefined);
    expect(size).toBeDefined();
    return size! + 2 * (node.props.hitSlop ?? 0);
  };

  test("the Calendar day", () => {
    const screen = render(<Calendar value="2026-08-10" onValueChange={() => {}} />);
    const [day] = byLabel(screen, "15/08/2026");
    expect(reach(day!)).toBeGreaterThanOrEqual(44);
  });

  test("the SearchInput x fits whole within the field height", () => {
    const search = render(<SearchInput value="clinica" onValueChange={() => {}} />);
    const [clear] = byLabel(search, "Limpar a busca");

    expect(reach(clear!)).toBeGreaterThanOrEqual(44);
    expect(String(hostParent(clear!)?.props.className).split(" ")).toContain("h-12");
  });

  test("the TagsInput x gets the slack that fits in the chip, above WCAG's 24", () => {
    const tags = render(<TagsInput value={["pix"]} onValueChange={() => {}} />);
    const [remove] = byClass(tags, /size-4/).filter((node) => node.type === "Pressable");
    const slop = remove!.props.hitSlop as {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    const chip = String(hostParent(remove!)?.props.className).split(" ");

    expect(chip).toContain("py-1");
    expect(slop.top).toBeLessThanOrEqual(4);
    expect(slop.bottom).toBeLessThanOrEqual(4);
    expect(16 + slop.top + slop.bottom).toBeGreaterThanOrEqual(24);
    expect(16 + slop.left + slop.right).toBeGreaterThanOrEqual(24);
  });
});

describe("Tree", () => {
  const PLAN: TreeNode[] = [
    {
      id: "financeiro",
      label: "Financeiro",
      children: [
        { id: "pagar", label: "Contas a pagar" },
        { id: "travada", label: "Conta travada", disabled: true },
      ],
    },
  ];

  const toggleAll = (value: string[]) => {
    const onValueChange = mock((_: string[]) => {});
    const screen = render(
      <Tree items={PLAN} multiple value={value} onValueChange={onValueChange} label="Centro" />,
    );
    act(() => byLabel(screen, "Marcar tudo em Financeiro")[0]!.props.onPress());
    return onValueChange.mock.calls[0]![0];
  };

  test("checking the branch skips the locked leaf", () => {
    expect(toggleAll([])).toEqual(["pagar"]);
  });

  test("unchecking the branch preserves the locked leaf that was already checked", () => {
    expect(toggleAll(["travada", "pagar"])).toEqual(["travada"]);
    expect(toggleAll(["travada"])).toEqual(["travada", "pagar"]);
  });
});

describe("ColorPicker", () => {
  test("the swatch comes out normalized", () => {
    const onValueChange = mock((_: string) => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={["#F0A"]} />,
    );
    act(() => byLabel(screen, "Cor #F0A")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith("#ff00aa");
  });
});
