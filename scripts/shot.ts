/** Fotografa a vitrine, para revisao visual sem abrir navegador na mao. */
import {
  BUILD_KEYWORD,
  SECTIONS,
  SHOTS as SHOTS_DIR,
  address,
  buildStamp,
  shotName,
  slug,
} from "./retratos";
import { servir } from "./serve";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

/**
 * Cada pagina sai duas vezes: na largura de mesa e na de celular. O retrato
 * estreito e o que pega painel que sai da tela, tabela que empurra a pagina e
 * calendario de dois meses que nao cabe.
 */
const PAGES = [
  { rota: "/index.html", name: "vitrine", height: 2600, alturaCelular: 4200 },
  { rota: "/dialog.html", name: "dialogo", height: 1680, alturaCelular: 1680 },
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
  { rota: "/novas.html", name: "novas", height: 5150, alturaCelular: 8150 },
  { rota: "/painel.html", name: "painel", height: 3000, alturaCelular: 5000 },
  { rota: "/paleta.html", name: "paleta", height: 1120, alturaCelular: 1120 },
];

/** O piso de largura de janela do Chrome no macOS. */
const LARGURA_JANELA_MINIMA = 500;

const servidor = servir();

/**
 * O Chrome no macOS nao abre janela abaixo de 500px de largura. Pedir 390
 * devolve um retrato cortado em 390 com layout de 500, que e pior do que nao
 * ter retrato: parece certo e esconde o que quebrou. Por isso a largura de
 * celular vem de um iframe dentro de `celular.html`.
 */
const SHOTS = PAGES.flatMap(({ rota, name, height, alturaCelular }) => [
  { rota, output: `demo/dist/${name}.png`, janela: `1240,${height}` },
  {
    rota: `/celular.html#.${rota}`,
    output: `demo/dist/${name}-celular.png`,
    janela: `${LARGURA_JANELA_MINIMA},${alturaCelular}`,
  },
]);

/**
 * A janela do retrato de secao e folgada de proposito, e o excedente sai em
 * magenta: o `regressao-visual.ts` apara essa borda e descobre a moldura
 * sozinho, entao a secao nao precisa ter altura declarada aqui. Secao maior que
 * esta janela nao ganha borda para aparar, e a guarda recusa em vez de comparar
 * um retrato cortado.
 */
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

/**
 * Os arquivos que o navegador carrega para desenhar uma rota: o HTML pedido, a
 * CSS e o pacote que ele referencia, e - quando a rota e moldura - o HTML de
 * dentro do `#`, com o que ele referencia tambem.
 *
 * A lista sai do proprio HTML em vez de ser declarada aqui: o que a marca de
 * build promete e "estes bytes desenharam este retrato", e declaracao a mao
 * mente na primeira vez que alguem troca o `src` de uma pagina.
 */
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

function pngChunk(type: string, body: Uint8Array) {
  const chunk = new Uint8Array(12 + body.length);
  const view = new DataView(chunk.buffer);

  view.setUint32(0, body.length);
  for (let index = 0; index < 4; index++) chunk[4 + index] = type.charCodeAt(index);
  chunk.set(body, 8);
  view.setUint32(8 + body.length, Bun.hash.crc32(chunk.subarray(4, 8 + body.length)) >>> 0);

  return chunk;
}

/**
 * Costura a marca de build no PNG, logo depois do `IHDR`.
 *
 * O Chrome nao tem como escrever isto, entao a costura e aqui. Vai dentro da
 * imagem, e nao num arquivo ao lado, porque a pergunta e sobre a IMAGEM: o
 * retrato copiado para outra pasta continua sabendo de que build ele veio.
 */
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

for (const { rota, output, janela } of asked === -1
  ? [...SHOTS, ...SECTION_SHOTS]
  : SECTION_SHOTS) {
  const proc = Bun.spawn(
    [
      CHROME,
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      `--screenshot=${output}`,
      `--window-size=${janela}`,
      "--virtual-time-budget=4000",
      // Sem isto, grafico com animacao sai sem as marcas: a Recharts interpola
      // em JS e o retrato acontece antes de o primeiro quadro chegar.
      "--force-prefers-reduced-motion",
      `http://127.0.0.1:${servidor.port}${rota}`,
    ],
    { stderr: "ignore", stdout: "ignore" },
  );
  await proc.exited;
  await stampBuild(output, await buildStamp([...(await servedBy(rota))]));
  const bytes = await Bun.file(output).size;
  console.log(`${output}  ${(bytes / 1024).toFixed(0)} KB`);
}

await servidor.stop(true);
