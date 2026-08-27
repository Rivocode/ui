/**
 * Guarda de classe morta: nome que parece utilitario, nao gera regra nenhuma,
 * e nao arranca erro de ninguem.
 *
 * O caso medido: `native/src/slider.tsx` pintava o polegar com
 * `shadow-1`, uma classe que o CSS nativo nunca emitiu - `grep -c shadow
 * native/theme.css` dava zero. No web ela existe, alguem a copiou por
 * analogia, e o polegar do `Slider` nativo passou a vida inteira sem sombra.
 * Nada acusou: o `tsc` passa, o `oxlint` passa, o `bun test` passa, o pacote
 * publica, e o defeito so aparece na tela de quem instalou.
 *
 * E o pior tipo de defeito desta casa, porque a classe some SEM ESTILO E SEM
 * ERRO. O `check:grupos` diz no cabecalho dele que "a varredura de classe orfa
 * nao pega isso"; esta e a varredura de classe orfa, e as duas guardas medem
 * coisas diferentes: la o seletor existe e nunca casa, aqui a regra nunca
 * chega a nascer.
 *
 * ## Como saber se a classe gera regra
 *
 * Pelo compilador, e nao por lista de nome conhecido. O
 * `__unstable__loadDesignSystem` do Tailwind monta o mesmo sistema de design
 * que o build monta, a partir do MESMO CSS de entrada, e o `candidatesToCss`
 * devolve `null` para o candidato que ele nao sabe compilar. Entao `shadow-1`
 * volta nulo no nativo e volta regra no web, que e exatamente a diferenca que
 * ninguem viu. Variante, valor arbitrario e modificador de opacidade passam
 * pelo mesmo caminho do build, sem regra paralela para envelhecer aqui.
 *
 * ## Como saber se a string e uma lista de classe
 *
 * Este e o lado dificil, e a primeira tentativa foi medida antes de virar
 * guarda: aceitar toda string cospe 145 avisos no nativo e 217 no web -
 * `--color-accent`, `aaaa-mm-dd`, nome de pacote, chave de objeto. Ruido nessa
 * escala e guarda que ninguem le.
 *
 * O corte que chegou a sinal limpo tem duas portas, e a string entra por uma
 * ou por outra:
 *
 *  1. **posicao.** Literal preso a `className=` ou `class=` e lista de classe
 *     por construcao, mesmo que nenhum token dele compile - e o unico jeito de
 *     pegar `className="shadow-1"` sozinho numa peca.
 *  2. **companhia.** Em qualquer outro lugar - argumento de `cn(...)`, mapa de
 *     variante, ternario -, a string vale como lista de classe quando ao menos
 *     UM token dela compila. Token que nao compila ao lado de token que
 *     compila e o defeito; token solto sem companhia nenhuma e prosa.
 *
 * Com as duas portas: 145 avisos viram 1 no nativo, e o 1 era real.
 *
 * ## Escopo: os dois pacotes
 *
 * `src/**` tambem, e nao so `native/src/**`. Foi medido nos dois, com o CSS de
 * cada um: o web sai limpo hoje, mas o mecanismo do defeito e identico la - o
 * Tailwind ignora candidato que nao entende, com outra configuracao e outro
 * conjunto de tokens. Guarda que cobrisse meia casa deixaria o mesmo erro
 * entrar pelo lado que hoje esta limpo, e a peca web e a que mais muda.
 *
 * Fora ficam `demo/`, `.design-sync/previews/` e `apps/docs/`: nenhum e
 * publicado como pacote, e cada um compila com a propria entrada de CSS, com
 * `@source` e tokens que nao sao os da biblioteca. Medir com o CSS errado
 * inventa acusacao.
 *
 * ## Sem lista de excecao, e de proposito
 *
 * As duas arvores saem limpas com as regras acima, entao nao ha `DEBT` aqui, e
 * nao deve nascer um. Duas classes de token saem por REGRA, e nao por nome:
 *
 *  - `group`, `peer`, `group/x`, `peer/x` - marcador, e nao utilitario. Nao
 *    geram regra em versao nenhuma do Tailwind, e quem confere se o marcador
 *    tem consumidor e o `check:grupos`.
 *  - token sem uma letra sequer (`0`, `1px`, `1.5`) - nunca foi classe, e
 *    aparece quando uma string de valor abreviado cai pela porta da companhia.
 *
 * ## A sombra que fez a guarda nascer
 *
 * A classe saiu do `Slider` em vez de a escala ser gerada, e as tres medidas
 * que decidiram isso:
 *
 *  1. o `react-native-css@3.0.7` TRADUZ `box-shadow` para o `boxShadow` do
 *     React Native - com `light-dark()` virando regra de
 *     `prefers-color-scheme`, e cada camada em `offsetX`, `offsetY`,
 *     `blurRadius`, `spreadDistance` e `color`. Sombra no toque nao e um
 *     idioma perdido;
 *  2. mas o utilitario `shadow-*` do Tailwind nao chega la. Ele passa pela
 *     cadeia de `--tw-shadow`, e a segunda declaracao dessa variavel - a
 *     regra, sobre o `:root` que o `native/scripts/build-css.mjs` sintetiza a
 *     partir do `@property` - derruba o compilador nativo com "failed to
 *     deserialize; expected an object-like struct named Specifier". Gerar a
 *     escala no `@theme` nao daria sombra: daria um app que nao compila CSS,
 *     que e o mesmo estrago que o `@source not inline("shadow")` do
 *     `examples/native/global.css` ja evita;
 *  3. e o polegar nao precisa dela. O `Slider` do web nao tem sombra no
 *     polegar nenhuma - `size-4 rounded-pill border border-accent bg-surface`
 *     -, entao a classe nunca foi paridade, e sim invencao. Medido com
 *     `src/lib/contrast.ts`, o polegar `bg-fg` sobre o trilho `bg-skeleton`
 *     da de 12,97:1 a 15,23:1 nos dois temas e sobre os dois fundos, contra
 *     um minimo de 3:1 da 1.4.11.
 */
