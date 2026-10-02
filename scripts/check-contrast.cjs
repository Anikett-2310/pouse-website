function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function getContrast(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const backgrounds = {
  'bg-canvas': '#07040B',
  'bg-surface': '#0D0715',
  'bg-elevated': '#160D25',
  'bg-code': '#0A0512',
};

const textColors = {
  'text-primary': '#F8FAFC',
  'text-secondary': '#CBD5E1',
  'text-muted': '#94A3B8',
  'purple-light': '#E9D5FF',
  'pink-accent': '#EC4899',
  'pink-light': '#FCE7F3',
  'status-windows': '#38BDF8',
  'status-android': '#4ADE80',
  'status-warning': '#FBBF24',
};

console.log('=== WCAG 2.1 AA Contrast Ratio Verification ===\n');
let allPass = true;

for (const [bgName, bgHex] of Object.entries(backgrounds)) {
  console.log(`Background: ${bgName} (${bgHex})`);
  console.log('-'.repeat(55));
  for (const [textName, textHex] of Object.entries(textColors)) {
    const ratio = getContrast(textHex, bgHex);
    const pass = ratio >= 4.5;
    const status = pass ? '✓ PASS' : '✗ FAIL';
    if (!pass) allPass = false;
    console.log(`  ${textName.padEnd(16)} (${textHex}): ${ratio.toFixed(2)}:1  ${status} (min 4.5:1)`);
  }
  console.log('\n');
}

if (!allPass) {
  console.error('Some pairs failed WCAG AA threshold of 4.5:1!');
  process.exit(1);
} else {
  console.log('All text/background pairs pass WCAG AA (>= 4.5:1)!');
}
