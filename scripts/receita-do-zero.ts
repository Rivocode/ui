import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";

const REPO = resolve(import.meta.dir, "..");
const NATIVE = join(REPO, "native");
const README = join(NATIVE, "README.md");
const PACKAGE_LINE = "npm install @rivocode/ui-native";
const APP_NAME = "receita";
const OUTPUT_TAIL = 60;

const LAYOUT = `import "../../generated.css";
import { Stack } from "expo-router";
import { RivoProvider } from "@rivocode/ui-native";

export default function RootLayout() {
  return (
    <RivoProvider theme="system">
      <Stack screenOptions={{ headerShown: false }} />
    </RivoProvider>
  );
}
`;

const SCREEN = `import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Field, Input } from "@rivocode/ui-native";

export default function Home() {
  const [name, setName] = useState("");

  return (
    <View className="flex-1 justify-center gap-4 bg-bg p-4">
      <Card>
        <Field label="Nome">
          <Input value={name} onChangeText={setName} placeholder="Como você se chama" />
        </Field>
        <Button onPress={() => setName("")}>Limpar</Button>
      </Card>
      <View className="h-[72px] rounded-md border border-dashed border-border" />
    </View>
  );
}
`;

type Step = { name: string; run: () => string | void };

function fail(name: string, detail: string): never {
  console.error(`FALHOU  ${name}`);
  console.error("");
  console.error(detail.trimEnd());
  process.exit(1);
}

function tail(text: string) {
  const lines = text.trimEnd().split("\n");
  return lines.slice(-OUTPUT_TAIL).join("\n");
}

const ENV = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !/^(npm_|bun_)/i.test(key)),
);

function sh(command: string, cwd: string) {
  const result = Bun.spawnSync(["sh", "-c", command], {
    cwd,
    env: { ...ENV, CI: "1", EXPO_NO_TELEMETRY: "1", npm_config_yes: "true" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const output = `${result.stdout.toString()}${result.stderr.toString()}`;
  if (result.exitCode !== 0) {
    throw new Error(`\`${command}\` saiu com codigo ${result.exitCode}:\n\n${tail(output)}`);
  }
  return output;
}

function readmeCommands(tarball: string) {
  const text = readFileSync(README, "utf8");
  const start = text.indexOf("\n## Instalação");
  if (start < 0) throw new Error(`${relative(REPO, README)} nao tem a secao "## Instalação".`);

  const block = /```sh\n([\s\S]*?)```/.exec(text.slice(start));
  if (!block) throw new Error(`A secao "## Instalação" de ${relative(REPO, README)} nao tem bloco \`\`\`sh.`);

  const lines = block[1]!
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  const swaps = lines.filter((line) => line === PACKAGE_LINE).length;
  if (swaps !== 1) {
    throw new Error(
      `O bloco de instalacao do README tem ${swaps} linha(s) \`${PACKAGE_LINE}\`, e a receita espera exatamente uma para trocar pelo tarball:\n\n${lines.join("\n")}`,
    );
  }

  return lines.map((line) => (line === PACKAGE_LINE ? `npm install ${tarball}` : line));
}

const target = process.argv[2];
if (!target) {
  console.error("Uso: bun run scripts/receita-do-zero.ts <pasta-vazia-fora-do-repositorio>");
  process.exit(1);
}

const root = resolve(target);
const inside = relative(REPO, root);
if (!inside.startsWith("..") && !isAbsolute(inside)) {
  console.error(
    `${root} esta dentro do repositorio. O app tem que nascer fora dele, como nasce na maquina de quem instala - aqui o npm e o metro achariam o workspace da raiz.`,
  );
  process.exit(1);
}
if (existsSync(root) && readdirSync(root).length > 0) {
  console.error(`${root} nao esta vazia. Passe uma pasta nova ou vazia.`);
  process.exit(1);
}
mkdirSync(root, { recursive: true });

const app = join(root, APP_NAME);
let tarball = "";
let commands: string[] = [];

const steps: Step[] = [
  {
    name: "npm pack do native/",
    run: () => {
      const output = sh(`npm pack --json --pack-destination "${root}"`, NATIVE);
      const [packed] = JSON.parse(output.slice(output.indexOf("["))) as { filename: string }[];
      tarball = join(root, packed!.filename);
      if (!existsSync(tarball)) throw new Error(`O npm pack disse ${packed!.filename}, e o arquivo nao esta em ${root}.`);
      return packed!.filename;
    },
  },
  {
    name: "comandos de instalacao do native/README.md",
    run: () => {
      commands = readmeCommands(tarball);
      return `${commands.length} comandos`;
    },
  },
  {
    name: "npx create-expo-app@latest",
    run: () => {
      sh(`npx --yes create-expo-app@latest ${APP_NAME} --yes`, root);
      if (!existsSync(join(app, "src", "app"))) {
        throw new Error(`O template novo do Expo nao trouxe src/app/ em ${app}, e a tela minima mora la.`);
      }
      if (!existsSync(join(app, "package-lock.json")) || existsSync(join(app, "bun.lock"))) {
        throw new Error("O app nao nasceu com o npm: o create-expo-app escolhe o gerenciador pelo `npm_config_user_agent`, e a receita mede o caminho de quem usa npm.");
      }
    },
  },
];

const install: Step[] = [
  {
    name: "npm install de novo, para o override do lightningcss valer",
    run: () => void sh("npm install", app),
  },
  {
    name: "tela minima em src/app",
    run: () => {
      writeFileSync(join(app, "src", "app", "_layout.tsx"), LAYOUT);
      writeFileSync(join(app, "src", "app", "index.tsx"), SCREEN);
    },
  },
  {
    name: "npx rivocode-ui-native-css",
    run: () => {
      sh("npx rivocode-ui-native-css", app);
      const css = readFileSync(join(app, "generated.css"), "utf8");
      for (const selector of [".border-dashed", ".h-\\[72px\\]"]) {
        if (!css.includes(selector)) {
          throw new Error(`O generated.css saiu sem \`${selector}\`, que a tela de src/app usa: o export passaria sem a classe chegar ao compilador nativo.`);
        }
      }
    },
  },
  { name: "npx tsc --noEmit", run: () => void sh("npx tsc --noEmit", app) },
  {
    name: "npx expo export --platform ios",
    run: () => void sh(`npx expo export --platform ios --output-dir "${join(root, "export-ios")}"`, app),
  },
  {
    name: "npx expo export --platform web",
    run: () => void sh(`npx expo export --platform web --output-dir "${join(root, "export-web")}"`, app),
  },
];

function execute(step: Step) {
  const started = performance.now();
  try {
    const note = step.run();
    const seconds = ((performance.now() - started) / 1000).toFixed(1);
    console.log(`OK      ${step.name} (${seconds}s)${note ? ` - ${note}` : ""}`);
  } catch (error) {
    fail(step.name, error instanceof Error ? error.message : String(error));
  }
}

console.log(`Receita do zero em ${root}\n`);

for (const step of steps) execute(step);
for (const command of commands) execute({ name: command, run: () => void sh(command, app) });
for (const step of install) execute(step);

console.log(`\nA receita do README chega ao fim num Expo novo, com o ${basename(tarball)}.`);
