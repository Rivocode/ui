import { beforeEach, describe, expect, test } from "bun:test";
import { useState } from "react";
import { AccessibilityInfo } from "react-native";

import {
  Autocomplete,
  Combobox,
  CurrencyInput,
  DatePicker,
  Field,
  Input,
  InputGroup,
  MaskedInput,
  PasswordInput,
  PostalCodeField,
  Select,
  type FieldProps,
} from "../src";
import { Textarea } from "../src/textarea";
import { act, byClass, byLabel, byRole, byType, render, textOf } from "./helpers";

const spoken = AccessibilityInfo as unknown as {
  announced: readonly string[];
  clearAnnouncements: () => void;
};

beforeEach(() => spoken.clearAnnouncements());

const MESSAGE = "Informe um e-mail válido.";
const email = (value: unknown) => (String(value).includes("@") ? null : MESSAGE);

function Controlled(props: Omit<FieldProps, "label" | "children">) {
  const [value, setValue] = useState("");
  return (
    <Field label="E-mail" {...props}>
      <Input value={value} onChangeText={setValue} />
    </Field>
  );
}

function mount(element: Parameters<typeof render>[0]) {
  const screen = render(element);
  const input = () => byType(screen, "TextInput")[0]!;
  return {
    screen,
    input,
    type: (text: string) => act(() => input().props.onChangeText(text)),
    blur: () => act(() => input().props.onBlur({})),
    send: () => act(() => input().props.onSubmitEditing({})),
    errorShown: () => byClass(screen, /text-danger-text/).length > 0,
  };
}

