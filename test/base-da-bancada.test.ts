import { describe, expect, test } from "bun:test";

import { acceptsOnPush, chooseBase, MARK } from "../scripts/base-da-bancada";
import { compareShots, type ShotReport, type Signatures } from "../scripts/comparacao-da-bancada";

const names = Array.from({ length: 40 }, (_, index) => `pagina-${index}`);
const FLOATING = ["flutuantes", "flutuantes-celular"];

function signatures(value: number, floating: number): Signatures {
  return Object.fromEntries([
    ...names.map((name) => [name, Array.from({ length: 576 }, () => value)]),
    ...FLOATING.map((name) => [name, Array.from({ length: 576 }, () => floating)]),
  ]);
}

const OLD_PORTALS = 100;
const NEW_PORTALS = 180;

const measured: Record<string, ShotReport> = {
  "p0": { signatures: signatures(100, OLD_PORTALS), refused: [] },
  "d3d619a": { signatures: signatures(100, NEW_PORTALS), refused: [] },
  "eeace31": { signatures: signatures(100, NEW_PORTALS), refused: [] },
  "07out": { signatures: signatures(100, NEW_PORTALS), refused: [] },
  "depois": { signatures: signatures(100, NEW_PORTALS), refused: [] },
};

const STALE = signatures(50, 50);
const ACCEPTED = signatures(50, 51);

const committed: Record<string, Signatures> = {
  "p0": STALE,
  "d3d619a": STALE,
  "eeace31": STALE,
  "07out": ACCEPTED,
  "depois": ACCEPTED,
};

const history = ["p0", "233193e", "d3d619a", "eeace31", "07out", "depois"];

function ancestorOf(head: string) {
  return (sha: string) => history.indexOf(sha) < history.indexOf(head);
}

function bench(head: string, base: string) {
  return compareShots(
    {
      base: measured[base]!,
      head: measured[head]!,
      committedBase: committed[base]!,
      committedHead: committed[head]!,
    },
    30,
  );
}

describe("o vermelho de 01/10 nao some no commit seguinte", () => {
  test("o push de 233193e com d3d619a mede contra p0 e acusa os flutuantes", () => {
    const base = chooseBase({ head: "d3d619a", before: "p0", green: ["p0"], isAncestor: ancestorOf("d3d619a") });

    expect(base.sha).toBe("p0");
    expect(bench("d3d619a", base.sha).unaccepted.map((line) => line.split(" ")[0])).toEqual(FLOATING);
  });

  test("com o commit anterior de base, eeace31 saia verde - o defeito reproduzido", () => {
    expect(bench("eeace31", "d3d619a").unaccepted).toEqual([]);
  });

  test("eeace31 mede contra a ultima bancada verde, p0, e reprova", () => {
    const base = chooseBase({
      head: "eeace31",
      before: "d3d619a",
      green: ["p0"],
      isAncestor: ancestorOf("eeace31"),
    });

    expect(base.sha).toBe("p0");
    expect(base.source).toBe("green");
    expect(base.sha).not.toBe("d3d619a");
    expect(bench("eeace31", base.sha).unaccepted.map((line) => line.split(" ")[0])).toEqual(FLOATING);
  });

  test("o commit que comita a assinatura aceita contra a mesma base, e vira a base seguinte", () => {
    const base = chooseBase({ head: "07out", before: "eeace31", green: ["p0"], isAncestor: ancestorOf("07out") });
    const verdict = bench("07out", base.sha);

    expect(base.sha).toBe("p0");
    expect(verdict.unaccepted).toEqual([]);
    expect(verdict.accepted.map((line) => line.split(" ")[0])).toEqual(FLOATING);

    const next = chooseBase({
      head: "depois",
      before: "07out",
      green: ["07out", "p0"],
      isAncestor: ancestorOf("depois"),
    });
    expect(next.sha).toBe("07out");
    expect(bench("depois", next.sha).unaccepted).toEqual([]);
  });
});

describe("escolha da base", () => {
  test("pula a propria cabeca e o verde que nao e ancestral", () => {
    const base = chooseBase({
      head: "eeace31",
      before: "d3d619a",
      green: ["eeace31", "ramo-reescrito", "p0"],
      isAncestor: (sha) => sha === "p0",
    });

    expect(base.sha).toBe("p0");
  });

  test("bancada que nunca ficou verde cai no commit anterior, e diz por que", () => {
    const base = chooseBase({ head: "b", before: "a", green: [], isAncestor: () => true });

    expect(base.sha).toBe("a");
    expect(base.source).toBe("before");
    expect(base.reason).toContain("nunca ficou verde");
  });

  test("historia reescrita cai no commit anterior com o motivo proprio", () => {
    const base = chooseBase({ head: "b", before: "a", green: ["x"], isAncestor: () => false });

    expect(base.sha).toBe("a");
    expect(base.reason).toContain("reescrita");
  });

  test("sem verde e sem commit anterior nao ha contra o que medir", () => {
    expect(() =>
      chooseBase({ head: "b", before: "0000000000000000000000000000000000000000", green: [], isAncestor: () => true }),
    ).toThrow("nao ha contra o que medir");
  });
});

describe("aceite no push", () => {
  test("a marca no assunto aceita", () => {
    expect(acceptsOnPush(`chore: o retrato dos flutuantes muda so no linux ${MARK}`, [])).toBe(true);
  });

  test("a marca no corpo nao aceita", () => {
    expect(acceptsOnPush(`docs: a valvula da bancada\n\nA marca ${MARK} aceita.`, [])).toBe(false);
  });

  test("a etiqueta do PR que trouxe a cabeca aceita", () => {
    expect(acceptsOnPush("feat: a peca nova", ["retrato-aceito"])).toBe(true);
    expect(acceptsOnPush("feat: a peca nova", ["outra"])).toBe(false);
  });
});
