const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// O app importa componentes e tokens de native/ na raiz do repositório: o
// Metro precisa observar essa pasta. A resolução de módulos deles acontece
// pelo symlink native/node_modules -> examples/native/node_modules, então
// existe um React só.
//
// Troca de tema em runtime ainda não é possível: o react-native-css 3.0.7
// só compila quando TODA var é inlinada (excluir cores do inline derruba a
// reserialização do lightningcss). O patch em patches/ conserta o repasse de
// opções do transformer para quando o upstream aceitar vars vivas.
config.watchFolders = [__dirname, `${__dirname}/../../native`];

module.exports = withNativewind(config);
