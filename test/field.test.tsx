import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Field, FieldDescription, FieldError, FieldLabel, Input } from "../src/components/field";

test("the label is tied to the control, so a query by label finds the field", () => {
  render(
    <Field name="email">
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="voce@empresa.com" />
    </Field>,
  );
  expect(screen.getByLabelText("Email").tagName).toBe("INPUT");
});

test("the description goes with the field for the screen reader", () => {
  render(
    <Field name="cnpj">
      <FieldLabel>CNPJ</FieldLabel>
      <Input />
      <FieldDescription>Somente numeros</FieldDescription>
    </Field>,
  );
  const field = screen.getByLabelText("CNPJ");
  const describedBy = field.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!.split(" ")[0]!)?.textContent).toContain(
    "Somente numeros",
  );
});

test("an invalid field announces the error and shows the message", () => {
  render(
    <Field name="email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldError match>Email obrigatorio</FieldError>
    </Field>,
  );
  expect(screen.getByLabelText("Email").getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByText("Email obrigatorio")).toBeDefined();
});

test("the error message uses the danger token", () => {
  render(
    <Field name="email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldError match>Email obrigatorio</FieldError>
    </Field>,
  );
  expect(screen.getByText("Email obrigatorio").className.split(" ")).toContain("text-danger-text");
});

test("the field height comes from the density token", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input size="sm" />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("--rc-control-sm");
});

test("the field has a declared focus ring, because the keyboard is not optional", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("focus-visible:ring-ring");
});
