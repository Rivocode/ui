const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// The app imports components and tokens from native/ at the repository root:
// Metro has to watch that folder, and nodeModulesPaths makes its imports
// (react, react-native) land in THIS app's node_modules - a single React, with
// no symlink. The old symlink had the same effect in metro, but diverted the
// "react" of the tests in native/test to Expo's copy, and two Reacts break
// every hook.
//
// Switching themes at runtime goes through light-dark(): the native compiler
// turns it into a prefers-color-scheme rule and the provider switches via
// Appearance.setColorScheme(). For that, the `browserslist` in package.json
// pins modern browsers: without it, the web pass Expo runs before the compiler
// rewrites light-dark() into the var(--lightningcss-*) polyfill, which
// references vars never declared and kills the compilation ("Specifier,
// found"). Live vars are still impossible; the patch in patches/ is still
// waiting on upstream for that case.
config.watchFolders = [__dirname, `${__dirname}/../../native`];
config.resolver.nodeModulesPaths = [`${__dirname}/node_modules`];

module.exports = withNativewind(config);
