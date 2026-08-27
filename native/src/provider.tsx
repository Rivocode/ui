import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Appearance, View, useColorScheme } from "react-native";
import { VariableContextProvider } from "nativewind";

import { tokens, type RivoNativeColorRole, type RivoNativeTheme } from "../tokens";
import { FontProvider, fontComplaints, fontWarning, resolveFonts, type RivoFonts } from "./font";
import { ToastProvider } from "./toast";

export type RivoDensity = "comfortable" | "compact";

export type RivoNativeColors = Record<RivoNativeColorRole, string>;

export type RivoNativeThemeMap = { light: RivoNativeColors; dark: RivoNativeColors };

type RivoContextValue = {
  /**
   * O esquema resolvido: com `theme="system"`, aqui chega o que o aparelho
   * pediu; com tema de cliente, o de casa mais proximo dele.
   */
  theme: RivoNativeTheme;
  /**
   * Os papeis ja resolvidos, do tema que vale agora. Peca que pinta por fora
   * da classe - o trilho do Switch, o giro do Button - le daqui e nao de
   * `tokens.themes`: senao o tema de cliente vestiria as classes e deixaria
   * essas cores com a lima da RivoCode.
   */
  colors: RivoNativeColors;
  density: RivoDensity;
};

const RivoContext = createContext<RivoContextValue | null>(null);

export function useRivo() {
  const value = useContext(RivoContext);
  if (!value) throw new Error("useRivo precisa de um RivoProvider acima.");
  return value;
}

export type RivoProviderProps = {
  children: ReactNode;
  /**
   * `rivocode-dark` e o padrao, como no web; `system` segue o aparelho. Um
   * objeto de tema veste um cliente - e a camada 3, que no web e um arquivo
   * CSS e aqui e o mapa que o gerador emite dele.
   */
  theme?: RivoNativeTheme | "system" | RivoNativeThemeMap;
  /**
   * Claro ou escuro, quando o tema e de cliente. Com tema de casa quem decide
   * e o proprio nome do tema, entao esta prop nao se aplica.
   */
  scheme?: "light" | "dark" | "system";
  density?: RivoDensity;
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
  density = "comfortable",
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

  useEffect(() => {
    const wanted = custom ? scheme : theme;
    Appearance.setColorScheme(
      wanted === "system"
        ? "unspecified"
        : wanted === "rivocode-light" || wanted === "light"
          ? "light"
          : "dark",
    );
  }, [custom, scheme, theme]);

  const device = useColorScheme();
  const light = custom
    ? scheme === "system"
      ? device === "light"
      : scheme === "light"
    : theme === "rivocode-light" || (theme === "system" && device === "light");

  const resolved: RivoNativeTheme = light ? "rivocode-light" : "rivocode-dark";
  const colors = custom ? (light ? custom.light : custom.dark) : tokens.themes[resolved];

  const value = useMemo(() => ({ theme: resolved, colors, density }), [resolved, colors, density]);

  const dressed = (children: ReactNode) =>
    custom ? (
      <VariableContextProvider
        value={Object.fromEntries(
          Object.entries(colors).map(([role, value]) => [`--color-${role}`, value]),
        )}
      >
        {children}
      </VariableContextProvider>
    ) : (
      children
    );

  return (
    <RivoContext.Provider value={value}>
      <FontProvider value={families}>
        <View className="flex-1 bg-bg">{dressed(<ToastProvider>{children}</ToastProvider>)}</View>
      </FontProvider>
    </RivoContext.Provider>
  );
}
