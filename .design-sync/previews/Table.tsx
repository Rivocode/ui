import { Badge, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@rivocode/ui'

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
          <TableCell className="text-right font-mono">R$ 12.400,00</TableCell>
        </TableRow>
        <TableRow selected>
          <TableCell><Checkbox checked aria-label="Selecionar 4813" /></TableCell>
          <TableCell className="font-mono text-sm text-fg-muted">4813</TableCell>
          <TableCell>Clínica São Lucas</TableCell>
          <TableCell><Badge tone="info" size="sm">Aberta</Badge></TableCell>
          <TableCell className="text-right font-mono">R$ 3.280,00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell><Checkbox aria-label="Selecionar 4814" /></TableCell>
          <TableCell className="font-mono text-sm text-fg-muted">4814</TableCell>
          <TableCell>Transportes Cabo Branco</TableCell>
          <TableCell><Badge tone="danger" size="sm">Vencida</Badge></TableCell>
          <TableCell className="text-right font-mono">R$ 8.750,00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
