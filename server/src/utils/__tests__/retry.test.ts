import { describe, it, expect } from 'vitest';
import { retry } from '../retry.js';

describe('retry', () => {
  it('should succeed on first attempt', async () => {
    const result = await retry(async () => 'ok', { retries: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
  });

  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    const result = await retry(async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'ok';
    }, { retries: 3, baseDelayMs: 10 });
    expect(result).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('should throw after exhausting retries', async () => {
    await expect(
      retry(async () => { throw new Error('always fail'); }, { retries: 2, baseDelayMs: 10 })
    ).rejects.toThrow('always fail');
  });
});
