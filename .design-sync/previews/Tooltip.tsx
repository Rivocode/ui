import { Trash2 } from 'lucide-react'
import { Button, IconButton, Tooltip, TooltipContent, TooltipTrigger } from '@rivocode/ui'

/** Em botão de ícone */
export function OnAnIconButton() {
  return (
    <div className="flex min-h-32 items-end justify-center">
      <Tooltip defaultOpen /* rc-keep-open */>
        <TooltipTrigger
          render={
            <IconButton variant="ghost" label="Excluir">
              <Trash2 size={16} aria-hidden="true" />
            </IconButton>
          }
        />
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
