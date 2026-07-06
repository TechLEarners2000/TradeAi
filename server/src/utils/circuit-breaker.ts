export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxRequests?: number;
}

export interface CircuitStats {
  name: string;
  state: CircuitState;
  successCount: number;
  failureCount: number;
  lastError: string | null;
  lastFailureAt: number | null;
  nextAttemptAt: number | null;
}

export class CircuitBreaker {
  readonly name: string;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastError: string | null = null;
  private lastFailureAt: number | null = null;
  private nextAttemptAt: number | null = null;
  private halfOpenRequests = 0;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly halfOpenMaxRequests: number;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.halfOpenMaxRequests = options.halfOpenMaxRequests ?? 1;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.nextAttemptAt !== null && Date.now() >= this.nextAttemptAt) {
        this.state = 'HALF_OPEN';
        this.halfOpenRequests = 0;
      } else {
        throw new CircuitOpenError(this.name, this.lastError);
      }
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new CircuitOpenError(this.name, 'Half-open max requests reached');
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenRequests++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err as Error);
      throw err;
    }
  }

  getStats(): CircuitStats {
    return {
      name: this.name,
      state: this.state,
      successCount: this.successCount,
      failureCount: this.failureCount,
      lastError: this.lastError,
      lastFailureAt: this.lastFailureAt,
      nextAttemptAt: this.nextAttemptAt,
    };
  }

  private onSuccess(): void {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.nextAttemptAt = null;
    }
  }

  private onFailure(err: Error): void {
    this.failureCount++;
    this.lastError = err.message;
    this.lastFailureAt = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptAt = Date.now() + this.resetTimeoutMs;
    }
  }
}

export class CircuitOpenError extends Error {
  readonly circuitName: string;
  constructor(circuitName: string, cause: string | null) {
    super(`Circuit breaker OPEN for ${circuitName}${cause ? `: ${cause}` : ''}`);
    this.circuitName = circuitName;
    this.name = 'CircuitOpenError';
  }
}
