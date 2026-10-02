const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT_DIR, 'media-source');
const PUBLIC_MEDIA_DIR = path.join(ROOT_DIR, 'public', 'media');
const ASSETS_DIR = path.join(ROOT_DIR, 'public', 'assets');
const CONFIG_DIR = path.join(ROOT_DIR, 'src', 'config');
const MANIFEST_PATH = path.join(CONFIG_DIR, 'media-manifest.json');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function run() {
  console.log('=== POUSE MEDIA OPTIMIZATION PIPELINE ===\n');
  await ensureDir(SOURCE_DIR);
  await ensureDir(PUBLIC_MEDIA_DIR);
  await ensureDir(CONFIG_DIR);

  // 1. Move any raw original images from public/media/ into media-source/
  const publicFiles = fs.readdirSync(PUBLIC_MEDIA_DIR);
  for (const file of publicFiles) {
    if (file === 'README.txt' || file.endsWith('.webp')) continue;
    const srcPath = path.join(PUBLIC_MEDIA_DIR, file);
    const destPath = path.join(SOURCE_DIR, file);
    const stat = fs.statSync(srcPath);
    if (stat.isFile()) {
      if (!fs.existsSync(destPath)) {
        console.log(`[ARCHIVE] Moving original ${file} to media-source/`);
        fs.copyFileSync(srcPath, destPath);
      }
      fs.unlinkSync(srcPath);
    }
  }

  // 2. Ensure logo optimization
  const logoPath = path.join(ASSETS_DIR, 'pouse-logo.png');
  if (fs.existsSync(logoPath)) {
    const stat = fs.statSync(logoPath);
    if (stat.size > 50 * 1024) {
      console.log(`[OPTIMIZE] Optimizing pouse-logo.png (was ${(stat.size / 1024).toFixed(1)} KB)...`);
      await sharp(logoPath)
        .resize(128, 128)
        .png({ compressionLevel: 9, adaptiveFiltering: true, quality: 90 })
        .toFile(logoPath + '.tmp');
      fs.copyFileSync(logoPath + '.tmp', logoPath);
      fs.unlinkSync(logoPath + '.tmp');
      const newStat = fs.statSync(logoPath);
      console.log(`[OPTIMIZE] pouse-logo.png is now ${(newStat.size / 1024).toFixed(1)} KB.`);
    }
  }

  // 3. Load media-crop.json
  const CROP_PATH = path.join(ROOT_DIR, 'scripts', 'media-crop.json');
  let cropConfig = {};
  if (fs.existsSync(CROP_PATH)) {
    cropConfig = JSON.parse(fs.readFileSync(CROP_PATH, 'utf-8'));
    console.log(`[CROP] Loaded crop config from ${CROP_PATH}`);
  }

  // 4. Process every media file in media-source/
  const sourceFiles = fs.readdirSync(SOURCE_DIR).filter(f => !f.endsWith('.webp') && f !== 'README.txt');
  console.log(`Found ${sourceFiles.length} master file(s) in media-source/\n`);

  const results = [];
  const manifest = {};

  for (const file of sourceFiles) {
    const filePath = path.join(SOURCE_DIR, file);
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) continue;

    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);
    const sizeBeforeKB = (stat.size / 1024).toFixed(1);

    if (['.png', '.jpg', '.jpeg'].includes(ext)) {
      const meta = await sharp(filePath).metadata();
      const crop = cropConfig[baseName] || { top: 0, bottom: 0 };
      const isDesktop = baseName === 'pc-preferences' || baseName === 'pc-tray-menu';

      const realWidth = meta.width;
      const realHeight = meta.height - (crop.top || 0) - (crop.bottom || 0);

      manifest[baseName] = {
        width: realWidth,
        height: realHeight,
        aspectRatio: `${realWidth} / ${realHeight}`,
        ratio: Number((realWidth / realHeight).toFixed(5)),
        type: isDesktop ? 'desktop' : 'phone'
      };

      // Create base sharp pipeline with optional cropping
      let imagePipeline = sharp(filePath);
      if (crop.top > 0 || crop.bottom > 0) {
        imagePipeline = imagePipeline.extract({
          left: 0,
          top: crop.top,
          width: realWidth,
          height: realHeight
        });
      }
      const croppedBuffer = await imagePipeline.toBuffer();

      if (!isDesktop) {
        // Phone screenshot: generate 360w, 540w, 720w
        const widths = [360, 540, 720];
        for (const w of widths) {
          const targetW = Math.min(w, realWidth);
          const outName = `${baseName}-${w}w.webp`;
          const outPath = path.join(PUBLIC_MEDIA_DIR, outName);
          await sharp(croppedBuffer)
            .resize({ width: targetW, withoutEnlargement: true })
            .webp({ quality: 80, effort: 6 })
            .toFile(outPath);
        }

        // Standard default asset: [baseName].webp (using 540w)
        const defPath = path.join(PUBLIC_MEDIA_DIR, `${baseName}.webp`);
        await sharp(croppedBuffer)
          .resize({ width: Math.min(540, realWidth), withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toFile(defPath);
        const defStat = fs.statSync(defPath);

        results.push({
          file: baseName,
          type: 'phone',
          realWidth,
          realHeight,
          origDims: `${meta.width}x${meta.height}`,
          crop: `top:${crop.top} bot:${crop.bottom}`,
          beforeKB: sizeBeforeKB,
          afterKB: (defStat.size / 1024).toFixed(1),
          sizes: '360w, 540w, 720w'
        });
      } else {
        // Landscape / desktop screenshot
        const widths = baseName === 'pc-tray-menu' ? [360, 550] : [640, 960];
        for (const w of widths) {
          const targetW = Math.min(w, meta.width || w);
          const outName = `${baseName}-${w}w.webp`;
          const outPath = path.join(PUBLIC_MEDIA_DIR, outName);
          await sharp(filePath)
            .resize({ width: targetW, withoutEnlargement: true })
            .webp({ quality: 82, effort: 6 })
            .toFile(outPath);
        }

        // Standard default asset: [baseName].webp
        const defPath = path.join(PUBLIC_MEDIA_DIR, `${baseName}.webp`);
        await sharp(filePath)
          .resize({ width: baseName === 'pc-tray-menu' ? 550 : 960, withoutEnlargement: true })
          .webp({ quality: 82, effort: 6 })
          .toFile(defPath);
        const defStat = fs.statSync(defPath);

        results.push({
          file: baseName,
          type: 'desktop',
          realWidth,
          realHeight,
          origDims: `${meta.width}x${meta.height}`,
          beforeKB: sizeBeforeKB,
          afterKB: (defStat.size / 1024).toFixed(1),
          sizes: widths.map(w => `${w}w`).join(', ')
        });
      }
    } else if (['.mp4', '.webm'].includes(ext)) {
      console.log(`[VIDEO] ${file} is ${sizeBeforeKB} KB`);
      fs.copyFileSync(filePath, path.join(PUBLIC_MEDIA_DIR, file));
      results.push({
        file: file,
        type: 'video',
        realWidth: 738,
        realHeight: 1600,
        origDims: 'video',
        beforeKB: sizeBeforeKB,
        afterKB: sizeBeforeKB,
        sizes: 'video'
      });
    }
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`[MANIFEST] Wrote media manifest to ${MANIFEST_PATH}`);

  console.log('=== OPTIMIZATION SUMMARY ===');
  console.table(results);
}

run().catch(console.error);
