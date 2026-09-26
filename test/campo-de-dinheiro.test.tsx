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

test("a digitacao entra pela direita, como a mascara de moeda, e sai em centavos", () => {
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

test("o R$ fica desenhado ao lado, fora do valor e fora do leitor de tela, e o teclado e o numerico", () => {
  const { input, prefix } = field();

  expect(prefix.textContent).toBe("R$");
  expect(input.getAttribute("inputmode")).toBe("numeric");
  expect(input.getAttribute("placeholder")).toBe("0,00");
  expect(input.value).toBe("");
});

test("apagar tudo devolve null, e nao zero", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 12 });

  expect(input.value).toBe("0,12");
  erase(input);
  expect(input.value).toBe("0,01");
  erase(input);
  expect(input.value).toBe("");
  expect(onValueChange).toHaveBeenLastCalledWith(null);
});

test("zero se digita, e apagar o zero esvazia o campo", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  typeKey(input, "0");
  expect(input.value).toBe("0,00");
  expect(onValueChange).toHaveBeenLastCalledWith(0);

  erase(input);
  expect(input.value).toBe("");
  expect(onValueChange).toHaveBeenLastCalledWith(null);
});

test("colar o valor escrito como a pessoa o ve substitui o campo, com o centavo no lugar", () => {
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

test("colar texto sem numero nao apaga o valor que estava", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 500 });

  paste(input, "sem valor");
  expect(input.value).toBe("5,00");
  expect(onValueChange).not.toHaveBeenCalled();
});

test("o que chega de uma vez sem evento de colar, como o preenchimento automatico, tambem e lido como valor", () => {
  const { input } = field();

  replaceWith(input, "R$ 1.234,56");
  expect(input.value).toBe("1.234,56");
});

test("no celular, a selecao de antes diz o que foi colado por cima", () => {
  const all = { start: 0, end: 8 };
  expect(readCurrencyInput("150", "1.234,50", false, all)).toEqual({ cents: 15000, minus: false });
  expect(readCurrencyInput("150", "1.234,50", false)).toEqual({ cents: 150, minus: false });
  expect(readCurrencyInput("1.999,56", "1.234,56", false, { start: 2, end: 5 })).toEqual({
    cents: 199956,
    minus: false,
  });
});

test("a leitura do colado entende milhar e centavo nos dois costumes", () => {
  expect(parseCurrencyText("R$ 1.234,56")).toBe(123456);
  expect(parseCurrencyText("1,234.56")).toBe(123456);
  expect(parseCurrencyText("1.234")).toBe(123400);
  expect(parseCurrencyText("0,5")).toBe(50);
  expect(parseCurrencyText("-R$ 10,00")).toBe(-1000);
  expect(parseCurrencyText("R$")).toBeNull();
});

test("colar no meio do que ja estava escrito le so o pedaco colado", () => {
  expect(readCurrencyInput("1,00R$ 5,00", "1,00", false)).toEqual({ cents: 500, minus: false });
});

test("sem allowNegative o sinal nao entra, nem digitado nem colado", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange, defaultValue: 500 });

  typeKey(input, "-");
  expect(input.value).toBe("5,00");

  paste(input, "-R$ 10,00");
  expect(input.value).toBe("10,00");
  expect(onValueChange).toHaveBeenLastCalledWith(1000);
});

test("com allowNegative o - poe o sinal, um segundo - tira, e o teclado deixa de ser o numerico", () => {
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

test("fora de min e max o campo se marca invalido, e o valor nao e corrigido sozinho", () => {
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

test("o campo vazio nao e invalido, mesmo com min: obrigatorio e assunto do formulario", () => {
  const { input } = field({ min: 1000 });
  expect(input.getAttribute("aria-invalid")).toBeNull();
});

test("controlado, o campo mostra o valor de fora e acompanha a troca", () => {
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

test("desabilitado, o campo nao edita e o R$ apaga junto", () => {
  const { input, prefix } = field({ disabled: true, defaultValue: 100 });

  expect(input.disabled).toBe(true);
  expect(tokens(prefix)).toContain("text-fg-disabled");
  expect(tokens(prefix)).not.toContain("text-fg-subtle");
});

test("com name, o formulario nativo recebe os centavos, e nao o texto pontuado", () => {
  const { container, input } = field({ name: "amount", defaultValue: 123456 });
  const hidden = container.querySelector("input[type='hidden']") as HTMLInputElement;

  expect(hidden.name).toBe("amount");
  expect(hidden.value).toBe("123456");
  expect(input.getAttribute("name")).not.toBe("amount");

  replaceWith(input, "");
  expect(hidden.value).toBe("");
});

test("para em doze digitos, e o valor nunca vira ponto flutuante", () => {
  const onValueChange = mock((_cents: number | null) => {});
  const { input } = field({ onValueChange });

  paste(input, "9999999999,99");
  typeKey(input, "9");
  expect(input.value).toBe("9.999.999.999,99");
  expect(onValueChange).toHaveBeenLastCalledWith(999999999999);
});

test("classNames alcanca o campo e o prefixo, e className veste a raiz", () => {
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

test("com o FormField e o forValue, o schema recebe centavos e o erro sai embaixo do campo", async () => {
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

test("desabilitado, o campo fica fora do formulario nativo, como qualquer campo desabilitado", () => {
  const { container } = render(
    <form>
      <CurrencyInput aria-label="Valor" name="amount" defaultValue={500} disabled />
    </form>,
  );
  const data = new FormData(container.querySelector("form")!);
  expect(data.has("amount")).toBe(false);
});

test("a ref do consumidor recebe o campo uma vez, e nao a cada render", () => {
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

test("o leitor de tela ouve que o numero e em reais, sem perder a descricao do Field", () => {
  const { input } = field({ "aria-describedby": "outra" });
  const ids = (input.getAttribute("aria-describedby") ?? "").split(" ");
  const said = ids.map((id) => document.getElementById(id)?.textContent);

  expect(said).toContain("em reais");
  expect(said).toContain("Em reais.");
  expect(ids).toContain("outra");
});

test("colar mais que doze digitos e recusado, e nao cortado em silencio", () => {
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

test("texto misturado ao numero e recusado, e parenteses de contabilidade sao o sinal", () => {
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

test("o que chega de uma vez sem colar, com texto que nao e valor, deixa o valor que estava", () => {
  expect(readCurrencyInput("sem valor", "5,00", false)).toEqual({ cents: 500, minus: false });
  expect(readCurrencyInput("R$ 10 - desconto 2", "-5,00", true)).toEqual({
    cents: -500,
    minus: false,
  });
});

test("dentro de Field com name, o formulario nativo recebe so os centavos, e nunca o texto pontuado", () => {
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

test("com allowNegative, o sinal digitado nao sobra quando o valor e zerado por fora", () => {
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
