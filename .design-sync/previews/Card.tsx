import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@rivocode/ui'

export function Completo() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Resumo do mes</CardTitle>
        <CardDescription>Agosto de 2026</CardDescription>
      </CardHeader>
      <CardContent>
        Doze notas processadas, tres pendentes de aprovacao e nenhuma vencida.
      </CardContent>
      <CardFooter>
        <Button size="sm">Ver detalhes</Button>
        <Button size="sm" variant="ghost">Exportar</Button>
      </CardFooter>
    </Card>
  )
}

export function Elevacoes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plano</CardTitle>
          <CardDescription>Sobre o fundo da pagina</CardDescription>
        </CardHeader>
        <CardContent>A superficie padrao, para conteudo em lista.</CardContent>
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
