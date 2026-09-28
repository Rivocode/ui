// Registers a DOM in bun test, which runs without a browser by default.
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";
import * as reactNativeMock from "./react-native-mock";
import * as nativewindMock from "./nativewind-mock";
import * as reanimatedMock from "./reanimated-mock";
import * as keyboardMock from "./keyboard-controller-mock";

GlobalRegistrator.register();
(globalThis as { BASE_UI_ANIMATIONS_DISABLED?: boolean }).BASE_UI_ANIMATIONS_DISABLED = true;

// `__DEV__` is a metro global, and the native components read it to warn only
// in development. Outside metro it does not exist, and reading a missing global is a
// ReferenceError, not undefined.
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

// The native components import "react-native", which does not run outside metro. Their
// tests (native/test) receive this double; the web tests never import
// react-native, so the mock does not touch them.
mock.module("react-native", () => reactNativeMock);
mock.module("react-native-reanimated", () => reanimatedMock);
mock.module("react-native-keyboard-controller", () => keyboardMock);

// nativewind only exists in the example app, and the provider imports
// useCssElement from it, which reads each role's color from the compiled CSS. The double resolves
// through the same CSS, and the scheme is injected because the react-native here
// is also a double and only takes effect on the line above.
nativewindMock.connectColorScheme({
  get: () => reactNativeMock.Appearance.getColorScheme(),
  subscribe: (listener: () => void) => {
    const subscription = reactNativeMock.Appearance.addChangeListener(() => listener());
    return () => subscription.remove();
  },
});

mock.module("nativewind", () => nativewindMock);

// Unmounts what each test mounted. Without this, a Provider leaves attributes and
// portal containers behind, and the next test measures the previous one's leftovers.
const { cleanup } = await import("@testing-library/react");
const { afterEach } = await import("bun:test");

afterEach(cleanup);

const { act } = await import("react");
afterEach(() => {
  const mounted = (globalThis as { __rivoMounted?: { unmount: () => void }[] }).__rivoMounted;
  if (!mounted) return;
  for (const renderer of mounted.splice(0)) {
    act(() => renderer.unmount());
  }
});
