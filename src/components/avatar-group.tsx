import {
  Children,
  isValidElement,
  cloneElement,
  type ComponentProps,
  type ReactElement,
} from "react";

import { cn } from "../lib/cn";
import { Avatar, type AvatarProps } from "./avatar";

export type AvatarGroupProps = ComponentProps<"div"> & {
  /** How many appear before the "+n". With no cap, the row grows without end. */
  max?: number;
  /** The size applies to the whole row, including the "+n". */
  size?: AvatarProps["size"];
  /**
   * The piece's texts, to change the language: `more` is what the screen reader
   * hears on the "+n", and receives how many were left out. Pass only the ones that change.
   */
  labels?: Partial<AvatarGroupLabels>;
};

export type AvatarGroupLabels = {
  more: (count: number) => string;
};

const LABELS: AvatarGroupLabels = { more: (count) => `mais ${count}` };

export function AvatarGroup({
  className,
  max,
  size,
  labels,
  children,
  ...props
}: AvatarGroupProps) {
  const text = { ...LABELS, ...labels };
  const all = Children.toArray(children).filter(isValidElement) as ReactElement<AvatarProps>[];
  const shown = max ? all.slice(0, max) : all;
  const rest = all.length - shown.length;

  return (
    <div {...props} className={cn("flex items-center -space-x-2", className)}>
      {shown.map((child, index) =>
        cloneElement(child, {
          key: child.key ?? index,
          size: size ?? child.props.size,
          fallback: child.props.fallback?.slice(0, 1),
          className: cn("ring-2 ring-bg", child.props.className),
        }),
      )}

      {rest > 0 && (
        <Avatar
          size={size}
          fallback={`+${rest}`}
          aria-label={text.more(rest)}
          className="ring-2 ring-bg"
        />
      )}
    </div>
  );
}
