---
category: Overlays
---

# SheetContent

The panel, with the backdrop and the portal inside.

It mounts in a portal in `RivoProvider`'s container, so the theme applies in
there. It does not take `side`: the side lives at the root, because the close
gesture has to agree with the direction the sheet came in from.

The backdrop is the panel's sibling inside the portal, so neither `className`
nor a descendant variant reaches it. To dress both, use `classNames` with the
`backdrop` and `viewport` parts.
