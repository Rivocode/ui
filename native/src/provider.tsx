import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Appearance, View, useColorScheme } from "react-native";

import { type RivoNativeTheme } from "../tokens";
import { ToastProvider } from "./toast";

export type RivoDensity = "comfortable" | "compact";

type RivoContextValue = {
  /** Sempre resolvido: com `theme="system"`, aqui chega o que o aparelho pediu. */
  theme: RivoNativeTheme;
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
  /** `rivocode-dark` e o padrao, como no web; `system` segue o aparelho. */
  theme?: RivoNativeTheme | "system";
  density?: RivoDensity;
};

/**
 * O mesmo contrato do web, no mundo nativo: nenhum componente conhece a cor
 * da marca; ele pede um papel e o tema responde.
 *
 * Cada token de cor foi compilado como light-dark(claro, escuro), que o
 * react-native-css avalia em runtime pelo esquema de cor do Appearance. Trocar
 * a prop `theme` e um Appearance.setColorScheme(), e toda classe bg-*, text-*
 * e border-* da arvore responde no mesmo frame - nenhum componente re-renderiza
 * por cima disso. `system` devolve o controle ao aparelho.
 */
export function RivoProvider({
  children,
  theme = "rivocode-dark",
  density = "comfortable",
}: RivoProviderProps) {
  useEffect(() => {
    // "unspecified" devolve a decisao ao aparelho, como o overrideUserInterfaceStyle do iOS.
    Appearance.setColorScheme(
      theme === "system" ? "unspecified" : theme === "rivocode-light" ? "light" : "dark",
    );
  }, [theme]);

  // O esquema resolvido, para quem le cor por fora das classes - o Switch
  // pinta o trilho nativo com trackColor, e precisa saber qual tema vale.
  const scheme = useColorScheme();
  const resolved: RivoNativeTheme =
    theme === "system"
      ? scheme === "light"
        ? "rivocode-light"
        : "rivocode-dark"
      : theme;

  const value = useMemo(() => ({ theme: resolved, density }), [resolved, density]);

  return (
    <RivoContext.Provider value={value}>
      <View className="flex-1 bg-bg">
        {/* A fiacao de aviso ja vem montada, como no web: quem usa a
            biblioteca nao deveria precisar montar provedor para um aviso. */}
        <ToastProvider>{children}</ToastProvider>
      </View>
    </RivoContext.Provider>
  );
}
