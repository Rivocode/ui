import { expect, mock, test } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { z } from "zod";

import { CurrencyInput, type CurrencyInputProps } from "../src/components/currency-input";
import { Field, FieldDescription, FieldLabel } from "../src/components/field";
import { Form } from "../src/form/form";
import { FormField } from "../src/form/form-field";
import { forValue } from "../src/form/adapters";
import { useZodForm } from "../src/form/use-zod-form";
import { RivoProvider } from "../src/provider/rivo-provider";
import { parseCurrencyText, readCurrencyInput } from "../src/shared/currency";

function field(props: Partial<CurrencyInputProps> = {}) {
  const view = render(
    <RivoProvider scope="local">
      <Field>
        <FieldLabel>Valor</FieldLabel>
        <CurrencyInput {...props} />
        <FieldDescription>Em reais.</FieldDescription>
      </Field>
    </RivoProvider>,
  );
  const input = screen.getByLabelText("Valor") as HTMLInputElement;
  const prefix = view.container.querySelector("[aria-hidden='true']") as HTMLElement;
  return { ...view, input, prefix };
}

const typeKey = (input: HTMLInputElement, key: string) =>
  fireEvent.change(input, { target: { value: input.value + key } });

const erase = (input: HTMLInputElement) =>
  fireEvent.change(input, { target: { value: input.value.slice(0, -1) } });

const replaceWith = (input: HTMLInputElement, text: string) =>
  fireEvent.change(input, { target: { value: text } });

const paste = (input: HTMLInputElement, text: string) =>
  fireEvent.paste(input, { clipboardData: { getData: () => text } });

const tokens = (element: Element) => element.className.split(" ");

test("typing enters from the right, like the currency mask, and comes out in cents", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  typeKey(input, "1");
  expect(input.value).toBe("0,01");
  expect(onValueChange).toHaveBeenLastCalledWith(1);

  typeKey(input, "2");
  typeKey(input, "3");
  typeKey(input, "4");
  typeKey(input, "5");
  typeKey(input, "6");
  expect(input.value).toBe("1.234,56");
  expect(onValueChange).toHaveBeenLastCalledWith(123456);
});

test("the R$ is drawn alongside, outside the value and outside the screen reader, and the keyboard is numeric", () => {
  const { input, prefix } = field();

  expect(prefix.textContent).toBe("R$");
  expect(input.getAttribute("inputmode")).toBe("numeric");
  expect(input.getAttribute("placeholder")).toBe("0,00");
  expect(input.value).toBe("");
});

test("erasing everything returns null, and not zero", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 12 });

  expect(input.value).toBe("0,12");
  erase(input);
  expect(input.value).toBe("0,01");
  erase(input);
  expect(input.value).toBe("");
  expect(onValueChange).toHaveBeenLastCalledWith(null);
});

test("zero can be typed, and erasing the zero empties the field", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  typeKey(input, "0");
  expect(input.value).toBe("0,00");
  expect(onValueChange).toHaveBeenLastCalledWith(0);

  erase(input);
  expect(input.value).toBe("");
  expect(onValueChange).toHaveBeenLastCalledWith(null);
});

test("pasting the value written the way the person sees it replaces the field, with the cents in place", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  paste(input, "R$ 1.234,56");
  expect(input.value).toBe("1.234,56");
  expect(onValueChange).toHaveBeenLastCalledWith(123456);

  paste(input, "1234.5");
  expect(input.value).toBe("1.234,50");

  paste(input, "150");
  expect(input.value).toBe("150,00");
  expect(onValueChange).toHaveBeenLastCalledWith(15000);
});

test("pasting text without a number does not erase the existing value", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 500 });

  paste(input, "sem valor");
  expect(input.value).toBe("5,00");
  expect(onValueChange).not.toHaveBeenCalled();
});

test("what arrives all at once without a paste event, like autofill, is also read as a value", () => {
  const { input } = field();

  replaceWith(input, "R$ 1.234,56");
  expect(input.value).toBe("1.234,56");
});

