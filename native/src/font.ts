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
   * The running-text family: label, paragraph, list item. Without it, the
   * device answers with the system font. The name must be the same one the app
   * registered the font with in `expo-font`, not the file name.
   */
  sans?: string;
  /**
   * The heading family - Card, Dialog, Sheet, PageHeader, Stat, Steps and
   * Fieldset. Without it, headings fall back to `sans`, as on the web, where
   * the `--rc-font-display` stack ends in the running-text one.
   */
  display?: string;
  /**
   * The fixed-width family: Code, the Timeline stamp, Calendar initials, the
   * ColorPicker hexadecimal field. Without it, Menlo on iOS and monospace on
   * Android, which the device already has.
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

  if (name === "") return `\`${role}\` arrived empty`;

  if (family.includes(",")) {
    return (
      `\`${role}: ${JSON.stringify(family)}\` is a CSS font stack. React Native does not read a ` +
      "fallback list: the comma and everything after it become part of the name, and no device has " +
      "a font like that"
    );
  }

  if (/["']/.test(family)) {
    return `\`${role}: ${JSON.stringify(family)}\` carries the CSS quotes inside the name`;
  }

  if (family.includes("var(")) {
    return `\`${role}: ${JSON.stringify(family)}\` is a CSS variable, which does not exist here`;
  }

  if (GENERIC.has(lower)) {
    return `\`${role}: ${JSON.stringify(family)}\` is a generic CSS family, not an installed font`;
  }

  if (lower === "monospace" && Platform.OS !== "android") {
    return `\`${role}: ${JSON.stringify(family)}\` only exists on Android; on iOS the built-in one is Menlo`;
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
      complaints.push(`\`${role}: ${JSON.stringify(family)}\` is not loaded on this device`);
    }
  }

  return complaints;
}

export function fontWarning(complaints: string[]): string {
  return (
    "[rivocode/ui-native] <RivoProvider fonts={...}>: " +
    complaints.join("; ") +
    ". A font name the device does not have fails silently: the text comes out in the system font and " +
    "nothing complains. Declare here the same name the app registered the family with in `expo-font`."
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
    "a font family does not come from a class in the native package. The CSS here emits no rule for " +
    "any of them, so the class is silently ignored and the text comes out in the system font with " +
    "nothing complaining. On the phone only the app knows what `expo-font` loaded: declare the family " +
    "once in `<RivoProvider fonts={{ sans, display, mono }}>` and ask for the role through the prop `font` of " +
    "`Text`, `TextInput` and the text components."
  );
}

export function warnFamilyClass(className: string | undefined): void {
  const fresh = familyClassesIn(className).filter((name) => !warnedClasses.has(name));
  if (fresh.length === 0) return;

  for (const name of fresh) warnedClasses.add(name);
  console.warn(familyClassWarning(fresh));
}
