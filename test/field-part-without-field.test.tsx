import { expect, spyOn, test } from "bun:test";
import { Field as BaseField } from "@base-ui/react/field";
import { render, screen } from "@testing-library/react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  missingFieldRootComplaint,
  Textarea,
} from "../src/components/field";

const quiet = () => spyOn(console, "error").mockImplementation(() => {});

const ours = (error: ReturnType<typeof spyOn<Console, "error">>) =>
  error.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("[rivocode/ui]"));

test("a Base UI crua ainda derruba a arvore fora do Field, entao o conserto tem o que impedir", () => {
  const complaint = spyOn(console, "error").mockImplementation(() => {});

  expect(() => render(<BaseField.Label>Email</BaseField.Label>)).toThrow("FieldRootContext");
  expect(() => render(<BaseField.Description>Ajuda</BaseField.Description>)).toThrow(
    "FieldRootContext",
  );
  expect(() => render(<BaseField.Error match>Erro</BaseField.Error>)).toThrow("FieldRootContext");

  complaint.mockRestore();
});

test("o rotulo solto desenha um label e a tela continua de pe", () => {
  const error = quiet();

  render(<FieldLabel htmlFor="avulso">Email</FieldLabel>);

  const label = screen.getByText("Email");
  expect(label.tagName).toBe("LABEL");
  expect(label.getAttribute("for")).toBe("avulso");
  expect(label.className.split(" ")).toContain("text-fg");

  error.mockRestore();
});

test("a descricao solta desenha um paragrafo e a tela continua de pe", () => {
  const error = quiet();

  render(<FieldDescription>Somente numeros</FieldDescription>);

  const hint = screen.getByText("Somente numeros");
  expect(hint.tagName).toBe("P");
  expect(hint.className.split(" ")).toContain("text-fg-subtle");

  error.mockRestore();
});

test("o erro solto com match desenha a mensagem, e sem match nao desenha nada", () => {
  const error = quiet();

  const solto = render(<FieldError match>Email obrigatorio</FieldError>);
  const mensagem = screen.getByText("Email obrigatorio");
  expect(mensagem.className.split(" ")).toContain("text-danger-text");
  solto.unmount();

  const calado = render(<FieldError>Email obrigatorio</FieldError>);
  expect(calado.container.textContent).toBe("");

  error.mockRestore();
});

test("o campo solto dentro de outra peca nao apaga o que esta em volta", () => {
  const error = quiet();

  const { container } = render(
    <div>
      <span>antes</span>
      <FieldLabel>Aceito os termos</FieldLabel>
      <span>depois</span>
    </div>,
  );

  expect(container.textContent).toContain("antes");
  expect(container.textContent).toContain("depois");

  error.mockRestore();
});

test("cada parte solta grita o proprio nome no console de desenvolvimento", () => {
  const error = quiet();

  render(
    <div>
      <FieldLabel>Email</FieldLabel>
      <FieldDescription>Ajuda</FieldDescription>
      <FieldError match>Erro</FieldError>
    </div>,
  );

  const complaints = ours(error);
  expect(complaints).toHaveLength(3);
  expect(complaints.some((line) => line.includes("<FieldLabel>"))).toBe(true);
  expect(complaints.some((line) => line.includes("<FieldDescription>"))).toBe(true);
  expect(complaints.some((line) => line.includes("<FieldError>"))).toBe(true);

  error.mockRestore();
});

test("parte dentro do Field nao reclama, entao o aviso nao vira ruido", () => {
  const error = quiet();

  render(
    <Field name="email">
      <FieldLabel>Email</FieldLabel>
      <Input />
      <FieldDescription>Ajuda</FieldDescription>
      <FieldError match>Erro</FieldError>
    </Field>,
  );

  expect(ours(error)).toHaveLength(0);
  expect(screen.getByLabelText("Email").tagName).toBe("INPUT");

  render(
    <Field name="bio">
      <FieldLabel>Bio</FieldLabel>
      <Textarea />
    </Field>,
  );

  expect(ours(error)).toHaveLength(0);
  expect(screen.getByLabelText("Bio").tagName).toBe("TEXTAREA");

  error.mockRestore();
});

test("o controle solto nao lanca e por isso nao ganha aviso nem substituto", () => {
  const error = quiet();

  const { container } = render(
    <div>
      <Input placeholder="solto" />
      <Textarea placeholder="solta" />
    </div>,
  );

  expect(container.querySelectorAll("input, textarea")).toHaveLength(2);
  expect(ours(error)).toHaveLength(0);

  error.mockRestore();
});

test("a reclamacao diz a peca, o conserto e sai acentuada, porque quem le e gente", () => {
  const complaint = missingFieldRootComplaint("FieldLabel");

  expect(complaint).toContain("<FieldLabel>");
  expect(complaint).toContain("<Field");
  expect(complaint).toContain("árvore");
  expect(complaint).toContain("não");
  expect(complaint).toContain("página");
  expect(complaint.split(" ")).not.toContain("arvore");
});