test("on mobile, the previous selection tells what was pasted over", () => {
  const all = { start: 0, end: 8 };
  expect(readCurrencyInput("150", "1.234,50", false, all)).toEqual({ cents: 15000, minus: false });
  expect(readCurrencyInput("150", "1.234,50", false)).toEqual({ cents: 150, minus: false });
  expect(readCurrencyInput("1.999,56", "1.234,56", false, { start: 2, end: 5 })).toEqual({
    cents: 199956,
    minus: false,
  });
});

test("reading the pasted text understands thousands and cents in both conventions", () => {
  expect(parseCurrencyText("R$ 1.234,56")).toBe(123456);
  expect(parseCurrencyText("1,234.56")).toBe(123456);
  expect(parseCurrencyText("1.234")).toBe(123400);
  expect(parseCurrencyText("0,5")).toBe(50);
  expect(parseCurrencyText("-R$ 10,00")).toBe(-1000);
  expect(parseCurrencyText("R$")).toBeNull();
});

test("pasting in the middle of what was already written reads only the pasted piece", () => {
  expect(readCurrencyInput("1,00R$ 5,00", "1,00", false)).toEqual({ cents: 500, minus: false });
});

test("without allowNegative the sign does not get in, neither typed nor pasted", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 500 });

  typeKey(input, "-");
  expect(input.value).toBe("5,00");

  paste(input, "-R$ 10,00");
  expect(input.value).toBe("10,00");
  expect(onValueChange).toHaveBeenLastCalledWith(1000);
});

test("with allowNegative the - adds the sign, a second - removes it, and the keyboard stops being numeric", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, allowNegative: true });

  expect(input.getAttribute("inputmode")).toBe("text");

  typeKey(input, "-");
  expect(input.value).toBe("-");
  expect(onValueChange).not.toHaveBeenCalled();

  typeKey(input, "5");
  expect(input.value).toBe("-0,05");
  expect(onValueChange).toHaveBeenLastCalledWith(-5);

  typeKey(input, "-");
  expect(input.value).toBe("0,05");
  expect(onValueChange).toHaveBeenLastCalledWith(5);

  paste(input, "-R$ 1.234,56");
  expect(input.value).toBe("-1.234,56");
  expect(onValueChange).toHaveBeenLastCalledWith(-123456);
});

test("outside min and max the field marks itself invalid, and the value is not corrected on its own", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, min: 1000, max: 50000 });

  paste(input, "5,00");
  expect(input.value).toBe("5,00");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(onValueChange).toHaveBeenLastCalledWith(500);

  paste(input, "100,00");
  expect(input.getAttribute("aria-invalid")).toBeNull();

  paste(input, "600,00");
  expect(input.value).toBe("600,00");
  expect(input.getAttribute("aria-invalid")).toBe("true");
});

test("the empty field is not invalid, even with min: required is the form's business", () => {
  const { input } = field({ min: 1000 });
  expect(input.getAttribute("aria-invalid")).toBeNull();
});

test("when controlled, the field shows the outside value and follows the change", () => {
  function Controlled() {
    const [cents, setCents] = useState<number | null>(123456);
    return (
      <>
        <CurrencyInput aria-label="Total" value={cents} onValueChange={setCents} />
        <button type="button" onClick={() => setCents(99)}>
          Trocar
        </button>
        <output>{String(cents)}</output>
      </>
    );
  }

  render(<Controlled />);
  const input = screen.getByLabelText("Total") as HTMLInputElement;
  expect(input.value).toBe("1.234,56");

  typeKey(input, "7");
  expect(input.value).toBe("12.345,67");
  expect(screen.getByRole("status").textContent).toBe("1234567");

  fireEvent.click(screen.getByText("Trocar"));
  expect(input.value).toBe("0,99");
});

test("when disabled, the field does not edit and the R$ dims along", () => {
  const { input, prefix } = field({ disabled: true, defaultValue: 100 });

  expect(input.disabled).toBe(true);
  expect(tokens(prefix)).toContain("text-fg-disabled");
  expect(tokens(prefix)).not.toContain("text-fg-subtle");
});

