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

describe("Field with validate", () => {
  test("in onBlur mode nothing validates before the field is first left", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    expect(field.errorShown()).toBe(false);
    field.blur();
    expect(textOf(field.screen)).toContain(MESSAGE);
    expect(field.input().props.className.split(" ")).toContain("border-danger");
  });

  test("validate receives the controlled value on leaving, and a valid value clears the error", () => {
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

  test("outside onChange, typing clears the error until the next validation, as on the web", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    field.blur();
    expect(field.errorShown()).toBe(true);
    field.type("anab");
    expect(field.errorShown()).toBe(false);
  });

  test("the default is onSubmit: leaving does not validate, the submit key does", () => {
    const field = mount(<Controlled validate={email} />);
    field.type("ana");
    field.blur();
    expect(field.errorShown()).toBe(false);
    field.send();
    expect(textOf(field.screen)).toContain(MESSAGE);
  });

  test("in onChange mode every keystroke validates", () => {
    const field = mount(<Controlled validate={email} validationMode="onChange" />);
    field.type("a");
    expect(field.errorShown()).toBe(true);
    field.type("a@b");
    expect(field.errorShown()).toBe(false);
  });

  test("an explicit error wins over validate", () => {
    const field = mount(
      <Controlled validate={email} validationMode="onBlur" error="E-mail já cadastrado." />,
    );
    field.type("ana");
    field.blur();
    expect(textOf(field.screen)).toContain("E-mail já cadastrado.");
    expect(textOf(field.screen)).not.toContain(MESSAGE);
  });

  test("the error is announced, sits in a live region and becomes the control's hint", () => {
    const field = mount(<Controlled validate={email} validationMode="onBlur" />);
    field.type("ana");
    field.blur();
    expect(spoken.announced).toContain(MESSAGE);
    const error = byClass(field.screen, /text-danger-text/)[0]!;
    expect(error.props.accessibilityLiveRegion).toBe("polite");
    expect(field.input().props.accessibilityHint).toBe(MESSAGE);
  });

  test("a hint written on the control is not replaced by the error", () => {
    const screen = render(
      <Field label="E-mail" error={MESSAGE}>
        <Input accessibilityHint="Usado para a nota" />
      </Field>,
    );
    expect(byType(screen, "TextInput")[0]!.props.accessibilityHint).toBe("Usado para a nota");
  });

  test("a list of messages appears in full", () => {
    const field = mount(
      <Controlled validationMode="onBlur" validate={() => ["Curto demais.", "Falta o @."]} />,
    );
    field.blur();
    expect(textOf(field.screen)).toContain("Curto demais.");
    expect(textOf(field.screen)).toContain("Falta o @.");
  });

  test("only the response of the last async call counts", async () => {
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

  test("a field without a controlled value also delivers what was typed", () => {
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

  test("without a controlled value, onChange mode validates on every keystroke", () => {
    const field = mount(
      <Field label="E-mail" validationMode="onChange" validate={email}>
        <Input />
      </Field>,
    );
    field.type("ana");
    expect(textOf(field.screen)).toContain(MESSAGE);
  });

  test("on leaving, the value the owner rewrote counts, not the raw keystroke", () => {
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

  test("Textarea and MaskedInput also talk to the Field", () => {
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

  test("PasswordInput also talks to the Field: it receives the text, lights up the frame and gets the hint", () => {
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

  test("CurrencyInput and PostalCodeField light up the border with the Field's error", () => {
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

describe("a control outside a Field", () => {
  test("stays as it was: no invented hint and no error border", () => {
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

  test("the control's explicit invalid wins over the Field's error, in both directions", () => {
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
  if (!target) throw new Error(`nothing to tap with "${text}"`);
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

describe("Autocomplete inside a Field", () => {
  test("in onBlur, closing the sheet through a suggestion is leaving: it validates the chosen value, once", () => {
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

  test("in onBlur, the backdrop and Concluir are also leaving, and a repeated close does not validate again", () => {
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

  test("in onSubmit, the backdrop does not validate; Concluir and the submit key do", () => {
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

  test("the closed field lights up the border and carries the error as a hint", () => {
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

  test("the sheet's text field does not become a second Field control", () => {
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

  test("an explicit invalid wins over the Field's error", () => {
    const screen = render(
      <City validate={() => REQUIRED} validationMode="onBlur" invalid={false} />,
    );
    const sheet = sheetOf(screen);
    sheet.open();
    sheet.backdrop();
    expect(textOf(screen)).toContain(REQUIRED);
    expect(sheet.classes()).not.toContain("border-danger");
  });

  test("outside a Field it stays as it was", () => {
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

describe("a sheet picker inside a Field", () => {
  for (const [name, control, option] of SINGLE) {
    test(`${name}: choosing closes the sheet and is the onBlur leave, and the trigger lights up with the hint`, () => {
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

    test(`${name}: the backdrop closes without validating in onSubmit, and validates once in onBlur`, () => {
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

    test(`${name}: outside a Field it stays as it was`, () => {
      const screen = render(<Wrapped control={control} outside />);
      const trigger = () => byLabel(screen, "Cliente")[0]!;
      act(() => trigger().props.onPress());
      press(screen, option);
      expect(String(trigger().props.className).split(" ")).toContain("border-border-strong");
      expect(trigger().props.accessibilityHint).toBeUndefined();
    });
  }

  test("the Concluir of the multiple-choice Select and Combobox is the submit", () => {
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
