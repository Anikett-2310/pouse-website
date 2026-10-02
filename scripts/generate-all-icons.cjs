const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

function createIcoFromPngBuffers(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + count * dirEntrySize;

  let currentOffset = dirSize;
  const entries = [];

  for (const item of pngBuffers) {
    entries.push({
      width: item.width >= 256 ? 0 : item.width,
      height: item.height >= 256 ? 0 : item.height,
      colorCount: 0,
      reserved: 0,
      planes: 1,
      bitCount: 32,
      bytesInRes: item.buffer.length,
      imageOffset: currentOffset,
      buffer: item.buffer,
    });
    currentOffset += item.buffer.length;
  }

  const icoBuffer = Buffer.alloc(currentOffset);

  // ICONDIR header
  icoBuffer.writeUInt16LE(0, 0); // reserved
  icoBuffer.writeUInt16LE(1, 2); // type: 1 = ICO
  icoBuffer.writeUInt16LE(count, 4); // count

  // ICONDIRENTRY entries
  let offset = headerSize;
  for (const entry of entries) {
    icoBuffer.writeUInt8(entry.width, offset + 0);
    icoBuffer.writeUInt8(entry.height, offset + 1);
    icoBuffer.writeUInt8(entry.colorCount, offset + 2);
    icoBuffer.writeUInt8(entry.reserved, offset + 3);
    icoBuffer.writeUInt16LE(entry.planes, offset + 4);
    icoBuffer.writeUInt16LE(entry.bitCount, offset + 6);
    icoBuffer.writeUInt32LE(entry.bytesInRes, offset + 8);
    icoBuffer.writeUInt32LE(entry.imageOffset, offset + 12);

    // Write image data
    entry.buffer.copy(icoBuffer, entry.imageOffset);

    offset += dirEntrySize;
  }

  return icoBuffer;
}

