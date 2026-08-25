import { createContext, useContext, useMemo, type ReactNode } from "react";
import { View } from "react-native";
import { vars } from "nativewind";

import { tokens, type RivoNativeTheme } from "../tokens";
import { ToastProvider } from "./toast";

export type RivoDensity = "comfortable" | "compact";

type RivoContextValue = {
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
  /** `rivocode-dark` e o padrao, como no web. */
  theme?: RivoNativeTheme;
  density?: RivoDensity;
};

/**
 * O mesmo contrato do web, no mundo nativo: nenhum componente conhece a cor
 * da marca; ele pede um papel e o tema responde.
 *
 * O escuro ja vive no CSS gerado (`native/theme.css`). Aqui o provider
 * sobrescreve as mesmas variaveis em runtime quando o tema e outro, e injeta
 * as medidas da densidade - e o `vars()` do NativeWind leva tudo para os
 * descendentes, como o atributo `data-rc-theme` leva no DOM.
 */
export function RivoProvider({
  children,
  theme = "rivocode-dark",
  density = "comfortable",
}: RivoProviderProps) {
  const style = useMemo(() => {
    const colors = Object.fromEntries(
      Object.entries(tokens.themes[theme]).map(([role, color]) => [`--color-${role}`, color]),
    );
    const sizes = Object.fromEntries(
      Object.entries(tokens.densities[density]).map(([name, value]) => [`--rc-${name}`, value]),
    );
    return vars({ ...colors, ...sizes });
  }, [theme, density]);

  const value = useMemo(() => ({ theme, density }), [theme, density]);

  return (
    <RivoContext.Provider value={value}>
      <View style={style} className="flex-1 bg-bg">
        {/* A fiacao de aviso ja vem montada, como no web: quem usa a
            biblioteca nao deveria precisar montar provedor para um aviso. */}
        <ToastProvider>{children}</ToastProvider>
      </View>
    </RivoContext.Provider>
  );
}
