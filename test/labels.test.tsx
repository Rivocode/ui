import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Checkbox } from "../src/components/checkbox";
import { Radio, RadioGroup } from "../src/components/radio";
import { Switch } from "../src/components/switch";

function withTheme(node: React.ReactNode) {
  return render(<RivoProvider scope="local">{node}</RivoProvider>);
}

/*
 * Text passed as a child used to vanish without warning: the box was just the
 * box, and whoever wrote `<Checkbox>Aceito</Checkbox>` saw a lone little square
 * on screen and no error anywhere. These tests exist so that does not come
 * back.
 */

test("a checkbox with text renders inside a label, and clicking the text checks it", () => {
  withTheme(<Checkbox>ISS retido na fonte</Checkbox>);

  const box = screen.getByRole("checkbox", { name: "ISS retido na fonte" });
  expect(box.getAttribute("data-checked")).toBeNull();

  fireEvent.click(screen.getByText("ISS retido na fonte"));
  expect(screen.getByRole("checkbox").getAttribute("data-checked")).not.toBeNull();
});

test("without text it stays just the box, for whoever builds the arrangement", () => {
  const { container } = withTheme(<Checkbox aria-label="Marcar" />);
  expect(container.querySelector("label")).toBeNull();
});

test("a radio with text is also checked by its text", () => {
  withTheme(
    <RadioGroup defaultValue="produto">
      <Radio value="servico">Prestação de serviço</Radio>
      <Radio value="produto">Venda de produto</Radio>
    </RadioGroup>,
  );

  fireEvent.click(screen.getByText("Prestação de serviço"));
  expect(
    screen.getByRole("radio", { name: "Prestação de serviço" }).getAttribute("data-checked"),
  ).not.toBeNull();
});

test("a switch with text turns on by its text", () => {
  withTheme(<Switch>Enviar o XML junto com o PDF</Switch>);

  fireEvent.click(screen.getByText("Enviar o XML junto com o PDF"));
  expect(screen.getByRole("switch").getAttribute("data-checked")).not.toBeNull();
});

/*
 * WCAG 1.4.11: whatever identifies a control needs 3:1 against the background.
 * In the tokens the one carrying that promise is --rc-border-strong; --rc-border
 * stays the decorative divider, which identifies nothing. These tests exist so
 * a field does not go back to drawing itself with the divider border.
 */

import { Field, FieldLabel, Input } from "../src/components/field";
import { InputGroup } from "../src/components/input-group";
import { SelectTrigger, Select } from "../src/components/select";

test("the field draws itself with the control border, and not with the divider", () => {
  withTheme(<Input aria-label="Razao social" />);
  const field = screen.getByLabelText("Razao social");

  expect(field.className).toContain("border-border-strong");
});

test("so does the field frame with an addon", () => {
  withTheme(
    <InputGroup>
      <Input aria-label="Valor" />
    </InputGroup>,
  );
  // The frame draws the border; the field inside it goes without its own border.
  const frame = screen.getByLabelText("Valor").parentElement!;

  expect(frame.className).toContain("border-border-strong");
});

test("so does the select trigger", () => {
  withTheme(
    <Select>
      <SelectTrigger aria-label="Situacao" />
    </Select>,
  );

  expect(screen.getByLabelText("Situacao").className).toContain("border-border-strong");
});

test("inside a field, each radio is named by its own text", () => {
  // Field passes its own label to every control living inside it, and for a
  // single control that is right. In a single-choice group it is not: the
  // screen reader announced "Forma de pagamento" for Pix and for Boleto alike,
  // and whoever depends on it had no way to tell the options apart.
  withTheme(
    <Field>
      <FieldLabel>Forma de pagamento</FieldLabel>
      <RadioGroup defaultValue="pix">
        <Radio value="pix">Pix</Radio>
        <Radio value="boleto">Boleto</Radio>
      </RadioGroup>
    </Field>,
  );

  expect(screen.getByRole("radio", { name: "Pix" })).toBeDefined();
  expect(screen.getByRole("radio", { name: "Boleto" })).toBeDefined();
  // The group remains the owner of the field label.
  expect(screen.getByRole("radiogroup", { name: "Forma de pagamento" })).toBeDefined();
});

test("the checkbox and the switch keep their own text as name inside the field", () => {
  // Inheriting the field label would be wrong here too, but for another reason:
  // with a single control, the field name is the control name, and the two
  // texts would add up - "ISS retido ISS retido".
  withTheme(
    <Field>
      <FieldLabel>Impostos</FieldLabel>
      <Checkbox>ISS retido na fonte</Checkbox>
      <Switch>Avisar por email</Switch>
    </Field>,
  );

  expect(screen.getByRole("checkbox", { name: "ISS retido na fonte" })).toBeDefined();
  expect(screen.getByRole("switch", { name: "Avisar por email" })).toBeDefined();
});
