import { createContext, useContext } from "react";
import { Platform } from "react-native";

export const mono = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export type RivoFontRole = "sans" | "display" | "mono";

export type RivoFonts = {
  /**
   * A familia do texto corrido: rotulo, paragrafo, item de lista. Sem ela, o
   * aparelho responde com a fonte do sistema. O nome tem que ser o mesmo com
   * que o app registrou a fonte no `expo-font`, e nao o do arquivo.
   */
  sans?: string;
  /**
   * A familia dos titulos - Card, Dialog, Sheet, PageHeader, Stat, Steps e
   * Fieldset. Sem ela, os titulos caem na `sans`, como no web, onde a pilha
   * de `--rc-font-display` termina na de texto corrido.
   */
  display?: string;
  /**
   * A familia de largura fixa: Code, carimbo da Timeline, iniciais do
   * Calendar, campo hexadecimal do ColorPicker. Sem ela, vale Menlo no iOS e
   * monospace no Android, que o aparelho ja tem.
   */
  mono?: string;
};

export type RivoResolvedFonts = Record<RivoFontRole, string | undefined>;

export const systemFonts: RivoResolvedFonts = { sans: undefined, display: undefined, mono };

export function resolveFonts(fonts?: RivoFonts): RivoResolvedFonts {
  if (!fonts) return systemFonts;

  return {
    sans: fonts.sans ?? systemFonts.sans,
    display: fonts.display ?? fonts.sans ?? systemFonts.display,
    mono: fonts.mono ?? systemFonts.mono,
  };
}

const FontContext = createContext<RivoResolvedFonts>(systemFonts);

export const FontProvider = FontContext.Provider;

export function useRivoFonts(): RivoResolvedFonts {
  return useContext(FontContext);
}

const GENERIC = new Set([
  "-apple-system",
  "blinkmacsystemfont",
  "cursive",
  "emoji",
  "fangsong",
  "fantasy",
  "math",
  "sans-serif",
  "serif",
  "system-ui",
  "ui-monospace",
  "ui-rounded",
  "ui-sans-serif",
  "ui-serif",
]);

function complaintFor(role: RivoFontRole, family: string): string | undefined {
  const name = family.trim();
  const lower = name.toLowerCase();

  if (name === "") return `\`${role}\` chegou vazia`;

  if (family.includes(",")) {
    return (
      `\`${role}: ${JSON.stringify(family)}\` é uma pilha de CSS. O React Native não lê lista ` +
      "de reserva: a vírgula e tudo que vem depois viram parte do nome, e aparelho nenhum tem " +
      "uma fonte assim"
    );
  }

  if (/["']/.test(family)) {
    return `\`${role}: ${JSON.stringify(family)}\` traz as aspas do CSS dentro do nome`;
  }

  if (family.includes("var(")) {
    return `\`${role}: ${JSON.stringify(family)}\` é uma variável de CSS, que aqui não existe`;
  }

  if (GENERIC.has(lower)) {
    return `\`${role}: ${JSON.stringify(family)}\` é família genérica de CSS, e não fonte instalada`;
  }

  if (lower === "monospace" && Platform.OS !== "android") {
    return `\`${role}: ${JSON.stringify(family)}\` só existe no Android; no iOS a de casa é Menlo`;
  }

  return undefined;
}

export function fontComplaints(
  fonts?: RivoFonts,
  isFontLoaded?: (family: string) => boolean,
): string[] {
  if (!fonts) return [];

  const roles: RivoFontRole[] = ["sans", "display", "mono"];
  const complaints: string[] = [];

  for (const role of roles) {
    const family = fonts[role];
    if (family === undefined) continue;

    const complaint = complaintFor(role, family);
    if (complaint !== undefined) {
      complaints.push(complaint);
      continue;
    }

    if (isFontLoaded && !isFontLoaded(family)) {
      complaints.push(`\`${role}: ${JSON.stringify(family)}\` não está carregada neste aparelho`);
    }
  }

  return complaints;
}

export function fontWarning(complaints: string[]): string {
  return (
    "[rivocode/ui-native] <RivoProvider fonts={...}>: " +
    complaints.join("; ") +
    ". Nome de fonte que o aparelho não tem falha calado: o texto sai na fonte do sistema e " +
    "nada acusa. Declare aqui o mesmo nome com que o app registrou a família no `expo-font`."
  );
}

const FAMILY_CLASSES = new Set(["font-sans", "font-serif", "font-mono", "font-display"]);

const warnedClasses = new Set<string>();

export function familyClassesIn(className: string | undefined): string[] {
  if (!className) return [];

  const found: string[] = [];
  for (const token of className.split(/\s+/)) {
    if (FAMILY_CLASSES.has(token) && !found.includes(token)) found.push(token);
  }
  return found;
}

export function familyClassWarning(classes: string[]): string {
  return (
    `[rivocode/ui-native] className="${classes.join(" ")}": ` +
    "família de fonte não vem por classe no pacote nativo. O CSS daqui não emite regra para " +
    "nenhuma delas, então a classe é ignorada em silêncio e o texto sai na fonte do sistema sem " +
    "nada acusar. No celular só o app sabe o que o `expo-font` carregou: declare a família uma " +
    "vez em `<RivoProvider fonts={{ sans, display, mono }}>` e peça o papel pela prop `font` do " +
    "`Text`, do `TextInput` e das peças de texto."
  );
}

export function warnFamilyClass(className: string | undefined): void {
  const fresh = familyClassesIn(className).filter((name) => !warnedClasses.has(name));
  if (fresh.length === 0) return;

  for (const name of fresh) warnedClasses.add(name);
  console.warn(familyClassWarning(fresh));
}
