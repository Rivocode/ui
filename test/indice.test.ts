import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";

import { indexLine, partNote } from "../apps/docs/src/agent-address";
import { findParent } from "../apps/docs/src/parts";

/*
 * O indice que um agente le.
 *
 * Uma parte nao e uma peca. CardHeader, DialogFooter e SelectItem so existem
 * dentro de outra coisa, e lista-los no mesmo nivel faz o agente contar peca
 * demais, gastar contexto abrindo CardTitle.md como se fosse independente, e
 * perder a unica informacao que importa sobre ela.
 */

const names = readdirSync(".design-sync/docs")
  .filter((arquivo) => arquivo.endsWith(".md"))
  .map((arquivo) => arquivo.replace(/\.md$/, ""));

const pieces = names.filter((nome) => !findParent(nome, names));

test("a skill diz o mesmo numero de pecas que o catalogo tem", async () => {
  // O numero na skill e a primeira coisa que um agente le, e era o unico
  // lugar do sistema onde ele estava certo enquanto o indice contava tudo. Ele
  // aparece em dois arquivos, e os dois envelhecem juntos.
  const skill = await Bun.file(".claude/skills/rivocode-ui/SKILL.md").text();
  const choice = await Bun.file(
    ".claude/skills/rivocode-ui/reference/components.md",
  ).text();

  expect(/S[aã]o (\d+)/.exec(skill)?.[1]).toBe(String(pieces.length));
  expect(/tem (\d+) peças/.exec(choice)?.[1]).toBe(String(pieces.length));
});

test("parte e peca nao se confundem na contagem", () => {
  expect(findParent("CardHeader", names)).toBe("Card");
  expect(findParent("Card", names)).toBeNull();
  // DataTable nao vira parte de Table: o nome nao comeca por ele.
  expect(findParent("DataTable", names)).toBeNull();
  expect(pieces.length).toBeLessThan(names.length);
});

/*
 * Estes tres mediam o conteudo de `apps/docs/dist/`, e por isso passavam na
 * maquina que acabara de buildar e falhavam no CI, onde o `check` roda antes de
 * qualquer build. Guarda que depende de artefato nao e guarda: e cara ou coroa
 * com aparencia de rigor. Agora medem a funcao que escreve o endereco, que e o
 * que eles sempre quiseram dizer.
 */

const CARD = { name: "Card", slug: "card" };

test("a parte aponta para dentro da pagina de quem a monta", () => {
  expect(indexLine("CardHeader", "card-header", CARD)).toBe(
    "  - [CardHeader](/componentes/card.md#cardheader) — parte de Card",
  );
});

test("a peca continua com endereco proprio, e sem indentacao", () => {
  expect(indexLine("Card", "card")).toBe("- [Card](/componentes/card.md)");
});

test("o endereco antigo da parte responde com o caminho, e nao com o vazio", () => {
  // Agente que guardou o link nao pode encontrar o vazio.
  const note = partNote("CardHeader", CARD);

  expect(note).toContain("é parte de Card");
  expect(note).toContain("/componentes/card.md#cardheader");
});

test("a ancora que o endereco promete e a que a pagina escreve", async () => {
  // O `###` do nome da parte e o que vira `#cardheader` no markdown. Se o
  // renderizador mudar o nivel do titulo, o link para de resolver - e nada
  // reclamaria, porque link quebrado dentro de um .md nao falha build nenhum.
  const { renderDoc } = await import("../apps/docs/src/render-md");
  const page = renderDoc({
    name: "Card",
    body: "O cartao.",
    importPath: "@rivocode/ui",
    props: [],
    forwardsRootProps: true,
    stories: [],
    parts: [{ name: "CardHeader", body: "O topo.", props: [] }],
    related: [],
  });

  expect(page).toContain("### CardHeader");
  expect(partNote("CardHeader", CARD)).toContain("#cardheader");
});
