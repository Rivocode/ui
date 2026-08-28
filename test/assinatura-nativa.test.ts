import { describe, expect, test } from "bun:test";

import {
  type Catalog,
  literals,
  type Signature,
  SIGNATURES,
  sizeGone,
  validate,
  variantGaps,
} from "../scripts/assinatura-nativa";

const web: Catalog = {
  Meter: {
    props: [
      { name: "value", type: "number", required: true },
      { name: "format", type: "Format", required: false },
      { name: "label", type: "ReactNode", required: false },
      { name: "size", type: '"sm" | "md"', required: false },
    ],
  },
  Spinner: {
    props: [{ name: "size", type: '"sm" | "md" | "lg"', required: false }],
  },
};

const native: Catalog = {
  Meter: {
    props: [
      { name: "value", type: "number", required: true },
      { name: "label", type: "string", required: true },
      { name: "valueLabel", type: "string", required: false },
    ],
  },
  Spinner: {
    props: [{ name: "size", type: '"small" | "large"', required: false }],
  },
};

/** Sem o `Spinner`, cuja variante divergente e o assunto do bloco de varredura. */
const soMeter = (catalog: Catalog): Catalog => ({ Meter: catalog.Meter! });

const only = (rows: Signature["rows"], piece = "Meter", nativePiece?: string) =>
  validate(
    { [piece]: { ...(nativePiece ? { nativePiece } : {}), rows } },
    soMeter(web),
    soMeter(native),
  );

describe("a tabela de assinatura so passa quando descreve o codigo", () => {
  test("a linha certa passa", () => {
    expect(
      only([{ web: "format", native: "valueLabel", note: "o texto vai pronto" }]),
    ).toHaveLength(0);
  });

  test("prop que nao existe no web e acusada", () => {
    const problems = only([{ web: "formato", native: "valueLabel", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("nao tem a prop `formato` no web");
  });

  test("prop que nao existe no nativo e acusada", () => {
    const problems = only([{ web: "format", native: "valorEscrito", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("nao tem a prop `valorEscrito` no nativo");
  });

  test("linha que diz `so no web` sobre prop que o nativo TEM e acusada", () => {
    const problems = only([{ web: "value", native: null, note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("TEM essa prop");
  });

  test("renomeacao com as duas props vivas no nativo e acusada", () => {
    const problems = only([{ web: "value", native: "valueLabel", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("tem as DUAS");
  });

  test("mesmo nome com a MESMA assinatura dos dois lados e acusado", () => {
    const problems = only([{ web: "value", native: "value", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("MESMA assinatura");
  });

  test("mesmo nome com obrigatoriedade diferente passa", () => {
    expect(only([{ web: "label", native: "label", note: "vira obrigatoria" }])).toHaveLength(0);
  });

  test("peca que nao esta no catalogo do nativo e acusada", () => {
    const problems = only([{ web: "format", native: null, note: "x" }], "Meter", "Medidor");
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("nao esta no catalogo de la");
  });

  test("nota com quebra de linha e acusada, porque nota e celula de tabela", () => {
    const problems = only([{ web: "format", native: "valueLabel", note: "uma\nduas" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("quebra de linha");
  });

  test("linha a mao repetindo a frase derivada de `size` e acusada", () => {
    const problems = only([{ web: "size", native: null, note: "uma altura so" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("frase derivada");
  });

  test("variante que existe de um lado so sem linha e acusada", () => {
    const problems = validate({}, web, native);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("Spinner.size");
    expect(problems[0]).toContain("variante que existe de um lado so");
  });
});

describe("o que a guarda deriva sozinha", () => {
  test("`literals` so responde para uniao de literais", () => {
    expect([...literals('"sm" | "md" | undefined')!]).toEqual(['"sm"', '"md"']);
    expect(literals("string")).toBeUndefined();
    expect(literals("number | undefined")).toBeUndefined();
  });

  test("`variantGaps` acha a variante que so um lado tem", () => {
    const gaps = variantGaps(web, native);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.piece).toBe("Spinner");
    expect(gaps[0]!.onlyWeb).toEqual(['"lg"', '"md"', '"sm"']);
    expect(gaps[0]!.onlyNative).toEqual(['"large"', '"small"']);
  });

  test("`sizeGone` acha quem perde `size` e ignora quem mantem", () => {
    expect(sizeGone(web, native)).toEqual(["Meter"]);
  });
});

describe("a tabela publicada", () => {
  test("descreve o codigo de verdade dos dois pacotes", async () => {
    const real = (await Bun.file("apps/docs/src/component-props.json").json()) as Catalog;
    const realNative = (await Bun.file("apps/docs/src/native-props.json").json()) as Catalog;

    expect(Object.keys(real).length).toBeGreaterThan(150);
    expect(Object.keys(realNative).length).toBeGreaterThan(60);
    expect(validate(SIGNATURES, real, realNative)).toEqual([]);
  });

  test("cobre os seis casos que custaram a tarde de quem portou a tela", () => {
    const cases: [string, string | null, string | null][] = [
      ["SearchInput", null, "onValueChange"],
      ["MaskedInput", "mask", "mask"],
      ["Timeline", null, "items"],
      ["Sparkline", "variant", "variant"],
      ["Popconfirm", "onConfirm", "onAction"],
      ["Meter", "format", "valueLabel"],
    ];

    for (const [piece, from, to] of cases) {
      const rows = SIGNATURES[piece]?.rows ?? [];
      expect(rows.some((row) => row.web === from && row.native === to)).toBe(true);
    }
  });
});
