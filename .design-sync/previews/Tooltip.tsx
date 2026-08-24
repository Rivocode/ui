import { Trash2 } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@rivocode/ui'

/** Em botão de ícone */
export function OnAnIconButton() {
  return (
    <div className="flex min-h-32 items-end justify-center">
      <Tooltip defaultOpen>
        <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Excluir" />}>
          <Trash2 size={16} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>Excluir nota</TooltipContent>
      </Tooltip>
    </div>
  )
}

/** Fechada */
export function Closed() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="secondary" size="sm" />}>Passe o mouse</TooltipTrigger>
      <TooltipContent>A dica aparece depois de um instante</TooltipContent>
    </Tooltip>
  )
}
