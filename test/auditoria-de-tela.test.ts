import { expect, test } from "bun:test";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  ACCENTS,
  audit,
  auditSource,
  CAP,
  ENTRIES,
  fileScore,
  parse,
  PEERS,
  renderMarkdown,
  RULES,
  WEIGHTS,
  type Finding,
  type SourceFile,
} from "../.claude/skills/rivocode-ui-audit/scripts/audit.mjs";
import { agentFiles } from "../apps/docs/src/agent-docs";
import { WORDS } from "../scripts/acentuar";

const SKILL_DIR = ".claude/skills/rivocode-ui-audit";
const SCRIPT = `${SKILL_DIR}/scripts/audit.mts`;
const FIXTURES = "test/fixtures/auditoria";

function read(dir: string): SourceFile[] {
  return readdirSync(dir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => ({ path: `${dir}/${file}`, source: readFileSync(`${dir}/${file}`, "utf8") }));
}

const manifest = (dir: string) => [
  { path: `${dir}/package.json`, source: readFileSync(`${dir}/package.json`, "utf8") },
];

const rulesOf = (source: string, path = "tela.tsx") =>
  auditSource(path, source).findings.map((item) => item.rule);

test("a tela boa das fixtures tira 100, nos dois pacotes, e sem achado nenhum", () => {
  const files = read(`${FIXTURES}/boa`);
  expect(files.length).toBeGreaterThan(1);

  const report = audit({ files, manifests: manifest(`${FIXTURES}/boa`) });

  expect(report.findings).toEqual([]);
  expect(report.score).toBe(100);
  expect(report.verdict).toBe("Segue a casa");
  expect(report.files.map((file) => file.platform).sort()).toEqual(["native", "web"]);
});

test("a tela ruim das fixtures cai para zero, e toda regra mecanica morde em alguma delas", () => {
  const files = read(`${FIXTURES}/ruim`);
  expect(files.length).toBeGreaterThan(1);

  const report = audit({ files, manifests: manifest(`${FIXTURES}/ruim`) });
  const fired = new Set(report.findings.map((item) => item.rule));
  const mechanical = RULES.filter((rule) => rule.kind === "mecanica");

  expect(mechanical.length).toBeGreaterThan(20);
  for (const rule of mechanical) expect([rule.id, fired.has(rule.id)]).toEqual([rule.id, true]);
  expect(report.score).toBe(0);
  expect(report.verdict).toBe("Fora do contrato");
});

test("os blocos de pagina do site tiram 100, com os manifestos do app e da raiz", () => {
  const files = read("apps/docs/src/blocks");
  expect(files.length).toBeGreaterThan(4);

  const report = audit({
    files,
    manifests: ["apps/docs/package.json", "package.json"].map((path) => ({
      path,
      source: readFileSync(path, "utf8"),
    })),
  });

  expect(report.files.length).toBe(files.length);
  expect(report.findings).toEqual([]);
  expect(report.files.every((file) => file.score === 100)).toBe(true);
  expect(report.score).toBe(100);
});

test("mesma entrada, mesma nota: a ordem dos arquivos e a repeticao nao mudam o relatorio", () => {
  const files = [...read(`${FIXTURES}/ruim`), ...read(`${FIXTURES}/boa`)];
  expect(files.length).toBeGreaterThan(3);

  const first = audit({ files, manifests: manifest(`${FIXTURES}/ruim`) });
  const again = audit({ files: [...files].reverse(), manifests: manifest(`${FIXTURES}/ruim`) });

  expect(again).toEqual(first);
  expect(renderMarkdown(again)).toBe(renderMarkdown(first));
});

test("a conta: peso por severidade, teto de tres por regra, media dos arquivos e desconto de projeto", () => {
  const finding = (rule: string, line: number): Finding => ({
    rule,
    file: "a.tsx",
    line,
    message: "x",
  });

  expect(WEIGHTS).toEqual({ critico: 10, serio: 5, moderado: 3, menor: 1 });
  expect(CAP).toBe(3);
  expect(fileScore([1, 2, 3, 4, 5].map((line) => finding("cor-literal", line)))).toBe(70);
  expect(
    fileScore([
      finding("cor-literal", 1),
      finding("texto-sem-acento", 2),
      finding("recharts-direto", 3),
    ]),
  ).toBe(86);
  expect(
    fileScore(
      Array.from({ length: 30 }, (_, line) => finding(RULES[line % RULES.length]!.id, line)),
    ),
  ).toBe(0);

  const twoFiles = audit({
    files: [
      { path: "a.tsx", source: 'export const A = () => <div className="z-10 bg-white" />' },
      { path: "b.tsx", source: "export const B = () => <main />" },
    ],
  });
  expect(twoFiles.files.map((file) => file.score)).toEqual([85, 100]);
  expect(twoFiles.score).toBe(93);
  expect(twoFiles.verdict).toBe("Ajustes pontuais");

  const withPeer = audit({
    files: [
      {
        path: "c.tsx",
        source:
          'import { ChartContainer } from "@rivocode/ui/chart";\nexport const C = () => <main />',
      },
    ],
    manifests: [
      {
        path: "package.json",
        source:
          '{"dependencies":{"lucide-react":"1","react":"19","react-dom":"19","tailwindcss":"4"}}',
      },
    ],
  });
  expect(withPeer.findings.map((item) => item.rule)).toEqual(["peer-faltando"]);
  expect(withPeer.files[0]!.score).toBe(100);
  expect(withPeer.score).toBe(95);
});

