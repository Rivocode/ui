"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { ResponsiveContainer } from "recharts";

import { Alert, AlertDescription, AlertTitle } from "../components/alert";
import { Button } from "../components/button";
import { EmptyState } from "../components/empty-state";
import { Skeleton } from "../components/skeleton";
import { cn } from "../lib/cn";
import { LoadingAnnouncement } from "../lib/loading-announcement";
import { SETTLED } from "../shared/settled";

export type ChartConfig = Record<
  string,
  {
    /** O nome legivel da serie. Vai para a dica e para a legenda. */
    label: string;
    /**
     * A cor da serie. Sem ela, entra a proxima da paleta, na ordem em que a
     * serie aparece no `config`.
     */
    color?: string;
  }
>;

export type ChartContainerProps = Omit<ComponentProps<"div">, "children"> & {
  config: ChartConfig;
  /** Um unico grafico da Recharts: `LineChart`, `BarChart`, `AreaChart`. */
  children: ReactElement;

  isLoading?: boolean;
  isError?: boolean;
  /** Sem isto, o erro nao oferece nova tentativa. */
  onRetry?: () => void;
  /**
   * O titulo do aviso de erro. Sem ele, "Nao foi possivel carregar o grafico".
   *
   * O mesmo nome e o mesmo papel do `errorTitle` do `DataTable`: um painel com
   * quatro graficos precisa dizer qual deles falhou, e um produto que nao fala
   * portugues precisa dizer isso em outra lingua.
   */
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  /**
   * O nome do botao que executa o `onRetry`. Sem ele, "Tentar de novo".
   *
   * O `errorTitle` acima ja dizia que um produto que nao fala portugues
   * precisa dizer isso em outra lingua, e o botao da mesma caixa nao tinha
   * como: a tela em ingles saia com o titulo traduzido e o botao em portugues.
   * O mesmo nome nas quatro pecas de consulta.
   */
  retryLabel?: ReactNode;
  /**
   * O que aparece quando a consulta volta sem nenhum ponto. O mesmo formato do
   * `DataTable`, `action` inclusive - ela e a saida que o `EmptyState`
   * considera fortemente recomendada, e faltava so aqui.
   */
  empty?: { title: ReactNode; description: ReactNode; action?: ReactNode; icon?: ReactNode };
  /**
   * Os pontos, para a moldura saber contar zero.
   *
   * Quase sempre dispensavel: sem ela, a contagem sai do `data` do proprio
   * grafico da Recharts que vem como filho. Passe a sua quando os pontos nao
   * moram no filho direto - `<ScatterChart>` com o `data` no `<Scatter>`, por
   * exemplo - ou quando a serie desenhada nao for a que decide o vazio.
   */
  data?: readonly unknown[];

  /**
   * O que o leitor de tela ouve no lugar do desenho.
   *
   * Sem ela, o nome sai dos rotulos das series do `config` - que ja e uma
   * frase, e nao o amontoado de ticks que o SVG daria sozinho. Escreva a sua
   * quando o grafico responde a uma pergunta ("Faturamento por mes, em reais"):
   * a serie diz o que foi medido, e nao o que a tela pergunta.
   */
  label?: string;
};

export const PALETTE = Array.from({ length: 8 }, (_, index) => `var(--rc-chart-${index + 1})`);

const PAINTED: Record<string, readonly ("fill" | "stroke")[]> = {
  Area: ["fill", "stroke"],
  Bar: ["fill"],
  Line: ["stroke"],
  Radar: ["fill", "stroke"],
};

type MarkProps = {
  dataKey?: unknown;
  fill?: unknown;
  stroke?: unknown;
  children?: ReactNode;
};

function markName(type: ReactElement["type"]): string {
  if (typeof type === "string") return type;
  return (type as { displayName?: string }).displayName ?? "";
}

function repaint(node: ReactNode, config: ChartConfig, unknown: Set<string>): ReactNode {
  return Children.map(node, (child) => {
    if (!isValidElement(child)) return child;

    const written = child.props as MarkProps;
    const roles = PAINTED[markName(child.type)];
    const patch: Record<string, unknown> = {};

    if (
      roles &&
      typeof written.dataKey === "string" &&
      written.fill === undefined &&
      written.stroke === undefined
    ) {
      if (written.dataKey in config) {
        for (const role of roles) patch[role] = `var(--color-${written.dataKey})`;
      } else {
        unknown.add(written.dataKey);
      }
    }

    if (written.children !== undefined && typeof written.children !== "function") {
      patch.children = repaint(written.children, config, unknown);
    }

    return Object.keys(patch).length > 0 ? cloneElement(child, patch) : child;
  });
}

