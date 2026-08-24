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
import { forCheckbox, forDatePicker } from "../src/form/adaptadores";
import { useZodForm } from "../src/form/use-zod-form";

const schema = z.object({
  email: z.email("Escreva um email valido"),
  vencimento: z.date("Escolha a data"),
  aceite: z.boolean().refine((marcado) => marcado, "Aceite para continuar"),
});

function Exemplo({ aoEnviar = () => {} }: { aoEnviar?: (v: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { email: "", vencimento: undefined, aceite: false },
  });

  return (
    <RivoProvider scope="local">
      <Form form={form} onSubmit={aoEnviar}>
        <FormField name="email" label="E-mail" description="Para onde vai a nota">
          {(campo) => <Input {...campo} placeholder="voce@empresa.com" />}
        </FormField>

        <FormField name="vencimento" label="Vencimento">
          {(campo) => <DatePicker {...forDatePicker(campo)} />}
        </FormField>

        <FormField name="aceite">{(campo) => <Checkbox {...forCheckbox(campo)} />}</FormField>

        <Button type="submit">Emitir</Button>
      </Form>
    </RivoProvider>
  );
}

test("o rotulo aponta para o controle, inclusive no DatePicker", () => {
  render(<Exemplo />);

  const rotuloEmail = screen.getByText("E-mail") as HTMLLabelElement;
  const email = screen.getByPlaceholderText("voce@empresa.com");
  expect(rotuloEmail.htmlFor).toBe(email.id);

  const rotuloData = screen.getByText("Vencimento") as HTMLLabelElement;
  const data = screen.getByPlaceholderText("dd/mm/aaaa");
  expect(rotuloData.htmlFor).toBe(data.id);
  expect(data.id).toBeTruthy();
});

test("o campo de data invalido se marca como o resto do catalogo", async () => {
  render(<Exemplo />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const data = screen.getByPlaceholderText("dd/mm/aaaa");
    expect(data.getAttribute("aria-invalid")).toBe("true");
    expect(data.hasAttribute("data-invalid")).toBe(true);
  });
});

test("a ajuda do campo e anunciada pelo leitor de tela", () => {
  render(<Exemplo />);
  const email = screen.getByPlaceholderText("voce@empresa.com");
  const ajuda = screen.getByText("Para onde vai a nota");
  expect(email.getAttribute("aria-describedby")).toContain(ajuda.id);
});

test("enviar vazio mostra a mensagem do schema, nao a do navegador", async () => {
  render(<Exemplo />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    expect(screen.getByText("Escreva um email valido")).toBeDefined();
  });
  expect(screen.getByText("Escolha a data")).toBeDefined();
  expect(screen.getByText("Aceite para continuar")).toBeDefined();
});

test("o campo invalido se marca e aponta para o erro", async () => {
  render(<Exemplo />);
  fireEvent.click(screen.getByText("Emitir"));

  await waitFor(() => {
    const email = screen.getByPlaceholderText("voce@empresa.com");
    expect(email.getAttribute("aria-invalid")).toBe("true");
    const erro = screen.getByText("Escreva um email valido");
    expect(email.getAttribute("aria-describedby")).toContain(erro.id);
  });
});

test("com tudo preenchido, o onSubmit recebe os valores ja convertidos", async () => {
  let recebido: z.output<typeof schema> | undefined;
  render(<Exemplo aoEnviar={(v) => (recebido = v)} />);

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
  const { container } = render(<Exemplo />);
  expect(container.querySelector("form")!.noValidate).toBe(true);
});
