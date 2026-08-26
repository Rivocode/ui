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

          {/* O mesmo adaptador do DatePicker: o formato e o mesmo - vazio e
              `null`, e nao `undefined`. */}
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

/* O Button e o item da folha nao carregam accessibilityLabel: o nome deles e
   o Text de dentro, como no aparelho. */
const pressableWith = (screen: ReactTestRenderer, text: string) =>
  byRole(screen, "button").find(
    (node) =>
      node.findAll((child) => child.type === "Text" && child.props.children === text).length > 0,
  )!;

describe("Form e FormField", () => {
  test("o rotulo e a descricao saem do FormField, e o erro do schema vence a descricao", async () => {
    const screen = render(<Screen onSubmit={() => {}} />);

    expect(textOf(screen)).toContain("E-mail");
    expect(textOf(screen)).toContain("Para onde vai a nota");

    await act(async () => pressableWith(screen, "Assinar").props.onPress());

    expect(textOf(screen)).toContain("E-mail inválido");
    // O Field nativo troca uma pela outra, e nao mostra as duas.
    expect(textOf(screen)).not.toContain("Para onde vai a nota");
  });

  test("nada envia sozinho: quem chama e o botao, com os valores ja convertidos", async () => {
    const onSubmit = mock(() => {});
    const screen = render(<Screen onSubmit={onSubmit} />);

    act(() => inputOf(screen).props.onChangeText("financeiro@clinica.com.br"));
    // O campo volta controlado pelo formulario, e nao pelo TextInput.
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

  test("o rotulo viaja no campo e vira o nome acessivel do TextInput", () => {
    const screen = render(<Screen onSubmit={() => {}} />);
    // No web quem liga o rotulo ao controle e o `for` do Field da Base UI.
    // Aqui nao ha `for` nem `id`: sem este fio o campo fica sem nome nenhum.
    expect(inputOf(screen).props.accessibilityLabel).toBe("E-mail");
  });

  test("o invalid acende a borda do campo junto com a mensagem", async () => {
    const screen = render(<Screen onSubmit={() => {}} />);
    expect(inputOf(screen).props.className).not.toContain("border-danger");

    await act(async () => pressableWith(screen, "Assinar").props.onPress());
    expect(inputOf(screen).props.className).toContain("border-danger");
  });
});

describe("os adaptadores", () => {
  /* O campo cru do React Hook Form, do jeito que o Controller o entrega. */
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

  test("forText entrega string e onChangeText, e nunca undefined", () => {
    const vazio = forText(row(undefined) as never);
    // Um TextInput que recebe value={undefined} vira nao-controlado no meio
    // do caminho, e para de responder ao reset() do formulario.
    expect(vazio.value).toBe("");

    const campo = row("olá");
    const props = forText(campo as never);
    expect(props.value).toBe("olá");
    expect(props.accessibilityLabel).toBe("Campo");
    // O ref segue em frente: e por ele que o form.setFocus() acha o campo.
    expect(props.ref).toBe(campo.ref);

    props.onChangeText("outro");
    expect(campo.onChange).toHaveBeenCalledWith("outro");
  });

  test("forValue mantem o tipo do schema e troca o nome do callback", () => {
    const campo = row(["pdf", "xml"]);
    const props = forValue(campo as never);

    expect(props.value).toEqual(["pdf", "xml"]);
    (props.onValueChange as (next: string[]) => void)(["pdf"]);
    expect(campo.onChange).toHaveBeenCalledWith(["pdf"]);
  });

  test("forChecked vira checked, e o vazio conta como desmarcado", () => {
    expect(forChecked(row(undefined) as never).checked).toBe(false);

    const campo = row(true);
    const props = forChecked(campo as never);
    expect(props.checked).toBe(true);

    props.onCheckedChange(false);
    expect(campo.onChange).toHaveBeenCalledWith(false);
  });

  test("forDate troca undefined por null, que e o vazio dos dois pickers", () => {
    expect(forDate(row(undefined) as never).value).toBe(null);
    expect(forDate(row("2026-08-20") as never).value).toBe("2026-08-20");
  });
});
