/**
 * Guarda da skill: prop citada em exemplo tem que existir na peca.
 *
 * A propria SKILL.md manda, no item 3, "nunca invente prop" - e o exemplo de
 * formulario dela ensinava `<FormField render={...} />` por meses. O
 * `FormFieldProps` nunca teve `render`: a funcao entra por `children`, que e
 * obrigatorio. Quem seguia o exemplo nao compilava, e quem le a skill e
 * justamente quem ainda nao conhece a peca para desconfiar.
 *
 * O buraco era estrutural. O `check:previews` typecheca `.design-sync/previews`
 * e mais nada; nenhum bloco de codigo da skill passa pelo compilador, e a skill
 * e publicada crua em /skill/SKILL.md e copiada para dentro do pacote pelo
 * `build:skill`. Ou seja: e o unico codigo que a biblioteca distribui sem
 * ninguem conferir.
 *
 * ## Por que conferir prop, e nao compilar o bloco
 *
 * Compilar seria mais forte e nao cabe: dos blocos aqui, a metade e fragmento -
 * JSX solto, sem import, chamando `FORMAS` e `field` que nunca foram
 * declarados. Faze-los compilar exigiria embrulhar cada um num arquivo
 * sintetico com stubs adivinhados, e a guarda passaria a errar por causa do
 * proprio embrulho - que e o jeito conhecido de uma guarda ser desligada.
 *
 * Entao esta confere o que da para conferir sem contexto: o nome de cada
 * atributo escrito num componente do catalogo, contra a tabela de props que o
 * compilador ja gerou em `apps/docs/src/component-props.json`. E o mesmo dado
 * que a documentacao publica mostra, entao a skill e a doc nunca divergem sem
 * alguem saber. Pega o `render` do FormField, que era o alvo.
 *
 * O que ela nao pega, de proposito: tipo errado no valor, ordem de composicao,
 * peca que nao existe, import faltando. Para isso o caminho e o compilador, e
 * ele custa o embrulho acima.
 */
import { scanAtLeast } from "./varredura";

const SKILL_DIR = ".claude/skills/rivocode-ui";
const CATALOG = "apps/docs/src/component-props.json";
const REACT_TYPES = "node_modules/@types/react/index.d.ts";

/**
 * A skill do nativo fala de outro pacote.
 *
 * `Button` e `Card` existem nos dois catalogos com props diferentes, e conferir
 * o exemplo nativo contra a tabela do web acusaria a peca certa pelo motivo
 * errado. Enquanto o `@rivocode/ui-native` nao gerar tabela propria, este
 * arquivo fica de fora - e e melhor dizer isso aqui do que deixar a guarda
 * mentir em silencio.
 */
const OUT_OF_SCOPE = new Set(["reference/native.md"]);

type Piece = { forwardsRoot: boolean; props: { name: string }[] };

/**
 * Os atributos que o React aceita em qualquer elemento.
 *
 * A tabela de props nao os lista - `props-do-catalogo.ts` corta tudo que vem
 * de `@types/react` e guarda so a resposta `forwardsRoot` - entao `className`
 * num `<Card>` seria acusado sem isto. A lista sai do proprio `.d.ts` do React
 * instalado, e nao escrita a mao: atributo de DOM e um vocabulario de umas
 * trezentas palavras, e mante-lo a mao seria a segunda lista fechada deste
 * repositorio a envelhecer sozinha.
 */
async function domAttributes(): Promise<Set<string>> {
  const source = await Bun.file(REACT_TYPES).text();
  const names = new Set<string>();

  // `AllHTMLAttributes` traz todo atributo de HTML; `SVGAttributes` traz
  // `fill`, `stroke` e companhia, que os graficos usam; as duas ja estendem
  // `AriaAttributes` e `DOMAttributes`, de onde vem os `onClick` da vida.
  for (const wanted of ["AllHTMLAttributes", "SVGAttributes"]) {
    const start = source.indexOf(`interface ${wanted}<T>`);
    if (start === -1) {
      throw new Error(
        `Nao achei \`interface ${wanted}<T>\` em ${REACT_TYPES}.\n` +
          "Sem ela a guarda acusaria `className` em toda peca. Confira se o\n" +
          "@types/react mudou o nome da interface e ajuste domAttributes().",
      );
    }

    // Do `{` da interface ate a chave que o fecha na coluna zero do bloco.
    const open = source.indexOf("{", start);
    const end = source.indexOf("\n    }", open);
    for (const [, name] of source.slice(open, end).matchAll(/^\s{8}([a-zA-Z][\w-]*)\??:/gm)) {
      names.add(name!);
    }
  }

  return names;
}

