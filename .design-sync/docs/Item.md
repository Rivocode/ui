---
category: Structure
---

# Item

The list row: something on the left, text in the middle, an action on the right.

It exists because half of any screen is this, and without a piece with a name
every project reinvents it with a loose div and its own spacing. It is not a
data component, it is a layout one.

Composes with `ItemMedia` on the left, `ItemContent` in the middle (with
`ItemTitle` and `ItemDescription` inside) and `ItemActions` on the right. The
three columns exist so that only one of them shrinks: the middle truncates the
text with an ellipsis, and the media and the actions keep their own size.

With `interactive` it gets focus and hover; use it together with a link or
button `render`, because a hover color on a div does not become a keyboard
target.

## In React Native

Translates, and it does not compete with `DataList`: that one resolves a query's four endings and hands each row to `renderItem` with no opinion about what is inside it. `Item` is that inside, and serves equally well a two-choice list in a sheet, which has no query at all. The web's composition (`ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`) becomes four props, by the same rule as `PageHeader`: the slots are always the same, and no prop lets you swap the column order by accident. With `onPress` the whole row becomes a target, with a 44px minimum height, but when there are `actions`, the target becomes only the text area, otherwise the accessible `Pressable` on top would swallow the button on the right as a screen reader stop. Inside a `DataList` with `onRowPress`, do not pass `onPress`: one `Pressable` inside another holds the touch in the inner one, and the row would respond here and never there.
