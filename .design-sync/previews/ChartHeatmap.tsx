import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@rivocode/ui'
import { ChartHeatmap } from '@rivocode/ui/chart'

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const HOURS = Array.from({ length: 12 }, (_, index) => `${index + 8}h`)

const BUSY: Record<string, number> = {
  Seg: 1.2,
  Ter: 1,
  Qua: 1.1,
  Qui: 0.9,
  Sex: 1.4,
  Sáb: 0.3,
  Dom: 0,
}

const EMISSIONS = DAYS.flatMap((day) =>
  HOURS.map((hour, index) => ({
    day,
    hour,
    total:
      day === 'Dom' ? null : Math.round(BUSY[day]! * (6 + 10 * Math.sin((index / 11) * Math.PI))),
  })),
).filter((cell) => !(cell.day === 'Sáb' && Number.parseInt(cell.hour) > 13))

/** Emissões por dia e hora */
export function EmissionsByHour() {
  return (
    <Card className="w-[36rem]">
      <CardHeader>
        <CardTitle>Quando as notas saem</CardTitle>
        <CardDescription>Notas emitidas por hora, na última semana.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartHeatmap
          data={EMISSIONS}
          rowKey="day"
          columnKey="hour"
          valueKey="total"
          rows={DAYS}
          columns={HOURS}
          label="Notas emitidas por dia da semana e hora"
        />
      </CardContent>
    </Card>
  )
}

const TICKETS = [
  { team: 'Fiscal', week: 'S1', open: 4 },
  { team: 'Fiscal', week: 'S2', open: 0 },
  { team: 'Fiscal', week: 'S3', open: 9 },
  { team: 'Cobrança', week: 'S1', open: 12 },
  { team: 'Cobrança', week: 'S2', open: 7 },
  { team: 'Cobrança', week: 'S3', open: 3 },
  { team: 'Cadastro', week: 'S1', open: 1 },
  { team: 'Cadastro', week: 'S3', open: 2 },
]

/** Zero e vazio não são a mesma coisa */
export function ZeroIsNotEmpty() {
  return (
    <div className="w-80">
      <ChartHeatmap
        data={TICKETS}
        rowKey="team"
        columnKey="week"
        valueKey="open"
        color="var(--rc-chart-3)"
        label="Chamados abertos por equipe e semana"
        emptyLabel="Sem apuração"
      />
    </div>
  )
}
