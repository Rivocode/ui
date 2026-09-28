import { describe, expect, test } from "bun:test";

import {
  compareAccessibility,
  compareShots,
  type ShotInput,
  type Signatures,
} from "../scripts/bench-comparison";

const pages = Array.from({ length: 20 }, (_, index) => `pagina-${index}`);

describe("accessibility", () => {
  test("a problem more than the base is a regression, and one fewer is only reported", () => {
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

  test("the same debt on both sides passes", () => {
    const same = { pages, problems: { "dados | axe color-contrast": 2 } };
    const verdict = compareAccessibility(same, same, 15);

    expect(verdict.worse).toEqual([]);
    expect(verdict.problems).toEqual([]);
  });

  test("a head that audited fewer pages than the floor fails, even with no problem at all", () => {
    const verdict = compareAccessibility(
      { pages, problems: { "dados | axe color-contrast": 2 } },
      { pages: [], problems: {} },
      15,
    );

    expect(verdict.worse).toEqual([]);
    expect(verdict.problems).toHaveLength(1);
    expect(verdict.problems[0]).toContain("audited 0 page(s)");
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

describe("shots", () => {
  test("nothing changed: compares all and reports nothing", () => {
    const verdict = compareShots(input(), 30);

    expect(verdict.compared).toBe(40);
    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.problems).toEqual([]);
  });

  test("a difference within the noise does not count", () => {
    const head = shots(many, 104);
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.unaccepted).toEqual([]);
  });

  test("a shot that changed without the committed signature changing is a change nobody saw", () => {
    const head = { ...shots(many, 100), "pagina-3": Array.from({ length: 576 }, () => 180) };
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.unaccepted).toEqual(["pagina-3 - 576 of 576 squares, worst 80"]);
    expect(verdict.accepted).toEqual([]);
  });

  test("the committed entry that changed along with it is the acceptance", () => {
    const head = { ...shots(many, 100), "pagina-3": Array.from({ length: 576 }, () => 180) };
    const committedHead = { ...shots(many, 50), "pagina-3": Array.from({ length: 576 }, () => 51) };
    const verdict = compareShots(
      input({ head: { signatures: head, refused: [] }, committedHead }),
      30,
    );

    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.accepted).toEqual(["pagina-3 - 576 of 576 squares, worst 80"]);
  });

  test("a section frame with another size is not compared square by square", () => {
    const name = "secao-controles-chave-rivocode-dark";
    const base = { ...shots(many, 100), [name]: [10, 4, 1, 2, 3, 4] };
    const head = { ...shots(many, 100), [name]: [12, 4, 1, 2, 3, 4, 5, 6, 7, 8] };
    const verdict = compareShots(
      input({ base: { signatures: base, refused: [] }, head: { signatures: head, refused: [] } }),
      30,
    );

    expect(verdict.unaccepted).toEqual([`${name} - the frame went from 10x4 to 12x4 cells`]);
  });

  test("a shot the head did not take is a loss, unless it left the committed signature", () => {
    const head = shots(many.slice(0, 38), 100);
    const committedHead = shots([...many.slice(0, 38), "pagina-38"], 50);
    const verdict = compareShots(
      input({ head: { signatures: head, refused: [] }, committedHead }),
      30,
    );

    expect(verdict.lost).toEqual(["pagina-38"]);
    expect(verdict.accepted).toEqual(["pagina-39 - left the showcase and the committed signature"]);
  });

  test("a new shot has no base, and does not count as compared", () => {
    const head = { ...shots(many, 100), "pagina-nova": [1] };
    const verdict = compareShots(input({ head: { signatures: head, refused: [] } }), 30);

    expect(verdict.fresh).toEqual(["pagina-nova"]);
    expect(verdict.compared).toBe(40);
  });

  test("comparing fewer shots than the floor fails, even without a difference", () => {
    const verdict = compareShots(
      input({
        base: { signatures: {}, refused: [] },
        head: { signatures: {}, refused: [] },
      }),
      30,
    );

    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.problems).toHaveLength(1);
    expect(verdict.problems[0]).toContain("0 portrait(s) compared");
  });
});
