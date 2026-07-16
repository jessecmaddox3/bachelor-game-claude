import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { FontMetrics } from '../../src/engine/fonts/metrics';

const dir = fileURLToPath(new URL('../../src/assets/fonts', import.meta.url));

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
  });
  return cached;
}
