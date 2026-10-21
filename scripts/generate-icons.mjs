// Generates the PWA icons (public/icons/icon-192.png, icon-512.png) without dependencies.
// Run manually with `npm run icons`; the PNG files are committed to the repository.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const SIZES = [192, 512];
const SUPERSAMPLE = 4;

const BACKGROUND = [0x0b, 0x10, 0x20];
// Board order from DESIGN.md: green top-left, red top-right, yellow bottom-left, blue bottom-right
const TILES = [
  { col: 0, row: 0, color: [0x4c, 0xd9, 0x64] },
  { col: 1, row: 0, color: [0xff, 0x5b, 0x57] },
  { col: 0, row: 1, color: [0xff, 0xb7, 0x4d] },
  { col: 1, row: 1, color: [0x4d, 0xa3, 0xff] },
];

// Layout as fractions of the icon size; the board stays inside the maskable safe zone (central 80%)
const BOARD = 0.6;
const GAP = 0.04;
const TILE = (BOARD - GAP) / 2;
const RADIUS = 0.06;

function insideRoundedRect(x, y, left, top, size, radius) {
  const cx = Math.min(Math.max(x, left + radius), left + size - radius);
  const cy = Math.min(Math.max(y, top + radius), top + size - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function colorAt(x, y) {
  const start = (1 - BOARD) / 2;
  for (const tile of TILES) {
    const left = start + tile.col * (TILE + GAP);
    const top = start + tile.row * (TILE + GAP);
    if (insideRoundedRect(x, y, left, top, TILE, RADIUS)) return tile.color;
  }
  return BACKGROUND;
}

function renderPixels(size) {
  const pixels = Buffer.alloc(size * size * 3);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const c = colorAt((px + (sx + 0.5) / SUPERSAMPLE) / size, (py + (sy + 0.5) / SUPERSAMPLE) / size);
          sum[0] += c[0];
          sum[1] += c[1];
          sum[2] += c[2];
        }
      }
      const i = (py * size + px) * 3;
      pixels[i] = Math.round(sum[0] / samples);
      pixels[i + 1] = Math.round(sum[1] / samples);
      pixels[i + 2] = Math.round(sum[2] / samples);
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // color type: RGB
  // Each row starts with filter byte 0 (none)
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    pixels.copy(raw, y * (size * 3 + 1) + 1, y * size * 3, (y + 1) * size * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, encodePng(size, renderPixels(size)));
  console.log(`wrote ${file}`);
}
