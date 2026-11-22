// Copies the xr11 app icon into the extension's toolbar/store icon sizes.
// The crest is authored once in assets/brand/app-icon.svg and rasterized by the
// brand pipeline; this script only picks the matching sizes.
// Run: node scripts/gen-icons.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'static', 'icons');
const brand = join(here, '..', '..', 'assets', 'brand', 'png');

mkdirSync(outDir, { recursive: true });
for (const size of [16, 32, 48, 128]) {
  copyFileSync(join(brand, `app-icon-${size}.png`), join(outDir, `icon-${size}.png`));
  console.log(`icon-${size}.png`);
}
