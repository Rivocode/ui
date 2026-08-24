import { Progress } from '@rivocode/ui'

/** Com rótulo */
export function WithLabel() {
  return (
    <div className="flex w-80 flex-col gap-6">
      <Progress value={62} label="Enviando notas" showValue />
      <Progress value={100} label="Concluido" showValue />
    </div>
  )
}
