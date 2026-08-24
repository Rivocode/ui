import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Field, FieldDescription, FieldError, FieldLabel, Input } from "../src/components/field";

test("o rotulo fica ligado ao controle, entao a busca por rotulo acha o campo", () => {
  render(
    <Field name="email">
      <FieldLabel>Email</FieldLabel>
      <Input placeholder="voce@empresa.com" />
    </Field>,
  );
  expect(screen.getByLabelText("Email").tagName).toBe("INPUT");
});

test("a descricao acompanha o campo para o leitor de tela", () => {
  render(
    <Field name="cnpj">
      <FieldLabel>CNPJ</FieldLabel>
      <Input />
      <FieldDescription>Somente numeros</FieldDescription>
    </Field>,
  );
  const campo = screen.getByLabelText("CNPJ");
  const descrito = campo.getAttribute("aria-describedby");
  expect(descrito).toBeTruthy();
  expect(document.getElementById(descrito!.split(" ")[0]!)?.textContent).toContain(
    "Somente numeros",
  );
});

test("campo invalido anuncia o erro e mostra a mensagem", () => {
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

test("a mensagem de erro usa o token de perigo", () => {
  render(
    <Field name="email" invalid>
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldError match>Email obrigatorio</FieldError>
    </Field>,
  );
  expect(screen.getByText("Email obrigatorio").className).toContain("text-danger");
});

test("a altura do campo vem do token de densidade", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input size="sm" />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("--rc-control-sm");
});

test("o campo tem anel de foco declarado, porque teclado nao e opcional", () => {
  render(
    <Field name="x">
      <FieldLabel>X</FieldLabel>
      <Input />
    </Field>,
  );
  expect(screen.getByLabelText("X").className).toContain("focus-visible:ring-ring");
});
