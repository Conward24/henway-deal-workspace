/**
 * Retry an async Replicate call when the failure looks like temporary capacity.
 */
const RETRYABLE_PATTERNS = [
  /high\s+demand/i,
  /E003/i,
  /unavailable/i,
  /throttl/i,
  /try\s+again\s+later/i,
  /503/,
  /502/,
];

export function isRetryableError(e: unknown): boolean {
  const message = e instanceof Error ? e.message : String(e ?? "");
  return RETRYABLE_PATTERNS.some((p) => p.test(message));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface ReplicateRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<ReplicateRetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
};

export async function withReplicateRetry<T>(
  fn: () => Promise<T>,
  options: ReplicateRetryOptions = {}
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (attempt === maxRetries || !isRetryableError(e)) throw e;
      const delayMs = initialDelayMs * Math.pow(backoffMultiplier, attempt);
      await sleep(delayMs);
    }
  }
  throw lastError;
}
