import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  Checkbox,
  Field,
  FieldDescription,
  FieldLabel,
  Input,
  MaskedInput,
  NumberField,
  Radio,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Steps,
  Switch,
  Textarea,
  useToast,
  useWizard,
  WizardFooter,
  type Step,
} from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'
import { useState } from 'react'

const STEPS: Step[] = [
  { id: 'customer', title: 'Cliente', description: 'Quem recebe' },
  { id: 'service', title: 'Serviço', description: 'O que foi feito' },
  { id: 'taxes', title: 'Impostos', description: 'Retenções' },
  { id: 'review', title: 'Revisão', description: 'Conferir e emitir' },
]

export function NewInvoice() {
  const wizard = useWizard(STEPS)
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  // The mask hands back both spellings; the raw one is what a total is made
  // of, and what would go to the server.
  const [amount, setAmount] = useState('328000')
  const [kind, setKind] = useState('service')

  const value = Number(amount || 0) / 100

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Steps steps={STEPS} current={wizard.step} onStepClick={wizard.goTo} />

      <Card>
        <CardContent className="py-6">
          {wizard.step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel>Razão social</FieldLabel>
                <Input defaultValue="Clínica São Lucas" placeholder="Quem recebe a nota" />
              </Field>

              <Field>
                <FieldLabel>CNPJ</FieldLabel>
                <MaskedInput mask="cnpj" defaultValue="12345678000190" />
                <FieldDescription>A máscara é do campo; o valor vai limpo.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Telefone</FieldLabel>
                <MaskedInput mask="telefone" defaultValue="83999887766" />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel>E-mail para envio</FieldLabel>
                <Input type="email" defaultValue="financeiro@saolucas.com.br" />
              </Field>
            </div>
          )}

          {wizard.step === 1 && (
            <div className="space-y-5">
              <Field>
                <FieldLabel>Natureza</FieldLabel>
                <RadioGroup value={kind} onValueChange={(next) => setKind(String(next))}>
                  <Radio value="service">Prestação de serviço</Radio>
                  <Radio value="product">Venda de produto</Radio>
                  <Radio value="rent">Locação</Radio>
                </RadioGroup>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Valor</FieldLabel>
                  <MaskedInput
                    mask="moeda"
                    defaultValue="328000"
                    onValueChange={(_, raw) => setAmount(raw)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Quantidade</FieldLabel>
                  <NumberField defaultValue={1} min={1} />
                </Field>
              </div>

              <Field>
                <FieldLabel>Descrição</FieldLabel>
                <Textarea
                  rows={3}
                  defaultValue="Manutenção preventiva dos equipamentos de imagem, agosto de 2026."
                />
              </Field>
            </div>
          )}

          {wizard.step === 2 && (
            <div className="space-y-5">
              <Field>
                <FieldLabel>Regime</FieldLabel>
                <Select
                  defaultValue="simples"
                  items={[
                    { label: 'Simples Nacional', value: 'simples' },
                    { label: 'Lucro presumido', value: 'presumido' },
                    { label: 'Lucro real', value: 'real' },
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Simples Nacional</SelectItem>
                    <SelectItem value="presumido">Lucro presumido</SelectItem>
                    <SelectItem value="real">Lucro real</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <div className="space-y-3">
                <p className="text-sm font-medium text-fg">Retenções</p>
                <Checkbox defaultChecked>ISS retido na fonte</Checkbox>
                <Checkbox>INSS</Checkbox>
                <Checkbox>IRRF</Checkbox>
              </div>

              <Separator />

              <Switch defaultChecked>Enviar o XML junto com o PDF</Switch>
            </div>
          )}

          {wizard.step === 3 && (
            <div className="space-y-4">
              <p className="font-display text-lg text-fg">Confira antes de emitir</p>

              {[
                ['Cliente', 'Clínica São Lucas'],
                ['CNPJ', '12.345.678/0001-90'],
                ['Natureza', kind === 'service' ? 'Prestação de serviço' : 'Venda de produto'],
                ['Valor', currencyShort(value)],
                ['Retenções', 'ISS na fonte'],
              ].map(([label, text]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-fg-muted">{label}</span>
                  <span className="text-right text-fg">{text}</span>
                </div>
              ))}

              <Separator />

              <div className="flex items-baseline justify-between">
                <span className="text-fg">Total</span>
                <span className="font-display text-xl text-fg">{currencyShort(value)}</span>
              </div>
            </div>
          )}

          <WizardFooter>
            <Button variant="ghost" onClick={wizard.back} disabled={wizard.isFirst}>
              Voltar
            </Button>

            {wizard.isLast ? (
              <Button onClick={() => setConfirming(true)}>Emitir nota</Button>
            ) : (
              <Button onClick={() => wizard.next()}>Continuar</Button>
            )}
          </WizardFooter>
        </CardContent>
      </Card>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogTitle>Emitir a nota agora?</AlertDialogTitle>
          <AlertDialogDescription>
            Depois de emitida ela vai para a prefeitura, e cancelar exige justificativa.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Revisar de novo
            </Button>
            <Button
              onClick={() => {
                setConfirming(false)
                toast.add({
                  title: 'Nota 4849 emitida',
                  description: 'O PDF foi enviado para o e-mail do cliente.',
                })
              }}
            >
              Emitir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
