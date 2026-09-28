import { AspectRatio, Card, CardContent } from '@rivocode/ui'

/** Dezesseis por nove */
export function Widescreen() {
  return (
    <div className="w-full max-w-md">
      <AspectRatio ratio={16 / 9} className="rounded-lg border border-border bg-surface-raised">
        <div className="flex size-full items-center justify-center text-sm text-fg-subtle">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  )
}

/** Num cartão de produto */
export function InACard() {
  return (
    <Card className="w-64 overflow-hidden">
      <AspectRatio ratio={1} className="bg-surface-raised">
        <div className="flex size-full items-center justify-center text-sm text-fg-subtle">
          Quadrada
        </div>
      </AspectRatio>
      <CardContent>
        <p className="text-fg">Impressora fiscal</p>
        <p className="text-sm text-fg-muted">A moldura já tem altura antes da imagem chegar.</p>
      </CardContent>
    </Card>
  )
}