export function seriesColors(
  chart: ReactElement,
  config: ChartConfig,
): { chart: ReactElement; unknown: string[] } {
  const written = chart.props as MarkProps;
  if (written.children === undefined || typeof written.children === "function") {
    return { chart, unknown: [] };
  }

  const missing = new Set<string>();
  const painted = cloneElement(chart, {
    children: repaint(written.children, config, missing),
  } as Partial<MarkProps>);

  return { chart: painted, unknown: [...missing] };
}

export function unknownSeriesComplaint(key: string, known: readonly string[]): string {
  return (
    `[rivocode/ui] <ChartContainer>: a marca com \`dataKey\` "${key}" não tem cor, e o ` +
    `\`config\` não conhece essa série - a Recharts pinta a marca de preto, e não há erro ` +
    "nenhum. As séries deste gráfico são: " +
    `${known.join(", ")}. Corrija a chave, ou declare a série no \`config\` - a moldura ` +
    "pinta sozinha toda marca que nasce sem `fill` e sem `stroke`."
  );
}

function useUnknownSeriesWarning(keys: string, known: string) {
  useEffect(() => {
    if (keys === "" || process.env.NODE_ENV === "production") return;

    for (const key of keys.split(",")) console.warn(unknownSeriesComplaint(key, known.split(",")));
  }, [keys, known]);
}

export function ChartContainer({
  config,
  className,
  children,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar o gráfico",
  errorMessage,
  retryLabel = "Tentar de novo",
  empty,
  data,
  label,
  ...props
}: ChartContainerProps) {
  const id = useId().replace(/:/g, "");

  const colors = Object.entries(config)
    .map(([key, series], index) => {
      const color = series.color ?? PALETTE[index % PALETTE.length];
      return `--color-${key}: ${color};`;
    })
    .join("\n  ");

  const points = data ?? dataOfChild(children);
  const painted = seriesColors(children, config);

  useMissingDataWarning(empty !== undefined && points === undefined);
  useFlatBoxWarning(id);
  useUnknownSeriesWarning(painted.unknown.join(","), Object.keys(config).join(","));

  const announcement = useActivePointAnnouncement(id);

  return (
    <div
      {...props}
      data-rc-chart={id}
      className={cn(
        "w-full font-sans",
        "[&_.recharts-cartesian-axis-tick_text]:fill-fg-subtle",
        "[&_.recharts-cartesian-axis-tick_text]:text-xs",
        "[&_.recharts-cartesian-grid_line]:stroke-chart-grid",
        "[&_.recharts-cartesian-axis-line]:stroke-border",
        "[&_.recharts-cartesian-axis-tick-line]:stroke-border",
        "[&_.recharts-legend-item-text]:text-sm",
        "[&_.recharts-legend-item-text]:!text-fg-muted",
        "[&_.recharts-tooltip-cursor]:fill-accent-subtle",
        "[&_.recharts-tooltip-cursor]:stroke-border",
        "[&_.recharts-reference-line_line]:stroke-border-strong",
        "[&_.recharts-surface]:outline-none",
        "[&_.recharts-surface:focus-visible]:outline-solid",
        "[&_.recharts-surface:focus-visible]:outline-2",
        "[&_.recharts-surface:focus-visible]:-outline-offset-2",
        "[&_.recharts-surface:focus-visible]:outline-ring",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: `[data-rc-chart="${id}"] {\n  ${colors}\n}` }} />

      <div role="status" aria-live="polite" data-rc-active-point="" className="sr-only">
        {announcement}
      </div>

      {!isError && <LoadingAnnouncement loading={isLoading === true} />}

      {isError ? (
        <StateFrame>
          <Alert tone="danger" className="w-full">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </AlertDescription>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
                {retryLabel}
              </Button>
            )}
          </Alert>
        </StateFrame>
      ) : isLoading ? (
        <StateFrame>
          <div className="flex h-full w-full items-end gap-3 px-2 pb-6">
            {[0.45, 0.7, 0.35, 0.85, 0.6, 0.75].map((height, index) => (
              <Skeleton key={index} className="w-full" style={{ height: `${height * 100}%` }} />
            ))}
          </div>
        </StateFrame>
      ) : empty && points && points.length === 0 ? (
        <StateFrame>
          <EmptyState
            title={empty.title}
            description={empty.description}
            icon={empty.icon}
            action={empty.action}
          />
        </StateFrame>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {describe(painted.chart, label ?? nameFromConfig(config))}
        </ResponsiveContainer>
      )}
    </div>
  );
}

