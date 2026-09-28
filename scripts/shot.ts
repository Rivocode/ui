import {
  BUILD_KEYWORD,
  decodePng,
  encodePng,
  launchChrome,
  pngChunk,
  stackPngs,
  SECTIONS,
  SHOTS as SHOTS_DIR,
  address,
  buildStamp,
  shotName,
  requireChrome,
  slug,
} from "./portraits";
import { serveDemo } from "./serve";

const PAGES = [
  { route: "/index.html", name: "vitrine", height: 2600, phoneHeight: 4200 },
  { route: "/dialog.html", name: "dialogo", height: 2800, phoneHeight: 2800 },
  { route: "/listagem.html", name: "listagem", height: 1900, phoneHeight: 2000 },
  { route: "/flutuantes.html", name: "flutuantes", height: 1120, phoneHeight: 1700 },
  { route: "/datas.html", name: "datas", height: 1240, phoneHeight: 1800 },
  { route: "/formulario.html", name: "formulario", height: 1560, phoneHeight: 3600 },
  { route: "/navegacao.html", name: "navegacao", height: 1000, phoneHeight: 1200 },
  { route: "/folhas.html", name: "folhas", height: 1440, phoneHeight: 1440 },
  { route: "/consulta.html", name: "consulta", height: 2000, phoneHeight: 3200 },
  { route: "/completos.html", name: "completos", height: 1900, phoneHeight: 3400 },
  { route: "/graficos.html", name: "graficos", height: 1700, phoneHeight: 4000 },
  { route: "/controles.html", name: "controles", height: 1900, phoneHeight: 3800 },
  { route: "/dados.html", name: "dados", height: 2520, phoneHeight: 3700 },
  { route: "/novas.html", name: "novas", height: 29600, phoneHeight: 43200 },
  { route: "/painel.html", name: "painel", height: 3000, phoneHeight: 5000 },
  { route: "/paleta.html", name: "paleta", height: 1120, phoneHeight: 1120 },
  { route: "/ia.html", name: "ia", height: 10800, phoneHeight: 16800 },
  { route: "/arrastar.html", name: "arrastar", height: 4200, phoneHeight: 7600 },
  { route: "/editor.html", name: "editor", height: 5200, phoneHeight: 10400 },
  { route: "/tour.html", name: "tour", height: 900, phoneHeight: 900 },
  { route: "/tour-claro.html", name: "tour-claro", height: 900, phoneHeight: 900 },
  { route: "/cronograma.html", name: "cronograma", height: 5600, phoneHeight: 6400 },
];

const MIN_WINDOW_WIDTH = 500;

const FROZEN_CLOCK = Date.UTC(2026, 9, 15, 13, 0, 0);

const FROZEN_CLOCK_SCRIPT = `(() => {
  const Real = Date;
  const start = performance.now();
  const now = () => ${FROZEN_CLOCK} + Math.floor(performance.now() - start);
  function Frozen(...args) {
    if (!new.target) return new Real(now()).toString();
    return args.length === 0 ? new Real(now()) : new Real(...args);
  }
  Frozen.prototype = Real.prototype;
  Frozen.now = now;
  Frozen.parse = Real.parse;
  Frozen.UTC = Real.UTC;
  globalThis.Date = Frozen;
})();`;

const SETTLE_DEADLINE = 20_000;
const SETTLE_FLOOR = 1_500;
const CALM_CHECKS = 3;
const CALM_INTERVAL = 150;
const SLICE_HEIGHT = 2048;

await requireChrome();

const server = serveDemo();
const chrome = await launchChrome([
  "--disable-gpu",
  "--force-color-profile=srgb",
  "--font-render-hinting=none",
  "--disable-lcd-text",
]);
await chrome.send("Emulation.setTimezoneOverride", { timezoneId: "America/Sao_Paulo" });
await chrome.send("Emulation.setLocaleOverride", { locale: "pt-BR" });
await chrome.send("Emulation.setFocusEmulationEnabled", { enabled: true });
await chrome.send("Page.addScriptToEvaluateOnNewDocument", { source: FROZEN_CLOCK_SCRIPT });

const SHOTS = PAGES.flatMap(({ route, name, height, phoneHeight }) => [
  { route, output: `demo/dist/${name}.png`, viewport: `1240,${height}` },
  {
    route: `/celular.html#.${route}`,
    output: `demo/dist/${name}-celular.png`,
    viewport: `${MIN_WINDOW_WIDTH},${phoneHeight}`,
  },
]);

const SECTION_WINDOW = "1240,900";

const asked = process.argv.indexOf("--section");
const wanted = asked === -1 ? "" : (process.argv[asked + 1] ?? "");

const chosen = SECTIONS.filter((section) =>
  `${section.page}/${slug(section.name)}/${section.theme}`.includes(wanted),
);

const SECTION_SHOTS = chosen.map((section) => ({
  route: address(section),
  output: `${SHOTS_DIR}/${shotName(section)}.png`,
  viewport: SECTION_WINDOW,
}));

if (asked !== -1 && SECTION_SHOTS.length === 0) {
  console.error(
    `No declared section matches "${wanted}". The declared ones are in` +
      `\nscripts/portraits.ts, and marking a new one is done with \`data-rc-shot\` in the demo:\n` +
      SECTIONS.map((s) => `  ${s.page}/${slug(s.name)}/${s.theme}`).join("\n"),
  );
  process.exit(1);
}

