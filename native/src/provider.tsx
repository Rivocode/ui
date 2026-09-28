import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, Platform, View, useColorScheme } from "react-native";
import { useCssElement } from "nativewind";

import { tokens, type RivoNativeColorRole, type RivoNativeTheme } from "../tokens";
import { FontProvider, fontComplaints, fontWarning, resolveFonts, type RivoFonts } from "./font";
import { KeyboardRoot } from "./keyboard";
import { ToastProvider } from "./toast";

export type RivoNativeColors = Record<RivoNativeColorRole, string>;

type RivoContextValue = {
  /** The resolved scheme: with `theme="system"`, this is what the device asked for. */
  theme: RivoNativeTheme;
  /**
   * The roles read from the COMPILED CSS, one per `bg-` class, of the theme
   * currently painting. A component that paints outside the class - the Switch
   * track, the ChartDonut slice - reads from here: it is the same color the
   * class applies, so what the app overrides in CSS reaches both sides at once.
   */
  colors: RivoNativeColors;
};

const ROLES = Object.keys(tokens.themes["rivocode-dark"]) as RivoNativeColorRole[];

const PAINT = { className: "style" } as const;

const Swatch = (props: { style?: unknown }) => createElement("RivoSwatch", props);

const schemeWarning = (asked: "light" | "dark") =>
  "[rivocode/ui-native] <RivoProvider>: this runtime has no `Appearance.setColorScheme` - which is the case " +
  "for react-native-web -, so the `" +
  asked +
  "` scheme you asked for was NOT applied, and without this warning nothing would say so. Color painted by class comes from " +
  "`light-dark()`, which resolves by the element's `color-scheme` and never by this call: declare " +
  "`color-scheme: " +
  asked +
  "` on the document root for the screen to match the requested theme, or use " +
  '<RivoProvider theme="system"> together with `color-scheme: light dark`, which follows the browser on both ' +
  "sides. The color the component reads from context comes from that same document and is re-read whenever the " +
  "`color-scheme` or the root class changes - including when your app declares it inside an " +
  "effect, after this mount -, so both sides come out in the same scheme instead of half the screen " +
  "in each.";

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivo() {
  const value = useContext(RivoContext);
  if (!value) throw new Error("useRivo needs a RivoProvider above it.");
  return value;
}

