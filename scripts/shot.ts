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
} from "./retratos";
import { servir } from "./serve";

const PAGES = [
  { rota: "/index.html", name: "vitrine", height: 2600, alturaCelular: 4200 },
  { rota: "/dialog.html", name: "dialogo", height: 2800, alturaCelular: 2800 },
  { rota: "/listagem.html", name: "listagem", height: 1900, alturaCelular: 2000 },
  { rota: "/flutuantes.html", name: "flutuantes", height: 1120, alturaCelular: 1700 },
  { rota: "/datas.html", name: "datas", height: 1240, alturaCelular: 1800 },
  { rota: "/formulario.html", name: "formulario", height: 1560, alturaCelular: 3600 },
  { rota: "/navegacao.html", name: "navegacao", height: 1000, alturaCelular: 1200 },
  { rota: "/folhas.html", name: "folhas", height: 1440, alturaCelular: 1440 },
  { rota: "/consulta.html", name: "consulta", height: 2000, alturaCelular: 3200 },
  { rota: "/completos.html", name: "completos", height: 1900, alturaCelular: 3400 },
  { rota: "/graficos.html", name: "graficos", height: 1700, alturaCelular: 4000 },
  { rota: "/controles.html", name: "controles", height: 1900, alturaCelular: 3800 },
  { rota: "/dados.html", name: "dados", height: 2520, alturaCelular: 3700 },
  { rota: "/novas.html", name: "novas", height: 29600, alturaCelular: 43200 },
  { rota: "/painel.html", name: "painel", height: 3000, alturaCelular: 5000 },
  { rota: "/paleta.html", name: "paleta", height: 1120, alturaCelular: 1120 },
  { rota: "/ia.html", name: "ia", height: 10800, alturaCelular: 16800 },
  { rota: "/arrastar.html", name: "arrastar", height: 4200, alturaCelular: 7600 },
  { rota: "/editor.html", name: "editor", height: 5200, alturaCelular: 10400 },
  { rota: "/tour.html", name: "tour", height: 900, alturaCelular: 900 },
  { rota: "/tour-claro.html", name: "tour-claro", height: 900, alturaCelular: 900 },
  { rota: "/cronograma.html", name: "cronograma", height: 5600, alturaCelular: 6400 },
];

const LARGURA_JANELA_MINIMA = 500;

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

const servidor = servir();
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

const SHOTS = PAGES.flatMap(({ rota, name, height, alturaCelular }) => [
  { rota, output: `demo/dist/${name}.png`, janela: `1240,${height}` },
  {
    rota: `/celular.html#.${rota}`,
    output: `demo/dist/${name}-celular.png`,
    janela: `${LARGURA_JANELA_MINIMA},${alturaCelular}`,
  },
]);

const SECTION_WINDOW = "1240,900";

const asked = process.argv.indexOf("--secao");
const wanted = asked === -1 ? "" : (process.argv[asked + 1] ?? "");

const chosen = SECTIONS.filter((section) =>
  `${section.page}/${slug(section.name)}/${section.theme}`.includes(wanted),
);

const SECTION_SHOTS = chosen.map((section) => ({
  rota: address(section),
  output: `${SHOTS_DIR}/${shotName(section)}.png`,
  janela: SECTION_WINDOW,
}));

if (asked !== -1 && SECTION_SHOTS.length === 0) {
  console.error(
    `Nenhuma secao declarada casa com "${wanted}". As declaradas estao em` +
      `\nscripts/retratos.ts, e marcar uma nova e por \`data-rc-shot\` no demo:\n` +
      SECTIONS.map((s) => `  ${s.page}/${slug(s.name)}/${s.theme}`).join("\n"),
  );
  process.exit(1);
}

async function servedBy(rota: string, found = new Set<string>()) {
  const [path, hash = ""] = rota.split("#");
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
  return documents().every(loaded) ? "a pagina nao parou de mudar" : "a pagina nao terminou de carregar";
})()`;

let visits = 0;

async function shoot(rota: string, output: string, janela: string) {
  const [width, height] = janela.split(",").map(Number) as [number, number];
  await chrome.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: false,
  });

  const [path, hash] = rota.split("#");
  const visit = `?visita=${++visits}`;
  const url = `http://127.0.0.1:${servidor.port}${path}${visit}${hash === undefined ? "" : `#${hash}`}`;
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
    console.error(`${output}: ${settled || "a navegacao nao chegou"} em ${rota}.`);
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

for (const { rota, output, janela } of asked === -1
  ? [...SHOTS, ...SECTION_SHOTS]
  : SECTION_SHOTS) {
  const served = await servedBy(rota).catch(() => undefined);
  if (!served) {
    console.log(`${output}  pulou: a rota ${rota} cita pagina que nao existe nesta arvore`);
    continue;
  }

  await shoot(rota, output, janela);
  await stampBuild(output, await buildStamp([...served]));
  const bytes = await Bun.file(output).size;
  console.log(`${output}  ${(bytes / 1024).toFixed(0)} KB`);
}

chrome.close();
await servidor.stop(true);
