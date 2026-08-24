import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../lib/cn'

/**
 * Tabela semantica. Sai como <table> de verdade e nao como grade de divs,
 * porque leitor de tela e navegacao por teclado dependem disso, e nenhuma
 * quantidade de aria devolve o que a tag ja daria.
 */
export function Table({ className, ...props }: ComponentPropsWithoutRef<'table'>) {
  return (
    // A moldura rola de lado sozinha, senao uma tabela larga empurra a pagina
    // inteira e quebra o layout no celular.
    <div className="w-full overflow-x-auto">
      <table {...props} className={cn('w-full border-collapse text-base', className)} />
    </div>
  )
}

export function TableHeader({ className, ...props }: ComponentPropsWithoutRef<'thead'>) {
  return <thead {...props} className={cn('border-b border-border', className)} />
}

export function TableBody({ className, ...props }: ComponentPropsWithoutRef<'tbody'>) {
  return <tbody {...props} className={className} />
}

export type TableRowProps = ComponentPropsWithoutRef<'tr'> & {
  /** Linha escolhida. Marca no aria tambem, porque cor sozinha nao e estado. */
  selected?: boolean
}

export function TableRow({ className, selected, ...props }: TableRowProps) {
  return (
    <tr
      {...props}
      aria-selected={selected || undefined}
      className={cn(
        'border-b border-border transition-colors duration-[var(--rc-duration-fast)]',
        'hover:bg-surface-raised',
        // Barra de acento na lateral mais fundo tenue. A barra e que diz
        // "esta linha", entao o fundo nao precisa gritar nem manchar.
        selected && 'bg-selected shadow-[inset_2px_0_0_var(--rc-accent)]',
        className,
      )}
    />
  )
}

export function TableHead({ className, ...props }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th
      {...props}
      className={cn(
        'px-[var(--rc-control-pad-md)] py-[var(--rc-control-pad-sm)] text-left',
        'font-sans text-xs font-medium tracking-[0.04em] text-fg-subtle uppercase',
        'whitespace-nowrap',
        className,
      )}
    />
  )
}

export function TableCell({ className, ...props }: ComponentPropsWithoutRef<'td'>) {
  return (
    <td
      {...props}
      className={cn(
        'px-[var(--rc-control-pad-md)] py-[var(--rc-control-pad-sm)] text-fg align-middle',
        className,
      )}
    />
  )
}
