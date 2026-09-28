---
category: Feedback
---

# Alert

An alert that **stays** on the screen.

Composes with `AlertTitle` and `AlertDescription`.

The accessibility role comes from the tone: `danger` and `warning` interrupt
the screen reader, `success` and `info` wait for the person to finish the
sentence. Interrupting someone to say "salvo com sucesso" is rude to whoever
depends on the reader.

## The icon has its own place

**Color is never the only signal.** Without an icon, the four tones are four
boxes identical in shape, told apart only by hue. And people who cannot tell
red from green are a large slice of any user base, not to mention black and
white printing.

The icon used to come in as a child, in the middle of the title and the
description: no column of its own, no alignment with the first line, and in a
different place on every screen. Now it is `icon`, with a guaranteed position
before the text:

```tsx
<Alert tone="warning" icon={<TriangleAlert />}>
  <AlertTitle>Certificado vence em 8 dias</AlertTitle>
  <AlertDescription>Renove antes de 01/09 para não interromper a emissão.</AlertDescription>
</Alert>
```

The canonical lucide pair, the same as in the house icon table: `Info` for
`info`, `CheckCircle2` for `success`, `TriangleAlert` for `warning`, `CircleX`
for `danger`. It renders `aria-hidden`: the text beside it already says what it
draws, and the root's `role` already says the urgency. Announcing it again
would say the same thing twice.

## Dismissible by the person

`onDismiss` turns on the x in the right corner, with an accessible name
("Fechar aviso", or whatever `labels.dismiss` says).

**Whoever makes the alert disappear is the caller.** The component keeps no
state at all, for the same reason it has no `open`: an alert that clears itself
is a `Toast`, and `Alert` exists precisely for what stays on the screen.

```tsx
const [open, setOpen] = useState(true)

{open && (
  <Alert tone="warning" icon={<TriangleAlert />} onDismiss={() => setOpen(false)}>
    <AlertTitle>Certificado vence em 8 dias</AlertTitle>
    <AlertDescription>Renove antes de 01/09.</AlertDescription>
  </Alert>
)}
```

Without `onDismiss` there is no button, and that is still the default: an alert
the person can dismiss is the exception, not the rule. What blocks an action is
not dismissed. Taking it off the screen means resolving what it points to.

## Motion

The alert enters on mount: it fades and rises 4px in `--rc-duration-base` (`animate-enter`). That is what makes an alert arriving after an action be seen arriving. It runs once, and does not repeat on every re-render; with "reduce motion", it appears still. `className="animate-none"` turns it off for one instance.

## When not to use

For the confirmation of what just happened (invoice issued, file sent), use
`useToast()`. The toast passes; this one stays. A "salvo com sucesso" that
lives in the page flow is still there when the person comes back ten minutes
later, and they read it as the current state.

The opposite also holds, and it is the more expensive mistake of the two:
information the person needs **to have on screen while they work** (the reason
a field is locked, the pending issue that prevents issuing) cannot be a toast,
because it disappears before they reach the part where it matters.

And a field error is neither of the two: it belongs to the field that went
wrong, via `FieldError`, where the person is looking and can fix it.

## In React Native

Translates: `@rivocode/ui-native` exports `Alert` - `title` is a prop and the body is a child; no `AlertTitle`/`AlertDescription`; `icon`, `onDismiss` and `labels` as on the web, and the icon can also come in as a function, in the tone's color. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