test("with name, the native form receives the cents, and not the punctuated text", () => {
  const { container, input } = field({ name: "amount", defaultValue: 123456 });
  const hidden = container.querySelector("input[type='hidden']") as HTMLInputElement;

  expect(hidden.name).toBe("amount");
  expect(hidden.value).toBe("123456");
  expect(input.getAttribute("name")).not.toBe("amount");

  replaceWith(input, "");
  expect(hidden.value).toBe("");
});

test("stops at twelve digits, and the value never becomes floating point", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  paste(input, "9999999999,99");
  typeKey(input, "9");
  expect(input.value).toBe("9.999.999.999,99");
  expect(onValueChange).toHaveBeenLastCalledWith(999999999999);
});

test("classNames reaches the field and the prefix, and className dresses the root", () => {
  const { input, prefix } = field({
    className: "raiz-teste",
    classNames: { input: "campo-teste", prefix: "prefixo-teste" },
  });

  expect(tokens(input)).toContain("campo-teste");
  expect(tokens(prefix)).toContain("prefixo-teste");
  expect(tokens(input.parentElement!)).toContain("raiz-teste");
});

const schema = z.object({
  amount: z
    .number({ message: "Informe o valor" })
    .int()
    .min(100, "O mínimo é R$ 1,00"),
});

function Charge({ onSubmit }: { onSubmit: (data: { amount: number }) => void }) {
  const form = useZodForm(schema, { defaultValues: { amount: null as unknown as number } });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={onSubmit}>
        <FormField name="amount" label="Valor da cobrança">
          {(row) => <CurrencyInput {...forValue(row)} onBlur={row.onBlur} />}
        </FormField>
        <button type="submit">Cobrar</button>
      </Form>
    </RivoProvider>
  );
}

test("with FormField and forValue, the schema receives cents and the error shows below the field", async () => {
  const onSubmit = mock((_data: { amount: number }) => {});
  render(<Charge onSubmit={onSubmit} />);
  const input = screen.getByLabelText("Valor da cobrança") as HTMLInputElement;

  await act(async () => paste(input, "0,50"));
  await act(async () => fireEvent.click(screen.getByText("Cobrar")));
  await waitFor(() => expect(screen.getByText("O mínimo é R$ 1,00")).toBeTruthy());
  expect(onSubmit).not.toHaveBeenCalled();

  await act(async () => paste(input, "R$ 1.234,56"));
  await act(async () => fireEvent.click(screen.getByText("Cobrar")));
  await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(onSubmit.mock.calls[0]![0]).toEqual({ amount: 123456 });
});

test("when disabled, the field stays out of the native form, like any disabled field", () => {
  const { container } = render(
    <form>
      <CurrencyInput aria-label="Valor" name="amount" defaultValue={500} disabled />
    </form>,
  );
  const data = new FormData(container.querySelector("form")!);
  expect(data.has("amount")).toBe(false);
});

test("the consumer ref receives the field once, and not on every render", () => {
  const calls: (HTMLInputElement | null)[] = [];
  const ref = (node: HTMLInputElement | null) => {
    calls.push(node);
  };
  const { rerender } = render(<CurrencyInput aria-label="Valor" ref={ref} defaultValue={1} />);
  rerender(<CurrencyInput aria-label="Valor" ref={ref} defaultValue={1} placeholder="a" />);
  rerender(<CurrencyInput aria-label="Valor" ref={ref} defaultValue={1} placeholder="b" />);
  expect(calls).toHaveLength(1);
  expect(calls[0]).toBeInstanceOf(HTMLInputElement);
});

test("the screen reader hears that the number is in reais, without losing the Field description", () => {
  const { input } = field({ "aria-describedby": "outra" });
  const ids = (input.getAttribute("aria-describedby") ?? "").split(" ");
  const said = ids.map((id) => document.getElementById(id)?.textContent);

  expect(said).toContain("em reais");
  expect(said).toContain("Em reais.");
  expect(ids).toContain("outra");
});

