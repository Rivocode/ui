import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Appearance, View, useColorScheme } from "react-native";
import { VariableContextProvider } from "nativewind";

import { tokens, type RivoNativeColorRole, type RivoNativeTheme } from "../tokens";
import { ToastProvider } from "./toast";

export type RivoDensity = "comfortable" | "compact";

/** Os 44 papeis de cor, ja resolvidos: e o que uma peca le. */
export type RivoNativeColors = Record<RivoNativeColorRole, string>;

/**
 * Um tema de cliente: a camada 3, em objeto.
 *
 * Sai do mesmo CSS que veste o web - `bun run gen:native --tema tema-acme.css`
 * le a camada 3 dele e emite isto. Uma fonte so para as duas plataformas, que
 * e o que impede a cor do cliente de divergir entre o painel e o celular seis
 * meses depois.
 */
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
};

/**
 * O mesmo contrato do web, no mundo nativo: nenhum componente conhece a cor
 * da marca; ele pede um papel e o tema responde.
 *
 * Os temas de casa foram compilados como light-dark(claro, escuro), que o
 * react-native-css avalia em runtime pelo esquema de cor do Appearance. Trocar
 * entre eles e um Appearance.setColorScheme(), e toda classe bg-*, text-* e
 * border-* da arvore responde no mesmo frame - nenhum componente re-renderiza
 * por cima disso. `system` devolve o controle ao aparelho.
 *
 * O tema de cliente e a camada 3, e ela nao cabe no light-dark(): os valores
 * do cliente nao existem em build. Ela entra pelo VariableContextProvider do
 * NativeWind, que redefine as variaveis para a arvore abaixo. O custo e uma
 * re-renderizacao quando o tema ou o esquema mudam - uma, e nao por quadro - e
 * ele so e pago por quem veste um cliente: sem tema de cliente, nada e
 * embrulhado e o caminho rapido continua intacto.
 *
 * Como no web, isto aninha: um provider de tema escuro dentro de uma tela
 * clara veste so a sua arvore.
 */
export function RivoProvider({
  children,
  theme = "rivocode-dark",
  scheme = "system",
  density = "comfortable",
}: RivoProviderProps) {
  const custom = typeof theme === "object" ? theme : undefined;

  useEffect(() => {
    // Com tema de cliente quem decide claro e escuro e a prop `scheme`; sem
    // ele, o proprio nome do tema. "unspecified" devolve a decisao ao
    // aparelho, como o overrideUserInterfaceStyle do iOS.
    const wanted = custom ? scheme : theme;
    Appearance.setColorScheme(
      wanted === "system" ? "unspecified" : wanted === "rivocode-light" || wanted === "light" ? "light" : "dark",
    );
  }, [custom, scheme, theme]);

  // O esquema que o aparelho esta mostrando agora.
  const device = useColorScheme();
  const light = custom
    ? scheme === "system"
      ? device === "light"
      : scheme === "light"
    : theme === "rivocode-light" || (theme === "system" && device === "light");

  const resolved: RivoNativeTheme = light ? "rivocode-light" : "rivocode-dark";
  const colors = custom ? (light ? custom.light : custom.dark) : tokens.themes[resolved];

  const value = useMemo(
    () => ({ theme: resolved, colors, density }),
    [resolved, colors, density],
  );

  // As variaveis so entram quando ha tema de cliente: embrulhar todo mundo
  // custaria a troca no mesmo frame de graca.
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
      <View className="flex-1 bg-bg">
        {/* A fiacao de aviso ja vem montada, como no web: quem usa a
            biblioteca nao deveria precisar montar provedor para um aviso. */}
        {dressed(<ToastProvider>{children}</ToastProvider>)}
      </View>
    </RivoContext.Provider>
  );
}
