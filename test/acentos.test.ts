import { expect, test } from "bun:test";
import { Glob } from "bun";

import { WORDS } from "../scripts/acentuar";

/*
 * O texto que a biblioteca escreve na tela e o unico portugues do pacote que
 * o cliente le. Comentario e JSDoc seguem sem acento por escolha do repo, e
 * nao entram aqui: o que entra e rotulo, titulo, aviso e mensagem de erro.
 *
 * ## O vocabulario nao mora mais aqui
 *
 * Ele era uma lista de vinte e duas palavras dentro de um repositorio que ja
 * mantinha uma de duzentas e oitenta e uma, em `scripts/acentuar.ts`, para
 * acentuar a documentacao. Duas listas para a mesma pergunta significam que a
 * menor esta sempre errada, e estava: "Navegacao" chegou a interface porque a
 * palavra so existia na lista grande. Agora e uma lista, e crescer para a doc
 * e crescer para a tela.
 *
 * ## Onde ela olha
 *
 * A primeira versao lia `atributo="texto"` e o texto solto do JSX, e perdia as
 * duas formas mais usadas do catalogo:
 *
 *   - `aria-label={`Enviando ${name}`}` - valor entre chaves, que ela nem
 *     tentava abrir. Dois rotulos sairam sem acento por aqui;
 *   - `<span>Passo {n} de {total}</span>` - texto de JSX COM interpolacao. O
 *     recorte antigo proibia chave no meio, entao a frase inteira sumia. Foi
 *     assim que "Step {n} de {total}" ficou na tela.
 *
 * Agora o valor entre chaves e aberto e as strings de dentro dele sao lidas, e
 * o texto do JSX aceita `{...}` no meio - a interpolacao vira espaco, e o que
 * sobra e conferido palavra por palavra.
 */

/**
 * Os atributos que viram texto na tela.
 *
 * Alem dos nomeados, todo `algumaCoisaLabel`, `...Message`, `...Text` e
 * `...Title`: e como o catalogo batiza rotulo configuravel, e a lista fechada
 * ficava para tras a cada peca nova.
 */
const ATTRIBUTE =
  /(?:aria-label|aria-valuetext|aria-description|title|placeholder|alt|summary|caption|label|description|[a-zA-Z]+(?:Label|Message|Text|Title))\s*[=:]\s*/g;

/**
 * Texto solto entre duas tags, interpolacao inclusive.
 *
 * O `>` tem que fechar uma tag de verdade - por isso a exigencia do caractere
 * antes dele. Sem ela o `=>` de uma seta e o `>` de uma comparacao abriam um
 * "texto" que ia ate o proximo `<` do arquivo, e o codigo no meio virava
 * acusacao: `variant === "area" ?` foi denunciado por causa de `area`.
 *
 * Pelo mesmo motivo o texto nao pode conter `=`, `;`, `(`, `)` nem aspas:
 * frase na tela nao tem nenhum dos cinco, e codigo tem todos.
 */
const JSX_TEXT = /[\w"'}/\]]>\s*((?:[^<>{}"'=;()]|\{[^{}]*\})*?)\s*</g;

const CONSOLE = /console\.(?:log|error|warn)\(\s*[`"]([^`"]+)[`"]/g;

/** O corpo de um `{...}`, com as chaves de dentro contadas. */
function braced(code: string, from: number) {
  let depth = 0;
  for (let at = from; at < code.length; at++) {
    if (code[at] === "{") depth += 1;
    else if (code[at] === "}") {
      depth -= 1;
      if (depth === 0) return code.slice(from + 1, at);
    }
  }
  return "";
}

async function labelsOf(file: string) {
  const code = await Bun.file(file).text();
  // Comentario fora: a prosa do codigo segue a convencao do repo.
  const clean = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

  const labels: string[] = [];

  for (const hit of clean.matchAll(ATTRIBUTE)) {
    const at = hit.index! + hit[0].length;
    const opener = clean[at];

    if (opener === '"' || opener === "'" || opener === "`") {
      const end = clean.indexOf(opener, at + 1);
      if (end > 0) labels.push(clean.slice(at + 1, end));
      continue;
    }

    // `aria-label={visible ? "Esconder" : "Mostrar"}`: o que interessa sao as
    // strings de dentro, e nao a expressao que escolhe entre elas.
    if (opener === "{") {
      for (const literal of braced(clean, at).matchAll(/(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g)) {
        labels.push(literal[2]!);
      }
    }
  }

  for (const hit of clean.matchAll(JSX_TEXT)) labels.push(hit[1]!);
  for (const hit of clean.matchAll(CONSOLE)) labels.push(hit[1]!);

  return labels.filter((label) => /[A-Za-zÀ-ÿ]{3}/.test(label));
}

test("todo texto que a biblioteca escreve na tela sai acentuado", async () => {
  const misses: string[] = [];

  for await (const file of new Glob("src/**/*.{ts,tsx}").scan(".")) {
    for (const label of await labelsOf(file)) {
      // A interpolacao nao e texto: `Passo {n} de {total}` vale pelo `Passo` e
      // pelo `de`, e o que esta dentro das chaves e problema de quem passa.
      const written = label.replace(/\$\{[^}]*\}/g, " ").replace(/\{[^}]*\}/g, " ");

      for (const word of written.matchAll(/[A-Za-zÀ-ÿ]+/g)) {
        const right = WORDS[word[0]!.toLowerCase()];
        if (right && right !== word[0]!.toLowerCase()) {
          misses.push(`${file}: "${label.trim()}" -> ${word[0]} deveria ser ${right}`);
        }
      }
    }
  }

  // Uma linha por acusacao, e nao um numero: quem le a falha precisa saber
  // qual palavra regravar, em qual arquivo, sem abrir nenhum deles.
  expect([...new Set(misses)]).toEqual([]);
});
