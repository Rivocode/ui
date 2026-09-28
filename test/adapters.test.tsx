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
 * The adapters were named after components, and what they translate is shape:
 * forCheckbox serves anything with checked/onCheckedChange - the Switch, without
 * a line of change - and forSelect serves anything with value/onValueChange,
 * which is RadioGroup, ToggleGroup, NumberField, Slider and OTPField. The name
 * made the API look smaller than it is, and sent people looking for a forSwitch
 * that does not exist.
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

test("the checked adapter dresses the switch, and not only the checkbox", () => {
  render(<InvoiceForm />);

  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});

test("the value adapter dresses the single-choice group", () => {
  const { container } = render(<InvoiceForm />);

  const marked = [...container.querySelectorAll('[role="radio"][data-checked]')];
  expect(marked.length).toBe(1);
  // The checked one is the schema's, and not the first in the list by chance.
  expect(marked[0]!.closest("label")!.textContent).toContain("Pix");
});

test("the form index exposes only the three shape adapters", async () => {
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

test("the value adapter hands over the ref, and the form focuses the field with the error", async () => {
  render(<RequiredForm first="valor" />);
  await act(async () => fireEvent.click(screen.getByText("Salvar")));
  await waitFor(() => expect(screen.getByText("Informe o valor")).toBeTruthy());
  expect(document.activeElement).toBe(screen.getByLabelText("Valor"));
});

test("the time field with an error also receives focus through the value adapter", async () => {
  render(<RequiredForm first="hora" />);
  await act(async () => fireEvent.click(screen.getByText("Salvar")));
  await waitFor(() => expect(screen.getByText("Informe a hora")).toBeTruthy());
  expect(document.activeElement).toBe(screen.getByLabelText("Hora"));
});
