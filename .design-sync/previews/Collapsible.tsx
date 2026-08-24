import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@rivocode/ui'

/** Aberto */
export function Open() {
  return (
    <div className="w-80">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Dados de quem emite</CollapsibleTrigger>
        <CollapsiblePanel>
          RivoCode Tecnologia, 12.345.678/0001-99, João Pessoa PB.
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}

/** Fechado */
export function ClosedState() {
  return (
    <div className="w-80">
      <Collapsible>
        <CollapsibleTrigger>Dados de quem recebe</CollapsibleTrigger>
        <CollapsiblePanel>Clínica São Lucas, 98.765.432/0001-10.</CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