test("o julgamento do agente entra pela mesma conta, e o que nao cabe e recusado com o motivo", () => {
  const files = read(`${FIXTURES}/boa`);
  expect(files.length).toBeGreaterThan(1);
  const judgment = JSON.parse(readFileSync(`${FIXTURES}/julgamento.json`, "utf8")) as {
    findings: Finding[];
  };

  const report = audit({
    files,
    manifests: manifest(`${FIXTURES}/boa`),
    findings: [
      ...judgment.findings,
      { rule: "texto-generico", file: "fora.tsx", line: 1, message: "x" },
    ],
    dismissals: [{ rule: "cor-literal", file: "nada.tsx", line: 1, reason: "" }],
  });

  expect(report.files.map((file) => file.score).sort()).toEqual([100, 97]);
  expect(report.score).toBe(89);
  expect(report.notes).toContain(
    "Achado recusado: `fora.tsx` não está entre os arquivos auditados.",
  );
  expect(report.notes).toContain("Descarte recusado, sem motivo: `cor-literal` em nada.tsx:1.");
});

test("o comentario de supressao tira o achado da conta so com motivo, e so na linha dele ou na de baixo", () => {
  const waived = auditSource(
    "a.tsx",
    [
      "export const A = () => (",
      "  <div>",
      "    {/* rivocode-audit-ignore cor-literal: amostra da marca do cliente */}",
      '    <span className="bg-white" />',
      '    <span className="bg-black" />',
      "  </div>",
      ");",
    ].join("\n"),
  );
  expect(waived.findings.map((item) => item.line)).toEqual([5]);
  expect(waived.waived.map((item) => [item.line, item.reason])).toEqual([
    [4, "amostra da marca do cliente"],
  ]);

  const bare = auditSource(
    "b.tsx",
    '// rivocode-audit-ignore cor-literal\nexport const B = () => <i className="bg-white" />',
  );
  expect(bare.findings.map((item) => item.rule)).toEqual(["cor-literal"]);
});

const CASES: [rule: string, bad: string, good: string][] = [
  [
    "cor-literal",
    '<p className="text-red-600">Vencida</p>',
    '<p className="text-danger-text">Vencida</p>',
  ],
  [
    "cor-literal",
    "<p style={{ color: '#ff0000' }}>Vencida</p>",
    '<p className="text-danger-text">Vencida</p>',
  ],
  ["cor-literal", '<p className="bg-[#101010]">Nota</p>', '<p className="bg-surface">Nota</p>'],
  [
    "cor-literal",
    '<p style={{ background: "rgba(0, 0, 0, 0.5)" }}>Nota</p>',
    '<p className="bg-overlay">Nota</p>',
  ],
  [
    "z-index-numerico",
    '<header className="sticky z-20" />',
    '<header className="sticky z-[var(--rc-z-sticky)]" />',
  ],
  [
    "movimento-literal",
    '<div className="transition duration-200" />',
    '<div className="transition duration-base" />',
  ],
  [
    "foco-apagado",
    '<a className="outline-none">Nota</a>',
    '<a className="outline-none focus-visible:ring-2 focus-visible:ring-ring">Nota</a>',
  ],
  ["imagem-sem-alt", '<img src="/a.png" />', '<img src="/a.png" alt="" />'],
  [
    "elemento-clicavel",
    "<div onClick={go}>Abrir</div>",
    "<Button onClick={go}>Abrir nota</Button>",
  ],
  ["tabindex-positivo", "<div tabIndex={2} />", "<div tabIndex={0} />"],
  ["peca-reescrita", '<input type="range" />', "<Slider />"],
  ["peca-reescrita", '<div role="dialog">Nota</div>', "<Dialog>Nota</Dialog>"],
  ["peca-reescrita", "<table />", "<DataTable />"],
  [
    "nome-acessivel",
    "<IconButton><Trash /></IconButton>",
    '<IconButton label="Excluir nota"><Trash /></IconButton>',
  ],
  ["nome-acessivel", "<Button><Trash /></Button>", "<Button><Trash /> Excluir nota</Button>"],
  [
    "campo-sem-rotulo",
    '<Input placeholder="Cidade" />',
    "<Field><FieldLabel>Cidade</FieldLabel><Input /></Field>",
  ],
  ["campo-sem-rotulo", "<Field><Input /></Field>", '<Input aria-label="Buscar notas" />'],
  [
    "rotulo-fora-do-controle",
    "<div><Switch /><span>Enviar o XML</span></div>",
    "<div><Switch>Enviar o XML</Switch></div>",
  ],
  [
    "altura-cravada",
    '<Button className="h-12">Emitir nota</Button>',
    '<Button className="h-[var(--rc-control-lg)]">Emitir nota</Button>',
  ],
  [
    "descendente-arbitrario",
    '<DataTable className="[&_tr]:h-8" />',
    '<DataTable classNames={{ row: "h-8" }} />',
  ],
  [
    "consulta-sem-finais",
    "<DataTable isLoading={q.isLoading} />",
    "<DataTable isLoading={q.isLoading} isError={q.isError} onRetry={q.refetch} empty={vazio} />",
  ],
  ["portal-a-mao", "<TooltipProvider><Nota /></TooltipProvider>", "<Nota />"],
  ["texto-sem-acento", "<p>Situacao da emissao</p>", "<p>Situação da emissão</p>"],
  ["texto-em-ingles", "<Button>Save changes</Button>", "<Button>Salvar rascunho</Button>"],
  ["dinheiro-escrito", "<Stat value={`R$ ${total}`} />", "<Stat value={currencyShort(total)} />"],
  [
    "dinheiro-float",
    '<Input type="number" name="price" aria-label="Preço" />',
    '<CurrencyInput aria-label="Preço" />',
  ],
];

