import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, Ref } from 'react'

import { cn } from '../lib/cn'

export const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'font-sans font-medium',
    'transition-colors duration-[var(--rc-duration-fast)] ease-[var(--rc-ease)]',
    'outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    // Desabilitado vira neutro de proposito. Desbotar a cor da marca produz
    // um verde sujo que parece defeito, nao estado.
    'disabled:pointer-events-none disabled:border-transparent',
    'disabled:bg-surface-raised disabled:text-fg-disabled disabled:shadow-none',
  ),
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent-hover active:bg-accent-active',
        secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-raised',
        ghost: 'text-fg-muted hover:bg-accent-subtle hover:text-fg',
        destructive: 'bg-danger text-danger-fg hover:opacity-90',
      },
      size: {
        sm: 'h-[var(--rc-control-sm)] px-[var(--rc-control-pad-sm)] text-sm',
        md: 'h-[var(--rc-control-md)] px-[var(--rc-control-pad-md)] text-base',
        lg: 'h-[var(--rc-control-lg)] px-[var(--rc-control-pad-lg)] text-md',
      },
      shape: {
        default: 'rounded-md',
        pill: 'rounded-pill',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', shape: 'default' },
  },
)

export type ButtonProps = ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Desabilita e anuncia ocupado enquanto uma acao esta em andamento. */
    loading?: boolean
    ref?: Ref<HTMLButtonElement>
  }

/**
 * Botao nativo de proposito. A Base UI nao entra aqui: `<button>` ja traz a
 * semantica e o teclado corretos, e embrulhar isso so adicionaria peso.
 */
export function Button({
  className,
  variant,
  size,
  shape,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, shape }), className)}
    >
      {loading && (
        <span
          aria-hidden="true"
          className={cn(
            'size-4 animate-spin rounded-pill border-2 border-current',
            'border-t-transparent',
          )}
        />
      )}
      {children}
    </button>
  )
}
