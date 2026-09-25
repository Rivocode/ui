import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CHROME, CHROME_FLAGS, requireChrome } from "./retratos";
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

// Excecao por NO, e nao por regra: desligar a regra inteira esconderia o proximo
// elemento aria-hidden focavel de verdade - o svg do Recharts em `graficos` e um
// deles, e continua acusado. O seletor casa so a forma exata que a biblioteca
// desenha, com aria-hidden E tabindex=0 E vazia, para uma sentinela que ganhe
// conteudo voltar a ser medida.
const IGNORED_NODES: Record<string, { selector: string; reason: string }[]> = {
  "aria-hidden-focus": [
    {
      selector: 'span[data-base-ui-focus-guard][aria-hidden="true"][tabindex="0"]:empty',
      reason:
        "Sentinela de armadilha de foco da Base UI: o span vazio recebe o Tab so para devolver o foco para dentro (ou para fora) do painel, e nunca e lido. E aria-hidden e focavel por desenho, e o Radix e o Floating UI desenham a mesma coisa.",
    },
  ],
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
  { page: "novas", name: "Voltar ao topo" },
  { page: "novas", name: "Cancelamento" },
  { page: "novas", name: "Mover todos para Concedidas" },
  { page: "novas", name: "Ler mais" },
  { page: "tour", name: "Voltar" },
  { page: "tour-claro", name: "Voltar" },
  { page: "novas", name: "Limpar assinatura" },
];

const MIN_TARGET = 24;

const REFLOW_WIDTH = 320;

const DESK = { width: 1240, height: 900 };

// A bancada da CI mede a arvore de base e a da cabeca na mesma maquina e
// compara uma com a outra. Com `--json`, o que foi achado sai contado por
// pagina, tipo e alvo num arquivo, e o codigo de saida deixa de julgar: quem
// julga e o `scripts/comparacao-da-bancada.ts`. O tamanho medido do alvo fica
// FORA da chave, porque ele muda com a fonte do sistema, e o que se compara e
// a existencia do problema.
const jsonFlag = process.argv.indexOf("--json");
const jsonTo = jsonFlag === -1 ? "" : (process.argv[jsonFlag + 1] ?? "");
if (jsonFlag !== -1 && !jsonTo) {
  console.error("--json pede o caminho do arquivo.");
  process.exit(1);
}

