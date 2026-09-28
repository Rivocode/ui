---
category: Overlays
---

# ImageViewer

A grid of thumbnails that opens the photo in full screen: photos of a
property, receipts attached to an expense, a vehicle inspection. In full screen
the person navigates between the images, zooms in to read the detail and
closes returning exactly to where they were.

```tsx
<ImageViewer
  images={[
    { src: '/fotos/fachada.jpg', alt: 'Fachada do prédio comercial' },
    { src: '/fotos/recepcao.jpg', alt: 'Recepção com balcão de madeira' },
  ]}
/>
```

It is built on the house `Dialog`: focus stays trapped inside, `Esc` closes,
the background becomes inert for the screen reader and the theme follows the
portal.

## The stage is always dark

Full screen opens on a dark stage in both themes, like the phone's gallery and
the market's photo viewers: a light background around the photo fights with it
and blows out the brightness. The background, the caption, the counter and the
controls (close, arrows and zoom) read the fixed `media-*` roles
(`bg-media-stage`, `bg-media-control`, `text-media-fg`, `text-media-fg-muted`,
`border-media-border` and `media-disabled` for the disabled control), and not
the theme's roles.

They live in `scales.css`, outside the themes, for the same reason as the
`QRCode` pair: the stage stays dark in the light theme and in every client
theme, without the client declaring anything. `check:contrast` measures the
pairs: the dark stage, caption and counter at 4.5:1, icon, outline and focus
ring at 3:1, and the disabled control visible and weaker than the live one.
The thumbnail grid stays on the page, with the theme's colors.

The theme does not declare `--rc-media-*`. To change the stage in a product,
dress the parts through `classNames` (`viewer`, `counter`, `caption`), with a
token.

## The images

`images` is the list, in navigation order. Each image has `src`, a required
`alt`, an optional `caption` and `thumbnail`, the small version the grid uses
(without it, the grid loads `src`).

**`alt` is required in the type**, and not on a whim: it is the name of the
thumbnail button, and it is what the screen reader hears at each image change,
together with the position ("3 de 8: Recepção com balcão de madeira"). A
gallery without `alt` is, for someone who cannot see, a row of nameless
buttons.

The `caption` appears below the open image, and is for what the `alt` does not
say: when it was taken, who sent it, what the person should notice.

## Navigating

The side arrows, the keyboard arrows, `PageUp` and `PageDown` and swiping
sideways move between images. The "3 de 8" counter sits at the top left. On the
first and the last, the arrow on that side disables; with `loop`, navigation
wraps around.

If the arrow disables with focus on it, focus drops to the image area, and does
not get lost on the page: the viewer's keys keep working. The same goes for the
zoom plus and minus, at the maximum and at the fit size.

The neighbor on each side is loaded before the person asks, so switching
images does not wait on the network. While the open image loads, a spinner
takes its place; if it does not load, the screen says so instead of spinning
forever.

## Zoom

The plus and minus buttons zoom by one and a half times at each step, up to
`maxZoom` (4 by default). Double-click doubles the zoom at the clicked point,
and the second goes back to the fit size. The mouse wheel zooms with `Ctrl`
held, which is the same event the trackpad's pinch gesture sends; on touch, the
two-finger pinch zooms directly.

Zoomed in, the image can be dragged to see the rest, and swiping stops
switching images: the finger dragging the zoomed photo cannot suddenly change
photos. On the keyboard, `+` and `-` zoom in and out, and `0` goes back to the
fit size.

**When zoomed, the four arrows pan across the photo**, 40 pixels at a time,
without going past the edge, and they are the dragging of whoever does not use
a pointer. Switching images stays with `PageUp`, `PageDown` and the side
buttons. Switching images always resets the zoom.

## Closing and going back

`Esc`, the X at the top or `onIndexChange(null)` close it. **Focus returns to
the thumbnail of the image that was open**, and not necessarily to the one that
opened it: whoever opened the second photo, went to the fifth and closed it
continues from the fifth in the grid, with the page scrolled to it.

## Controlled

`index` and `onIndexChange`: the index of the open image, counting from zero,
or `null` with the viewer closed. With `thumbnails={false}` the grid
disappears, and what opens it is `index`, from any button on the screen:

```tsx
const [index, setIndex] = useState<number | null>(null)

<Button onClick={() => setIndex(0)}>Ver as fotos</Button>
<ImageViewer images={fotos} thumbnails={false} index={index} onIndexChange={setIndex} />
```

## Parts

`classNames` reaches each node by name: `thumbnails` (the grid), `thumbnail`
(each grid button), `viewer` (the full screen), `toolbar` (the top bar),
`counter`, `stage` (the image area), `image` and `caption`.

`labels` swaps the texts: `title` (the dialog's name, only for the screen
reader), `counter` (a function of the position and the total), `previous`,
`next`, `close`, `zoomIn`, `zoomOut`, `loading` and `error`.

## When not to use

- **Content that is not an image** is `Dialog`. The viewer exists for the photo
  to take up the whole screen; a form or a text inside it loses what `Dialog`
  gives (the visible title, the actions footer, a size that fits the content).
- **An image that only needs a frame on the page** is `AspectRatio`. If the
  person does not need to enlarge or navigate, the photo stays in the card
  itself, with the ratio reserved before loading, and nothing opens on top.
- **A row of images you browse without enlarging** is `Carousel`. The two
  combine: the carousel shows, and the viewer enlarges when the person asks.

## In React Native

Translates on top of the core's `Modal`, with the images in a horizontal `FlatList` with `pagingEnabled`: swiping changes the image, and Android's back closes it. The thumbnail grid is the same, built on the native `Grid`, and each thumbnail is an `imagebutton` with the `alt` as its name. The `index` is controlled, as in the whole native package: `onIndexChange` receives the index on opening and on navigating, and `null` on closing.

**Pinch comes from the core's `PanResponder`, not from react-native-gesture-handler.** The package already requires reanimated, but not gesture-handler, and an image viewer does not justify one more required peer for every app. Two fingers zoom in up to `maxZoom`, one finger drags the zoomed photo, and a double tap doubles and undoes the zoom. While zoomed, the row stops scrolling: the finger dragging the photo does not change the photo. The plus, minus, previous and next buttons are still there, because the screen reader does not pinch.

`caption` is a `string`, the neighbor on each side is requested ahead of time through `Image.prefetch`, and the "3 de 8" counter sits in a live region that also says the new image's `alt`.

The stage is dark in both schemes, as on the web: the colors come from `tokens.media`, not from the theme, so the `Modal` does not lighten in the light theme or in a client theme. A disabled control follows the package rule, the whole layer at 50%.

The parts are styled through the same `classNames` as the web, all eight: `thumbnails`, `thumbnail`, `viewer`, `toolbar`, `counter`, `stage`, `image` and `caption`. `className` styles the thumbnail grid, the same node as `thumbnails`, because the piece has no root: the grid and the `Modal` are siblings.
