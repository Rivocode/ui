import { describe, expect, mock, test } from "bun:test";
import type { ReactTestRenderer } from "react-test-renderer";
import { z } from "zod";

import { Button, Checkbox, DatePicker, DateRangePicker, Input, Select } from "../src";
import { Form, FormField, forChecked, forDate, forText, forValue, useZodForm } from "../src/form";
import { act, byLabel, byRole, byType, render, textOf } from "./helpers";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  plan: z.string().min(1, "Escolha um plano"),
  due: z.string().nullable(),
  period: z.object({ from: z.string(), to: z.string() }).nullable(),
  terms: z.boolean(),
});

const PLANS = [
  { label: "Mensal", value: "monthly" },
  { label: "Anual", value: "yearly" },
];

function Screen({ onSubmit }: { onSubmit: (values: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { email: "", plan: "", due: null, period: null, terms: false },
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      {({ submit, isSubmitting }) => (
        <>
          <FormField name="email" label="E-mail" description="Para onde vai a nota">
            {(row) => <Input {...forText(row)} />}
          </FormField>

          <FormField name="plan" label="Plano">
            {(row) => <Select {...forValue(row)} items={PLANS} label="Plano" />}
          </FormField>

          <FormField name="due" label="Vencimento">
            {(row) => <DatePicker {...forDate(row)} label="Vencimento" />}
          </FormField>

          {/* The same adapter as the DatePicker: the format is the same - empty
              is `null`, not `undefined`. */}
          <FormField name="period" label="Período">
            {(row) => <DateRangePicker {...forDate(row)} label="Período" />}
          </FormField>

          <FormField name="terms" label="Aceito os termos">
            {(row) => <Checkbox {...forChecked(row)} />}
          </FormField>

          <Button onPress={submit} loading={isSubmitting}>
            Assinar
          </Button>
        </>
      )}
    </Form>
  );
}

const inputOf = (screen: ReactTestRenderer) => byType(screen, "TextInput")[0];

/* The Button and the sheet item carry no accessibilityLabel: their name is
   the inner Text, as on the device. */
const pressableWith = (screen: ReactTestRenderer, text: string) =>
  byRole(screen, "button").find(
    (node) =>
      node.findAll((child) => child.type === "Text" && child.props.children === text).length > 0,
  )!;

describe("Form and FormField", () => {
  test("the label and the description come from FormField, and the schema error wins over the description", async () => {
    const screen = render(<Screen onSubmit={() => {}} />);

    expect(textOf(screen)).toContain("E-mail");
    expect(textOf(screen)).toContain("Para onde vai a nota");

    await act(async () => pressableWith(screen, "Assinar").props.onPress());

    expect(textOf(screen)).toContain("E-mail inválido");
    // The native Field swaps one for the other, and does not show both.
    expect(textOf(screen)).not.toContain("Para onde vai a nota");
  });

  test("nothing submits on its own: the button calls, with the values already converted", async () => {
    const onSubmit = mock(() => {});
    const screen = render(<Screen onSubmit={onSubmit} />);

    act(() => inputOf(screen).props.onChangeText("financeiro@clinica.com.br"));
    // The field comes back controlled by the form, not by the TextInput.
    expect(inputOf(screen).props.value).toBe("financeiro@clinica.com.br");

    act(() => byLabel(screen, "Plano")[0].props.onPress());
    act(() => pressableWith(screen, "Mensal").props.onPress());

    await act(async () => pressableWith(screen, "Assinar").props.onPress());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((onSubmit.mock.calls[0] as unknown[])[0]).toMatchObject({
      email: "financeiro@clinica.com.br",
      plan: "monthly",
      due: null,
      period: null,
      terms: false,
    });
  });

  test("the label travels in the field and becomes the TextInput's accessible name", () => {
    const screen = render(<Screen onSubmit={() => {}} />);
    // On the web, what ties the label to the control is the Base UI Field's `for`.
    // Here there is no `for` nor `id`: without this wire the field has no name at all.
    expect(inputOf(screen).props.accessibilityLabel).toBe("E-mail");
  });

  test("invalid lights up the field border together with the message", async () => {
    const screen = render(<Screen onSubmit={() => {}} />);
    expect(inputOf(screen).props.className).not.toContain("border-danger");

    await act(async () => pressableWith(screen, "Assinar").props.onPress());
    expect(inputOf(screen).props.className).toContain("border-danger");
  });
});

describe("the adapters", () => {
  /* The raw React Hook Form field, the way the Controller delivers it. */
  const row = <Value,>(value: Value) => ({
    name: "field" as const,
    value,
    onChange: mock(() => {}),
    onBlur: mock(() => {}),
    ref: mock(() => {}),
    disabled: undefined,
    accessibilityLabel: "Campo",
    invalid: false,
  });

  test("forText delivers a string and onChangeText, and never undefined", () => {
    const vazio = forText(row(undefined) as never);
    // A TextInput that receives value={undefined} becomes uncontrolled midway,
    // and stops responding to the form's reset().
    expect(vazio.value).toBe("");

    const campo = row("olá");
    const props = forText(campo as never);
    expect(props.value).toBe("olá");
    expect(props.accessibilityLabel).toBe("Campo");
    // The ref is passed along: it is how form.setFocus() finds the field.
    expect(props.ref).toBe(campo.ref);

    props.onChangeText("outro");
    expect(campo.onChange).toHaveBeenCalledWith("outro");
  });

  test("forValue keeps the schema type and renames the callback", () => {
    const campo = row(["pdf", "xml"]);
    const props = forValue(campo as never);

    expect(props.value).toEqual(["pdf", "xml"]);
    (props.onValueChange as (next: string[]) => void)(["pdf"]);
    expect(campo.onChange).toHaveBeenCalledWith(["pdf"]);
  });

  test("forChecked becomes checked, and empty counts as unchecked", () => {
    expect(forChecked(row(undefined) as never).checked).toBe(false);

    const campo = row(true);
    const props = forChecked(campo as never);
    expect(props.checked).toBe(true);

    props.onCheckedChange(false);
    expect(campo.onChange).toHaveBeenCalledWith(false);
  });

  test("forDate swaps undefined for null, which is the empty value of both pickers", () => {
    expect(forDate(row(undefined) as never).value).toBe(null);
    expect(forDate(row("2026-08-20") as never).value).toBe("2026-08-20");
  });
});
