import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import { z } from "zod";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Form, FormField, useZodForm, forChecked, forValue } from "../src/form";
import { Switch } from "../src/components/switch";
import { RadioGroup, Radio } from "../src/components/radio";

/*
 * Os adaptadores tinham nome de componente, e o que eles traduzem e formato:
 * forCheckbox serve tudo que tem checked/onCheckedChange - o Switch, sem uma
 * linha de mudanca - e forSelect serve tudo que tem value/onValueChange, que e
 * RadioGroup, ToggleGroup, NumberField, Slider e OTPField. O nome fazia a API
 * parecer menor do que e, e mandava procurar um forSwitch que nao existe.
 */

const schema = z.object({ avisar: z.boolean(), forma: z.string() });

function Formulario() {
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
  render(<Formulario />);

  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});

test("o adaptador de valor veste o grupo de escolha unica", () => {
  const { container } = render(<Formulario />);

  const marcados = [...container.querySelectorAll('[role="radio"][data-checked]')];
  expect(marcados.length).toBe(1);
  // O marcado e o do schema, e nao o primeiro da lista por acaso.
  expect(marcados[0]!.closest("label")!.textContent).toContain("Pix");
});

test("os nomes antigos continuam valendo", async () => {
  const { forCheckbox, forSelect, forChecked: novo, forValue: novoValor } = await import(
    "../src/form"
  );

  expect(forCheckbox).toBe(novo);
  expect(forSelect).toBe(novoValor);
});
