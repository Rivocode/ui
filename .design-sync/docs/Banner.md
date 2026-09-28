---
category: Feedback
---

# Banner

A **page** notice: a full-width strip, at the top of the area it governs, that
stays until its reason is over. Scheduled maintenance, an overdue invoice, test
mode, an account under verification.

```tsx
<Banner
  tone="warning"
  title="Você está no modo de teste"
  description="As notas emitidas aqui não têm validade fiscal."
/>
```

It concerns the account, the product or the whole session, not a stretch of
content. That is why it touches the edges of the area, with no card corners,
and a line in the tone below it. Whoever puts it inside an area with padding
can round it via `className`.

## Tone and role

`info`, `success`, `warning` and `danger`, the four status tones of the tokens.
The tone decides three things at once: the color, the icon and the role for the
screen reader.

- `danger` and `warning` render with `role="alert"`, and interrupt the reader.
- `info` and `success` render with `role="status"`, and wait for the sentence
  to finish.

It is the same rule as `Alert`, for the same reason: interrupting someone to
say "sua conta foi verificada" is rude to whoever depends on the reader.

**Color is never the only signal**, and that is why the icon comes on its own:
`Info`, `CheckCircle2`, `TriangleAlert` and `CircleX`, the canonical lucide
pair. `icon` swaps the drawing (a wrench for maintenance, for example), and
`icon={null}` removes it. It always renders `aria-hidden`: the text beside it
already says what it draws.

## Title, description and actions

`description` is required and is the body: what happened and what the person
does about it. `title` is optional, renders in the tone's color and, when
present, names the strip.

`actions` takes the buttons, to the right of the text on desktop and below it
on a phone. Use `Button` with `size="sm"` and `variant="secondary"`: its border
is the boundary measured against the background of all four tones, in both
themes. A long label wraps inside the button instead of pushing the page
sideways, and the strip fits in 320px, which is the screen of someone using
400% zoom.

```tsx
<Banner
  tone="danger"
  title="Fatura em atraso"
  description="A fatura de agosto venceu há 5 dias. A emissão será suspensa em 10/10."
  actions={
    <Button size="sm" variant="secondary">
      Pagar com Pix
    </Button>
  }
/>
```

## Dismissible by the person

`onDismiss` turns on the x at the end of the strip, named "Fechar aviso" (or
whatever `labels.dismiss` says). **Whoever makes the strip disappear is the
caller**: the component keeps no state at all, and remembering that the person
already dismissed it (for this session, or forever) is a product decision, not
the strip's.

```tsx
const [open, setOpen] = useState(true)

{open && (
  <Banner
    tone="info"
    title="Manutenção programada"
    description="A emissão fica fora do ar domingo, das 2h às 4h."
    onDismiss={() => setOpen(false)}
  />
)}
```

What blocks is not dismissed. An invoice that is going to suspend the account
stays on the screen until it is paid: removing it means resolving what it
points to.

## Parts

`classNames` reaches each node by name: `icon`, `content` (the text column),
`title`, `description`, `actions` and `dismiss`.

## When not to use

- **A notice about a stretch of content** is `Alert`. `Alert` lives next to
  what it talks about (the form whose certificate is expiring, the table that
  came incomplete), and `Banner` talks about the page or the whole account. If
  the notice disappears when the person changes screens, it was an `Alert`.
- **Confirmation of what just happened** is `Toast`. The `Toast` passes, and
  the `Banner` stays: a "nota emitida" strip at the top of the screen is still
  there when the person comes back ten minutes later, and they read it as the
  current state.
- **A decision that needs an answer before moving on** is `AlertDialog`.
  `Banner` informs and lets people work; `AlertDialog` blocks the screen until
  the person chooses.

And do not stack three strips at the top. If there is more than one page
notice at the same time, show the most serious and leave the others for the
screen where they matter.

## In React Native

Translates, with the same four tones, the same `title`, `description`, `actions` and `onDismiss`, and the x with the same accessible name ("Fechar aviso"). `title` and `description` are `string`, because text on native lives inside a `Text`.

**Urgency goes out through a live region.** `danger` and `warning` come out with `accessibilityRole="alert"` and an immediate announcement; `info` and `success` come out in a polite live region, which waits for the current sentence to finish. It is the same split as the web's `role`. On iOS, where the live region does not exist, title and description go out through the system announcement: for the urgent tones also on appearing, and for all four on every text change.

**The icon does not come on its own.** The native package ships no icon library, so `icon` is optional and the form that paints in the tone's color is the function: `icon={({ color, size }) => <TriangleAlert color={color} size={size} />}`. The actions sit below the text, which is where they fit in the phone's width.

The parts are styled through the same `classNames` as the web, all six: `icon`, `content`, `title`, `description`, `actions` and `dismiss`.
