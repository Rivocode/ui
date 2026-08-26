/**
 * Caca a regressao visual: compara cada retrato com a assinatura guardada.
 *
 * Dois defeitos desta bancada eram invisiveis para o `tsc` e para teste de
 * unidade, e gritantes numa captura: a barra indeterminada que parecia 100%, e
 * o botao carregando que perdia a variante. Nenhum teste de DOM pega "esta
 * cinza igual ao vizinho".
 *
 * O que se guarda nao e a imagem: sao 24 por 24 medias de cinza por retrato,
 * em JSON, que dao 576 numeros e cabem no diff. Guardar PNG seria oito megas
 * de binario no historico para nunca serem lidos por um humano.
 *
 * Isto nao entra no `bun run check`: a renderizacao de fonte muda entre
 * maquina e sistema, e uma assinatura tirada no macOS nao bate no Linux do CI.
 * E ferramenta de quem esta prestes a publicar, e a regra e olhar o que ela
 * apontar - ela diz onde mudou, e nao se a mudanca esta certa.
 */
import { Glob } from "bun";
import { inflateSync } from "node:zlib";

const SHOTS = "demo/dist";
const SIGNATURES = "demo/assinaturas.json";

/** O lado da grade. 24 pega uma barra que mudou de cor e ignora antialias. */
const GRID = 24;

/** Quanto um quadrado pode variar sem ser mudanca: 4 de 255 e ruido de fonte. */
const NOISE = 4;

/* ---------------------------------------------------------------------------
 * PNG
 *
 * O Chrome escreve RGBA de 8 bits sem entrelacamento, e e so isso que este
 * decodificador entende - ele existe para nao trazer uma dependencia de imagem
 * para um repositorio de componentes.
 * ------------------------------------------------------------------------- */

type Image = { width: number; height: number; channels: number; pixels: Uint8Array };

function decodePng(bytes: Uint8Array): Image {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 8; // assinatura do PNG

  let width = 0;
  let height = 0;
  let channels = 4;
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

    if (type === "IDAT") data.push(body);
    if (type === "IEND") break;

    at += 12 + length; // tamanho + tipo + corpo + crc
  }

  const deflated = new Uint8Array(data.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of data) {
    deflated.set(part, offset);
    offset += part.length;
  }

  // O IDAT vem embrulhado em zlib, com cabecalho e adler; o inflateSync do
  // Bun espera deflate cru e reclama de "invalid stored block lengths".
  const raw = inflateSync(deflated);
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * channels);

  // Cada linha carrega um byte de filtro na frente, e o filtro olha para o
  // pixel da esquerda e para o de cima ja reconstruidos - por isso a
  // reconstrucao e sequencial e nao da para paralelizar por linha.
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

  return { width, height, channels, pixels };
}

/** A media de cinza de cada quadrado da grade, de 0 a 255. */
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
      // Um pixel a cada dois em cada eixo: a media nao muda e a leitura de um
      // retrato de 2480 por 4000 cai para um quarto do trabalho.
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

const accept = process.argv.includes("--aceitar");
const stored: Record<string, number[]> = await Bun.file(SIGNATURES)
  .json()
  .catch(() => ({}));

const current: Record<string, number[]> = {};
const changed: { name: string; cells: number; worst: number }[] = [];
const fresh: string[] = [];

for await (const file of new Glob("*.png").scan(SHOTS)) {
  const name = file.replace(/\.png$/, "");
  const image = decodePng(new Uint8Array(await Bun.file(`${SHOTS}/${file}`).arrayBuffer()));
  const signature = signatureOf(image);
  current[name] = signature;

  const before = stored[name];
  if (!before) {
    fresh.push(name);
    continue;
  }

  let cells = 0;
  let worst = 0;
  for (let index = 0; index < signature.length; index++) {
    const diff = Math.abs(signature[index]! - (before[index] ?? 0));
    if (diff > NOISE) cells++;
    worst = Math.max(worst, diff);
  }

  if (cells > 0) changed.push({ name, cells, worst });
}

const gone = Object.keys(stored).filter((name) => !(name in current));

if (accept) {
  await Bun.write(SIGNATURES, `${JSON.stringify(current, null, 0)}\n`);
  console.log(`${Object.keys(current).length} assinatura(s) guardada(s) em ${SIGNATURES}.`);
  process.exit(0);
}

for (const name of fresh) console.log(`  novo    ${name}`);
for (const name of gone) console.log(`  sumiu   ${name}`);
for (const { name, cells, worst } of changed.sort((a, b) => b.cells - a.cells)) {
  const share = ((cells / (GRID * GRID)) * 100).toFixed(1);
  console.log(`  mudou   ${name}  ${cells} de ${GRID * GRID} quadrados (${share}%), pior ${worst}`);
}

if (changed.length === 0 && fresh.length === 0 && gone.length === 0) {
  console.log(`${Object.keys(current).length} retratos, nenhum mudou.`);
  process.exit(0);
}

console.log(
  "\nOlhe o que mudou antes de aceitar: esta guarda diz onde mudou, e nao se a" +
    "\nmudanca esta certa. Depois de olhar: bun run visual --aceitar",
);
process.exit(changed.length > 0 ? 1 : 0);
