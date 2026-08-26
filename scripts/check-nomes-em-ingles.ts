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
 * A lista abaixo nao pretende saber portugues - ela conhece as palavras que
 * este repositorio ja usou. Cresce quando alguem tenta escrever uma nova, o
 * que e exatamente o momento em que a guarda precisa falar.
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
  "intervalo",
  "itens",
  "junto",
  "ler",
  "ligacoes",
  "linha",
  "linhas",
  "lista",
  "marca",
  "marcados",
  "meses",
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
  "trilha",
  "valor",
  "valores",
  "varrer",
  "vazio",
  "veste",
  "vizinhos",
];

/** So declaracao: `const x`, `function x`, `type X`. */
const DECLARATION = /\b(?:const|let|var|function|type|interface|class|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g;

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
    .split(/[\s_]+/);

  for (const part of parts) {
    if (PORTUGUESE.includes(part.toLowerCase())) return part.toLowerCase();
  }
  return null;
}

const found: string[] = [];

for (const area of AREAS) {
  for await (const file of new Glob(area).scan(".")) {
    const code = await Bun.file(file).text();

    code.split("\n").forEach((line, index) => {
      // Comentario e prosa, e prosa e em portugues.
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;

      for (const [, name] of line.matchAll(DECLARATION)) {
        const word = portugueseWordIn(name!);
        if (word) found.push(`  ${file}:${index + 1}  ${name} (${word})`);
      }
    });
  }
}

if (found.length > 0) {
  console.error(`${found.length} identificador(es) em portugues:\n`);
  for (const item of found) console.error(item);
  console.error(
    "\nA biblioteca escreve para a tela em portugues e programa em ingles." +
      "\nComentario e texto de interface seguem em portugues; o nome, nao.",
  );
  process.exit(1);
}

console.log("Todo identificador em ingles.");
