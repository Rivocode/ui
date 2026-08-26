import { Bell } from 'lucide-react'
import { Button, Indicator } from '@rivocode/ui'

/** Avisos não lidos */
export function UnreadNotifications() {
  return (
    <div className="flex items-center gap-6">
      <Indicator count={7} label="7 avisos não lidos">
        <Button variant="ghost" size="icon" aria-label="Avisos">
          <Bell size={18} aria-hidden="true" />
        </Button>
      </Indicator>

      <Indicator count={150} max={99} label="150 avisos não lidos">
        <Button variant="ghost" size="icon" aria-label="Avisos">
          <Bell size={18} aria-hidden="true" />
        </Button>
      </Indicator>

      <Indicator dot label="Há algo novo">
        <Button variant="ghost" size="icon" aria-label="Avisos">
          <Bell size={18} aria-hidden="true" />
        </Button>
      </Indicator>
    </div>
  )
}
