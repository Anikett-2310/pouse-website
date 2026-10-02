const sharp = require('sharp');
const path = require('path');

async function createOgImage() {
  const width = 1200;
  const height = 630;

  // Read logo and resize
  const logoPath = path.join(__dirname, '../public/assets/pouse-logo.png');
  const resizedLogo = await sharp(logoPath)
    .resize(300, 300, { fit: 'contain' })
    .png()
    .toBuffer();

  const svgOverlay = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
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
    <rect width="${width}" height="${height}" fill="url(#bgGrad)"/>
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
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="24" fill="none" stroke="rgba(168, 85, 247, 0.22)" stroke-width="1.5"/>

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

  const finalImage = await sharp(Buffer.from(svgOverlay))
    .composite([
      {
        input: resizedLogo,
        top: 165,
        left: 110,
      }
    ])
    .png()
    .toFile(path.join(__dirname, '../public/og-image.png'));

  console.log('og-image.png generated successfully:', finalImage);
}

createOgImage().catch(console.error);
