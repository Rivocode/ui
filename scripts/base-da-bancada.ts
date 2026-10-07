/**
 * Escolhe contra QUE commit a bancada mede a cabeca, no push da `main`.
 *
 * Ate 07/10/2026 a base do push era o `github.event.before`: o que a `main`
 * era antes do empurrao. E o vermelho sumia sozinho. Em 01/10 o 233193e (o
 * conteiner dos portais no primeiro render) subiu junto com o d3d619a, e a
 * bancada do d3d619a acusou "mudou sem aceite: flutuantes, flutuantes-celular".
 * O commit seguinte, eeace31, saiu VERDE: a base dele era o d3d619a, que ja
 * tinha a mudanca, entao base e cabeca fotografaram igual. O
 * `demo/assinaturas.json` ficou velho na `main` por seis dias, ate alguem
 * rodar `bun run shot && bun run visual` na mao em 07/10.
 *
 * A comparacao diferencial esta certa - mede os dois lados no mesmo runner, e
 * a plataforma cancela. O defeito era a escolha do lado de la: comparar com o
 * commit anterior pergunta "o que ESTE empurrao mudou", e o que se quer saber
 * e "o que mudou desde a ultima vez que a bancada concordou". Entao a base do
 * push passa a ser o commit da ULTIMA bancada verde da `main`, e nao o
 * anterior. Enquanto ninguem aceita, toda bancada seguinte compara contra o
 * mesmo ponto verde e ve a mesma mudanca; quando alguem comita a assinatura,
 * a entrada muda entre aquela base e a cabeca, o aceite vale, a corrida fica
 * verde e vira a base nova.
 *
 * As alternativas que perderam:
 *
 * - Comparar a cabeca com o NUMERO que a ultima bancada verde gravou, guardado
 *   como artefato do Actions. Mede em runner e minuto diferentes, e o GitHub
 *   troca o Chrome do runner sem avisar: e a referencia absoluta de volta, com
 *   prazo de validade de 90 dias por cima.
 * - Carregar a divida da corrida vermelha anterior. Depende da ORDEM das
 *   corridas - dois empurroes seguidos correm em paralelo, e o segundo pode
 *   procurar a divida antes de o primeiro termina-la.
 * - Assinatura linux comitada: envelhece a cada Chrome novo do runner, o
 *   mesmo motivo pelo qual a bancada nasceu diferencial.
 *
 * Com a base no ultimo verde, corridas em paralelo so deixam a base mais
 * velha, e base mais velha e mais conservadora, nunca mais permissiva.
 *
 * ## A valvula no push
 *
 * No PR a etiqueta `retrato-aceito` aceita diferenca que so existe no linux.
 * Com o vermelho persistente, ela precisa valer tambem no push, senao a
 * `main` ficaria vermelha para sempre depois do merge: o push aceita quando o
 * PR que trouxe a cabeca tem a etiqueta, ou quando o ASSUNTO do commit da
 * cabeca tem a marca `[retrato-aceito]` - so a primeira linha, pelo mesmo
 * motivo do `[no-release]` em `scripts/decisao-de-release.ts`. Um commit vazio
 * com a marca e o jeito de aceitar depois do fato, e fica no `git log`.
 *
 * ## Medir e condicao
 *
 * Se a lista de corridas verdes nao vier, a escolha morre com codigo 1: cair
 * no `before` por falta de resposta e exatamente o defeito que este arquivo
 * conserta. Lista VAZIA e outra coisa - a bancada nunca ficou verde na `main`
 * - e so ai o `before` vale, dito no resumo.
 */
import { appendFileSync } from "node:fs";

export const MARK = "[retrato-aceito]";

export const LABEL = "retrato-aceito";

const NO_COMMIT = /^0+$/;

export type BaseFacts = {
  head: string;
  before: string;
  green: string[];
  isAncestor: (sha: string) => boolean;
};

export type BaseChoice = {
  sha: string;
  source: "green" | "before";
  reason: string;
};

