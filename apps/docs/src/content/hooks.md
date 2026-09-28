A biblioteca exporta, da raiz, os hooks que toda tela acaba escrevendo à mão:
abrir e fechar, esperar a pessoa parar de digitar, lembrar um filtro entre
visitas, pedir a próxima página quando a lista chega ao fim. Eles não trazem
dependência nova, e são os mesmos que as peças usam por dentro: o `Clipboard`
copia com `useClipboard`, o `Carousel` e os gráficos param de animar com
`useReducedMotion`, e o `EventCalendar` move a linha de agora com `useInterval`.

```tsx
import { useDebouncedValue, useDisclosure, useLocalStorage } from '@rivocode/ui'
```

Todos limpam o que abriram quando o componente desmonta: timer, escuta de
evento, observer. E todos renderizam no servidor sem tocar em `window`: o que
depende do navegador devolve o valor neutro no HTML e se corrige na hidratação.

## Estado

### useDisclosure

Aberto ou fechado, com as três ações. `onOpen` e `onClose` só disparam na
passagem de estado, e não a cada chamada.

```tsx
const [opened, { open, close, toggle }] = useDisclosure(false, {
  onClose: () => form.reset(),
})

<Button onClick={open}>Nova nota</Button>
<Dialog open={opened} onOpenChange={(next) => (next ? open() : close())}>…</Dialog>
```

### useToggle

Alterna entre `false` e `true`, ou gira numa lista de opções. Um argumento que
é uma das opções vira o valor; qualquer outro, como o evento de um `onClick`,
só alterna.

```tsx
const [view, toggleView] = useToggle(['tabela', 'cartões'] as const)

<Button variant="secondary" onClick={() => toggleView()}>Ver como {view}</Button>
```

### useCounter

Um número com piso, teto e passo. Passar do limite para no limite, sem erro.

```tsx
const [quantity, { increment, decrement }] = useCounter(1, { min: 1, max: 10 })
```

### useListState

Uma lista com as operações imutáveis de que uma tela precisa: `append`,
`prepend`, `insert`, `remove`, `reorder`, `swap`, `replace`, `update`, `filter`
e `set`. Cada uma devolve uma lista nova, e os handlers são os mesmos entre
renders.

```tsx
const [items, handlers] = useListState<Item>([])

handlers.append({ id: crypto.randomUUID(), description: '' })
handlers.reorder({ from: 2, to: 0 })
handlers.remove(index)
```

### useSetState

Um objeto de estado que aceita o pedaço que mudou, e mescla. É o `setState` das
classes, para quem guarda filtros num objeto só.

```tsx
const [filters, setFilters] = useSetState({ status: 'todas', page: 1 })

setFilters({ status: 'vencidas', page: 1 })
setFilters((current) => ({ page: current.page + 1 }))
```

### usePrevious

O valor anterior **diferente** do atual, e não o do render anterior: renderizar
de novo com o mesmo valor não apaga a memória.

```tsx
const previous = usePrevious(total)
const grew = previous !== undefined && total > previous
```

## Tempo

### useDebouncedValue

O valor só assenta depois de uma pausa. É o que se passa para a consulta,
enquanto o campo continua ligado ao valor cru. O segundo item cancela a espera.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
const invoices = useInvoices({ search: settled })
```

### useDebouncedCallback e useThrottledCallback

A função devolvida é estável e chama sempre a versão mais nova da sua. O
debounce roda uma vez, com o último argumento, depois da pausa; o throttle roda
na hora e entrega o último da janela no fim dela. As duas têm `cancel`, `flush`
e `isPending`, e cancelam sozinhas no desmonte.

```tsx
const save = useDebouncedCallback((draft: Draft) => api.save(draft), 800)
const track = useThrottledCallback((top: number) => setShadow(top > 0), 100)
```

### useInterval e useTimeout

Declarativos: `null` no atraso pausa. O `useTimeout` devolve `clear` e
`reset`, para o aviso que some sozinho e recomeça a contar quando o mouse passa.

```tsx
useInterval(() => refetch(), online ? 30_000 : null)

