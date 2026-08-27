import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";
import { Appearance, Text } from "react-native";

import { useRivo } from "../src";
import { render, textOf } from "./helpers";

const WEB_EXPORTS = new Set([
  "AccessibilityInfo",
  "ActivityIndicator",
  "Alert",
  "Animated",
  "AppRegistry",
  "AppState",
  "Appearance",
  "BackHandler",
  "Button",
  "CheckBox",
  "Clipboard",
  "DeviceEventEmitter",
  "Dimensions",
  "Easing",
  "FlatList",
  "I18nManager",
  "Image",
  "ImageBackground",
  "InteractionManager",
  "Keyboard",
  "KeyboardAvoidingView",
  "LayoutAnimation",
  "Linking",
  "LogBox",
  "Modal",
  "NativeEventEmitter",
  "NativeModules",
  "PanResponder",
  "Picker",
  "PixelRatio",
  "Platform",
  "Pressable",
  "ProgressBar",
  "RefreshControl",
  "SafeAreaView",
  "ScrollView",
  "SectionList",
  "Share",
  "StatusBar",
  "StyleSheet",
  "Switch",
  "Text",
  "TextInput",
  "Touchable",
  "TouchableHighlight",
  "TouchableNativeFeedback",
  "TouchableOpacity",
  "TouchableWithoutFeedback",
  "UIManager",
  "Vibration",
  "View",
  "VirtualizedList",
  "findNodeHandle",
  "processColor",
  "useColorScheme",
  "useWindowDimensions",
]);

const WEB_MEMBERS: Record<string, string[]> = {
  AccessibilityInfo: [
    "addEventListener",
    "announceForAccessibility",
    "fetch",
    "isReduceMotionEnabled",
    "isScreenReaderEnabled",
    "setAccessibilityFocus",
  ],
  Appearance: ["addChangeListener", "getColorScheme"],
  AppState: ["addEventListener", "currentState", "isAvailable"],
  BackHandler: ["addEventListener", "exitApp"],
  Clipboard: ["getString", "isAvailable", "setString"],
  Dimensions: ["addEventListener", "get", "set"],
  I18nManager: ["allowRTL", "forceRTL", "getConstants"],
  InteractionManager: ["createInteractionHandle", "clearInteractionHandle", "runAfterInteractions"],
  Keyboard: ["addListener", "dismiss", "isVisible", "removeAllListeners"],
  LayoutAnimation: ["Presets", "Properties", "Types", "configureNext", "create", "easeInEaseOut"],
  Linking: ["addEventListener", "canOpenURL", "getInitialURL", "openURL"],
  PanResponder: ["create"],
  PixelRatio: ["get", "getFontScale", "getPixelSizeForLayoutSize", "roundToNearestPixel"],
  Platform: ["OS", "Version", "isTesting", "select"],
  Share: ["dismissedAction", "share", "sharedAction"],
  StyleSheet: [
    "absoluteFill",
    "absoluteFillObject",
    "compose",
    "create",
    "flatten",
    "hairlineWidth",
  ],
  Vibration: ["cancel", "vibrate"],
};

const SOURCE = fileURLToPath(new URL("../src", import.meta.url));

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    else if (/\.tsx?$/.test(path)) found.push(path);
  }
  return found;
}

type Taken = { local: string; source: string };

function takenFromReactNative(code: string): Taken[] {
  const taken: Taken[] = [];
  for (const hit of code.matchAll(/import\s+(?:type\s+)?\{([^{}]*)\}\s+from\s+"react-native"/g)) {
    for (const piece of hit[1]!.split(",")) {
      const clean = piece.trim();
      if (clean === "" || clean.startsWith("type ")) continue;
      const [source, local] = clean.split(/\s+as\s+/);
      taken.push({ local: (local ?? source)!.trim(), source: source!.trim() });
    }
  }
  return taken;
}

