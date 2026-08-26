/**
 * Guarda de idioma no codigo.
 *
 * A biblioteca escreve para a tela em portugues e programa em ingles, e as
 * duas coisas se misturavam: `PropsDeSelect` ao lado de `ButtonProps`,
 * `const selecao` dentro de um arquivo cujo tipo se chama `RowSelectionState`.
 * Quem chega no arquivo precisa trocar de idioma no meio da linha, e o nome
 * publico saia com meia traducao - o que ja custou duas renomeacoes com
 * quebra de contrato.
 *
 * A regra: identificador em ingles, sempre. Comentario, JSDoc e texto de
 * interface seguem em portugues, que e onde o portugues serve.
 *
 * ## O que ela olha
 *
 * A primeira versao so casava DECLARACAO - `const x`, `function x`, `type X` -
 * e por isso deixou passar as tres formas mais comuns de um nome nascer sem
 * palavra-chave na frente:
 *
 *   - desestruturacao: `const [selection, setSelecaoInterna] = useState()`;
 *   - resto: `const { onChange, ...resto } = field`;
 *   - parametro, inclusive o de uma assinatura publica.
 *
 * O terceiro foi o caro. `onPageChange: (pagina: number) => void` e prop
 * publica: o nome do parametro entra no `.d.ts`, sai na tabela de props que o
 * compilador gera e VAZOU para a documentacao publicada, onde qualquer um le
 * `(pagina: number) => void` numa biblioteca cuja API e em ingles.
 *
 * ## Como ela sabe que a palavra e portuguesa
 *
 * Por dois caminhos, e o segundo existe porque o primeiro nao escala. A lista
 * abaixo conhece as palavras que este repositorio ja usou - ela nao sabe
 * portugues, e nunca vai saber: `lado`, `busca` e `visto` so entram nela
 * depois de alguem escreve-las. O sufixo cobre o resto sem lista: nenhuma
 * palavra inglesa termina em `-acao`, `-mento`, `-dade`, `-agem`, `-encia` ou
 * `-ivel`, entao `paginacao`, `deslocamento` e `disponivel` sao pegos na
 * primeira vez que aparecem.
 */
import { Glob } from "bun";

/** Onde vale a regra: tudo que e codigo nosso. */
const AREAS = [
  "src/**/*.{ts,tsx}",
  "scripts/**/*.ts",
  "test/**/*.{ts,tsx}",
  "demo/*.tsx",
  "native/src/**/*.{ts,tsx}",
  "apps/docs/src/**/*.{ts,tsx}",
  "apps/docs/*.ts",
];

/**
 * As palavras portuguesas que ja apareceram como identificador aqui. Sem
 * acento de proposito: identificador nao carrega acento, e e assim que elas
 * foram escritas.
 */
