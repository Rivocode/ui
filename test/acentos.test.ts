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
const FALTANDO: Record<string, string> = {
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
  codigo: "código",
  voce: "você",
  selecao: "seleção",
  atencao: "atenção",
};

/** Rotulo em atributo, texto solto entre tags do JSX, e o que a CLI escreve. */
const ROTULO =
  /(?:aria-label|title|placeholder|emptyMessage|errorMessage|label|aria-valuetext)\s*[=:]\s*"([^"]+)"|>\s*([A-Z][^<>{}\n]{4,}?)\s*<|console\.(?:log|error|warn)\(\s*[`"]([^`"]+)[`"]/g;

async function rotulosDe(arquivo: string) {
  const codigo = await Bun.file(arquivo).text();
  // Comentario fora: a prosa do codigo segue a convencao do repo.
  const semComentario = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
  return [...semComentario.matchAll(ROTULO)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
}

test("todo texto que a biblioteca escreve na tela sai acentuado", async () => {
  const faltas: string[] = [];

  for await (const arquivo of new Glob("src/**/*.{ts,tsx}").scan(".")) {
    for (const rotulo of await rotulosDe(arquivo)) {
      for (const [errado, certo] of Object.entries(FALTANDO)) {
        if (new RegExp(`\\b${errado}\\b`).test(rotulo)) {
          faltas.push(`${arquivo}: "${rotulo}" -> ${errado} deveria ser ${certo}`);
        }
      }
    }
  }

  expect(faltas).toEqual([]);
});
