/**
 * Cache Service
 *
 * Simple in-memory cache with TTL support.
 * Used for caching raffle lookups and other frequently accessed data.
 */

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

export class CacheService<K, V> {
  private cache: Map<K, CacheEntry<V>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get value from cache
   *
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   *
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time-to-live in milliseconds (default: 5 minutes)
   */
  set(key: K, value: V, ttlMs: number = 5 * 60 * 1000): void {
    const expiresAt = Date.now() + ttlMs;

    this.cache.set(key, {
      value,
      expiresAt,
    });
  }

  /**
   * Check if key exists in cache (and not expired)
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key from cache
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    // Clean expired entries first
    this.cleanExpired();
    return this.cache.size;
  }

  /**
   * Batch get with fetcher for cache misses
   *
   * Fetches missing keys using the provided fetcher function
   *
   * @param keys Array of keys to fetch
   * @param fetcher Function to fetch missing keys
   * @param ttlMs TTL for newly cached values
   * @returns Map of all requested keys and their values
   */
  async batchGet(
    keys: K[],
    fetcher: (keys: K[]) => Promise<Map<K, V>>,
    ttlMs?: number
  ): Promise<Map<K, V>> {
    const result = new Map<K, V>();
    const missingKeys: K[] = [];

    // Check cache for each key
    for (const key of keys) {
      const cached = this.get(key);
      if (cached !== undefined) {
        result.set(key, cached);
      } else {
        missingKeys.push(key);
      }
    }

    // Fetch missing keys
    if (missingKeys.length > 0) {
      const fetched = await fetcher(missingKeys);

      // Add to result and cache
      const entries = Array.from(fetched.entries());
      for (const [key, value] of entries) {
        result.set(key, value);
        this.set(key, value, ttlMs);
      }
    }

    return result;
  }

  /**
   * Get or set pattern
   *
   * Gets value from cache, or calls factory function and caches result
   *
   * @param key Cache key
   * @param factory Function to create value if not in cache
   * @param ttlMs TTL for newly cached value
   */
  async getOrSet(key: K, factory: () => Promise<V>, ttlMs?: number): Promise<V> {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = await factory();
    this.set(key, value, ttlMs);

    return value;
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired(): void {
    const now = Date.now();

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get all keys in cache (excluding expired)
   */
  keys(): K[] {
    this.cleanExpired();
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in cache (excluding expired)
   */
  values(): V[] {
    this.cleanExpired();
    return Array.from(this.cache.values()).map((entry) => entry.value);
  }

  /**
   * Get all entries in cache (excluding expired)
   */
  entries(): [K, V][] {
    this.cleanExpired();
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }
}
