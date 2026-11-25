type MemoryStore = Map<string, number[]>;

const globalStore = globalThis as unknown as { __launchpadRate?: MemoryStore };
const defaultStore: MemoryStore = globalStore.__launchpadRate ?? new Map();
globalStore.__launchpadRate = defaultStore;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function rateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
  store?: MemoryStore;
}): RateLimitResult {
  const store = options.store ?? defaultStore;
  const now = options.now ?? Date.now();
  const windowStart = now - options.windowMs;
  const hits = (store.get(options.key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (hits.length >= options.limit) {
    store.set(options.key, hits);
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, hits[0] + options.windowMs - now),
    };
  }

  hits.push(now);
  store.set(options.key, hits);
  return {
    ok: true,
    remaining: options.limit - hits.length,
    retryAfterMs: 0,
  };
}
