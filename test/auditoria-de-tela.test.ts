import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";

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
} from "../.claude/skills/rivocode-ui-audit/scripts/audit";
import { agentFiles } from "../apps/docs/src/agent-docs";
import { WORDS } from "../scripts/acentuar";

const SKILL_DIR = ".claude/skills/rivocode-ui-audit";
const SCRIPT = `${SKILL_DIR}/scripts/audit.ts`;
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

test("os blocos de pagina do site tiram nota alta", () => {
  const files = read("apps/docs/src/blocks");
  expect(files.length).toBeGreaterThan(4);

  const report = audit({
    files,
    manifests: [{ path: "package.json", source: readFileSync("package.json", "utf8") }],
  });

  expect(report.files.length).toBe(files.length);
  expect(report.score).toBeGreaterThanOrEqual(90);
  expect(
    report.findings.filter(
      (item) => RULES.find((rule) => rule.id === item.rule)!.severity === "critico",
    ),
  ).toEqual([]);
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
    manifests: [{ path: "package.json", source: '{"dependencies":{"lucide-react":"1"}}' }],
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
  const bad = `${head}export const S = () => <View><Modal /><Switch /><Field><Input /></Field><IconButton label="Compartilhar"><Share /></IconButton></View>;`;
  const good = `${head}export const S = () => <View><Field label="Cliente"><Input /></Field><IconButton accessibilityLabel="Compartilhar"><Share /></IconButton></View>;`;

  const found = auditSource("s.tsx", bad);
  expect(found.platform).toBe("native");
  expect(found.findings.map((item) => item.rule)).toEqual([
    "campo-sem-rotulo",
    "nome-acessivel",
    "peca-reescrita",
    "peca-reescrita",
  ]);
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
  for (const file of ["SKILL.md", "scripts/audit.ts"]) {
    expect(files.get(`skill-auditoria/${file}`)).toBe(readFileSync(`${SKILL_DIR}/${file}`, "utf8"));
  }

  const guide = files.get("para-agents.md") ?? "";
  expect(guide).toContain("/skill-auditoria/SKILL.md");
  expect(guide).toContain("/skill-auditoria/scripts/audit.ts");
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
