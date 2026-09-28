import { expect, test } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";

import { RivoProvider } from "../src/provider/rivo-provider";
import { Button } from "../src/components/button";
import { Checkbox } from "../src/components/checkbox";
import { DatePicker } from "../src/components/date-picker";
import { Input } from "../src/components/field";
import { Form } from "../src/form/form";
import { FormField } from "../src/form/form-field";
import { forChecked, forDate } from "../src/form/adapters";
import { useZodForm } from "../src/form/use-zod-form";

const schema = z.object({
  email: z.email("Escreva um email valido"),
  dueDate: z.date("Escolha a data"),
  aceite: z.boolean().refine((checked) => checked, "Aceite para continuar"),
});

function Example({ onSend = () => {} }: { onSend?: (v: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { email: "", dueDate: undefined, aceite: false },
  });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={onSend}>
        <FormField name="email" label="E-mail" description="Para onde vai a nota">
          {(field) => <Input {...field} placeholder="voce@empresa.com" />}
        </FormField>

        <FormField name="dueDate" label="Vencimento">
          {(field) => <DatePicker {...forDate(field)} />}
        </FormField>

        <FormField name="aceite">{(field) => <Checkbox {...forChecked(field)} />}</FormField>

        <Button type="submit">Emitir</Button>
      </Form>
    </RivoProvider>
  );
}

test("the label points to the control, including in DatePicker", () => {
  render(<Example />);

  const emailLabel = screen.getByText("E-mail") as HTMLLabelElement;
  const email = screen.getByPlaceholderText("voce@empresa.com");
  expect(emailLabel.htmlFor).toBe(email.id);

  const dateLabel = screen.getByText("Vencimento") as HTMLLabelElement;
  const data = screen.getByPlaceholderText("dd/mm/aaaa");
  expect(dateLabel.htmlFor).toBe(data.id);
  expect(data.id).toBeTruthy();
});

test("the invalid date field marks itself like the rest of the catalog", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const data = screen.getByPlaceholderText("dd/mm/aaaa");
    expect(data.getAttribute("aria-invalid")).toBe("true");
    expect(data.hasAttribute("data-invalid")).toBe(true);
  });
});

test("the field help is announced by the screen reader", () => {
  render(<Example />);
  const email = screen.getByPlaceholderText("voce@empresa.com");
  const help = screen.getByText("Para onde vai a nota");
  expect(email.getAttribute("aria-describedby")).toContain(help.id);
});

test("submitting empty shows the schema message, not the browser one", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    expect(screen.getByText("Escreva um email valido")).toBeDefined();
  });
  expect(screen.getByText("Escolha a data")).toBeDefined();
  expect(screen.getByText("Aceite para continuar")).toBeDefined();
});

test("the invalid field marks itself and points to the error", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const email = screen.getByPlaceholderText("voce@empresa.com");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const error = screen.getByText("Escreva um email valido");
    expect(email.getAttribute("aria-describedby")).toContain(error.id);
  });
});

test("with everything filled in, onSubmit receives the values already converted", async () => {
  let received: z.output<typeof schema> | undefined;
  render(<Example onSend={(v) => (received = v)} />);

  fireEvent.change(screen.getByPlaceholderText("voce@empresa.com"), {
    target: { value: "financeiro@rivocode.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("dd/mm/aaaa"), {
    target: { value: "03/03/2026" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    expect(received).toBeDefined();
  });
  expect(received!.email).toBe("financeiro@rivocode.com");
  expect(received!.dueDate.getDate()).toBe(3);
  expect(received!.aceite).toBe(true);
});

test("the form does not let the browser validate on its own", () => {
  const { container } = render(<Example />);
  expect(container.querySelector("form")!.noValidate).toBe(true);
});
