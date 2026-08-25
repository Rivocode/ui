const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// O app importa componentes e tokens de native/ na raiz do repositório: o
// Metro precisa observar essa pasta, e o nodeModulesPaths faz os imports
// dela (react, react-native) caírem no node_modules DESTE app - um React
// só, sem symlink. O symlink antigo dava o mesmo efeito no metro, mas
// desviava o "react" dos testes em native/test para a cópia do Expo, e
// dois Reacts quebram todo hook.
//
// A troca de tema em runtime anda por light-dark(): o compilador nativo a
// transforma em regra de prefers-color-scheme e o provider troca via
// Appearance.setColorScheme(). Para isso o `browserslist` do package.json
// crava navegadores modernos: sem ele, o passe web que o Expo roda antes do
// compilador reescreve light-dark() no polyfill var(--lightningcss-*), que
// referencia vars nunca declaradas e mata a compilação ("Specifier, found").
// Vars vivas continuam impossíveis; o patch em patches/ segue aguardando o
// upstream para esse caso.
config.watchFolders = [__dirname, `${__dirname}/../../native`];
config.resolver.nodeModulesPaths = [`${__dirname}/node_modules`];

module.exports = withNativewind(config);
