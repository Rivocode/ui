import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import {
  Badge,
  Button,
  Card,
  Checkbox,
  RivoProvider,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  type RivoDensity,
  type RivoTheme,
} from '../src/index'

type Nota = {
  id: string
  cliente: string
  emissao: string
  valor: string
  status: 'paga' | 'aberta' | 'vencida'
}

const NOTAS: Nota[] = [
  { id: '4812', cliente: 'Prefeitura de Joao Pessoa', emissao: '02/08', valor: 'R$ 12.400,00', status: 'paga' },
  { id: '4813', cliente: 'Clinica Sao Lucas', emissao: '05/08', valor: 'R$ 3.280,00', status: 'aberta' },
  { id: '4814', cliente: 'Transportes Cabo Branco', emissao: '11/08', valor: 'R$ 8.750,00', status: 'vencida' },
  { id: '4815', cliente: 'Supermercado Tambau', emissao: '18/08', valor: 'R$ 1.940,00', status: 'aberta' },
]

const TOM = { paga: 'success', aberta: 'info', vencida: 'danger' } as const
const ROTULO = { paga: 'Paga', aberta: 'Aberta', vencida: 'Vencida' } as const

function Listagem({ theme, density }: { theme: RivoTheme; density: RivoDensity }) {
  const [marcadas, setMarcadas] = useState<string[]>(['4813'])

  const todas = marcadas.length === NOTAS.length
  const algumas = marcadas.length > 0 && !todas

  function alternar(id: string) {
    setMarcadas(atual =>
      atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id],
    )
  }

  return (
    <RivoProvider scope="local" theme={theme} density={density} className="p-8">
      <p className="mb-6 font-mono text-xs tracking-widest text-fg-subtle uppercase">
        {theme} / {density}
      </p>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="font-display text-2xl text-fg">Notas fiscais</h2>
          <Button size="sm">Emitir nota</Button>
        </div>

        <Tabs defaultValue="todas">
          <div className="px-5">
            <TabList>
              <Tab value="todas">Todas</Tab>
              <Tab value="abertas">Abertas</Tab>
              <Tab value="vencidas">Vencidas</Tab>
            </TabList>
          </div>

          <TabPanel value="todas" className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Selecionar todas"
                      checked={todas}
                      indeterminate={algumas}
                    />
                  </TableHead>
                  <TableHead>Numero</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Emissao</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {NOTAS.map(nota => (
                  <TableRow key={nota.id} selected={marcadas.includes(nota.id)}>
                    <TableCell>
                      <Checkbox
                        aria-label={`Selecionar nota ${nota.id}`}
                        checked={marcadas.includes(nota.id)}
                        onCheckedChange={() => alternar(nota.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm text-fg-muted">{nota.id}</TableCell>
                    <TableCell>{nota.cliente}</TableCell>
                    <TableCell className="text-fg-muted">{nota.emissao}</TableCell>
                    <TableCell>
                      <Badge tone={TOM[nota.status]} size="sm">{ROTULO[nota.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{nota.valor}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="iconSm" aria-label="Mais acoes">
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabPanel>
        </Tabs>
      </Card>
    </RivoProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <div>
    <Listagem theme="rivocode-dark" density="comfortable" />
    <Listagem theme="rivocode-light" density="compact" />
  </div>,
)
