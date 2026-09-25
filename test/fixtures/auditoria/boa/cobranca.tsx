import {
  Button,
  Card,
  CardContent,
  Checkbox,
  CurrencyInput,
  DataTable,
  Heading,
  IconButton,
  Input,
  MaskedInput,
  PixCode,
  buildPixPayload,
  currencyShort,
  isValidCnpj,
} from "@rivocode/ui";
import { Form, FormField, forChecked, forValue, useZodForm } from "@rivocode/ui/form";
import { ChartContainer, Line, LineChart } from "@rivocode/ui/chart";
import { Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const schema = z.object({
  customer: z.string().min(1, "Escreva o nome do cliente."),
  document: z.string().refine(isValidCnpj, "Use o formato 00.000.000/0000-00."),
  amount: z.number().int().min(1, "Informe o valor da cobrança."),
  notify: z.boolean(),
});

const config = { paid: { label: "Pagas" } };

type Invoice = { id: string; number: string; amount: number };

export function ChargeScreen({ onIssue }: { onIssue: (data: z.output<typeof schema>) => void }) {
  const form = useZodForm(schema, {
    defaultValues: { customer: "", document: "", amount: 0, notify: true },
  });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: async () => [] as Invoice[] });

  return (
    <main className="flex flex-col gap-6 bg-bg p-6 text-fg">
      <Heading level={1}>Nova cobrança</Heading>

      <Card>
        <CardContent className="sticky top-0 z-[var(--rc-z-sticky)] bg-surface">
          <Form form={form} onSubmit={onIssue}>
            <FormField name="customer" label="Cliente">
              {(field) => <Input {...field} placeholder="Clínica São Lucas" />}
            </FormField>
            <FormField name="document" label="CNPJ do cliente">
              {(field) => <MaskedInput {...field} mask="cnpj" />}
            </FormField>
            <FormField name="amount" label="Valor">
              {(field) => <CurrencyInput {...forValue(field)} />}
            </FormField>
            <FormField name="notify">
              {(field) => <Checkbox {...forChecked(field)}>Avisar o cliente por e-mail</Checkbox>}
            </FormField>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Emitir cobrança
            </Button>
          </Form>
        </CardContent>
      </Card>

      <PixCode payload={buildPixPayload({ key: "12345678000195", name: "Rivo", city: "Recife", amount: 1990 })} />

      <IconButton label="Exportar as notas">
        <Download aria-hidden="true" />
      </IconButton>

      <DataTable<Invoice>
        data={invoices.data ?? []}
        isLoading={invoices.isLoading}
        isError={invoices.isError}
        onRetry={invoices.refetch}
        rowKey={(invoice) => invoice.id}
        empty={{ title: "Nenhuma cobrança", description: "Emita a primeira para ela aparecer." }}
        columns={[
          { key: "number", header: "Número" },
          { key: "amount", header: "Valor", align: "right", cell: (invoice) => currencyShort(invoice.amount / 100) },
        ]}
      />

      <ChartContainer
        config={config}
        className="h-64"
        isLoading={invoices.isLoading}
        isError={invoices.isError}
        onRetry={invoices.refetch}
        empty={{ title: "Nenhuma nota no período", description: "Mude o período no filtro acima." }}
      >
        <LineChart data={[]}>
          <Line dataKey="paid" stroke="var(--color-paid)" />
        </LineChart>
      </ChartContainer>
    </main>
  );
}
