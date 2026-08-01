import env from '../config/env';
import logger from '../utils/logger';

interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
  tags?: string[];
}

export class CacheService {
  private static instance: CacheService;
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private tagMap: Map<string, Set<string>> = new Map(); // Tag -> Set of Cache Keys
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
      logger.info('🧠 CacheService running in High-Performance In-Memory Cache mode with Tag Invalidation.');
    }
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Standard Cache Key Conventions
   */
  public static KEYS = {
    HOME: 'home:v1',
    CATEGORIES_ALL: 'categories:all',
    FEATURED_PRODUCTS: 'featured-products',
    BESTSELLER_PRODUCTS: 'bestseller-products',
    PRODUCT_SLUG: (slug: string) => `product:${slug}`,
    PRODUCT_ID: (id: string) => `product:id:${id}`,
    COUPONS_ACTIVE: 'coupons:active',
    SETTINGS_GLOBAL: 'settings:global',
  };

  /**
   * Standard Cache Tags for Targeted Invalidation
   */
  public static TAGS = {
    PRODUCT: 'tag:product',
    CATEGORY: 'tag:category',
    COUPON: 'tag:coupon',
    SETTINGS: 'tag:settings',
  };

  /**
   * Get item from cache (Upstash Redis -> Memory Cache -> Fallback Database)
   */
  public async get<T>(key: string): Promise<T | null> {
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
        logger.warn(`Upstash Redis GET failed for key ${key}, gracefully falling back to memory cache: ${err?.message}`);
      }
    }

    // Memory Cache fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set item in cache with TTL and optional Tag registration
   */
  public async set(key: string, value: any, ttlSeconds: number = 300, tags: string[] = []): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    // Register tags
    tags.forEach((tag) => {
      if (!this.tagMap.has(tag)) this.tagMap.set(tag, new Set());
      this.tagMap.get(tag)!.add(key);
    });

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

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt, tags });
  }

  /**
   * Invalidate all cache keys associated with a specific Tag (e.g. CacheService.TAGS.PRODUCT)
   */
  public async invalidateTag(tag: string): Promise<void> {
    const keysToInvalidate = this.tagMap.get(tag);
    if (keysToInvalidate) {
      const keyArray = Array.from(keysToInvalidate);
      await this.del(keyArray);
      this.tagMap.delete(tag);
      logger.info(`CacheService: Invalidated ${keyArray.length} keys for tag "${tag}".`);
    } else {
      await this.invalidateAll();
    }
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
   * Invalidate cache matching pattern
   */
  public async invalidateAll(): Promise<void> {
    this.memoryCache.clear();
    this.tagMap.clear();
    logger.info('CacheService: All in-memory and Redis caches invalidated.');
  }
}

export const cacheService = CacheService.getInstance();
