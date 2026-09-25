import { describe, expect, test } from "bun:test";

import {
  type Catalog,
  literals,
  parts,
  type Signature,
  SIGNATURES,
  sizeGone,
  slotGaps,
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

describe("o classNames que nao atravessa inteiro", () => {
  const slotWeb: Catalog = {
    Checkbox: {
      props: [
        {
          name: "classNames",
          type: 'Partial<Record<"box" | "indicator" | "label", string>>',
          required: false,
        },
      ],
    },
    Switch: {
      props: [
        { name: "classNames", type: 'Partial<Record<"label" | "thumb", string>>', required: false },
      ],
    },
    Banner: {
      props: [
        { name: "classNames", type: 'Partial<Record<"icon" | "title", string>>', required: false },
      ],
    },
  };

  const slotNative: Catalog = {
    Checkbox: { props: [{ name: "checked", type: "boolean", required: true }] },
    Switch: {
      props: [{ name: "classNames", type: 'Partial<Record<"label", string>>', required: false }],
    },
    Banner: {
      props: [
        {
          name: "classNames",
          type: "{ icon?: string | undefined; title?: string | undefined; }",
          required: false,
        },
      ],
    },
  };

  test("`parts` le as duas formas que o compilador escreve", () => {
    expect([...parts('Partial<Record<"a" | "b", string>>')!]).toEqual(['"a"', '"b"']);
    expect([...parts("{ item?: string | undefined; handle?: string | undefined; }")!]).toEqual([
      '"item"',
      '"handle"',
    ]);
    expect(parts("Partial<ClassNames>")).toBeUndefined();
  });

  test("`slotGaps` acha a prop que falta e a parte que falta, e ignora o conjunto igual", () => {
    expect(slotGaps(slotWeb, slotNative)).toEqual([
      { piece: "Checkbox", absent: true, onlyWeb: [], onlyNative: [] },
      { piece: "Switch", absent: false, onlyWeb: ['"thumb"'], onlyNative: [] },
    ]);
  });

  test("sem linha, as duas lacunas reprovam", () => {
    const problems = validate({}, slotWeb, slotNative);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("`Checkbox.classNames` existe no web e o nativo nao tem");
    expect(problems[1]).toContain("so no web: \"thumb\"");
  });

  test("a linha tem que nomear a parte que falta", () => {
    const vague = validate(
      { Switch: { rows: [{ web: "classNames", native: "classNames", note: "o pino e da plataforma" }] } },
      { Switch: slotWeb.Switch! },
      { Switch: slotNative.Switch! },
    );
    expect(vague).toHaveLength(1);
    expect(vague[0]).toContain("a nota nao nomeia `thumb`");

    const named = validate(
      { Switch: { rows: [{ web: "classNames", native: "classNames", note: "sem `thumb`" }] } },
      { Switch: slotWeb.Switch! },
      { Switch: slotNative.Switch! },
    );
    expect(named).toEqual([]);
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

  test("cobre os casos que custaram a tarde de quem portou a tela e que ainda divergem", () => {
    const cases: [string, string | null, string | null][] = [
      ["SearchInput", "onClear", null],
      ["MaskedInput", "value", "value"],
      ["Timeline", null, "items"],
      ["Sparkline", "variant", "variant"],
      ["Popconfirm", "onConfirm", "onAction"],
    ];

    for (const [piece, from, to] of cases) {
      const rows = SIGNATURES[piece]?.rows ?? [];
      expect(rows.some((row) => row.web === from && row.native === to)).toBe(true);
    }
  });
});

test("nenhum callback do nativo nasce da soma de duas assinaturas que brigam", async () => {
  const realNative = (await Bun.file("apps/docs/src/native-props.json").json()) as Catalog;
  const props = Object.entries(realNative).flatMap(([piece, entry]) =>
    entry.props.map((prop) => ({ piece, ...prop })),
  );
  expect(props.length).toBeGreaterThan(500);

  const clashing = props
    .filter((prop) => /=> [^&]+\) & \(\(/.test(prop.type))
    .map((prop) => `${prop.piece}.${prop.name}: ${prop.type}`);
  expect(clashing).toEqual([]);
});
