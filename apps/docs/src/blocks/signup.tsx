import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  MaskedInput,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  isValidCnpj,
  isValidCpf,
  useToast,
} from '@rivocode/ui'
import { Form, FormField, forValue, useZodForm } from '@rivocode/ui/form'
import { z } from 'zod'

const STATES = [
  { label: 'Alagoas', value: 'AL' },
  { label: 'Bahia', value: 'BA' },
  { label: 'Ceará', value: 'CE' },
  { label: 'Paraíba', value: 'PB' },
  { label: 'Pernambuco', value: 'PE' },
  { label: 'Rio Grande do Norte', value: 'RN' },
  { label: 'São Paulo', value: 'SP' },
]

const schema = z.object({
  company: z.string().trim().min(2, 'Escreva a razão social como está no cartão do CNPJ'),
  cnpj: z.string().refine(isValidCnpj, 'CNPJ inválido. Use o formato 00.000.000/0000-00'),
  owner: z.string().trim().min(3, 'Escreva o nome de quem responde pela empresa'),
  cpf: z.string().refine(isValidCpf, 'CPF inválido. Use o formato 000.000.000-00'),
  email: z.email('Escreva o e-mail no formato nome@empresa.com.br'),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Use o formato (00) 00000-0000'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'Use o formato 00000-000'),
  street: z.string().trim().min(3, 'Escreva a rua ou avenida'),
  number: z.string().trim().min(1, 'Escreva o número, ou S/N'),
  city: z.string().trim().min(2, 'Escreva a cidade'),
  state: z.string().min(2, 'Escolha o estado'),
})

type Customer = z.output<typeof schema>

const EMPTY: Customer = {
  company: '',
  cnpj: '',
  owner: '',
  cpf: '',
  email: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  city: '',
  state: '',
}

export default function CustomerSignupPage() {
  const toast = useToast()
  const form = useZodForm(schema, { defaultValues: EMPTY, mode: 'onTouched' })

  async function save(customer: Customer) {
    await new Promise((resolve) => setTimeout(resolve, 600))
    toast.add({
      title: `${customer.company} cadastrada`,
      description: 'Ela já aparece na lista de clientes e pode receber nota.',
    })
    form.reset(EMPTY)
  }

  return (
    <div className="w-full bg-bg p-4 sm:p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Novo cliente"
          description="Os dados saem na nota fiscal. Confira com o cartão do CNPJ."
        />

        <Form form={form} onSubmit={save}>
          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
              <CardDescription>Quem recebe a nota.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField name="company" label="Razão social" className="sm:col-span-2">
                {(field) => <Input {...field} autoComplete="organization" />}
              </FormField>

              <FormField name="cnpj" label="CNPJ" description="Aceita o CNPJ com letras, de 2026.">
                {(field) => (
                  <MaskedInput
                    mask="cnpj"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onValueChange={(masked) => field.onChange(masked)}
                    placeholder="00.000.000/0000-00"
                  />
                )}
              </FormField>

              <FormField name="email" label="E-mail para envio da nota">
                {(field) => <Input {...field} type="email" autoComplete="email" />}
              </FormField>

              <FormField name="owner" label="Responsável">
                {(field) => <Input {...field} autoComplete="name" />}
              </FormField>

              <FormField name="cpf" label="CPF do responsável">
                {(field) => (
                  <MaskedInput
                    mask="cpf"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onValueChange={(masked) => field.onChange(masked)}
                    placeholder="000.000.000-00"
                  />
                )}
              </FormField>

              <FormField name="phone" label="Telefone">
                {(field) => (
                  <MaskedInput
                    mask="telefone"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onValueChange={(masked) => field.onChange(masked)}
                    autoComplete="tel-national"
                  />
                )}
              </FormField>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>O da sede, como no cartão do CNPJ.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-6">
              <FormField name="cep" label="CEP" className="sm:col-span-2">
                {(field) => (
                  <MaskedInput
                    mask="cep"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onBlur={field.onBlur}
                    onValueChange={(masked) => field.onChange(masked)}
                    autoComplete="postal-code"
                    placeholder="00000-000"
                  />
                )}
              </FormField>

              <FormField name="street" label="Rua" className="sm:col-span-3">
                {(field) => <Input {...field} autoComplete="address-line1" />}
              </FormField>

              <FormField name="number" label="Número" className="sm:col-span-1">
                {(field) => <Input {...field} />}
              </FormField>

              <FormField name="city" label="Cidade" className="sm:col-span-4">
                {(field) => <Input {...field} autoComplete="address-level2" />}
              </FormField>

              <FormField name="state" label="Estado" className="sm:col-span-2">
                {(field) => (
                  <Select {...forValue(field)} items={STATES}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            </CardContent>
          </Card>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => form.reset(EMPTY)}>
              Limpar o formulário
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              Cadastrar cliente
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}
