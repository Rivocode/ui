import { Badge, DescriptionItem, DescriptionList } from '@rivocode/ui'
import { currencyShort } from '@rivocode/ui/chart'

/** Folha de detalhes */
export function Default() {
  return (
    <div className="w-full max-w-sm">
      <DescriptionList>
        <DescriptionItem label="CNPJ">
          <span className="font-mono">12.345.678/0001-90</span>
        </DescriptionItem>
        <DescriptionItem label="Emissão">05/08/2026</DescriptionItem>
        <DescriptionItem label="Vencimento">17/09/2026</DescriptionItem>
        <DescriptionItem label="Situação">
          <Badge tone="success" size="sm">
            Paga
          </Badge>
        </DescriptionItem>
        <DescriptionItem label="Valor">
          <span className="font-mono">{currencyShort(2480)}</span>
        </DescriptionItem>
      </DescriptionList>
    </div>
  )
}
