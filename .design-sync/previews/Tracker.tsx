import { Stat, Tracker } from '@rivocode/ui'

const EMISSOES = Array.from({ length: 30 }, (_, index) => {
  const dia = 30 - index
  if (dia === 12) return { tone: 'danger' as const, label: `Dia ${dia}: 3 rejeitadas` }
  if (dia === 11) return { tone: 'warning' as const, label: `Dia ${dia}: fila acima do normal` }
  if (dia === 4) return { tone: 'neutral' as const, label: `Dia ${dia}: sem emissão` }
  return { tone: 'success' as const, label: `Dia ${dia}: todas autorizadas` }
})

/** Últimos 30 dias */
export function LastThirtyDays() {
  return (
    <div className="w-96">
      <Stat
        label="Emissões autorizadas"
        value="1.284"
        delta={4}
        deltaLabel="sobre o mês passado"
        deltaVariant="pill"
        footer={<Tracker label="Emissões dos últimos 30 dias" data={EMISSOES} />}
      />
    </div>
  )
}
