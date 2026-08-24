import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@rivocode/ui'

export function Aberto() {
  return (
    <div className="w-80">
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Dados de quem emite</CollapsibleTrigger>
        <CollapsiblePanel>
          RivoCode Tecnologia, 12.345.678/0001-99, Joao Pessoa PB.
        </CollapsiblePanel>
      </Collapsible>
    </div>
  )
}

export function Fechado() {
  return (
    <div className="w-80">
      <Collapsible>
        <CollapsibleTrigger>Dados de quem recebe</CollapsibleTrigger>
        <CollapsiblePanel>Clinica Sao Lucas, 98.765.432/0001-10.</CollapsiblePanel>
      </Collapsible>
    </div>
  )
}
