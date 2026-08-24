import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@rivocode/ui'

/** Completo */
export function Full() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Resumo do mês</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent>
        Doze notas processadas, três pendentes de aprovação e nenhuma vencida.
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="ghost">Exportar</Button>
      </CardFooter>
    </Card>
  )
}

/** Elevações */
export function Elevations() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plano</CardTitle>
          <CardDescription>Sobre o fundo da página</CardDescription>
        </CardHeader>
        <CardContent>A superficie padrão, para conteudo em lista.</CardContent>
      </Card>
      <Card elevation="raised">
        <CardHeader>
          <CardTitle>Levantado</CardTitle>
          <CardDescription>Com sombra</CardDescription>
        </CardHeader>
        <CardContent>Para o que precisa saltar do resto da tela.</CardContent>
      </Card>
    </div>
  )
}