function colorIn(style: unknown): string | undefined {
  if (Array.isArray(style)) {
    for (let at = style.length - 1; at >= 0; at--) {
      const found = colorIn(style[at]);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const painted = (style as { backgroundColor?: unknown } | null | undefined)?.backgroundColor;
  return typeof painted === "string" ? painted : undefined;
}

function backgroundOf(element: unknown, depth = 0): string | undefined {
  const props = (element as { props?: { style?: unknown; children?: unknown } } | null | undefined)
    ?.props;
  if (!props) return undefined;
  const painted = colorIn(props.style);
  if (painted !== undefined) return painted;
  return depth < 4 ? backgroundOf(props.children, depth + 1) : undefined;
}

function useCssRoleColors() {
  const painted: (string | undefined)[] = [];
  for (const role of ROLES) {
    painted.push(backgroundOf(useCssElement(Swatch, { className: `bg-${role}` }, PAINT)));
  }
  return painted;
}

type ProbeNode = {
  className: string;
  setAttribute: (name: string, value: string) => void;
  remove: () => void;
};

type Watcher = {
  observe: (node: unknown, options: unknown) => void;
  disconnect: () => void;
};

type SchemeQuery = {
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
  addListener?: (listener: () => void) => void;
  removeListener?: (listener: () => void) => void;
};

type Browser = {
  document?: {
    createElement?: (tag: string) => ProbeNode;
    documentElement?: unknown;
    body?: { appendChild?: (node: unknown) => void } | null;
  };
  getComputedStyle?: (node: unknown) => { backgroundColor?: string } | null;
  MutationObserver?: new (callback: () => void) => Watcher;
  matchMedia?: (query: string) => SchemeQuery | null;
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (handle: number) => void;
};

const TRANSPARENT = /^(?:transparent|rgba\(0,\s*0,\s*0,\s*0\))$/;

function domRoleColors(): (string | undefined)[] | undefined {
  const browser = globalThis as unknown as Browser;
  const page = browser.document;
  const measure = browser.getComputedStyle;
  if (!page?.createElement || !page.body?.appendChild || !measure) return undefined;

  const probe = page.createElement("div");
  probe.setAttribute(
    "style",
    "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none",
  );
  page.body.appendChild(probe);
  try {
    return ROLES.map((role) => {
      probe.className = `bg-${role}`;
      const painted = measure.call(browser, probe)?.backgroundColor;
      return painted && !TRANSPARENT.test(painted) ? painted : undefined;
    });
  } finally {
    probe.remove();
  }
}

const ROOT_ATTRIBUTES = { attributes: true, attributeFilter: ["style", "class"] } as const;

const DARK_QUERY = "(prefers-color-scheme: dark)";

function watchScheme(reread: () => void): () => void {
  const browser = globalThis as unknown as Browser;
  const stops: (() => void)[] = [];

  const Observer = browser.MutationObserver;
  if (Observer) {
    const watcher = new Observer(reread);
    let watching = false;
    for (const root of [browser.document?.documentElement, browser.document?.body]) {
      if (!root) continue;
      watcher.observe(root, ROOT_ATTRIBUTES);
      watching = true;
    }
    if (watching) stops.push(() => watcher.disconnect());
  }

  const query = browser.matchMedia?.call(browser, DARK_QUERY);
  const listen = query?.addEventListener;
  const forget = query?.removeEventListener;
  const listenOld = query?.addListener;
  const forgetOld = query?.removeListener;
  if (query && listen && forget) {
    listen.call(query, "change", reread);
    stops.push(() => forget.call(query, "change", reread));
  } else if (query && listenOld && forgetOld) {
    listenOld.call(query, reread);
    stops.push(() => forgetOld.call(query, reread));
  }

  const frame = browser.requestAnimationFrame;
  if (frame) {
    const handle = frame.call(browser, reread);
    stops.push(() => browser.cancelAnimationFrame?.call(browser, handle));
  } else {
    const timer = setTimeout(reread, 0);
    stops.push(() => clearTimeout(timer));
  }

  return () => {
    for (const stop of stops) stop();
  };
}

export type RivoProviderProps = {
  children: ReactNode;
  /**
   * `rivocode-dark` is the default, as on the web; `system` follows the device.
   * Layer 3 here is overriding the `--color-*` roles in the app's CSS before
   * compiling.
   */
  theme?: RivoNativeTheme | "system";
  /**
   * The families the APP has already loaded with `expo-font`, one per role. The
   * library never loads a font: it only passes the name along, and a role left
   * out uses the system font.
   */
  fonts?: RivoFonts;
  /**
   * The `isLoaded` from `expo-font`, so the provider can check in `__DEV__`
   * whether each name in `fonts` actually reached the device. Without it a name
   * error only shows up as text in the wrong font, with no warning at all.
   */
  isFontLoaded?: (family: string) => boolean;
};

export function RivoProvider({
  children,
  theme = "rivocode-dark",
  fonts,
  isFontLoaded,
}: RivoProviderProps) {
  const { sans, display, mono } = fonts ?? {};
  const families = useMemo(() => resolveFonts({ sans, display, mono }), [sans, display, mono]);

  useEffect(() => {
    if (!__DEV__) return;
    const complaints = fontComplaints({ sans, display, mono }, isFontLoaded);
    if (complaints.length > 0) console.warn(fontWarning(complaints));
  }, [sans, display, mono, isFontLoaded]);

  const asked = theme === "system" ? "unspecified" : theme === "rivocode-light" ? "light" : "dark";

  useEffect(() => {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(asked);
      return;
    }
    if (__DEV__ && asked !== "unspecified") console.warn(schemeWarning(asked));
  }, [asked]);

  const device = useColorScheme();
  const light = theme === "rivocode-light" || (theme === "system" && device === "light");

  const resolved: RivoNativeTheme = light ? "rivocode-light" : "rivocode-dark";
  const base = tokens.themes[resolved] as RivoNativeColors;

  const fromCss = useCssRoleColors();
  const [fromDom, setFromDom] = useState<(string | undefined)[] | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const reread = () => {
      const read = domRoleColors();
      if (!read) return;
      const next = read.join("|");
      setFromDom((worn) => (worn !== undefined && worn.join("|") === next ? worn : read));
    };

    reread();
    return watchScheme(reread);
  }, [resolved]);

  const painted = fromDom ?? fromCss;
  const signature = painted.join("|");

  const colors = useMemo(() => {
    const worn: Record<string, string> = { ...base };
    ROLES.forEach((role, at) => {
      const color = painted[at];
      if (color) worn[role] = color;
    });
    return worn as RivoNativeColors;
  }, [base, signature]);

  const value = useMemo(() => ({ theme: resolved, colors }), [resolved, colors]);

  return (
    <RivoContext.Provider value={value}>
      <FontProvider value={families}>
        <KeyboardRoot>
          <View className="flex-1 bg-bg">
            <ToastProvider>{children}</ToastProvider>
          </View>
        </KeyboardRoot>
      </FontProvider>
    </RivoContext.Provider>
  );
}
