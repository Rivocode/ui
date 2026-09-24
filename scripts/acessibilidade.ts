import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CHROME } from "./retratos";
import { servir } from "./serve";
import { scanAtLeast } from "./varredura";

const IGNORED_RULES: Record<string, string> = {
  region:
    "A vitrine empilha amostras soltas numa pagina sem `main`: conteudo fora de marco e o layout da vitrine, e nao da peca. O `AppShell` que desenha marco tem teste proprio.",
  "landmark-one-main":
    "Mesma razao do `region`: a pagina de vitrine nao e aplicacao, e quem poe o `main` e a tela de quem consome.",
  "landmark-no-duplicate-banner":
    "A vitrine repete a mesma amostra por tema e por densidade, e cada `AppShell` desenha o proprio `header`.",
  "landmark-no-duplicate-main":
    "Mesma razao do anterior, para o `main` do `AppShell` e do menu de navegacao repetidos por amostra.",
  "landmark-unique":
    "Marco com o mesmo nome e a amostra repetida por tema e densidade - o carrossel \"Planos\" do escuro e o do claro -, e nao duas navegacoes de verdade na mesma tela.",
  "page-has-heading-one":
    "A pagina de vitrine abre cada amostra com o nome da secao; o `h1` e da tela de quem consome.",
};

const EXEMPT_FROM_CONTRAST =
  "Texto de componente inativo nao entra na 1.4.3: o axe so reconhece `disabled` nativo, e as pecas marcam o inativo com `data-disabled` e `aria-disabled` no controle de fora.";

type FocusTarget = {
  page: string;
  name: string;
  presses?: number;
};

const FOCUS_TARGETS: FocusTarget[] = [
  { page: "dados", name: "Remover nf-e" },
  { page: "dados", name: "Próxima página", presses: 3 },
  { page: "flutuantes", name: "Fechar aviso" },
  { page: "ia", name: "Próxima", presses: 3 },
  { page: "novas", name: "Próximo slide", presses: 4 },
  { page: "novas", name: "Limpar seleção" },
  { page: "novas", name: "Fechar aviso" },
  { page: "novas", name: "Aceitar todos" },
  { page: "novas", name: "Remover filtro Situacao: Em aberto" },
  { page: "novas", name: "Limpar 1 filtro" },
  { page: "novas", name: "Marcar como lida" },
  { page: "novas", name: "Marcar todas como lidas" },
  { page: "novas", name: "Excluir a nota 4813" },
];

const MIN_TARGET = 24;

const REFLOW_WIDTH = 320;

const DESK = { width: 1240, height: 900 };

const pickedFlag = process.argv.indexOf("--pagina");
const picked = pickedFlag === -1 ? "" : (process.argv[pickedFlag + 1] ?? "");

const FRAMES = new Set(["demo/celular.html", "demo/secao.html"]);

