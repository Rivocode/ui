export type QrLevel = "L" | "M" | "Q" | "H";

export type QrMatrix = {
  /** Lado do simbolo em modulos, sem a margem de silencio: `17 + 4 * version`. */
  size: number;
  /** A versao escolhida, de 1 a 40: a menor em que o texto cabe no nivel pedido. */
  version: number;
  /** O nivel de correcao usado. */
  level: QrLevel;
  /** A mascara escolhida, de 0 a 7: a de menor penalidade pela ISO/IEC 18004. */
  mask: number;
  /** Linha a linha, `true` e modulo escuro. */
  modules: boolean[][];
};

export const QR_QUIET_ZONE = 4;

const LEVEL_INDEX: Record<QrLevel, number> = { L: 0, M: 1, Q: 2, H: 3 };
const LEVEL_BITS: Record<QrLevel, number> = { L: 1, M: 0, Q: 3, H: 2 };

const ECC_PER_BLOCK = [
  [
    -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30,
    30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
  [
    -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30,
    30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  [
    -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
];

const BLOCKS = [
  [
    -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14,
    15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25,
  ],
  [
    -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
    26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
  [
    -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34,
    34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68,
  ],
  [
    -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37,
    40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
  ],
];

const ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

type Segment = { mode: number; count: number; bits: number[]; countBits: [number, number, number] };

const bit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

function push(bits: number[], value: number, length: number) {
  for (let index = length - 1; index >= 0; index--) bits.push((value >>> index) & 1);
}

function utf8(text: string) {
  const bytes: number[] = [];
  for (const character of text) {
    const code = character.codePointAt(0)!;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000)
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
  }
  return bytes;
}

function segmentOf(text: string): Segment {
  if (/^\d*$/.test(text)) {
    const bits: number[] = [];
    for (let index = 0; index < text.length; index += 3) {
      const group = text.slice(index, index + 3);
      push(bits, Number(group), group.length * 3 + 1);
    }
    return { mode: 1, count: text.length, bits, countBits: [10, 12, 14] };
  }

  if ([...text].every((character) => ALPHANUMERIC.includes(character))) {
    const bits: number[] = [];
    for (let index = 0; index + 1 < text.length; index += 2) {
      push(
        bits,
        ALPHANUMERIC.indexOf(text[index]!) * 45 + ALPHANUMERIC.indexOf(text[index + 1]!),
        11,
      );
    }
    if (text.length % 2 === 1) push(bits, ALPHANUMERIC.indexOf(text[text.length - 1]!), 6);
    return { mode: 2, count: text.length, bits, countBits: [9, 11, 13] };
  }

  const bytes = utf8(text);
  const bits: number[] = [];
  for (const byte of bytes) push(bits, byte, 8);
  return { mode: 4, count: bytes.length, bits, countBits: [8, 16, 16] };
}

const countBitsFor = (segment: Segment, version: number) =>
  segment.countBits[version < 10 ? 0 : version < 27 ? 1 : 2];

function rawModules(version: number) {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const aligns = Math.floor(version / 7) + 2;
    result -= (25 * aligns - 10) * aligns - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

const dataCodewords = (version: number, level: QrLevel) =>
  Math.floor(rawModules(version) / 8) -
  ECC_PER_BLOCK[LEVEL_INDEX[level]]![version]! * BLOCKS[LEVEL_INDEX[level]]![version]!;

function multiply(x: number, y: number) {
  let z = 0;
  for (let index = 7; index >= 0; index--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> index) & 1) * x;
  }
  return z;
}

function divisor(degree: number) {
  const result: number[] = Array.from({ length: degree }, () => 0);
  result[degree - 1] = 1;
  let root = 1;
  for (let step = 0; step < degree; step++) {
    for (let index = 0; index < degree; index++) {
      result[index] = multiply(result[index]!, root);
      if (index + 1 < degree) result[index]! ^= result[index + 1]!;
    }
    root = multiply(root, 2);
  }
  return result;
}

function remainder(data: number[], generator: number[]) {
  const result: number[] = generator.map(() => 0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    generator.forEach((coefficient, index) => {
      result[index]! ^= multiply(coefficient, factor);
    });
  }
  return result;
}

function interleave(data: number[], version: number, level: QrLevel) {
  const blockCount = BLOCKS[LEVEL_INDEX[level]]![version]!;
  const eccLength = ECC_PER_BLOCK[LEVEL_INDEX[level]]![version]!;
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blockCount - (raw % blockCount);
  const shortLength = Math.floor(raw / blockCount);
  const generator = divisor(eccLength);

  const blocks: number[][] = [];
  for (let index = 0, at = 0; index < blockCount; index++) {
    const slice = data.slice(at, at + shortLength - eccLength + (index < shortBlocks ? 0 : 1));
    at += slice.length;
    const ecc = remainder(slice, generator);
    if (index < shortBlocks) slice.push(0);
    blocks.push([...slice, ...ecc]);
  }

  const result: number[] = [];
  for (let column = 0; column < blocks[0]!.length; column++) {
    blocks.forEach((block, index) => {
      if (column !== shortLength - eccLength || index >= shortBlocks) result.push(block[column]!);
    });
  }
  return result;
}

function alignmentCenters(version: number) {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const result = [6];
  for (let position = version * 4 + 10; result.length < count; position -= step) {
    result.splice(1, 0, position);
  }
  return result;
}

const MASKS: Array<(x: number, y: number) => boolean> = [
  (x, y) => (x + y) % 2 === 0,
  (_, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

type Grid = { size: number; modules: boolean[][]; reserved: boolean[][] };

const square = (size: number) =>
  Array.from({ length: size }, () => Array.from({ length: size }, () => false));

function fixed(grid: Grid, x: number, y: number, dark: boolean) {
  grid.modules[y]![x] = dark;
  grid.reserved[y]![x] = true;
}

function drawFunctionPatterns(grid: Grid, version: number) {
  const { size } = grid;

  for (let index = 0; index < size; index++) {
    fixed(grid, 6, index, index % 2 === 0);
    fixed(grid, index, 6, index % 2 === 0);
  }

  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        fixed(grid, x, y, distance !== 2 && distance !== 4);
      }
    }
  }

  const centers = alignmentCenters(version);
  const last = centers.length - 1;
  centers.forEach((cx, i) => {
    centers.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          fixed(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    });
  });

  drawFormat(grid, "L", 0);

  if (version >= 7) {
    let rest = version;
    for (let step = 0; step < 12; step++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
    const bits = (version << 12) | rest;
    for (let index = 0; index < 18; index++) {
      const dark = bit(bits, index);
      const a = size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      fixed(grid, a, b, dark);
      fixed(grid, b, a, dark);
    }
  }
}

function drawFormat(grid: Grid, level: QrLevel, mask: number) {
  const { size } = grid;
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rest = data;
  for (let step = 0; step < 10; step++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  const bits = ((data << 10) | rest) ^ 0x5412;

  for (let index = 0; index <= 5; index++) fixed(grid, 8, index, bit(bits, index));
  fixed(grid, 8, 7, bit(bits, 6));
  fixed(grid, 8, 8, bit(bits, 7));
  fixed(grid, 7, 8, bit(bits, 8));
  for (let index = 9; index < 15; index++) fixed(grid, 14 - index, 8, bit(bits, index));

  for (let index = 0; index < 8; index++) fixed(grid, size - 1 - index, 8, bit(bits, index));
  for (let index = 8; index < 15; index++) fixed(grid, 8, size - 15 + index, bit(bits, index));
  fixed(grid, 8, size - 8, true);
}

function drawData(grid: Grid, codewords: number[]) {
  const { size } = grid;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let offset = 0; offset < 2; offset++) {
        const x = right - offset;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (grid.reserved[y]![x] || index >= codewords.length * 8) continue;
        grid.modules[y]![x] = bit(codewords[index >>> 3]!, 7 - (index & 7));
        index++;
      }
    }
  }
}

