import { expect, test } from "bun:test";

import {
  decideRelease,
  TARGETS,
  topSection,
  VETO,
  type ReleaseFacts,
  type ReleaseTarget,
} from "../scripts/decisao-de-release";

const WEB = TARGETS["web"] as ReleaseTarget;
const NATIVE = TARGETS["native"] as ReleaseTarget;
const MCP = TARGETS["mcp"] as ReleaseTarget;

function facts(version: string, over: Partial<ReleaseFacts> = {}): ReleaseFacts {
  return {
    version,
    tags: [],
    published: [],
    changelog: `# Mudancas\n\n## ${version}\n\n### Corrigido: alguma coisa\n\nTexto.\n`,
    message: "feat: a peca nova nasce nos dois pacotes",
    ...over,
  };
}

test("o caminho feliz do web cria a tag `v` e chama o release", () => {
  const decision = decideRelease(WEB, facts("0.11.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("v0.11.0");
  expect(decision.reason).toContain("release.yml");
});

test("o caminho feliz do nativo cria a tag `native-v` e chama o release-native", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("native-v0.6.0");
  expect(decision.reason).toContain("release-native.yml");
});

test("a tag que ja existe barra o web", () => {
  const decision = decideRelease(WEB, facts("0.11.0", { tags: ["v0.10.0", "v0.11.0"] }));

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("v0.11.0");
});

test("a tag que ja existe barra o nativo", () => {
  const decision = decideRelease(
    NATIVE,
    facts("0.6.0", { tags: ["native-v0.5.0", "native-v0.6.0"] }),
  );

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
});

test("o prefixo separa os dois pacotes: a tag do web nao barra o nativo", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { tags: ["v0.6.0"] }));

  expect(decision.verdict).toBe("release");
  expect(decision.tag).toBe("native-v0.6.0");
});

test("a versao ja publicada barra o web, e diz que publicacao nao se desfaz", () => {
  const decision = decideRelease(WEB, facts("0.11.0", { published: ["0.10.0", "0.11.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("@rivocode/ui@0.11.0");
  expect(decision.reason).toContain("nao se");
});

test("a versao ja publicada barra o nativo", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { published: ["0.6.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.reason).toContain("@rivocode/ui-native@0.6.0");
});

test("o CHANGELOG do web parado na versao anterior barra a tag", () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", { changelog: "# Mudancas\n\n## 0.10.0\n\nA versao de tras.\n" }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain('"## 0.10.0"');
});

test("o CHANGELOG do nativo sem secao nenhuma barra a tag", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { changelog: "# Mudancas\n" }));

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.reason).toContain("nao ha secao nenhuma");
});

test("a secao da versao tem que estar no TOPO, e nao em qualquer lugar", () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", {
      changelog: "# Mudancas\n\n## 0.10.0\n\nA de tras.\n\n## 0.11.0\n\nA nova, no lugar errado.\n",
    }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.release).toBe(false);
});

test("um titulo de terceiro nivel nao conta como a secao do topo", () => {
  expect(topSection("# Mudancas\n\n### Corrigido: nada\n\n## 0.11.0\n")).toBe("0.11.0");
});

test(`${VETO} so no CORPO nao barra: foi assim que a automacao vetou a si mesma`, () => {
  const message =
    `ci: a tag nasce do gate verde\n\n` +
    `A valvula de escape e escrever ${VETO} no assunto do commit.`;

  expect(decideRelease(WEB, facts("0.11.0", { message })).release).toBe(true);
  expect(decideRelease(NATIVE, facts("0.6.0", { message })).release).toBe(true);
});

test(`${VETO} na mensagem do commit barra o web`, () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", { message: `chore: o bump espera o resto ${VETO}` }),
  );

  expect(decision.verdict).toBe("vetoed");
  expect(decision.release).toBe(false);
});

test(`${VETO} na mensagem do commit barra o nativo, em qualquer caixa`, () => {
  const decision = decideRelease(
    NATIVE,
    facts("0.6.0", { message: "chore: bump [NO-RELEASE]\n\nCorpo da mensagem." }),
  );

  expect(decision.verdict).toBe("vetoed");
  expect(decision.release).toBe(false);
});

