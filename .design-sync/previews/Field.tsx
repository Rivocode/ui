import { Field, FieldDescription, FieldError, FieldLabel, Input } from '@rivocode/ui'

/** Básico */
export function Basic() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field name="empresa">
        <FieldLabel>Empresa</FieldLabel>
        <Input placeholder="RivoCode Tecnologia" />
        <FieldDescription>Razão social como consta no CNPJ</FieldDescription>
      </Field>
    </div>
  )
}

/** Com erro */
export function WithError() {
  return (
    <div className="max-w-sm">
      <Field name="email" invalid>
        <FieldLabel>Email</FieldLabel>
        <Input placeholder="você@empresa.com" />
        <FieldError match>Informe um email válido</FieldError>
      </Field>
    </div>
  )
}

/** Tamanhos */
export function Sizes() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field name="a">
        <FieldLabel>Pequeno</FieldLabel>
        <Input size="sm" placeholder="Denso, para tabela" />
      </Field>
      <Field name="b">
        <FieldLabel>Médio</FieldLabel>
        <Input size="md" placeholder="O padrão" />
      </Field>
      <Field name="c">
        <FieldLabel>Grande</FieldLabel>
        <Input size="lg" placeholder="Para formulário curto e destacado" />
      </Field>
    </div>
  )
}

/** Desabilitado */
export function Disabled() {
  return (
    <div className="max-w-sm">
      <Field name="cnpj" disabled>
        <FieldLabel>CNPJ</FieldLabel>
        <Input defaultValue="60.139.541/0001-27" />
        <FieldDescription>Não pode ser alterado depois do cadastro</FieldDescription>
      </Field>
    </div>
  )
}
