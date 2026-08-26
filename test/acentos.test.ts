import { expect, test } from "bun:test";
import { Glob } from "bun";

/*
 * O texto que a biblioteca escreve na tela e o unico portugues do pacote que
 * o cliente le. Comentario e JSDoc seguem sem acento por escolha do repo, e
 * nao entram aqui: o que entra e rotulo, titulo, aviso e mensagem de erro.
 *
 * A varredura acha a palavra sem acento dentro de string e de texto solto no
 * JSX. Ela nao pretende saber portugues - ela conhece a lista de palavras que
 * a interface usa, que e curta e cresce junto com o catalogo.
 */

/** Palavra sem acento => como ela se escreve. */
const MISSING: Record<string, string> = {
  Nao: "Não",
  nao: "não",
  possivel: "possível",
  grafico: "gráfico",
  graficos: "gráficos",
  pagina: "página",
  paginas: "páginas",
  Navegacao: "Navegação",
  navegacao: "navegação",
  acao: "ação",
  acoes: "ações",
  opcao: "opção",
  opcoes: "opções",
  proxima: "próxima",
  ultima: "última",
  periodo: "período",
  numero: "número",
  code: "código",
  voce: "você",
  selecao: "seleção",
  atencao: "atenção",
};

/** Rotulo em atributo, texto solto entre tags do JSX, e o que a CLI escreve. */
const LABEL =
  /(?:aria-label|title|placeholder|emptyMessage|errorMessage|label|aria-valuetext)\s*[=:]\s*"([^"]+)"|>\s*([A-Z][^<>{}\n]{4,}?)\s*<|console\.(?:log|error|warn)\(\s*[`"]([^`"]+)[`"]/g;

async function labelsOf(file: string) {
  const code = await Bun.file(file).text();
  // Comentario fora: a prosa do codigo segue a convencao do repo.
  const withoutComments = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return [...withoutComments.matchAll(LABEL)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
}

test("todo texto que a biblioteca escreve na tela sai acentuado", async () => {
  const misses: string[] = [];

  for await (const file of new Glob("src/**/*.{ts,tsx}").scan(".")) {
    for (const label of await labelsOf(file)) {
      for (const [wrong, right] of Object.entries(MISSING)) {
        if (new RegExp(`\\b${wrong}\\b`).test(label)) {
          misses.push(`${file}: "${label}" -> ${wrong} deveria ser ${right}`);
        }
      }
    }
  }

  expect(misses).toEqual([]);
});
