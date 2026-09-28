# Utility hooks

Before writing a `useEffect` with `setTimeout`, `addEventListener` or
`localStorage`, look here: the library exports from the root the hooks every
screen rewrites, with no new dependency, and each one cleans up what it opened
on unmount and renders on the server without touching `window`.

```tsx
import { useDebouncedValue, useDisclosure, useLocalStorage } from '@rivocode/ui'
```

## Which to use

| I need | Hook |
|---|---|
| Open and closed, with `open`, `close`, `toggle` | `useDisclosure(initial, { onOpen, onClose })` |
| Toggle a boolean, or cycle through a list of options | `useToggle()`, `useToggle(['a', 'b'])` |
| A number with floor, ceiling and step | `useCounter(1, { min, max, step })` |
| A list with immutable `append`, `remove`, `reorder`, `swap`, `update` | `useListState(initial)` |
| A state object that merges the piece that changed | `useSetState(initial)` |
| The previous value that differs from the current one | `usePrevious(value)` |
| The value only after the person stops typing | `useDebouncedValue(value, 300)` |
| The function only after the pause, or at most once per window | `useDebouncedCallback(fn, ms)`, `useThrottledCallback(fn, ms)` |
| Repeat, or wait once, paused by `null` | `useInterval(fn, ms)`, `useTimeout(fn, ms)` |
| Know whether the person is away | `useIdle(ms)` |
| Remember between visits, synced across tabs | `useLocalStorage({ key, defaultValue })`, `useSessionStorage` |
| Close on click outside | `useClickOutside(fn, { nodes, enabled })` |
| Keyboard shortcut, `mod` = Cmd on Mac and Ctrl elsewhere | `useHotkeys([['mod+k', fn]])` |
| Next page when the list reaches the end | `useInfiniteScroll({ onLoadMore, hasMore, loading })` |
| Visibility of an element | `useIntersection({ threshold })` |
| Width and height of an element | `useElementSize()` |
| Copy with a confirmation that resets itself | `useClipboard({ timeout })` |
| Respect "reduce motion" | `useReducedMotion()` |
| Tab title | `useDocumentTitle(title)` |
| Online or offline | `useNetworkStatus()` |
| Browser only, after hydration | `useMounted()`, `useIsFirstRender()` |
| The pieces' phone breakpoint | `useMobile()`, `useMediaQuery(query)` |

## The rules that change the code

**The search goes with the settled value, and the field with the raw one.** The
field stays bound to the state of each keystroke; what goes down to the query is
the one from `useDebouncedValue`.

```tsx
const [query, setQuery] = useState('')
const [settled] = useDebouncedValue(query, 300)
```

**The piece comes before the hook.** `Popover`, `Menu`, `Dialog` and `Sheet`
already close on click outside and already trap focus; `Clipboard` already is
the copy button with the accessible name that changes. `useClickOutside` and
`useClipboard` are for what the piece does not cover.

**`useFocusTrap` does not exist, on purpose.** Base UI traps focus in modal
overlays. If the screen needs trapped focus, it needs a `Dialog` or a `Sheet`.

**A shortcut does not steal letters from whoever is typing.** `useHotkeys` does
not fire with focus in a text field; pass `ignoreFields: false` only on the
shortcut that needs to work inside the field, like a palette's `mod+k`. The
modifiers match exactly: `mod+k` does not fire with `mod+shift+k`. The exception
is the symbol: on `?`, `+` or a digit shift does not count, because the layout
requires it. Write the character that comes out (`?`), and not `shift+/`. The
key counts by its character, and the physical position only when the character
does not say which key it is.

```tsx
useHotkeys([['mod+k', () => setPaletteOpen(true)]], { ignoreFields: false })
```

**`useToggle` receives the value, not the event.** With an argument that is one
of the options, it becomes the value; without an argument, it toggles. Wire it
to the button inside an arrow, `onClick={() => toggleExpanded()}`, and not with
the bare function.

```tsx
const [expanded, toggleExpanded] = useToggle()
const [view, toggleView] = useToggle(['tabela', 'cartões'] as const)
```

**The sentinel goes after the list.** `useInfiniteScroll` stops observing while
`loading` is true and observes again when the page arrives, so a short list
asks for the next one without waiting for a scroll.

```tsx
const { sentinelRef } = useInfiniteScroll({
  onLoadMore: fetchNextPage,
  hasMore: hasNextPage,
  loading: isFetchingNextPage,
})
```

## In React Native

`@rivocode/ui-native` exports, from the root, the twelve that do not depend on
the browser: `useDisclosure`, `useToggle`, `useCounter`, `useListState`,
`useSetState`, `usePrevious`, `useIsFirstRender`, `useDebouncedValue`,
`useDebouncedCallback`, `useThrottledCallback`, `useInterval` and `useTimeout`.
The code is the same as the web's, generated from the same source.

The browser ones do not port. Instead: `FlatList`'s `onEndReached` for an
infinite list, `onLayout` for size, Reanimated's `useReducedMotion`, `AppState`
for idleness, and the app's own storage to remember between sessions.
`useNetworkStatus` would require NetInfo, which is not a peer.