const IMPORTS =
  'import { Button, CurrencyInput, DataTable, Dialog, Field, FieldLabel, IconButton, Input, Slider, Stat, Switch, currencyShort } from "@rivocode/ui";\n';

test("cada regra morde a tela errada e solta a tela consertada", () => {
  expect(CASES.length).toBeGreaterThan(20);

  for (const [rule, bad, good] of CASES) {
    const wrap = (jsx: string) => `${IMPORTS}export const Screen = () => (\n  ${jsx}\n);\n`;
    expect([rule, bad, rulesOf(wrap(bad)).includes(rule)]).toEqual([rule, bad, true]);
    expect([rule, good, rulesOf(wrap(good))]).toEqual([rule, good, []]);
  }
});

test("as regras de codigo e de importacao mordem e soltam", () => {
  const pairs: [rule: string, bad: string, good: string][] = [
    [
      "useform-direto",
      'import { useForm } from "react-hook-form";',
      'import { useZodForm } from "@rivocode/ui/form";',
    ],
    [
      "recharts-direto",
      'import { LineChart } from "recharts";',
      'import { LineChart } from "@rivocode/ui/chart";',
    ],
    ["pix-qr-caseiro", 'import QR from "qrcode.react";', 'import { QRCode } from "@rivocode/ui";'],
    ["pix-qr-caseiro", 'const payload = "000201010212";', "const payload = buildPixPayload(data);"],
    [
      "mascara-a-mao",
      'const cpf = raw.replace(/(\\d{3})(\\d{3})/, "$1.$2");',
      'const cpf = applyMask(raw, "cpf");',
    ],
    ["dinheiro-float", "const amount = parseFloat(input);", "const amount = toCents(input);"],
    [
      "dinheiro-escrito",
      "const text = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });",
      "const text = currency(value);",
    ],
    [
      "documento-sem-validador",
      "const schema = z.object({ cnpj: z.string().length(14) });",
      "const schema = z.object({ cnpj: z.string().refine(isValidCnpj) });",
    ],
    [
      "import-caminho-errado",
      'import { FormField } from "@rivocode/ui";',
      'import { FormField } from "@rivocode/ui/form";',
    ],
    [
      "import-caminho-errado",
      'import { Button } from "@rivocode/ui/chart";',
      'import { Button } from "@rivocode/ui";',
    ],
    [
      "import-caminho-errado",
      'import { Card } from "@rivocode/ui/src/card";',
      'import { Card } from "@rivocode/ui";',
    ],
    [
      "import-caminho-errado",
      'import { PixCode } from "@rivocode/ui-native";\nimport { View } from "react-native";',
      'import { PixCode } from "@rivocode/ui-native/chart";\nimport { View } from "react-native";',
    ],
    [
      "import-caminho-errado",
      'import { Button } from "@rivocode/ui";\nimport { View } from "react-native";',
      'import { Button } from "@rivocode/ui-native";\nimport { View } from "react-native";',
    ],
    [
      "formulario-sem-zod",
      "export const F = () => <form><Input /></form>;",
      'export const F = () => <form role="search"><SearchInput /></form>;',
    ],
  ];
  expect(pairs.length).toBeGreaterThan(10);

  for (const [rule, bad, good] of pairs) {
    const wrap = (code: string) => `${code}\nexport const Screen = () => <main />;\n`;
    expect([rule, bad, rulesOf(wrap(bad)).includes(rule)]).toEqual([rule, bad, true]);
    expect([rule, good, rulesOf(wrap(good)).includes(rule)]).toEqual([rule, good, false]);
  }
  expect(
    rulesOf('import { currencyShort } from "@rivocode/ui";\nexport const A = () => <main />'),
  ).toEqual([]);
  expect(
    rulesOf('import { currencyShort } from "@rivocode/ui/chart";\nexport const A = () => <main />'),
  ).toEqual([]);
});

