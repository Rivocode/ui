import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("animate-pulse rounded-sm bg-skeleton motion-reduce:animate-none", className)}
    />
  );
}
