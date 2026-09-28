/**
 * The react-native that the native component tests see. The real package does
 * not run outside metro (Flow, native modules), and the tests do not measure RN:
 * they measure OUR logic - accessibility role, state, the four DataList
 * endings. Each component becomes a host element with the same name, and
 * react-test-renderer lets the props be read straight from the tree.
 */
import { createElement, Fragment, useImperativeHandle, type ReactNode, type Ref } from "react";

type AnyProps = Record<string, unknown>;

const host = (name: string) => {
  const Component = (props: AnyProps) => createElement(name, props);
  Component.displayName = name;
  return Component;
};

export const View = host("View");
export const Text = host("Text");
export const TextInput = host("TextInput");
export const ActivityIndicator = host("ActivityIndicator");
export const Image = host("Image");
export const ScrollView = host("ScrollView");
export const Pressable = host("Pressable");
export const Switch = host("Switch");

type ListProps = AnyProps & {
  data?: unknown[];
  renderItem: (info: { item: unknown; index: number }) => ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
  ref?: Ref<unknown>;
};

const listScrolls: Array<{ offset?: number; index?: number; animated?: boolean }> = [];

export const FlatList = ({ data = [], renderItem, keyExtractor, ref, ...props }: ListProps) => {
  useImperativeHandle(ref, () => ({
    scrollToOffset: (args: { offset: number; animated?: boolean }) => listScrolls.push(args),
    scrollToIndex: (args: { index: number; animated?: boolean }) => listScrolls.push(args),
  }));
  return createElement(
    "FlatList",
    { ...props, data },
    data.map((item, index) =>
      createElement(
        Fragment,
        { key: keyExtractor?.(item, index) ?? String(index) },
        renderItem({ item, index }),
      ),
    ),
  );
};

export const flatListScrolls = listScrolls;

type Section = AnyProps & { data: unknown[] };

type SectionListProps = AnyProps & {
  sections?: Section[];
  renderItem: (info: { item: unknown; index: number; section: Section }) => ReactNode;
  renderSectionHeader?: (info: { section: Section }) => ReactNode;
  keyExtractor?: (item: unknown, index: number) => string;
};

export const SectionList = ({
  sections = [],
  renderItem,
  renderSectionHeader,
  keyExtractor,
  ...props
}: SectionListProps) =>
  createElement(
    "SectionList",
    { ...props, sections },
    sections.map((section, sectionIndex) =>
      createElement(
        Fragment,
        { key: String(section.key ?? sectionIndex) },
        renderSectionHeader?.({ section }),
        section.data.map((item, index) =>
          createElement(
            Fragment,
            { key: keyExtractor?.(item, index) ?? String(index) },
            renderItem({ item, index, section }),
          ),
        ),
      ),
    ),
  );

/** As on the device: with visible={false} the Modal content does not exist. */
export const Modal = (props: AnyProps & { visible?: boolean }) =>
  props.visible === false ? null : createElement("Modal", props);

/* The real Platform answers for the device the app runs on; here it is
   pinned to iOS, and the pinning is the point. What is measured through
   `Platform.select` is the mono font (native/src/font.ts): the claim is that the
   family stopped being generic - `ui-monospace` is not installed on iOS nor on
   Android -, and not which branch of the select answered. Pinned, the result does
   not depend on where the suite runs; randomized or read from the process, one of
   the two branches would go uncovered and the failure would show up only on the
   machine of whoever has the other OS. */
