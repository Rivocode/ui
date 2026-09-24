import { Card, CardContent, Grid, Stat } from '@rivocode/ui'

const CLIENTS = [
  'Clínica São Lucas',
  'Transportes Cabo Branco',
  'Supermercado Tambaú',
  'Construtora Litoral',
  'Padaria Manaíra',
]

/** Colunas que cabem */
export function AutoFill() {
  return (
    <Grid minItemWidth="12rem" gap="md" className="w-full max-w-3xl">
      {CLIENTS.map((client) => (
        <Card key={client}>
          <CardContent className="py-4">
            <p className="truncate text-base text-fg">{client}</p>
          </CardContent>
        </Card>
      ))}
    </Grid>
  )
}

/** Três colunas fixas */
export function FixedColumns() {
  return (
    <Grid columns={3} gap="lg" className="w-full max-w-3xl">
      <Stat label="Faturado" value="R$ 246,7 mil" />
      <Stat label="Recebido" value="R$ 198,4 mil" />
      <Stat label="Vencidas" value="6" />
    </Grid>
  )
}
