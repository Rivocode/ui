"use client";

import {
  cloneElement,
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

export function ChartContainer({
  config,
  className,
  children,
  isLoading,
  isError,
  onRetry,
  errorTitle = "Não foi possível carregar o gráfico",
  errorMessage,
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
  useMissingDataWarning(empty !== undefined && points === undefined);

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

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {isError ? (
        <StateFrame>
          <Alert tone="danger" className="w-full">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>
              {errorMessage ?? "Tente de novo em alguns minutos."}
            </AlertDescription>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} className="mt-3">
                Tentar de novo
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
          {describe(children, label ?? nameFromConfig(config))}
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
