import { extendTailwindMerge } from "tailwind-merge";

import { warnFamilyClass } from "./font";

const merge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["1", "2", "3"],
      "font-weight": ["rc-regular", "rc-medium", "rc-strong", "rc-bold", "rc-display"],
    },
  },
});

export function cn(...classes: Parameters<typeof merge>): string {
  const merged = merge(...classes);

  if (__DEV__) warnFamilyClass(merged);

  return merged;
}

export type Slots<Part extends string> = Partial<Record<Part, string>>;
