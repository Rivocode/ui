import { Meter } from '@rivocode/ui'

/** Capacidade */
export function Capacity() {
  return (
    <div className="flex w-72 flex-col gap-6">
      <Meter value={24} label="Notas do plano" showValue />
      <Meter value={72} label="Espaco de arquivos" showValue />
      <Meter value={96} label="Limite de emissão" showValue />
    </div>
  )
}
