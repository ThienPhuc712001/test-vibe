import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';
import * as NodeCache from 'node-cache';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  tags?: string[];
}

export interface CacheStats {
  keys: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
}

@Injectable()
export class CacheService {
  private redis: Redis.Redis | null = null;
  private localCache: NodeCache | null = null;
  private readonly logger = new Logger(CacheService.name);
  private readonly isRedisEnabled: boolean;
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(private configService: ConfigService) {
    this.isRedisEnabled = this.configService.get<boolean>('REDIS_ENABLED', false);
    this.defaultTTL = this.configService.get<number>('CACHE_TTL', 3600);
    this.keyPrefix = this.configService.get<string>('CACHE_PREFIX', 'marketplace:');

    this.initializeCache();
  }

  private async initializeCache() {
    if (this.isRedisEnabled) {
      try {
        this.redis = new Redis({
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
        });

        this.redis.on('error', (error) => {
          this.logger.error('Redis connection error', error);
          this.fallbackToLocalCache();
        });

        this.redis.on('close', () => {
          this.logger.warn('Redis connection closed');
          this.fallbackToLocalCache();
        });

        await this.redis.connect();
      } catch (error) {
        this.logger.error('Failed to initialize Redis', error);
        this.fallbackToLocalCache();
      }
    } else {
      this.initializeLocalCache();
    }
  }

