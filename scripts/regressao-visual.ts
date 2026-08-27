/**
 * Compara cada retrato de `demo/dist` com a assinatura comitada.
 *
 * O `check:scripts` guarda o incidente de ninguem RODAR esta comparacao. Este e
 * o outro, e custou meio dia de duas pessoas: rodou, e o retrato era de outro
 * build. Os retratos `datas` e `datas-celular` sairam vermelhos, e duas frentes
 * diferentes relataram como regressao de verdade do `EventCalendar`. Nao era. Os
 * PNG eram de 08:55, e o `demo/dist/demo.css` foi reconstruido as 09:12: o CSS
 * velho era o de hoje menos uma regra, `.[scrollbar-gutter:stable]`, usada num
 * unico lugar do repositorio - o container de rolagem da vista de dia. Sem a
 * calha reservada, a coluna do dia fica uns 15px mais larga e as tarjas de
 * evento vao ate a borda.
 *
 * Provado por reconstrucao: apagando SO essa regra do CSS de hoje e
 * refotografando, o resultado bateu com o PNG velho em 0 pixels de 6.150.400, e
 * reproduziu os numeros exatos do alarme - 4 de 576 quadrados pior 7, e 6 de 576
 * pior 10.
 *
 * Comparacao que pode estar medindo outro build nao pode sair verde nem
 * vermelha: as duas respostas mentem. Entao cada PNG carrega a marca do build
 * que o gerou, num pedaco `tEXt` chamado `rc-build` que o `shot.ts` costura: o
 * caminho e o resumo de conteudo de cada arquivo que o navegador carregou - HTML
 * da pagina, HTML da moldura quando ela existe, CSS compilada e pacote. Antes de
 * comparar, esta guarda refaz os resumos e RECUSA o retrato cujo build nao e
 * mais o que esta no disco, do mesmo jeito que ja recusa a secao que nao coube
 * na janela. Retrato sem marca tambem e recusado: veio de outra ferramenta, ou
 * de antes desta guarda existir, e nos dois casos ninguem sabe de onde ele veio.
 *
 * A marca cita so o que aquela rota carrega, e nao o build inteiro. Medido com
 * um byte a mais no `demo/dist/datas.js`: recusou `datas` e `datas-celular`, os
 * dois exatos do incidente, e comparou os outros 42 normalmente. CSS trocada
 * recusa os 44, porque a CSS e de todos.
 *
 * A primeira ideia foi comparar `mtime`, e ela perde nos dois lados. Acusa o que
 * nao mudou: o `bun build` reescreve os 17 pacotes a cada `bun run demo` com
 * bytes identicos - medido, as datas foram de 11:00:53 para 11:06:03 e nenhum
 * resumo mudou. Como o `bun run retrato` reconstroi a vitrine inteira e
 * refotografa UMA secao, os outros 43 retratos ficariam mais velhos que todo
 * pacote, e a guarda recusaria 43 sem nada ter mudado. E deixa passar o que
 * mudou de verdade: `touch`, copia de pasta e restauracao de backup trocam a
 * data sem trocar o conteudo. Resumo de conteudo erra para o lado certo nos dois
 * casos, e custa de 122 a 166 bytes por PNG e menos de um segundo de leitura,
 * contra os 77s de Chrome que cada `bun run shot` gasta.
 */
import { Glob } from "bun";
import { inflateSync } from "node:zlib";

import {
  BUILD_KEYWORD,
  CELL,
  CELL_CEILING,
  FRAME,
  SHOTS,
  SIGNATURES,
  driftOf,
  isSection,
} from "./retratos";

const GRID = 24;

const NOISE = 4;

type Image = {
  width: number;
  height: number;
  channels: number;
  pixels: Uint8Array;
  build?: string;
};

