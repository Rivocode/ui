"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { ToastProvider, ToastViewport, type ToastPosition } from "../components/toast";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";

export type RivoTheme = "rivocode-dark" | "rivocode-light";

export type RivoThemeSetting = RivoTheme | "system" | (string & {});

export type RivoResolvedTheme = RivoTheme | (string & {});
export type RivoDensity = "comfortable" | "compact";

type RivoContextValue = {
  theme: RivoResolvedTheme;
  density: RivoDensity;
  /**
   * Onde dialogo, menu e dica renderizam. No modo escopado os tokens vivem num
   * elemento nosso, e um portal no fim do body sairia sem tema. Este container
   * carrega os mesmos atributos, entao o portal continua vestido.
   */
  portalContainer: HTMLElement | null;
};

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivoContext(): RivoContextValue {
  const value = useContext(RivoContext);
  if (!value) {
    throw new Error(
      "Componente do @rivocode/ui usado fora do RivoProvider. Envolva a arvore com <RivoProvider>.",
    );
  }
  return value;
}

export type RivoProviderProps = {
  children: ReactNode;
  /**
   * `system` segue a preferencia do sistema operacional. O nome de um tema de
   * cliente tambem vale: e o que o `data-rc-theme` escreve, e a camada 3 do
   * CSS faz o resto.
   */
  theme?: RivoThemeSetting;
  density?: RivoDensity;
  /**
   * `global` veste a pagina inteira, para projeto novo. `local` veste apenas
   * esta arvore, para quando o DS entra num projeto herdado do cliente e nao
   * pode vazar para o resto.
   */
  scope?: "global" | "local";
  /**
   * Sentido da escrita. Em `rtl` a Base UI espelha o que depende de lado:
   * qual seta abre o submenu, para onde o Select alinha, de onde a folha
   * lateral entra. Layout continua com voce, pelas classes logicas do Tailwind
   * (`ps-*`, `pe-*`, `text-start`).
   */
  dir?: "ltr" | "rtl";
  /**
   * Em que canto os avisos aparecem. Padrao `bottom-right`, que e o que menos
   * disputa espaco com cabecalho, titulo e acao principal.
   */
  toastPosition?: ToastPosition;
  className?: string;
};

function resolveSystemTheme(): RivoTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "rivocode-dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "rivocode-light"
    : "rivocode-dark";
}

export function RivoProvider({
  children,
  theme = "rivocode-dark",
  density = "comfortable",
  scope = "global",
  dir = "ltr",
  toastPosition = "bottom-right",
  className,
}: RivoProviderProps) {
  const [systemTheme, setSystemTheme] = useState<RivoTheme>(resolveSystemTheme);
  const resolved: RivoResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystemTheme(query.matches ? "rivocode-light" : "rivocode-dark");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [theme]);

  const probe = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (scope !== "global") return;
    const root = (probe.current?.ownerDocument ?? document).documentElement;
    root.dataset.rcTheme = resolved;
    root.dataset.rcDensity = density;
    root.dir = dir;
  }, [scope, resolved, density, dir]);

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const doc = probe.current?.ownerDocument ?? document;
    const node = doc.createElement("div");
    node.dataset.rcPortal = "";
    doc.body.appendChild(node);
    setPortalContainer(node);
    return () => {
      node.remove();
    };
  }, []);

  useEffect(() => {
    if (!portalContainer) return;
    portalContainer.dataset.rcTheme = resolved;
    portalContainer.dataset.rcDensity = density;
    portalContainer.dir = dir;
  }, [portalContainer, resolved, density, dir]);

  const value = useMemo<RivoContextValue>(
    () => ({ theme: resolved, density, portalContainer }),
    [resolved, density, portalContainer],
  );

  return (
    <RivoContext.Provider value={value}>
      <DirectionProvider direction={dir}>
        <BaseTooltip.Provider delay={300}>
          <ToastProvider>
            {scope === "local" ? (
              <div
                data-rc-theme={resolved}
                data-rc-density={density}
                dir={dir}
                className={cn("bg-bg font-sans text-fg", className)}
              >
                {children}
              </div>
            ) : (
              children
            )}
            <span ref={probe} hidden />
            <ToastViewport container={portalContainer} position={toastPosition} />
          </ToastProvider>
        </BaseTooltip.Provider>
      </DirectionProvider>
    </RivoContext.Provider>
  );
}
