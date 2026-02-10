import sharp from "sharp";
import { writeFileSync } from "fs";
import { join } from "path";

const ICON_DIR = "src-tauri/icons";

// Modern geometric train icon — hex.tech inspired minimalism
// Deep indigo gradient background with white geometric train silhouette
function generateSVG(size) {
  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;
  const r = Math.round(size * 0.18); // corner radius

  // Scale factor for the train drawing
  const s = inner / 100;
  const ox = pad;
  const oy = pad;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#5C5FE0" />
      <stop offset="50%" style="stop-color:#4F46E5" />
      <stop offset="100%" style="stop-color:#3B34B3" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" fill="url(#bg)" />
  <rect x="0" y="0" width="${size}" height="${Math.round(size * 0.5)}" rx="${r}" fill="url(#shine)" />

  <!-- Geometric train silhouette — minimal, modern -->
  <g transform="translate(${ox}, ${oy})" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round">

    <!-- Train body — rounded rectangle -->
    <rect x="${s * 15}" y="${s * 22}" width="${s * 70}" height="${s * 42}" rx="${s * 6}"
          stroke-width="${s * 4}" fill="rgba(255,255,255,0.08)" />

    <!-- Cabin front window band -->
    <line x1="${s * 15}" y1="${s * 40}" x2="${s * 85}" y2="${s * 40}" stroke-width="${s * 2.5}" stroke="rgba(255,255,255,0.6)" />

    <!-- Two windows -->
    <rect x="${s * 24}" y="${s * 27}" width="${s * 14}" height="${s * 9}" rx="${s * 2}" stroke-width="${s * 2.5}" fill="rgba(255,255,255,0.12)" />
    <rect x="${s * 62}" y="${s * 27}" width="${s * 14}" height="${s * 9}" rx="${s * 2}" stroke-width="${s * 2.5}" fill="rgba(255,255,255,0.12)" />

    <!-- Headlight -->
    <circle cx="${s * 50}" cy="${s * 31}" r="${s * 3}" fill="white" stroke="none" opacity="0.9" />

    <!-- Wheels -->
    <circle cx="${s * 30}" cy="${s * 67}" r="${s * 5}" stroke-width="${s * 3}" />
    <circle cx="${s * 70}" cy="${s * 67}" r="${s * 5}" stroke-width="${s * 3}" />

    <!-- Rail line -->
    <line x1="${s * 8}" y1="${s * 74}" x2="${s * 92}" y2="${s * 74}" stroke-width="${s * 2.5}" stroke="rgba(255,255,255,0.35)" />

    <!-- Chimney / antenna -->
    <line x1="${s * 30}" y1="${s * 22}" x2="${s * 30}" y2="${s * 14}" stroke-width="${s * 3}" />
    <circle cx="${s * 30}" cy="${s * 12}" r="${s * 2.5}" fill="white" stroke="none" opacity="0.7" />

  </g>
</svg>`;
}

async function main() {
  const sizes = [32, 64, 128, 256, 512];

  for (const size of sizes) {
    const svg = generateSVG(size);
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    if (size === 32) {
      writeFileSync(join(ICON_DIR, "32x32.png"), pngBuffer);
    }
    if (size === 64) {
      writeFileSync(join(ICON_DIR, "32x32@2x.png"), pngBuffer);
    }
    if (size === 128) {
      writeFileSync(join(ICON_DIR, "128x128.png"), pngBuffer);
    }
    if (size === 256) {
      writeFileSync(join(ICON_DIR, "128x128@2x.png"), pngBuffer);
      writeFileSync(join(ICON_DIR, "256x256.png"), pngBuffer);
    }
    if (size === 512) {
      writeFileSync(join(ICON_DIR, "icon.png"), pngBuffer);
    }
  }

  // Generate ICO from multiple sizes
  const ico32 = await sharp(Buffer.from(generateSVG(32))).png().toBuffer();
  const ico48 = await sharp(Buffer.from(generateSVG(48))).png().toBuffer();
  const ico256 = await sharp(Buffer.from(generateSVG(256))).png().toBuffer();

  // Build ICO file (multi-size)
  const icoBuffers = [
    { buf: ico32, size: 32 },
    { buf: ico48, size: 48 },
    { buf: ico256, size: 256 },
  ];

  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(icoBuffers.length, 4);

  const entries = [];
  let dataOffset = 6 + icoBuffers.length * 16;

  for (const { buf, size } of icoBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // data size
    entry.writeUInt32LE(dataOffset, 12); // data offset
    entries.push(entry);
    dataOffset += buf.length;
  }

  const icoFile = Buffer.concat([
    icoHeader,
    ...entries,
    ...icoBuffers.map((b) => b.buf),
  ]);

  writeFileSync(join(ICON_DIR, "icon.ico"), icoFile);

  console.log("Icons generated successfully!");
  console.log("Files:", sizes.map((s) => `${s}x${s}`).join(", "), "+ ICO");
}

main().catch(console.error);
