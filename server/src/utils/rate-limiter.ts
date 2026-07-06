export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly intervalMs: number;

  constructor(rps: number) {
    this.maxTokens = rps;
    this.tokens = rps;
    this.lastRefill = Date.now();
    this.intervalMs = 1000;
  }

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return;
    }
    const waitMs = this.intervalMs - (Date.now() - this.lastRefill) + 10;
    if (waitMs > 0) {
      await new Promise(r => setTimeout(r, waitMs));
    }
    this.refill();
    this.tokens = Math.max(0, this.tokens - 1);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed >= this.intervalMs) {
      const add = Math.floor(elapsed / this.intervalMs) * this.maxTokens;
      this.tokens = Math.min(this.maxTokens, this.tokens + add);
      this.lastRefill = now;
    }
  }
}
