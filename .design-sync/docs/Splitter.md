---
category: Structure
---

# Splitter

Two areas with a divider that can be dragged: list on the left and detail on
the right, tree and content, table and inspector.

The divider is a real `separator`, with value, minimum and maximum, and it moves
with the arrows: `Home` and `End` go to the extremes. Dragging with the mouse is
half the piece: without the keyboard, whoever does not use a pointer is stuck
with the proportion the developer chose, and that proportion is usually the one
that suits the screen of whoever wrote it.

The divider's target is 25px while the line draws 1. The number comes from WCAG
2.5.8 (Target Size Minimum, AA), which asks for 24: a transparent `::after`
stretches 12px to each side, and the drawing does not gain a pixel. It used to
stretch 6px, the target measured 13px, and it was the only aim below 24 in the
whole catalog. A divider that is easy to grab is the difference between the
piece working and the person giving up on it.

The divider states the size with a unit. `aria-valuenow` alone makes the screen
reader announce a bare "50", which is not a measure of anything;
`aria-valuetext` says "50%". And it points to the side it measures, through
`aria-controls`: the value always describes the first side, and without the
reference there is no way to know which of the two it is.

The name lives on the `separator`, not on the frame. `label` names the node that
has the role, because that is what the screen reader exposes; an `aria-label`
written by the caller lands in the same place and beats `label`. Before, it
stopped at the outer `div`, which Chrome keeps as a named `generic` node and no
reader announces.

On the phone both sides stack and the divider disappears. Two 190px columns are
not two columns: they are two unreadable lists, and dragging a 4px edge with a
finger is not a gesture that exists.

## At 200% zoom the divider disappears, and that is the answer

200% zoom on a 1280 screen leaves the effective viewport at 640px, which is what
the piece already treats as narrow. Measured in Chrome at 640px and at 400px:
the frame becomes `flex-direction: column` and the handle goes to
`display: none`.

It is design, not a defect. `display: none` removes the handle from the tab
cycle along with the drawing, so there is no orphan stop and no invisible
target left. And the control lost its job in the same move in which it
disappeared: stacked, both sides show whole, one below the other, and there is
no proportion to negotiate between them. WCAG 1.4.10 requires content and
function to be reachable at 320px, and the content stays.

There is also no notice that the control disappeared, and that is a choice.
Announcing the disappearance of a control that no longer has a function is
noise in a live region, and the size stays frozen at the value it had: nothing
is lost on going back to desktop width.

In the `vertical` orientation the handle does not disappear at any width,
because stacked is already its design.

## Writing direction

In `dir="rtl"` the divider flips along. `start` becomes the right side, dragging
measures from the edge where reading begins and the arrows move toward the side
the person sees: `→` pushes the divider to the right, `←` to the left, even if
the `size` number moves in the opposite direction. `Home` and `End` stay
logical: the minimum and maximum of the first side, not left and right.

The direction comes from `RivoProvider`, not from a `dir` written by hand on an
element above the piece. It is the same `dir` the rest of the catalog reads,
and without it the divider would mirror the drawing without mirroring the math:
dragging the pointer 120px to the right would move it 118px to the left.

## When not to use

`Splitter` is built on top of `ResizablePanelGroup`, and it is its short form
for the most common case: **two** areas, the proportion as a single number,
the phone stacking already decided. When the screen asks for more than that,
use the family directly: three or more areas, a group inside a group, a panel
that collapses (`collapsible`, with `Enter` on the divider), a different
maximum for each side or a layout saved between sessions (`autoSaveId`).

To hide and show a whole area, use `Collapsible` or `Sidebar`: the splitter
exists for when both areas stay visible at the same time and the proportion
between them is the decision.

## In React Native

Does not port, by decision - two areas side by side do not fit on a narrow screen; on the phone the list and the detail are two router screens. It is not queued: it will not exist. The [parity table](/react-native) gives the reason for each one.