test("no nativo, a primitiva do react-native, o Field sem label e o IconButton sem nome mordem", () => {
  const head =
    'import { Modal, Switch, View } from "react-native";\nimport { Field, IconButton, Input } from "@rivocode/ui-native";\n';
  const bad = `${head}export const S = () => <View><Modal /><Switch /><Field><Input /></Field><IconButton><Share /></IconButton></View>;`;
  const legacy = `${head}export const S = () => <View><IconButton accessibilityLabel="Salvar"><Save /></IconButton></View>;`;
  const good = `${head}export const S = () => <View><Field label="Cliente"><Input /></Field><IconButton label="Compartilhar"><Share /></IconButton><IconButton label="Salvar"><Save /></IconButton></View>;`;

  const found = auditSource("s.tsx", bad);
  expect(found.platform).toBe("native");
  expect(found.findings.map((item) => item.rule)).toEqual([
    "campo-sem-rotulo",
    "nome-acessivel",
    "peca-reescrita",
    "peca-reescrita",
  ]);
  expect(rulesOf(legacy, "s.tsx")).toEqual(["nome-acessivel"]);
  expect(rulesOf(good, "s.tsx")).toEqual([]);
});

test("o leitor de JSX nao se perde em generico, comparacao, expressao regular e texto com apostrofo", () => {
  const source = [
    "const pick = <T,>(value: T) => value;",
    "const small = count < limit && limit > 2;",
    "const quote = /[\"'`]/g.test(text);",
    "const list: Array<string> = [];",
    "export const S = () => (",
    "  <Card title={`Nota ${n}`}>",
    '    <p>Copo d\'água e "aspas"</p>',
    "    {items.map((item) => <Item key={item.id} label={item.name} />)}",
    "    {/* comentario com <div> dentro */}",
    "  </Card>",
    ");",
  ].join("\n");

  const parsed = parse(source);
  expect(parsed.elements.map((node) => node.name)).toEqual(["Card", "p", "Item"]);
  expect(parsed.elements[2]!.parent).toBe(0);
  expect(parsed.comments.map((item) => item.value.trim())).toEqual(["comentario com <div> dentro"]);
  expect(parsed.elements[1]!.children).toEqual([
    { kind: "text", value: 'Copo d\'água e "aspas"', start: source.indexOf("Copo") },
  ]);
});

test("as entradas que a auditoria conhece sao as que os pacotes exportam", () => {
  const valueExports = (file: string) => {
    const code = readFileSync(file, "utf8");
    const names = new Set<string>();
    for (const match of code.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
      if (match[1]) continue;
      for (const raw of match[2]!.split(",")) {
        const item = raw.trim();
        if (item && !item.startsWith("type "))
          names.add(
            item
              .split(/\s+as\s+/)
              .pop()!
              .trim(),
          );
      }
    }
    for (const match of code.matchAll(/export\s+(?:const|function|class)\s+([A-Za-z_$][\w$]*)/g))
      names.add(match[1]!);
    return [...names].sort();
  };

  const source = (entry: string) =>
    entry.startsWith("@rivocode/ui-native")
      ? `native/src/${entry.slice("@rivocode/ui-native/".length)}/index.ts`
      : `src/${entry.slice("@rivocode/ui/".length)}/index.ts`;

  const roots = { web: valueExports("src/index.ts"), native: valueExports("native/src/index.ts") };
  expect(roots.web.length).toBeGreaterThan(200);
  expect(roots.native.length).toBeGreaterThan(80);

  const entries = Object.keys(ENTRIES);
  expect(entries.length).toBeGreaterThan(8);

  const webManifest = JSON.parse(readFileSync("package.json", "utf8")) as {
    exports: Record<string, unknown>;
  };
  const nativeManifest = JSON.parse(readFileSync("native/package.json", "utf8")) as {
    exports: Record<string, string>;
  };
  const declared = [
    ...Object.keys(webManifest.exports)
      .filter((key) => !/\.css$|preset|tokens|^\.$/.test(key))
      .map((key) => `@rivocode/ui${key.slice(1)}`),
    ...Object.entries(nativeManifest.exports)
      .filter(([key, value]) => key !== "." && value.endsWith("/index.ts"))
      .map(([key]) => `@rivocode/ui-native${key.slice(1)}`),
  ].sort();
  expect(entries.sort()).toEqual(declared);

  for (const entry of entries) {
    const names = valueExports(source(entry));
    const root = entry.startsWith("@rivocode/ui-native") ? roots.native : roots.web;
    expect([entry, ENTRIES[entry]!.names]).toEqual([entry, names]);
    expect([entry, ENTRIES[entry]!.alsoAtRoot]).toEqual([
      entry,
      names.filter((name) => root.includes(name)),
    ]);
  }
});

