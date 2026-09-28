---
category: Overlays
---

# PopoverTrigger

What opens the panel, and its anchor.

The position is measured from here, so the trigger is the visible element next
to which the panel should appear, and not a larger wrapper that would push it
away. With `openOnHover`, it opens on mouse hover; use it sparingly, because a
panel that opens on its own gets in the way of someone who was just passing
by.

It has no skin of its own (the common use is `render={<Button />}`, and two
sources of style would fight), but it does have the keyboard focus ring. Focus
is not skin: when the trigger is hand-written, the ring from here is the only
one there is.
