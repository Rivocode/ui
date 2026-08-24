import { createRoot } from 'react-dom/client'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RivoProvider,
  type RivoDensity,
  type RivoTheme,
} from '../src/index'

function Amostra({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-6 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="ghost">Fantasma</Button>
        <Button variant="destructive">Excluir</Button>
        <Button shape="pill">Pilula</Button>
        <Button loading>Salvando</Button>
        <Button disabled>Desabilitado</Button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge>Rascunho</Badge>
        <Badge tone="accent">Novo</Badge>
        <Badge tone="success">Pago</Badge>
        <Badge tone="warning">Vencendo</Badge>
        <Badge tone="danger">Vencido</Badge>
        <Badge tone="info">Em analise</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo do mes</CardTitle>
            <CardDescription>Agosto de 2026</CardDescription>
          </CardHeader>
          <CardContent>Doze notas processadas, tres pendentes de aprovacao.</CardContent>
          <CardFooter>
            <Button size="sm">Ver detalhes</Button>
            <Button size="sm" variant="ghost">Exportar</Button>
          </CardFooter>
        </Card>

        <Card elevation="raised">
          <CardHeader>
            <CardTitle>Novo cliente</CardTitle>
            <CardDescription>Dados basicos do cadastro</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field name="empresa">
              <FieldLabel>Empresa</FieldLabel>
              <Input placeholder="RivoCode Tecnologia" />
              <FieldDescription>Razao social como no CNPJ</FieldDescription>
            </Field>
            <Field name="email" invalid>
              <FieldLabel>Email</FieldLabel>
              <Input placeholder="voce@empresa.com" />
              <FieldError match>Informe um email valido</FieldError>
            </Field>
          </CardContent>
        </Card>
      </div>
    </RivoProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <div>
    <Amostra theme="rivocode-dark" density="comfortable" />
    <Amostra theme="rivocode-dark" density="compact" />
    <Amostra theme="rivocode-light" density="comfortable" />
    <Amostra theme="rivocode-light" density="compact" />
  </div>,
)
