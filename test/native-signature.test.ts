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
} from "../scripts/native-signature";

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

/** Without `Spinner`, whose diverging variant is the subject of the sweep block. */
const onlyMeter = (catalog: Catalog): Catalog => ({ Meter: catalog.Meter! });

const only = (rows: Signature["rows"], piece = "Meter", nativePiece?: string) =>
  validate(
    { [piece]: { ...(nativePiece ? { nativePiece } : {}), rows } },
    onlyMeter(web),
    onlyMeter(native),
  );

describe("the signature table only passes when it describes the code", () => {
  test("the right row passes", () => {
    expect(
      only([{ web: "format", native: "valueLabel", note: "the text goes ready-made" }]),
    ).toHaveLength(0);
  });

  test("a prop that does not exist on web is flagged", () => {
    const problems = only([{ web: "formato", native: "valueLabel", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("does not have the prop `formato` on the web");
  });

  test("a prop that does not exist on native is flagged", () => {
    const problems = only([{ web: "format", native: "valorEscrito", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("does not have the prop `valorEscrito` on native");
  });

  test("a row saying `web only` about a prop native HAS is flagged", () => {
    const problems = only([{ web: "value", native: null, note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("HAS that prop");
  });

  test("a rename with both props alive on native is flagged", () => {
    const problems = only([{ web: "value", native: "valueLabel", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("has BOTH");
  });

  test("same name with the SAME signature on both sides is flagged", () => {
    const problems = only([{ web: "value", native: "value", note: "x" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("the SAME signature");
  });

  test("same name with different requiredness passes", () => {
    expect(only([{ web: "label", native: "label", note: "becomes required" }])).toHaveLength(0);
  });

  test("a piece missing from the native catalog is flagged", () => {
    const problems = only([{ web: "format", native: null, note: "x" }], "Meter", "Medidor");
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("which is not in that catalog");
  });

  test("a note with a line break is flagged, because a note is a table cell", () => {
    const problems = only([{ web: "format", native: "valueLabel", note: "one\ntwo" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("line break");
  });

  test("a hand-written row repeating the phrase derived from `size` is flagged", () => {
    const problems = only([{ web: "size", native: null, note: "a single height" }]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("derived sentence");
  });

  test("a variant that exists on one side only without a row is flagged", () => {
    const problems = validate({}, web, native);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("Spinner.size");
    expect(problems[0]).toContain("a variant that exists on one side only");
  });
});

describe("what the guard derives on its own", () => {
  test("`literals` only answers for a union of literals", () => {
    expect([...literals('"sm" | "md" | undefined')!]).toEqual(['"sm"', '"md"']);
    expect(literals("string")).toBeUndefined();
    expect(literals("number | undefined")).toBeUndefined();
  });

  test("`variantGaps` finds the variant only one side has", () => {
    const gaps = variantGaps(web, native);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.piece).toBe("Spinner");
    expect(gaps[0]!.onlyWeb).toEqual(['"lg"', '"md"', '"sm"']);
    expect(gaps[0]!.onlyNative).toEqual(['"large"', '"small"']);
  });

  test("`sizeGone` finds who loses `size` and ignores who keeps it", () => {
    expect(sizeGone(web, native)).toEqual(["Meter"]);
  });
});

describe("the classNames that does not cross over whole", () => {
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

  test("`parts` reads both forms the compiler writes", () => {
    expect([...parts('Partial<Record<"a" | "b", string>>')!]).toEqual(['"a"', '"b"']);
    expect([...parts("{ item?: string | undefined; handle?: string | undefined; }")!]).toEqual([
      '"item"',
      '"handle"',
    ]);
    expect(parts("Partial<ClassNames>")).toBeUndefined();
  });

  test("`slotGaps` finds the missing prop and the missing part, and ignores an equal set", () => {
    expect(slotGaps(slotWeb, slotNative)).toEqual([
      { piece: "Checkbox", absent: true, onlyWeb: [], onlyNative: [] },
      { piece: "Switch", absent: false, onlyWeb: ['"thumb"'], onlyNative: [] },
    ]);
  });

  test("without a row, both gaps fail", () => {
    const problems = validate({}, slotWeb, slotNative);
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain("`Checkbox.classNames` exists on the web and native does not have");
    expect(problems[1]).toContain("web only: \"thumb\"");
  });

  test("the row has to name the missing part", () => {
    const vague = validate(
      { Switch: { rows: [{ web: "classNames", native: "classNames", note: "the knob belongs to the platform" }] } },
      { Switch: slotWeb.Switch! },
      { Switch: slotNative.Switch! },
    );
    expect(vague).toHaveLength(1);
    expect(vague[0]).toContain("the note does not name `thumb`");

    const named = validate(
      { Switch: { rows: [{ web: "classNames", native: "classNames", note: "without `thumb`" }] } },
      { Switch: slotWeb.Switch! },
      { Switch: slotNative.Switch! },
    );
    expect(named).toEqual([]);
  });
});

describe("the published table", () => {
  test("describes the real code of both packages", async () => {
    const real = (await Bun.file("apps/docs/src/component-props.json").json()) as Catalog;
    const realNative = (await Bun.file("apps/docs/src/native-props.json").json()) as Catalog;

    expect(Object.keys(real).length).toBeGreaterThan(150);
    expect(Object.keys(realNative).length).toBeGreaterThan(60);
    expect(validate(SIGNATURES, real, realNative)).toEqual([]);
  });

  test("the classNames rule reads the parts on both sides, and only the web Calendar stays unread", async () => {
    const real = (await Bun.file("apps/docs/src/component-props.json").json()) as Catalog;
    const realNative = (await Bun.file("apps/docs/src/native-props.json").json()) as Catalog;
    const slotsOf = (catalog: Catalog, piece: string) =>
      catalog[piece]?.props.find((prop) => prop.name === "classNames")?.type;

    const shared = Object.keys(real).filter(
      (piece) => slotsOf(real, piece) && slotsOf(realNative, piece),
    );
    expect(shared.length).toBeGreaterThan(30);

    const unread = shared.filter(
      (piece) => !parts(slotsOf(real, piece)!) || !parts(slotsOf(realNative, piece)!),
    );
    expect(unread).toEqual(["Calendar"]);
  });

  test("covers the cases that cost an afternoon to whoever ported the screen and that still diverge", () => {
    const cases: [string, string | null, string | null][] = [
      ["SearchInput", "onClear", null],
      ["MaskedInput", "value", "value"],
      ["Timeline", null, "items"],
      ["Sparkline", "variant", "variant"],
      ["Popconfirm", "trigger", null],
    ];

    for (const [piece, from, to] of cases) {
      const rows = SIGNATURES[piece]?.rows ?? [];
      expect(rows.some((row) => row.web === from && row.native === to)).toBe(true);
    }
  });
});

test("no native callback is born from the sum of two clashing signatures", async () => {
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
