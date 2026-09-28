---
category: Navigation
---

# MenuGroup

A group of items with a title.

The label comes along in `label` on purpose: Base UI requires it to live inside
a group, and exposing the two pieces separately only created a way to misuse it
that breaks on screen, not in the type check.