const tally: Record<string, number> = {};
function count(key: string, amount = 1) {
  tally[key] = (tally[key] ?? 0) + amount;
}

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
  if (!pages.includes(target.page) && picked === "" && !jsonTo) {
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
      ...CHROME_FLAGS,
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

await requireChrome();

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

let ignoredNodes = 0;

async function runAxe() {
  await chrome.evaluate(`${axeSource};true`);
  const rules = Object.fromEntries(Object.keys(IGNORED_RULES).map((id) => [id, { enabled: false }]));
  const skip = Object.fromEntries(
    Object.entries(IGNORED_NODES).map(([id, entries]) => [id, entries.map((entry) => entry.selector)]),
  );
  const { violations, ignored } = await chrome.evaluate<{ violations: AxeViolation[]; ignored: number }>(`axe
    .run(document, { resultTypes: ["violations"], rules: ${JSON.stringify(rules)} })
    .then((result) => {
      const skip = ${JSON.stringify(skip)};
      let ignored = 0;
      const kept = result.violations.map((violation) => ({
      ...violation,
      nodes: violation.nodes.filter((node) => {
        const element = node.target.length === 1 ? document.querySelector(node.target[0]) : null;
        if (element && (skip[violation.id] ?? []).some((selector) => element.matches(selector))) {
          ignored++;
          return false;
        }
        if (violation.id !== "color-contrast") return true;
        return !element?.closest('[data-disabled], [aria-disabled="true"], :disabled');
      }),
    })).filter((violation) => violation.nodes.length > 0).map((violation) => ({
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
    }));
      return { violations: kept, ignored };
    })`);
  ignoredNodes += ignored;
  return violations;
}

type SmallTarget = { label: string; size: string };

// Duas medidas que a primeira versao errava para o lado do alarme.
//
// A AREA: o getBoundingClientRect so ve a caixa desenhada, e as pecas ampliam o
// alvo com um ::after absoluto em inset negativo - o AILabel mede 22x20 e
// recebe o clique em 36x34. O `hitBox` soma os dois pseudo-elementos quando eles sao absolutos, tem
// conteudo e nao tem pointer-events none, e so CONFIA na soma depois de sondar
// com elementFromPoint a borda e o meio da area somada: se um vizinho cobre um
// canto, ou um ancestral recorta com overflow, a sonda cai fora do elemento e a
// medida volta para a caixa desenhada. E o que segura o link do Breadcrumb:
// ele declara -inset-y-1.5, mas o `truncate` do proprio link recorta o pseudo,
// e o clique continua nos 20px desenhados. Pseudo de elemento `static` nao conta,
// porque o bloco que o contem e outro ancestral e a conta de posicao mentiria.
//
// A FRASE: a excecao Inline da 2.5.8 vale para qualquer alvo cujo tamanho e
// preso pela altura da linha de texto em volta, e nao so para link. Um botao
// "Tentar de novo" no fim da mensagem de erro esta na frase tanto quanto um
// link. O criterio e o mesmo para os dois: o alvo tem texto visivel proprio
// (icone solto nao e frase), e um no de texto de fora dele, no mesmo bloco,
// divide a LINHA com ele - sobrepoe na vertical, a no maximo um em de
// distancia na horizontal, e o alvo nao e mais alto que o line-height dessa
// linha (o retangulo do Range e so a caixa do glifo, 14px numa fonte de 12, e
// nao serve de altura de linha). A distancia
// e o que separa a frase do rotulo solto no outro canto de uma fileira flex.
const TARGET_PROBE = `(() => {
  const min = ${MIN_TARGET};
  const inSentence = (element) => {
    if (!(element.innerText || "").trim()) return false;
    let block = element.parentElement;
    while (block && getComputedStyle(block).display.startsWith("inline")) block = block.parentElement;
    if (!block) return false;
    const em = parseFloat(getComputedStyle(element).fontSize) || 16;
    const own = [...element.getClientRects()].filter((rect) => rect.width > 0);
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (element.contains(node) || !(node.textContent || "").trim()) continue;
      const parent = node.parentElement;
      if (parent && (parent.closest('[aria-hidden="true"]') || getComputedStyle(parent).visibility === "hidden")) continue;
      const lineStyle = getComputedStyle(parent ?? block);
      const line = parseFloat(lineStyle.lineHeight) || (parseFloat(lineStyle.fontSize) || 16) * 1.2;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const text of range.getClientRects()) {
        if (text.width <= 0) continue;
        const sameLine = own.some((box) =>
          text.top < box.bottom && text.bottom > box.top &&
          box.height <= Math.max(text.height, line) + 2 &&
          Math.max(text.left - box.right, box.left - text.right) <= em,
        );
        if (sameLine) return true;
      }
    }
    return false;
  };
  const hitBox = (element) => {
    let own = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (style.position === "static") return own;
    const reach = (rect) => {
      let box = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      for (const which of ["::before", "::after"]) {
        const pseudo = getComputedStyle(element, which);
        if (pseudo.content === "none" || pseudo.content === "normal") continue;
        if (pseudo.position !== "absolute" || pseudo.pointerEvents === "none") continue;
        if (pseudo.display === "none" || pseudo.visibility === "hidden") continue;
        const left = rect.left + parseFloat(style.borderLeftWidth) + parseFloat(pseudo.left);
        const top = rect.top + parseFloat(style.borderTopWidth) + parseFloat(pseudo.top);
        const width = parseFloat(pseudo.width);
        const height = parseFloat(pseudo.height);
        if (![left, top, width, height].every(Number.isFinite)) continue;
        box = {
          left: Math.min(box.left, left),
          top: Math.min(box.top, top),
          right: Math.max(box.right, left + width),
          bottom: Math.max(box.bottom, top + height),
        };
      }
      return box;
    };
    const first = reach(own);
    if (first.right - first.left <= own.width && first.bottom - first.top <= own.height) return own;
    element.scrollIntoView({ block: "center", inline: "center" });
    own = element.getBoundingClientRect();
    const box = reach(own);
    const edge = 0.5;
    const xs = [box.left + edge, (box.left + box.right) / 2, box.right - edge];
    const ys = [box.top + edge, (box.top + box.bottom) / 2, box.bottom - edge];
    for (const x of xs) {
      for (const y of ys) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || !element.contains(hit)) return own;
      }
    }
    return { width: box.right - box.left, height: box.bottom - box.top };
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
    let box = label ? label.getBoundingClientRect() : own;
    if (box.width >= min && box.height >= min) continue;
    if (!label) box = hitBox(element);
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

// A sonda de alvo pulou de "mede a caixa" para "mede a area clicavel e acha a
// frase", e cada um desses passos pode ficar frouxo sem nada acusar: bastaria o
// hitBox aceitar qualquer pseudo, ou o inSentence aceitar qualquer texto na
// fileira, para a vitrine inteira ficar verde. Esta bancada roda a sonda num
// HTML com os casos que ja enganaram - de cada lado - e para tudo se um deles
// mudar de lado. O `true` e o que tem que continuar passando; o `false` e o
// alvo pequeno de verdade, que tem que continuar sendo acusado.
const TARGET_CALIBRATION: { name: string; passes: boolean; html: string }[] = [
  {
    name: "selo com ::after em -8px, como o AILabel",
    passes: true,
    html: `<button class="grow" style="width:22px;height:20px" aria-label="selo ampliado">IA</button>`,
  },
  {
    name: "botao de 12px sem area ampliada",
    passes: false,
    html: `<button style="width:12px;height:12px" aria-label="xis pequeno"></button>`,
  },
  {
    name: "::after com pointer-events none nao recebe clique",
    passes: false,
    html: `<button class="grow inert-grow" style="width:12px;height:12px" aria-label="xis de pseudo inerte"></button>`,
  },
  {
    name: "::after recortado por overflow hidden do pai",
    passes: false,
    html: `<div style="overflow:hidden;width:12px;height:12px"><button class="grow" style="width:12px;height:12px" aria-label="xis recortado"></button></div>`,
  },
  {
    name: "link no meio da frase",
    passes: true,
    html: `<p style="font-size:12px;line-height:16px">Leia os <a href="#">termos de uso</a> antes de seguir.</p>`,
  },
  {
    name: "botao de texto no fim da mensagem, em p flex",
    passes: true,
    html: `<p style="display:flex;font-size:12px;line-height:18px">A conexao caiu. <button style="height:18px;padding:0">Tentar de novo</button></p>`,
  },
  {
    name: "icone solto ao lado do rotulo nao e frase",
    passes: false,
    html: `<div style="display:flex;gap:4px;font-size:14px">Financeiro<button style="width:16px;height:16px" aria-label="fechar ficha"></button></div>`,
  },
  {
    name: "botao de texto no outro canto da fileira nao e frase",
    passes: false,
    html: `<div style="display:flex;justify-content:space-between;width:400px;font-size:12px;line-height:18px">3 selecionadas<button style="height:18px;padding:0">Limpar tudo</button></div>`,
  },
  {
    name: "botao de texto sozinho no bloco nao e frase",
    passes: false,
    html: `<div style="font-size:12px"><button style="height:20px;padding:0">+4 mais</button></div>`,
  },
];

async function calibrateTargets() {
  const style =
    "<style>body{font-family:sans-serif;margin:40px}section{margin:40px 0}button{font:inherit;border:0}" +
    ".grow{position:relative}.grow::after{content:'';position:absolute;inset:-8px}" +
    ".inert-grow::after{pointer-events:none}</style>";
  const body = TARGET_CALIBRATION.map((entry) => `<section>${entry.html}</section>`).join("");
  await chrome.send("Emulation.setDeviceMetricsOverride", { ...DESK, deviceScaleFactor: 1, mobile: false });
  await chrome.send("Page.navigate", {
    url: `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html>${style}${body}`)}`,
  });
  await Bun.sleep(500);
  const verdicts = await chrome.evaluate<boolean[]>(`(() => {
    const found = ${TARGET_PROBE};
    return [...document.querySelectorAll("section")].map((section) => {
      const target = section.querySelector("button, a[href]");
      const name = (target.getAttribute("aria-label") || target.textContent).trim();
      return !found.some((item) => item.label.includes('"' + name + '"'));
    });
  })()`);
  if (verdicts.length !== TARGET_CALIBRATION.length) {
    throw new Error(`a calibracao do alvo leu ${verdicts.length} caso(s), e declara ${TARGET_CALIBRATION.length}`);
  }
  const wrong = TARGET_CALIBRATION.filter((entry, index) => verdicts[index] !== entry.passes);
  if (wrong.length > 0) {
    throw new Error(
      "a sonda de alvo errou a calibracao, entao a medida da vitrine nao vale:\n" +
        wrong.map((entry) => `  ${entry.name}: devia ${entry.passes ? "passar" : "ser acusado"}`).join("\n"),
    );
  }
}

