---
category: Navigation
---

# TableOfContents

The page's table of contents: the list of headings of a long text, with the
section the person is reading marked as they scroll. It is the "Nesta página"
column of a guide, a policy, a report with several parts.

```tsx
<div className="grid gap-8 lg:grid-cols-[1fr_14rem]">
  <article>…</article>
  <TableOfContents className="sticky top-6 self-start" />
</div>
```

With nothing else, the piece reads the document's `h2`s and `h3`s, in the
order they appear, and an `h3` goes nested in the `h2` before it. The level
comes from the tag; any other element matching the `selector` goes in at its
`aria-level`, or at level 2 without it.

## The marked section

An imaginary line at 30% from the top of the window decides which section is
being read: the marked one is that of the last heading that has already passed
it. An `IntersectionObserver` reports when a heading crosses the top band, and
scrolling measures again at most once per frame. Before the first heading, no
row is marked: the introduction is not a section.

**At the end of the scroll, the last visible section is marked**, even if its
heading never reaches the line: the last section of a short page does not rise
to 30%, and without this it would never be marked.

The marked row carries `aria-current="location"`, which the screen reader
announces as "current location", and the highlight-color stroke on the border.
`onActiveChange` receives the `id` on each change, for whoever wants to show the
section somewhere else.

## The click

The click scrolls to the heading and **moves focus to it**, as an anchor link
does: the next Tab starts from there, not from the table of contents. The
heading gets `tabindex="-1"` only while it has focus, and loses it on leaving.
Scrolling is smooth, and **becomes a jump** when the system asks to reduce
motion.

After the click, the marking stays locked on the clicked row until the person
scrolls on their own (mouse wheel, touch, key or scrollbar). Without this, the
smooth scroll would flash through every section on the way, and the reduced
motion jump would mark the section above when the clicked heading cannot rise
to the line.

The `href` is still there, so Ctrl+click, middle click and "copy link address"
work as with any link. `updateHash` writes the `#id` to the address bar with
`history.replaceState`, without stacking history; it comes off because a
router with `#` in the path would fight with it. `onItemClick` runs before
everything, and `event.preventDefault()` there hands the link back to the
browser.

## Fixed header

With a header that sticks to the top, pass its height in `offset`, in pixels:
the heading stops just below it on click, and only counts as visible below it.
For a link that comes from outside (`/guia#impostos` pasted in a chat), it is
CSS, not the piece, that discounts the header:

```css
html {
  scroll-padding-top: 4rem;
}
```

## Where to read

`container` limits reading to one element, and it is what an example inside a
larger page needs. A heading that arrives later (a section loaded on demand, an
example that mounts late) joins the table of contents on its own: the piece
observes the `container` and reads again when it changes. A heading without an
`id` gets one, taken from the text without accents: "Nota de crédito" becomes
`#nota-de-credito`, and a repeated one becomes `#nota-de-credito-2`.

`root` is the box that scrolls, when it is not the window. It is where the band
is measured and it is what scrolls on click.

```tsx
const [caixa, setCaixa] = useState<HTMLDivElement | null>(null)

<div ref={setCaixa} className="h-96 overflow-y-auto">…</div>
<TableOfContents container={caixa} root={caixa} selector="h3, h4" />
```

`items` skips the reading: the list comes ready, with `id`, `label` and
`level`, and it serves when the table of contents text is shorter than the
heading, or when the headings live in a component that cannot be read.

## Name and title

The table of contents comes out in a named `<nav>`, "Nesta página" by default,
and that name also appears as a visible title above the list. `label` changes
both. `hideLabel` takes the title off the screen and leaves the name for the
screen reader. A page with no headings at all draws no table of contents: an
empty navigation is an announced region that leads nowhere.

## Parts

`classNames` reaches each node by name: `label` (the visible title), `list`
(the outer list, which draws the rail), `item` (each `<li>`) and `link` (each
clickable row).

## When not to use

- **Navigating between the application's pages** is `Sidebar`. The table of
  contents moves within a single page; the sidebar changes route.
- **The trail of where the page lives** is `Breadcrumb`. It looks up, to the
  root of the site; the table of contents looks into the text.
- **Content the person chooses to see, one at a time** is `Tabs`. With tabs,
  what is not open is not on the page; with the table of contents, everything
  is and the person jumps.
- **Steps of a process** are `Steps`. The table of contents has no required
  order and no completed step.

## In React Native

Does not port, by decision. The page index is a desktop idiom: it lives in a column beside the text, and on the phone there is no column beside it. Long text on an app screen is split before it reaches an index: each section becomes a router screen opened from a list, or a `Tabs` tab, and the screen's title says where the person is.

The screen reader also already has its own index: the VoiceOver rotor and TalkBack's reading controls jump from heading to heading in any `Text` with `accessibilityRole="header"`, which is what the native package's `Heading` writes.
