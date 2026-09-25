import { Bell } from 'lucide-react'
import { IconButton, Indicator } from '@rivocode/ui'

/** Avisos não lidos */
export function UnreadNotifications() {
  return (
    <div className="flex items-center gap-6">
      <Indicator count={7} label="7 avisos não lidos">
        <IconButton variant="ghost" label="Avisos">
          <Bell size={16} aria-hidden="true" />
        </IconButton>
      </Indicator>

      <Indicator count={150} max={99} label="150 avisos não lidos">
        <IconButton variant="ghost" label="Avisos">
          <Bell size={16} aria-hidden="true" />
        </IconButton>
      </Indicator>

      <Indicator dot label="Há algo novo">
        <IconButton variant="ghost" label="Avisos">
          <Bell size={16} aria-hidden="true" />
        </IconButton>
      </Indicator>
    </div>
  )
}
