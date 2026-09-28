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

test("raw Base UI still brings the tree down outside Field, so the fix has something to prevent", () => {
  const complaint = spyOn(console, "error").mockImplementation(() => {});

  expect(() => render(<BaseField.Label>Email</BaseField.Label>)).toThrow("FieldRootContext");
  expect(() => render(<BaseField.Description>Ajuda</BaseField.Description>)).toThrow(
    "FieldRootContext",
  );
  expect(() => render(<BaseField.Error match>Erro</BaseField.Error>)).toThrow("FieldRootContext");

  complaint.mockRestore();
});

test("the loose label draws a label and the screen stays up", () => {
  const error = quiet();

  render(<FieldLabel htmlFor="avulso">Email</FieldLabel>);

  const label = screen.getByText("Email");
  expect(label.tagName).toBe("LABEL");
  expect(label.getAttribute("for")).toBe("avulso");
  expect(label.className.split(" ")).toContain("text-fg");

  error.mockRestore();
});

test("the loose description draws a paragraph and the screen stays up", () => {
  const error = quiet();

  render(<FieldDescription>Somente numeros</FieldDescription>);

  const hint = screen.getByText("Somente numeros");
  expect(hint.tagName).toBe("P");
  expect(hint.className.split(" ")).toContain("text-fg-subtle");

  error.mockRestore();
});

test("the loose error with match draws the message, and without match draws nothing", () => {
  const error = quiet();

  const loose = render(<FieldError match>Email obrigatorio</FieldError>);
  const message = screen.getByText("Email obrigatorio");
  expect(message.className.split(" ")).toContain("text-danger-text");
  loose.unmount();

  const silent = render(<FieldError>Email obrigatorio</FieldError>);
  expect(silent.container.textContent).toBe("");

  error.mockRestore();
});

test("the loose field inside another piece does not wipe what is around it", () => {
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

test("each loose part shouts its own name in the development console", () => {
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

test("a part inside Field does not complain, so the warning does not become noise", () => {
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

test("the loose control does not throw and so gets neither a warning nor a substitute", () => {
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

test("the complaint names the piece and the fix, and is written in English, because it reaches the developer and not the screen", () => {
  const complaint = missingFieldRootComplaint("FieldLabel");

  expect(complaint.startsWith("[rivocode/ui] <FieldLabel> outside <Field>")).toBe(true);
  expect(complaint).toContain('<Field name="something">');
  expect(complaint).toContain("whole tree");
  expect(complaint).toContain("page goes blank");
  expect(complaint).not.toMatch(/árvore|página|não/);
});