const pages = (await scanAtLeast("demo/*.html", 15))
  .filter((file) => !FRAMES.has(file))
  .map((file) => file.replace(/^demo\//, "").replace(/\.html$/, ""))
  .filter((page) => page.includes(picked))
  .sort();

if (pages.length === 0) {
  console.error(`Nenhuma pagina de demo/ casa com "${picked}".`);
  process.exit(1);
}

if (!(await Bun.file("demo/dist/demo.css").exists())) {
  console.error("demo/dist nao existe. Rode `bun run demo` antes, ou use `bun run a11y`.");
  process.exit(1);
}

for (const target of FOCUS_TARGETS) {
  if (!pages.includes(target.page) && picked === "") {
    console.error(`FOCUS_TARGETS cita a pagina "${target.page}", que nao existe em demo/.`);
    process.exit(1);
  }
}

const axeSource = await Bun.file(require.resolve("axe-core/axe.min.js")).text();

type Pending = { resolve: (value: any) => void; reject: (error: Error) => void };

async function launchChrome() {
  const profile = mkdtempSync(join(tmpdir(), "rc-a11y-"));
  const proc = Bun.spawn(
    [
      CHROME,
      "--headless=new",
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--hide-scrollbars",
      "--force-prefers-reduced-motion",
      "about:blank",
    ],
    { stderr: "pipe", stdout: "ignore" },
  );

  const reader = proc.stderr.getReader();
  const decoder = new TextDecoder();
  let seen = "";
  let browserUrl = "";
  const deadline = Date.now() + 15000;
  while (!browserUrl && Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    seen += decoder.decode(value);
    browserUrl = /DevTools listening on (ws:\/\/\S+)/.exec(seen)?.[1] ?? "";
  }
  reader.releaseLock();
  if (!browserUrl) throw new Error(`o Chrome nao abriu a porta de depuracao:\n${seen}`);

  const port = new URL(browserUrl).port;
  const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as {
    type: string;
    webSocketDebuggerUrl: string;
  }[];
  const tab = list.find((entry) => entry.type === "page");
  if (!tab) throw new Error("o Chrome abriu sem aba");

  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  let next = 0;
  const pending = new Map<number, Pending>();
  socket.onmessage = (event) => {
    const message = JSON.parse(String(event.data));
    const waiting = message.id ? pending.get(message.id) : undefined;
    if (!waiting) return;
    pending.delete(message.id);
    if (message.error) waiting.reject(new Error(JSON.stringify(message.error)));
    else waiting.resolve(message.result);
  };

  const send = (method: string, params: Record<string, unknown> = {}) =>
    new Promise<any>((resolve, reject) => {
      const id = ++next;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async <T>(expression: string): Promise<T> => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ?? result.exceptionDetails.text,
      );
    }
    return result.result.value as T;
  };

  const press = async (key: "Enter") => {
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code: key,
      windowsVirtualKeyCode: 13,
      text: "\r",
    });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key, windowsVirtualKeyCode: 13 });
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  const close = () => {
    socket.close();
    proc.kill();
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  };

  return { send, evaluate, press, close };
}

const server = servir();
const chrome = await launchChrome();

async function open(page: string, width: number, height: number) {
  await chrome.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await chrome.send("Page.navigate", {
    url: `http://127.0.0.1:${server.port}/${page}.html?${Date.now()}`,
  });
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    await Bun.sleep(150);
    const ready = await chrome
      .evaluate<boolean>(
        `document.readyState === "complete" && (document.getElementById("root")?.childElementCount ?? 0) > 0`,
      )
      .catch(() => false);
    if (ready) break;
  }
  await chrome.evaluate(`document.fonts.ready.then(() => true)`);
  await Bun.sleep(800);
}

type AxeViolation = { id: string; impact: string; help: string; nodes: { target: string; summary: string }[] };

async function runAxe() {
  await chrome.evaluate(`${axeSource};true`);
  const rules = Object.fromEntries(Object.keys(IGNORED_RULES).map((id) => [id, { enabled: false }]));
  return chrome.evaluate<AxeViolation[]>(`axe
    .run(document, { resultTypes: ["violations"], rules: ${JSON.stringify(rules)} })
    .then((result) => result.violations.map((violation) => violation.id !== "color-contrast" ? violation : {
      ...violation,
      nodes: violation.nodes.filter((node) => {
        const element = node.target.length === 1 ? document.querySelector(node.target[0]) : null;
        return !element?.closest('[data-disabled], [aria-disabled="true"], :disabled');
      }),
    }).filter((violation) => violation.nodes.length > 0).map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => {
        const element = node.target.length === 1 ? document.querySelector(node.target[0]) : null;
        const where = [
          element?.closest("[data-rc-theme]")?.getAttribute("data-rc-theme"),
          element?.closest("[data-rc-density]")?.getAttribute("data-rc-density"),
          element?.closest("[data-rc-shot]")?.getAttribute("data-rc-shot"),
        ].filter(Boolean).join(" / ");
        const selector = String(node.target.at(-1)).split(" > ").slice(-2).join(" > ");
        return {
          target: (where ? "[" + where + "] " : "") + selector,
          summary: (node.failureSummary || "").split("\\n").slice(1).join(" ").trim(),
        };
      }),
    })))`);
}

type SmallTarget = { label: string; size: string };

