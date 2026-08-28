/**
 * Guarda da receita de instalacao: o que o scaffold escreve tem que ser o que
 * o `examples/native` roda.
 *
 * Um agente montou um app do zero com o pacote publicado e nao chegou ao fim
 * lendo a doc: o `native/README.md` listava QUATRO arquivos de setup e
 * escondia os dois mais caros de diagnosticar. Sem `postcss.config.mjs` o
 * Tailwind nao roda no passe de CSS do metro e a tela sai sem estilo, sem erro
 * e sem pista; com um `babel.config.js` copiado da receita v4 do NativeWind
 * (`jsxImportSource: "nativewind"`) o metro morre procurando
 * `nativewind/jsx-runtime`, que a v5 nao tem. O agente so fechou o app depois
 * de ler o `examples/native` inteiro e reconstruir a receita a mao.
 *
 * O `rivocode-ui-native-init` nasceu para essa leitura nao precisar acontecer
 * de novo. So que ele criou uma SEGUNDA copia da receita: os arquivos que
 * precisam concordar entre si dobraram de numero, e nada dizia quando as duas
 * metades se separassem. O `examples/native` e o unico lugar onde a receita e
 * MEDIDA - ele roda -, entao ele e a fonte, e esta guarda cobra que o comando
 * diga o mesmo.
 *
 * Ela nao compara texto: compara os FATOS que cada arquivo carrega, extraidos
 * dos dois lados pelo mesmo leitor - a lista ordenada de diretivas do
 * `global.css`, os plugins do PostCSS, o embrulho do metro, o
 * `userInterfaceStyle` do `app.json`, o `browserslist` do `package.json`, a
 * referencia de tipos do `nativewind-env.d.ts` e os presets do Babel. Comparar
 * texto reprovaria pelo caminho relativo do monorepo, que e diferente de
 * proposito.
 *
 * O `babel.config.js` e o unico fato pela AUSENCIA, e ele foi medido: escrever
 * um com `presets: ["babel-preset-expo"]` derruba um app do Expo 57 inteiro,
 * porque nesse SDK o preset mora em `node_modules/expo/node_modules` e nao
 * resolve da raiz - o bundle sai com MODULE_NOT_FOUND antes do primeiro
 * modulo, e a mensagem nao cita o preset. Sem arquivo nenhum o
 * `@expo/metro-config` carrega o mesmo preset por caminho proprio e tudo anda.
 * Entao o `examples/native` nao tem arquivo de Babel de proposito, o comando
 * nao escreve nenhum, e a guarda cobra que o exemplo continue assim: no dia em
 * que ele precisar de um, a receita tambem precisa, e o comando esta mentindo.
 */
import { existsSync } from "node:fs";
import { countAtLeast } from "./varredura";

const EXAMPLE = "examples/native";
const RECIPE = "native/scripts/init.mjs";

const recipe = (await import(`${import.meta.dir}/../${RECIPE}`)) as {
  SPEC: string;
  BABEL_NAMES: string[];
  BABEL_V4: { mark: RegExp; why: string }[];
  POSTCSS_PLUGINS: string[];
  BROWSERSLIST: string[];
  USER_INTERFACE_STYLE: string;
  METRO_WRAPPER: string;
  RECIPE: { name: string }[];
  globalCss: (spec?: string) => string;
  postcssConfig: () => string;
  metroConfig: () => string;
  nativewindEnv: () => string;
};

const SPEC = recipe.SPEC;

/**
 * O `examples/native` mora dentro do repositorio e alcanca `native/` por
 * caminho relativo; o app de fora alcanca o mesmo por nome de pacote. Trocar um
 * pelo outro deixa as duas listas de diretiva comparaveis sem afrouxar nada:
 * cada par e uma equivalencia, e nao uma exclusao.
 */
const SAME_PLACE: [string, string][] = [
  ["../../native/theme.css", `${SPEC}/theme.css`],
  ["../../native/src", `./node_modules/${SPEC}/src`],
];

function directives(css: string): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const found = [...clean.matchAll(/@(import|source)\b[^;]*;/g)].map((one) =>
    one[0].replace(/\s+/g, " ").trim(),
  );

  return found.map((line) => {
    let out = line;
    for (const [inside, outside] of SAME_PLACE) out = out.replaceAll(inside, outside);
    return out;
  });
}

function plugins(mjs: string): string[] {
  return [...mjs.matchAll(/"([^"]+)":\s*\{\}/g)].map((one) => one[1]!);
}

function wrapper(js: string): string[] {
  return [...js.matchAll(/\b(withNativewind|withNativeWind)\s*\(/g)].map((one) => one[1]!);
}

/**
 * O `.d.ts` do app tambem carrega FATO, e nao texto: a lista de referencias de
 * tipo e a de modulos declarados. E a metade do setup que o `tsc` do app cobra
 * e o metro nao - sem `nativewind/types` o `className` nao existe nas props de
 * `View`, e como o pacote publica FONTE o erro cai na NOSSA arvore.
 */
function typing(dts: string): string[] {
  return [
    ...[...dts.matchAll(/\/\/\/\s*<reference\s+types="([^"]+)"\s*\/>/g)].map(
      (one) => `types ${one[1]!}`,
    ),
    ...[...dts.matchAll(/declare\s+module\s+"([^"]+)"/g)].map((one) => `module ${one[1]!}`),
  ];
}

const problems: string[] = [];

function compare(what: string, mine: unknown, theirs: unknown, hint: string) {
  if (JSON.stringify(mine) === JSON.stringify(theirs)) return;

  problems.push(
    `${what}\n` +
      `    ${EXAMPLE}: ${JSON.stringify(theirs)}\n` +
      `    ${RECIPE}: ${JSON.stringify(mine)}\n` +
      `    ${hint}`,
  );
}

