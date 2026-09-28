import { launchChrome, requireChrome } from "./portraits";
import { serveDemo } from "./serve";
import { scanAtLeast } from "./scan";

const IGNORED_RULES: Record<string, string> = {
  region:
    "The showcase stacks loose samples on a page without `main`: content outside a landmark is the showcase layout, not the piece's. The `AppShell` that draws landmarks has its own test.",
  "landmark-one-main":
    "Same reason as `region`: the showcase page is not an application, and whoever puts the `main` is the consumer's screen.",
  "landmark-no-duplicate-banner":
    "The showcase repeats the same sample per theme and per density, and each `AppShell` draws its own `header`.",
  "landmark-no-duplicate-main":
    "Same reason as the previous one, for the `main` of the `AppShell` and of the navigation menu repeated per sample.",
  "landmark-unique":
    "A landmark with the same name is the sample repeated per theme and density - the \"Planos\" carousel in dark and in light -, not two real navigations on the same screen.",
  "page-has-heading-one":
    "The showcase page opens each sample with the section name; the `h1` belongs to the consumer's screen.",
};

const IGNORED_NODES: Record<string, { selector: string; reason: string }[]> = {
  "aria-hidden-focus": [
    {
      selector: 'span[data-base-ui-focus-guard][aria-hidden="true"][tabindex="0"]:empty',
      reason:
        "Base UI focus trap sentinel: the empty span receives Tab only to send focus back into (or out of) the panel, and is never read. It is aria-hidden and focusable by design, and Radix and Floating UI draw the same thing.",
    },
  ],
};

const EXEMPT_FROM_CONTRAST =
  "Text of an inactive component is not covered by 1.4.3: axe only recognizes native `disabled`, and the pieces mark inactive with `data-disabled` and `aria-disabled` on the outer control.";

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

const jsonFlag = process.argv.indexOf("--json");
const jsonTo = jsonFlag === -1 ? "" : (process.argv[jsonFlag + 1] ?? "");
if (jsonFlag !== -1 && !jsonTo) {
  console.error("--json requires the file path.");
  process.exit(1);
}

const tally: Record<string, number> = {};
function count(key: string, amount = 1) {
  tally[key] = (tally[key] ?? 0) + amount;
}

const pickedFlag = process.argv.indexOf("--page");
const picked = pickedFlag === -1 ? "" : (process.argv[pickedFlag + 1] ?? "");

const FRAMES = new Set(["demo/celular.html", "demo/secao.html"]);

