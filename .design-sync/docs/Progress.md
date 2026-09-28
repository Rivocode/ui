---
category: Feedback
---

# Progress

A progress bar for a task with a known end: sending a file, generating a
report.

Without `value` it becomes indeterminate; in that case prefer the `Spinner`,
which takes less space and does not promise an end nobody can measure.

`format` writes the `showValue` number: the name of a house formatter, or a
function of yours. It receives the value clamped to `min` and `max`, the same
one the bar draws, and is not called when the bar is indeterminate.

## Motion

The bar fills from zero on mount, scaling horizontally from the left (`animate-fill`, `--rc-duration-slow`), and then moves to each new value along its width. The indeterminate state swaps the entrance for its back-and-forth. With "reduce motion", the bar starts at the value.

## When not to use

For how much of a capacity is in use (disk space, the month's invoice quota,
credit limit), use `Meter`. The difference is not in looks, it is in what the
number does: progress moves toward the end and finishes, a meter stays put and
can go up and down.

Swapping one for the other reaches the screen reader: the progress bar is
announced as something loading, and "loading 72%" for a disk that is not
loading anything makes the listener wait for an end that never comes.

## In React Native

Translates: `@rivocode/ui-native` exports `Progress` - `value` from 0 to 100 and `label`; `showValue` and `format` as on the web; the bar moves to the new value; `classNames` with the web's four parts. The API is not the same as the web's (on native everything is controlled), and the [parity table](/react-native) says what changes piece by piece.
