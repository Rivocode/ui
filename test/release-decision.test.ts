import { expect, test } from "bun:test";

import {
  decideRelease,
  TARGETS,
  topSection,
  VETO,
  type ReleaseFacts,
  type ReleaseTarget,
} from "../scripts/release-decision";

const WEB = TARGETS["web"] as ReleaseTarget;
const NATIVE = TARGETS["native"] as ReleaseTarget;
const MCP = TARGETS["mcp"] as ReleaseTarget;

function facts(version: string, over: Partial<ReleaseFacts> = {}): ReleaseFacts {
  return {
    version,
    tags: [],
    published: [],
    changelog: `# Changes\n\n## ${version}\n\n### Fixed: something\n\nText.\n`,
    message: "feat: the new component is born in both packages",
    ...over,
  };
}

test("the web happy path creates the `v` tag and calls release", () => {
  const decision = decideRelease(WEB, facts("0.11.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("v0.11.0");
  expect(decision.reason).toContain("release.yml");
});

test("the native happy path creates the `native-v` tag and calls release-native", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("native-v0.6.0");
  expect(decision.reason).toContain("release-native.yml");
});

test("an existing tag blocks web", () => {
  const decision = decideRelease(WEB, facts("0.11.0", { tags: ["v0.10.0", "v0.11.0"] }));

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("v0.11.0");
});

test("an existing tag blocks native", () => {
  const decision = decideRelease(
    NATIVE,
    facts("0.6.0", { tags: ["native-v0.5.0", "native-v0.6.0"] }),
  );

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
});

test("the prefix separates the two packages: the web tag does not block native", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { tags: ["v0.6.0"] }));

  expect(decision.verdict).toBe("release");
  expect(decision.tag).toBe("native-v0.6.0");
});

test("an already published version blocks web, and says publishing cannot be undone", () => {
  const decision = decideRelease(WEB, facts("0.11.0", { published: ["0.10.0", "0.11.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("@rivocode/ui@0.11.0");
  expect(decision.reason).toContain("cannot be undone");
});

test("an already published version blocks native", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { published: ["0.6.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.reason).toContain("@rivocode/ui-native@0.6.0");
});

test("a web CHANGELOG stuck at the previous version blocks the tag", () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", { changelog: "# Changes\n\n## 0.10.0\n\nThe previous version.\n" }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain('"## 0.10.0"');
});

test("a native CHANGELOG with no section at all blocks the tag", () => {
  const decision = decideRelease(NATIVE, facts("0.6.0", { changelog: "# Changes\n" }));

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.reason).toContain("it has no section at all");
});

test("the version section must be at the TOP, and not anywhere", () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", {
      changelog: "# Changes\n\n## 0.10.0\n\nThe previous one.\n\n## 0.11.0\n\nThe new one, in the wrong place.\n",
    }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.release).toBe(false);
});

test("a third-level heading does not count as the top section", () => {
  expect(topSection("# Changes\n\n### Fixed: nothing\n\n## 0.11.0\n")).toBe("0.11.0");
});

test(`${VETO} only in the BODY does not block: that is how the automation vetoed itself`, () => {
  const message =
    `ci: the tag is born from the green gate\n\n` +
    `The escape valve is writing ${VETO} in the commit subject.`;

  expect(decideRelease(WEB, facts("0.11.0", { message })).release).toBe(true);
  expect(decideRelease(NATIVE, facts("0.6.0", { message })).release).toBe(true);
});

test(`${VETO} in the commit message blocks web`, () => {
  const decision = decideRelease(
    WEB,
    facts("0.11.0", { message: `chore: the bump waits for the rest ${VETO}` }),
  );

  expect(decision.verdict).toBe("vetoed");
  expect(decision.release).toBe(false);
});

test(`${VETO} in the commit message blocks native, in any case`, () => {
  const decision = decideRelease(
    NATIVE,
    facts("0.6.0", { message: "chore: bump [NO-RELEASE]\n\nMessage body." }),
  );

  expect(decision.verdict).toBe("vetoed");
  expect(decision.release).toBe(false);
});

