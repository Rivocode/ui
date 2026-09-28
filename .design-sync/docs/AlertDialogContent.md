---
category: Overlays
---

# AlertDialogContent

The confirmation panel, with the backdrop and the portal inside.

**It does not close with Esc or with a click outside**, and that is the only
difference that matters compared to `DialogContent`. Focus starts on the cancel
button: whoever opened it by mistake gets out by pressing Enter, and getting
out is what they should be able to do without reading.

On a phone the buttons stack and take the full width, with the confirming one
at the top of the stack and the cancel one close to the thumb.

The backdrop is a sibling of the panel inside the portal, so neither
`className` nor a descendant variant reaches it. To dress the backdrop, use
`classNames` with the `backdrop` part:

```tsx
<AlertDialogContent classNames={{ backdrop: "backdrop-blur-md" }}>
```