/** `key` e `ref` sao do React e nao do elemento; `children` vem por dentro. */
const ALWAYS = new Set(["key", "ref", "children"]);

/**
 * Os atributos de uma tag de abertura, sem confundir com o que esta dentro dos
 * valores.
 *
 * Um regex sobre a tag inteira acusava `flex-wrap` de `className="flex-wrap"` e
 * `thumb` de `classNames={{ thumb: ... }}` - trinta falsos positivos, o
 * suficiente para ninguem ler a saida. Entao le-se caractere a caractere:
 * string pula inteira, bloco `{...}` pula inteiro, e so sobra o que esta
 * mesmo no nivel da tag.
 */
function attributesOf(code: string) {
  const found: { tag: string; attr: string; line: number }[] = [];

  for (let i = 0; i < code.length; i++) {
    if (code[i] !== "<") continue;
    const opening = /^<([A-Z][A-Za-z0-9]*)/.exec(code.slice(i));
    if (!opening) continue;

    const tag = opening[1]!;
    let at = i + opening[0].length;
    let depth = 0;
    let word = "";

    const flush = (position: number) => {
      if (!word) return;
      found.push({ tag, attr: word, line: code.slice(0, position).split("\n").length });
      word = "";
    };

    while (at < code.length) {
      const char = code[at]!;

      if (depth === 0 && (char === ">" || (char === "/" && code[at + 1] === ">"))) break;

      if (char === "{") {
        depth += 1;
        at += 1;
        continue;
      }
      if (char === "}") {
        depth -= 1;
        at += 1;
        continue;
      }
      if (depth > 0) {
        at += 1;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        at += 1;
        while (at < code.length && code[at] !== char) at += 1;
        at += 1;
        continue;
      }

      // `aria-label` e `data-state` tem traco; `render` e `onValueChange` nao.
      if (/[A-Za-z0-9_-]/.test(char)) {
        word += char;
        at += 1;
        continue;
      }

      flush(at);
      at += 1;
    }

    flush(at);
  }

  return found;
}

const catalog = JSON.parse(await Bun.file(CATALOG).text()) as Record<string, Piece>;
const dom = await domAttributes();

const invented: string[] = [];
let checked = 0;

/*
 * `Glob(".claude/**").scan(".")` devolve zero arquivos: o bun ignora pasta
 * oculta quando ela esta no padrao. Varrer de dentro dela resolve, e o custo de
 * descobrir isso de novo e uma tarde.
 */
for (const file of await scanAtLeast("**/*.md", 5, { cwd: SKILL_DIR })) {
  if (OUT_OF_SCOPE.has(file)) continue;

  const text = await Bun.file(`${SKILL_DIR}/${file}`).text();

  for (const block of text.matchAll(/```(?:tsx|jsx)\n([\s\S]*?)```/g)) {
    const code = block[1]!;
    // A linha onde o bloco comeca, para o endereco do erro apontar o arquivo e
    // nao o bloco.
    const offset = text.slice(0, block.index! + block[0].indexOf("\n") + 1).split("\n").length - 1;

    for (const { tag, attr, line } of attributesOf(code)) {
      const piece = catalog[tag];
      // Peca que nao esta no catalogo e componente do proprio exemplo
      // (`<InvoiceScreen />`) ou icone do lucide. Nao ha tabela para conferir.
      if (!piece) continue;

      checked += 1;

      if (piece.props.some((prop) => prop.name === attr)) continue;
      if (ALWAYS.has(attr) || /^(aria|data)-/.test(attr)) continue;
      // Atributo de DOM so vale onde a peca repassa a raiz.
      if (piece.forwardsRoot && dom.has(attr)) continue;

      const real = piece.props.map((prop) => prop.name).sort();
      invented.push(
        `  ${SKILL_DIR}/${file}:${offset + line}  <${tag} ${attr}=...>\n` +
          `    ${tag} aceita: ${real.length ? real.join(", ") : "(nenhuma prop propria)"}`,
      );
    }
  }
}

if (invented.length > 0) {
  console.error(`${invented.length} prop(s) que a skill ensina e a peca nao tem:\n`);
  for (const item of invented) console.error(item);
  console.error(
    "\nRegrave o exemplo com a prop que existe - a lista acima sai do mesmo" +
      "\ncompilador que gera a tabela da documentacao. A skill e copiada para" +
      "\ndentro do pacote pelo `build:skill` e servida em /skill/SKILL.md:" +
      "\nexemplo que nao compila vira o primeiro codigo que um agent escreve." +
      "\n\nSe a prop e nova, rode `bun run gen:props` antes: a tabela pode estar" +
      "\natrasada em relacao ao codigo.",
  );
  process.exit(1);
}

console.log(`${checked} props citadas nos exemplos da skill, todas existentes.`);
