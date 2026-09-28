import { Button, Command, Kbd, type CommandGroup } from '@rivocode/ui'
import { FileText, Plus, Settings, Users } from 'lucide-react'
import { useState } from 'react'

const GROUPS: CommandGroup[] = [
  {
    label: 'Ir para',
    items: [
      {
        id: 'invoices',
        label: 'Notas fiscais',
        keywords: 'nf fatura boleto',
        icon: <FileText size={16} />,
        onSelect: () => {},
      },
      {
        id: 'customers',
        label: 'Clientes',
        keywords: 'cadastro',
        icon: <Users size={16} />,
        onSelect: () => {},
      },
      {
        id: 'settings',
        label: 'Preferências',
        icon: <Settings size={16} />,
        onSelect: () => {},
      },
    ],
  },
  {
    label: 'Criar',
    items: [
      {
        id: 'new-invoice',
        label: 'Nova nota fiscal',
        description: 'Abre o formulário em branco',
        icon: <Plus size={16} />,
        shortcut: 'mod+n',
        onSelect: () => {},
      },
    ],
  },
]

/** Paleta de comandos */
export function Palette() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Buscar comando
        <Kbd size="sm" keys="mod+k" />
      </Button>
      <p className="text-sm text-fg-subtle">Ou aperte o atalho, de qualquer lugar da tela.</p>

      <Command open={open} onOpenChange={setOpen} groups={GROUPS} />
    </div>
  )
}