async function servedBy(route: string, found = new Set<string>()) {
  const [path, hash = ""] = route.split("#");
  const html = `demo${path}`;
  if (found.has(html)) return found;
  found.add(html);

  const text = await Bun.file(html).text();
  for (const [, ref] of text.matchAll(/(?:href|src)="\.\/(dist\/[^"]+)"/g)) {
    found.add(`demo/${ref}`);
  }

  const inner = hash.split("|")[0]?.replace(/^\.?\//, "");
  if (inner) await servedBy(`/${inner}`, found);

  return found;
}

async function stampBuild(output: string, stamp: string) {
  const bytes = new Uint8Array(await Bun.file(output).arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const at = 8 + 12 + view.getUint32(8);
  const chunk = pngChunk("tEXt", new TextEncoder().encode(`${BUILD_KEYWORD}\0${stamp}`));

  const marked = new Uint8Array(bytes.length + chunk.length);
  marked.set(bytes.subarray(0, at));
  marked.set(chunk, at);
  marked.set(bytes.subarray(at), at + chunk.length);

  await Bun.write(output, marked);
}

const SETTLE_SCRIPT = `(async () => {
  const documents = () => {
    const found = [];
    const walk = (doc) => {
      found.push(doc);
      for (const frame of doc.querySelectorAll("iframe")) {
        if (frame.contentDocument) walk(frame.contentDocument);
      }
    };
    walk(document);
    return found;
  };
  const frames = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const loaded = (doc) =>
    doc.readyState === "complete" &&
    doc.location.href !== "about:blank" &&
    (!doc.getElementById("root") || doc.getElementById("root").childElementCount > 0) &&
    doc.documentElement.dataset.rcReady !== "0";
  const stillAnimations = (doc) => {
    for (const animation of doc.getAnimations()) {
      const timing = animation.effect && animation.effect.getComputedTiming();
      if (timing && timing.iterations === Infinity) {
        animation.pause();
        animation.currentTime = 0;
      } else {
        animation.finish();
      }
    }
  };
  const fingerprint = (doc) => {
    let text =
      doc.location.href + "|" + doc.fonts.status + "|" + doc.documentElement.scrollHeight + "|" + doc.hasFocus();
    for (const element of doc.querySelectorAll("*")) {
      const box = element.getBoundingClientRect();
      text += "|" + box.x + "," + box.y + "," + box.width + "," + box.height;
      if (element === doc.activeElement) text += ",active";
    }
    return text;
  };

  const began = performance.now();
  const deadline = began + ${SETTLE_DEADLINE};
  let previous = "";
  let calm = 0;
  while (performance.now() < deadline) {
    const all = documents();
    if (all.every(loaded)) {
      await Promise.all(all.map((doc) => doc.fonts.ready));
      all.forEach(stillAnimations);
      await frames();
      const current = documents().map(fingerprint).join("#");
      calm = current === previous ? calm + 1 : 0;
      previous = current;
      if (calm >= ${CALM_CHECKS} && performance.now() - began >= ${SETTLE_FLOOR}) {
        const contested = documents().find(
          (doc) =>
            doc.querySelectorAll("iframe").length > 1 &&
            doc.activeElement &&
            doc.activeElement.tagName === "IFRAME",
        );
        if (!contested) return "ok";
        contested.activeElement.blur();
        calm = 0;
      }
    }
    await new Promise((done) => setTimeout(done, ${CALM_INTERVAL}));
  }
  return documents().every(loaded) ? "the page did not stop changing" : "the page did not finish loading";
})()`;

let visits = 0;

async function shoot(route: string, output: string, viewport: string) {
  const [width, height] = viewport.split(",").map(Number) as [number, number];
  await chrome.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false,
  });

  const [path, hash] = route.split("#");
  const visit = `?visit=${++visits}`;
  const url = `http://127.0.0.1:${server.port}${path}${visit}${hash === undefined ? "" : `#${hash}`}`;
  await chrome.send("Page.navigate", { url });

  let settled = "";
  const deadline = Date.now() + SETTLE_DEADLINE + 5000;
  while (!settled && Date.now() < deadline) {
    settled = await chrome
      .evaluate<string>(`location.search === ${JSON.stringify(visit)} ? ${SETTLE_SCRIPT} : ""`)
      .catch(() => "");
    if (!settled) await Bun.sleep(CALM_INTERVAL);
  }

  if (settled !== "ok") {
    console.error(`${output}: ${settled || "the navigation did not arrive"} at ${route}.`);
    process.exit(1);
  }

  const slices: Uint8Array[] = [];
  for (let top = 0; top < height; top += SLICE_HEIGHT) {
    const shot = await chrome.send("Page.captureScreenshot", {
      format: "png",
      clip: { x: 0, y: top, width, height: Math.min(SLICE_HEIGHT, height - top), scale: 1 },
    });
    slices.push(new Uint8Array(Buffer.from(shot.data, "base64")));
  }

  await Bun.write(
    output,
    slices.length === 1 ? slices[0]! : encodePng(stackPngs(slices.map(decodePng))),
  );
}

for (const { route, output, viewport } of asked === -1
  ? [...SHOTS, ...SECTION_SHOTS]
  : SECTION_SHOTS) {
  const served = await servedBy(route).catch(() => undefined);
  if (!served) {
    console.log(`${output}  skipped: the route ${route} cites a page that does not exist in this tree`);
    continue;
  }

  await shoot(route, output, viewport);
  await stampBuild(output, await buildStamp([...served]));
  const bytes = await Bun.file(output).size;
  console.log(`${output}  ${(bytes / 1024).toFixed(0)} KB`);
}

chrome.close();
await server.stop(true);