describe("Field com validate", () => {
  test("no modo onBlur nada valida antes da primeira saida do campo", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    expect(field.errorShown()).toBe(false);
    field.blur();
    expect(textOf(field.screen)).toContain(MESSAGE);
    expect(field.input().props.className.split(" ")).toContain("border-danger");
  });

  test("o validate recebe o valor controlado na saida, e o valor que serve apaga o erro", () => {
    const seen: unknown[] = [];
    const field = mount(
      <Controlled
        validationMode="onBlur"
        validate={(value) => {
          seen.push(value);
          return email(value);
        }}
      />,
    );
    field.type("ana");
    field.blur();
    expect(seen).toEqual(["ana"]);
    field.type("ana@rivo.com");
    field.blur();
    expect(seen).toEqual(["ana", "ana@rivo.com"]);
    expect(field.errorShown()).toBe(false);
  });

  test("fora do onChange, digitar apaga o erro ate a proxima validacao, como no web", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    field.blur();
    expect(field.errorShown()).toBe(true);
    field.type("anab");
    expect(field.errorShown()).toBe(false);
  });

  test("o padrao e onSubmit: a saida nao valida, a tecla de envio valida", () => {
    const field = mount(<Controlled validate={email} />);
    field.type("ana");
    field.blur();
    expect(field.errorShown()).toBe(false);
    field.send();
    expect(textOf(field.screen)).toContain(MESSAGE);
  });

  test("no modo onChange cada tecla valida", () => {
    const field = mount(<Controlled validate={email} validationMode="onChange" />);
    field.type("a");
    expect(field.errorShown()).toBe(true);
    field.type("a@b");
    expect(field.errorShown()).toBe(false);
  });

  test("o error explicito vence o validate", () => {
    const field = mount(
      <Controlled validate={email} validationMode="onBlur" error="E-mail já cadastrado." />,
    );
    field.type("ana");
    field.blur();
    expect(textOf(field.screen)).toContain("E-mail já cadastrado.");
    expect(textOf(field.screen)).not.toContain(MESSAGE);
  });

  test("o erro e anunciado, fica numa regiao viva e vira a dica do controle", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    field.blur();
    expect(spoken.announced).toContain(MESSAGE);
    const error = byClass(field.screen, /text-danger-text/)[0]!;
    expect(error.props.accessibilityLiveRegion).toBe("polite");
    expect(field.input().props.accessibilityHint).toBe(MESSAGE);
  });

  test("a dica escrita no controle nao e trocada pelo erro", () => {
    const screen = render(
      <Field label="E-mail" error={MESSAGE}>
        <Input accessibilityHint="Usado para a nota" />
      </Field>,
    );
    expect(byType(screen, "TextInput")[0]!.props.accessibilityHint).toBe("Usado para a nota");
  });

  test("uma lista de mensagens aparece inteira", () => {
    const field = mount(
      <Controlled validationMode="onBlur" validate={() => ["Curto demais.", "Falta o @."]} />,
    );
    field.blur();
    expect(textOf(field.screen)).toContain("Curto demais.");
    expect(textOf(field.screen)).toContain("Falta o @.");
  });

  test("so a resposta da ultima chamada assincrona vale", async () => {
    const pending: ((verdict: string | null) => void)[] = [];
    const field = mount(
      <Controlled
        validationMode="onBlur"
        validate={() => new Promise<string | null>((resolve) => pending.push(resolve))}
      />,
    );
    field.blur();
    field.blur();
    await act(async () => pending[1]!(null));
    await act(async () => pending[0]!("Antiga."));
    expect(textOf(field.screen)).not.toContain("Antiga.");
    field.blur();
    await act(async () => pending[2]!("Nova."));
    expect(textOf(field.screen)).toContain("Nova.");
  });

  test("o campo sem value controlado tambem entrega o que foi digitado", () => {
    const seen: unknown[] = [];
    const field = mount(
      <Field label="Nome" validationMode="onBlur" validate={(value) => void seen.push(value)}>
        <Input />
      </Field>,
    );
    field.type("Ana");
    field.blur();
    expect(seen).toEqual(["Ana"]);
  });

  test("sem value controlado, o modo onChange valida a cada tecla", () => {
    const field = mount(
      <Field label="E-mail" validationMode="onChange" validate={email}>
        <Input />
      </Field>,
    );
    field.type("ana");
    expect(textOf(field.screen)).toContain(MESSAGE);
  });

  test("na saida vale o value que o dono reescreveu, e nao a tecla crua", () => {
    const seen: unknown[] = [];
    function Trimmed() {
      const [value, setValue] = useState("");
      return (
        <Field label="Nome" validationMode="onBlur" validate={(v) => void seen.push(v)}>
          <Input value={value} onChangeText={(text) => setValue(text.trim())} />
        </Field>
      );
    }
    const field = mount(<Trimmed />);
    field.type("Ana ");
    field.blur();
    expect(seen).toEqual(["Ana"]);
  });

  test("o Textarea e o MaskedInput tambem falam com o Field", () => {
    const seen: unknown[] = [];
    const collect = (value: unknown) => {
      seen.push(value);
      return "Erro.";
    };
    const area = mount(
      <Field label="Obs" validationMode="onBlur" validate={collect}>
        <Textarea />
      </Field>,
    );
    area.type("oi");
    area.blur();
    expect(area.input().props.className.split(" ")).toContain("border-danger");

    function Masked() {
      const [value, setValue] = useState("");
      return (
        <Field label="CPF" validationMode="onBlur" validate={collect}>
          <MaskedInput mask="999.999.999-99" value={value} onValueChange={setValue} />
        </Field>
      );
    }
    const masked = mount(<Masked />);
    masked.type("123");
    masked.blur();
    expect(seen).toEqual(["oi", "123"]);
    expect(textOf(masked.screen)).toContain("Erro.");
  });

  test("o PasswordInput tambem fala com o Field: recebe o texto, acende a moldura e ganha a dica", () => {
    const seen: unknown[] = [];
    function Password() {
      const [value, setValue] = useState("");
      return (
        <Field
          label="Senha"
          validationMode="onBlur"
          validate={(v) => {
            seen.push(v);
            return "Curta demais.";
          }}
        >
          <PasswordInput value={value} onValueChange={setValue} />
        </Field>
      );
    }
    const field = mount(<Password />);
    field.type("abc");
    field.blur();
    expect(seen).toEqual(["abc"]);
    expect(field.input().props.accessibilityHint).toBe("Curta demais.");
    expect(byClass(field.screen, /border-danger/)).toHaveLength(1);
  });

  test("o CurrencyInput e o PostalCodeField acendem a borda com o erro do Field", () => {
    const noop = () => {};
    const money = render(
      <Field label="Valor" error="Informe o valor.">
        <CurrencyInput value={null} onValueChange={noop} />
      </Field>,
    );
    const moneyInput = byType(money, "TextInput")[0]!;
    expect(moneyInput.props.className.split(" ")).toContain("border-danger");
    expect(moneyInput.props.accessibilityHint).toBe("Informe o valor.");

    const cep = render(
      <Field label="CEP" error="Informe o CEP.">
        <PostalCodeField value="" onValueChange={noop} lookup={async () => null} />
      </Field>,
    );
    expect(byType(cep, "TextInput")[0]!.props.className.split(" ")).toContain("border-danger");
  });
});

