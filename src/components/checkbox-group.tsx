"use client";

import { CheckboxGroup as BaseCheckboxGroup } from "@base-ui/react/checkbox-group";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";

export type CheckboxGroupProps = ComponentProps<typeof BaseCheckboxGroup>;

export function CheckboxGroup({ className, ...props }: CheckboxGroupProps) {
  return <BaseCheckboxGroup {...props} className={cn("flex flex-col gap-2", className)} />;
}