function applyMask(grid: Grid, mask: number) {
  const test = MASKS[mask]!;
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (!grid.reserved[y]![x] && test(x, y)) grid.modules[y]![x] = !grid.modules[y]![x];
    }
  }
}

const FINDER_LIKE = ["10111010000", "00001011101"];

function linePenalty(line: boolean[]) {
  let score = 0;
  let run = 1;
  for (let index = 1; index <= line.length; index++) {
    if (index < line.length && line[index] === line[index - 1]) {
      run++;
      continue;
    }
    if (run >= 5) score += 3 + (run - 5);
    run = 1;
  }

  const text = `0000${line.map((dark) => (dark ? "1" : "0")).join("")}0000`;
  for (const pattern of FINDER_LIKE) {
    for (let at = text.indexOf(pattern); at !== -1; at = text.indexOf(pattern, at + 1)) {
      score += 40;
    }
  }
  return score;
}

function qrPenalty(modules: boolean[][]) {
  const size = modules.length;
  let score = 0;
  let dark = 0;

  for (let y = 0; y < size; y++) {
    score += linePenalty(modules[y]!);
    score += linePenalty(modules.map((row) => row[y]!));
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = modules[y]![x]!;
      if (color) dark++;
      if (
        x + 1 < size &&
        y + 1 < size &&
        color === modules[y]![x + 1] &&
        color === modules[y + 1]![x] &&
        color === modules[y + 1]![x + 1]
      ) {
        score += 3;
      }
    }
  }

  const total = size * size;
  score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  return score;
}