export const Platform = {
  OS: "ios" as const,
  select: <T,>(spec: { ios?: T; android?: T; native?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.native ?? spec.default,
};

/* The real I18nManager reads the device locale ONCE, when the module loads:
   `isRTL` is a copy of a native constant, and `forceRTL` talks to the native
   side without touching that boolean - the switch only takes effect after the
   app reloads. Here it starts as `false`, which is the world the 340 tests
   already ran in, and `forceRTL` stays the no-op it is there. Whoever wants the
   other world writes `I18nManager.isRTL = true` BEFORE mounting and restores it
   afterwards: it is the same gesture as on the device, where the tree is born
   knowing which side reading starts from. Pinning to `true` would cover one side
   and leave the other uncovered; and randomizing would make the suite depend on
   the machine. */
let rtl = false;

export const I18nManager = {
  get isRTL() {
    return rtl;
  },
  set isRTL(next: boolean) {
    rtl = next;
  },
  doLeftAndRightSwapInRTL: true,
  getConstants: () => ({ isRTL: rtl, doLeftAndRightSwapInRTL: true }),
  allowRTL: (_allow: boolean) => {},
  forceRTL: (_force: boolean) => {},
  swapLeftAndRightInRTL: (_swap: boolean) => {},
};

/** The Slider only needs the handlers to exist; gestures are not tested here. */
const responders: unknown[] = [];

export const PanResponder = {
  create: (config: unknown) => {
    responders.push(config);
    return { panHandlers: {} };
  },
};

export const panResponders = responders;

/* The real Appearance is the bridge to the system; here it is a variable, so
   the provider test can assert which scheme was requested. */
let scheme: "light" | "dark" | null = "dark";
const listeners = new Set<(event: { colorScheme: "light" | "dark" | null }) => void>();

export const Appearance = {
  getColorScheme: () => scheme,
  setColorScheme: (next: "light" | "dark" | "unspecified") => {
    scheme = next === "unspecified" ? null : next;
    for (const listener of listeners) listener({ colorScheme: scheme });
  },
  addChangeListener: (listener: (event: { colorScheme: "light" | "dark" | null }) => void) => {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  },
};

export const useColorScheme = () => scheme;

/* The real AppState is the bridge to the device lifecycle; here it is a
   variable plus an emitter, so the RelativeTime test can send the app to sleep
   and wake it up. `setState` does NOT exist in react-native: the system changes
   the state there, and here the test does. */
type AppStateValue = "active" | "background" | "inactive";
const appStateListeners = new Set<(state: AppStateValue) => void>();
let appState: AppStateValue = "active";

export const AppState = {
  get currentState() {
    return appState;
  },
  addEventListener: (type: string, listener: (state: AppStateValue) => void) => {
    if (type !== "change") return { remove: () => {} };
    appStateListeners.add(listener);
    return { remove: () => appStateListeners.delete(listener) };
  },
  /** Double only: pushes the change the system would push. */
  setState: (next: AppStateValue) => {
    appState = next;
    for (const listener of appStateListeners) listener(next);
  },
};

type ReduceMotionListener = (enabled: boolean) => void;
const reduceMotionListeners = new Set<ReduceMotionListener>();
let reduceMotion = false;

export const AccessibilityInfo = {
  isReduceMotionEnabled: () => Promise.resolve(reduceMotion),
  addEventListener: (type: string, listener: ReduceMotionListener) => {
    if (type !== "reduceMotionChanged") return { remove: () => {} };
    reduceMotionListeners.add(listener);
    return { remove: () => reduceMotionListeners.delete(listener) };
  },
  /** Double only: turns the system "reduce motion" on or off. */
  setReduceMotion: (next: boolean) => {
    reduceMotion = next;
    for (const listener of reduceMotionListeners) listener(next);
  },
  /** Double only: the value the system would answer right now. */
  get reduceMotionNow() {
    return reduceMotion;
  },
  announceForAccessibility: (message: string) => {
    announcements.push(message);
  },
  get announced(): readonly string[] {
    return announcements;
  },
  clearAnnouncements: () => {
    announcements.length = 0;
  },
};

const announcements: string[] = [];

const openedUrls: string[] = [];

export const Linking = {
  openURL: (url: string) => {
    openedUrls.push(url);
    return Promise.resolve(true);
  },
  get opened() {
    return openedUrls;
  },
};
