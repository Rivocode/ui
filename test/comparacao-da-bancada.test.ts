import { describe, expect, test } from "bun:test";

import {
  compareAccessibility,
  compareShots,
  type ShotInput,
  type Signatures,
} from "../scripts/comparacao-da-bancada";

const pages = Array.from({ length: 20 }, (_, index) => `pagina-${index}`);

describe("acessibilidade", () => {
  test("problema a mais que a base e regressao, e a menos so e relatado", () => {
    const verdict = compareAccessibility(
      { pages, problems: { "dados | axe color-contrast": 2, "novas | reflow a 320px": 1 } },
      { pages, problems: { "dados | axe color-contrast": 3, "ia | alvo button \"Enviar\"": 1 } },
      15,
    );

    expect(verdict.worse).toEqual([
      { key: "dados | axe color-contrast", before: 2, after: 3 },
      { key: "ia | alvo button \"Enviar\"", before: 0, after: 1 },
    ]);
    expect(verdict.better).toEqual([{ key: "novas | reflow a 320px", before: 1, after: 0 }]);
    expect(verdict.problems).toEqual([]);
  });

  test("a mesma divida dos dois lados passa", () => {
    const same = { pages, problems: { "dados | axe color-contrast": 2 } };
    const verdict = compareAccessibility(same, same, 15);

    expect(verdict.worse).toEqual([]);
    expect(verdict.problems).toEqual([]);
  });

  test("cabeca que auditou menos paginas que o piso reprova, mesmo sem problema nenhum", () => {
    const verdict = compareAccessibility(
      { pages, problems: { "dados | axe color-contrast": 2 } },
      { pages: [], problems: {} },
      15,
    );

    expect(verdict.worse).toEqual([]);
    expect(verdict.problems).toHaveLength(1);
    expect(verdict.problems[0]).toContain("auditou 0 pagina(s)");
  });
});

function shots(names: string[], value: number): Signatures {
  return Object.fromEntries(names.map((name) => [name, Array.from({ length: 576 }, () => value)]));
}

const many = Array.from({ length: 40 }, (_, index) => `pagina-${index}`);

function input(overrides: Partial<ShotInput> = {}): ShotInput {
  return {
    base: { signatures: shots(many, 100), refused: [] },
    head: { signatures: shots(many, 100), refused: [] },
    committedBase: shots(many, 50),
    committedHead: shots(many, 50),
    ...overrides,
  };
}

describe("retratos", () => {
  test("nada mudou: compara todos e nao acusa", () => {
    const verdict = compareShots(input(), 30);

    expect(verdict.compared).toBe(40);
    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.problems).toEqual([]);
  });

  test("diferenca dentro do ruido nao conta", () => {
    const head = shots(many, 104);
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.unaccepted).toEqual([]);
  });

  test("retrato que mudou sem a assinatura comitada mudar e mudanca que ninguem viu", () => {
    const head = { ...shots(many, 100), "pagina-3": Array.from({ length: 576 }, () => 180) };
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.unaccepted).toEqual(["pagina-3 - 576 de 576 quadrados, pior 80"]);
    expect(verdict.accepted).toEqual([]);
  });

  test("a entrada comitada que mudou junto e o aceite", () => {
    const head = { ...shots(many, 100), "pagina-3": Array.from({ length: 576 }, () => 180) };
    const committedHead = { ...shots(many, 50), "pagina-3": Array.from({ length: 576 }, () => 51) };
    const verdict = compareShots(
      input({ head: { signatures: head, refused: [] }, committedHead }),
      30,
    );

    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.accepted).toEqual(["pagina-3 - 576 de 576 quadrados, pior 80"]);
  });

  test("moldura de secao com outro tamanho nao se compara quadrado a quadrado", () => {
    const name = "secao-controles-chave-rivocode-dark";
    const base = { ...shots(many, 100), [name]: [10, 4, 1, 2, 3, 4] };
    const head = { ...shots(many, 100), [name]: [12, 4, 1, 2, 3, 4, 5, 6, 7, 8] };
    const verdict = compareShots(
      input({ base: { signatures: base, refused: [] }, head: { signatures: head, refused: [] } }),
      30,
    );

    expect(verdict.unaccepted).toEqual([`${name} - a moldura foi de 10x4 para 12x4 celulas`]);
  });

  test("retrato que a cabeca nao tirou e perda, a menos que tenha saido da assinatura comitada", () => {
    const head = shots(many.slice(0, 38), 100);
    const committedHead = shots([...many.slice(0, 38), "pagina-38"], 50);
    const verdict = compareShots(
      input({ head: { signatures: head, refused: [] }, committedHead }),
      30,
    );

    expect(verdict.lost).toEqual(["pagina-38"]);
    expect(verdict.accepted).toEqual(["pagina-39 - saiu da vitrine e da assinatura comitada"]);
  });

  test("retrato novo nao tem base, e nao conta como comparado", () => {
    const head = { ...shots(many, 100), "pagina-nova": [1] };
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.fresh).toEqual(["pagina-nova"]);
    expect(verdict.compared).toBe(40);
  });

  test("comparar menos retratos que o piso reprova, mesmo sem diferenca", () => {
    const verdict = compareShots(
      input({
        base: { signatures: {}, refused: [] },
        head: { signatures: {}, refused: [] },
      }),
      30,
    );

    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.problems).toHaveLength(1);
    expect(verdict.problems[0]).toContain("0 retrato(s) comparado(s)");
  });
});