describe("controle fora de um Field", () => {
  test("fica como era: sem dica inventada e sem borda de erro", () => {
    const noop = () => {};
    const screen = render(
      <>
        <Input />
        <Textarea />
        <InputGroup value="" onValueChange={noop} />
        <CurrencyInput value={null} onValueChange={noop} />
      </>,
    );
    const inputs = byType(screen, "TextInput");
    expect(inputs).toHaveLength(4);
    for (const input of inputs) expect(input.props.accessibilityHint).toBeUndefined();
    expect(byClass(screen, /border-danger/)).toHaveLength(0);
    expect(byClass(screen, /border-border-strong/).length).toBeGreaterThanOrEqual(4);
  });

  test("o invalid explicito do controle vence o erro do Field, nos dois sentidos", () => {
    const screen = render(
      <>
        <Field label="Com erro" error="Errado.">
          <Input invalid={false} />
        </Field>
        <Field label="Sem erro">
          <Input invalid />
        </Field>
      </>,
    );
    const [calm, flagged] = byType(screen, "TextInput");
    expect(calm!.props.className.split(" ")).not.toContain("border-danger");
    expect(flagged!.props.className.split(" ")).toContain("border-danger");
  });
});

type FieldValidationMode = NonNullable<FieldProps["validationMode"]>;

function press(screen: ReturnType<typeof render>, text: string) {
  const target = screen.root.findAll(
    (node) =>
      typeof node.type === "string" &&
      typeof node.props.onPress === "function" &&
      (node.props.accessibilityLabel === text ||
        node.findAll((child) => child.props.children === text).length > 0),
  )[0];
  if (!target) throw new Error(`nada para tocar com "${text}"`);
  act(() => target.props.onPress());
}

const CITIES = ["João Pessoa", "Campina Grande", "Cabedelo"];
const REQUIRED = "Escolha uma cidade.";

function counting(verdict: (value: unknown) => string | null) {
  const seen: unknown[] = [];
  return {
    seen,
    validate: (value: unknown) => {
      seen.push(value);
      return verdict(value);
    },
  };
}

function City({
  validate,
  validationMode,
  invalid,
}: {
  validate: FieldProps["validate"];
  validationMode?: FieldValidationMode;
  invalid?: boolean;
}) {
  const [value, setValue] = useState("");
  return (
    <Field label="Cidade" validate={validate} validationMode={validationMode}>
      <Autocomplete
        items={CITIES}
        label="Cidade"
        value={value}
        onValueChange={setValue}
        invalid={invalid}
      />
    </Field>
  );
}

function sheetOf(screen: ReturnType<typeof render>) {
  const trigger = () => byRole(screen, "combobox")[0]!;
  const input = () => byType(screen, "TextInput")[0]!;
  const button = (text: string) =>
    byRole(screen, "button").find(
      (node) => node.findAll((child) => child.props.children === text).length > 0,
    )!;
  return {
    trigger,
    input,
    open: () => act(() => trigger().props.onPress()),
    type: (text: string) => act(() => input().props.onChangeText(text)),
    pick: (text: string) => press(screen, text),
    done: () => act(() => button("Concluir").props.onPress()),
    keyboardDone: () => act(() => input().props.onSubmitEditing({})),
    backdrop: () => act(() => byLabel(screen, "Fechar")[0]!.props.onPress()),
    twice: () => {
      const dismiss = byLabel(screen, "Fechar")[0]!.props.onPress;
      act(() => dismiss());
      act(() => dismiss());
      act(() => trigger().props.onPress());
      act(() => byLabel(screen, "Fechar")[0]!.props.onPress());
    },
    classes: () => String(trigger().props.className).split(" "),
  };
}

