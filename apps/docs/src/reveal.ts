/**
 * Brings an item into the visible part of its container, without touching the
 * page scroll.
 *
 * `scrollIntoView` would do this, but it hits every scrollable ancestor at
 * once: the window goes along and the text the person is reading jumps, even
 * when the whole container was already on screen. The pieces sidebar is
 * exactly that case: it stays still on screen and scrolls inside.
 *
 * The margin is the slack left before and after the item, so it does not stop
 * glued to the edge, where you cannot see that the list goes on.
 */
export function revealWithin(container: HTMLElement, item: HTMLElement, margin = 24) {
  const view = container.getBoundingClientRect()
  const target = item.getBoundingClientRect()

  if (target.top < view.top + margin) {
    container.scrollTop -= view.top + margin - target.top
  } else if (target.bottom > view.bottom - margin) {
    container.scrollTop += target.bottom - (view.bottom - margin)
  }
}
