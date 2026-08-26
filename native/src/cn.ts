import { extendTailwindMerge } from "tailwind-merge";

export const cn = extendTailwindMerge({
  extend: {
    theme: {
      radius: ["sm", "md", "lg", "xl", "pill"],
      shadow: ["1", "2", "3"],
    },
  },
});
