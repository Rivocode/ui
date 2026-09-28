import { CurrencyInput, Field, FieldDescription, FieldLabel, currency } from '@rivocode/ui'
import { useState } from 'react'

/** Valor da cobrança */
export function Charge() {
  const [cents, setCents] = useState<number | null>(248_000)

  return (
    <div className="w-80">
      <Field>
        <FieldLabel>Valor da cobrança</FieldLabel>
        <CurrencyInput value={cents} onValueChange={setCents} />
        <FieldDescription>
          {cents === null ? 'Nada digitado ainda.' : `Vai para o servidor como ${cents} centavos.`}
        </FieldDescription>
      </Field>
    </div>
  )
}

const LIMIT = { min: 1_000, max: 500_000 }

/** Com limite */
export function WithLimit() {
  const [cents, setCents] = useState<number | null>(750_000)
  const outside = cents !== null && (cents < LIMIT.min || cents > LIMIT.max)

  return (
    <div className="w-80">
      <Field invalid={outside}>
        <FieldLabel>Valor do Pix</FieldLabel>
        <CurrencyInput value={cents} onValueChange={setCents} {...LIMIT} />
        <FieldDescription>
          De {currency(LIMIT.min / 100)} a {currency(LIMIT.max / 100)} por transferência.
        </FieldDescription>
      </Field>
    </div>
  )
}

/** Ajuste com sinal */
export function Adjustment() {
  const [cents, setCents] = useState<number | null>(-1_590)

  return (
    <div className="w-80">
      <Field>
        <FieldLabel>Ajuste no saldo</FieldLabel>
        <CurrencyInput value={cents} onValueChange={setCents} allowNegative />
        <FieldDescription>Digite - em qualquer ponto para trocar o sinal.</FieldDescription>
      </Field>
    </div>
  )
}

/** Tamanhos e estados */
export function States() {
  return (
    <div className="flex w-80 flex-col gap-3">
      <Field>
        <FieldLabel>Pequeno</FieldLabel>
        <CurrencyInput size="sm" defaultValue={1_990} />
      </Field>
      <Field>
        <FieldLabel>Vazio</FieldLabel>
        <CurrencyInput />
      </Field>
      <Field>
        <FieldLabel>Grande</FieldLabel>
        <CurrencyInput size="lg" defaultValue={1_234_567} />
      </Field>
      <Field disabled>
        <FieldLabel>Desabilitado</FieldLabel>
        <CurrencyInput defaultValue={48_000} disabled />
      </Field>
    </div>
  )
}