function decodePng(bytes: Uint8Array): Image {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 8;

  let width = 0;
  let height = 0;
  let channels = 4;
  let build: string | undefined;
  const data: Uint8Array[] = [];

  while (at < bytes.length) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...bytes.subarray(at + 4, at + 8));
    const body = bytes.subarray(at + 8, at + 8 + length);

    if (type === "IHDR") {
      width = view.getUint32(at + 8);
      height = view.getUint32(at + 12);
      const depth = body[8];
      const color = body[9];
      const interlace = body[12];

      if (depth !== 8 || interlace !== 0 || (color !== 6 && color !== 2)) {
        throw new Error(`PNG fora do que este decodificador le: ${depth}/${color}/${interlace}`);
      }
      channels = color === 6 ? 4 : 3;
    }

    if (type === "tEXt") {
      const split = body.indexOf(0);
      const keyword = split < 0 ? "" : new TextDecoder().decode(body.subarray(0, split));
      if (keyword === BUILD_KEYWORD) build = new TextDecoder().decode(body.subarray(split + 1));
    }

    if (type === "IDAT") data.push(body);
    if (type === "IEND") break;

    at += 12 + length;
  }

  const deflated = new Uint8Array(data.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of data) {
    deflated.set(part, offset);
    offset += part.length;
  }

  const raw = inflateSync(deflated);
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!;
    const from = y * (stride + 1) + 1;
    const to = y * stride;

    for (let x = 0; x < stride; x++) {
      const value = raw[from + x]!;
      const left = x >= channels ? pixels[to + x - channels]! : 0;
      const up = y > 0 ? pixels[to - stride + x]! : 0;
      const upLeft = y > 0 && x >= channels ? pixels[to - stride + x - channels]! : 0;

      let restored = value;
      if (filter === 1) restored = value + left;
      else if (filter === 2) restored = value + up;
      else if (filter === 3) restored = value + ((left + up) >> 1);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const dLeft = Math.abs(p - left);
        const dUp = Math.abs(p - up);
        const dUpLeft = Math.abs(p - upLeft);
        restored = value + (dLeft <= dUp && dLeft <= dUpLeft ? left : dUp <= dUpLeft ? up : upLeft);
      }

      pixels[to + x] = restored & 0xff;
    }
  }

  return { width, height, channels, pixels, build };
}

function signatureOf({ width, height, channels, pixels }: Image): number[] {
  const cells: number[] = [];

  for (let row = 0; row < GRID; row++) {
    for (let column = 0; column < GRID; column++) {
      const fromY = Math.floor((row * height) / GRID);
      const toY = Math.max(fromY + 1, Math.floor(((row + 1) * height) / GRID));
      const fromX = Math.floor((column * width) / GRID);
      const toX = Math.max(fromX + 1, Math.floor(((column + 1) * width) / GRID));

      let sum = 0;
      let count = 0;
      for (let y = fromY; y < toY; y += 2) {
        for (let x = fromX; x < toX; x += 2) {
          const at = (y * width + x) * channels;
          sum += (pixels[at]! * 299 + pixels[at + 1]! * 587 + pixels[at + 2]! * 114) / 1000;
          count++;
        }
      }

      cells.push(Math.round(sum / count));
    }
  }

  return cells;
}

function isFrame({ pixels }: Image, at: number) {
  return (
    Math.abs(pixels[at]! - FRAME.red) < 6 &&
    Math.abs(pixels[at + 1]! - FRAME.green) < 6 &&
    Math.abs(pixels[at + 2]! - FRAME.blue) < 6
  );
}

function trimFrame(image: Image) {
  const { width, height, channels } = image;

  let right = width;
  while (right > 0) {
    let onlyFrame = true;
    for (let y = 0; y < height && onlyFrame; y++) {
      if (!isFrame(image, (y * width + right - 1) * channels)) onlyFrame = false;
    }
    if (!onlyFrame) break;
    right--;
  }

  let bottom = height;
  while (bottom > 0) {
    let onlyFrame = true;
    for (let x = 0; x < right && onlyFrame; x++) {
      if (!isFrame(image, ((bottom - 1) * width + x) * channels)) onlyFrame = false;
    }
    if (!onlyFrame) break;
    bottom--;
  }

  return { width: right, height: bottom };
}

function sectionSignature(image: Image) {
  const { width, height } = trimFrame(image);

  if (width === 0 || height === 0 || width === image.width || height === image.height) {
    return undefined;
  }

  const columns = Math.max(1, Math.round(width / CELL));
  const rows = Math.max(1, Math.round(height / CELL));
  if (columns * rows > CELL_CEILING) return { columns, rows, cells: undefined };

  const cells: number[] = [columns, rows];

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const fromY = Math.floor((row * height) / rows);
      const toY = Math.max(fromY + 1, Math.floor(((row + 1) * height) / rows));
      const fromX = Math.floor((column * width) / columns);
      const toX = Math.max(fromX + 1, Math.floor(((column + 1) * width) / columns));

      let sum = 0;
      let count = 0;
      for (let y = fromY; y < toY; y++) {
        for (let x = fromX; x < toX; x++) {
          const at = (y * image.width + x) * image.channels;
          sum +=
            (image.pixels[at]! * 299 + image.pixels[at + 1]! * 587 + image.pixels[at + 2]! * 114) /
            1000;
          count++;
        }
      }

      cells.push(Math.round(sum / count));
    }
  }

  return { columns, rows, cells };
}

const accept = process.argv.includes("--aceitar");
const stored: Record<string, number[]> = await Bun.file(SIGNATURES)
  .json()
  .catch(() => ({}));

