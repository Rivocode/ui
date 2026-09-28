import { useState } from 'react'
import { FileText } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DescriptionItem,
  DescriptionList,
  QueryBoundary,
  Skeleton,
} from '@rivocode/ui'

type Invoice = {
  id: string
  number: string
  customer: string
  amount: string
  status: 'Paga' | 'Aberta'
}

const INVOICES: Invoice[] = [
  { id: '1', number: '4813', customer: 'Clínica São Lucas', amount: 'R$ 2.480,00', status: 'Paga' },
  { id: '2', number: '4814', customer: 'Ótica Central', amount: 'R$ 940,00', status: 'Aberta' },
]

function Invoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {invoices.map((invoice) => (
        <li key={invoice.id} className="flex items-center justify-between gap-3">
          <span className="text-base text-fg">{invoice.customer}</span>
          <Badge tone={invoice.status === 'Paga' ? 'success' : 'neutral'}>{invoice.status}</Badge>
        </li>
      ))}
    </ul>
  )
}

/** Com dados */
export function WithData() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Últimas notas</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryBoundary data={INVOICES} className="min-h-40">
          {(invoices) => <Invoices invoices={invoices} />}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}

/** Carregando */
export function Loading() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Últimas notas</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryBoundary<Invoice[]> isLoading className="min-h-40">
          {(invoices) => <Invoices invoices={invoices} />}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}

/** Carregando com o molde da tela */
export function LoadingWithSkeleton() {
  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Últimas notas</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryBoundary<Invoice[]>
          isLoading
          className="min-h-40"
          skeleton={
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((line) => (
                <div key={line} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-pill" />
                </div>
              ))}
            </div>
          }
        >
          {(invoices) => <Invoices invoices={invoices} />}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}

/** Erro */
export function Failed() {
  return (
    <div className="max-w-lg">
      <QueryBoundary<Invoice[]>
        isError
        onRetry={() => {}}
        errorTitle="Não foi possível carregar as notas"
        errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
      >
        {(invoices) => <Invoices invoices={invoices} />}
      </QueryBoundary>
    </div>
  )
}

/** Vazio */
export function Empty() {
  return (
    <Card className="max-w-lg">
      <CardContent>
        <QueryBoundary
          data={[] as Invoice[]}
          empty={{
            icon: <FileText aria-hidden="true" />,
            title: 'Nenhuma nota por aqui',
            description: 'Quando você emitir a primeira, ela aparece nesta lista.',
            action: <Button size="sm">Emitir nota</Button>,
          }}
        >
          {(invoices) => <Invoices invoices={invoices} />}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}

type Page = { items: Invoice[]; total: number }

const PAGE: Page = { items: [], total: 0 }

/** Resposta que não é lista */
export function NotAList() {
  return (
    <Card className="max-w-lg">
      <CardContent>
        <QueryBoundary
          data={PAGE}
          isEmpty={PAGE.total === 0}
          empty={{
            title: 'Nenhuma nota no período',
            description: 'Amplie o intervalo de datas para ver notas mais antigas.',
          }}
        >
          {(page) => <Invoices invoices={page.items} />}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}

type Stage = 'carregando' | 'erro' | 'vazio' | 'dados'

const STAGES: { id: Stage; label: string }[] = [
  { id: 'carregando', label: 'Carregando' },
  { id: 'erro', label: 'Erro' },
  { id: 'vazio', label: 'Vazio' },
  { id: 'dados', label: 'Dados' },
]

/** Os quatro finais */
export function FourEndings() {
  const [stage, setStage] = useState<Stage>('carregando')

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {STAGES.map((option) => (
          <Button
            key={option.id}
            size="sm"
            variant={option.id === stage ? 'primary' : 'secondary'}
            onClick={() => setStage(option.id)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent>
          <QueryBoundary
            data={stage === 'dados' ? INVOICES : stage === 'vazio' ? [] : undefined}
            isLoading={stage === 'carregando'}
            isError={stage === 'erro'}
            onRetry={() => setStage('dados')}
            errorMessage="A prefeitura não respondeu. Tente de novo em alguns minutos."
            className="min-h-40"
            empty={{
              icon: <FileText aria-hidden="true" />,
              title: 'Nenhuma nota por aqui',
              description: 'Quando você emitir a primeira, ela aparece nesta lista.',
              action: <Button size="sm">Emitir nota</Button>,
            }}
          >
            {(invoices) => <Invoices invoices={invoices} />}
          </QueryBoundary>
        </CardContent>
      </Card>
    </div>
  )
}

type Customer = { name: string; document: string; city: string }

const CUSTOMER: Customer = {
  name: 'Clínica São Lucas',
  document: '12.345.678/0001-90',
  city: 'João Pessoa, PB',
}

/** Uma folha, e não uma lista */
export function SingleRecord() {
  return (
    <Card className="max-w-lg">
      <CardContent>
        <QueryBoundary<Customer>
          data={CUSTOMER}
          errorTitle="Não foi possível carregar o cliente"
          skeletonRows={4}
        >
          {(customer) => (
            <DescriptionList>
              <DescriptionItem label="Cliente">{customer.name}</DescriptionItem>
              <DescriptionItem label="CNPJ">{customer.document}</DescriptionItem>
              <DescriptionItem label="Cidade">{customer.city}</DescriptionItem>
            </DescriptionList>
          )}
        </QueryBoundary>
      </CardContent>
    </Card>
  )
}
