O conjunto é o [lucide](https://lucide.dev), instalado como `lucide-react` e
declarado como dependência de par obrigatória: mesmo traço, mesma grade, e o
`size` numérico dispensa classe. Nunca emoji no lugar de ícone, e nunca um
segundo conjunto misturado: dois traços diferentes na mesma tela parecem duas
marcas.

## Tamanho por contexto

| Onde | Tamanho |
|---|---|
| Dentro de controle (`Button`, `Tab`, item de menu) | `size={16}` |
| Junto de texto `sm`/`xs` (célula, meta, eyebrow) | `size={14}` |
| Miúdo em linha apertada (hint do `Stat`, delta) | `size={13}` |

O alvo de toque continua sendo 24px no mínimo: ícone menor cresce o botão e
devolve o espaço com margem negativa, como o hint do `Stat` faz.

## Nome acessível

Ícone decorativo (que acompanha um texto que já diz tudo) leva
`aria-hidden="true"`. Ícone que é o único conteúdo de um botão exige
`aria-label` **no botão**, nunca no ícone:

```tsx
<Button size="icon" aria-label="Mais filtros">
  <SlidersHorizontal size={16} aria-hidden="true" />
</Button>
```

## O vocabulário

Um conceito, um ícone. O lucide tem sinônimo para quase tudo (`Trash` e
`Trash2`, `Gear` e `Settings`), e cada sinônimo que entra é uma tela que parece
de outro produto. Esta é a tabela canônica; conceito novo entra aqui antes de
entrar no código.

| Conceito | Ícone |
|---|---|
| adicionar / criar | `Plus` |
| excluir | `Trash2` |
| editar | `Pencil` |
| buscar | `Search` |
| baixar / exportar | `Download` |
| enviar arquivo | `Upload` |
| copiar | `Copy` |
| confirmado / feito | `Check` |
| fechar / limpar | `X` |
| mais ações | `MoreHorizontal` |
| filtros finos | `SlidersHorizontal` |
| recarregar | `RefreshCw` |
| ver / prévia | `Eye` |
| link que sai do produto | `ExternalLink` |
| sair da conta | `LogOut` |
| abre um nível (item, breadcrumb) | `ChevronRight` |
| expande para baixo (select, accordion) | `ChevronDown` |
| página anterior / voltar | `ChevronLeft` |
| ordenável sem ordem | `ChevronsUpDown` |
| variação para cima / para baixo | `ArrowUpRight` / `ArrowDownRight` |
| documento / nota | `FileText` |
| pessoas / clientes | `Users` |
| ajustes do sistema | `Settings` |
| data | `CalendarDays` |
| painel | `LayoutDashboard` |
| explicação curta | `Info` |
| agente / IA | `Bot` |
