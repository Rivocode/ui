import type { Popover } from "@base-ui/react/popover";

export type FloatingPositionProps = {
  /** Lado preferido do gatilho. A Base UI vira sozinha quando nao cabe. */
  side?: Popover.Positioner.Props["side"];
  /** Alinhamento no eixo do lado escolhido. */
  align?: Popover.Positioner.Props["align"];
  /** Distancia entre o gatilho e o painel, em pixels. */
  sideOffset?: Popover.Positioner.Props["sideOffset"];
};

export const FLOATING_SIDE_OFFSET = 6;
