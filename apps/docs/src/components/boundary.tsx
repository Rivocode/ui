import { EmptyState, Button } from '@rivocode/ui'
import { CloudOff } from 'lucide-react'
import { Component, type ReactNode } from 'react'

/* ---------------------------------------------------------------------------
 * When the chunk does not arrive
 *
 * Every route, every doc body and every example became its own chunk, so the
 * page came to depend on downloads that happen AFTER it opens. Two ways for
 * that to fail are routine, and neither is the reader's fault: a network that
 * drops midway, and a new deploy that deletes the hashed files of a tab opened
 * an hour ago - the import blows up with "Failed to fetch dynamically imported
 * module".
 *
 * Without this boundary, both cases give a blank screen: the error climbs to
 * the root and React unmounts the whole tree, header and sidebar included.
 * Reloading always fixes the second case, and that is why the button is here.
 * ------------------------------------------------------------------------- */

type Props = { children: ReactNode }

export class PageBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="py-20">
        <EmptyState
          icon={<CloudOff size={20} />}
          title="This part of the page did not load"
          description="It may have been the network, or a new version of the site published while this tab was open. Reloading fixes both cases."
          action={<Button onClick={() => window.location.reload()}>Reload</Button>}
        />
      </div>
    )
  }
}