test("os peers que a auditoria cobra sao os que os manifestos declaram", () => {
  const web = JSON.parse(readFileSync("package.json", "utf8")) as {
    peerDependencies: Record<string, string>;
    peerDependenciesMeta: Record<string, { optional: boolean }>;
  };
  const native = JSON.parse(readFileSync("native/package.json", "utf8")) as {
    peerDependencies: Record<string, string>;
  };

  const asked = new Set(
    Object.values(PEERS).flatMap((peer) => [...peer.always, ...(peer.withZod ?? [])]),
  );
  expect(asked.size).toBeGreaterThan(10);

  for (const name of asked) {
    const known =
      name in web.peerDependencies ||
      name in native.peerDependencies ||
      name.startsWith("@tiptap/") ||
      name.startsWith("@dnd-kit/");
    expect([name, known]).toEqual([name, true]);
  }
  for (const [name, meta] of Object.entries(web.peerDependenciesMeta)) {
    if (name === "lucide-react" || meta.optional)
      expect([name, asked.has(name)]).toEqual([name, true]);
  }
});

test("o dicionario de acento da auditoria e o mesmo da casa", () => {
  const entries = Object.entries(ACCENTS);
  expect(entries.length).toBeGreaterThan(100);
  for (const [plain, accented] of entries) expect([plain, WORDS[plain]]).toEqual([plain, accented]);
});

test("toda regra esta na skill, e a skill nao cita regra que nao existe", () => {
  const skill = readFileSync(`${SKILL_DIR}/SKILL.md`, "utf8");
  expect(skill).toStartWith("---\nname: rivocode-ui-audit\ndescription: ");

  const cited = new Set([...skill.matchAll(/^\| `([a-z][a-z-]+)` \|/gm)].map((match) => match[1]!));
  expect(cited.size).toBeGreaterThan(25);
  expect([...cited].sort()).toEqual(RULES.map((rule) => rule.id).sort());
});

test("o site entrega a skill de auditoria e o script, iguais ao disco, e o para-agents ensina a usar", () => {
  const files = agentFiles();
  for (const file of ["SKILL.md", "scripts/audit.mts"]) {
    expect(files.get(`skill-auditoria/${file}`)).toBe(readFileSync(`${SKILL_DIR}/${file}`, "utf8"));
  }

  const guide = files.get("para-agents.md") ?? "";
  expect(guide).toContain("/skill-auditoria/SKILL.md");
  expect(guide).toContain("/skill-auditoria/scripts/audit.mts");
  expect(guide).toContain("`audit_screen`");
  expect(files.get("llms.txt")).toContain("(/skill-auditoria/SKILL.md)");
});

test("o script roda sozinho, imprime a nota e corta a CI abaixo do minimo", async () => {
  const run = async (...args: string[]) => {
    const child = Bun.spawn(["bun", SCRIPT, ...args], { stdout: "pipe", stderr: "pipe" });
    const [out, code] = await Promise.all([new Response(child.stdout).text(), child.exited]);
    return { out, code };
  };

  const good = await run(
    `${FIXTURES}/boa`,
    "--manifesto",
    `${FIXTURES}/boa/package.json`,
    "--minimo",
    "90",
  );
  expect(good.code).toBe(0);
  expect(good.out).toContain("**Nota: 100/100.** Segue a casa.");

  const bad = await run(
    `${FIXTURES}/ruim`,
    "--manifesto",
    `${FIXTURES}/ruim/package.json`,
    "--minimo",
    "50",
    "--json",
  );
  expect(bad.code).toBe(1);
  expect((JSON.parse(bad.out) as { score: number }).score).toBe(0);

  const judged = await run(
    `${FIXTURES}/boa`,
    "--manifesto",
    `${FIXTURES}/boa/package.json`,
    "--julgamento",
    `${FIXTURES}/julgamento.json`,
  );
  expect(judged.code).toBe(0);
  expect(judged.out).toContain("**Nota: 89/100.** Ajustes pontuais.");
  expect(judged.out).toContain("**provider-ausente** (crítico, julgamento)");
});

test("o leitor de JSX atravessa a tag com tipo generico, e a tela com generico perde a mesma nota", () => {
  const body = (table: string) =>
    [
      'import { Card, DataTable, IconButton } from "@rivocode/ui";',
      "type Row = { id: string };",
      "export function Tela({ rows }: { rows: Row[] }) {",
      "  return (",
      "    <Card>",
      "      <IconButton />",
      "      <div onClick={() => {}}>Abrir</div>",
      '      <img src="/a.png" />',
      `      ${table}`,
      "    </Card>",
      "  );",
      "}",
    ].join("\n");

  const plain = auditSource("a.tsx", body("<DataTable columns={[]} data={rows} />"));
  const generic = auditSource("a.tsx", body("<DataTable<Row> columns={[]} data={rows} />"));
  const nested = auditSource(
    "a.tsx",
    body("<DataTable<Map<string, Row[]>> columns={[]} data={rows}></DataTable>"),
  );

  expect(plain.findings.map((item) => item.rule)).toEqual([
    "nome-acessivel",
    "elemento-clicavel",
    "imagem-sem-alt",
  ]);
  expect(generic.findings).toEqual(plain.findings);
  expect(nested.findings).toEqual(plain.findings);
  expect(parse(body("<DataTable<Row> columns={[]} />")).elements.map((node) => node.name)).toEqual([
    "Card",
    "IconButton",
    "div",
    "img",
    "DataTable",
  ]);
});

