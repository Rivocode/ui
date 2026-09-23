import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["1", "2", "3"],
      animate: ["enter", "appear", "pop", "fill", "reveal", "rise", "fade", "indeterminate", "vanish", "shift-in-next", "shift-in-previous", "shift-out-next", "shift-out-previous"],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
