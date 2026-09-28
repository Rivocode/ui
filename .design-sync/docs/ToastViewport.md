---
category: Feedback
---

# ToastViewport

The area where the toasts appear. It already comes mounted inside
`RivoProvider`, so in practice the application never writes it: it calls
`useToast()` and that is it.

```tsx
const toast = useToast()

toast.add({ title: 'Nota 4816 emitida', description: 'O PDF foi para o e-mail.' })
```

## The hook

`useToast()` returns four functions, and none of them needs state of yours:

| Function | What it does |
|---|---|
| `add(options)` | Creates the toast and returns its `id` |
| `update(id, options)` | Rewrites a toast that is still on the screen |
| `close(id)` | Removes the toast before its time |
| `promise(promessa, estados)` | A single toast for the three phases of a wait |

`add`'s `options` has `title`, `description`, `type` and `timeout`. `type`
chooses the tone in the same vocabulary as `Alert`, `info`, `success`,
`warning` and `danger`; without it the toast comes out neutral, which is the
default and what serves most confirmations. `timeout: 0` keeps the toast on the
screen until someone closes it.

Each toast's x is called "Fechar aviso". To change the language, pass
`toastLabels={{ dismiss: "Dismiss" }}` to `RivoProvider`, which hands the
`labels` to the area.

```tsx
toast.promise(emitirNota(), {
  loading: { title: 'Emitindo a nota…' },
  success: (numero) => ({ title: `Nota ${numero} emitida` }),
  error: { title: 'A emissão falhou' },
})
```

`promise` exists so the wait does not become three stacked toasts. It is a
single toast, which changes text and tone as the promise resolves; the
alternative, `add` on the way out and another `add` on the way back, leaves
"sending" on the screen next to "sent".

Three toasts fit on the screen at the same time. The fourth comes in and the
oldest goes out of view until one of the others closes, and then it comes back,
with its x working: a toast with `timeout: 0` keeps waiting for the person to
close it, instead of staying visible and unresponsive to the click.

The object the hook returns has a stable identity across renders, so it can go
into an effect's dependency list without looping. The Base UI manager
underneath does not have that guarantee, and absorbing it is the library's job,
not that of whoever uses it.

## Undo

A reversible action gets undo, not confirmation: it happens right away, and the
toast offers the way back for a few seconds. `actionProps` draws the button
inside the toast, and whoever asks for it decides what it does and whether the
toast closes along:

```tsx
const toast = useToast()

function remove(note: Note) {
  removeFromList(note.id)
  const id = toast.add({
    title: `Nota ${note.number} excluída`,
    timeout: 8000,
    actionProps: {
      children: 'Desfazer',
      onClick: () => {
        restore(note)
        toast.close(id)
      },
    },
  })
}
```

Give the toast with undo more time than the default: reading, understanding and
reaching the button takes longer than reading a "saved". Without
`actionProps`, the toast gets no button other than the x.

## Where the toast appears

The default is `bottom-right`, which is the corner that competes least with the
content: header, title and main action live at the top. To change it, choose in
the provider, not with CSS on top:

```tsx
<RivoProvider toastPosition="top-center">
  <App />
</RivoProvider>
```

The six corners are `top-left`, `top-center`, `top-right`, `bottom-left`,
`bottom-center` and `bottom-right`; the `ToastPosition` type is that union, for
when the corner comes from a configuration and not a constant.

The toast always enters from the edge closest to the chosen corner. A toast
anchored to the left that slid in from the right would cross the whole screen to
reach its place, and the eye would follow the wrong motion until it noticed the
text was already there.

It is worth leaving the default when the toast responds to an action that
happens far from there, or when that corner is already taken by something else
fixed, such as a floating button.

## Focus after closing

Closing a toast from the keyboard does not throw focus to the start of the page.
It goes to the neighboring toast when there is another one in the stack, and,
once the last is closed, back to where it was before entering the toasts.
Without that place, it stays in the toast region, and the next Tab continues
from there. The x has 22 pixels drawn and a 30-pixel touch area.

## When not to use

A toast is for what has already happened, and what has already happened needs
no answer. If the person has to decide something, use `AlertDialog`. If the
information needs to stay on the screen while they work, use `Alert`, which
lives in the page flow and does not disappear on its own.

A form error is not a toast either: it belongs to the field that was wrong, via
`FieldError`, where the person is looking and can fix it.

## In React Native

In React Native this piece is `useToast` - nothing is mounted: the `RivoProvider` already brings the wiring, and the hook is the same, with the four functions: `add` returns the `id`, `type` picks the tone in the `Alert`'s vocabulary, `timeout: 0` keeps the toast until `close(id)`, and `update` and `promise` rewrite the toast that is on screen. Here `title` and `description` are `string`, because the toast is read aloud, and there is no x: the toast does not receive touches, so one that stays leaves through `close`. Without `timeout`, it leaves after 4 seconds, not the web's 5. The web's `actionProps`, which puts the undo inside the toast, does not exist here for the same reason as the x: the toast does not receive touches, and undo on the phone lives on the screen itself. The toast slides up and down with the web's durations, and appears still when the system asks to reduce motion. The [parity table](/react-native) has the rest of the catalog.
