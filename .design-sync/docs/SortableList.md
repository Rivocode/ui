---
category: Dados
---

# SortableList

A lista que a pessoa põe em ordem com as próprias mãos: a fila de emissão das
notas, as etapas de um processo, a prioridade das tarefas. Arrasta com o
ponteiro, com o dedo e com o teclado, e o leitor de tela ouve cada passo. Vive
em `@rivocode/ui/dnd`, atrás do `@dnd-kit/core` e do `@dnd-kit/sortable`, que
são dependências opcionais: só quem importa este caminho as instala.

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { SortableList } from '@rivocode/ui/dnd'

const [notes, setNotes] = useState(initialNotes)

<SortableList
  aria-label="Ordem de emissão"
  items={notes}
  getKey={(note) => note.id}
  getLabel={(note) => `Nota ${note.number}`}
  onReorder={setNotes}
  renderItem={(note) => (
    <Item>
      <ItemContent>
        <ItemTitle>{note.client}</ItemTitle>
        <ItemDescription>{currencyShort(note.amount)}</ItemDescription>
      </ItemContent>
    </Item>
  )}
/>
```

## A peça é controlada

`items` entra, a ordem nova sai pronta em `onReorder(items, { key, from, to })`,
e a peça desenha o que voltar. Ela não guarda ordem nenhuma sozinha: sem o pai
trocar `items`, o item volta para o lugar ao ser solto. É isso que deixa a
ordem ir ao servidor antes de mudar na tela, e voltar atrás se ele recusar.

Soltar no mesmo lugar e cancelar com Esc não chamam `onReorder`.

`getKey` é a identidade do item, e tem que ser única e estável: a chave que
anda com o item, e não a posição dele.

## Teclado e leitor de tela

O teclado não é uma alternativa de segunda: é o caminho de quem não usa mouse.

| Tecla | O que faz |
| --- | --- |
| Espaço ou Enter | pega o item com o foco na alça |
| Setas | movem o item uma posição |
| Espaço ou Enter | solta no lugar novo |
| Esc | cancela, e o item volta para onde estava |

Cada passo é anunciado numa região viva, com o nome que `getLabel` devolve:
"Item Nota 1043 pego. Posição 2 de 8.", "Item Nota 1043 movido para a
posição 3 de 8.", "Item Nota 1043 solto na posição 3 de 8.". A alça se chama
"Reordenar Nota 1043", e a instrução de teclado fica ligada a ela por
`aria-describedby`, para o leitor ler ao chegar e não a cada passo.

`labels` troca qualquer um desses textos, inclusive a palavra "Item", quando a
lista é de outra coisa:

```tsx
<SortableList
  items={steps}
  getKey={(step) => step.id}
  getLabel={(step) => step.name}
  onReorder={setSteps}
  labels={{
    moved: (label, position, total) => `Etapa ${label} agora é a ${position}ª de ${total}.`,
  }}
  renderItem={(step) => step.name}
/>
```

## A alça

`handle`, ligado por padrão, desenha um `IconButton` com o ícone de pegar no
início de cada linha, e **só ele arrasta**. O resto da linha continua
clicável, selecionável e, no celular, rolável: é a alça que trava a rolagem
enquanto o dedo está nela, e não a linha inteira.

Com `handle={false}` a peça não desenha alça, e quem arrasta é o elemento onde
você espalhar `handleProps`: a sua própria alça, ou a linha toda. Nesse modo o
toque pede para **segurar** o item antes de ele sair do lugar, e deslizar sem
segurar continua rolando a tela.

```tsx
<SortableList
  items={notes}
  getKey={(note) => note.id}
  onReorder={setNotes}
  handle={false}
  renderItem={(note, { handleProps, isDragging }) => (
    <div {...handleProps} className={isDragging ? 'shadow-2' : undefined}>
      {note.client}
    </div>
  )}
/>
```

## Horizontal

`orientation="horizontal"` vira uma fileira que rola de lado quando não cabe, e
as setas que andam passam a ser esquerda e direita.

## Movimento

Os vizinhos abrem espaço com a mola espacial dos tokens
(`--rc-duration-spatial` e `--rc-ease-spatial`), e o item arrastado sobe com
`shadow-2`. Com "reduzir movimento" ligado no sistema a duração dos tokens vai a
zero: os vizinhos trocam de lugar sem deslizar, e a rolagem que o teclado
provoca ao chegar à borda também deixa de ser suave.

## Estados

- **Vazia**: a lista monta sem nenhum item e sem alça. Diga o que falta com um
  `EmptyState` no lugar dela.
- **`disabled`**: a alça sai desabilitada e nada arrasta, nem pelo teclado. Use
  enquanto a ordem anterior ainda está sendo salva.

## Partes

`classNames` alcança `item` (o `li` que anda), `handle` (a alça) e `content`
(a caixa em volta do que `renderItem` desenha).

## Quando não usar

- **Ordem por critério é `DataTable`.** Se a pessoa quer ver as notas por valor
  ou por data, a coluna `sortable` resolve com um clique e sem ninguém mexer
  em nada. A `SortableList` é para a ordem que só a pessoa sabe, e que não
  sai de campo nenhum.
- **Mudar de grupo é `Kanban`.** Quando o item muda de situação ("A emitir"
  para "Emitida") e não só de posição, as colunas são a informação, e o quadro
  mostra as duas coisas.
- **Hierarquia é `Tree`.** Pôr um item dentro de outro não é reordenar.

## No React Native

Traduz, no caminho próprio `@rivocode/ui-native/dnd`, com os mesmos `items`, `getKey`, `renderItem`, `onReorder`, `getLabel`, `handle`, `orientation`, `disabled` e `labels`.

**Sem peer novo.** O gesto é o `PanResponder` do React Native, o mesmo do `Slider`, e não o react-native-gesture-handler: arrastar pela alça, num eixo só, é um gesto que o core resolve sozinho. A alça tem 44pt e segura o gesto até o dedo sair (ela não cede à rolagem da tela no meio do arrasto), e o resto da linha continua rolando a lista, como na alça de reordenar do iOS. Por isso, no celular, **só a alça arrasta**: com a linha inteira como alça, todo toque para rolar viraria um arrasto.

**O leitor de tela não arrasta: ele move.** Cada alça traz duas ações, "Mover para cima" e "Mover para baixo" (ou esquerda e direita, na horizontal), e cada uma anda um passo e anuncia a posição nova com o mesmo texto do web: "Item Nota 1043 movido para a posição 3 de 8". O arrasto também anuncia ao pegar, a cada posição e ao soltar.

Durante o arrasto uma cópia do item segue o dedo por cima da lista, e os vizinhos abrem espaço com a duração `base` dos tokens, sem movimento quando o sistema pede para reduzir. `handleProps` são o gesto e as ações, para espalhar numa `View` sua com `handle={false}`.
