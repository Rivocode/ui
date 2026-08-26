import {
  Badge,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'

/** Listagem */
export function Listing() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox indeterminate aria-label="Selecionar todas" />
          </TableHead>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell><Checkbox aria-label="Selecionar 4812" /></TableCell>
          <TableCell className="font-mono text-sm text-fg-muted">4812</TableCell>
          <TableCell>Prefeitura de João Pessoa</TableCell>
          <TableCell><Badge tone="success" size="sm">Paga</Badge></TableCell>
          <TableCell className="text-right font-mono">{currencyShort(12400)}</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell><Checkbox checked aria-label="Selecionar 4813" /></TableCell>
          <TableCell className="font-mono text-sm text-fg-muted">4813</TableCell>
          <TableCell>Clínica São Lucas</TableCell>
          <TableCell><Badge tone="info" size="sm">Aberta</Badge></TableCell>
          <TableCell className="text-right font-mono">{currencyShort(3300)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell><Checkbox aria-label="Selecionar 4814" /></TableCell>
          <TableCell className="font-mono text-sm text-fg-muted">4814</TableCell>
          <TableCell>Transportes Cabo Branco</TableCell>
          <TableCell><Badge tone="danger" size="sm">Vencida</Badge></TableCell>
          <TableCell className="text-right font-mono">{currencyShort(8800)}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}

/** Com linha de totais */
export function WithTotals() {
  const invoices = [
    { number: '4812', customer: 'Prefeitura de João Pessoa', amount: 12_400 },
    { number: '4813', customer: 'Clínica São Lucas', amount: 3300 },
    { number: '4814', customer: 'Transportes Cabo Branco', amount: 8800 },
  ]

  const total = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead className="text-right">Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.number}>
            <TableCell className="font-mono text-sm text-fg-muted">{invoice.number}</TableCell>
            <TableCell>{invoice.customer}</TableCell>
            <TableCell className="text-right font-mono">{currencyShort(invoice.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* Num <tfoot>, e nao numa <div> embaixo: a célula divide a largura com
          a coluna, então o total fica debaixo do valor que ele soma. */}
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right font-mono">{currencyShort(total)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
