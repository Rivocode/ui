# Hooks utilitários

Antes de escrever um `useEffect` com `setTimeout`, `addEventListener` ou
`localStorage`, procure aqui: a biblioteca exporta da raiz os hooks que toda
tela reescreve, sem dependência nova, e cada um limpa o que abriu no desmonte e
renderiza no servidor sem tocar em `window`.

```tsx
import { useDebouncedValue, useDisclosure, useLocalStorage } from '@rivocode/ui'
```

## Qual usar

| Preciso de | Hook |
|---|---|
| Aberto e fechado, com `open`, `close`, `toggle` | `useDisclosure(inicial, { onOpen, onClose })` |
| Alternar booleano, ou girar numa lista de opções | `useToggle()`, `useToggle(['a', 'b'])` |
| Número com piso, teto e passo | `useCounter(1, { min, max, step })` |
| Lista com `append`, `remove`, `reorder`, `swap`, `update` imutáveis | `useListState(inicial)` |
| Objeto de estado que mescla o pedaço que mudou | `useSetState(inicial)` |
| O valor anterior diferente do atual | `usePrevious(valor)` |
| O valor só depois de a pessoa parar de digitar | `useDebouncedValue(valor, 300)` |
| A função só depois da pausa, ou no máximo uma vez por janela | `useDebouncedCallback(fn, ms)`, `useThrottledCallback(fn, ms)` |
| Repetir, ou esperar uma vez, com pausa por `null` | `useInterval(fn, ms)`, `useTimeout(fn, ms)` |
| Saber se a pessoa está ausente | `useIdle(ms)` |
| Lembrar entre visitas, sincronizado entre abas | `useLocalStorage({ key, defaultValue })`, `useSessionStorage` |
| Fechar no clique fora | `useClickOutside(fn, { nodes, enabled })` |
| Atalho de teclado, `mod` = Cmd no Mac e Ctrl fora | `useHotkeys([['mod+k', fn]])` |
| Próxima página quando a lista chega ao fim | `useInfiniteScroll({ onLoadMore, hasMore, loading })` |
| Visibilidade de um elemento | `useIntersection({ threshold })` |
| Largura e altura de um elemento | `useElementSize()` |
| Copiar com confirmação que volta sozinha | `useClipboard({ timeout })` |
| Respeitar "reduzir movimento" | `useReducedMotion()` |
| Título da aba | `useDocumentTitle(titulo)` |
| Online ou offline | `useNetworkStatus()` |
| Só no navegador, depois da hidratação | `useMounted()`, `useIsFirstRender()` |
| O corte de celular das peças | `useMobile()`, `useMediaQuery(query)` |

## As regras que mudam o código

**A busca vai com o valor assentado, e o campo com o cru.** O campo segue
ligado ao estado de cada tecla; o que desce para a consulta é o do
`useDebouncedValue`.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
```

**A peça vem antes do hook.** `Popover`, `Menu`, `Dialog` e `Sheet` já fecham
no clique fora e já prendem o foco; o `Clipboard` já é o botão de copiar com o
nome acessível que muda. `useClickOutside` e `useClipboard` são para o que a
peça não cobre.

**`useFocusTrap` não existe, de propósito.** A Base UI prende o foco nas
sobreposições modais. Se a tela precisa de foco preso, ela precisa de um
`Dialog` ou de um `Sheet`.

**Atalho não rouba letra de quem digita.** `useHotkeys` não dispara com o foco
num campo de texto; passe `ignoreFields: false` só no atalho que precisa valer
dentro do campo, como `mod+k` de uma paleta. Os modificadores batem
exatamente: `mod+k` não dispara com `mod+shift+k`.

```tsx
useHotkeys([['mod+k', () => setPaletteOpen(true)]], { ignoreFields: false })
```

**`useToggle` recebe o valor, e não o evento.** Com argumento que é uma das
opções, ele vira o valor; sem argumento, alterna. Ligue ao botão dentro de uma
seta, `onClick={() => toggleExpanded()}`, e não com a função solta.

```tsx
const [expanded, toggleExpanded] = useToggle()
const [view, toggleView] = useToggle(['tabela', 'cartões'] as const)
```

**A sentinela vai depois da lista.** `useInfiniteScroll` para de observar
enquanto `loading` é verdadeiro e volta a observar quando a página chega, então
lista curta pede a próxima sem esperar rolagem.

```tsx
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore: hasNextPage,
  loading: isFetchingNextPage,
})
```

## No React Native

`@rivocode/ui-native` exporta, da raiz, os doze que não dependem do navegador:
`useDisclosure`, `useToggle`, `useCounter`, `useListState`, `useSetState`,
`usePrevious`, `useIsFirstRender`, `useDebouncedValue`, `useDebouncedCallback`,
`useThrottledCallback`, `useInterval` e `useTimeout`. O código é o mesmo do
web, gerado da mesma fonte.

Os de navegador não portam. No lugar: `onEndReached` da `FlatList` para lista
infinita, `onLayout` para tamanho, `useReducedMotion` da Reanimated, `AppState`
para ausência, e o armazenamento do próprio app para lembrar entre sessões.
`useNetworkStatus` pediria o NetInfo, que não é peer.
