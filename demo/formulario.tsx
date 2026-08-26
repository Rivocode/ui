import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";

import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  RivoProvider,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type RivoTheme,
} from "../src/index";
import { Form, FormField, forChecked, forDate, forValue, useZodForm } from "../src/form";

const PAYMENT_METHODS = [
  { label: "Boleto", value: "boleto" },
  { label: "Pix", value: "pix" },
  { label: "Cartao", value: "cartao" },
];

const schema = z.object({
  email: z.email("Escreva um email valido"),
  dueDate: z.date("Escolha a data"),
  forma: z.string().min(1, "Escolha a forma de pagamento"),
  aceite: z.boolean().refine((checked) => checked, "Aceite para continuar"),
});

type Entry = z.input<typeof schema>;

function InvoiceForm({ values, withError }: { values: Partial<Entry>; withError?: boolean }) {
  const form = useZodForm(schema, {
    defaultValues: { email: "", dueDate: undefined, forma: "", aceite: false, ...values },
  });

  // A vitrine e uma foto: sem disparar a validacao, o estado de erro nunca
  // apareceria no retrato.
  useEffect(() => {
    if (withError) form.trigger();
  }, [withError, form]);

  return (
    <Form form={form} onSubmit={() => {}} className="w-full max-w-72">
      <FormField name="email" label="E-mail" description="Para onde vai a nota">
        {(field) => <Input {...field} placeholder="voce@empresa.com" />}
      </FormField>

      <FormField name="dueDate" label="Vencimento">
        {(field) => <DatePicker {...forDate(field)} />}
      </FormField>

      <FormField name="forma" label="Forma de pagamento">
        {(field) => (
          <Select {...forValue(field)} items={PAYMENT_METHODS}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <FormField name="aceite">
        {(field) => (
          <label className="flex items-center gap-2 text-base text-fg">
            <Checkbox {...forChecked(field)} />
            Aceito emitir em nome do cliente
          </label>
        )}
      </FormField>

      <Button type="submit" className="self-start">
        Emitir nota
      </Button>
    </Form>
  );
}

function Sample({ theme }: { theme: RivoTheme }) {
  return (
    <RivoProvider scope="local" theme={theme} className="min-h-[640px] p-8">
      <p className="mb-8 font-mono text-xs tracking-widest text-fg-subtle uppercase">{theme}</p>

      <div className="flex flex-col items-start gap-10 sm:flex-row sm:flex-wrap sm:gap-x-16">
        <div>
          <p className="mb-4 text-sm text-fg-muted">Preenchido</p>
          <InvoiceForm
            values={{
              email: "financeiro@rivocode.com",
              dueDate: new Date(2026, 2, 3),
              forma: "pix",
              aceite: true,
            }}
          />
        </div>

        <div>
          <p className="mb-4 text-sm text-fg-muted">Com erro do schema</p>
          <InvoiceForm values={{ email: "financeiro@" }} withError />
        </div>
      </div>
    </RivoProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <div>
    <Sample theme="rivocode-dark" />
    <Sample theme="rivocode-light" />
  </div>,
);
