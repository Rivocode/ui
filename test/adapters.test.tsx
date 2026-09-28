import { expect, test } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Form, FormField, useZodForm, forChecked, forValue } from "../src/form";
import { Switch } from "../src/components/switch";
import { RadioGroup, Radio } from "../src/components/radio";
import { CurrencyInput } from "../src/components/currency-input";
import { TimeField } from "../src/components/time-field";

/*
 * Os adaptadores tinham nome de componente, e o que eles traduzem e formato:
 * forCheckbox serve tudo que tem checked/onCheckedChange - o Switch, sem uma
 * linha de mudanca - e forSelect serve tudo que tem value/onValueChange, que e
 * RadioGroup, ToggleGroup, NumberField, Slider e OTPField. O nome fazia a API
 * parecer menor do que e, e mandava procurar um forSwitch que nao existe.
 */

const schema = z.object({ avisar: z.boolean(), forma: z.string() });

function InvoiceForm() {
  const form = useZodForm(schema, { defaultValues: { avisar: true, forma: "pix" } });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="avisar" label="Avisar por email">
          {(field) => <Switch {...forChecked(field)} />}
        </FormField>

        <FormField name="forma" label="Forma de pagamento">
          {(field) => (
            <RadioGroup {...forValue(field)}>
              <Radio value="pix">Pix</Radio>
              <Radio value="boleto">Boleto</Radio>
            </RadioGroup>
          )}
        </FormField>
      </Form>
    </RivoProvider>
  );
}

test("o adaptador de marcado veste a chave, e nao so a caixa", () => {
  render(<InvoiceForm />);

  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});

test("o adaptador de valor veste o grupo de escolha unica", () => {
  const { container } = render(<InvoiceForm />);

  const marked = [...container.querySelectorAll('[role="radio"][data-checked]')];
  expect(marked.length).toBe(1);
  // O marcado e o do schema, e nao o primeiro da lista por acaso.
  expect(marked[0]!.closest("label")!.textContent).toContain("Pix");
});

test("o indice do form expoe so os tres adaptadores de formato", async () => {
  const exported = Object.keys(await import("../src/form")).filter((name) => name.startsWith("for"));

  expect(exported.sort()).toEqual(["forChecked", "forDate", "forValue"]);
});

const required = z.object({
  valor: z.number({ message: "Informe o valor" }),
  hora: z.string({ message: "Informe a hora" }).min(1, "Informe a hora"),
});

function RequiredForm({ first }: { first: "valor" | "hora" }) {
  const form = useZodForm(required, {
    defaultValues: {
      valor: first === "valor" ? (null as unknown as number) : 100,
      hora: first === "hora" ? "" : "08:00",
    },
  });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={() => {}}>
        <FormField name="valor" label="Valor">
          {(field) => <CurrencyInput {...forValue(field)} />}
        </FormField>
        <FormField name="hora" label="Hora">
          {(field) => <TimeField {...forValue(field)} />}
        </FormField>
        <button type="submit">Salvar</button>
      </Form>
    </RivoProvider>
  );
}

test("o adaptador de valor entrega a ref, e o formulario foca o campo com erro", async () => {
  render(<RequiredForm first="valor" />);
  await act(async () => fireEvent.click(screen.getByText("Salvar")));
  await waitFor(() => expect(screen.getByText("Informe o valor")).toBeTruthy());
  expect(document.activeElement).toBe(screen.getByLabelText("Valor"));
});

test("o campo de hora com erro tambem recebe o foco pelo adaptador de valor", async () => {
  render(<RequiredForm first="hora" />);
  await act(async () => fireEvent.click(screen.getByText("Salvar")));
  await waitFor(() => expect(screen.getByText("Informe a hora")).toBeTruthy());
  expect(document.activeElement).toBe(screen.getByLabelText("Hora"));
});
