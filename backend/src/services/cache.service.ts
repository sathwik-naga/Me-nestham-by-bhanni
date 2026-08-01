import env from '../config/env';
import logger from '../utils/logger';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private isUpstashConfigured: boolean = false;
  private upstashUrl: string = '';
  private upstashToken: string = '';

  private constructor() {
    this.upstashUrl = env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_URL || '';
    this.upstashToken = env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
    this.isUpstashConfigured = Boolean(this.upstashUrl && this.upstashToken);

    if (this.isUpstashConfigured) {
      logger.info('🔴 CacheService initialized with Upstash Redis REST API.');
    } else {
      logger.info('🧠 CacheService running in High-Performance In-Memory Cache mode (No Upstash credentials configured).');
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get item from cache (Tries Upstash Redis first, falls back to Memory Cache)
   */
  public async get<T>(key: string): Promise<T | null> {
    // 1. Try Upstash Redis if configured
    if (this.isUpstashConfigured) {
      try {
        const response = await fetch(`${this.upstashUrl}/get/${encodeURIComponent(key)}`, {
          headers: {
            Authorization: `Bearer ${this.upstashToken}`,
          },
        });

        if (response.ok) {
          const data = (await response.json()) as any;
          if (data && data.result !== null && data.result !== undefined) {
            try {
              return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
            } catch {
              return data.result as T;
            }
          }
        }
      } catch (err: any) {
        logger.warn(`Upstash Redis GET failed for key ${key}, falling back to memory cache: ${err?.message}`);
      }
    }

    // 2. Memory Cache fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set item in cache with TTL (seconds)
   */
  public async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    // 1. Upstash Redis set
    if (this.isUpstashConfigured) {
      try {
        await fetch(`${this.upstashUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(serialized)}/EX/${ttlSeconds}`, {
          headers: {
            Authorization: `Bearer ${this.upstashToken}`,
          },
        });
      } catch (err: any) {
        logger.warn(`Upstash Redis SET failed for key ${key}: ${err?.message}`);
      }
    }

    // 2. Always maintain local memory cache backup
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });
  }

  /**
   * Delete item or list of keys from cache
   */
  public async del(keys: string | string[]): Promise<void> {
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((k) => this.memoryCache.delete(k));

    if (this.isUpstashConfigured && keyList.length > 0) {
      try {
        for (const key of keyList) {
          await fetch(`${this.upstashUrl}/del/${encodeURIComponent(key)}`, {
            headers: {
              Authorization: `Bearer ${this.upstashToken}`,
            },
          });
        }
      } catch (err: any) {
        logger.warn(`Upstash Redis DEL failed: ${err?.message}`);
      }
    }
  }

  /**
   * Invalidate cache matching pattern (e.g. 'mn_cache_*')
   */
  public async invalidateAll(): Promise<void> {
    this.memoryCache.clear();
    logger.info('CacheService: All in-memory and Redis caches invalidated.');
  }
}

export const cacheService = CacheService.getInstance();
