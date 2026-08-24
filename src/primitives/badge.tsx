import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '../lib/cn'

export const badgeVariants = cva(
  cn(
    'inline-flex items-center gap-1.5 rounded-pill border font-sans font-medium',
    'whitespace-nowrap',
  ),
  {
    variants: {
      tone: {
        neutral: 'border-border bg-surface-raised text-fg-muted',
        accent: 'border-border-strong bg-accent-subtle text-accent-text',
        success: 'border-border bg-success-subtle text-success',
        warning: 'border-border bg-warning-subtle text-warning',
        danger: 'border-border bg-danger-subtle text-danger',
        info: 'border-border bg-info-subtle text-info',
      },
      size: {
        sm: 'h-5 px-2 text-xs',
        md: 'h-6 px-2.5 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
  },
)

export type BadgeProps = ComponentPropsWithoutRef<'span'> & VariantProps<typeof badgeVariants>

/**
 * O selo e a unica peca em pilula por padrao. Pilula em botao de formulario
 * parece brinquedo, mas selo em canto reto parece etiqueta de sistema antigo.
 */
export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span {...props} className={cn(badgeVariants({ tone, size }), className)} />
}