test("pasting more than twelve digits is refused, and not silently truncated", () => {
  expect(parseCurrencyText("1234567890123,45")).toBeNull();
  expect(parseCurrencyText("R$ 12.345.678.901,23")).toBeNull();
  expect(parseCurrencyText("9.999.999.999,99")).toBe(999999999999);
  expect(parseCurrencyText("0000001,00")).toBe(100);

  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 500 });
  paste(input, "1234567890123,45");
  expect(input.value).toBe("5,00");
  expect(onValueChange).not.toHaveBeenCalled();

  replaceWith(input, "1234567890123,45");
  expect(input.value).toBe("5,00");
});

test("text mixed with the number is refused, and accounting parentheses are the sign", () => {
  expect(parseCurrencyText("R$ 10 - desconto 2")).toBeNull();
  expect(parseCurrencyText("10 reais e 2 centavos")).toBeNull();
  expect(parseCurrencyText("Total: R$ 10,00")).toBeNull();
  expect(parseCurrencyText("10,00 e 20,00")).toBeNull();
  expect(parseCurrencyText("--10,00")).toBeNull();
  expect(parseCurrencyText("(10,00")).toBeNull();

  expect(parseCurrencyText("(10,00)")).toBe(-1000);
  expect(parseCurrencyText("(R$ 10,00)")).toBe(-1000);
  expect(parseCurrencyText("10,00 -")).toBe(-1000);
  expect(parseCurrencyText("R$ -10,00")).toBe(-1000);
  expect(parseCurrencyText("R$ 1.234,56")).toBe(123456);
  expect(parseCurrencyText("r$ 1 234,56")).toBe(123456);
});

test("what arrives all at once without pasting, with text that is not a value, keeps the existing value", () => {
  expect(readCurrencyInput("sem valor", "5,00", false)).toEqual({ cents: 500, minus: false });
  expect(readCurrencyInput("R$ 10 - desconto 2", "-5,00", true)).toEqual({
    cents: -500,
    minus: false,
  });
});

test("inside a Field with name, the native form receives only the cents, and never the punctuated text", () => {
  const { container } = render(
    <form>
      <Field name="preco">
        <FieldLabel>Preço</FieldLabel>
        <CurrencyInput name="preco" defaultValue={123456} />
      </Field>
      <Field name="frete">
        <FieldLabel>Frete</FieldLabel>
        <CurrencyInput defaultValue={990} />
      </Field>
    </form>,
  );
  const data = new FormData(container.querySelector("form")!);
  expect(data.getAll("preco")).toEqual(["123456"]);
  expect(data.getAll("frete")).toEqual(["990"]);
  expect((screen.getByLabelText("Preço") as HTMLInputElement).hasAttribute("name")).toBe(false);
});

test("with allowNegative, the typed sign does not linger when the value is zeroed from outside", () => {
  function Controlled() {
    const [cents, setCents] = useState<number | null>(null);
    return (
      <RivoProvider scope="local">
        <CurrencyInput aria-label="Valor" allowNegative value={cents} onValueChange={setCents} />
        <button onClick={() => setCents(null)}>Limpar</button>
      </RivoProvider>
    );
  }
  render(<Controlled />);
  const input = screen.getByLabelText("Valor") as HTMLInputElement;

  typeKey(input, "-");
  typeKey(input, "5");
  expect(input.value).toBe("-0,05");

  fireEvent.click(screen.getByText("Limpar"));
  expect(input.value).toBe("");

  typeKey(input, "7");
  expect(input.value).toBe("0,07");
});

test("a lone minus sign disappears when the field loses focus, even without the value changing from outside", () => {
  render(<CurrencyInput aria-label="Ajuste" allowNegative value={null} onValueChange={() => {}} />);
  const input = screen.getByLabelText("Ajuste") as HTMLInputElement;

  fireEvent.change(input, { target: { value: "-" } });
  expect(input.value).toBe("-");

  fireEvent.blur(input);
  expect(input.value).toBe("");
});