test("o achado de importacao sai na linha do import, e a supressao nessa linha vale", () => {
  const found = auditSource(
    "a.tsx",
    [
      'import { Button } from "@rivocode/ui";',
      'import { Card } from "@rivocode/ui";',
      'import { QRCode } from "qrcode.react";',
      'import { useForm } from "react-hook-form"',
      "export const A = () => <Button>Ir</Button>;",
    ].join("\n"),
  );
  expect(found.findings.map((item) => [item.rule, item.line])).toEqual([
    ["pix-qr-caseiro", 3],
    ["useform-direto", 4],
  ]);

  const waived = auditSource(
    "b.tsx",
    [
      'import { Button } from "@rivocode/ui";',
      'import { useForm } from "react-hook-form"; // rivocode-audit-ignore useform-direto: formulario legado',
      "export const A = () => <Button>Ir</Button>;",
    ].join("\n"),
  );
  expect(waived.findings).toEqual([]);
  expect(waived.waived.map((item) => [item.rule, item.line, item.reason])).toEqual([
    ["useform-direto", 2, "formulario legado"],
  ]);
});

const HEAD =
  'import { Button, Card, CodeBlock, Field, FieldLabel, Input, InputGroup, InputPrefix, MaskedInput, Text, cn, currency } from "@rivocode/ui";\nimport { Form, FormField, useZodForm } from "@rivocode/ui/form";\n';

test("o que a casa escreve certo nao vira achado", () => {
  const clean: [rule: string, source: string][] = [
    [
      "documento-sem-validador",
      'import { clienteSchema } from "./schema";\nexport function C() {\n  const form = useZodForm(clienteSchema);\n  return <Form form={form} onSubmit={() => {}}><FormField name="cpf" label="CPF" render={({ field }) => <MaskedInput mask="cpf" {...field} />} /></Form>;\n}',
    ],
    [
      "foco-apagado",
      'export const A = ({ on }: { on: boolean }) => <a href="/x" className={cn("rounded outline-none", "focus-visible:ring-2 focus-visible:ring-ring", on && "bg-surface")}>Ir</a>;',
    ],
    [
      "foco-apagado",
      'const base = cn("outline-none", "focus-visible:ring-2 focus-visible:ring-ring");\nexport const A = () => <a href="/x" className={base}>Ir</a>;',
    ],
    [
      "dinheiro-float",
      "export function A({ customWidth, feedbackCount, totalDeNotas }: Record<string, string>) {\n  const width = Number(customWidth);\n  const n = parseFloat(feedbackCount);\n  const notas = Number(totalDeNotas);\n  return <Card style={{ width }}>{n + notas}</Card>;\n}",
    ],
    [
      "dinheiro-float",
      "export function A({ row }: { row: { valorEmCentavos: string; amountCents: string } }) {\n  const cents = Number(row.valorEmCentavos) + Number(row.amountCents);\n  return <Text>{currency(cents / 100)}</Text>;\n}",
    ],
    ["texto-em-ingles", "export const A = () => <Text>Continue de onde parou.</Text>;"],
    [
      "texto-em-ingles",
      'export async function load() {\n  const r = await fetch("/api");\n  if (!r.ok) throw new Error("Failed to load the invoice list");\n  return r.json();\n}\nexport const B = () => <Button onClick={load}>Carregar notas</Button>;',
    ],
    [
      "dinheiro-escrito",
      "export const A = () => <Field><FieldLabel>Valor</FieldLabel><InputGroup><InputPrefix>R$</InputPrefix><Input /></InputGroup></Field>;",
    ],
    [
      "import-caminho-errado",
      'const sample = `\nimport { FormField } from "@rivocode/ui";\n`;\nexport const Doc = () => <CodeBlock code={sample} language="tsx" />;',
    ],
    [
      "pix-qr-caseiro",
      'const sample = `\nimport { QRCode } from "qrcode.react";\n`;\nexport const Doc = () => <CodeBlock code={sample} language="tsx" />;',
    ],
    [
      "cor-literal",
      'export function A() {\n  const go = () => { if (location.hash === "#add") scrollTo(0, 0); };\n  return <Button onClick={go}>Adicionar item</Button>;\n}',
    ],
    [
      "texto-sem-acento",
      'export const A = () => <Field><FieldLabel>E-mail</FieldLabel><Input placeholder="voce@empresa.com" /></Field>;',
    ],
  ];
  expect(clean.length).toBeGreaterThan(10);

  for (const [rule, body] of clean) {
    expect([rule, body, rulesOf(`${HEAD}${body}\n`).includes(rule)]).toEqual([rule, body, false]);
  }

  const stillBites: [rule: string, source: string][] = [
    [
      "foco-apagado",
      'export const A = () => <a href="/x" className={cn("outline-none", "px-2")}>Ir</a>;',
    ],
    [
      "dinheiro-float",
      "export const A = ({ price }: { price: string }) => <Text>{parseFloat(price)}</Text>;",
    ],
    [
      "dinheiro-float",
      "export const A = ({ valorTotal }: { valorTotal: string }) => <Text>{Number(valorTotal)}</Text>;",
    ],
    ["texto-em-ingles", "export const A = () => <Button>Save changes</Button>;"],
    [
      "import-caminho-errado",
      'import { Badge } from "@rivocode/ui/form";\nexport const A = () => <main />;',
    ],
    ["cor-literal", 'export const A = () => <p style={{ color: "#add" }}>Nota</p>;'],
    ["dinheiro-escrito", "export const A = () => <InputPrefix>R$ 10,00</InputPrefix>;"],
  ];
  for (const [rule, body] of stillBites) {
    expect([rule, body, rulesOf(`${HEAD}${body}\n`).includes(rule)]).toEqual([rule, body, true]);
  }
});

