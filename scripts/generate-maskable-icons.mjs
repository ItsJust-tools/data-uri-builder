#!/usr/bin/env node
/**
 * Generates the maskable PWA icons in public/.
 *
 * Maskable icons must fill the entire canvas (no transparent corners) and keep
 * their meaningful content inside the safe zone: a circle with a diameter of
 * 80% of the icon size, centered on the canvas.
 *
 * Run: node scripts/generate-maskable-icons.mjs
 */

import { join, resolve } from 'path';
import sharp from 'sharp';

const ROOT = resolve(process.cwd());
const BACKGROUND = '#111827';
const FOREGROUND = '#f9fafb';
const SIZES = [192, 512];

/**
 * Builds a full-bleed SVG: square background plus glyphs sized for the
 * maskable safe zone (glyph block stays within the inner 80% circle).
 */
function maskableSvg(size) {
  // Glyph block occupies ~46% of the canvas, well inside the 80% safe circle.
  const fontSize = Math.round(size * 0.6);
  const baseline = Math.round(size / 2 + fontSize * 0.27);

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BACKGROUND}"/>
  <text x="${size / 2}" y="${baseline}" font-family="DejaVu Sans, system-ui, -apple-system, sans-serif" font-size="${fontSize}" fill="${FOREGROUND}" text-anchor="middle" font-weight="bold">ij</text>
</svg>
`;
}

for (const size of SIZES) {
  const svg = maskableSvg(size);
  const outPath = join(ROOT, 'public', `maskable-icon-${size}.png`);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`generated public/maskable-icon-${size}.png`);
}
