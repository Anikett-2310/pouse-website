const fs = require('fs');
const path = require('path');
const https = require('https');

const EXPECTED_HASH = '5baa43f7b90f451a19ba1d1e54edb763a66337d64e7b25dc627340d1dad6b70d';
const INSTALLER_URL = 'https://github.com/Anikett-2310/Pouse/releases/download/v1.0.0/Pouse-Setup-v1.0.0.exe';
const SHA256_URL = 'https://github.com/Anikett-2310/Pouse/releases/download/v1.0.0/Pouse-Setup-v1.0.0.exe.sha256';

function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, maxRedirects - 1));
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    }).on('error', reject);
  });
}

function checkHeadUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(checkHeadUrl(res.headers.location, maxRedirects - 1));
      }
      resolve({ statusCode: res.statusCode, headers: res.headers });
    });
    req.on('error', reject);
    req.end();
  });
}

async function verifyReleaseAssets() {
  console.log('--- 1. Verifying Windows Installer URL ---');
  console.log('Testing HEAD on:', INSTALLER_URL);
  const headRes = await checkHeadUrl(INSTALLER_URL);
  console.log('Resolved Status Code:', headRes.statusCode);
  if (headRes.statusCode !== 200) {
    throw new Error(`Installer URL failed to resolve with 200. Got: ${headRes.statusCode}`);
  }
  const contentLength = headRes.headers['content-length'];
  console.log('Content-Length:', contentLength, 'bytes (Expected: ~2963169)');

  console.log('\n--- 2. Verifying Checksum Asset URL ---');
  console.log('Fetching:', SHA256_URL);
  const shaRes = await fetchUrl(SHA256_URL);
  console.log('Resolved Status Code:', shaRes.statusCode);
  if (shaRes.statusCode !== 200) {
    throw new Error(`SHA256 URL failed to resolve with 200. Got: ${shaRes.statusCode}`);
  }
  const rawHashContent = shaRes.data.trim();
  console.log('Raw .sha256 content:\n', rawHashContent);

  const matched = rawHashContent.includes(EXPECTED_HASH);
  if (!matched) {
    throw new Error(`Hash mismatch! Expected to find ${EXPECTED_HASH} in ${rawHashContent}`);
  }
  console.log('✓ SHA-256 Checksum MATCHES verified release asset:', EXPECTED_HASH);
}

function verifyInternalLinks() {
  console.log('\n--- 3. Verifying Internal Site Links in dist/ ---');
  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist directory not found. Please run npm run build first.');
  }

  const htmlFiles = [];
  function collectHtml(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        collectHtml(full);
      } else if (f.endsWith('.html')) {
        htmlFiles.push(full);
      }
    }
  }
  collectHtml(distDir);
  console.log(`Found ${htmlFiles.length} HTML pages in dist.`);

  const hrefRegex = /href=["']([^"']+)["']/g;
  let totalLinks = 0;
  let brokenLinks = 0;

  for (const file of htmlFiles) {
    const relFile = path.relative(distDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = hrefRegex.exec(content)) !== null) {
      const href = match[1];
      // Only verify internal relative or root-relative links
      if (href.startsWith('/') && !href.startsWith('//')) {
        totalLinks++;
        const cleanHref = href.split('#')[0].split('?')[0];
        if (cleanHref === '') continue;

        let targetPath = path.join(distDir, cleanHref);
        let exists = false;
        if (fs.existsSync(targetPath)) {
          if (fs.statSync(targetPath).isDirectory()) {
            exists = fs.existsSync(path.join(targetPath, 'index.html'));
          } else {
            exists = true;
          }
        } else if (fs.existsSync(targetPath + '.html')) {
          exists = true;
        }

        if (!exists) {
          console.error(`Broken link in ${relFile}: ${href} -> ${targetPath} does not exist`);
          brokenLinks++;
        }
      }
    }
  }

  console.log(`Checked ${totalLinks} internal links across ${htmlFiles.length} pages.`);
  if (brokenLinks > 0) {
    throw new Error(`Found ${brokenLinks} broken internal links!`);
  }
  console.log('✓ All internal links verified successfully with 0 broken links!');
}

async function runAll() {
  try {
    await verifyReleaseAssets();
    verifyInternalLinks();
    console.log('\n========================================');
    console.log('ALL RELEASE ASSET & LINK CHECKS PASSED!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

runAll();