test("o que escapava agora morde: nome vazio, link sem href, cor arbitraria por nome e o toque cru do nativo", () => {
  const web =
    'import { Button, IconButton } from "@rivocode/ui";\nimport { X } from "lucide-react";\n';
  const native =
    'import { Pressable, Text, TouchableWithoutFeedback, View } from "react-native";\nimport { Button } from "@rivocode/ui-native";\n';
  const bites: [rule: string, source: string][] = [
    ["nome-acessivel", `${web}export const A = () => <Button aria-label=""><X /></Button>;`],
    ["nome-acessivel", `${web}export const A = () => <IconButton label="  "><X /></IconButton>;`],
    ["elemento-clicavel", `${web}export const A = () => <a onClick={() => {}}>Abrir</a>;`],
    ["cor-literal", `${web}export const A = () => <p className="text-[red]">Nota</p>;`],
    ["cor-literal", `${web}export const A = () => <p className="shadow-[0_0_0_#000]">Nota</p>;`],
    [
      "peca-reescrita",
      `${native}export const A = () => <TouchableWithoutFeedback onPress={() => {}}><View /></TouchableWithoutFeedback>;`,
    ],
    [
      "nome-acessivel",
      `${native}export const A = () => <Pressable onPress={() => {}}><Icon /></Pressable>;`,
    ],
    [
      "nome-acessivel",
      `${native}export const A = () => <Button onPress={() => {}}><Icon /></Button>;`,
    ],
  ];
  for (const [rule, source] of bites) {
    expect([rule, source, rulesOf(source).includes(rule)]).toEqual([rule, source, true]);
  }

  const fine: [rule: string, source: string][] = [
    ["nome-acessivel", `${web}export const A = () => <Button aria-label="Fechar"><X /></Button>;`],
    [
      "elemento-clicavel",
      `${web}export const A = () => <a href="/notas" onClick={() => {}}>Abrir</a>;`,
    ],
    [
      "nome-acessivel",
      `${native}export const A = () => <Pressable onPress={() => {}}><Text>Salvar</Text></Pressable>;`,
    ],
    [
      "nome-acessivel",
      `${native}export const A = () => <Pressable accessibilityLabel="Salvar" onPress={() => {}}><Icon /></Pressable>;`,
    ],
  ];
  for (const [rule, source] of fine) {
    expect([rule, source, rulesOf(source).includes(rule)]).toEqual([rule, source, false]);
  }
});

test("os peers obrigatorios de cada pacote sao cobrados de quem importa qualquer entrada dele", () => {
  type Manifest = {
    peerDependencies: Record<string, string>;
    peerDependenciesMeta: Record<string, { optional: boolean }>;
  };
  const sides = [
    ["package.json", "@rivocode/ui"],
    ["native/package.json", "@rivocode/ui-native"],
  ] as const;

  for (const [file, root] of sides) {
    const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
    const required = Object.keys(manifest.peerDependencies)
      .filter((name) => !manifest.peerDependenciesMeta[name]?.optional)
      .sort();
    expect(required.length).toBeGreaterThan(2);
    expect([root, [...(PEERS[root]?.always ?? [])].sort()]).toEqual([root, required]);
  }

  const onlySubpath = audit({
    files: [
      {
        path: "a.tsx",
        source:
          'import { View } from "react-native";\nimport { Form } from "@rivocode/ui-native/form";\nexport const A = () => <View />;',
      },
    ],
    manifests: [{ path: "package.json", source: '{"dependencies":{"react-hook-form":"7"}}' }],
  });
  const missing = onlySubpath.findings.map((item) => item.message);
  expect(missing.some((message) => message.includes("`react-native-reanimated`"))).toBe(true);
  expect(missing.some((message) => message.includes("`react-hook-form`"))).toBe(false);
});

