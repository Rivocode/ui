import type { Popover } from "@base-ui/react/popover";

export type FloatingPositionProps = {
  /** Preferred side of the trigger. Base UI flips by itself when it does not fit. */
  side?: Popover.Positioner.Props["side"];
  /** Alignment on the axis of the chosen side. */
  align?: Popover.Positioner.Props["align"];
  /** Distance between the trigger and the panel, in pixels. */
  sideOffset?: Popover.Positioner.Props["sideOffset"];
};

export const FLOATING_SIDE_OFFSET = 6;
