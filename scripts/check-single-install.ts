/**
 * Guarda de instalacao duplicada: uma segunda copia do React na arvore.
 *
 * A raiz declara `workspaces: ["apps/*"]`, e `native/` nao esta la. Quem roda
 * `bun install` dentro do pacote nativo - o gesto obvio de quem vai mexer nele
 * - nao ganha um link para a copia da raiz: ganha uma segunda copia de
 * verdade, com o mesmo numero de versao.
 *
 * O estrago nao aparece onde foi feito. O `bun test` da raiz carrega as duas
 * no mesmo processo, e noventa e oito testes que ninguem tocou passam a falhar
 * com "Invalid hook call ... more than one copy of React" - uma mensagem que
 * manda procurar erro de hook em codigo que esta certo. A CI nunca ve, porque
 * so instala na raiz, entao o verde de la nao ajuda a entender o vermelho daqui.
 *
 * Nada legitimo precisa dessa pasta: o `check:native:types` tipa o pacote pelo
 * `examples/native`, e passa sem ela.
 */
import { existsSync } from "node:fs";

/** Pasta e o rastro que ela deixa, para o conserto sair completo. */
const STRAYS = ["native/node_modules", "native/bun.lock"];

const found = STRAYS.filter((path) => existsSync(path));

if (found.length > 0) {
  console.error(`Instalacao solta dentro de native/: ${found.join(", ")}`);
  console.error(
    "\n`native/` nao e workspace, entao um `bun install` la dentro cria uma" +
      "\nsegunda copia do React - e o `bun test` da raiz quebra em massa com" +
      '\n"Invalid hook call", apontando para codigo que esta certo.' +
      `\n\nO conserto:\n  rm -rf ${found.join(" ")}` +
      "\n\nPara mexer no pacote nativo, o app de exemplo ja tem tudo instalado:" +
      "\n  bun install --cwd examples/native",
  );
  process.exit(1);
}

console.log("Uma copia do React so: nenhuma instalacao solta em native/.");
