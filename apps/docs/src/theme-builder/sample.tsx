import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Progress,
  Switch,
  Tab,
  TabList,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@rivocode/ui'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ChartContainer,
  ChartXAxis,
  ChartYAxis,
  currencyShort,
  type ChartConfig,
} from '@rivocode/ui/chart'

/* ---------------------------------------------------------------------------
 * A amostra que o montador veste
 *
 * Pecas de verdade, e nao retangulos pintados com a cor escolhida: o que se ve
 * aqui e exatamente o que a tela do cliente vai mostrar, porque sao as mesmas
 * classes lendo os mesmos papeis. Cada bloco foi escolhido pelo par que ele
 * expoe - o botao primario mostra `accent-fg` sobre `accent`, o campo com erro
 * mostra `danger-text`, o selo mostra os quatro tons, o grafico as series.
 * ------------------------------------------------------------------------- */

const CONFIG: ChartConfig = {
  billed: { label: 'Faturado' },
  received: { label: 'Recebido' },
  overdue: { label: 'Vencido' },
}

const MONTHS = [
  { month: 'jun', billed: 142_000, received: 131_000, overdue: 9_000 },
  { month: 'jul', billed: 189_000, received: 170_000, overdue: 14_000 },
  { month: 'ago', billed: 247_000, received: 198_000, overdue: 21_000 },
]

const ROWS = [
  { id: '4813', customer: 'Clínica São Lucas', amount: 3_280, status: 'Paga', tone: 'success' },
  { id: '4814', customer: 'Padaria Aurora', amount: 890, status: 'Em aberto', tone: 'info' },
  { id: '4815', customer: 'Oficina Norte', amount: 12_400, status: 'Vencida', tone: 'danger' },
] as const

export function Sample() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button>Emitir nota</Button>
        <Button variant="secondary">Salvar rascunho</Button>
        <Button variant="outline">Ver detalhes</Button>
        <Button variant="ghost">Voltar</Button>
        <Button variant="destructive">Cancelar nota</Button>
        <Button disabled>Travado</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova cobrança</CardTitle>
          <CardDescription>O cliente recebe o boleto por e-mail.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="boleto">
            <TabList variant="segmented">
              <Tab value="boleto">Boleto</Tab>
              <Tab value="pix">Pix</Tab>
              <Tab value="cartao">Cartão</Tab>
            </TabList>
          </Tabs>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>E-mail do cliente</FieldLabel>
              <Input defaultValue="financeiro@saolucas.com.br" />
              <FieldDescription>Para onde vai o boleto.</FieldDescription>
            </Field>
            <Field invalid>
              <FieldLabel>CNPJ</FieldLabel>
              <Input defaultValue="12.345.678/0001-00" aria-invalid="true" />
              <FieldError match>Confira os dois últimos dígitos.</FieldError>
            </Field>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Checkbox defaultChecked>Enviar o XML junto</Checkbox>
            <Checkbox>Cobrar multa</Checkbox>
            <Switch defaultChecked>Lembrar no vencimento</Switch>
          </div>

          <Progress value={82} label="Meta do mês" showValue />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Badge>Rascunho</Badge>
        <Badge tone="accent">Nova</Badge>
        <Badge tone="success">Paga</Badge>
        <Badge tone="info">Em aberto</Badge>
        <Badge tone="warning">Vence hoje</Badge>
        <Badge tone="danger">Vencida</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Alert tone="success">
          <AlertTitle>Nota 4813 emitida</AlertTitle>
          <AlertDescription>O PDF foi para o e-mail do cliente.</AlertDescription>
        </Alert>
        <Alert tone="warning">
          <AlertTitle>Certificado vence em 8 dias</AlertTitle>
          <AlertDescription>Renove para não parar a emissão.</AlertDescription>
        </Alert>
        <Alert tone="info">
          <AlertTitle>Prazo alterado</AlertTitle>
          <AlertDescription>A entrega passou para 19/09.</AlertDescription>
        </Alert>
        <Alert tone="danger">
          <AlertTitle>A prefeitura não respondeu</AlertTitle>
          <AlertDescription>Tente de novo em alguns minutos.</AlertDescription>
        </Alert>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nota</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono">{row.id}</TableCell>
                <TableCell>{row.customer}</TableCell>
                <TableCell className="text-right font-mono">{currencyShort(row.amount)}</TableCell>
                <TableCell>
                  <Badge tone={row.tone} size="sm">
                    {row.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faturado, recebido e vencido</CardTitle>
          <CardDescription>As três primeiras séries do tema.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={CONFIG} className="h-48">
            <BarChart data={MONTHS} margin={{ left: 4, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <ChartXAxis dataKey="month" />
              <ChartYAxis format="compact" />
              <Bar dataKey="billed" fill="var(--color-billed)" radius={4} />
              <Bar dataKey="received" fill="var(--color-received)" radius={4} />
              <Bar dataKey="overdue" fill="var(--color-overdue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
