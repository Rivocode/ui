import { expect, test } from "bun:test";
import { readdirSync } from "node:fs";

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

test("a parte aponta para dentro da pagina de quem a monta", async () => {
  // Uma parte nao tem exemplo proprio porque nao ha o que exemplificar sem a
  // peca em volta - e a pagina solta dela dizia isso em voz alta, gastando uma
  // busca do agente para nao acrescentar nada. Agora o endereco leva a ancora
  // dentro da peca principal, onde a parte tem prosa, props e o exemplo junto.
  const index = await Bun.file("apps/docs/dist/llms.txt").text();

  expect(index).toContain("[CardHeader](/componentes/card.md#cardheader) — parte de Card");
  expect(index).not.toContain("[CardHeader](/componentes/card-header.md)");
});

test("o endereco antigo da parte continua respondendo, com o caminho", async () => {
  // Agente que guardou o link nao pode encontrar o vazio.
  const note = await Bun.file("apps/docs/dist/componentes/card-header.md").text();

  expect(note).toContain("é parte de Card");
  expect(note).toContain("/componentes/card.md#cardheader");
});

test("a ancora existe de verdade na pagina de quem monta", async () => {
  const page = await Bun.file("apps/docs/dist/componentes/card.md").text();

  expect(page).toContain("### CardHeader");
});