const { clear, reset } = useTimeout(() => setVisible(false), 5000)
```

### useIdle

Verdadeiro depois de um prazo sem teclado, ponteiro, roda ou toque.

```tsx
const idle = useIdle(5 * 60_000)
```

## Navegador

### useLocalStorage e useSessionStorage

O valor guardado em JSON, com o padrão enquanto nada foi gravado. Duas chamadas
com a mesma chave andam juntas na mesma aba, e o `localStorage` acompanha a
outra aba pelo evento `storage`. Armazenamento bloqueado ou cheio não derruba a
tela: o valor segue em memória. No servidor, vale o padrão.

```tsx
const [columns, setColumns, resetColumns] = useLocalStorage({
  key: 'faturas:colunas',
  defaultValue: ['número', 'cliente', 'valor'],
})
```

### useClickOutside

Devolve a `ref` do elemento; o clique fora dele chama a função. `nodes` diz o
que mais conta como dentro, como o gatilho que abriu o painel.

```tsx
const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), { enabled: open })
```

Antes de usar, confira se a peça já não resolve: `Popover`, `Menu`, `Dialog` e
`Sheet` fecham no clique fora sozinhos.

### useHotkeys

Atalho de teclado no documento. `mod` é Cmd no Mac e Ctrl fora dele, e os
modificadores precisam bater exatamente: `mod+k` não dispara com
`mod+shift+k`. Com o foco num campo de texto o atalho não dispara, para `k` não
roubar a letra de quem digita; desligue com `ignoreFields: false` quando o
atalho precisar valer dentro do campo.

```tsx
useHotkeys([
  ['mod+k', () => setPaletteOpen(true)],
  ['shift+n', () => startInvoice()],
  ['?', () => setHelpOpen(true)],
])
```

A tecla é comparada pelo caractere que ela digita, e não pela posição no
teclado. Três regras saem disso:

- **Símbolo ignora o shift.** Em `?`, `+`, `!` ou nos dígitos, o shift é o que
  o layout exige para chegar ao caractere, então ele não conta: `?` dispara com
  o `shift+/` do teclado americano e com a tecla própria do ABNT2, e `1` dispara
  no AZERTY, onde o dígito pede shift. Escreva o caractere que sai (`?`), e não
  a combinação que o produz: `shift+/` também é aceito, mas é traduzido pelo
  teclado americano. Em letra o shift conta, e `a` não dispara com `A`.
- **Letra vale pelo caractere.** No AZERTY, `z` dispara na tecla que digita
  `z`, e não na tecla que fica onde o `Z` americano fica.
- **A posição só vale quando o caractere não diz qual é a tecla**: o `˚` do
  Option+K no Mac, a letra cirílica do Ctrl+C num teclado russo, o
  `Unidentified`. A fileira de números vale sempre pela posição, para `mod+1`
  funcionar no AZERTY, onde a tecla digita `&`.

### useInfiniteScroll

A próxima página quando a sentinela no fim da lista entra na tela, com folga de
200px. Nada é pedido enquanto `loading` for verdadeiro ou `hasMore` for falso,
e a sentinela é observada de novo quando a página chega: se a lista ainda não
encheu a tela, a próxima é pedida sem esperar rolagem.

```tsx
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore: hasNextPage,
  loading: isFetchingNextPage,
})

