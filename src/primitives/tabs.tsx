'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

export const Tabs = BaseTabs.Root

export function TabList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List
      {...props}
      className={cn('relative flex items-center gap-1 border-b border-border', className)}
    >
      {props.children}
      {/* O risco que corre ate a aba ativa. A Base UI entrega a posicao em
        * variaveis de CSS, entao ele desliza sem nenhuma medicao nossa. */}
      <BaseTabs.Indicator
        className={cn(
          'absolute bottom-0 left-0 h-[2px] bg-accent',
          'w-[var(--active-tab-width)] translate-x-[var(--active-tab-left)]',
          'transition-all duration-[var(--rc-duration-base)] ease-[var(--rc-ease)]',
        )}
      />
    </BaseTabs.List>
  )
}

export function Tab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      {...props}
      className={cn(
        'relative px-3 py-2.5 font-sans text-base font-medium text-fg-muted',
        'transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]',
        'outline-none hover:text-fg',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        'data-[active]:text-accent-text',
        'data-[disabled]:cursor-not-allowed data-[disabled]:text-fg-disabled',
        className,
      )}
    />
  )
}

export function TabPanel({ className, ...props }: ComponentProps<typeof BaseTabs.Panel>) {
  return <BaseTabs.Panel {...props} className={cn('pt-4 outline-none', className)} />
}