test("toda decisao barrada devolve release falso, e toda liberada devolve verdadeiro", () => {
  const cases: [ReleaseTarget, ReleaseFacts][] = [
    [WEB, facts("0.11.0")],
    [WEB, facts("0.11.0", { tags: ["v0.11.0"] })],
    [WEB, facts("0.11.0", { published: ["0.11.0"] })],
    [WEB, facts("0.11.0", { changelog: "# Mudancas\n" })],
    [WEB, facts("0.11.0", { message: VETO })],
    [NATIVE, facts("0.6.0")],
    [NATIVE, facts("0.6.0", { tags: ["native-v0.6.0"] })],
    [NATIVE, facts("0.6.0", { published: ["0.6.0"] })],
    [NATIVE, facts("0.6.0", { changelog: "# Mudancas\n" })],
    [NATIVE, facts("0.6.0", { message: VETO })],
    [MCP, facts("0.1.0")],
    [MCP, facts("0.1.0", { tags: ["mcp-v0.1.0"] })],
    [MCP, facts("0.1.0", { published: ["0.1.0"] })],
    [MCP, facts("0.1.0", { changelog: "# Mudancas\n" })],
    [MCP, facts("0.1.0", { message: VETO })],
  ];

  for (const [target, given] of cases) {
    const decision = decideRelease(target, given);

    expect(decision.release).toBe(decision.verdict === "release");
    expect(decision.reason.length).toBeGreaterThan(40);
  }
});

test("a tabela aponta para os manifestos e os CHANGELOGs que existem", async () => {
  const keys = Object.keys(TARGETS);
  expect(keys.length).toBeGreaterThan(1);

  for (const key of keys) {
    const target = TARGETS[key] as ReleaseTarget;

    expect(await Bun.file(target.manifest).exists()).toBe(true);
    expect(await Bun.file(target.changelog).exists()).toBe(true);
    expect(await Bun.file(`.github/workflows/${target.workflow}`).exists()).toBe(true);
  }

  expect(new Set(keys.map((key) => TARGETS[key]!.prefix)).size).toBe(keys.length);
});

test("o caminho feliz do mcp cria a tag `mcp-v` e chama o release-mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("mcp-v0.1.0");
  expect(decision.reason).toContain("release-mcp.yml");
});

test("a primeira publicacao do mcp passa com o registro vazio, que e o que o 404 vira", () => {
  const decision = decideRelease(
    MCP,
    facts("0.1.0", { published: [], tags: ["v0.15.0", "native-v0.10.0"] }),
  );

  expect(decision.verdict).toBe("release");
  expect(decision.tag).toBe("mcp-v0.1.0");
});

test("a tag que ja existe barra o mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { tags: ["mcp-v0.1.0"] }));

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("mcp/package.json");
});

test("o prefixo separa o mcp dos outros dois: `v0.1.0` e `native-v0.1.0` nao o barram", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { tags: ["v0.1.0", "native-v0.1.0"] }));

  expect(decision.verdict).toBe("release");
});

test("a versao ja publicada barra o mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { published: ["0.1.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.reason).toContain("@rivocode/ui-mcp@0.1.0");
});

test("o CHANGELOG do mcp parado na versao anterior barra a tag", () => {
  const decision = decideRelease(
    MCP,
    facts("0.2.0", { changelog: "# Mudancas\n\n## 0.1.0\n\nA primeira.\n" }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.reason).toContain("mcp/CHANGELOG.md");
});

test(`${VETO} no assunto barra o mcp junto com os outros dois`, () => {
  const message = `chore: bump sem publicar ${VETO}`;

  for (const [target, version] of [
    [WEB, "0.11.0"],
    [NATIVE, "0.6.0"],
    [MCP, "0.1.0"],
  ] as const) {
    expect(decideRelease(target, facts(version, { message })).verdict).toBe("vetoed");
  }
});

test("o tag.yml decide pelos tres pacotes da tabela", async () => {
  const workflow = await Bun.file(".github/workflows/tag.yml").text();
  const matrix = /package:\s*\[([^\]]+)\]/.exec(workflow)?.[1] ?? "";

  expect(
    matrix
      .split(",")
      .map((item) => item.trim())
      .sort(),
  ).toEqual(Object.keys(TARGETS).sort());
});

test("cada workflow de release dispara so pelo prefixo do proprio pacote", async () => {
  const keys = Object.keys(TARGETS);
  expect(keys.length).toBeGreaterThan(2);

  for (const key of keys) {
    const target = TARGETS[key] as ReleaseTarget;
    const workflow = await Bun.file(`.github/workflows/${target.workflow}`).text();

    expect(workflow).toContain(`tags: ["${target.prefix}*"]`);
  }
});