export function encodeQr(text: string, level: QrLevel = "M"): QrMatrix {
  const segment = segmentOf(text);

  let version = 1;
  for (; version <= 40; version++) {
    const needed = 4 + countBitsFor(segment, version) + segment.bits.length;
    if (segment.count < 2 ** countBitsFor(segment, version) && needed <= dataCodewords(version, level) * 8) {
      break;
    }
  }
  if (version > 40) {
    throw new RangeError(
      `O texto nao cabe num QR Code de nivel ${level}: sao ${segment.bits.length} bits de dado.`,
    );
  }

  const capacity = dataCodewords(version, level) * 8;
  const bits: number[] = [];
  push(bits, segment.mode, 4);
  push(bits, segment.count, countBitsFor(segment, version));
  bits.push(...segment.bits);
  push(bits, 0, Math.min(4, capacity - bits.length));
  push(bits, 0, (8 - (bits.length % 8)) % 8);

  const data: number[] = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bits.slice(index, index + 8).reduce((byte, value) => (byte << 1) | value, 0));
  }
  for (let pad = 0xec; data.length < capacity / 8; pad ^= 0xec ^ 0x11) data.push(pad);

  const size = version * 4 + 17;
  const grid: Grid = { size, modules: square(size), reserved: square(size) };
  drawFunctionPatterns(grid, version);
  drawData(grid, interleave(data, version, level));

  let best = 0;
  let lowest = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(grid, mask);
    drawFormat(grid, level, mask);
    const score = qrPenalty(grid.modules);
    if (score < lowest) {
      lowest = score;
      best = mask;
    }
    applyMask(grid, mask);
  }

  applyMask(grid, best);
  drawFormat(grid, level, best);

  return { size, version, level, mask: best, modules: grid.modules };
}

export function qrLogoArea(size: number) {
  const side = Math.floor(size * 0.22);
  const odd = side % 2 === 1 ? side : side - 1;
  const start = (size - odd) / 2;
  return { start, end: start + odd };
}

export function qrPath(matrix: QrMatrix, options: { margin?: number; hole?: boolean } = {}) {
  const { margin = QR_QUIET_ZONE, hole = false } = options;
  const area = hole ? qrLogoArea(matrix.size) : null;
  const inHole = (x: number, y: number) =>
    area !== null && x >= area.start && x < area.end && y >= area.start && y < area.end;

  let path = "";
  matrix.modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x] || inHole(x, y)) {
        x++;
        continue;
      }
      let end = x;
      while (end < row.length && row[end] && !inHole(end, y)) end++;
      path += `M${x + margin} ${y + margin}h${end - x}v1h${x - end}z`;
      x = end;
    }
  });
  return path;
}
