import { DemoApp } from '@/demo/app'

/* ---------------------------------------------------------------------------
 * The demo address
 *
 * A page, not a page about a page. The application fills the window below the
 * site header, with no intro and no frame: the question someone arrives with
 * is whether this holds up as a system, and a paragraph explaining that gets
 * in the way of the only thing that answers it.
 *
 * Everything interesting is in `demo/`, written the way someone would write a
 * real screen with this library.
 * ------------------------------------------------------------------------- */

export function DemoPage() {
  return <DemoApp />
}