const current: Record<string, number[]> = {};
const changed: { name: string; cells: number; total: number; worst: number }[] = [];
const fresh: string[] = [];
const broken: string[] = [];
const outdated: string[] = [];
const refused = new Set<string>();

for await (const file of new Glob("*.png").scan(SHOTS)) {
  const name = file.replace(/\.png$/, "");
  const image = decodePng(new Uint8Array(await Bun.file(`${SHOTS}/${file}`).arrayBuffer()));

  if (!image.build) {
    outdated.push(`${name} - sem marca de build`);
    refused.add(name);
    continue;
  }

  const drift = await driftOf(image.build);
  if (drift.length > 0) {
    outdated.push(`${name} - ${drift.join(", ")}`);
    refused.add(name);
    continue;
  }

  let signature: number[];

  if (isSection(name)) {
    const section = sectionSignature(image);

    if (!section) {
      broken.push(
        `${name} - a secao nao coube na janela, ou o marcador \`data-rc-shot\`` +
          " nao foi achado na pagina.",
      );
      refused.add(name);
      continue;
    }
    if (!section.cells) {
      broken.push(
        `${name} - a moldura tem ${section.columns}x${section.rows} celulas, acima do teto de` +
          ` ${CELL_CEILING}. Isso e uma pagina com nome de secao: aperte o` +
          " `data-rc-shot` ate a peca, ou fotografe a pagina inteira.",
      );
      refused.add(name);
      continue;
    }
    signature = section.cells;
  } else {
    signature = signatureOf(image);
  }

  current[name] = signature;

  const before = stored[name];
  if (!before) {
    fresh.push(name);
    continue;
  }

  if (isSection(name) && (before[0] !== signature[0] || before[1] !== signature[1])) {
    changed.push({
      name: `${name}  a moldura foi de ${before[0]}x${before[1]} para ${signature[0]}x${signature[1]} celulas`,
      cells: 0,
      total: 0,
      worst: 0,
    });
    continue;
  }

  const from = isSection(name) ? 2 : 0;
  let cells = 0;
  let worst = 0;
  for (let index = from; index < signature.length; index++) {
    const diff = Math.abs(signature[index]! - (before[index] ?? 0));
    if (diff > NOISE) cells++;
    worst = Math.max(worst, diff);
  }

  if (cells > 0) changed.push({ name, cells, total: signature.length - from, worst });
}

const gone = Object.keys(stored).filter((name) => !(name in current) && !refused.has(name));

if (accept && broken.length === 0 && outdated.length === 0) {
  await Bun.write(SIGNATURES, `${JSON.stringify(current, null, 0)}\n`);
  console.log(`${Object.keys(current).length} assinatura(s) guardada(s) em ${SIGNATURES}.`);
  process.exit(0);
}

for (const problem of outdated) console.log(`  recusou ${problem}`);
for (const problem of broken) console.log(`  quebrou ${problem}`);
for (const name of fresh) console.log(`  novo    ${name}`);
for (const name of gone) console.log(`  sumiu   ${name}`);
for (const { name, cells, total, worst } of changed.sort((a, b) => b.cells - a.cells)) {
  if (total === 0) {
    console.log(`  mudou   ${name}`);
    continue;
  }
  const share = ((cells / total) * 100).toFixed(1);
  console.log(`  mudou   ${name}  ${cells} de ${total} quadrados (${share}%), pior ${worst}`);
}

if (
  changed.length === 0 &&
  fresh.length === 0 &&
  gone.length === 0 &&
  broken.length === 0 &&
  outdated.length === 0
) {
  console.log(`${Object.keys(current).length} retratos, nenhum mudou.`);
  process.exit(0);
}

if (outdated.length > 0) {
  console.log(
    `\n${outdated.length} retrato(s) recusado(s): nao da para afirmar que o build que` +
      "\nos gerou e o que esta em demo/dist agora. Sem marca, o retrato veio de" +
      "\noutra ferramenta ou de antes desta guarda; com marca que nao fecha, algo" +
      "\nfoi reconstruido depois da foto." +
      "\n\nComparar assim responderia sobre outro build, e nem verde nem vermelho" +
      "\nseria verdade - por isso a recusa vem antes da comparacao, e --aceitar" +
      "\nnao grava enquanto ela existe." +
      "\n\nRefotografe: bun run shot. Uma secao sozinha: bun run retrato --secao <parte>.",
  );
}

if (changed.length > 0 || fresh.length > 0 || gone.length > 0) {
  console.log(
    "\nOlhe o que mudou antes de aceitar: esta guarda diz onde mudou, e nao se a" +
      "\nmudanca esta certa. Depois de olhar: bun run visual --aceitar",
  );
}

process.exit(changed.length > 0 || broken.length > 0 || outdated.length > 0 ? 1 : 0);
