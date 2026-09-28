---
category: Forms
---

# Rating

A star rating: how the service went, how much the person liked the product, the
average others gave. It serves to **choose** the rating and to **display** the
average, and both come out with the right screen reading.

```tsx
const [nota, setNota] = useState(0)

<Rating value={nota} onValueChange={setNota} />
```

`value` is the rating, and `0` means none. Without `value`, the piece keeps the
rating on its own starting from `defaultValue`. `max` says how many stars, and
the default is five.

## For the screen reader and the keyboard

Choosing is a `radiogroup`, the APG pattern for rating: each star is an option
named after the rating ("1 estrela", "3 estrelas"), and the group is called
"Avaliação". An `aria-labelledby` pointing to the question on the screen takes
the place of the default name, and it is the right way when the question is
written above.

- **Tab** enters on the checked rating, or on the first one when there is no
  rating yet.
- **Arrows** move one star (half, with `allowHalf`) and stop at the ends. In
  `rtl` the left arrow is the one that goes up, as the person sees it, and the
  fill starts from the right edge.
- **Home** and **End** go to the lowest and the highest rating.
- **Space** and **Enter** choose the focused star.

With the pointer over them, the stars preview the rating a click would give,
and the preview disappears when the pointer leaves. The preview does not change
`value`.

```tsx
<p id="pergunta">Como foi a entrega?</p>
<Rating aria-labelledby="pergunta" value={nota} onValueChange={setNota} />
```

## Half star and clearing

`allowHalf` splits each star into two ratings: the half at the start of the
reading direction (the left, or the right in `rtl`) is the rating `n - 0.5`,
and the arrows move half by half. The halves get their own names ("Meia
estrela", "2,5 estrelas"), one option each for the screen reader. The pointer
target is still the whole star, with the same 24px or more: the half comes
from where the pointer landed inside it.

`clearable` makes a click on the already chosen rating go back to zero, and
`onValueChange` arrives with `0`. It starts off: on most screens a rating, once
given, is only changed.

```tsx
<Rating allowHalf clearable value={nota} onValueChange={setNota} />
```

## The average, read only

`readOnly` displays without letting anyone choose. It accepts any fraction (4.3
paints 30% of the fifth star) and comes out as **a single image** for the
screen reader, named "4,3 de 5". Five stars read one by one do not say the
average; the sentence does.

```tsx
<Rating readOnly value={4.3} size="sm" />
```

## Color, size and icon

The full star paints in `warning` and the empty one in `border-strong`. Both
are graphical object boundaries, and both are measured at 3:1 against `bg`,
`surface` and `surface-raised`, in both themes. Disabled, the full one becomes
`fg-disabled` and the empty one `border-disabled`.

`size` changes the star (`sm`, `md`, `lg`), and each one's box never drops
below a 24px target. `icon` swaps the drawing for another lucide icon, such as
`<Heart />`: the full one comes out with `fill`, so the icon needs to have
area.

`name` puts the rating in a hidden `input`, so the `<form>` submits it along.

## Parts

`classNames` reaches each node by name: `item` (the box of each star), `empty`
(the empty drawing) and `filled` (the full drawing, clipped by the rating).

## Texts

`labels` changes what the screen reader hears: `group` (the group's name),
`item` (the function that says each rating's name) and `value` (the function
that says the average in read-only mode).

## When not to use

- **A number that needs to be exact** is `NumberField`. A star is an opinion,
  and the range is small: a 0 to 10 rating with decimals does not fit in
  stars.
- **A continuous range**, such as a discount or a deadline, is `Slider`.
  `Slider` drags along a ruler; `Rating` chooses among a few named steps.
- **A choice among options that are not ratings** ("Ruim", "Bom", "Ótimo"
  written out) is `RadioGroup`, or `ToggleGroup` when the buttons sit side by
  side. Stars only work when more is better.
- **A system measurement**, such as plan usage or password strength, is
  `Meter`. `Meter` shows a quantity; `Rating` shows an opinion.

## In React Native

Translates, with the same `max`, `allowHalf`, `clearable`, `readOnly` and `size`. `value` is controlled, as in the whole native package, and without `onValueChange` the piece only displays.

**For the screen reader, the stars are a single control.** On the web the choice is a `radiogroup` with one option per star; here the group is `adjustable`, the same contract as the `Slider`: VoiceOver and TalkBack say "Avaliação, 3 estrelas", and the swipe up and down gesture moves one star (half, with `allowHalf`). Five focus stops for a rating would be five navigation swipes to reach the submit button.

**Each star's touch target is always 44pt.** `size` changes only the drawing. With `allowHalf`, a tap on the reading-start half gives a half star: the left one, or the right one when the device reads right to left. The fill also starts on that side, and the swipe up gesture still raises the rating. There is no preview: on touch there is no hover.

The default star is the ★ character in the theme color, because the package ships no icons. For another drawing, the function receives the already resolved color, the size and the layer: `icon={({ color, size }) => <Heart color={color} fill={color} size={size} />}`.

```tsx
<Rating value={nota} onValueChange={setNota} allowHalf />
```

The parts are styled through the same `classNames` as the web: `item`, `empty` and `filled`. The last two style the house star, which is text; with `icon`, the color arrives through the function.
