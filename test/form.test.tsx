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
import { forCheckbox, forDatePicker } from "../src/form/adapters";
import { useZodForm } from "../src/form/use-zod-form";

const schema = z.object({
  email: z.email("Escreva um email valido"),
  vencimento: z.date("Escolha a data"),
  aceite: z.boolean().refine((checked) => checked, "Aceite para continuar"),
});

function Example({ aoEnviar = () => {} }: { aoEnviar?: (v: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { email: "", vencimento: undefined, aceite: false },
  });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={aoEnviar}>
        <FormField name="email" label="E-mail" description="Para onde vai a nota">
          {(field) => <Input {...field} placeholder="voce@empresa.com" />}
        </FormField>

        <FormField name="vencimento" label="Vencimento">
          {(field) => <DatePicker {...forDatePicker(field)} />}
        </FormField>

        <FormField name="aceite">{(field) => <Checkbox {...forCheckbox(field)} />}</FormField>

        <Button type="submit">Emitir</Button>
      </Form>
    </RivoProvider>
  );
}

test("o rotulo aponta para o controle, inclusive no DatePicker", () => {
  render(<Example />);

  const emailLabel = screen.getByText("E-mail") as HTMLLabelElement;
  const email = screen.getByPlaceholderText("voce@empresa.com");
  expect(emailLabel.htmlFor).toBe(email.id);

  const dateLabel = screen.getByText("Vencimento") as HTMLLabelElement;
  const data = screen.getByPlaceholderText("dd/mm/aaaa");
  expect(dateLabel.htmlFor).toBe(data.id);
  expect(data.id).toBeTruthy();
});

test("o campo de data invalido se marca como o resto do catalogo", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const data = screen.getByPlaceholderText("dd/mm/aaaa");
    expect(data.getAttribute("aria-invalid")).toBe("true");
    expect(data.hasAttribute("data-invalid")).toBe(true);
  });
});

test("a ajuda do campo e anunciada pelo leitor de tela", () => {
  render(<Example />);
  const email = screen.getByPlaceholderText("voce@empresa.com");
  const help = screen.getByText("Para onde vai a nota");
  expect(email.getAttribute("aria-describedby")).toContain(help.id);
});

test("enviar vazio mostra a mensagem do schema, nao a do navegador", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    expect(screen.getByText("Escreva um email valido")).toBeDefined();
  });
  expect(screen.getByText("Escolha a data")).toBeDefined();
  expect(screen.getByText("Aceite para continuar")).toBeDefined();
});

test("o campo invalido se marca e aponta para o erro", async () => {
  render(<Example />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const email = screen.getByPlaceholderText("voce@empresa.com");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const error = screen.getByText("Escreva um email valido");
    expect(email.getAttribute("aria-describedby")).toContain(error.id);
  });
});

test("com tudo preenchido, o onSubmit recebe os valores ja convertidos", async () => {
  let recebido: z.output<typeof schema> | undefined;
  render(<Example aoEnviar={(v) => (recebido = v)} />);

  fireEvent.change(screen.getByPlaceholderText("voce@empresa.com"), {
    target: { value: "financeiro@rivocode.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("dd/mm/aaaa"), {
    target: { value: "03/03/2026" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    expect(recebido).toBeDefined();
  });
  expect(recebido!.email).toBe("financeiro@rivocode.com");
  expect(recebido!.vencimento.getDate()).toBe(3);
  expect(recebido!.aceite).toBe(true);
});

test("o formulario nao deixa o navegador validar por conta propria", () => {
  const { container } = render(<Example />);
  expect(container.querySelector("form")!.noValidate).toBe(true);
});
