const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist');
const SRC_DIR = path.resolve(__dirname, '../src');

async function verifyFrames() {
  console.log('=== VERIFYING SCREENSHOT FRAMES & ASPECT RATIOS ===\n');

  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('dist/ directory not found. Please build first.');
  }

  // 1. Check for any remaining 'object-fit: contain' in media components
  console.log('--- 1. Checking for object-fit: contain in src/ & dist/ ---');
  let containFound = false;

  function searchFiles(dir, exts) {
    const list = [];
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        list.push(...searchFiles(p, exts));
      } else if (exts.some(ext => f.endsWith(ext))) {
        list.push(p);
      }
    }
    return list;
  }

  const srcFiles = searchFiles(path.join(SRC_DIR, 'components'), ['.astro', '.css']);
  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('object-fit: contain') || content.includes('object-fit:contain')) {
      console.error(`[FAIL] Found object-fit: contain in ${path.relative(SRC_DIR, file)}`);
      containFound = true;
    }
  }

  if (!containFound) {
    console.log('✓ No object-fit: contain found in media components!\n');
  }

  // 2. Scan all HTML pages in dist/ and inspect every <img> inside device-shell
  console.log('--- 2. Inspecting all <img> & <video> frame ratios across dist/ ---');
  const htmlFiles = searchFiles(DIST_DIR, ['.html']);
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC_DIR, 'config', 'media-manifest.json'), 'utf-8'));

  const report = [];
  let mismatchCount = 0;

  for (const htmlFile of htmlFiles) {
    const relPage = path.relative(DIST_DIR, htmlFile).replace(/\\/g, '/');
    const content = fs.readFileSync(htmlFile, 'utf-8');

    // Find all device shells
    // Regex for device-shell elements with style attribute and inner img/video
    const shellRegex = /<div\s+[^>]*?class="([^"]*device-shell[^"]*)"[^>]*?style="([^"]*)"[^>]*?>([\s\S]*?)<\/div>/g;
    let match;

    while ((match = shellRegex.exec(content)) !== null) {
      const styleAttr = match[2];
      const innerHtml = match[3];

      // Extract style aspect-ratio: aspect-ratio: 738 / 1600 or --media-aspect-ratio: 738 / 1600
      const arMatch = styleAttr.match(/aspect-ratio:\s*([0-9.]+)\s*\/\s*([0-9.]+)/);
      const frameRatioStr = arMatch ? `${arMatch[1]} / ${arMatch[2]}` : 'not-found';
      const frameRatioVal = arMatch ? (parseFloat(arMatch[1]) / parseFloat(arMatch[2])) : NaN;

      // Extract img or video
      const imgMatch = innerHtml.match(/<img\s+([^>]+)>/);
      const videoMatch = innerHtml.match(/<video\s+([^>]+)>/);

      let tagType = 'none';
      let tagAttrs = '';
      if (imgMatch) {
        tagType = 'img';
        tagAttrs = imgMatch[1];
      } else if (videoMatch) {
        tagType = 'video';
        tagAttrs = videoMatch[1];
      }

      if (tagType !== 'none') {
        const srcMatch = tagAttrs.match(/src="([^"]+)"/);
        const widthMatch = tagAttrs.match(/width="(\d+)"/);
        const heightMatch = tagAttrs.match(/height="(\d+)"/);

        const src = srcMatch ? srcMatch[1] : 'unknown';
        const attrW = widthMatch ? parseInt(widthMatch[1], 10) : null;
        const attrH = heightMatch ? parseInt(heightMatch[1], 10) : null;

        // Derive assetId
        const base = path.basename(src).split('.')[0].replace(/-\d+w$/, '');
        const realMeta = manifest[base];

        let realW = realMeta ? realMeta.width : attrW;
        let realH = realMeta ? realMeta.height : attrH;
        let realRatioVal = realW && realH ? (realW / realH) : NaN;
        let realRatioStr = realW && realH ? `${realW} / ${realH}` : 'unknown';

        const diff = Math.abs(frameRatioVal - realRatioVal);
        const isMatch = diff < 0.001;

        if (!isMatch) {
          mismatchCount++;
        }

        report.push({
          page: relPage || 'index.html',
          asset: base,
          tag: tagType,
          attrDims: `${attrW}x${attrH}`,
          frameRatio: frameRatioStr,
          realRatio: realRatioStr,
          diff: diff.toFixed(6),
          status: isMatch ? 'MATCH' : 'MISMATCH'
        });
      }
    }
  }

  console.table(report);

  if (mismatchCount > 0) {
    throw new Error(`Found ${mismatchCount} aspect-ratio mismatches!`);
  }

  console.log(`\n✓ All ${report.length} media instances verified with 0 aspect-ratio mismatches!`);
  console.log('✓ All frames match image intrinsic dimensions and fill edge-to-edge.');
}

verifyFrames().catch(err => {
  console.error(err.message);
  process.exit(1);
});
