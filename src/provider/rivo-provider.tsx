"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import {
  ToastProvider,
  ToastViewport,
  type ToastLabels,
  type ToastPosition,
} from "../components/toast";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
   * Where dialog, menu and tooltip render. In scoped mode the tokens live on an
   * element of ours, and a portal at the end of the body would come out with no theme. This
   * container
   * carries the same attributes, so the portal stays dressed.
   */
  portalContainer: HTMLElement | null;
};

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivoContext(): RivoContextValue {
  const value = useContext(RivoContext);
  if (!value) {
    throw new Error(
      "[rivocode/ui] A @rivocode/ui component was used outside RivoProvider. Wrap the tree with <RivoProvider>.",
    );
  }
  return value;
}

export type RivoProviderProps = {
  children: ReactNode;
  /**
   * `system` follows the operating system's preference. A client theme's name
   * also works: it is what `data-rc-theme` writes, and layer 3 of the
   * CSS does the rest.
   */
  theme?: RivoThemeSetting;
  density?: RivoDensity;
  /**
   * `global` dresses the whole page, for a new project. `local` dresses only
   * this tree, for when the DS goes into a project inherited from the client and cannot
   * leak into the rest.
   */
  scope?: "global" | "local";
  /**
   * Writing direction. In `rtl` Base UI mirrors what depends on side:
   * which arrow opens the submenu, where Select aligns, where the side
   * sheet comes in from. Layout stays with you, through Tailwind's logical classes
   * (`ps-*`, `pe-*`, `text-start`).
   */
  dir?: "ltr" | "rtl";
  /**
   * Which corner the notices appear in. Default `bottom-right`, which is the one that competes
   * least
   * for space with header, title and main action.
   */
  toastPosition?: ToastPosition;
  /**
   * The notices' texts, to change the language: `dismiss` is the name of each notice's
   * x, "Fechar aviso" without it.
   */
  toastLabels?: Partial<ToastLabels>;
  className?: string;
};

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function resolveSystemTheme(): RivoTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "rivocode-dark";
  return window.matchMedia(LIGHT_QUERY).matches ? "rivocode-light" : "rivocode-dark";
}

function serverSystemTheme(): RivoTheme {
  return "rivocode-dark";
}

function subscribeSystemTheme(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const query = window.matchMedia(LIGHT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function RivoProvider({
  children,
  theme = "rivocode-dark",
  density = "comfortable",
  scope = "global",
  dir = "ltr",
  toastPosition = "bottom-right",
  toastLabels,
  className,
}: RivoProviderProps) {
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    resolveSystemTheme,
    serverSystemTheme,
  );
  const resolved: RivoResolvedTheme = theme === "system" ? systemTheme : theme;

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
            <ToastViewport
              container={portalContainer}
              position={toastPosition}
              labels={toastLabels}
            />
          </ToastProvider>
        </BaseTooltip.Provider>
      </DirectionProvider>
    </RivoContext.Provider>
  );
}