describe("o pacote sobe no react-native-web", () => {
  test("nada e importado do react-native que o react-native-web nao exporte", () => {
    const missing: string[] = [];

    for (const file of sourceFiles(SOURCE)) {
      const code = readFileSync(file, "utf8");
      for (const { source } of takenFromReactNative(code)) {
        if (WEB_EXPORTS.has(source)) continue;
        missing.push(`${file.slice(SOURCE.length + 1)}: ${source}`);
      }
    }

    expect(
      missing,
      "O react-native-web e a unica bancada em que da para inspecionar a arvore e tirar retrato " +
        "sem simulador, e o RivoProvider embrulha o app inteiro: o que nao existe la derruba a " +
        "tela toda, e nao a peca. Cada nome acima ou entra em WEB_EXPORTS (por existir na versao " +
        "de agora do react-native-web) ou sai do pacote nativo.",
    ).toEqual([]);
  });

  test("nada e chamado nesses modulos que o react-native-web nao implemente", () => {
    const missing: string[] = [];

    for (const file of sourceFiles(SOURCE)) {
      const code = readFileSync(file, "utf8");
      for (const { local, source } of takenFromReactNative(code)) {
        const reads = [
          ...new Set(
            [...code.matchAll(new RegExp(`\\b${local}\\.([A-Za-z_$][\\w$]*)`, "g"))].map(
              (hit) => hit[1]!,
            ),
          ),
        ];
        if (reads.length === 0) continue;

        const web = WEB_MEMBERS[source];
        if (web === undefined) {
          missing.push(`${file.slice(SOURCE.length + 1)}: ${source} nao tem linha em WEB_MEMBERS`);
          continue;
        }

        for (const read of reads) {
          if (web.includes(read)) continue;
          if (code.includes(`typeof ${local}.${read} === "function"`)) continue;
          missing.push(`${file.slice(SOURCE.length + 1)}: ${source}.${read}`);
        }
      }
    }

    expect(
      missing,
      "Foi assim que `Appearance.setColorScheme` chegou ao npm: existe no react-native, nao " +
        "existe no react-native-web, e a tela inteira ficou branca com `setColorScheme is not a " +
        "function`. Chamada que nao esta na lista de cima precisa de guarda - `typeof x === " +
        '"function"` antes, ou o caminho equivalente que os dois lados tem - e o que a peca faz ' +
        "quando ela falta tem que ser dito, e nao adivinhado.",
    ).toEqual([]);
  });
});

function withoutSetColorScheme<T>(body: (warnings: string[]) => T): T {
  const kept = Appearance.setColorScheme;
  const spoke = console.warn;
  const warnings: string[] = [];

  // @ts-expect-error: e o mundo do react-native-web, onde o metodo nunca existiu
  delete Appearance.setColorScheme;
  console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(" "));

  try {
    return body(warnings);
  } finally {
    console.warn = spoke;
    Appearance.setColorScheme = kept;
  }
}

describe("o RivoProvider sem Appearance.setColorScheme", () => {
  test("o app inteiro continua montando", () => {
    withoutSetColorScheme(() => {
      expect(textOf(render(<Text>Painel</Text>, { theme: "rivocode-light" }))).toContain("Painel");
    });
  });

  test("avisa que o esquema pedido nao foi imposto, e diz onde declara-lo", () => {
    withoutSetColorScheme((warnings) => {
      render(<Text>x</Text>, { theme: "rivocode-light" });

      const said = warnings.join("\n");
      expect(said).toContain("Appearance.setColorScheme");
      expect(said).toContain("color-scheme: light");
      expect(said).toContain("light-dark()");
    });
  });

  test("com theme=system nao ha promessa quebrada, e nao ha aviso", () => {
    withoutSetColorScheme((warnings) => {
      render(<Text>x</Text>, { theme: "system" });
      expect(warnings.filter((it) => it.includes("setColorScheme"))).toEqual([]);
    });
  });

  test("a cor do contexto segue o tema pedido, e nao o do aparelho", () => {
    function Probe() {
      return <Text>{useRivo().theme}</Text>;
    }

    withoutSetColorScheme(() => {
      expect(textOf(render(<Probe />, { theme: "rivocode-light" }))).toContain("rivocode-light");
      expect(textOf(render(<Probe />, { theme: "rivocode-dark" }))).toContain("rivocode-dark");
    });
  });
});