test("every blocked decision returns release false, and every allowed one returns true", () => {
  const cases: [ReleaseTarget, ReleaseFacts][] = [
    [WEB, facts("0.11.0")],
    [WEB, facts("0.11.0", { tags: ["v0.11.0"] })],
    [WEB, facts("0.11.0", { published: ["0.11.0"] })],
    [WEB, facts("0.11.0", { changelog: "# Changes\n" })],
    [WEB, facts("0.11.0", { message: VETO })],
    [NATIVE, facts("0.6.0")],
    [NATIVE, facts("0.6.0", { tags: ["native-v0.6.0"] })],
    [NATIVE, facts("0.6.0", { published: ["0.6.0"] })],
    [NATIVE, facts("0.6.0", { changelog: "# Changes\n" })],
    [NATIVE, facts("0.6.0", { message: VETO })],
    [MCP, facts("0.1.0")],
    [MCP, facts("0.1.0", { tags: ["mcp-v0.1.0"] })],
    [MCP, facts("0.1.0", { published: ["0.1.0"] })],
    [MCP, facts("0.1.0", { changelog: "# Changes\n" })],
    [MCP, facts("0.1.0", { message: VETO })],
  ];

  for (const [target, given] of cases) {
    const decision = decideRelease(target, given);

    expect(decision.release).toBe(decision.verdict === "release");
    expect(decision.reason.length).toBeGreaterThan(40);
  }
});

test("the table points at manifests and CHANGELOGs that exist", async () => {
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

test("the mcp happy path creates the `mcp-v` tag and calls release-mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0"));

  expect(decision.verdict).toBe("release");
  expect(decision.release).toBe(true);
  expect(decision.tag).toBe("mcp-v0.1.0");
  expect(decision.reason).toContain("release-mcp.yml");
});

test("the first mcp publish passes with an empty registry, which is what the 404 becomes", () => {
  const decision = decideRelease(
    MCP,
    facts("0.1.0", { published: [], tags: ["v0.15.0", "native-v0.10.0"] }),
  );

  expect(decision.verdict).toBe("release");
  expect(decision.tag).toBe("mcp-v0.1.0");
});

test("an existing tag blocks mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { tags: ["mcp-v0.1.0"] }));

  expect(decision.verdict).toBe("tag-exists");
  expect(decision.release).toBe(false);
  expect(decision.reason).toContain("mcp/package.json");
});

test("the prefix separates mcp from the other two: `v0.1.0` and `native-v0.1.0` do not block it", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { tags: ["v0.1.0", "native-v0.1.0"] }));

  expect(decision.verdict).toBe("release");
});

test("an already published version blocks mcp", () => {
  const decision = decideRelease(MCP, facts("0.1.0", { published: ["0.1.0"] }));

  expect(decision.verdict).toBe("already-published");
  expect(decision.reason).toContain("@rivocode/ui-mcp@0.1.0");
});

test("an mcp CHANGELOG stuck at the previous version blocks the tag", () => {
  const decision = decideRelease(
    MCP,
    facts("0.2.0", { changelog: "# Changes\n\n## 0.1.0\n\nThe first one.\n" }),
  );

  expect(decision.verdict).toBe("changelog-open");
  expect(decision.reason).toContain("mcp/CHANGELOG.md");
});

test(`${VETO} in the subject blocks mcp along with the other two`, () => {
  const message = `chore: bump without publishing ${VETO}`;

  for (const [target, version] of [
    [WEB, "0.11.0"],
    [NATIVE, "0.6.0"],
    [MCP, "0.1.0"],
  ] as const) {
    expect(decideRelease(target, facts(version, { message })).verdict).toBe("vetoed");
  }
});

test("tag.yml decides for the three packages in the table", async () => {
  const workflow = await Bun.file(".github/workflows/tag.yml").text();
  const matrix = /package:\s*\[([^\]]+)\]/.exec(workflow)?.[1] ?? "";

  expect(
    matrix
      .split(",")
      .map((item) => item.trim())
      .sort(),
  ).toEqual(Object.keys(TARGETS).sort());
});

test("each release workflow fires only on its own package prefix", async () => {
  const keys = Object.keys(TARGETS);
  expect(keys.length).toBeGreaterThan(2);

  for (const key of keys) {
    const target = TARGETS[key] as ReleaseTarget;
    const workflow = await Bun.file(`.github/workflows/${target.workflow}`).text();

    expect(workflow).toContain(`tags: ["${target.prefix}*"]`);
  }
});
