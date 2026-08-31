/**
 * 从 assets/logo-eln-master.png 生成扩展多尺寸 PNG
 * 运行：node scripts/generate-eln-icons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'assets', 'logo-eln-master.png');
const SIZES = [16, 32, 48, 96, 128];
const OUT_DIRS = [
  path.join(ROOT, 'public', 'icon'),
  path.join(ROOT, 'site', 'public', 'icon'),
];

if (!fs.existsSync(MASTER)) {
  console.error('[icon] 缺少 assets/logo-eln-master.png');
  process.exit(1);
}

for (const dir of OUT_DIRS) {
  fs.mkdirSync(dir, { recursive: true });
  for (const size of SIZES) {
    const out = path.join(dir, `${size}.png`);
    await sharp(MASTER)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 9 })
      .toFile(out);
    console.log(`[icon] ${path.relative(ROOT, out)}`);
  }
}

console.log('[icon] 完成（方案 D）');
