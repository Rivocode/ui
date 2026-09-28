import { appendFileSync } from "node:fs";

export const VETO = "[no-release]";

export type ReleaseTarget = {
  /** The name in the registry, as `npm view` asks for it. */
  npmName: string;
  /** The manifest that carries this package's version. */
  manifest: string;
  /** The CHANGELOG that has to open with the version's section. */
  changelog: string;
  /** What comes before the number in the tag, and what separates the packages. */
  prefix: string;
  /** The workflow file that publishes this package. */
  workflow: string;
};

export const TARGETS: Record<string, ReleaseTarget> = {
  web: {
    npmName: "@rivocode/ui",
    manifest: "package.json",
    changelog: "CHANGELOG.md",
    prefix: "v",
    workflow: "release.yml",
  },
  native: {
    npmName: "@rivocode/ui-native",
    manifest: "native/package.json",
    changelog: "native/CHANGELOG.md",
    prefix: "native-v",
    workflow: "release-native.yml",
  },
  mcp: {
    npmName: "@rivocode/ui-mcp",
    manifest: "mcp/package.json",
    changelog: "mcp/CHANGELOG.md",
    prefix: "mcp-v",
    workflow: "release-mcp.yml",
  },
};

export type ReleaseFacts = {
  /** The version the manifest declares now. */
  version: string;
  /** The tags that already exist, here and on `origin`, with no prefix removed. */
  tags: string[];
  /** The versions the registry already serves for this package. */
  published: string[];
  /** The whole text of the package's CHANGELOG. */
  changelog: string;
  /**
   * The whole message of the head commit. Only the SUBJECT - the first line -
   * is searched for the mark, because the body is prose: the commit that
   * created this automation explained the valve, wrote the mark in the middle
   * of the text, and was blocked by it.
   */
  message: string;
};

export type ReleaseVerdict =
  | "release"
  | "vetoed"
  | "tag-exists"
  | "already-published"
  | "changelog-open";

export type ReleaseDecision = {
  /** The tag that would be born, whether it exists or not. */
  tag: string;
  /** Which of the four guards blocked, or `release` when none did. */
  verdict: ReleaseVerdict;
  /** Whether the tag should be born and the publishing workflow called. */
  release: boolean;
  /** What was done, or why it was not, in one sentence. */
  reason: string;
};

export const HEADLINE: Record<ReleaseVerdict, string> = {
  release: "cleared: the tag is born and the release is called",
  vetoed: `blocked by ${VETO}`,
  "tag-exists": "nothing to do",
  "already-published": "blocked: the version is already on npm",
  "changelog-open": "blocked: the CHANGELOG is not closed",
};

