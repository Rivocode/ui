import { useRef, useState } from "react";
import {
  I18nManager,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { Button } from "./button";
import { cn } from "./cn";
import { Text } from "./text";

type ChipSize = "sm" | "md";

const PILL: Record<ChipSize, string> = { sm: "top-2.5 bottom-2.5", md: "top-2 bottom-2" };
const PAD: Record<ChipSize, string> = { sm: "px-2", md: "px-2.5" };
const FONT: Record<ChipSize, string> = { sm: "text-xs", md: "text-sm" };
const EDGE = "absolute top-0 bottom-0 w-px bg-border-strong";

function describe(label: string, value?: string): string {
  return value === undefined || value === "" ? label : `${label}: ${value}`;
}

function counted(total: number): string {
  return total === 1 ? "1 filtro" : `${total} filtros`;
}

function applied(total: number): string {
  return total === 0
    ? "Nenhum filtro aplicado"
    : `${counted(total)} aplicado${total === 1 ? "" : "s"}`;
}

export type FilterChipProps = {
  /** O campo filtrado: "Cliente", "Vencimento". Sai em peso normal, a esquerda. */
  label: string;
  /**
   * O que foi escolhido nesse campo. Sai em peso medio, e corta com
   * reticencias quando passa de 10rem.
   *
   * `string`, e nao `ReactNode` como no web: texto no celular mora dentro de
   * um `Text`, e este valor ainda vai inteiro para o rotulo do xis, que so
   * aceita texto.
   */
  value?: string;
  /** O que acontece no xis. Sem ele nao ha xis: e assim que se mostra filtro que o app trava. */
  onRemove?: () => void;
  /** Trava o xis e apaga a ficha, para a consulta que refaz nao aceitar um segundo toque. */
  disabled?: boolean;
  /**
   * A altura da pilula desenhada, e so ela: o alvo de toque do xis e 44pt nas
   * duas, porque o dedo nao encolhe junto com a ficha.
   */
  size?: ChipSize;
  /** O que o leitor de tela ouve no xis. `remove` recebe "Cliente: Acme", ou so "Cliente" quando a ficha nao tem valor. */
  labels?: { remove?: (filter: string) => string };
  /** Veste a ficha inteira - a faixa de toque de 44pt, e nao a pilula pintada dentro dela. */
  className?: string;
};

export function FilterChip({
  label,
  value,
  onRemove,
  disabled,
  size = "md",
  labels = {},
  className,
}: FilterChipProps) {
  const remove = labels.remove ?? ((filter: string) => `Remover filtro ${filter}`);
  const hasValue = value !== undefined && value !== "";
  const cross = cn(
    "absolute h-[1.5px] w-2.5 rounded-pill",
    disabled ? "bg-fg-disabled" : "bg-fg-subtle",
  );

  return (
    <View
      className={cn(
        "h-11 flex-row items-center gap-1",
        PAD[size],
        disabled && "opacity-60",
        className,
      )}
    >
      <View
        className={cn(
          "absolute right-0 left-0 rounded-pill border border-border bg-surface-raised",
          PILL[size],
        )}
      />

      <Text numberOfLines={1} className={cn("text-fg-muted", FONT[size])}>
        {label}
      </Text>

      {hasValue && (
        <Text numberOfLines={1} className={cn("max-w-40 font-medium text-fg", FONT[size])}>
          {value}
        </Text>
      )}

      {onRemove && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={remove(describe(label, value))}
          accessibilityState={{ disabled: Boolean(disabled) }}
          disabled={disabled}
          onPress={onRemove}
          hitSlop={{ top: 0, bottom: 0, left: 14, right: 14 }}
          className="w-4 items-center justify-center self-stretch"
        >
          <View className={cn(cross, "rotate-45")} />
          <View className={cn(cross, "-rotate-45")} />
        </Pressable>
      )}
    </View>
  );
}

export type AppliedFilter = {
  /** Chave estavel do filtro, e o que identifica a ficha na fileira. */
  id: string;
  /** O campo filtrado: "Cliente". */
  label: string;
  /** O que foi escolhido: "Acme", "01/08 a 31/08". */
  value?: string;
  /** `false` tira o xis desta ficha: o filtro aparece, e sair dele nao e escolha de quem le. */
  removable?: boolean;
};

