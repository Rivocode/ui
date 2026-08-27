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
import { ToastProvider } from "./toast";

export type RivoNativeColors = Record<RivoNativeColorRole, string>;

/** @deprecated O mapa nao veste mais nada: sobrescreva os papeis --color-* no CSS do app. */
export type RivoNativeThemeMap = { light: RivoNativeColors; dark: RivoNativeColors };

type RivoContextValue = {
  /**
   * O esquema resolvido: com `theme="system"`, aqui chega o que o aparelho
   * pediu; com tema de cliente, o de casa mais proximo dele.
   */
  theme: RivoNativeTheme;
  /**
   * Os papeis lidos do CSS COMPILADO, um por classe `bg-`, do tema que pinta
   * agora. Peca que pinta por fora da classe - o trilho do Switch, a fatia do
   * ChartDonut - le daqui: e a mesma cor que a classe aplica, entao o que o
   * app sobrescreve no CSS chega aos dois lados de uma vez.
   */
  colors: RivoNativeColors;
};

const ROLES = Object.keys(tokens.themes["rivocode-dark"]) as RivoNativeColorRole[];

const PAINT = { className: "style" } as const;

const Swatch = (props: { style?: unknown }) => createElement("RivoSwatch", props);

const CLIENT_THEME_WARNING =
  "[rivocode/ui-native] <RivoProvider theme={{ light, dark }}>: o mapa de tema está " +
  "descontinuado e não veste mais nada. Ele nunca alcançou o que é pintado por classe - o " +
  "compilador do react-native-css crava o valor do token dentro da classe em build -, então " +
  "vestia só as peças que leem cor do contexto, e a tela saía com o gráfico de um tema e o " +
  "botão de outro. Agora o provider lê os 45 papéis do CSS compilado, e contexto e classe " +
  "dizem sempre a mesma cor. Para vestir um cliente, sobrescreva os papéis `--color-*` no CSS " +
  "do app antes de compilar: é o único caminho que alcança a tela inteira, e ele agora alcança " +
  "também a cor que a peça lê do contexto.";

const schemeWarning = (asked: "light" | "dark") =>
  "[rivocode/ui-native] <RivoProvider>: este runtime não tem `Appearance.setColorScheme` - é o caso " +
  "do react-native-web -, então o esquema `" +
  asked +
  "` que você pediu NÃO foi imposto, e sem este aviso nada diria. A cor pintada por classe sai de " +
  "`light-dark()`, que resolve pelo `color-scheme` do elemento e nunca por esta chamada: declare " +
  "`color-scheme: " +
  asked +
  "` na raiz do documento para a tela casar com o tema pedido, ou use " +
  '<RivoProvider theme="system"> junto de `color-scheme: light dark`, que segue o navegador dos ' +
  "dois lados. A cor que a peça lê do contexto continua sendo a do tema pedido, para os dois lados " +
  "combinarem quando você declarar.";

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivo() {
  const value = useContext(RivoContext);
  if (!value) throw new Error("useRivo precisa de um RivoProvider acima.");
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

type Browser = {
  document?: {
    createElement?: (tag: string) => ProbeNode;
    body?: { appendChild?: (node: unknown) => void };
  };
  getComputedStyle?: (node: unknown) => { backgroundColor?: string } | null;
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

export type RivoProviderProps = {
  children: ReactNode;
  /**
   * `rivocode-dark` e o padrao, como no web; `system` segue o aparelho. O
   * objeto de tema esta descontinuado e nao veste nada: a camada 3 aqui e
   * sobrescrever os papeis `--color-*` no CSS do app antes de compilar.
   */
  theme?: RivoNativeTheme | "system" | RivoNativeThemeMap;
  /**
   * Claro ou escuro, quando o tema e de cliente. Com tema de casa quem decide
   * e o proprio nome do tema, entao esta prop nao se aplica.
   */
  scheme?: "light" | "dark" | "system";
  /**
   * As familias que o APP ja carregou com o `expo-font`, uma por papel. A
   * biblioteca nunca carrega fonte: ela so passa o nome adiante, e o papel que
   * ficar de fora sai na fonte do sistema.
   */
  fonts?: RivoFonts;
  /**
   * O `isLoaded` do `expo-font`, para o provider conferir em `__DEV__` se cada
   * nome de `fonts` chegou mesmo ao aparelho. Sem ele o erro de nome so
   * aparece como texto na fonte errada, sem aviso nenhum.
   */
  isFontLoaded?: (family: string) => boolean;
};

export function RivoProvider({
  children,
  theme = "rivocode-dark",
  scheme = "system",
  fonts,
  isFontLoaded,
}: RivoProviderProps) {
  const custom = typeof theme === "object" ? theme : undefined;
  const { sans, display, mono } = fonts ?? {};
  const families = useMemo(() => resolveFonts({ sans, display, mono }), [sans, display, mono]);

  useEffect(() => {
    if (!__DEV__) return;
    const complaints = fontComplaints({ sans, display, mono }, isFontLoaded);
    if (complaints.length > 0) console.warn(fontWarning(complaints));
  }, [sans, display, mono, isFontLoaded]);

  const dressing = Boolean(custom);
  useEffect(() => {
    if (__DEV__ && dressing) console.warn(CLIENT_THEME_WARNING);
  }, [dressing]);

  const wanted = custom ? scheme : theme;
  const asked =
    wanted === "system"
      ? "unspecified"
      : wanted === "rivocode-light" || wanted === "light"
        ? "light"
        : "dark";

  useEffect(() => {
    if (typeof Appearance.setColorScheme === "function") {
      Appearance.setColorScheme(asked);
      return;
    }
    if (__DEV__ && asked !== "unspecified") console.warn(schemeWarning(asked));
  }, [asked]);

  const device = useColorScheme();
  const light = custom
    ? scheme === "system"
      ? device === "light"
      : scheme === "light"
    : theme === "rivocode-light" || (theme === "system" && device === "light");

  const resolved: RivoNativeTheme = light ? "rivocode-light" : "rivocode-dark";
  const base = tokens.themes[resolved] as RivoNativeColors;

  const fromCss = useCssRoleColors();
  const [fromDom, setFromDom] = useState<(string | undefined)[] | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    setFromDom(domRoleColors());
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
        <View className="flex-1 bg-bg">
          <ToastProvider>{children}</ToastProvider>
        </View>
      </FontProvider>
    </RivoContext.Provider>
  );
}
