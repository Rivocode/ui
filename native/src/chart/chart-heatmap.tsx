import { useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import type { RivoNativeColorRole } from "../../tokens";
import { cn, type Slots } from "../cn";
import { Entrance } from "../motion";
import { useRivo } from "../provider";
import { HEAT_ALPHAS, axisOrder, cellNumber, heatStep } from "../shared/chart-layout";
import { Text } from "../text";
import { resolveFormat, type Format } from "../shared/format";
import { ChartEmpty, type ChartEmptyContent } from "./empty";

const LABEL_COLUMN = { maxWidth: "40%" } as const;

export type ChartHeatmapProps<Cell> = {
  /**
   * Uma linha por célula preenchida, no formato longo que a consulta devolve.
   * Combinação que não aparece aqui vira célula vazia, e não zero.
   */
  data: Cell[];
  /** De onde sai a linha da grade. */
  rowKey: keyof Cell & string;
  /** De onde sai a coluna da grade. */
  columnKey: keyof Cell & string;
  /** De onde sai o número. `null` é célula vazia; `0` é valor. */
  valueKey: keyof Cell & string;
  /** A ordem das linhas, e as que existem mesmo sem dado nenhum. */
  rows?: readonly string[];
  /** A ordem das colunas, pela mesma regra de `rows`. */
  columns?: readonly string[];
  /** A cor do degrau mais forte, como papel de token. Sem ela, `chart-1`. */
  color?: RivoNativeColorRole;
  /** O intervalo da escala, `[menor, maior]`. Sem ele, de zero até o maior valor. */
  domain?: readonly [number, number];
  /**
   * Como o numero e escrito: nome de formatador da casa (`currencyShort`,
   * `percent`, `integer`...) ou funcao propria, o mesmo vocabulario do web.
   */
  format?: Format;
  /** O que a grade mede, por extenso: é o nome que o leitor de tela anuncia. */
  label: string;
  /** A régua de cor embaixo da grade. Ligada por padrão. */
  legend?: boolean;
  className?: string;
  /**
   * Os textos da peca, para trocar o idioma: `empty` e o que a leitura diz na
   * celula sem dado, "Sem dado" sem ele, e `next` e `previous` os nomes das
   * duas acoes de ajuste que andam de celula. Passe so os que mudam.
   */
  labels?: Partial<ChartHeatmapLabels>;
  /**
   * Classe por parte: `grid` (a grade que recebe o arrasto), `cell` (cada
   * celula) e `legend` (a regua de cor).
   */
  classNames?: Slots<"grid" | "cell" | "legend">;
  /**
   * O que aparece no lugar da grade quando nao ha celula com numero ou todas
   * dao zero. O mesmo formato do `empty` do `ChartContainer`. Sem ele, a grade
   * toda em zero continua pintando o degrau mais ralo.
   */
  empty?: ChartEmptyContent;
};

export type ChartHeatmapLabels = {
  empty: string;
  next: string;
  previous: string;
};

export function ChartHeatmap<Cell extends Record<string, unknown>>({
  data,
  rowKey,
  columnKey,
  valueKey,
  rows: writtenRows,
  columns: writtenColumns,
  color = "chart-1",
  domain,
  format,
  label,
  legend = true,
  labels,
  className,
  classNames,
  empty,
}: ChartHeatmapProps<Cell>) {
  const emptyLabel = labels?.empty ?? "Sem dado";
  const { colors: theme } = useRivo();
  const paint = theme[color];
  const resolved = resolveFormat(format) as ((value: number) => string) | undefined;
  const say = (value: number) => (resolved ? resolved(value) : String(value));

  const seenRows: string[] = [];
  const seenColumns: string[] = [];
  const values = new Map<string, number | null>();
  for (const cell of data) {
    const row = String(cell[rowKey]);
    const column = String(cell[columnKey]);
    if (!seenRows.includes(row)) seenRows.push(row);
    if (!seenColumns.includes(column)) seenColumns.push(column);
    values.set(`${row}\u0000${column}`, cellNumber(cell[valueKey]));
  }

  const rows = axisOrder(writtenRows, seenRows);
  const columns = axisOrder(writtenColumns, seenColumns);
  const total = rows.length * columns.length;
  const valueAt = (index: number) =>
    values.get(
      `${rows[Math.floor(index / columns.length)]}\u0000${columns[index % columns.length]}`,
    ) ?? null;

  const present = [...values.values()].filter((value): value is number => value !== null);
  const low = domain?.[0] ?? Math.min(0, ...present);
  const high = domain?.[1] ?? (present.length > 0 ? Math.max(...present) : 0);
  const hasEmpty = Array.from({ length: total }, (_, index) => valueAt(index)).some(
    (value) => value === null,
  );

  const [index, setIndex] = useState(0);
  const at = Math.min(Math.max(index, 0), Math.max(total - 1, 0));
  const describe = (cell: number) => {
    const value = valueAt(cell);
    const row = rows[Math.floor(cell / columns.length)];
    const column = columns[cell % columns.length];
    return `${row}, ${column}: ${value === null ? emptyLabel : say(value)}`;
  };

  const area = useRef({ width: 0, height: 0 });
  const shape = useRef({ rows: rows.length, columns: columns.length });
  shape.current = { rows: rows.length, columns: columns.length };

  const moveTo = (x: number, y: number) => {
    const { width, height } = area.current;
    const { rows: count, columns: across } = shape.current;
    if (width <= 0 || height <= 0 || count === 0 || across === 0) return;
    const column = Math.min(Math.max(Math.floor((x / width) * across), 0), across - 1);
    const row = Math.min(Math.max(Math.floor((y / height) * count), 0), count - 1);
    setIndex(row * across + column);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) =>
        moveTo(event.nativeEvent.locationX, event.nativeEvent.locationY),
      onPanResponderMove: (event) =>
        moveTo(event.nativeEvent.locationX, event.nativeEvent.locationY),
    }),
  ).current;

  if (empty && present.every((value) => value === 0)) {
    return (
      <View className={cn("w-full", className)}>
        <ChartEmpty empty={empty} className="min-h-48" />
      </View>
    );
  }

  if (total === 0) return null;

  const every = Math.max(1, Math.ceil(columns.length / 6));

  return (
    <Entrance effect="fadeIn" className={cn("w-full gap-2", className)}>
      <View className="flex-row">
        <View className="shrink pe-2 pt-5" style={LABEL_COLUMN}>
          {rows.map((row) => (
            <View key={row} className="mb-0.5 h-6 justify-center">
              <Text numberOfLines={1} className="text-right text-xs text-fg-subtle">
                {row}
              </Text>
            </View>
          ))}
        </View>

        <View className="min-w-0 flex-1">
          <View className="h-5 flex-row">
            {columns.map((column, position) => (
              <Text
                key={column}
                numberOfLines={1}
                className={cn(
                  "min-w-0 flex-1 text-center text-xs text-fg-subtle",
                  position % every !== 0 && "opacity-0",
                )}
              >
                {column}
              </Text>
            ))}
          </View>

          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityValue={{ text: describe(at) }}
            accessibilityActions={[
              { name: "increment", label: labels?.next ?? "Célula seguinte" },
              { name: "decrement", label: labels?.previous ?? "Célula anterior" },
            ]}
            onAccessibilityAction={(event) => {
              const delta = event.nativeEvent.actionName === "increment" ? 1 : -1;
              setIndex(Math.min(Math.max(at + delta, 0), total - 1));
            }}
            onLayout={(event: LayoutChangeEvent) => {
              const { width, height } = event.nativeEvent.layout;
              area.current = { width, height };
            }}
            className={classNames?.grid}
            {...pan.panHandlers}
          >
            {rows.map((row, rowIndex) => (
              <View key={row} pointerEvents="none" className="mb-0.5 h-6 flex-row gap-0.5">
                {columns.map((column, columnIndex) => {
                  const cell = rowIndex * columns.length + columnIndex;
                  const value = valueAt(cell);
                  const step =
                    value === null ? null : heatStep(value, low, high, HEAT_ALPHAS.length);
                  const chosen = cell === at;

                  return (
                    <View
                      key={column}
                      pointerEvents="none"
                      className={cn("min-w-0 flex-1 overflow-hidden rounded-sm", classNames?.cell)}
                      style={
                        step === null
                          ? {
                              borderWidth: 1,
                              borderStyle: "dashed",
                              borderColor: theme["border-strong"],
                            }
                          : undefined
                      }
                    >
                      {step !== null && (
                        <View
                          pointerEvents="none"
                          className="absolute inset-0"
                          style={{ backgroundColor: paint, opacity: HEAT_ALPHAS[step] }}
                        />
                      )}
                      {chosen && (
                        <View
                          pointerEvents="none"
                          className="absolute inset-0 rounded-sm"
                          style={{ borderWidth: 2, borderColor: theme.fg }}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text
        numberOfLines={1}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="text-xs text-fg-muted"
      >
        {describe(at)}
      </Text>

      {legend && (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className={cn("flex-row flex-wrap items-center gap-x-4 gap-y-2", classNames?.legend)}
        >
          <View className="flex-row items-center gap-1.5">
            <Text font="mono" className="text-xs text-fg-subtle">
              {say(low)}
            </Text>
            <View className="flex-row gap-0.5">
              {HEAT_ALPHAS.map((alpha) => (
                <View key={alpha} className="h-3 w-5 overflow-hidden rounded-sm">
                  <View
                    className="absolute inset-0"
                    style={{ backgroundColor: paint, opacity: alpha }}
                  />
                </View>
              ))}
            </View>
            <Text font="mono" className="text-xs text-fg-subtle">
              {say(high)}
            </Text>
          </View>
          {hasEmpty && (
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-3 w-5 rounded-sm"
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: theme["border-strong"],
                }}
              />
              <Text className="text-xs text-fg-subtle">{emptyLabel}</Text>
            </View>
          )}
        </View>
      )}
    </Entrance>
  );
}
