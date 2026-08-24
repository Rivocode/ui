import { Meter } from '@rivocode/ui'

export function Capacidade() {
  return (
    <div className="flex w-72 flex-col gap-6">
      <Meter value={24} label="Notas do plano" showValue />
      <Meter value={72} label="Espaco de arquivos" showValue />
      <Meter value={96} label="Limite de emissao" showValue />
    </div>
  )
}