const TARGET_PROBE = `(() => {
  const min = ${MIN_TARGET};
  const inSentence = (element) => {
    if (!getComputedStyle(element).display.startsWith("inline")) return false;
    let block = element.parentElement;
    while (block && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
    if (!block) return false;
    const own = (element.textContent || "").trim().length;
    return (block.textContent || "").trim().length > own + 1;
  };
  const describe = (element) => {
    const role = element.getAttribute("role");
    const name =
      element.getAttribute("aria-label") ||
      (element.getAttribute("aria-labelledby") &&
        document.getElementById(element.getAttribute("aria-labelledby").split(" ")[0])?.textContent) ||
      element.textContent ||
      element.getAttribute("title") ||
      "";
    return element.tagName.toLowerCase() + (role ? "[role=" + role + "]" : "") + ' "' + name.trim().replace(/\\s+/g, " ").slice(0, 40) + '"';
  };
  const found = [];
  for (const element of document.querySelectorAll('[role="radio"], button, a[href]')) {
    if (element.closest('[aria-hidden="true"], [inert]')) continue;
    if (element.disabled || element.getAttribute("aria-disabled") === "true") continue;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none" || style.pointerEvents === "none") continue;
    const own = element.getBoundingClientRect();
    if (own.width <= 1 || own.height <= 1) continue;
    const label = element.closest("label");
    const box = label ? label.getBoundingClientRect() : own;
    if (box.width >= min && box.height >= min) continue;
    if (element.getAttribute("role") !== "radio" && inSentence(element)) continue;
    found.push({ label: describe(element), size: Math.round(box.width) + "x" + Math.round(box.height) });
  }
  return found;
})()`;

const REFLOW_PROBE = `(() => {
  const width = document.documentElement.clientWidth;
  const scroll = document.documentElement.scrollWidth;
  if (scroll <= width + 1) return null;
  const clipped = (element) => {
    let escaping = getComputedStyle(element).position === "absolute";
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (escaping) {
        if (style.position === "static") continue;
        escaping = false;
      }
      if (style.overflowX !== "visible") return true;
    }
    return false;
  };
  const culprits = [];
  for (const element of document.body.querySelectorAll("*")) {
    const box = element.getBoundingClientRect();
    if (box.width === 0 || box.right <= width + 1) continue;
    if (getComputedStyle(element).position === "fixed" || clipped(element)) continue;
    const parent = element.parentElement;
    const parentBox = parent?.getBoundingClientRect();
    if (parent && parent !== document.body && parentBox && parentBox.right > width + 1 && !clipped(parent)) continue;
    const name = element.tagName.toLowerCase() + (element.id ? "#" + element.id : "") +
      (typeof element.className === "string" && element.className ? "." + element.className.trim().split(/\\s+/).slice(0, 4).join(".") : "");
    const heading = [...document.querySelectorAll("h1, h2, h3, h4")]
      .filter((candidate) => candidate.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
      .at(-1);
    const section = element.closest("[data-rc-shot]")?.getAttribute("data-rc-shot") ?? heading?.textContent?.trim() ?? "";
    culprits.push(name + " ate x=" + Math.round(box.right) + (section ? ' (depois de "' + section.slice(0, 40) + '")' : ""));
    if (culprits.length >= 40) break;
  }
  return { scroll, width, culprits };
})()`;

type Reflow = { scroll: number; width: number; culprits: string[] } | null;

function grouped(items: string[]) {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts].map(([item, count]) => (count > 1 ? `${item}  (x${count})` : item));
}

const report: string[] = [];
let problems = 0;
let axeTotal = 0;
let smallTotal = 0;
let reflowTotal = 0;
let focusTotal = 0;