describe("Autocomplete dentro de um Field", () => {
  test("no onBlur, fechar a folha pela sugestao e a saida: valida o valor escolhido, uma vez", () => {
    const check = counting((value) => (value === "Cabedelo" ? "Fora da área." : null));
    const screen = render(<City validate={check.validate} validationMode="onBlur" />);
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.type("cab");
    act(() => sheet.input().props.onBlur({}));
    expect(check.seen).toEqual([]);
    sheet.pick("Cabedelo");
    expect(check.seen).toEqual(["Cabedelo"]);
    expect(textOf(screen)).toContain("Fora da área.");
  });

  test("no onBlur, o fundo e o Concluir tambem sao saida, e o fechar repetido nao valida de novo", () => {
    const check = counting(() => REQUIRED);
    const screen = render(<City validate={check.validate} validationMode="onBlur" />);
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.twice();
    expect(check.seen).toEqual(["", ""]);
    sheet.open();
    sheet.type("Patos");
    sheet.done();
    expect(check.seen).toEqual(["", "", "Patos"]);
  });

  test("no onSubmit, o fundo nao valida; o Concluir e a tecla de envio validam", () => {
    const check = counting(() => REQUIRED);
    const screen = render(<City validate={check.validate} />);
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.type("Sousa");
    sheet.backdrop();
    expect(check.seen).toEqual([]);
    sheet.open();
    sheet.done();
    expect(check.seen).toEqual(["Sousa"]);
    sheet.open();
    sheet.keyboardDone();
    expect(check.seen).toEqual(["Sousa", "Sousa"]);
  });

  test("o campo fechado acende a borda e leva o erro como dica", () => {
    const screen = render(<City validate={() => REQUIRED} validationMode="onBlur" />);
    const sheet = sheetOf(screen);
    expect(sheet.classes()).toContain("border-border-strong");
    expect(sheet.trigger().props.accessibilityHint).toBe("Abre o campo com sugestões.");
    sheet.open();
    sheet.backdrop();
    expect(sheet.classes()).toContain("border-danger");
    expect(sheet.classes()).not.toContain("border-border-strong");
    expect(sheet.trigger().props.accessibilityHint).toBe(REQUIRED);
  });

  test("o campo de texto da folha nao vira um segundo controle do Field", () => {
    const check = counting(() => null);
    const screen = render(<City validate={check.validate} validationMode="onChange" />);
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.type("J");
    sheet.type("Jo");
    expect(check.seen).toEqual(["J", "Jo"]);
    act(() => sheet.input().props.onBlur({}));
    expect(check.seen).toEqual(["J", "Jo"]);
  });

  test("o invalid explicito vence o erro do Field", () => {
    const screen = render(
      <City validate={() => REQUIRED} validationMode="onBlur" invalid={false} />,
    );
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.backdrop();
    expect(textOf(screen)).toContain(REQUIRED);
    expect(sheet.classes()).not.toContain("border-danger");
  });

  test("fora de um Field fica como era", () => {
    function Loose() {
      const [value, setValue] = useState("");
      return <Autocomplete items={CITIES} label="Cidade" value={value} onValueChange={setValue} />;
    }
    const screen = render(<Loose />);
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.type("x");
    sheet.done();
    expect(sheet.classes()).toContain("border-border-strong");
    expect(sheet.trigger().props.accessibilityHint).toBe("Abre o campo com sugestões.");
    expect(byClass(screen, /border-danger/)).toHaveLength(0);
  });
});

const CLIENTS = [
  { label: "Ana", value: "ana" },
  { label: "Bia", value: "bia" },
];

type Picked = { value: unknown; setValue: (value: never) => void };

