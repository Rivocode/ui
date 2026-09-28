---
category: Forms
---

# ColorPicker

Choosing a color: a client's brand color, in a theme builder.

There are two inputs for the same decision. The **swatch grid** is for choosing
by looking, and responds to the arrow keys like a radio group, because that is
what it is: a choice among options, not a handful of buttons. The **text field**
is for whoever already has the value in the brand manual and wants to paste it.

```tsx
const [brand, setBrand] = useState('#d4f34a')

<ColorPicker
  label="Cor da marca"
  value={brand}
  onValueChange={setBrand}
  swatches={['#d4f34a', '#3ddc97', '#6aa9ff', '#ff6b6b', '#b78cff']}
/>
```

The value always goes in and out in the same format: six-digit hexadecimal,
lowercase, with a hash. What the person **types or pastes** can be much looser
(`#0f8`, `BFDD3A`, with spaces around it), and `onValueChange` receives
`#00ff88` and `#bfdd3a`. Text that is not a color yet does not alert anyone:
the field keeps the draft while they write and goes back to the last good value
when they leave without finishing.

Without `value`, the component keeps its own choice starting from
`defaultValue`.

## The swatches

`swatches` accepts a bare value or a value with a name:

```tsx
<ColorPicker
  label="Cor da marca"
  value={brand}
  onValueChange={setBrand}
  columns={4}
  swatches={[
    { value: '#d4f34a', label: 'Lima' },
    { value: '#3ddc97', label: 'Teal' },
    { value: '#f2b21c', label: 'Âmbar' },
    { value: '#6aa9ff', label: 'Azul' },
  ]}
/>
```

**Give the name whenever it exists.** A six-character sequence read letter by
letter says nothing to whoever listens to the screen; "Lima" does. Without a
name, the swatch announces itself as `Cor #d4f34a`. The value is there, and it
is the minimum.

Without `swatches`, the grid brings a generated range of hues: ten hues at
three lightnesses. It is for experimenting, and **not** for representing a
brand: a theme builder hands the client's palette in here. The library could
not bring its own: a literal color inside a component ties white-labeling to
one brand, and that is why the house palette lives in `src/tokens` and the
range here is computed.

`columns` is at the same time the grid's layout and the step of the up and down
arrows. That is why it is a prop, and not a class from outside.

## Accessibility

This is what sets this component apart from a wrapped `<input type="color">`:

- The grid is a `radiogroup`, and each swatch a `radio`. **One** swatch enters
  the tab order; the arrow moves inside the grid, `Home` and `End` go to the
  ends. Without this, thirty swatches become thirty Tab stops.
- The selected one is **stated**, not just painted: `aria-checked`. Whoever
  sees gets a ring outside the swatch: outside, and not a mark inside, because
  a symbol drawn over the color becomes illegible on half the possible values,
  and no token can guarantee contrast against a value the person made up.
- The text field has its own name (`Código hexadecimal da cor`), so it
  announces itself even outside a `Field`.
- Each plain-text swatch is called `Cor #d4f34a`, and `labels.swatch` changes
  the phrase; a `{ value, label }` swatch is called by its own `label`.
- **Inside a `Field`, the `label` does not appear again.** The on-screen label
  there is the `FieldLabel`, and writing both left the same phrase twice, one
  on top of the other. The component's `label` still names the grid for the
  screen reader, just hidden. On native, `forValue` delivers the `FormField`'s
  `label`, and the component does the same thing: it names without drawing.

## Writing direction

In `dir="rtl"` the grid mirrors on its own, because it is a grid: the first
swatch becomes the one on the right. What does not mirror on its own is the
arrow key, which moves by index. That is why it swaps roles. `→` takes the
focus ring to the right of the screen and `←` to the left, even if the index
moves the other way. `ArrowDown` and `ArrowUp` keep moving `columns` at a time,
in the same column, and `Home` and `End` stay logical: the first and the last
swatch, not the left and the right.

The direction comes from `RivoProvider`, not from a `dir` written by hand on an
element above the component. Without it the grid would mirror the drawing
without mirroring the math: in a ten-column grid, `→` took focus one swatch to
the left.

## Parts

`classNames` dresses each part: `label`, `swatches`, `swatch`, `field`,
`preview`, `input`.

## When not to use

**For the full color picker, use the browser's `<input type="color">`.** This
component has no hue wheel, saturation map, transparency channel or eyedropper,
and none of that is in the queue. The native input opens the operating
system's dialog, which already brings the whole spectrum, the machine's own
eyedropper, and keyboard and screen reader support done right without a line of
ours. What it does not do (show the palette the house suggests, say which hue
is selected, accept a value pasted from the brand manual) is exactly what this
component does. The two sit well side by side: the grid for the common case,
the native one for the rest.

**To choose among a few fixed, named options, use `RadioGroup`.** If the screen
offers three ready-made themes ("Lima", "Grafite", "Papel"), the decision is
about the theme and not the color, and a list of labels with a colored dot
beside them says that better than a grid of anonymous hues.

**For a value in a continuous range**, `Slider`. Opacity and corner radius are
a range, not a color.

## In React Native

Translates, and comes from the root index: there is no peer behind it. Both web inputs cross over whole: the **swatches**, for choosing by looking, and the **hex field**, for whoever already has the value in the brand manual. `normalizeColor` is the same on both sides, line by line: `#0f8`, `BFDD3A` and `  #D4F34A  ` all come out as six lowercase digits with a hash.

**Three things change, and all three come from the finger.** It is controlled, without `defaultValue`, like every piece here. **There is no arrow navigation** (no `Home`, no `End`, no single tab stop), and so `columns` stops being the arrows' step and becomes only the drawing: the default drops from ten to **six per row**, because ten 44px targets with an 8 gap would give 512px on a 390 screen. And each swatch is a **44px target with the colored 32 drawing inside**: a pretty color grid too small for the thumb is the classic defect of this piece. The selected mark is still **outside**, for the same reason as the web: a symbol drawn over the swatch is illegible on half of the possible colors, and there is no token that guarantees contrast against a value the person made up.

**The field asks for the plain alphanumeric keyboard** (`keyboardType="default"`), not the numeric one: hex has `a` to `f` and a hash, and no number keyboard has both things. What it turns off is what the system would do on its own: `autoCapitalize="none"` so `bfdd3a` does not become `Bfdd3a`, and `autoCorrect={false}` so the autocorrect does not swap six meaningless letters for the closest word.

Whoever cannot see the color hears it through two paths: each swatch's `accessibilityState.checked`, and the text of the field itself, which has its own name (`Código hexadecimal da cor`). The preview next to it is hidden from the screen reader: it repeats in color what the field says in text, and color cannot be heard. With `hideInput`, the swatch state becomes the only channel.

The parts are styled through the same `classNames` as the web, all six: `label`, `swatches`, `swatch` (each swatch's 44px target), `field`, `preview` and `input`.