export type FilterBarProps = {
  /** Os filtros de agora. A peca nao guarda lista propria nem conhece a consulta: ela mostra esta. */
  filters: AppliedFilter[];
  /** O filtro que saiu, com o objeto inteiro, quando o xis dele e apertado. */
  onRemove?: (filter: AppliedFilter) => void;
  /** Chamado quando o "limpar" e apertado, antes do `onFiltersChange`. */
  onClear?: () => void;
  /** Recebe o que sobrou, tanto no xis quanto no limpar. Sozinho ele ja basta. */
  onFiltersChange?: (filters: AppliedFilter[]) => void;
  /** O nome da fileira para o leitor de tela. */
  label?: string;
  /**
   * Guarda a altura da linha quando nao ha filtro nenhum, para a tela nao
   * pular quando o primeiro entra. O que ela guarda e uma faixa de toque de
   * 44pt, que e a altura da fileira cheia. `false` some com a linha e mantem
   * so o aviso.
   */
  reserve?: boolean;
  /** A partir de quantos filtros o "limpar" aparece. Com `1` ele fica sempre, e com `Infinity` nunca. */
  clearFrom?: number;
  /** A altura das pilulas. A fileira tem a mesma altura nas duas. */
  size?: ChipSize;
  /** Trava todos os xis e o limpar, para a consulta que refaz nao aceitar um segundo toque. */
  disabled?: boolean;
  /** Os textos que a peca escreve: `remove` no xis, `clear` no botao de limpar, `status` no aviso vivo e `empty` na linha guardada. */
  labels?: {
    remove?: (filter: string) => string;
    clear?: (total: number) => string;
    status?: (total: number) => string;
    empty?: string;
  };
  /** Veste a fileira inteira. */
  className?: string;
};

export function FilterBar({
  filters,
  onRemove,
  onClear,
  onFiltersChange,
  label = "Filtros aplicados",
  reserve = true,
  clearFrom = 2,
  size = "md",
  disabled,
  labels = {},
  className,
}: FilterBarProps) {
  const total = filters.length;
  const status = labels.status ?? applied;
  const clear = labels.clear ?? ((count: number) => `Limpar ${counted(count)}`);
  const empty = labels.empty ?? applied(0);

  const rtl = I18nManager.getConstants().isRTL;

  const frame = useRef(0);
  const content = useRef(0);
  const passed = useRef(0);
  const [more, setMore] = useState({ left: false, right: false });

  const measure = () => {
    const hidden = Math.max(0, content.current - frame.current);
    const behind = Math.min(Math.max(passed.current, 0), hidden);
    const ahead = hidden - behind;
    const next = rtl
      ? { left: ahead > 1, right: behind > 1 }
      : { left: behind > 1, right: ahead > 1 };

    setMore((current) =>
      current.left === next.left && current.right === next.right ? current : next,
    );
  };

  const onLayout = (event: LayoutChangeEvent) => {
    frame.current = event.nativeEvent.layout.width;
    measure();
  };

  const onContentSizeChange = (width: number) => {
    content.current = width;
    measure();
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;

    content.current = contentSize.width;
    frame.current = layoutMeasurement.width;
    passed.current = rtl
      ? contentSize.width - layoutMeasurement.width - contentOffset.x
      : contentOffset.x;
    measure();
  };

  const canRemove = Boolean(onRemove ?? onFiltersChange);
  const canClear = Boolean(onClear ?? onFiltersChange);
  const line = total === 0 && reserve;

  return (
    <View
      className={cn(
        "w-full flex-row items-center gap-2",
        (total > 0 || reserve) && "h-11",
        className,
      )}
    >
      {total > 0 && (
        <View className="flex-1 self-stretch">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            accessibilityRole="list"
            accessibilityLabel={label}
            scrollEventThrottle={16}
            onLayout={onLayout}
            onContentSizeChange={onContentSizeChange}
            onScroll={onScroll}
            contentContainerClassName="flex-row items-center gap-2"
          >
            {filters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                value={filter.value}
                size={size}
                disabled={disabled}
                labels={labels}
                onRemove={
                  filter.removable === false || !canRemove
                    ? undefined
                    : () => {
                        onRemove?.(filter);
                        onFiltersChange?.(filters.filter((other) => other.id !== filter.id));
                      }
                }
              />
            ))}
          </ScrollView>

          {more.left && <View pointerEvents="none" className={cn(EDGE, "left-0")} />}
          {more.right && <View pointerEvents="none" className={cn(EDGE, "right-0")} />}
        </View>
      )}

      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={status(total)}
        numberOfLines={1}
        className={cn("text-sm text-fg-subtle", !line && "absolute top-0 left-0")}
      >
        {line ? empty : ""}
      </Text>

      {total >= clearFrom && canClear && (
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onPress={() => {
            onClear?.();
            onFiltersChange?.([]);
          }}
        >
          {clear(total)}
        </Button>
      )}
    </View>
  );
}
