import { appendFileSync } from "node:fs";

export const VETO = "[no-release]";

export type ReleaseTarget = {
  /** O nome no registro, como `npm view` o pede. */
  npmName: string;
  /** O manifesto que carrega a versao deste pacote. */
  manifest: string;
  /** O CHANGELOG que precisa abrir com a secao da versao. */
  changelog: string;
  /** O que vem antes do numero na tag, e o que separa os dois pacotes. */
  prefix: string;
  /** O arquivo de workflow que publica este pacote. */
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
};

export type ReleaseFacts = {
  /** A versao que o manifesto declara agora. */
  version: string;
  /** As tags que ja existem, aqui e no `origin`, sem prefixo removido. */
  tags: string[];
  /** As versoes que o registro ja serve para este pacote. */
  published: string[];
  /** O texto inteiro do CHANGELOG do pacote. */
  changelog: string;
  /** A mensagem do commit da cabeca. */
  /**
   * A mensagem inteira do commit da cabeca. So o ASSUNTO - a primeira linha -
   * e lido atras da marca, porque o corpo e prosa: o commit que criou esta
   * automacao explicava a valvula, escreveu a marca no meio do texto, e foi
   * barrado por ela.
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
  /** A tag que nasceria, exista ela ou nao. */
  tag: string;
  /** Qual das quatro guardas barrou, ou `release` quando nenhuma barrou. */
  verdict: ReleaseVerdict;
  /** Se a tag deve nascer e o workflow de publicacao ser chamado. */
  release: boolean;
  /** O que foi feito, ou por que nao foi, em uma frase. */
  reason: string;
};

export const HEADLINE: Record<ReleaseVerdict, string> = {
  release: "liberado: a tag nasce e o release e chamado",
  vetoed: `barrado por ${VETO}`,
  "tag-exists": "nada a fazer",
  "already-published": "barrado: a versao ja esta no npm",
  "changelog-open": "barrado: o CHANGELOG nao esta fechado",
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
      `O assunto do commit da cabeca tem ${VETO}, entao a tag ${tag} nao nasce.` +
        " Bump sem publicacao e escolha de quem comitou, e a valvula existe para isso.",
    );
  }

  if (facts.tags.includes(tag)) {
    return barred(
      tag,
      "tag-exists",
      `A tag ${tag} ja existe. A versao de ${target.manifest} nao mudou desde a ultima` +
        " publicacao, e recriar a tag republicaria o mesmo numero.",
    );
  }

  if (facts.published.includes(facts.version)) {
    return barred(
      tag,
      "already-published",
      `O registro ja serve ${target.npmName}@${facts.version}. Publicacao no npm nao se` +
        " desfaz e o mesmo numero nao se sobrescreve - o conserto e uma versao nova, e nao" +
        " uma tag nova sobre a versao velha.",
    );
  }

  const top = topSection(facts.changelog);

  if (top !== facts.version) {
    return barred(
      tag,
      "changelog-open",
      `${target.changelog} nao abre com "## ${facts.version}": ` +
        (top === undefined ? "nao ha secao nenhuma nele." : `a secao do topo e "## ${top}".`) +
        " Feche o CHANGELOG antes de publicar - ele sai junto com a versao, e incompleto" +
        " ali e surpresa na tela de quem migra.",
    );
  }

  return {
    tag,
    verdict: "release",
    release: true,
    reason:
      `A versao ${facts.version} e inedita no registro, ${target.changelog} abre com a secao` +
      ` dela e a tag ${tag} ainda nao existe. Criando ${tag} e chamando ${target.workflow}.`,
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
    `Nao deu para medir ${what}: \`${command.join(" ")}\` saiu com ${run.code}.\n\n` +
      "A decisao nao segue sem esta medida. Guarda que nao consegue medir e responde\n" +
      '"pode publicar" e pior do que guarda nenhuma: ela cria a tag por falta de\n' +
      "resposta, e publicacao no npm nao se desfaz.\n\n" +
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
  const local = (await measured("as tags locais", ["git", "tag", "--list"])).split("\n");

  const remote = [
    ...(
      await measured("as tags do origin", ["git", "ls-remote", "--tags", "origin"])
    ).matchAll(/refs\/tags\/(\S+?)(?:\^\{\})?$/gm),
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

    giveUp(`as versoes de ${npmName} no registro`, command, run);
  }

  if (typeof parsed === "string") return [parsed];
  if (Array.isArray(parsed)) return parsed as string[];

  giveUp(`as versoes de ${npmName} no registro`, command, {
    ...run,
    error: `A resposta nao era uma lista de versoes: ${raw.slice(0, 200)}`,
  });
}

function emit(file: string | undefined, text: string) {
  if (file) appendFileSync(file, text);
}

if (import.meta.main) {
  const key = process.argv[2] ?? "";
  const target = TARGETS[key];

  if (!target) {
    console.error(`Pacote desconhecido: "${key}". Escolha um de ${Object.keys(TARGETS).join(", ")}.`);
    process.exit(1);
  }

  const manifest = (await Bun.file(target.manifest).json()) as { version: string };

  const decision = decideRelease(target, {
    version: manifest.version,
    tags: await knownTags(),
    published: await publishedVersions(target.npmName),
    changelog: await Bun.file(target.changelog).text(),
    message: await measured("a mensagem do commit da cabeca", [
      "git",
      "log",
      "-1",
      "--pretty=%B",
    ]),
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