export function topSection(changelog: string): string | undefined {
  return changelog.match(/^##\s+(\S.*?)\s*$/m)?.[1];
}

function barred(tag: string, verdict: ReleaseVerdict, reason: string): ReleaseDecision {
  return { tag, verdict, release: false, reason };
}

export function decideRelease(target: ReleaseTarget, facts: ReleaseFacts): ReleaseDecision {
  const tag = `${target.prefix}${facts.version}`;

  const subject = facts.message.split("\n", 1)[0] ?? "";

  if (subject.toLowerCase().includes(VETO)) {
    return barred(
      tag,
      "vetoed",
      `The head commit's subject has ${VETO}, so the tag ${tag} is not born.` +
        " A bump without publishing is the committer's choice, and the valve exists for that.",
    );
  }

  if (facts.tags.includes(tag)) {
    return barred(
      tag,
      "tag-exists",
      `The tag ${tag} already exists. The version in ${target.manifest} has not changed since the last` +
        " publication, and recreating the tag would republish the same number.",
    );
  }

  if (facts.published.includes(facts.version)) {
    return barred(
      tag,
      "already-published",
      `The registry already serves ${target.npmName}@${facts.version}. A publication on npm cannot` +
        " be undone and the same number cannot be overwritten - the fix is a new version, not" +
        " a new tag on top of the old version.",
    );
  }

  const top = topSection(facts.changelog);

  if (top !== facts.version) {
    return barred(
      tag,
      "changelog-open",
      `${target.changelog} does not open with "## ${facts.version}": ` +
        (top === undefined ? "it has no section at all." : `the top section is "## ${top}".`) +
        " Close the CHANGELOG before publishing - it ships with the version, and anything incomplete" +
        " there is a surprise on the screen of whoever migrates.",
    );
  }

  return {
    tag,
    verdict: "release",
    release: true,
    reason:
      `Version ${facts.version} is new to the registry, ${target.changelog} opens with its` +
      ` section and the tag ${tag} does not exist yet. Creating ${tag} and calling ${target.workflow}.`,
  };
}

type Capture = { code: number; text: string; error: string };

async function capture(command: string[]): Promise<Capture> {
  const child = Bun.spawn(command, { stdout: "pipe", stderr: "pipe" });
  const [text, error] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  await child.exited;

  return { code: child.exitCode ?? 1, text, error };
}

function giveUp(what: string, command: string[], run: Capture): never {
  console.error(
    `Could not measure ${what}: \`${command.join(" ")}\` exited with ${run.code}.\n\n` +
      "The decision does not proceed without this measurement. A guard that cannot measure and answers\n" +
      '"go ahead and publish" is worse than no guard: it creates the tag for lack of an\n' +
      "answer, and a publication on npm cannot be undone.\n\n" +
      run.error.trim(),
  );
  process.exit(1);
}

async function measured(what: string, command: string[]): Promise<string> {
  const run = await capture(command);
  if (run.code !== 0) giveUp(what, command, run);

  return run.text;
}

async function knownTags(): Promise<string[]> {
  const local = (await measured("the local tags", ["git", "tag", "--list"])).split("\n");

  const remote = [
    ...(await measured("the origin tags", ["git", "ls-remote", "--tags", "origin"])).matchAll(
      /refs\/tags\/(\S+?)(?:\^\{\})?$/gm,
    ),
  ].map((hit) => hit[1]!);

  return [...new Set([...local, ...remote].map((name) => name.trim()).filter(Boolean))];
}

async function publishedVersions(npmName: string): Promise<string[]> {
  const command = ["npm", "view", npmName, "versions", "--json"];
  const run = await capture(command);
  const raw = run.text.trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = undefined;
  }

  if (run.code !== 0) {
    const failure = parsed as { error?: { code?: string } } | undefined;
    if (failure?.error?.code === "E404") return [];

    giveUp(`the versions of ${npmName} in the registry`, command, run);
  }

  if (typeof parsed === "string") return [parsed];
  if (Array.isArray(parsed)) return parsed as string[];

  giveUp(`the versions of ${npmName} in the registry`, command, {
    ...run,
    error: `The response was not a list of versions: ${raw.slice(0, 200)}`,
  });
}

function emit(file: string | undefined, text: string) {
  if (file) appendFileSync(file, text);
}

if (import.meta.main) {
  const key = process.argv[2] ?? "";
  const target = TARGETS[key];

  if (!target) {
    console.error(
      `Unknown package: "${key}". Pick one of ${Object.keys(TARGETS).join(", ")}.`,
    );
    process.exit(1);
  }

  const manifest = (await Bun.file(target.manifest).json()) as { version: string };

  const decision = decideRelease(target, {
    version: manifest.version,
    tags: await knownTags(),
    published: await publishedVersions(target.npmName),
    changelog: await Bun.file(target.changelog).text(),
    message: await measured("the head commit message", ["git", "log", "-1", "--pretty=%B"]),
  });

  console.log(`${target.npmName} ${manifest.version} - ${HEADLINE[decision.verdict]}`);
  console.log(decision.reason);

  emit(
    process.env["GITHUB_STEP_SUMMARY"],
    `### \`${target.npmName}\` ${manifest.version} - ${HEADLINE[decision.verdict]}\n\n` +
      `${decision.reason}\n\n`,
  );

  emit(
    process.env["GITHUB_OUTPUT"],
    `release=${decision.release}\ntag=${decision.tag}\nworkflow=${target.workflow}\n` +
      `verdict=${decision.verdict}\n`,
  );
}
