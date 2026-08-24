import { Button, Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@rivocode/ui'

/** Painel */
export function Panel() {
  return (
    <div className="min-h-60">
      <Popover defaultOpen>
        <PopoverTrigger render={<Button variant="outline" />}>Período</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Período do relatório</PopoverTitle>
          <PopoverDescription>O intervalo vale para o total e para a lista de notas.</PopoverDescription>
          <div className="mt-4 flex justify-end">
            <PopoverClose render={<Button variant="secondary" size="sm" />}>Aplicar</PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