const PORTUGUESE = [
  "abertos",
  "acao",
  "acoes",
  "agentes",
  "ajuda",
  "alvos",
  "amostra",
  "antes",
  "aqui",
  "arquivo",
  "arvore",
  "assinaturas",
  "assistente",
  "atual",
  "aviso",
  "barra",
  "bloco",
  "blocos",
  "busca",
  "cabecalho",
  "caixa",
  "campo",
  "caractere",
  "catalogo",
  "celula",
  "centavos",
  "chave",
  "chaves",
  "circulo",
  "citado",
  "clientes",
  "colunas",
  "combina",
  "concluido",
  "conferir",
  "confirmar",
  "contrato",
  "controlado",
  "corpo",
  "dados",
  "descrever",
  "descricao",
  "destino",
  "dicionario",
  "digitos",
  "dividido",
  "entradas",
  "erro",
  "escrever",
  "escrito",
  "espia",
  "estado",
  "estados",
  "exemplo",
  "externo",
  "faixas",
  "faltando",
  "fatias",
  "filtro",
  "fim",
  "folha",
  "forma",
  "formas",
  "formulario",
  "fronteiras",
  "gatilho",
  "gerenciador",
  "grafico",
  "grupos",
  "guia",
  "icone",
  "inicio",
  "interna",
  "interno",
  "internos",
  "intervalo",
  "itens",
  "junto",
  "lado",
  "ler",
  "ligacoes",
  "linha",
  "linhas",
  "lista",
  "marca",
  "marcados",
  "meses",
  "misto",
  "modulo",
  "molde",
  "moldura",
  "montar",
  "mudar",
  "nomes",
  "nota",
  "notas",
  "novas",
  "novo",
  "numero",
  "onde",
  "opcao",
  "opcoes",
  "opcional",
  "ordem",
  "origem",
  "outros",
  "pagina",
  "paginas",
  "painel",
  "palavra",
  "palavras",
  "papel",
  "papeis",
  "parametro",
  "pasta",
  "peca",
  "pecas",
  "periodos",
  "pino",
  "pode",
  "porcento",
  "preso",
  "quantos",
  "rascunho",
  "receita",
  "repassadas",
  "resto",
  "reticencia",
  "retratos",
  "rodape",
  "rotulo",
  "selecao",
  "setores",
  "simbolo",
  "situacao",
  "situacoes",
  "sumiram",
  "tarja",
  "tema",
  "texto",
  "titulo",
  "traco",
  "trilha",
  "urgente",
  "valor",
  "valores",
  "varrer",
  "vazio",
  "veste",
  "visiveis",
  "visto",
  "vizinhos",
  "voltar",
];

/**
 * As terminacoes que so o portugues produz.
 *
 * Serve para a palavra que ninguem listou ainda, que e a maioria delas. Nao ha
 * palavra inglesa terminada em `-acao`, `-mento`, `-dade`, `-agem`, `-encia`,
 * `-ancia`, `-ismo`, `-avel`, `-ivel` ou `-inho`, entao o falso positivo aqui
 * e teorico, e o que se ganha e concreto: `SEM_PAGINACAO`, `deslocamento` e
 * `disponivel` foram pegos na primeira vez que apareceram, sem que ninguem
 * tivesse previsto nenhuma das tres.
 *
 * Minimo de seis letras para o sufixo nao engolir palavra curta - `made`
 * termina em `-ade` mas nao em `-dade`, e a margem sai barata.
 */
const PORTUGUESE_ENDING = /(?:acao|acoes|icao|icoes|ancia|encia|dade|mento|agem|ismo|avel|ivel|veis|inho|inha)$/;

/**
 * A divida que ficou para depois.
 *
 * Cada linha e um nome que a guarda ampliada passou a acusar num arquivo que
 * outro agente estava reescrevendo na mesma hora. Deixar a guarda desligada
 * ate a poeira baixar seria perder a guarda; renomear por cima do trabalho
 * alheio seria perder o trabalho. Entao a divida fica escrita, com endereco.
 *
 * Ela so encolhe: entrada que nao acusa mais e erro, e a guarda manda apagar a
 * linha. E o que impede esta lista de virar o lugar onde os nomes em portugues
 * vao morar.
 */
const DEBT = new Set([
  "src/components/alert.tsx urgente",
  "src/components/checkbox.tsx TracoMisto",
  "src/components/checkbox.tsx Visto",
  "src/components/data-table.tsx SEM_PAGINACAO",
  "src/components/data-table.tsx filtroSemAcento",
  "src/components/data-table.tsx setSelecaoInterna",
  "src/components/date-picker.tsx dataInterna",
  "src/components/date-picker.tsx setDataInterna",
  "src/components/date-range-picker.tsx setIntervaloInterno",
  "src/components/pagination.tsx pagina",
  "src/components/sheet.tsx LadoContext",
  "src/components/slider.tsx valor",
  "src/components/steps.tsx concluido",
  "src/components/steps.tsx podeVoltar",
  "src/components/tree-select.tsx busca",
  "src/components/tree-select.tsx setBusca",
  "src/components/tree.tsx abertos",
  "src/components/tree.tsx abertosInternos",
  "src/components/tree.tsx busca",
  "src/components/tree.tsx misto",
  "src/components/tree.tsx setAbertosInternos",
  "src/components/tree.tsx visiveis",
]);

