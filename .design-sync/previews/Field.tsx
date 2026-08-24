import { Field, FieldDescription, FieldError, FieldLabel, Input } from '@rivocode/ui'

export function Basico() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field name="empresa">
        <FieldLabel>Empresa</FieldLabel>
        <Input placeholder="RivoCode Tecnologia" />
        <FieldDescription>Razao social como consta no CNPJ</FieldDescription>
      </Field>
    </div>
  )
}

export function ComErro() {
  return (
    <div className="max-w-sm">
      <Field name="email" invalid>
        <FieldLabel>Email</FieldLabel>
        <Input placeholder="voce@empresa.com" />
        <FieldError match>Informe um email valido</FieldError>
      </Field>
    </div>
  )
}

export function Tamanhos() {
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field name="a">
        <FieldLabel>Pequeno</FieldLabel>
        <Input size="sm" placeholder="Denso, para tabela" />
      </Field>
      <Field name="b">
        <FieldLabel>Medio</FieldLabel>
        <Input size="md" placeholder="O padrao" />
      </Field>
      <Field name="c">
        <FieldLabel>Grande</FieldLabel>
        <Input size="lg" placeholder="Para formulario curto e destacado" />
      </Field>
    </div>
  )
}

export function Desabilitado() {
  return (
    <div className="max-w-sm">
      <Field name="cnpj" disabled>
        <FieldLabel>CNPJ</FieldLabel>
        <Input defaultValue="60.139.541/0001-27" />
        <FieldDescription>Nao pode ser alterado depois do cadastro</FieldDescription>
      </Field>
    </div>
  )
}