async function run() {
  const masterPath = path.join(__dirname, '../docs/assets/pouse-app-master.png');
  console.log('=== Task 1: Logo Cleanup & Icon Regeneration ===');
  console.log('Reading master logo from:', masterPath);

  const { data, info } = await sharp(masterPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Perimeter flood-fill
  for (let x = 0; x < width; x++) {
    queue.push(x);
    queue.push((height - 1) * width + x);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width);
    queue.push(y * width + (width - 1));
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const idx = n * channels;
        const g = data[idx + 1];
        if (g >= 25) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  const outData = Buffer.from(data);
  const BG_WHITE = 247;

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    if (visited[i]) {
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (g >= 235 || (r >= 235 && g >= 225 && b >= 235)) {
        outData[idx] = 0;
        outData[idx + 1] = 0;
        outData[idx + 2] = 0;
        outData[idx + 3] = 0;
      } else {
        const alphaNorm = Math.max(0, Math.min(1, (BG_WHITE - g) / (BG_WHITE - 15)));
        const alpha = Math.round(alphaNorm * 255);

        if (alpha <= 8) {
          outData[idx] = 0;
          outData[idx + 1] = 0;
          outData[idx + 2] = 0;
          outData[idx + 3] = 0;
        } else {
          const rUnmix = Math.max(0, Math.min(255, Math.round((r - BG_WHITE * (1 - alphaNorm)) / alphaNorm)));
          const bUnmix = Math.max(0, Math.min(255, Math.round((b - BG_WHITE * (1 - alphaNorm)) / alphaNorm)));
          const gUnmix = Math.max(0, Math.min(255, Math.round((g - BG_WHITE * (1 - alphaNorm)) / alphaNorm)));

          outData[idx] = rUnmix;
          outData[idx + 1] = gUnmix;
          outData[idx + 2] = bUnmix;
          outData[idx + 3] = alpha;
        }
      }
    } else {
      outData[idx + 3] = 255;
    }
  }

  // Crop to square 1080x1080
  const squareSize = 1080;
  const cropLeft = 82;
  const cropTop = 65;

  const squareSquircle = await sharp(outData, {
    raw: { width, height, channels: 4 }
  })
    .extract({ left: cropLeft, top: cropTop, width: squareSize, height: squareSize })
    .png()
    .toBuffer();

  const pubDir = path.join(__dirname, '../public');
  const pubAssetsDir = path.join(pubDir, 'assets');
  const srcAssetsDir = path.join(__dirname, '../src/assets');

  if (!fs.existsSync(pubAssetsDir)) fs.mkdirSync(pubAssetsDir, { recursive: true });
  if (!fs.existsSync(srcAssetsDir)) fs.mkdirSync(srcAssetsDir, { recursive: true });

  // Save master cleaned logos
  fs.writeFileSync(path.join(pubAssetsDir, 'pouse-logo.png'), squareSquircle);
  fs.writeFileSync(path.join(srcAssetsDir, 'pouse-logo.png'), squareSquircle);
  console.log('✓ Master cleaned logo written to public/assets/pouse-logo.png and src/assets/pouse-logo.png');

  // Generate Favicons: 16x16, 32x32, 48x48
  const fav16 = await sharp(squareSquircle).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(squareSquircle).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(squareSquircle).resize(48, 48).png().toBuffer();

  fs.writeFileSync(path.join(pubDir, 'favicon-16x16.png'), fav16);
  fs.writeFileSync(path.join(pubDir, 'favicon-32x32.png'), fav32);
  fs.writeFileSync(path.join(pubDir, 'favicon-48x48.png'), fav48);
  fs.writeFileSync(path.join(pubDir, 'favicon.png'), fav32);
  console.log('✓ Generated favicon-16x16.png, favicon-32x32.png, favicon-48x48.png, favicon.png');

  // Generate favicon.ico (multi-res 16, 32, 48)
  const icoBuffer = createIcoFromPngBuffers([
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ]);
  fs.writeFileSync(path.join(pubDir, 'favicon.ico'), icoBuffer);
  console.log('✓ Generated multi-resolution favicon.ico (16, 32, 48)');

  // Generate Apple Touch Icon: 180x180
  const appleTouch = await sharp(squareSquircle).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), appleTouch);
  console.log('✓ Generated apple-touch-icon.png (180x180)');

  // Generate App Icons: 192x192, 512x512
  const icon192 = await sharp(squareSquircle).resize(192, 192).png().toBuffer();
  const icon512 = await sharp(squareSquircle).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(pubDir, 'icon-192.png'), icon192);
  fs.writeFileSync(path.join(pubDir, 'icon-512.png'), icon512);
  console.log('✓ Generated icon-192.png and icon-512.png');

  // Regenerate OG Image: 1200x630
  console.log('\nRegenerating og-image.png with cleaned logo...');
  const ogWidth = 1200;
  const ogHeight = 630;
  const ogLogo = await sharp(squareSquircle).resize(290, 290, { fit: 'contain' }).png().toBuffer();

  const svgOverlay = `
  <svg width="${ogWidth}" height="${ogHeight}" viewBox="0 0 ${ogWidth} ${ogHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#07040B"/>
        <stop offset="40%" stop-color="#0E0818"/>
        <stop offset="100%" stop-color="#180C2C"/>
      </linearGradient>
      <radialGradient id="purpleGlow" cx="20%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#A855F7" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#A855F7" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="pinkGlow" cx="80%" cy="30%" r="45%">
        <stop offset="0%" stop-color="#EC4899" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#EC4899" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="brandTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#F8FAFC"/>
        <stop offset="60%" stop-color="#E9D5FF"/>
        <stop offset="100%" stop-color="#F472B6"/>
      </linearGradient>
      <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#A855F7" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#EC4899" stop-opacity="0.25"/>
      </linearGradient>
    </defs>

    <!-- Background -->
    <rect width="${ogWidth}" height="${ogHeight}" fill="url(#bgGrad)"/>
    <circle cx="280" cy="315" r="380" fill="url(#purpleGlow)"/>
    <circle cx="950" cy="200" r="350" fill="url(#pinkGlow)"/>

    <!-- Subtle Grid Overlay -->
    <g stroke="rgba(168, 85, 247, 0.05)" stroke-width="1">
      <line x1="0" y1="105" x2="1200" y2="105"/>
      <line x1="0" y1="210" x2="1200" y2="210"/>
      <line x1="0" y1="315" x2="1200" y2="315"/>
      <line x1="0" y1="420" x2="1200" y2="420"/>
      <line x1="0" y1="525" x2="1200" y2="525"/>
      <line x1="200" y1="0" x2="200" y2="630"/>
      <line x1="400" y1="0" x2="400" y2="630"/>
      <line x1="600" y1="0" x2="600" y2="630"/>
      <line x1="800" y1="0" x2="800" y2="630"/>
      <line x1="1000" y1="0" x2="1000" y2="630"/>
    </g>

    <!-- Border highlight -->
    <rect x="24" y="24" width="${ogWidth - 48}" height="${ogHeight - 48}" rx="24" fill="none" stroke="rgba(168, 85, 247, 0.22)" stroke-width="1.5"/>

    <!-- Text Group -->
    <g transform="translate(480, 160)">
      <!-- Badge -->
      <rect x="0" y="0" width="230" height="34" rx="17" fill="url(#pillGrad)" stroke="rgba(168, 85, 247, 0.4)" stroke-width="1"/>
      <text x="115" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#E9D5FF" text-anchor="middle" letter-spacing="0.8">POCKET MOUSE PLATFORM</text>

      <!-- Main Title -->
      <text x="0" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="url(#brandTextGrad)" letter-spacing="-1">Pouse</text>

      <!-- Tagline -->
      <text x="0" y="150" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="600" fill="#F8FAFC">One phone. Multiple ways to control your PC.</text>

      <!-- Description -->
      <text x="0" y="196" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="#CBD5E1">Touchpad • Motion • Touchless • Gamepad • Remote Screen</text>

      <!-- Bottom Specs -->
      <g transform="translate(0, 260)">
        <rect x="0" y="0" width="130" height="36" rx="8" fill="#130B22" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
        <text x="65" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#38BDF8" text-anchor="middle">Windows 10/11</text>

        <rect x="142" y="0" width="110" height="36" rx="8" fill="#130B22" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
        <text x="197" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#4ADE80" text-anchor="middle">Android</text>

        <rect x="264" y="0" width="136" height="36" rx="8" fill="#130B22" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
        <text x="332" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#E9D5FF" text-anchor="middle">Release v1.0.0</text>

        <rect x="412" y="0" width="200" height="36" rx="8" fill="#130B22" stroke="rgba(168, 85, 247, 0.3)" stroke-width="1"/>
        <text x="512" y="23" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#CBD5E1" text-anchor="middle">Source code on GitHub</text>
      </g>
    </g>
  </svg>
  `;

  await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: ogLogo,
        top: 170,
        left: 115,
      }
    ])
    .png()
    .toFile(path.join(pubDir, 'og-image.png'));

  console.log('✓ og-image.png successfully regenerated (1200x630)');
  console.log('=== All Task 1 Icon Generations Completed! ===');
}

run().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