const SINGLE: [string, (state: Picked) => ReturnType<typeof Select>, string][] = [
  [
    "Select",
    ({ value, setValue }) => (
      <Select
        items={CLIENTS}
        label="Cliente"
        value={value as string | null}
        onValueChange={setValue}
      />
    ),
    "Bia",
  ],
  [
    "Combobox",
    ({ value, setValue }) => (
      <Combobox
        items={CLIENTS}
        label="Cliente"
        value={value as string | null}
        onValueChange={setValue}
      />
    ),
    "Bia",
  ],
  [
    "DatePicker",
    ({ value, setValue }) => (
      <DatePicker
        label="Cliente"
        value={(value as string | null) ?? "2026-08-10"}
        onValueChange={setValue}
      />
    ),
    "15/08/2026",
  ],
];

function Wrapped({
  control,
  validate,
  validationMode,
  outside,
}: {
  control: (state: Picked) => ReturnType<typeof Select>;
  validate?: FieldProps["validate"];
  validationMode?: FieldValidationMode;
  outside?: boolean;
}) {
  const [value, setValue] = useState<unknown>(null);
  const inner = control({ value, setValue: setValue as (value: never) => void });
  if (outside) return inner;
  return (
    <Field label="Rótulo" validate={validate} validationMode={validationMode}>
      {inner}
    </Field>
  );
}

describe("seletor de folha dentro de um Field", () => {
  for (const [name, control, option] of SINGLE) {
    test(`${name}: escolher fecha a folha e e a saida do onBlur, e o gatilho acende com a dica`, () => {
      const check = counting(() => REQUIRED);
      const screen = render(
        <Wrapped control={control} validate={check.validate} validationMode="onBlur" />,
      );
      const trigger = () => byLabel(screen, "Cliente")[0]!;
      expect(String(trigger().props.className).split(" ")).toContain("border-border-strong");
      expect(trigger().props.accessibilityHint).toBeUndefined();
      act(() => trigger().props.onPress());
      press(screen, option);
      expect(check.seen).toEqual([name === "DatePicker" ? "2026-08-15" : "bia"]);
      expect(String(trigger().props.className).split(" ")).toContain("border-danger");
      expect(trigger().props.accessibilityHint).toBe(REQUIRED);
    });

    test(`${name}: o fundo fecha sem validar no onSubmit, e valida uma vez no onBlur`, () => {
      const lazy = counting(() => REQUIRED);
      const screen = render(<Wrapped control={control} validate={lazy.validate} />);
      act(() => byLabel(screen, "Cliente")[0]!.props.onPress());
      act(() => byLabel(screen, "Fechar")[0]!.props.onPress());
      expect(lazy.seen).toEqual([]);

      const eager = counting(() => REQUIRED);
      const other = render(
        <Wrapped control={control} validate={eager.validate} validationMode="onBlur" />,
      );
      act(() => byLabel(other, "Cliente")[0]!.props.onPress());
      const dismiss = byLabel(other, "Fechar")[0]!.props.onPress;
      act(() => dismiss());
      act(() => dismiss());
      expect(eager.seen).toHaveLength(1);
      act(() => byLabel(other, "Cliente")[0]!.props.onPress());
      expect(eager.seen).toHaveLength(1);
    });

    test(`${name}: fora de um Field fica como era`, () => {
      const screen = render(<Wrapped control={control} outside />);
      const trigger = () => byLabel(screen, "Cliente")[0]!;
      act(() => trigger().props.onPress());
      press(screen, option);
      expect(String(trigger().props.className).split(" ")).toContain("border-border-strong");
      expect(trigger().props.accessibilityHint).toBeUndefined();
    });
  }

  test("o Concluir do Select e do Combobox de escolha multipla e o envio", () => {
    for (const Picker of [Select, Combobox]) {
      const check = counting(() => REQUIRED);
      function Many() {
        const [value, setValue] = useState<string[]>([]);
        return (
          <Field label="Clientes" validate={check.validate}>
            <Picker
              items={CLIENTS}
              label="Clientes"
              multiple
              value={value}
              onValueChange={setValue}
            />
          </Field>
        );
      }
      const screen = render(<Many />);
      act(() => byLabel(screen, "Clientes")[0]!.props.onPress());
      press(screen, "Ana");
      press(screen, "Bia");
      expect(check.seen).toEqual([]);
      press(screen, "Concluir");
      expect(check.seen).toEqual([["ana", "bia"]]);
    }
  });
});
