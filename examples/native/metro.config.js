const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// O app importa componentes e tokens de native/ na raiz do repositório: o
// Metro precisa observar essa pasta. A resolução de módulos deles acontece
// pelo symlink native/node_modules -> examples/native/node_modules, então
// existe um React só.
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

module.exports = withNativewind(config);