function dataOfChild(child: ReactElement): readonly unknown[] | undefined {
  const written = child.props as { data?: unknown };
  return Array.isArray(written.data) ? written.data : undefined;
}

function useMissingDataWarning(missing: boolean) {
  useEffect(() => {
    if (!missing || process.env.NODE_ENV === "production") return;

    console.warn(
      "[rivocode/ui] <ChartContainer empty={...}> sem pontos para contar: nem a prop " +
        "`data` foi passada, nem o grafico filho carrega um `data`. O estado vazio nunca " +
        "vai aparecer, e o grafico desenha eixos sobre o nada. Passe `data={pontos}` no " +
        "ChartContainer - e o mesmo array que voce ja entrega ao grafico.",
    );
  }, [missing]);
}

export function flatBoxComplaint(width: number, height: number): string | undefined {
  if (!(width > 0 && height === 0)) return undefined;

  return (
    "[rivocode/ui] <ChartContainer>: a moldura mediu largura e nenhuma altura, e a Recharts " +
    "desenhou num retangulo de 0px - o cartao fica vazio, sem erro nenhum. A altura vem de " +
    'quem usa a moldura: de a ela uma classe de altura (className="h-64"), ou altura ao pai ' +
    "que a segura."
  );
}

function useFlatBoxWarning(chartId: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const root = document.querySelector<HTMLElement>(`[data-rc-chart="${chartId}"]`);
    if (!root) return;

    const waiting = setTimeout(() => {
      const complaint = flatBoxComplaint(root.clientWidth, root.clientHeight);
      if (complaint) console.warn(complaint);
    }, SETTLED);

    return () => clearTimeout(waiting);
  }, [chartId]);
}

const NAVIGATION_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);

function readableTip(tip: Node): string {
  const walker = document.createTreeWalker(tip, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const piece = node.textContent?.trim();
    if (piece) parts.push(piece);
  }

  return parts.join(", ");
}

function useActivePointAnnouncement(chartId: string): string {
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(`[data-rc-chart="${chartId}"]`);
    if (!root) return;

    let byKeyboard = false;
    const clear = () => setAnnouncement((current) => (current === "" ? current : ""));

    const onKeyDown = (event: KeyboardEvent) => {
      if (NAVIGATION_KEYS.has(event.key)) byKeyboard = true;
    };
    const onPointer = () => {
      byKeyboard = false;
    };
    const onFocusOut = () => {
      byKeyboard = false;
      clear();
    };

    const observer = new MutationObserver(() => {
      if (!byKeyboard) return;

      const tip = root.querySelector(".recharts-tooltip-wrapper");
      const text = tip ? readableTip(tip) : "";
      setAnnouncement((current) => (current === text ? current : text));
    });

    observer.observe(root, { subtree: true, childList: true, characterData: true });
    root.addEventListener("keydown", onKeyDown);
    root.addEventListener("pointermove", onPointer);
    root.addEventListener("pointerdown", onPointer);
    root.addEventListener("focusout", onFocusOut);

    return () => {
      observer.disconnect();
      root.removeEventListener("keydown", onKeyDown);
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerdown", onPointer);
      root.removeEventListener("focusout", onFocusOut);
    };
  }, [chartId]);

  return announcement;
}

function nameFromConfig(config: ChartConfig) {
  const series = Object.values(config)
    .map((entry) => entry.label)
    .filter(Boolean);

  return series.length > 0 ? `Gráfico de ${series.join(", ")}` : "Gráfico";
}

function describe(chart: ReactElement, name: string) {
  type A11y = { role?: string; "aria-label"?: string };
  const written = chart.props as A11y;

  return cloneElement(chart as ReactElement<A11y>, {
    role: written.role ?? "img",
    "aria-label": written["aria-label"] ?? name,
  });
}

function StateFrame({ children }: { children: ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center">{children}</div>;
}