import { Glob } from "bun";
import { __unstable__loadDesignSystem } from "tailwindcss";
import { dirname, isAbsolute, join, resolve } from "node:path";

/** Toda string do codigo: aspas duplas, simples e crase. */
const LITERAL =
  /"([^"\\\n]*(?:\\.[^"\\\n]*)*)"|'([^'\\\n]*(?:\\.[^'\\\n]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g;

/** `className="..."`, `class={"..."}` - a porta da posicao. */
const AT_CLASS = /\bclass(?:Name)?\s*=\s*\{?\s*("[^"\n]*"|'[^'\n]*'|`[^`\n]*`)/g;

/** `group`, `peer`, `group/barra` - marcador, medido pelo `check:grupos`. */
const MARKER = /^(?:group|peer)(?:\/|$)/;

const MODULES = "node_modules";

/**
 * O CSS de entrada de cada pacote, palavra por palavra o mesmo que o build usa.
 *
 * O nativo nao tem arquivo de entrada comitado: quem o monta e o `global.css`
 * do app que consome, e as tres linhas abaixo sao as tres dele que decidem
 * quais classes existem. O `@source` fica de fora porque o sistema de design
 * nao varre codigo - quem varre e esta guarda.
 */
const AREAS = [
  {
    name: "web",
    css: { path: "src/styles.css", text: null as string | null },
    trees: ["src/**/*.{ts,tsx}"],
  },
  {
    name: "nativo",
    css: {
      path: "native/entrada.css",
      text:
        `@import "tailwindcss/theme.css" layer(theme);\n` +
        `@import "./theme.css";\n` +
        `@import "tailwindcss/utilities.css";\n`,
    },
    trees: ["native/src/**/*.{ts,tsx}"],
  },
];

async function loadStylesheet(id: string, base: string) {
  let path = isAbsolute(id) ? id : resolve(base, id);
  if (!id.startsWith(".") && !isAbsolute(id)) {
    path = join(process.cwd(), MODULES, id);
    const file = Bun.file(path);
    if (!(await file.exists())) path = join(process.cwd(), MODULES, id, "index.css");
  }
  return { path, base: dirname(path), content: await Bun.file(path).text() };
}

/** Um julgador de candidato por pacote, com memoria: o mesmo token repete muito. */
async function compilerOf(css: { path: string; text: string | null }) {
  const text = css.text ?? (await Bun.file(css.path).text());
  const system = await __unstable__loadDesignSystem(text, {
    base: dirname(resolve(css.path)),
    loadStylesheet,
    loadModule: () => Promise.reject(new Error(`Sem plugin nem config: ${css.path}`)),
  });

  const known = new Map<string, boolean>();
  return (token: string) => {
    const cached = known.get(token);
    if (cached !== undefined) return cached;
    const compiles = system.candidatesToCss([token])[0] !== null;
    known.set(token, compiles);
    return compiles;
  };
}

/** Token que nunca foi classe, por forma e nao por nome. */
const skipped = (token: string) =>
  token.endsWith("-") || token.includes("$") || MARKER.test(token) || !/[a-zA-Z]/.test(token);

const problems: string[] = [];
let scanned = 0;

for (const area of AREAS) {
  const compiles = await compilerOf(area.css);

  for (const tree of area.trees) {
    for await (const file of new Glob(tree).scan(".")) {
      const code = await Bun.file(file).text();
      scanned += 1;

      const atClass = new Set<number>();
      for (const hit of code.matchAll(AT_CLASS)) {
        atClass.add(hit.index + hit[0].length - hit[1]!.length);
      }

      for (const hit of code.matchAll(LITERAL)) {
        const raw = hit[1] ?? hit[2] ?? hit[3] ?? "";
        // A interpolacao vira espaco: `${base} h-4` sao dois tokens, e o que
        // esta dentro das chaves e problema de quem passa.
        const tokens = raw
          .replace(/\$\{[^{}]*\}/g, " ")
          .split(/\s+/)
          .filter(Boolean);
        if (tokens.length === 0) continue;

        const list = atClass.has(hit.index) || tokens.some(compiles);
        if (!list) continue;

        for (const token of tokens) {
          if (compiles(token) || skipped(token)) continue;
          const line = code.slice(0, hit.index).split("\n").length;
          problems.push(`${file}:${line}  "${token}"  no ${area.name}: nenhuma regra`);
        }
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} classe(s) sem regra:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    "\nO Tailwind ignora candidato que nao entende, e ninguem reclama: a peca\n" +
      "sai sem o estilo, o gate fica verde e o pacote publica. Foi assim que o\n" +
      "polegar do Slider nativo viveu sem sombra.\n" +
      "Ou o nome esta errado, ou o token que o sustenta nao existe naquele\n" +
      "pacote - e a segunda hipotese e a que ninguem lembra de conferir.",
  );
  process.exit(1);
}

console.log(
  `Toda classe de ${scanned} arquivos gera regra, nos dois pacotes, e sem lista de excecao.`,
);
