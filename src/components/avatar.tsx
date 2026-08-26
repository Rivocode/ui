"use client";

import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export const avatarVariants = cva(
  cn(
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill",
    "bg-skeleton align-middle font-sans font-medium text-fg-muted select-none",
  ),
  {
    variants: {
      size: {
        sm: "size-7 text-xs",
        md: "size-9 text-sm",
        lg: "size-12 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export type AvatarProps = ComponentProps<typeof BaseAvatar.Root> &
  VariantProps<typeof avatarVariants> & {
    src?: string;
    /** Descricao da foto. Vazio quando o nome ja aparece do lado. */
    alt?: string;
    /** O que aparece sem foto, ou enquanto ela carrega. Costuma ser a inicial. */
    fallback?: string;
  };

export function Avatar({ className, size, src, alt = "", fallback, ...props }: AvatarProps) {
  return (
    <BaseAvatar.Root {...props} className={cn(avatarVariants({ size }), className)}>
      {src && <BaseAvatar.Image src={src} alt={alt} className="size-full object-cover" />}
      {fallback && <BaseAvatar.Fallback delay={src ? 400 : 0}>{fallback}</BaseAvatar.Fallback>}
    </BaseAvatar.Root>
  );
}