try {
  for (const page of pages) {
    const lines: string[] = [];

    await open(page, DESK.width, DESK.height);
    const violations = await runAxe();
    for (const violation of violations) {
      axeTotal += violation.nodes.length;
      lines.push(`  axe ${violation.id} [${violation.impact}] x${violation.nodes.length} - ${violation.help}`);
      for (const node of violation.nodes.slice(0, 4)) {
        lines.push(`      ${node.target}${node.summary ? `  -> ${node.summary.slice(0, 180)}` : ""}`);
      }
      if (violation.nodes.length > 4) lines.push(`      ... e mais ${violation.nodes.length - 4}`);
    }

    const small = await chrome.evaluate<SmallTarget[]>(TARGET_PROBE);
    smallTotal += small.length;
    const smallLines = grouped(small.map((target) => `${target.label} ${target.size}`));
    if (smallLines.length > 0) {
      lines.push(`  alvo menor que ${MIN_TARGET}x${MIN_TARGET}: ${small.length}`);
      for (const line of smallLines) lines.push(`      ${line}`);
    }

    for (const target of FOCUS_TARGETS.filter((entry) => entry.page === page)) {
      await open(page, DESK.width, DESK.height);
      const found = await chrome.evaluate<boolean>(`(() => {
        const name = ${JSON.stringify(target.name)};
        const element = [...document.querySelectorAll("button, [role=button], a[href]")].find(
          (candidate) => (candidate.getAttribute("aria-label") || candidate.textContent || "").trim() === name,
        );
        if (!element) return false;
        element.scrollIntoView({ block: "center" });
        element.focus();
        return document.activeElement === element;
      })()`);
      if (!found) {
        focusTotal++;
        lines.push(`  foco: "${target.name}" - o alvo declarado nao existe mais na pagina, ou nao recebe foco`);
        continue;
      }
      const fingerprint = `document.body.innerHTML.length + ":" + document.body.innerText`;
      const before = await chrome.evaluate<string>(fingerprint);
      for (let press = 0; press < (target.presses ?? 1); press++) {
        await chrome.press("Enter");
        await Bun.sleep(350);
      }
      await Bun.sleep(300);
      const landed = await chrome.evaluate<string>(`(() => {
        const element = document.activeElement;
        if (!element || element === document.body || element === document.documentElement) return "";
        return element.tagName.toLowerCase();
      })()`);
      if ((await chrome.evaluate<string>(fingerprint)) === before) {
        focusTotal++;
        lines.push(`  foco: "${target.name}" - o Enter nao mudou nada na pagina, entao a acao declarada nao foi medida`);
      } else if (!landed) {
        focusTotal++;
        lines.push(
          `  foco: "${target.name}"${target.presses ? ` apertado ${target.presses} vezes` : ""} - depois da acao o foco caiu no body`,
        );
      }
    }

    await open(page, REFLOW_WIDTH, 900);
    const reflow = await chrome.evaluate<Reflow>(REFLOW_PROBE);
    if (reflow) {
      reflowTotal++;
      lines.push(
        `  reflow a ${REFLOW_WIDTH}px: a pagina rola ${reflow.scroll - reflow.width}px de lado (${reflow.scroll} > ${reflow.width})`,
      );
      for (const culprit of grouped(reflow.culprits).slice(0, 6)) lines.push(`      ${culprit}`);
    }

    problems += lines.length;
    report.push(lines.length === 0 ? `${page}: ok` : `${page}:\n${lines.join("\n")}`);
    console.log(report.at(-1));
  }
} finally {
  chrome.close();
  await server.stop(true);
}

const focusDeclared = FOCUS_TARGETS.filter((target) => pages.includes(target.page)).length;

console.log(
  `\n${pages.length} pagina(s). axe: ${axeTotal} no(s) em violacao, com ${Object.keys(IGNORED_RULES).length} regra(s) de layout de vitrine ignorada(s).` +
    ` Alvo pequeno: ${smallTotal}. Reflow a ${REFLOW_WIDTH}px: ${reflowTotal} pagina(s).` +
    ` Foco: ${focusTotal} de ${focusDeclared} acao(oes) declarada(s).`,
);

if (problems > 0) {
  console.log(
    "\nAs regras ignoradas e o motivo de cada uma estao em IGNORED_RULES, em scripts/acessibilidade.ts." +
      "\nAlvo pequeno segue a 2.5.8 sem a excecao de espacamento: so link dentro de frase escapa, e o radio conta o `label` que o envolve." +
      `\nContraste: ${EXEMPT_FROM_CONTRAST}`,
  );
  process.exit(1);
}
