import { type TextProps } from "react-native";

import { cn } from "./cn";
import { Text } from "./text";

export type CodeProps = Omit<TextProps, "children" | "className" | "selectable"> & {
  /** The raw snippet: `app.json`, `--frozen-lockfile`, `emitida_em`. */
  children: string;
  /**
   * A long press selects and the system offers to copy. On, because it is the
   * native gesture for what exists to be copied, and because on a phone there
   * is no way to drag the cursor over half a sentence. One platform caveat: on
   * Android the whole text block is what gets selected, and a `Code` inside a
   * larger `Text` is a piece of it. There, `selectable` must be on the outer
   * `Text`, and the long press selects the whole sentence.
   */
  selectable?: boolean;
  className?: string;
};

export function Code({ children, className, selectable = true, style, ...props }: CodeProps) {
  return (
    <Text
      {...props}
      selectable={selectable}
      font="mono"
      style={style}
      className={cn("rounded-sm bg-surface-raised px-1.5 text-fg-muted", className)}
    >
      {children}
    </Text>
  );
}