/**
 * Os arquivos que falam SOBRE o portugues.
 *
 * Um dicionario de acentuacao tem `acao: "acao"` como dado, e nao como nome de
 * variavel - acusa-lo seria a guarda mordendo a propria lista. Sao poucos e
 * sao sempre os mesmos: os que traduzem, os que acentuam, e ela mesma.
 */
const DICTIONARIES =
  /check-nomes-em-ingles|acentuar\.ts|exports-ingles|acentos\.test|acentos-previews|titulos-previews/;

/**
 * Apaga do codigo tudo que e prosa, preservando o tamanho.
 *
 * Comentario, string e texto solto de JSX sao portugues por contrato, e sao
 * exatamente onde as palavras da lista aparecem de proposito. Apagar por
 * substituicao de mesmo comprimento - espaco por caractere, quebra de linha
 * intacta - mantem cada byte no lugar, e por isso o numero da linha continua
 * sendo o do arquivo de verdade.
 */
function withoutProse(code: string) {
  const chars = code.split("");
  const erase = (from: number, to: number) => {
    for (let at = from; at < to; at++) if (chars[at] !== "\n") chars[at] = " ";
  };

  for (const hit of code.matchAll(/\/\*[\s\S]*?\*\//g)) erase(hit.index!, hit.index! + hit[0].length);
  for (const hit of code.matchAll(/\/\/[^\n]*/g)) erase(hit.index!, hit.index! + hit[0].length);

  // Em duas passadas: string so e string depois que o comentario saiu, senao
  // uma aspa dentro de comentario abriria uma que nunca fecha.
  let clean = chars.join("");
  const inner = clean.split("");
  const eraseInner = (from: number, to: number) => {
    for (let at = from; at < to; at++) if (inner[at] !== "\n") inner[at] = " ";
  };

  for (const hit of clean.matchAll(/(["'`])(?:\\.|(?!\1)[\s\S])*?\1/g)) {
    eraseInner(hit.index! + 1, hit.index! + hit[0].length - 1);
  }

  clean = inner.join("");
  const last = clean.split("");
  // Texto solto de JSX: o que fica entre `>` e `<` sem chave no meio. Sem isto
  // o `<p>Nenhuma pagina encontrada</p>` de um retorno vira acusacao.
  for (const hit of clean.matchAll(/>([^<>{}]*)</g)) {
    for (let at = hit.index! + 1; at < hit.index! + hit[0].length - 1; at++) {
      if (last[at] !== "\n") last[at] = " ";
    }
  }

  return last.join("");
}

/**
 * O que vem depois dos dois pontos e um TIPO, e nao um valor.
 *
 * E o que separa `pagina: number` - parametro, nome de gente - de
 * `numero: "NF-001"` - chave de um objeto de dados, que pode e deve estar em
 * portugues quando o dado esta. Sem esta pergunta a guarda acusaria toda
 * fixture do demo, e ninguem leria a saida dela de novo.
 */
const TYPE_AHEAD =
  /^\s*(?:readonly\s+)?(?:[A-Z([]|string\b|number\b|boolean\b|unknown\b|any\b|never\b|void\b|null\b|undefined\b|symbol\b|bigint\b|object\b|this\b|keyof\b|typeof\b|new\b)/;

/** Cada jeito de um nome nascer, e como arrancar o nome de dentro dele. */
const BINDINGS = [
  /** `const x`, `function x`, `type X`. */
  { kind: "declaracao", pattern: /\b(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_$][\w$]*)/g },
  /** `(pagina: number) => void`, e todo campo de tipo. */
  { kind: "assinatura", pattern: /([A-Za-z_$][\w$]*)\s*\??\s*:/g, typed: true },
  /** `...resto`, no parametro e na desestruturacao. */
  { kind: "resto", pattern: /\.\.\.([A-Za-z_$][\w$]*)/g },
  /** `const [a, setB] =` e `const { a, b: c } =`. */
  { kind: "padrao", pattern: /(?:const|let|var)\s*([[{][^=\n]*?[\]}])\s*=/g, split: true },
] as const;

/**
 * A palavra tem que casar inteira, e nao por pedaco: `Format` nao e `forma`,
 * `AlertDialog` nao e `alerta`, e `formatDate` nao e `data`. Casar por pedaco
 * transforma a guarda num gerador de falso positivo, e guarda que grita a toa
 * e desligada na semana seguinte.
 */
function portugueseWordIn(name: string): string | null {
  const parts = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_]+/)
    .filter(Boolean);

  for (const part of parts) {
    const word = part.toLowerCase();
    if (PORTUGUESE.includes(word)) return word;
    if (word.length >= 6 && PORTUGUESE_ENDING.test(word)) return word;
  }
  return null;
}

/**
 * `const { pageIndex: atual, ...resto }` da `atual` e `resto`: o nome local e
 * o depois dos dois pontos quando ha renome, e a chave quando nao ha.
 */
function namesInPattern(pattern: string) {
  return pattern
    .split(",")
    .map((part) =>
      part
        .replace(/^[\s[{]+/, "")
        .replace(/[\s\]}]+$/, "")
        .replace(/^\.\.\./, "")
        .split(":")
        .pop()!
        .trim(),
    )
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

const found: string[] = [];
const paid = new Set<string>();

for (const area of AREAS) {
  for await (const file of new Glob(area).scan(".")) {
    if (DICTIONARIES.test(file)) continue;

    const code = withoutProse(await Bun.file(file).text());
    const seen = new Set<string>();

    for (const binding of BINDINGS) {
      for (const hit of code.matchAll(binding.pattern)) {
        const after = code.slice(hit.index! + hit[0].length);
        if ("typed" in binding && !TYPE_AHEAD.test(after)) continue;

        const names = "split" in binding ? namesInPattern(hit[1]!) : [hit[1]!];

        for (const name of names) {
          if (seen.has(name)) continue;
          const word = portugueseWordIn(name);
          if (!word) continue;

          seen.add(name);
          const debt = `${file} ${name}`;
          if (DEBT.has(debt)) {
            paid.add(debt);
            continue;
          }

          const line = code.slice(0, hit.index!).split("\n").length;
          found.push(`  ${file}:${line}  ${name} (${word})`);
        }
      }
    }
  }
}

if (found.length > 0) {
  console.error(`${found.length} identificador(es) em portugues:\n`);
  for (const item of found) console.error(item);
  console.error(
    "\nA biblioteca escreve para a tela em portugues e programa em ingles." +
      "\nComentario e texto de interface seguem em portugues; o nome, nao." +
      "\n\nEm prop publica isso nao para no arquivo: o nome do parametro entra no" +
      "\n`.d.ts`, na tabela de props e na documentacao que o site publica.",
  );
  process.exit(1);
}

const stale = [...DEBT].filter((item) => !paid.has(item));
if (stale.length > 0) {
  console.error(`${stale.length} linha(s) de divida que nao acusam mais nada:\n`);
  for (const item of stale) console.error(`  "${item}",`);
  console.error(
    "\nO nome foi renomeado, e a divida foi paga. Apague essa(s) linha(s) do" +
      "\n`DEBT` em scripts/check-nomes-em-ingles.ts - lista de excecao que nao" +
      "\nencolhe vira o lugar onde o proximo nome em portugues se esconde.",
  );
  process.exit(1);
}

console.log(`Todo identificador em ingles, fora as ${DEBT.size} dividas ja declaradas.`);
