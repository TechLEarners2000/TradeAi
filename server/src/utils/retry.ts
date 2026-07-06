export interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.min(baseDelayMs * 2 ** attempt + Math.random() * 500, maxDelayMs);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw new Error('Retry exhausted');
}
