import { expect, test } from "bun:test";
import { render, screen } from "@testing-library/react";

import { CurrencyInput } from "../src/components/currency-input";
import { Field } from "../src/components/field";
import { PasswordInput } from "../src/components/password-input";
import { TagsInput } from "../src/components/tags-input";
import { TimeField } from "../src/components/time-field";
import { RivoProvider } from "../src/provider/rivo-provider";

function Form({ disabled }: { disabled: boolean }) {
  return (
    <RivoProvider scope="local">
      <form>
        <Field name="hora" disabled={disabled}>
          <TimeField aria-label="Hora" defaultValue="10:00" />
        </Field>
        <Field name="preco" disabled={disabled}>
          <CurrencyInput aria-label="Preço" defaultValue={100} />
        </Field>
        <Field name="tags" disabled={disabled}>
          <TagsInput aria-label="Tags" defaultValue={["pix"]} />
        </Field>
        <Field name="senha" disabled={disabled}>
          <PasswordInput aria-label="Senha" defaultValue="segredo" />
        </Field>
      </form>
    </RivoProvider>
  );
}

test("a disabled Field drops from submission the value of fields with a hidden input", () => {
  const { container } = render(<Form disabled />);
  const sent = [...new FormData(container.querySelector("form")!).keys()];

  for (const name of ["hora", "preco", "tags"]) expect(sent).not.toContain(name);
});

test("an enabled Field keeps submitting the same fields", () => {
  const { container } = render(<Form disabled={false} />);
  const sent = [...new FormData(container.querySelector("form")!).keys()];

  expect(sent).toEqual(expect.arrayContaining(["hora", "preco", "tags", "senha"]));
});

test("the password eye picks up the Field disabled state", () => {
  render(<Form disabled />);
  const eye = screen.getByRole("button", { name: "Mostrar senha" }) as HTMLButtonElement;

  expect(eye.disabled).toBe(true);
});
