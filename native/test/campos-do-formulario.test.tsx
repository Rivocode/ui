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

describe("Slider", () => {
  test("o arrasto usa o max e o callback de agora, e nao os da montagem", () => {
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

  test("trilho e polegar nao recebem o toque, e o gesto nao se deixa roubar", () => {
    const screen = render(<Slider value={40} onValueChange={() => {}} label="Volume" />);
    const parts = byClass(screen, /\b(h-1\.5|size-5)\b/);

    expect(parts.length).toBe(2);
    for (const part of parts) expect(part.props.pointerEvents).toBe("none");
    expect(panResponders.at(-1)!.onPanResponderTerminationRequest?.()).toBe(false);
  });

  test("desabilitado, o leitor de tela ouve o estado e nao consegue ajustar", () => {
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

  test("passo de 0,1 sai com as casas do passo, sem o resto do ponto flutuante", () => {
    const onValueChange = mock((_: number) => {});
    const screen = render(
      <Slider value={0.2} onValueChange={onValueChange} max={1} step={0.1} label="Opacidade" />,
    );
    const [slider] = byRole(screen, "adjustable");

    act(() => slider!.props.onAccessibilityAction({ nativeEvent: { actionName: "increment" } }));
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
  });
});

describe("Field leva o rotulo ao controle", () => {
  test("Input, Textarea, InputGroup e MaskedInput saem com o nome do Field", () => {
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

  test("o nome que quem chama passou vence o do Field", () => {
    const screen = render(
      <Field label="Nome">
        <Input accessibilityLabel="Nome completo" />
      </Field>,
    );
    expect(input(screen).props.accessibilityLabel).toBe("Nome completo");
  });
});

describe("NumberField", () => {
  function Controlled(props: { min?: number; max?: number; step?: number; record: (n: number) => void }) {
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

  test("o campo do meio tem nome", () => {
    const screen = render(<NumberField value={2} onValueChange={() => {}} label="Parcelas" />);
    expect(input(screen).props.accessibilityLabel).toBe("Parcelas");
  });

  test("o min espera a saida do campo, e o max vale a cada tecla", () => {
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

  test("aceita virgula e ponto como separador decimal", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled step={0.1} record={record} />);

    expect(input(screen).props.keyboardType).toBe("decimal-pad");
    act(() => input(screen).props.onChangeText("2,5"));
    expect(record).toHaveBeenLastCalledWith(2.5);
    act(() => input(screen).props.onChangeText("3.7"));
    expect(record).toHaveBeenLastCalledWith(3.7);
  });

  test("passo de 0,1 sai com as casas do passo", () => {
    const onValueChange = mock((_: number) => {});
    const screen = render(
      <NumberField value={0.2} onValueChange={onValueChange} step={0.1} label="Taxa" />,
    );
    act(() => byLabel(screen, "Aumentar Taxa")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
  });

  test("o valor de fora aparece no meio da digitacao, sem esperar a saida", () => {
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

  test("o passo soma a partir do digitado, sem arredondar ao passo", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled step={0.5} record={record} />);

    act(() => input(screen).props.onChangeText("2,37"));
    act(() => byLabel(screen, "Aumentar Parcelas")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith(2.87);
    expect(input(screen).props.value).toBe("2,87");
  });

  test("o passo parte do digitado abaixo do min, e nao do valor anterior", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled min={10} max={100} record={record} />);

    act(() => input(screen).props.onChangeText("40"));
    act(() => input(screen).props.onChangeText("4"));
    act(() => byLabel(screen, "Diminuir Parcelas")[0]!.props.onPress());
    expect(record).toHaveBeenLastCalledWith(10);
  });

  test("com min negativo aceita o sinal de menos e troca de teclado", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled min={-50} record={record} />);

    expect(["number-pad", "decimal-pad"]).not.toContain(input(screen).props.keyboardType);
    act(() => input(screen).props.onChangeText("-"));
    expect(input(screen).props.value).toBe("-");
    act(() => input(screen).props.onChangeText("-12"));
    expect(record).toHaveBeenLastCalledWith(-12);
    expect(input(screen).props.value).toBe("-12");
  });

  test("sem min negativo o sinal de menos sai do texto", () => {
    const record = mock((_: number) => {});
    const screen = render(<Controlled record={record} />);

    expect(input(screen).props.keyboardType).toBe("number-pad");
    act(() => input(screen).props.onChangeText("-3"));
    expect(record).toHaveBeenLastCalledWith(3);
  });
});

describe("TimeField", () => {
  test("o campo do meio tem nome", () => {
    const screen = render(<TimeField value="" onValueChange={() => {}} label="Entrega" />);
    expect(input(screen).props.accessibilityLabel).toBe("Entrega");
  });

  test("o reset de fora aparece no meio da digitacao, sem esperar a saida", () => {
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
  test("o disabled do FormField vira editable, que e o que o TextInput le", () => {
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
  test("a lista rasa rola, e as 27 UFs ficam alcancaveis", () => {
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

describe("colar o codigo formatado", () => {
  test("OTPField nao corta o colado antes da limpeza", () => {
    const onValueChange = mock((_: string) => {});
    const screen = render(<OTPField value="" onValueChange={onValueChange} />);

    expect(input(screen).props.maxLength).toBeUndefined();
    act(() => input(screen).props.onChangeText("123 456"));
    expect(onValueChange).toHaveBeenLastCalledWith("123456");
  });

  test("PostalCodeField nao corta o CEP colado com ponto", () => {
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

describe("a moldura tocavel nao esconde os filhos do leitor de tela", () => {
  test("OTPField e TagsInput", () => {
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
  test("desabilitado nao oferece nem atende a acao de editar", () => {
    const screen = render(
      <Editable value="Ana" onValueChange={() => {}} label="Nome" disabled />,
    );
    const [preview] = byLabel(screen, "Nome: Ana");

    expect(preview!.props.accessibilityActions).toEqual([]);
    act(() => preview!.props.onAccessibilityAction({ nativeEvent: { actionName: "longpress" } }));
    expect(byType(screen, "TextInput").length).toBe(0);
  });
});

describe("alvos de 44", () => {
  const SIZE: Record<string, number> = { "size-4": 16, "size-10": 40 };
  const reach = (node: { props: { className?: string; hitSlop?: number } }) => {
    const size = String(node.props.className)
      .split(" ")
      .map((token) => SIZE[token])
      .find((value) => value !== undefined);
    expect(size).toBeDefined();
    return size! + 2 * (node.props.hitSlop ?? 0);
  };

  test("o dia do Calendar", () => {
    const screen = render(<Calendar value="2026-08-10" onValueChange={() => {}} />);
    const [day] = byLabel(screen, "15/08/2026");
    expect(reach(day!)).toBeGreaterThanOrEqual(44);
  });

  test("o xis do SearchInput e o do TagsInput", () => {
    const search = render(<SearchInput value="clinica" onValueChange={() => {}} />);
    const tags = render(<TagsInput value={["pix"]} onValueChange={() => {}} />);

    expect(reach(byLabel(search, "Limpar a busca")[0]!)).toBeGreaterThanOrEqual(44);
    const [remove] = byClass(tags, /size-4/).filter((node) => node.type === "Pressable");
    expect(reach(remove!)).toBeGreaterThanOrEqual(44);
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

  test("marcar o galho pula a folha travada", () => {
    expect(toggleAll([])).toEqual(["pagar"]);
  });

  test("desmarcar o galho preserva a folha travada que ja estava marcada", () => {
    expect(toggleAll(["travada", "pagar"])).toEqual(["travada"]);
    expect(toggleAll(["travada"])).toEqual(["travada", "pagar"]);
  });
});

describe("ColorPicker", () => {
  test("a amostra sai normalizada", () => {
    const onValueChange = mock((_: string) => {});
    const screen = render(
      <ColorPicker value="" onValueChange={onValueChange} swatches={["#F0A"]} />,
    );
    act(() => byLabel(screen, "Cor #F0A")[0]!.props.onPress());
    expect(onValueChange).toHaveBeenLastCalledWith("#ff00aa");
  });
});
