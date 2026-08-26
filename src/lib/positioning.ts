/**
 * O vocabulario de posicionamento de tudo que flutua.
 *
 * Cinco pecas dividem a mesma casca visual - o `floatingPanel` do menu - e
 * ate aqui cada uma tinha um contrato diferente para dizer onde o painel
 * abre: o `PopoverContent` expunha `side`, `align` e `sideOffset`; o
 * `TooltipContent` so o `side`; o `MenuContent`, o `SelectContent` e o
 * `ComboboxContent`, nenhum dos tres. Quem escrevia a tela descobria isso um
 * de cada vez, no erro de tipo, e o contorno era abandonar a peca da casa e
 * montar o `Positioner` da Base UI na mao.
 *
 * O tipo sai do `Popover.Positioner` de proposito, e nao de um union escrito
 * a mao: os cinco posicionadores da Base UI herdam o mesmo
 * `UseAnchorPositioningSharedParameters`, entao qualquer um deles e a mesma
 * lista - e derivar dela faz uma mudanca la em cima aparecer aqui como erro
 * de tipo, em vez de virar uma divergencia calada.
 */
import type { Popover } from "@base-ui/react/popover";

export type FloatingPositionProps = {
  /** Lado preferido do gatilho. A Base UI vira sozinha quando nao cabe. */
  side?: Popover.Positioner.Props["side"];
  /** Alinhamento no eixo do lado escolhido. */
  align?: Popover.Positioner.Props["align"];
  /** Distancia entre o gatilho e o painel, em pixels. */
  sideOffset?: Popover.Positioner.Props["sideOffset"];
};

/**
 * A distancia padrao entre o gatilho e o painel.
 *
 * Um numero so para as cinco pecas: dois paineis que abrem lado a lado com
 * folgas diferentes denunciam a costura, e a folga e pequena demais para
 * alguem conferir de propria vontade.
 */
export const FLOATING_SIDE_OFFSET = 6;
