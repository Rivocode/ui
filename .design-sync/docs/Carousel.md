---
category: Structure
---

# Carousel

A row of slides the person moves through sideways: plans side by side, the
week's news, photos of a property. The scrolling is the browser's own, with CSS
_scroll-snap_: touch dragging, the horizontal mouse wheel and the trackpad
already work without any library, and each slide settles at the edge.

```tsx
<Carousel label="Planos" indicators>
  <Card>Básico</Card>
  <Card>Profissional</Card>
  <Card>Empresa</Card>
</Carousel>
```

Each child becomes a slide. `label` is required: it names the region, which the
screen reader announces as "carrossel", and each slide renders as a "slide"
group labeled "Slide 2 de 5". It is the APG carousel pattern, with the terms in
Portuguese.

## How many at a time

`slidesPerView` says how many slides fit side by side. A number fixes the
count; an object changes with the screen width, with the same Tailwind
breakpoints (`sm`, `md`, `lg`, `xl`), and a missing breakpoint inherits from
the smaller one:

```tsx
<Carousel label="Planos" slidesPerView={{ base: 1, sm: 2, lg: 3 }}>
  {planos.map((plano) => (
    <Card key={plano.id}>{plano.nome}</Card>
  ))}
</Carousel>
```

With `slidesPerView="auto"`, the slide's class decides the width, via
`classNames.slide` or the child itself. It is the case of the row of
fixed-width cards that shows the edge of the next one, and that edge is the
invitation to drag:

```tsx
<Carousel label="Planos" slidesPerView="auto" classNames={{ slide: 'w-56' }}>
  {planos.map((plano) => (
    <Card key={plano.id}>{plano.nome}</Card>
  ))}
</Carousel>
```

`gap` is the space between slides, read from `--rc-gap-*`: it shrinks in the
compact density.

## Navigating

The previous and next buttons come on, below the row, and they are the house
`IconButton`. On the first slide the previous one is disabled, and on the last
one the next; with `loop`, the next from the last goes back to the first.
`controls={false}` removes both, for when dragging alone is enough.

`indicators` turns on one dot per position. The dot of the front slide is wider
and in the highlight color, and each dot is a button that goes to that
position, labeled "Ir para o slide 3 de 5". With several at a time, the
positions are the ones the scrolling reaches: five slides three at a time give
three dots.

With focus on the carousel, the arrows move one slide, and `Home` and `End` go
to the ends. Inside a field in the slide, the arrow still belongs to the field.

When the front slide changes, a polite live region says "Slide 3 de 5". It
stays silent while automatic rotation runs, so the screen reader does not
narrate on its own.

## Controlled

`index` and `onIndexChange`, counting from zero. `onIndexChange` is called by
the buttons, the keyboard, the dots and dragging, when the scrolling settles:

```tsx
const [index, setIndex] = useState(0)

<Carousel label="Planos" index={index} onIndexChange={setIndex}>
  {slides}
</Carousel>
```

## Automatic rotation

**Off by default, and it should stay that way.** Content that moves on its own
competes for attention with what the person is reading, and text that
disappears before it has been read is this component's most common failure.

When rotation really is the intent, `autoplay` turns it on: `true` every 5
seconds, or the interval in milliseconds. The component meets WCAG 2.2.2 on its
own:

- the pause button appears with the controls, and it is what says "Pausar a
  rotação" or "Retomar a rotação";
- rotation stops with the pointer over it and with focus anywhere in the
  carousel, and resumes when both leave;
- when the system asks to reduce motion, it does not start: the button is born
  offering to resume, and it only moves if the person asks. Their request wins
  over the system preference, which still holds for the rest: the slide changes
  without sliding.

With `defaultIndex`, the carousel mounts on the requested slide, without
sliding from the first.

## Parts

`classNames` reaches each node by name: `viewport` (the row that scrolls),
`slide` (each slide), `footer` (the controls row), `previous`, `next`, `pause`,
`indicators` (the group of dots) and `indicator` (each dot).

`labels` changes the texts the screen reader hears: `slide` and `indicator` are
functions of the position and the total; `previous`, `next`, `pause` and `play`
are text.

## When not to use

- **Content the person compares** is `Tabs`, or everything in view. The
  carousel shows one part at a time, and whoever compares the Profissional plan
  with the Empresa one needs both on screen at the same time; with `Tabs`, at
  least the name of each option stays in view the whole time.
- **When everything fits on the screen** it is `Grid`. Hiding behind an arrow
  what would fit in a three-column grid only costs a click for whoever wants to
  see.
- **For information that matters.** Slides after the first are rarely seen: a
  notice the person needs to read is `Banner` or `Alert`, not the third slide of
  a rotation.

## In React Native

Translates on top of the core's horizontal `FlatList`: with one slide at a time it pages by the full width (`pagingEnabled`), and with more than one it settles slide by slide (`snapToInterval`). The drag is the system's own, and `onIndexChange` arrives when the scroll settles.

**The list comes through `items` and `renderItem`, and the `index` is controlled**, as in the whole native package. `slidesPerView` is a single number: the phone's width does not change in the middle of the screen, and the web's per-width object and `"auto"` do not cross over.

**There is no `autoplay`.** On touch, a row that moves on its own fights the finger that is about to drag, and the pause button would sit a thumb's width away from the content that moves. Without the dots, a "2 de 5" counter sits between the buttons, in a polite live region that tells the screen reader the new slide.

```tsx
<Carousel
  label="Planos"
  items={planos}
  index={index}
  onIndexChange={setIndex}
  renderItem={(plano) => <Card>{plano.nome}</Card>}
/>
```

The parts are styled through the same `classNames` as the web: `viewport`, `slide`, `footer`, `previous`, `next`, `indicators` and `indicator`. `pause` does not exist here, because there is no `autoplay`.
