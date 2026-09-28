The library exports, from the root, the hooks every screen ends up writing by
hand: open and close, wait for the person to stop typing, remember a filter
between visits, ask for the next page when the list reaches the end. They bring
no new dependency, and they are the same ones the pieces use inside:
`Clipboard` copies with `useClipboard`, `Carousel` and the charts stop
animating with `useReducedMotion`, and `EventCalendar` moves the now line with
`useInterval`.

```tsx
import { useDebouncedValue, useDisclosure, useLocalStorage } from '@rivocode/ui'
```

They all clean up what they opened when the component unmounts: timer, event
listener, observer. And they all render on the server without touching
`window`: what depends on the browser returns the neutral value in the HTML and
corrects itself on hydration.

## State

### useDisclosure

Open or closed, with the three actions. `onOpen` and `onClose` only fire on a
state transition, not on every call.

```tsx
const [opened, { open, close, toggle }] = useDisclosure(false, {
  onClose: () => form.reset(),
})

<Button onClick={open}>Nova nota</Button>
<Dialog open={opened} onOpenChange={(next) => (next ? open() : close())}>…</Dialog>
```

### useToggle

Toggles between `false` and `true`, or cycles through a list of options. An
argument that is one of the options becomes the value; anything else, like a
`onClick` event, just toggles.

```tsx
const [view, toggleView] = useToggle(['tabela', 'cartões'] as const)

<Button variant="secondary" onClick={() => toggleView()}>Ver como {view}</Button>
```

### useCounter

A number with a floor, a ceiling and a step. Going past the limit stops at the
limit, with no error.

```tsx
const [quantity, { increment, decrement }] = useCounter(1, { min: 1, max: 10 })
```

### useListState

A list with the immutable operations a screen needs: `append`, `prepend`,
`insert`, `remove`, `reorder`, `swap`, `replace`, `update`, `filter` and
`set`. Each one returns a new list, and the handlers are the same across
renders.

```tsx
const [items, handlers] = useListState<Item>([])

handlers.append({ id: crypto.randomUUID(), description: '' })
handlers.reorder({ from: 2, to: 0 })
handlers.remove(index)
```

### useSetState

A state object that takes the slice that changed, and merges. It is the class
components' `setState`, for whoever keeps filters in a single object.

```tsx
const [filters, setFilters] = useSetState({ status: 'todas', page: 1 })

setFilters({ status: 'vencidas', page: 1 })
setFilters((current) => ({ page: current.page + 1 }))
```

### usePrevious

The previous value **different** from the current one, not the one from the
previous render: rendering again with the same value does not erase the memory.

```tsx
const previous = usePrevious(total)
const grew = previous !== undefined && total > previous
```

## Time

### useDebouncedValue

The value only settles after a pause. It is what gets passed to the query,
while the field stays bound to the raw value. The second item cancels the wait.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
const invoices = useInvoices({ search: settled })
```

### useDebouncedCallback and useThrottledCallback

The returned function is stable and always calls the newest version of yours.
The debounce runs once, with the last argument, after the pause; the throttle
runs right away and delivers the window's last call at its end. Both have
`cancel`, `flush` and `isPending`, and cancel on their own on unmount.

```tsx
const save = useDebouncedCallback((draft: Draft) => api.save(draft), 800)
const track = useThrottledCallback((top: number) => setShadow(top > 0), 100)
```

### useInterval and useTimeout

Declarative: `null` as the delay pauses. `useTimeout` returns `clear` and
`reset`, for the notice that goes away on its own and starts counting again
when the mouse passes over it.

```tsx
useInterval(() => refetch(), online ? 30_000 : null)

const { clear, reset } = useTimeout(() => setVisible(false), 5000)
```

### useIdle

True after a period with no keyboard, pointer, wheel or touch.

```tsx
const idle = useIdle(5 * 60_000)
```

## Browser

### useLocalStorage and useSessionStorage

The value stored as JSON, with the default while nothing has been written. Two
calls with the same key move together in the same tab, and `localStorage`
follows the other tab through the `storage` event. Blocked or full storage does
not bring the screen down: the value carries on in memory. On the server, the
default applies.

```tsx
const [columns, setColumns, resetColumns] = useLocalStorage({
  key: 'faturas:colunas',
  defaultValue: ['número', 'cliente', 'valor'],
})
```

### useClickOutside

Returns the element's `ref`; a click outside it calls the function. `nodes`
says what else counts as inside, like the trigger that opened the panel.

```tsx
const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), { enabled: open })
```

Before using it, check whether the piece already handles it: `Popover`,
`Menu`, `Dialog` and `Sheet` close on an outside click on their own.

### useHotkeys

A keyboard shortcut on the document. `mod` is Cmd on the Mac and Ctrl
elsewhere, and the modifiers have to match exactly: `mod+k` does not fire with
`mod+shift+k`. With focus in a text field the shortcut does not fire, so `k`
does not steal the letter from whoever is typing; turn that off with
`ignoreFields: false` when the shortcut has to work inside the field.

```tsx
useHotkeys([
  ['mod+k', () => setPaletteOpen(true)],
  ['shift+n', () => startInvoice()],
  ['?', () => setHelpOpen(true)],
])
```

The key is compared by the character it types, not by its position on the
keyboard. Three rules follow from that:

- **A symbol ignores shift.** In `?`, `+`, `!` or the digits, shift is what
  the layout requires to reach the character, so it does not count: `?` fires
  with the US keyboard's `shift+/` and with the ABNT2's own key, and `1` fires
  on AZERTY, where the digit needs shift. Write the character that comes out
  (`?`), not the combination that produces it: `shift+/` is also accepted, but
  it is translated through the US keyboard. On a letter shift counts, and `a`
  does not fire with `A`.
- **A letter goes by the character.** On AZERTY, `z` fires on the key that
  types `z`, not on the key where the US `Z` sits.
- **Position only counts when the character does not say which key it is**:
  the `˚` of Option+K on the Mac, the Cyrillic letter of Ctrl+C on a Russian
  keyboard, `Unidentified`. The number row always goes by position, so `mod+1`
  works on AZERTY, where the key types `&`.

### useInfiniteScroll

The next page when the sentinel at the end of the list enters the screen, with
200px of slack. Nothing is requested while `loading` is true or `hasMore` is
false, and the sentinel is observed again when the page arrives: if the list
has not filled the screen yet, the next page is requested without waiting for
a scroll.

```tsx
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore: hasNextPage,
  loading: isFetchingNextPage,
})