  private initializeLocalCache() {
    this.localCache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
      deleteOnExpire: true,
      enableLegacyCallbacks: false,
      maxKeys: 10000, // Maximum number of keys
    });

    this.localCache.on('set', (key, value) => {
      this.logger.debug(`Cache SET: ${key}`);
    });

    this.localCache.on('del', (key, value) => {
      this.logger.debug(`Cache DEL: ${key}`);
    });

    this.localCache.on('expired', (key, value) => {
      this.logger.debug(`Cache EXPIRED: ${key}`);
    });

    this.logger.log('Local cache initialized');
  }

  private fallbackToLocalCache() {
    if (!this.localCache) {
      this.initializeLocalCache();
    }
    this.redis = null;
    this.logger.warn('Fallback to local cache');
  }

  private getKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || this.keyPrefix;
    return `${keyPrefix}${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const value = await this.redis.get(fullKey);
        if (value) {
          this.logger.debug(`Cache HIT (Redis): ${key}`);
          return JSON.parse(value);
        }
      } else if (this.localCache) {
        const value = this.localCache.get<T>(fullKey);
        if (value !== undefined) {
          this.logger.debug(`Cache HIT (Local): ${key}`);
          return value;
        }
      }

      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;
    const serializedValue = JSON.stringify(value);

    try {
      if (this.redis) {
        const result = await this.redis.setex(fullKey, ttl, serializedValue);
        if (result === 'OK') {
          this.logger.debug(`Cache SET (Redis): ${key} (TTL: ${ttl}s)`);
          
          // Add tags if provided
          if (options?.tags && options.tags.length > 0) {
            await this.addTagsToKey(fullKey, options.tags);
          }
          
          return true;
        }
      } else if (this.localCache) {
        const success = this.localCache.set(fullKey, value, ttl);
        if (success) {
          this.logger.debug(`Cache SET (Local): ${key} (TTL: ${ttl}s)`);
          
          // Store tags separately for local cache
          if (options?.tags && options.tags.length > 0) {
            await this.addTagsToKey(fullKey, options.tags);
          }
          
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}`, error);
      return false;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const result = await this.redis.del(fullKey);
        if (result > 0) {
          this.logger.debug(`Cache DEL (Redis): ${key}`);
          
          // Remove tags
          await this.removeTagsFromKey(fullKey);
          
          return true;
        }
      } else if (this.localCache) {
        const success = this.localCache.del(fullKey);
        if (success > 0) {
          this.logger.debug(`Cache DEL (Local): ${key}`);
          
          // Remove tags
          await this.removeTagsFromKey(fullKey);
          
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}`, error);
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const result = await this.redis.exists(fullKey);
        return result === 1;
      } else if (this.localCache) {
        return this.localCache.has(fullKey);
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache EXISTS error for key ${key}`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const result = await this.redis.expire(fullKey, ttl);
        if (result === 1) {
          this.logger.debug(`Cache EXPIRE (Redis): ${key} (TTL: ${ttl}s)`);
          return true;
        }
      } else if (this.localCache) {
        const value = this.localCache.get<T>(fullKey);
        if (value !== undefined) {
          const success = this.localCache.set(fullKey, value, ttl);
          if (success) {
            this.logger.debug(`Cache EXPIRE (Local): ${key} (TTL: ${ttl}s)`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache EXPIRE error for key ${key}`, error);
      return false;
    }
  }

  async ttl(key: string, options?: CacheOptions): Promise<number> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        return await this.redis.ttl(fullKey);
      } else if (this.localCache) {
        const remainingTTL = this.localCache.getTtl(fullKey);
        return remainingTTL !== undefined ? Math.max(0, remainingTTL) : -1;
      }

      return -1;
    } catch (error) {
      this.logger.error(`Cache TTL error for key ${key}`, error);
      return -1;
    }
  }

  async increment(key: string, value: number = 1, options?: CacheOptions): Promise<number | null> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const result = await this.redis.incrby(fullKey, value);
        if (options?.ttl) {
          await this.redis.expire(fullKey, options.ttl);
        }
        return result;
      } else if (this.localCache) {
        const current = this.localCache.get<number>(fullKey) || 0;
        const newValue = current + value;
        const success = this.localCache.set(fullKey, newValue, options?.ttl || this.defaultTTL);
        if (success) {
          return newValue;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Cache INCREMENT error for key ${key}`, error);
      return null;
    }
  }

  async decrement(key: string, value: number = 1, options?: CacheOptions): Promise<number | null> {
    const fullKey = this.getKey(key, options?.prefix);

    try {
      if (this.redis) {
        const result = await this.redis.decrby(fullKey, value);
        if (options?.ttl) {
          await this.redis.expire(fullKey, options.ttl);
        }
        return result;
      } else if (this.localCache) {
        const current = this.localCache.get<number>(fullKey) || 0;
        const newValue = current - value;
        const success = this.localCache.set(fullKey, newValue, options?.ttl || this.defaultTTL);
        if (success) {
          return newValue;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Cache DECREMENT error for key ${key}`, error);
      return null;
    }
  }

  async getMultiple<T>(keys: string[], options?: CacheOptions): Promise<Map<string, T>> {
    const result = new Map<string, T>();

    try {
      if (this.redis) {
        const fullKeys = keys.map(key => this.getKey(key, options?.prefix));
        const values = await this.redis.mget(...fullKeys);
        
        keys.forEach((key, index) => {
          const value = values[index];
          if (value) {
            result.set(key, JSON.parse(value));
          }
        });
      } else if (this.localCache) {
        keys.forEach(key => {
          const fullKey = this.getKey(key, options?.prefix);
          const value = this.localCache.get<T>(fullKey);
          if (value !== undefined) {
            result.set(key, value);
          }
        });
      }

      return result;
    } catch (error) {
      this.logger.error(`Cache GETMULTIPLE error`, error);
      return result;
    }
  }

  async setMultiple<T>(entries: Map<string, T>, options?: CacheOptions): Promise<boolean> {
    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();
        
        for (const [key, value] of entries) {
          const fullKey = this.getKey(key, options?.prefix);
          const serializedValue = JSON.stringify(value);
          const ttl = options?.ttl || this.defaultTTL;
          pipeline.setex(fullKey, ttl, serializedValue);
        }
        
        const results = await pipeline.exec();
        const success = results.every(result => result[1] === 'OK');
        
        if (success && options?.tags) {
          // Add tags to all keys
          for (const [key] of entries) {
            const fullKey = this.getKey(key, options?.prefix);
            await this.addTagsToKey(fullKey, options.tags);
          }
        }
        
        return success;
      } else if (this.localCache) {
        let success = true;
        
        for (const [key, value] of entries) {
          const fullKey = this.getKey(key, options?.prefix);
          const setSuccess = this.localCache.set(fullKey, value, options?.ttl || this.defaultTTL);
          if (!setSuccess) {
            success = false;
          }
        }
        
        if (success && options?.tags) {
          // Add tags to all keys
          for (const [key] of entries) {
            const fullKey = this.getKey(key, options?.prefix);
            await this.addTagsToKey(fullKey, options.tags);
          }
        }
        
        return success;
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache SETMULTIPLE error`, error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    const tagKey = this.getKey(`tag:${tag}`);
    
    try {
      if (this.redis) {
        const keys = await this.redis.smembers(tagKey);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(tagKey);
          this.logger.debug(`Cache INVALIDATE BY TAG: ${tag} (${keys.length} keys)`);
          return keys.length;
        }
      } else if (this.localCache) {
        const keys = this.localCache.get<string[]>(tagKey) || [];
        if (keys.length > 0) {
          keys.forEach(key => this.localCache.del(key));
          this.localCache.del(tagKey);
          this.logger.debug(`Cache INVALIDATE BY TAG: ${tag} (${keys.length} keys)`);
          return keys.length;
        }
      }

      return 0;
    } catch (error) {
      this.logger.error(`Cache INVALIDATE BY TAG error for tag ${tag}`, error);
      return 0;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (this.redis) {
        const pattern = this.getKey('*');
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          this.logger.debug(`Cache CLEAR: ${keys.length} keys`);
          return true;
        }
      } else if (this.localCache) {
        this.localCache.flushAll();
        this.logger.debug(`Cache CLEAR: all keys`);
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(`Cache CLEAR error`, error);
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      if (this.redis) {
        const info = await this.redis.info('memory');
        const keyspace = await this.redis.info('keyspace');
        
        const memoryUsage = this.parseMemoryInfo(info);
        const keys = this.parseKeyspaceInfo(keyspace);
        
        return {
          keys,
          hits: 0, // Redis doesn't track hits by default
          misses: 0,
          hitRate: 0,
          memoryUsage,
        };
      } else if (this.localCache) {
        const stats = this.localCache.getStats();
        return {
          keys: stats.keys,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hits / (stats.hits + stats.misses) || 0,
          memoryUsage: 0, // Local cache doesn't provide memory usage
        };
      }

      return {
        keys: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryUsage: 0,
      };
    } catch (error) {
      this.logger.error(`Cache STATS error`, error);
      return {
        keys: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryUsage: 0,
      };
    }
  }

  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    try {
      if (this.redis) {
        const pipeline = this.redis.pipeline();
        
        for (const tag of tags) {
          const tagKey = this.getKey(`tag:${tag}`);
          pipeline.sadd(tagKey, key);
          pipeline.expire(tagKey, this.defaultTTL * 2); // Tags live longer than keys
        }
        
        await pipeline.exec();
      } else if (this.localCache) {
        for (const tag of tags) {
          const tagKey = this.getKey(`tag:${tag}`);
          const taggedKeys = this.localCache.get<string[]>(tagKey) || [];
          taggedKeys.push(key);
          this.localCache.set(tagKey, taggedKeys, this.defaultTTL * 2);
        }
      }
    } catch (error) {
      this.logger.error(`Cache ADD TAGS error`, error);
    }
  }

  private async removeTagsFromKey(key: string): Promise<void> {
    try {
      if (this.redis) {
        // This is complex with Redis - would need to track which tags a key has
        // For simplicity, we'll skip this implementation
      } else if (this.localCache) {
        // Remove key from all tag sets
        const pattern = this.getKey(`tag:*`);
        const tagKeys = this.localCache.keys();
        
        for (const tagKey of tagKeys) {
          if (tagKey.startsWith(pattern)) {
            const taggedKeys = this.localCache.get<string[]>(tagKey) || [];
            const index = taggedKeys.indexOf(key);
            if (index > -1) {
              taggedKeys.splice(index, 1);
              this.localCache.set(tagKey, taggedKeys);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Cache REMOVE TAGS error`, error);
    }
  }

  private parseMemoryInfo(info: string): number {
    const match = info.match(/used_memory:(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseKeyspaceInfo(info: string): number {
    const match = info.match(/keys=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
    
    if (this.localCache) {
      this.localCache.close();
    }
  }
}

// Cache decorator for automatic caching
export function Cacheable(options: CacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      if (!cacheService) {
        return await method.apply(this, args);
      }

      // Generate cache key based on method name and arguments
      const key = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await cacheService.get(key, options);
      if (cached !== null) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await cacheService.set(key, result, options);
      
      return result;
    };

    return descriptor;
  };
}

// Cache invalidation decorator
export function CacheInvalidate(pattern: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this.cacheService;
      
      const result = await method.apply(this, args);
      
      if (cacheService) {
        // Invalidate cache based on pattern
        // This is a simplified implementation
        await cacheService.clear();
      }
      
      return result;
    };

    return descriptor;
  };
}