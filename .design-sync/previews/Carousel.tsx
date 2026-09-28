import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Carousel } from '@rivocode/ui'
import { useState } from 'react'

const PLANS = [
  { name: 'Básico', price: 'R$ 49', notes: '30 notas por mês' },
  { name: 'Profissional', price: 'R$ 99', notes: '150 notas por mês' },
  { name: 'Empresa', price: 'R$ 199', notes: '600 notas por mês' },
  { name: 'Contador', price: 'R$ 349', notes: 'Até 20 empresas' },
  { name: 'Franquia', price: 'Sob consulta', notes: 'Unidades ilimitadas' },
]

const NEWS = [
  'A emissão de NFS-e nacional está liberada para todos os municípios conveniados.',
  'O relatório de impostos retidos agora sai em planilha, com uma aba por mês.',
  'O Pix por aproximação chegou ao aplicativo: a cobrança sai com o celular encostado.',
]

/** Um por vez */
export function OneAtATime() {
  return (
    <Carousel label="Novidades" indicators>
      {NEWS.map((text) => (
        <Card key={text}>
          <CardContent>
            <p className="text-sm text-fg">{text}</p>
          </CardContent>
        </Card>
      ))}
    </Carousel>
  )
}

/** Vários lado a lado, conforme a largura */
export function Responsive() {
  return (
    <Carousel label="Planos" slidesPerView={{ base: 1, sm: 2, lg: 3 }} indicators>
      {PLANS.map((plan) => (
        <Card key={plan.name} className="h-full">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.notes}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl text-fg">{plan.price}</p>
          </CardContent>
        </Card>
      ))}
    </Carousel>
  )
}

/** Largura pela classe do slide */
export function AutoWidth() {
  return (
    <Carousel label="Planos" slidesPerView="auto" gap="sm" classNames={{ slide: 'w-56' }}>
      {PLANS.map((plan) => (
        <Card key={plan.name} className="h-full">
          <CardHeader>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.notes}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge tone="neutral">{plan.price}</Badge>
          </CardContent>
        </Card>
      ))}
    </Carousel>
  )
}

/** Controlado */
export function Controlled() {
  const [index, setIndex] = useState(0)

  return (
    <div className="flex flex-col gap-2">
      <Carousel label="Planos" index={index} onIndexChange={setIndex} loop>
        {PLANS.map((plan) => (
          <Card key={plan.name}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.price}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </Carousel>
      <p className="text-sm text-fg-muted">
        Plano na frente: {PLANS[index]?.name}
      </p>
    </div>
  )
}

/** Com rotação, e o botão de pausa */
export function Autoplay() {
  return (
    <Carousel label="Novidades" autoplay={6000} indicators>
      {NEWS.map((text) => (
        <Card key={text}>
          <CardContent>
            <p className="text-sm text-fg">{text}</p>
          </CardContent>
        </Card>
      ))}
    </Carousel>
  )
}