const exampleCss = await Bun.file(`${EXAMPLE}/global.css`).text();
const exampleDirectives = directives(exampleCss);
const mineDirectives = directives(recipe.globalCss(SPEC));

countAtLeast(`diretiva de \`${EXAMPLE}/global.css\``, exampleDirectives.length, 6);
countAtLeast("diretiva do global.css da receita", mineDirectives.length, 6);

compare(
  "global.css: as diretivas nao batem.",
  mineDirectives,
  exampleDirectives,
  "O `@source not inline(...)` que falta e classe que o scanner do Tailwind" +
    "\n    inventa a partir do codigo das pecas, e `.shadow` derruba o compilador" +
    "\n    nativo. Ordem tambem conta: `utilities.css` depois do tema.",
);

compare(
  "postcss.config.mjs: a lista de plugins nao bate.",
  plugins(recipe.postcssConfig()),
  plugins(await Bun.file(`${EXAMPLE}/postcss.config.mjs`).text()),
  "Sem o plugin do Tailwind a tela renderiza sem estilo, sem erro e sem pista.",
);

compare(
  "metro.config.js: o embrulho nao bate.",
  wrapper(recipe.metroConfig()),
  wrapper(await Bun.file(`${EXAMPLE}/metro.config.js`).text()),
  "E o `withNativewind` que troca o transformador do metro pelo do react-native-css.",
);

const exampleTyping = typing(await Bun.file(`${EXAMPLE}/nativewind-env.d.ts`).text());
const mineTyping = typing(recipe.nativewindEnv());

countAtLeast(`fato de \`${EXAMPLE}/nativewind-env.d.ts\``, exampleTyping.length, 2);
countAtLeast("fato do nativewind-env.d.ts da receita", mineTyping.length, 2);

compare(
  "nativewind-env.d.ts: as declaracoes de tipo nao batem.",
  mineTyping,
  exampleTyping,
  "Sem `nativewind/types` o `className` nao existe nas props de View, Text e" +
    "\n    Pressable, e o tsc do app reprova a nossa fonte inteira por um erro que" +
    "\n    nao e dele - o skipLibCheck dele nao salva, porque so pula .d.ts. O" +
    '\n    `declare module "*.css"` e do `generated.css` que o App.tsx importa.',
);

const exampleApp = (await Bun.file(`${EXAMPLE}/app.json`).json()) as {
  expo: { userInterfaceStyle?: string };
};

compare(
  "app.json: o `userInterfaceStyle` nao bate.",
  recipe.USER_INTERFACE_STYLE,
  exampleApp.expo.userInterfaceStyle,
  "Fora de `automatic` o iOS prende a aparencia no claro e o tema escuro nunca chega.",
);

const examplePkg = (await Bun.file(`${EXAMPLE}/package.json`).json()) as {
  browserslist?: string[];
};

compare(
  "package.json: o `browserslist` nao bate.",
  recipe.BROWSERSLIST,
  examplePkg.browserslist,
  "Sem navegador moderno o passe web do Expo reescreve o `light-dark()` dos" +
    "\n    tokens num polyfill de vars orfas, e a compilacao morre com" +
    '\n    "Specifier, found ()".',
);

const strayBabel = recipe.BABEL_NAMES.filter((name) => existsSync(`${EXAMPLE}/${name}`));

countAtLeast("nome de arquivo de Babel procurado", recipe.BABEL_NAMES.length, 10);

if (strayBabel.length > 0) {
  problems.push(
    `babel.config.js: ${EXAMPLE} passou a ter arquivo de Babel (${strayBabel.join(", ")}).\n` +
      "    O comando nao escreve nenhum, e diz ao usuario que nao ter e o certo,\n" +
      "    porque e o que o exemplo mede. Se o exemplo agora precisa de um, a\n" +
      "    receita precisa do mesmo, e esta guarda tem que passar a comparar\n" +
      "    conteudo em vez de ausencia.",
  );
}

if (recipe.BABEL_V4.length === 0) {
  problems.push(
    "babel.config.js: a receita parou de reconhecer a v4 do NativeWind.\n" +
      "    `BABEL_V4` esta vazia, entao o comando aceita calado o arquivo que a\n" +
      "    receita antiga manda escrever - e e ele que quebra o bundle.",
  );
}

if (problems.length > 0) {
  console.error(
    `${problems.length} divergencia(s) entre a receita do \`rivocode-ui-native-init\` e o ${EXAMPLE}:\n`,
  );
  for (const problem of problems) console.error(`  ${problem}\n`);
  console.error(
    `  O ${EXAMPLE} e a fonte, porque e o unico dos dois que roda. Conserte o\n` +
      `  ${RECIPE} para dizer o mesmo, e o \`native/README.md\` junto.`,
  );
  process.exit(1);
}

console.log(
  `A receita de ${recipe.RECIPE.length} arquivos do \`rivocode-ui-native-init\` diz o mesmo que o ` +
    `${EXAMPLE}: ${mineDirectives.length} diretivas de CSS, ${recipe.POSTCSS_PLUGINS.length} plugin de PostCSS, ` +
    `${recipe.METRO_WRAPPER}, userInterfaceStyle ${recipe.USER_INTERFACE_STYLE}, ` +
    `browserslist com ${recipe.BROWSERSLIST.length}, ${mineTyping.length} fatos de tipagem, ` +
    `e nenhum arquivo de Babel nos dois ` +
    `(${recipe.BABEL_V4.length} marca da v4 recusada em ${recipe.BABEL_NAMES.length} nomes).`,
);