export function chooseBase(facts: BaseFacts): BaseChoice {
  const green = facts.green.find((sha) => sha !== facts.head && facts.isAncestor(sha));
  if (green) {
    return {
      sha: green,
      source: "green",
      reason:
        `a base e ${green.slice(0, 7)}, o commit da ultima bancada verde da main.` +
        " Mudanca de retrato sem aceite continua acusada ate alguem aceitar.",
    };
  }

  if (!facts.before || NO_COMMIT.test(facts.before)) {
    throw new Error(
      "nao ha bancada verde ancestral da cabeca e o push nao tem commit anterior: nao ha contra o que medir",
    );
  }

  const why =
    facts.green.length === 0
      ? "a bancada nunca ficou verde na main"
      : "nenhuma bancada verde e ancestral da cabeca - a historia da main foi reescrita";
  return {
    sha: facts.before,
    source: "before",
    reason: `a base e ${facts.before.slice(0, 7)}, o commit anterior ao push, porque ${why}.`,
  };
}

export function acceptsOnPush(message: string, labels: string[]): boolean {
  const subject = message.split("\n", 1)[0] ?? "";
  return subject.includes(MARK) || labels.includes(LABEL);
}

async function measured(what: string, command: string[]): Promise<string> {
  const child = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [text, error] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  await child.exited;
  if (child.exitCode !== 0) {
    console.error(
      `Nao deu para medir ${what}: \`${command.join(" ")}\` saiu com ${child.exitCode}.\n\n` +
        "A bancada nao escolhe base sem esta medida: cair no commit anterior por falta de\n" +
        "resposta e o defeito que deixou o vermelho de 01/10 sumir no commit seguinte.\n\n" +
        error.trim(),
    );
    process.exit(1);
  }
  return text;
}

async function isAncestor(sha: string, head: string): Promise<boolean> {
  const child = Bun.spawn(["git", "merge-base", "--is-ancestor", sha, head], {
    stdout: "ignore",
    stderr: "ignore",
  });
  await child.exited;
  return child.exitCode === 0;
}

if (import.meta.main) {
  const head = process.env.GITHUB_SHA;
  const before = process.env.PUSH_BEFORE ?? "";
  const repository = process.env.GITHUB_REPOSITORY;
  if (!head || !repository) {
    console.error("Faltou GITHUB_SHA ou GITHUB_REPOSITORY: este script roda no push da bancada.");
    process.exit(1);
  }

  const runs = JSON.parse(
    await measured("as bancadas verdes da main", [
      "gh",
      "run",
      "list",
      "--repo",
      repository,
      "--workflow",
      "bancada.yml",
      "--branch",
      "main",
      "--event",
      "push",
      "--status",
      "success",
      "--limit",
      "100",
      "--json",
      "headSha",
    ]),
  ) as { headSha: string }[];

  const green = [...new Set(runs.map((run) => run.headSha))];
  const ancestry = new Map<string, boolean>();
  for (const sha of green) ancestry.set(sha, await isAncestor(sha, head));

  let choice: BaseChoice;
  try {
    choice = chooseBase({ head, before, green, isAncestor: (sha) => ancestry.get(sha) ?? false });
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  const message = await measured("a mensagem da cabeca", ["git", "log", "-1", "--format=%B", head]);
  const pulls = JSON.parse(
    await measured("o PR da cabeca", [
      "gh",
      "api",
      `repos/${repository}/commits/${head}/pulls`,
    ]),
  ) as { labels?: { name: string }[] }[];
  const labels = pulls.flatMap((pull) => (pull.labels ?? []).map((label) => label.name));
  const accepted = acceptsOnPush(message, labels);

  const report = [
    "## Bancada: escolha da base",
    "",
    `- ${choice.reason}`,
    accepted
      ? `- a cabeca aceita mudanca de retrato: marca \`${MARK}\` no assunto ou etiqueta \`${LABEL}\` no PR.`
      : "- a cabeca nao traz aceite de retrato.",
    "",
  ].join("\n");
  console.log(report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  if (process.env.GITHUB_ENV) {
    appendFileSync(process.env.GITHUB_ENV, `BASE_SHA=${choice.sha}\nACCEPTED=${accepted}\n`);
  }
}