test("achado e descarte de julgamento aceitam a mesma forma, e a forma errada vira aviso", () => {
  const report = audit({
    files: [{ path: "a.tsx", source: 'export const A = () => <div className="bg-white" />' }],
    findings: [
      { rule: "escolha-de-peca", file: "a.tsx", line: "1" as unknown as number, message: "x" },
      { rule: "escolha-de-peca", file: "a.tsx", line: 1 } as unknown as Finding,
    ],
    dismissals: [
      { rule: "cor-literal", file: "a.tsx", line: "1" as unknown as number, reason: "amostra" },
      { rule: "cor-literal", file: "a.tsx", line: 1 } as never,
    ],
  });
  expect(report.findings.map((item) => item.rule)).toEqual(["cor-literal"]);
  expect(report.notes.filter((note) => note.startsWith("Achado recusado")).length).toBe(2);
  expect(report.notes.filter((note) => note.startsWith("Descarte recusado")).length).toBe(2);
  expect(report.notes).toContain("Descarte recusado, sem motivo: `cor-literal` em a.tsx:1.");
});

const SCRIPT_ABSOLUTE = `${process.cwd()}/${SCRIPT}`;

async function runScript(args: string[], cwd?: string) {
  const child = Bun.spawn(["bun", SCRIPT_ABSOLUTE, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    cwd,
  });
  const [out, err, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { out, err, code };
}

test("o --julgamento com forma errada responde com aviso ou com erro legivel, e nunca com pilha", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auditoria-"));
  const target = `${process.cwd()}/${FIXTURES}/boa`;
  const manifestArgs = ["--manifesto", `${target}/package.json`];
  const write = (name: string, value: unknown) => {
    writeFileSync(join(dir, name), JSON.stringify(value));
    return join(dir, name);
  };

  const noReason = await runScript([
    target,
    ...manifestArgs,
    "--julgamento",
    write("sem-motivo.json", { dismissals: [{ rule: "cor-literal", file: "x.tsx", line: 1 }] }),
  ]);
  expect(noReason.err).toBe("");
  expect(noReason.code).toBe(0);
  expect(noReason.out).toContain("Descarte recusado, sem motivo");

  const shapes: unknown[] = [[], "texto", { findings: {} }, { dismissals: [1] }];
  for (const shape of shapes) {
    const wrong = await runScript([
      target,
      ...manifestArgs,
      "--julgamento",
      write("forma.json", shape),
    ]);
    expect([shape, wrong.code]).toEqual([shape, 2]);
    expect(wrong.err).toContain("forma.json");
    expect(wrong.err).not.toContain("    at ");
  }
});

test("com mais de um alvo, os package.json de cada um entram na conta", async () => {
  const dir = mkdtempSync(join(tmpdir(), "auditoria-"));
  mkdirSync(join(dir, ".git"));
  const apps: [name: string, deps: Record<string, string>, source: string][] = [
    [
      "web",
      { "lucide-react": "1", react: "19", "react-dom": "19", tailwindcss: "4" },
      'import { Card } from "@rivocode/ui";\nexport const A = () => <Card />;',
    ],
    [
      "grafico",
      { "lucide-react": "1", react: "19", "react-dom": "19", recharts: "3", tailwindcss: "4" },
      'import { ChartContainer } from "@rivocode/ui/chart";\nexport const B = () => <ChartContainer config={{}} />;',
    ],
  ];
  for (const [app, deps, source] of apps) {
    mkdirSync(join(dir, app));
    writeFileSync(join(dir, app, "package.json"), JSON.stringify({ dependencies: deps }));
    writeFileSync(join(dir, app, "tela.tsx"), source);
  }

  const both = await runScript(["web", "grafico", "--json"], dir);
  expect(both.code).toBe(0);
  const report = JSON.parse(both.out) as { findings: Finding[]; score: number };
  expect(report.findings).toEqual([]);
  expect(report.score).toBe(100);
});

test("o script tem extensao .mts, e o node o roda num projeto commonjs", async () => {
  expect(SCRIPT.endsWith(".mts")).toBe(true);

  const dir = mkdtempSync(join(tmpdir(), "auditoria-cjs-"));
  mkdirSync(join(dir, ".git"));
  mkdirSync(join(dir, "scripts"));
  copyFileSync(SCRIPT, join(dir, "scripts", "audit.mts"));
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({
      type: "commonjs",
      dependencies: {
        "@rivocode/ui": "*",
        "lucide-react": "*",
        react: "*",
        "react-dom": "*",
        tailwindcss: "*",
      },
    }),
  );
  writeFileSync(
    join(dir, "tela.tsx"),
    'import { Card } from "@rivocode/ui";\nexport const A = () => <Card className="z-10" />;',
  );

  const node = Bun.which("node");
  if (!node) return;
  const probe = Bun.spawnSync([node, "--version"]).stdout.toString().trim();
  const [major, minor] = probe.replace(/^v/, "").split(".").map(Number) as [number, number];
  if (major < 22 || (major === 22 && minor < 6)) return;

  const child = Bun.spawn(
    [
      node,
      "--experimental-strip-types",
      "--no-warnings",
      "scripts/audit.mts",
      "tela.tsx",
      "--json",
    ],
    { cwd: dir, stdout: "pipe", stderr: "pipe" },
  );
  const [out, err, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  expect([code, err]).toEqual([0, ""]);
  const report = JSON.parse(out) as { score: number; findings: Finding[] };
  expect(report.findings.map((item) => item.rule)).toEqual(["z-index-numerico"]);
  expect(report.score).toBe(95);
});
