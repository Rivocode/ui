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
  Image: ["getSize", "prefetch", "queryCache"],
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

function walk(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...walk(path));
    else if (/\.tsx?$/.test(path)) found.push(path);
  }
  return found;
}

function sourceFiles(dir: string): string[] {
  const found = walk(dir);

  expect(
    found.length,
    `the scan of ${dir} found ${found.length} file(s):` +
      " an empty list leaves the two guards below green without having read anything",
  ).toBeGreaterThan(60);

  return found;
}

type Taken = { local: string; source: string };

function takenFromReactNative(code: string): Taken[] {
  const taken: Taken[] = [];
  for (const hit of code.matchAll(/import\s+(type\s+)?\{([^{}]*)\}\s+from\s+"react-native"/g)) {
    if (hit[1]) continue;
    for (const piece of hit[2]!.split(",")) {
      const clean = piece.trim();
      if (clean === "" || clean.startsWith("type ")) continue;
      const [source, local] = clean.split(/\s+as\s+/);
      taken.push({ local: (local ?? source)!.trim(), source: source!.trim() });
    }
  }
  return taken;
}

describe("the package runs on react-native-web", () => {
  test("nothing is imported from react-native that react-native-web does not export", () => {
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
      "react-native-web is the only bench where the tree can be inspected and portraits taken " +
        "without a simulator, and RivoProvider wraps the whole app: what does not exist there " +
        "brings down the whole screen, not the piece. Each name above either goes into " +
        "WEB_EXPORTS (because it exists in the current react-native-web version) or leaves the " +
        "native package.",
    ).toEqual([]);
  });

  test("nothing is called in those modules that react-native-web does not implement", () => {
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
          missing.push(`${file.slice(SOURCE.length + 1)}: ${source} has no line in WEB_MEMBERS`);
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
      "That is how `Appearance.setColorScheme` reached npm: it exists in react-native, it does " +
        "not exist in react-native-web, and the whole screen went white with `setColorScheme is " +
        "not a function`. A call that is not in the list above needs a guard - `typeof x === " +
        '"function"` first, or the equivalent path both sides have - and what the piece does ' +
        "when it is missing has to be stated, not guessed.",
    ).toEqual([]);
  });
});

function withoutSetColorScheme<T>(body: (warnings: string[]) => T): T {
  const kept = Appearance.setColorScheme;
  const spoke = console.warn;
  const warnings: string[] = [];

  // @ts-expect-error: this is the react-native-web world, where the method never existed
  delete Appearance.setColorScheme;
  console.warn = (...args: unknown[]) => warnings.push(args.map(String).join(" "));

  try {
    return body(warnings);
  } finally {
    console.warn = spoke;
    Appearance.setColorScheme = kept;
  }
}

describe("RivoProvider without Appearance.setColorScheme", () => {
  test("the whole app still mounts", () => {
    withoutSetColorScheme(() => {
      expect(textOf(render(<Text>Painel</Text>, { theme: "rivocode-light" }))).toContain("Painel");
    });
  });

  test("warns that the requested scheme was not enforced, and says where to declare it", () => {
    withoutSetColorScheme((warnings) => {
      render(<Text>x</Text>, { theme: "rivocode-light" });

      const said = warnings.join("\n");
      expect(said).toContain("Appearance.setColorScheme");
      expect(said).toContain("color-scheme: light");
      expect(said).toContain("light-dark()");
    });
  });

  test("with theme=system there is no broken promise, and no warning", () => {
    withoutSetColorScheme((warnings) => {
      render(<Text>x</Text>, { theme: "system" });
      expect(warnings.filter((it) => it.includes("setColorScheme"))).toEqual([]);
    });
  });

  test("the context color follows the requested theme, not the device's", () => {
    function Probe() {
      return <Text>{useRivo().theme}</Text>;
    }

    withoutSetColorScheme(() => {
      expect(textOf(render(<Probe />, { theme: "rivocode-light" }))).toContain("rivocode-light");
      expect(textOf(render(<Probe />, { theme: "rivocode-dark" }))).toContain("rivocode-dark");
    });
  });
});
