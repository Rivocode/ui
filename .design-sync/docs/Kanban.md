---
category: Dados
---

# Kanban

O quadro de colunas: cada coluna é uma situação, cada cartão é uma coisa que
anda entre elas. Notas que vão de "A emitir" a "Emitida", pedidos que vão de
"Recebido" a "Entregue". Os cartões arrastam entre colunas e dentro delas, com o
ponteiro, com o dedo e com o teclado. Vive em `@rivocode/ui/dnd`, atrás do
`@dnd-kit/core` e do `@dnd-kit/sortable`, que são dependências opcionais.

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

```tsx
import { Kanban } from '@rivocode/ui/dnd'

const [columns, setColumns] = useState([
  { id: 'todo', title: 'A emitir', items: pending },
  { id: 'review', title: 'Em análise', items: reviewing, limit: 4 },
  { id: 'done', title: 'Emitida', items: issued },
])

<Kanban
  aria-label="Notas de setembro"
  columns={columns}
  getKey={(note) => note.id}
  getLabel={(note) => `Nota ${note.number}`}
  onMove={({ itemId, from, to, index }) => setColumns((now) => move(now, itemId, from, to, index))}
  renderCard={(note) => (
    <div className="flex flex-col gap-1">
      <span className="font-medium">{note.client}</span>
      <span className="text-fg-muted">{currencyShort(note.amount)}</span>
    </div>
  )}
/>
```

## A peça é controlada

O quadro não guarda cartão nenhum. Durante o arrasto ele mostra onde o cartão
vai cair (é o único estado que ele tem), e ao soltar pede a mudança por
`onMove({ itemId, from, to, index })`: a chave do cartão, a coluna de onde ele
saiu, a coluna onde parou e a posição final dentro dela, contando do zero. Quem
muda `columns` é você, e o quadro desenha o que voltar. Sem mudar, o cartão
volta para onde estava.

É isso que deixa a mudança de situação passar pelo servidor antes: mudar a
nota de "Em análise" para "Emitida" costuma ser uma chamada, e ela pode
recusar.

Soltar no mesmo lugar, soltar fora de qualquer coluna e cancelar com Esc não
chamam `onMove`.

`getKey` é a identidade do cartão, única no quadro inteiro, e não só na coluna.

## Contagem e limite

Cada coluna diz quantos cartões tem, ao lado do nome. `limit` liga o limite de
trabalho em andamento: a contagem vira "3/4", e **acima do limite** ela fica no
tom de atenção e diz "Acima do limite" em texto, com ícone. Cor nunca é o único
sinal.

O limite avisa e não tranca: o cartão continua entrando, porque às vezes a
coluna precisa passar do limite por um dia, e quem decide isso é a pessoa. O
anúncio para o leitor de tela diz quando o cartão fez a coluna passar: "A coluna
Em análise passa do limite de 4.".

## Coluna vazia

Coluna sem cartão mostra uma área tracejada, "Nenhum cartão. Solte um aqui.", e
ela inteira aceita o cartão. Enquanto um cartão passa por cima, a coluna que vai
recebê-lo ganha o anel de foco.

## Teclado e leitor de tela

O cartão inteiro é a alça, e recebe foco com Tab.

| Tecla | O que faz |
| --- | --- |
| Espaço ou Enter | pega o cartão |
| Setas para cima e para baixo | movem dentro da coluna |
| Setas para os lados | levam o cartão para a coluna vizinha |
| Espaço ou Enter | solta |
| Esc | cancela, e o cartão volta para onde estava |

Cada passo é anunciado com o nome que `getLabel` devolve e o nome da coluna:
"Cartão Nota 1043 movido para Em análise, posição 2 de 3.". `labels` troca
esses textos, a contagem, o aviso de limite e o texto da coluna vazia.

## No celular

A fileira de colunas rola de lado e encaixa uma coluna por vez. Deslizar o dedo
sobre um cartão **rola o quadro**; para arrastar, a pessoa segura o cartão um
instante antes de mover. Sem isso, todo gesto de rolar pegaria o primeiro cartão
embaixo do dedo.

## Movimento

Os cartões da coluna abrem espaço com a mola espacial dos tokens, e o cartão que
anda segue o ponteiro numa cópia com `shadow-3`, enquanto o lugar de origem fica
tracejado. Ao soltar, a cópia assenta no lugar com a mesma mola
(`--rc-duration-spatial` e `--rc-ease-spatial`), e pelo teclado ela anda de
posição em posição com a mola também. Com "reduzir movimento", os tokens vão a
zero: a cópia pula de lugar e some sem assentar.

## Conteúdo do cartão

`renderCard` desenha o miolo; a moldura, o foco e a alça são da peça. Como o
cartão inteiro é um botão de arrastar, **não ponha outro botão dentro dele**:
controle dentro de controle confunde o leitor de tela e rouba o clique. Para
abrir o detalhe, use uma ação fora do quadro, ou a lista ao lado.

## Partes

`classNames` alcança `column`, `header`, `title`, `count`, `list`, `card` e
`empty`. O `card` veste também a cópia que segue o ponteiro, para as duas
saírem iguais.

## Quando não usar

- **Um item que só muda de posição é `SortableList`.** Se não há colunas (só
  uma fila que a pessoa ordena), o quadro é moldura sobrando.
- **Situação que só se lê é `DataTable`.** Quando a pessoa consulta muitas
  notas e raramente muda a situação de uma, a tabela com uma coluna de `Badge`
  mostra mais linhas, ordena e filtra. O quadro é para quem move cartão o dia
  inteiro.
- **Etapas de um único processo são `Steps`.** O `Steps` diz em que passo *uma*
  coisa está; o `Kanban` mostra *muitas* coisas, cada uma no seu passo.

## No React Native

Não porta, e não é fila: é decisão. **O quadro existe para o olho ver as colunas lado a lado**, e a 390px cabe uma. Arrastar um cartão para a coluna ao lado quer dizer segurar o dedo enquanto a fileira rola por baixo dele até uma coluna que ainda não está na tela, e o dedo que arrasta é o mesmo que precisaria rolar. No navegador do celular o `Kanban` do web continua de pé, com a fileira rolando uma coluna por vez e o cartão saindo do lugar só depois de o dedo segurá-lo, mas é o recurso de quem abriu uma tela de mesa no telefone, e não o desenho de um aplicativo.

**No telefone, cada coluna é uma lista, e mudar de coluna é uma ação.** As colunas viram `Tabs` (ou seções de uma `DataList`), a ordem dentro da coluna é a `SortableList` de `@rivocode/ui-native/dnd`, e cada cartão ganha um `Menu` com "Mover para" e o nome das outras colunas. É o mesmo `onMove({ itemId, from, to, index })` do web do lado de quem guarda o estado, e é o caminho que o leitor de tela já faria de qualquer jeito.
