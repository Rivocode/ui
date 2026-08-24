"use client";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { ToastProvider, ToastViewport } from "../primitives/toast";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "../lib/cn";

export type RivoTheme = "rivocode-dark" | "rivocode-light";
export type RivoDensity = "comfortable" | "compact";

type RivoContextValue = {
  theme: RivoTheme;
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
  /** `system` segue a preferencia do sistema operacional. */
  theme?: RivoTheme | "system";
  density?: RivoDensity;
  /**
   * `global` veste a pagina inteira, para projeto novo. `local` veste apenas
   * esta arvore, para quando o DS entra num projeto herdado do cliente e nao
   * pode vazar para o resto.
   */
  scope?: "global" | "local";
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
  className,
}: RivoProviderProps) {
  const [systemTheme, setSystemTheme] = useState<RivoTheme>(resolveSystemTheme);
  const resolved: RivoTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystemTheme(query.matches ? "rivocode-light" : "rivocode-dark");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [theme]);

  useEffect(() => {
    if (scope !== "global") return;
    const root = document.documentElement;
    root.dataset.rcTheme = resolved;
    root.dataset.rcDensity = density;
  }, [scope, resolved, density]);

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement("div");
    node.dataset.rcPortal = "";
    document.body.appendChild(node);
    setPortalContainer(node);
    return () => {
      node.remove();
    };
  }, []);

  useEffect(() => {
    if (!portalContainer) return;
    portalContainer.dataset.rcTheme = resolved;
    portalContainer.dataset.rcDensity = density;
  }, [portalContainer, resolved, density]);

  const value = useMemo<RivoContextValue>(
    () => ({ theme: resolved, density, portalContainer }),
    [resolved, density, portalContainer],
  );

  // O provedor de dica mora aqui de proposito: quem usa a biblioteca nao
  // deveria precisar montar provedor so para uma dica aparecer.
  return (
    <RivoContext.Provider value={value}>
      <BaseTooltip.Provider delay={300}>
        <ToastProvider>
          {scope === "local" ? (
            <div
              data-rc-theme={resolved}
              data-rc-density={density}
              className={cn("bg-bg font-sans text-fg", className)}
            >
              {children}
            </div>
          ) : (
            children
          )}
          <ToastViewport container={portalContainer} />
        </ToastProvider>
      </BaseTooltip.Provider>
    </RivoContext.Provider>
  );
}
