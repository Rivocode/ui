"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn,
} from "react-hook-form";
import type { ZodType, input, output } from "zod";

export function useZodForm<Schema extends ZodType<FieldValues, FieldValues>>(
  schema: Schema,
  options?: Omit<UseFormProps<input<Schema>, unknown, output<Schema>>, "resolver">,
): UseFormReturn<input<Schema>, unknown, output<Schema>> {
  return useForm<input<Schema>, unknown, output<Schema>>({
    resolver: zodResolver(schema) as unknown as Resolver<input<Schema>, unknown, output<Schema>>,
    ...options,
  });
}
