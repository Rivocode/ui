---
category: Overlays
---

# Tour

The guided walk through the screen: it darkens the page, cuts a hole around one
element at a time and explains, in a bubble attached to it, what that element
does. It is the first visit to a new dashboard, the feature that moved, the
flow the person only understands by seeing the pieces in order.

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Fazer o tour</Button>
<Tour
  open={open}
  onOpenChange={setOpen}
  steps={[
    { target: '#novo-cliente', title: 'Cadastre o primeiro cliente', description: 'O cadastro pede só o CNPJ.' },
    { target: '#busca', title: 'Ache pelo nome ou pelo CNPJ' },
    { target: exportRef, title: 'Leve a lista para a planilha', placement: 'top' },
  ]}
  onFinish={() => markTourAsSeen()}
/>
```

Each step has `target`, `title`, an optional `description`, an optional
`placement` and `action`, extra content that goes above the buttons (a link to
the docs, a shortcut). `target` is a CSS selector or a ref, and it is read at
the moment the step opens: the target can be born after the tour, as long as it
exists when its turn comes.

## The highlight

The mask paints the screen with the theme's `overlay`, the same role as the
`Dialog` backdrop, and leaves a rounded-corner cutout around the target, with a
few pixels of margin. The cutout follows the target when the page scrolls, when
the window resizes and when the target itself grows.

The target can live inside a `Dialog`, a `Sheet` or a `Popover`: the mask rises
above the layer the target is in, and the bubble above the mask. The rest of the
dialog dims and stops receiving clicks, like the rest of the page.

By default the mask swallows every click, including the target's: the tour
explains, and the screen waits. With `interactive`, the cutout becomes a
passage and the target responds to clicks while the rest stays blocked. It
serves the step that teaches by doing ("clique em Salvar"), and in that case it
is you who advances the tour, through `onStepChange` or the controlled `step`,
in the target's own handler. From the keyboard the path is still the bubble:
focus is trapped in it, so the click on the target is a pointer and touch
shortcut, and "Próximo" can never be missing.

Clicking the mask closes nothing. A tour that disappears on the first
distracted click outside the bubble is a tour nobody finishes.

## The bubble

The bubble anchors to the target through the same positioning as `Popover`: it
prefers the `placement` side (`bottom` by default) and flips on its own when it
does not fit. If the target is out of view, the page scrolls to it and centers
it; with `prefers-reduced-motion`, the scroll is a jump, with no animation.

On top comes the counter ("Passo 2 de 5"), then the title and the text. Below,
"Pular tour" on the left and, on the right, "Voltar" (from the second step on)
and "Próximo", which on the last step becomes "Concluir". The keyboard arrows
move between steps with focus on the bubble, except when focus is on a field
placed in `action`: there the arrow moves within the text, and does not change
step.

`onFinish` is only called on "Concluir". "Pular tour" and `Esc` call `onSkip`,
with the index of the step where the person gave up, which is the data that
says which step is too long. All three close, and all three report
`onOpenChange(false)`.

The texts come out in Portuguese and are swapped through `labels`: `back`,
`next`, `finish`, `skip` and `counter`, which is a function of the position and
the total.

## Accessibility

The bubble is a dialog with a name and a description: the title comes in
through `aria-labelledby` and the text through `aria-describedby`. Focus starts
on "Próximo", stays trapped in the bubble while the tour is open, and goes back
to whoever opened the tour when it ends, through any of the three exits. The
step change is announced ("Passo 3 de 5. Leve a lista para a planilha"),
because focus stays on the same button and, without the announcement, the
screen reader would have nothing to say.

## A target that does not exist

A step whose target is not on the page is skipped, in the direction the person
was going, and in development the console says which step and which selector.
Advancing past the last step without a target finishes the tour; if no target
exists, the tour closes on its own without calling `onFinish` or `onSkip`. That
is what happens when a permission hides a button, and skipping is better than a
bubble pointing at nothing.

The same goes for a target that disappears with the step open, when the screen
changes tabs or a list reloads: the tour notices the element left the document
and skips the step the same way, instead of leaving the cutout in an empty
corner.

## On the phone it becomes a bottom sheet

Below 640px the bubble stops being anchored and rises from the bottom of the
screen at full width, with the buttons at touch height, the same decision
`Popconfirm` and `CalendarPanel` make. The mask and the cutout remain: the
target stays highlighted, and scrolling takes it to the top half of the screen,
where the sheet does not cover it.

## Parts

`className` dresses the bubble, whether the floating one or the sheet.
`classNames` dresses `mask`, `spotlight` (the cutout), `counter`, `title`,
`description` and `footer`. The mask is the bubble's sibling inside the portal,
and without these names it cannot be reached from anywhere.

## When not to use

For a hint about a single element, which the person asks for by hovering, use
`Tooltip`. For a one-paragraph explanation attached to a button, which the
person opens when they want and closes by clicking outside, use `Popover`. The
tour is the sequence the screen imposes, and it costs full attention; `Popover`
and `Tooltip` are lookups, and cost nothing to whoever does not need them.

To announce something new without stopping the person ("a exportação agora sai
em Excel"), use `Banner`: it stays at the top of the page, the person reads it
when they want and closes it, and nobody is forced to go through five steps to
get to work.

And do not use the tour to make up for a screen that does not explain itself.
If the button's label needs a bubble to be understood, it is the label that is
wrong.

## In React Native

Translates on top of the core's `Modal`, with no new peer: the target comes by ref and is measured by `measureInWindow` when the step opens, and four bands with the theme's `overlay` surround the cutout. The cutout subtracts where the `Modal`'s root starts in the window, and so it does not drop by the height of the status bar on Android. The bubble is always a sheet, which is what the web already does below 640px, with the same counter, the same buttons and the same texts, which live in a single file, shared by both packages. The sheet sits at the bottom, and moves to the top when the target is in the bottom half of the screen, so as not to cover the tab bar; there it respects `topInset`, the top safe area. An empty ref, or one that is not a `View` with `measureInWindow`, skips the step, with the same warning in development.

Three differences, and all three are about touch. The step is controlled (`step` and `onStepChange` required), like the whole native package. There is no `interactive`: the `Modal` is another window, and a tap does not pass through to the screen behind. And there is no automatic scroll, because React Native has no `scrollIntoView`: the screen does the scrolling, in `onStepChange`, with `scrollTo({ animated: false })` on the `ScrollView`, and the piece measures again on the next frame. Android's back skips the tour, like `Esc` on the web.

The parts are styled through the same `classNames` as the web: `mask` (the four bands around the cutout), `counter`, `title`, `description` and `footer`. `spotlight` does not exist here: the cutout is the gap between the bands, not a node that can be styled.