const pages = (await scanAtLeast("demo/*.html", 15))
  .filter((file) => !FRAMES.has(file))
  .map((file) => file.replace(/^demo\//, "").replace(/\.html$/, ""))
  .filter((page) => page.includes(picked))
  .sort();

if (pages.length === 0) {
  console.error(`No page in demo/ matches "${picked}".`);
  process.exit(1);
}

if (!(await Bun.file("demo/dist/demo.css").exists())) {
  console.error("demo/dist does not exist. Run `bun run demo` first, or use `bun run a11y`.");
  process.exit(1);
}

for (const target of FOCUS_TARGETS) {
  if (!pages.includes(target.page) && picked === "" && !jsonTo) {
    console.error(`FOCUS_TARGETS cites the page "${target.page}", which does not exist in demo/.`);
    process.exit(1);
  }
}

const axeSource = await Bun.file(require.resolve("axe-core/axe.min.js")).text();

await requireChrome();

const server = serveDemo();
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
    culprits.push(name + " up to x=" + Math.round(box.right) + (section ? ' (after "' + section.slice(0, 40) + '")' : ""));
    if (culprits.length >= 40) break;
  }
  return { scroll, width, culprits };
})()`;

type Reflow = { scroll: number; width: number; culprits: string[] } | null;

const MAX_TABS = 1500;

const REPEATS_TO_STOP = 40;

const CLIPPED_SCROLL_PROBE = `(() => {
  const element = document.activeElement;
  if (!element || element === document.body || element === document.documentElement) return { key: "", found: [] };
  if (!element.hasAttribute("data-rc-tab")) element.setAttribute("data-rc-tab", String(window.__rcTab = (window.__rcTab ?? 0) + 1));
  const describe = (node) => node.tagName.toLowerCase() + (node.id ? "#" + node.id : "") +
    (typeof node.className === "string" && node.className ? "." + node.className.trim().split(/\\s+/).slice(0, 4).join(".") : "");
  const name = (element.getAttribute("aria-label") || element.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
  const found = [];
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    const clips = [style.overflowX, style.overflowY].some((value) => value === "hidden" || value === "clip");
    if (!clips || node.scrollTop === 0) continue;
    const section = node.closest("[data-rc-shot]")?.getAttribute("data-rc-shot") ?? "";
    found.push({
      container: describe(node),
      scrollTop: Math.round(node.scrollTop),
      focused: element.tagName.toLowerCase() + ' "' + name + '"' + (section ? " in " + section : ""),
    });
  }
  return { key: element.getAttribute("data-rc-tab"), found };
})()`;

type ClippedScroll = { container: string; scrollTop: number; focused: string };

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
let clippedTotal = 0;
let tabsTotal = 0;

const TARGET_CALIBRATION: { name: string; passes: boolean; html: string }[] = [
  {
    name: "badge with ::after at -8px, like the AILabel",
    passes: true,
    html: `<button class="grow" style="width:22px;height:20px" aria-label="enlarged badge">IA</button>`,
  },
  {
    name: "12px button without enlarged area",
    passes: false,
    html: `<button style="width:12px;height:12px" aria-label="small x"></button>`,
  },
  {
    name: "::after with pointer-events none does not receive the click",
    passes: false,
    html: `<button class="grow inert-grow" style="width:12px;height:12px" aria-label="x with inert pseudo"></button>`,
  },
  {
    name: "::after clipped by the parent's overflow hidden",
    passes: false,
    html: `<div style="overflow:hidden;width:12px;height:12px"><button class="grow" style="width:12px;height:12px" aria-label="clipped x"></button></div>`,
  },
  {
    name: "link in the middle of a sentence",
    passes: true,
    html: `<p style="font-size:12px;line-height:16px">Leia os <a href="#">termos de uso</a> antes de seguir.</p>`,
  },
  {
    name: "text button at the end of the message, in a flex p",
    passes: true,
    html: `<p style="display:flex;font-size:12px;line-height:18px">A conexao caiu. <button style="height:18px;padding:0">Tentar de novo</button></p>`,
  },
  {
    name: "loose icon next to the label is not a sentence",
    passes: false,
    html: `<div style="display:flex;gap:4px;font-size:14px">Financeiro<button style="width:16px;height:16px" aria-label="close chip"></button></div>`,
  },
  {
    name: "text button at the other end of the row is not a sentence",
    passes: false,
    html: `<div style="display:flex;justify-content:space-between;width:400px;font-size:12px;line-height:18px">3 selecionadas<button style="height:18px;padding:0">Limpar tudo</button></div>`,
  },
  {
    name: "text button alone in the block is not a sentence",
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
    throw new Error(`the target calibration read ${verdicts.length} case(s), and declares ${TARGET_CALIBRATION.length}`);
  }
  const wrong = TARGET_CALIBRATION.filter((entry, index) => verdicts[index] !== entry.passes);
  if (wrong.length > 0) {
    throw new Error(
      "the target probe got the calibration wrong, so the showcase measurement is not valid:\n" +
        wrong.map((entry) => `  ${entry.name}: should ${entry.passes ? "pass" : "be flagged"}`).join("\n"),
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
      if (violation.nodes.length > 4) lines.push(`      ... and ${violation.nodes.length - 4} more`);
    }

    const small = await chrome.evaluate<SmallTarget[]>(TARGET_PROBE);
    smallTotal += small.length;
    for (const target of small) count(`${page} | target ${target.label}`);
    const smallLines = grouped(small.map((target) => `${target.label} ${target.size}`));
    if (smallLines.length > 0) {
      lines.push(`  target smaller than ${MIN_TARGET}x${MIN_TARGET}: ${small.length}`);
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
        count(`${page} | focus ${target.name}`);
        lines.push(`  focus: "${target.name}" - the declared target no longer exists on the page, or does not receive focus`);
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
        count(`${page} | focus ${target.name}`);
        lines.push(`  focus: "${target.name}" - Enter changed nothing on the page, so the declared action was not measured`);
      } else if (!landed) {
        focusTotal++;
        count(`${page} | focus ${target.name}`);
        lines.push(
          `  focus: "${target.name}"${target.presses ? ` pressed ${target.presses} times` : ""} - after the action focus fell to the body`,
        );
      }
    }

    await open(page, DESK.width, DESK.height);
    const seen = new Set<string>();
    const clipped = new Map<string, ClippedScroll>();
    let repeats = 0;
    for (let tab = 0; tab < MAX_TABS && repeats < REPEATS_TO_STOP; tab++) {
      await chrome.press("Tab");
      const { key, found } = await chrome.evaluate<{ key: string; found: ClippedScroll[] }>(CLIPPED_SCROLL_PROBE);
      if (key && !seen.has(key)) {
        seen.add(key);
        repeats = 0;
      } else {
        repeats++;
      }
      for (const hit of found) if (!clipped.has(hit.container)) clipped.set(hit.container, hit);
    }
    tabsTotal += seen.size;
    if (seen.size === 0) {
      lines.push("  Tab: no focus stop on the page, so hidden scrolling was not measured");
    }
    if (clipped.size > 0) {
      clippedTotal += clipped.size;
      lines.push(`  focus scrolled ${clipped.size} box(es) with overflow hidden, which have no scrollbar for the person to go back:`);
      for (const hit of clipped.values()) {
        count(`${page} | hidden scroll ${hit.container}`);
        lines.push(`      ${hit.container} scrolled ${hit.scrollTop}px when focusing ${hit.focused}`);
      }
    }

    await open(page, REFLOW_WIDTH, 900);
    const reflow = await chrome.evaluate<Reflow>(REFLOW_PROBE);
    if (reflow) {
      reflowTotal++;
      count(`${page} | reflow at ${REFLOW_WIDTH}px`);
      lines.push(
        `  reflow at ${REFLOW_WIDTH}px: the page scrolls ${reflow.scroll - reflow.width}px sideways (${reflow.scroll} > ${reflow.width})`,
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
  `\n${pages.length} page(s). axe: ${axeTotal} node(s) in violation, with ${Object.keys(IGNORED_RULES).length} showcase layout rule(s) ignored and ${ignoredNodes} node(s) ignored by IGNORED_NODES.` +
    ` Small target: ${smallTotal}. Reflow at ${REFLOW_WIDTH}px: ${reflowTotal} page(s).` +
    ` Focus: ${focusTotal} of ${focusDeclared} declared action(s).` +
    ` Scroll hidden by Tab: ${clippedTotal} box(es) in ${tabsTotal} Tab stop(s).`,
);

if (jsonTo) {
  await Bun.write(jsonTo, `${JSON.stringify({ pages, problems: tally }, null, 1)}\n`);
  console.log(`\nCount per page, kind and target written to ${jsonTo}.`);
  process.exit(0);
}

if (problems > 0) {
  console.log(
    "\nThe ignored rules and nodes, and the reason for each, are in IGNORED_RULES and IGNORED_NODES, in scripts/accessibility.ts." +
      "\nSmall target follows 2.5.8 without the spacing exception: only a link or text button that shares the line with the sentence escapes, the area counts the absolute ::before and ::after that receive the click, and the radio counts the `label` that wraps it." +
      `\nContrast: ${EXEMPT_FROM_CONTRAST}`,
  );
  process.exit(1);
}