try {
  await calibrateTargets();
  for (const page of pages) {
    const lines: string[] = [];

    await open(page, DESK.width, DESK.height);
    const violations = await runAxe();
    for (const violation of violations) {
      axeTotal += violation.nodes.length;
      count(`${page} | axe ${violation.id}`, violation.nodes.length);
      lines.push(`  axe ${violation.id} [${violation.impact}] x${violation.nodes.length} - ${violation.help}`);
      for (const node of violation.nodes.slice(0, 4)) {
        lines.push(`      ${node.target}${node.summary ? `  -> ${node.summary.slice(0, 180)}` : ""}`);
      }
      if (violation.nodes.length > 4) lines.push(`      ... e mais ${violation.nodes.length - 4}`);
    }

    const small = await chrome.evaluate<SmallTarget[]>(TARGET_PROBE);
    smallTotal += small.length;
    for (const target of small) count(`${page} | alvo ${target.label}`);
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
        count(`${page} | foco ${target.name}`);
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
        count(`${page} | foco ${target.name}`);
        lines.push(`  foco: "${target.name}" - o Enter nao mudou nada na pagina, entao a acao declarada nao foi medida`);
      } else if (!landed) {
        focusTotal++;
        count(`${page} | foco ${target.name}`);
        lines.push(
          `  foco: "${target.name}"${target.presses ? ` apertado ${target.presses} vezes` : ""} - depois da acao o foco caiu no body`,
        );
      }
    }

    await open(page, REFLOW_WIDTH, 900);
    const reflow = await chrome.evaluate<Reflow>(REFLOW_PROBE);
    if (reflow) {
      reflowTotal++;
      count(`${page} | reflow a ${REFLOW_WIDTH}px`);
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
  `\n${pages.length} pagina(s). axe: ${axeTotal} no(s) em violacao, com ${Object.keys(IGNORED_RULES).length} regra(s) de layout de vitrine ignorada(s) e ${ignoredNodes} no(s) ignorado(s) por IGNORED_NODES.` +
    ` Alvo pequeno: ${smallTotal}. Reflow a ${REFLOW_WIDTH}px: ${reflowTotal} pagina(s).` +
    ` Foco: ${focusTotal} de ${focusDeclared} acao(oes) declarada(s).`,
);

if (jsonTo) {
  await Bun.write(jsonTo, `${JSON.stringify({ pages, problems: tally }, null, 1)}\n`);
  console.log(`\nContagem por pagina, tipo e alvo gravada em ${jsonTo}.`);
  process.exit(0);
}

if (problems > 0) {
  console.log(
    "\nAs regras e os nos ignorados, e o motivo de cada um, estao em IGNORED_RULES e IGNORED_NODES, em scripts/acessibilidade.ts." +
      "\nAlvo pequeno segue a 2.5.8 sem a excecao de espacamento: so escapa link ou botao de texto que divide a linha com a frase, a area conta o ::before e o ::after absolutos que recebem o clique, e o radio conta o `label` que o envolve." +
      `\nContraste: ${EXEMPT_FROM_CONTRAST}`,
  );
  process.exit(1);
}
