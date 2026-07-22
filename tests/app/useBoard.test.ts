// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBoard } from '../../src/app/useBoard';
import { testMetrics } from '../helpers/loadFonts';
import { makeDraft } from '../helpers/fixtures';

describe('useBoard', () => {
  it('produces svg + quality for a complete draft (debounced)', async () => {
    const { result } = renderHook(() => useBoard(makeDraft(), testMetrics(), 10));
    await waitFor(() => expect(result.current.status).toBe('ready'), { timeout: 5000 });
    if (result.current.status !== 'ready') return;
    expect(result.current.svg.startsWith('<svg ')).toBe(true);
    expect(['good', 'tight', 'poor']).toContain(result.current.quality.grade);
  });

  it('reports invalid drafts with field errors', async () => {
    const bad = makeDraft();
    bad.players = [];
    const { result } = renderHook(() => useBoard(bad, testMetrics(), 10));
    await waitFor(() => expect(result.current.status).toBe('invalid'), { timeout: 5000 });
    if (result.current.status !== 'invalid') return;
    expect(result.current.errors.length).toBeGreaterThan(0);
    expect(result.current.errors[0]!.message).toContain('at least 2');
  });
});
