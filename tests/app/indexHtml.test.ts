import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('source HTML template', () => {
  it('keeps search engines from indexing the gameboard', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});