<ul>{rows}</ul>
<div ref={sentinelRef} />
```

Para milhares de linhas, junte com a `VirtualList`: ela desenha só o que está
na tela.

### useIntersection

A última entrada do `IntersectionObserver` para o elemento da `ref`.

```tsx
const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 0.5 })
const seen = entry?.isIntersecting ?? false
```

### useElementSize

Largura e altura do elemento, pelo `ResizeObserver`. Zero no servidor.

```tsx
const { ref, width } = useElementSize<HTMLDivElement>()
const columns = width > 720 ? 3 : 1
```

Se a pergunta é sobre a janela, e não sobre um elemento, é classe utilitária
com `sm:` e `lg:`, ou `useMobile()`.

### useClipboard

`copy` devolve se deu certo; `copied` fica verdadeiro pelo `timeout` e volta
sozinho. A falha fica em `error`.

```tsx
const { copy, copied } = useClipboard({ timeout: 2000 })

<Button variant="secondary" onClick={() => copy(accessKey)}>
  {copied ? 'Copiado' : 'Copiar chave'}
</Button>
```

Para o botão de copiar comum, a peça `Clipboard` já é isso, com o ícone e o
nome acessível que muda.

### useReducedMotion, useDocumentTitle e useNetworkStatus

```tsx
const reduced = useReducedMotion()
useDocumentTitle(`${count} faturas vencidas`)
const { online } = useNetworkStatus()
```

`useReducedMotion` segue a preferência do sistema; `useDocumentTitle` ignora
título vazio e só devolve o de antes com `restoreOnUnmount`; `useNetworkStatus`
diz `true` no servidor, para a faixa de "sem conexão" não piscar no primeiro
quadro.

### useMounted e useIsFirstRender

`useMounted` é falso no servidor e na hidratação, e verdadeiro depois: é o
que separa o que só existe no navegador. `useIsFirstRender` é verdadeiro só no
primeiro render.

```tsx
const mounted = useMounted()
return mounted ? <RelativeTime value={sentAt} /> : null
```

### useMediaQuery e useMobile

Já existiam, e continuam onde estavam: `useMobile()` é o mesmo corte de 640px
que as peças leem.

## O que não existe, de propósito

**`useFocusTrap`.** A Base UI já prende o foco onde ele precisa ficar preso:
`Dialog`, `AlertDialog`, `Sheet`, e o `Popover` com `modal` e um
`PopoverClose` dentro. Prender o foco fora de
uma sobreposição é o que a WCAG 2.1.2 chama de armadilha de teclado; se a tela
pede isso, ela pede uma dessas peças.

## No React Native

`@rivocode/ui-native` exporta os doze que não dependem do navegador, com o
mesmo código do web - o arquivo é gerado a partir da mesma fonte, e não copiado:
`useDisclosure`, `useToggle`, `useCounter`, `useListState`, `useSetState`,
`usePrevious`, `useIsFirstRender`, `useDebouncedValue`, `useDebouncedCallback`,
`useThrottledCallback`, `useInterval` e `useTimeout`.

```tsx
import { useDebouncedValue, useDisclosure } from '@rivocode/ui-native'
```

Os outros não portam, e cada um tem o motivo:

| Hook | Por que não | No lugar |
| --- | --- | --- |
| `useLocalStorage`, `useSessionStorage` | Não há Web Storage; o AsyncStorage é assíncrono e não é peer | o armazenamento do app |
| `useClickOutside` | Não há clique fora de uma árvore de toque | o `Sheet` e o `Dialog` fecham no fundo |
| `useHotkeys` | Não há teclado global no aparelho | — |
| `useInfiniteScroll`, `useIntersection` | A lista nativa já faz | `onEndReached` e `onViewableItemsChanged` da `FlatList` |
| `useElementSize` | O layout já mede | `onLayout` |
| `useClipboard` | O `expo-clipboard` é peer opcional, atrás de `./clipboard` | a peça `Clipboard` de lá |
| `useReducedMotion` | A Reanimated, que já é peer, exporta o seu | `useReducedMotion` da Reanimated |
| `useDocumentTitle` | Não há documento | — |
| `useNetworkStatus` | Pediria o NetInfo, que não é peer | `@react-native-community/netinfo` no app |
| `useIdle` | Não há evento de atividade global | `AppState` |
| `useMounted` | Não há servidor nem hidratação | — |
