import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { FontMetrics } from '../../src/engine/fonts/metrics';

// Under the jsdom test environment import.meta.url is an http:// URL, so fall
// back to the project root (vitest's cwd) instead of fileURLToPath.
const metaUrl = new URL('../../src/assets/fonts', import.meta.url);
const dir =
  metaUrl.protocol === 'file:' ? fileURLToPath(metaUrl) : resolve(process.cwd(), 'src/assets/fonts');

function ab(name: string): ArrayBuffer {
  const b = readFileSync(resolve(dir, name));
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}

let cached: FontMetrics | null = null;

export function testMetrics(): FontMetrics {
  cached ??= new FontMetrics({
    display: ab('ArchivoBlack-Regular.ttf'),
    body: ab('Lato-Regular.ttf'),
    bodyBold: ab('Lato-Bold.ttf'),
    landscape: ab('Montserrat-Regular.ttf'),
    landscapeBold: ab('Montserrat-Bold.ttf'),
  });
  return cached;
}