<ul>{rows}</ul>
<div ref={sentinelRef} />
```

For thousands of rows, combine it with `VirtualList`: it draws only what is on
screen.

### useIntersection

The latest `IntersectionObserver` entry for the `ref`'s element.

```tsx
const { ref, entry } = useIntersection<HTMLDivElement>({ threshold: 0.5 })
const seen = entry?.isIntersecting ?? false
```

### useElementSize

The element's width and height, through `ResizeObserver`. Zero on the server.

```tsx
const { ref, width } = useElementSize<HTMLDivElement>()
const columns = width > 720 ? 3 : 1
```

If the question is about the window, not an element, it is a utility class
with `sm:` and `lg:`, or `useMobile()`.

### useClipboard

`copy` returns whether it worked; `copied` stays true for the `timeout` and
goes back on its own. A failure lands in `error`.

```tsx
const { copy, copied } = useClipboard({ timeout: 2000 })

<Button variant="secondary" onClick={() => copy(accessKey)}>
  {copied ? 'Copiado' : 'Copiar chave'}
</Button>
```

For the ordinary copy button, the `Clipboard` piece already is that, with the
icon and the accessible name that changes.

### useReducedMotion, useDocumentTitle and useNetworkStatus

```tsx
const reduced = useReducedMotion()
useDocumentTitle(`${count} faturas vencidas`)
const { online } = useNetworkStatus()
```

`useReducedMotion` follows the system preference; `useDocumentTitle` ignores
an empty title and only restores the previous one with `restoreOnUnmount`;
`useNetworkStatus` says `true` on the server, so the "offline" banner does not
flash on the first frame.

### useMounted and useIsFirstRender

`useMounted` is false on the server and during hydration, and true afterwards:
it is what separates what only exists in the browser. `useIsFirstRender` is
true only on the first render.

```tsx
const mounted = useMounted()
return mounted ? <RelativeTime value={sentAt} /> : null
```

### useMediaQuery and useMobile

They already existed, and stay where they were: `useMobile()` is the same
640px cut the pieces read.

## What does not exist, on purpose

**`useFocusTrap`.** Base UI already traps focus where it needs to be trapped:
`Dialog`, `AlertDialog`, `Sheet`, and `Popover` with `modal` and a
`PopoverClose` inside. Trapping focus outside an overlay is what WCAG 2.1.2
calls a keyboard trap; if the screen asks for that, it is asking for one of
those pieces.

## In React Native

`@rivocode/ui-native` exports the twelve that do not depend on the browser,
with the same code as the web - the file is generated from the same source,
not copied: `useDisclosure`, `useToggle`, `useCounter`, `useListState`,
`useSetState`, `usePrevious`, `useIsFirstRender`, `useDebouncedValue`,
`useDebouncedCallback`, `useThrottledCallback`, `useInterval` and
`useTimeout`.

```tsx
import { useDebouncedValue, useDisclosure } from '@rivocode/ui-native'
```

The others do not port, and each has its reason:

| Hook | Why not | Instead |
| --- | --- | --- |
| `useLocalStorage`, `useSessionStorage` | There is no Web Storage; AsyncStorage is asynchronous and is not a peer | the app's storage |
| `useClickOutside` | There is no click outside in a touch tree | `Sheet` and `Dialog` close on the backdrop |
| `useHotkeys` | There is no global keyboard on the device | — |
| `useInfiniteScroll`, `useIntersection` | The native list already does it | `FlatList`'s `onEndReached` and `onViewableItemsChanged` |
| `useElementSize` | Layout already measures | `onLayout` |
| `useClipboard` | `expo-clipboard` is an optional peer, behind `./clipboard` | the `Clipboard` piece there |
| `useReducedMotion` | Reanimated, which is already a peer, exports its own | Reanimated's `useReducedMotion` |
| `useDocumentTitle` | There is no document | — |
| `useNetworkStatus` | It would require NetInfo, which is not a peer | `@react-native-community/netinfo` in the app |
| `useIdle` | There is no global activity event | `AppState` |
| `useMounted` | There is no server and no hydration | — |
