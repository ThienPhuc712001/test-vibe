import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import * as Redis from 'ioredis';
import * as NodeCache from 'node-cache';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  total: number;
}

export interface SecurityConfig {
  enableRateLimit: boolean;
  enableCORS: boolean;
  enableHelmet: boolean;
  enableCSRF: boolean;
  enableIPWhitelist: boolean;
  enableIPBlacklist: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
  maxRequestSize: number;
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
}

@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);
  private redis: Redis.Redis | null = null;
  private localCache: NodeCache | null = null;
  private readonly securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.loadSecurityConfig();
    this.initializeRateLimiting();
  }

  private loadSecurityConfig(): SecurityConfig {
    return {
      enableRateLimit: this.configService.get<boolean>('SECURITY_RATE_LIMIT', true),
      enableCORS: this.configService.get<boolean>('SECURITY_CORS', true),
      enableHelmet: this.configService.get<boolean>('SECURITY_HELMET', true),
      enableCSRF: this.configService.get<boolean>('SECURITY_CSRF', false),
      enableIPWhitelist: this.configService.get<boolean>('SECURITY_IP_WHITELIST', false),
      enableIPBlacklist: this.configService.get<boolean>('SECURITY_IP_BLACKLIST', false),
      ipWhitelist: this.configService.get<string[]>('SECURITY_IP_WHITELIST_LIST', []),
      ipBlacklist: this.configService.get<string[]>('SECURITY_IP_BLACKLIST_LIST', []),
      maxRequestSize: this.configService.get<number>('SECURITY_MAX_REQUEST_SIZE', 10485760), // 10MB
      allowedOrigins: this.configService.get<string[]>('SECURITY_ALLOWED_ORIGINS', ['*']),
      allowedMethods: this.configService.get<string[]>('SECURITY_ALLOWED_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: this.configService.get<string[]>('SECURITY_ALLOWED_HEADERS', ['Content-Type', 'Authorization']),
    };
  }

  private async initializeRateLimiting() {
    const useRedis = this.configService.get<boolean>('REDIS_ENABLED', false);
    
    if (useRedis) {
      try {
        this.redis = new Redis({
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected for rate limiting');
        });

        this.redis.on('error', (error) => {
          this.logger.error('Redis connection error for rate limiting', error);
          this.fallbackToLocalStorage();
        });

        await this.redis.connect();
      } catch (error) {
        this.logger.error('Failed to initialize Redis for rate limiting', error);
        this.fallbackToLocalStorage();
      }
    } else {
      this.initializeLocalStorage();
    }
  }

  private initializeLocalStorage() {
    this.localCache = new NodeCache({
      stdTTL: 3600, // 1 hour
      checkperiod: 600, // 10 minutes
      useClones: false,
    });
    this.logger.log('Local storage initialized for rate limiting');
  }

  private fallbackToLocalStorage() {
    if (!this.localCache) {
      this.initializeLocalStorage();
    }
    this.redis = null;
  }

  async checkRateLimit(req: Request, config: RateLimitConfig): Promise<RateLimitResult> {
    if (!this.securityConfig.enableRateLimit) {
      return {
        allowed: true,
        remaining: config.max,
        resetTime: new Date(Date.now() + config.windowMs),
        total: config.max,
      };
    }

    const key = config.keyGenerator ? config.keyGenerator(req) : this.generateKey(req);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      if (this.redis) {
        return await this.checkRedisRateLimit(key, config, now, windowStart);
      } else if (this.localCache) {
        return this.checkLocalRateLimit(key, config, now, windowStart);
      }

      return {
        allowed: true,
        remaining: config.max,
        resetTime: new Date(now + config.windowMs),
        total: config.max,
      };
    } catch (error) {
      this.logger.error('Rate limit check error', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.max,
        resetTime: new Date(now + config.windowMs),
        total: config.max,
      };
    }
  }

  private async checkRedisRateLimit(key: string, config: RateLimitConfig, now: number, windowStart: number): Promise<RateLimitResult> {
    const pipeline = this.redis!.pipeline();
    
    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests
    pipeline.zcard(key);
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    
    // Set expiration
    pipeline.expire(key, Math.ceil(config.windowMs / 1000));
    
    const results = await pipeline.exec();
    const currentCount = results[1][1] as number;
    
    const allowed = currentCount < config.max;
    const remaining = Math.max(0, config.max - currentCount - 1);
    const resetTime = new Date(now + config.windowMs);

    return {
      allowed,
      remaining,
      resetTime,
      total: config.max,
    };
  }

  private checkLocalRateLimit(key: string, config: RateLimitConfig, now: number, windowStart: number): RateLimitResult {
    const requests = this.localCache!.get<number[]>(key) || [];
    
    // Filter out expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Add current request
    validRequests.push(now);
    
    // Update cache
    this.localCache!.set(key, validRequests, Math.ceil(config.windowMs / 1000));
    
    const currentCount = validRequests.length;
    const allowed = currentCount <= config.max;
    const remaining = Math.max(0, config.max - currentCount);
    const resetTime = new Date(now + config.windowMs);

    return {
      allowed,
      remaining,
      resetTime,
      total: config.max,
    };
  }

  private generateKey(req: Request): string {
    const ip = this.getClientIP(req);
    const userAgent = req.get('User-Agent') || '';
    const endpoint = req.path;
    
    return `rate_limit:${ip}:${endpoint}:${this.hashString(userAgent)}`;
  }

  private getClientIP(req: Request): string {
    return req.ip || 
           req.get('x-forwarded-for')?.split(',')[0]?.trim() || 
           req.get('x-real-ip') || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async isIPAllowed(req: Request): Promise<boolean> {
    const ip = this.getClientIP(req);
    
    // Check blacklist first
    if (this.securityConfig.enableIPBlacklist && this.securityConfig.ipBlacklist.includes(ip)) {
      this.logger.warn(`IP blocked by blacklist: ${ip}`);
      return false;
    }
    
    // Check whitelist
    if (this.securityConfig.enableIPWhitelist && !this.securityConfig.ipWhitelist.includes(ip)) {
      this.logger.warn(`IP not in whitelist: ${ip}`);
      return false;
    }
    
    return true;
  }

  async isRequestSizeValid(req: Request): Promise<boolean> {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    return contentLength <= this.securityConfig.maxRequestSize;
  }

  getSecurityConfig(): SecurityConfig {
    return { ...this.securityConfig };
  }

  async clearRateLimit(ip: string, endpoint?: string): Promise<void> {
    const key = endpoint ? `rate_limit:${ip}:${endpoint}` : `rate_limit:${ip}:*`;
    
    try {
      if (this.redis) {
        if (key.endsWith(':*')) {
          const pattern = key.replace('*', '');
          const keys = await this.redis.keys(pattern);
          if (keys.length > 0) {
            await this.redis.del(...keys);
          }
        } else {
          await this.redis.del(key);
        }
      } else if (this.localCache) {
        if (key.endsWith(':*')) {
          const pattern = key.replace('*', '');
          const keys = this.localCache.keys();
          const matchingKeys = keys.filter(k => k.startsWith(pattern));
          matchingKeys.forEach(k => this.localCache!.del(k));
        } else {
          this.localCache.del(key);
        }
      }
    } catch (error) {
      this.logger.error('Error clearing rate limit', error);
    }
  }

  async getRateLimitStats(ip?: string): Promise<any> {
    try {
      if (this.redis) {
        const pattern = ip ? `rate_limit:${ip}:*` : 'rate_limit:*';
        const keys = await this.redis.keys(pattern);
        
        if (keys.length === 0) {
          return { totalKeys: 0, totalRequests: 0 };
        }
        
        const pipeline = this.redis.pipeline();
        keys.forEach(key => pipeline.zcard(key));
        const results = await pipeline.exec();
        
        const totalRequests = results.reduce((sum, result) => sum + (result[1] as number), 0);
        
        return {
          totalKeys: keys.length,
          totalRequests,
          keys: keys.map(key => ({ key, requests: results[keys.indexOf(key)][1] })),
        };
      } else if (this.localCache) {
        const keys = this.localCache.keys();
        const pattern = ip ? `rate_limit:${ip}:` : 'rate_limit:';
        const matchingKeys = keys.filter(key => key.startsWith(pattern));
        
        let totalRequests = 0;
        const keyStats = [];
        
        for (const key of matchingKeys) {
          const requests = this.localCache.get<number[]>(key) || [];
          totalRequests += requests.length;
          keyStats.push({ key, requests: requests.length });
        }
        
        return {
          totalKeys: matchingKeys.length,
          totalRequests,
          keys: keyStats,
        };
      }
      
      return { totalKeys: 0, totalRequests: 0 };
    } catch (error) {
      this.logger.error('Error getting rate limit stats', error);
      return { totalKeys: 0, totalRequests: 0 };
    }
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

// Rate limiting middleware factory
export function createRateLimitMiddleware(rateLimitingService: RateLimitingService, config: RateLimitConfig) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      // Check IP whitelist/blacklist
      const isIPAllowed = await rateLimitingService.isIPAllowed(req);
      if (!isIPAllowed) {
        return res.status(403).json({
          statusCode: 403,
          message: 'Access denied',
          error: 'IP_NOT_ALLOWED',
        });
      }

      // Check request size
      const isRequestSizeValid = await rateLimitingService.isRequestSizeValid(req);
      if (!isRequestSizeValid) {
        return res.status(413).json({
          statusCode: 413,
          message: 'Request entity too large',
          error: 'REQUEST_TOO_LARGE',
        });
      }

      // Check rate limit
      const result = await rateLimitingService.checkRateLimit(req, config);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': result.total.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      });

      if (!result.allowed) {
        return res.status(429).json({
          statusCode: 429,
          message: config.message || 'Too many requests',
          error: 'TOO_MANY_REQUESTS',
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000),
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Security headers middleware
export function createSecurityHeadersMiddleware(securityConfig: SecurityConfig) {
  return (req: Request, res: Response, next: Function) => {
    // Security headers
    if (securityConfig.enableHelmet) {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      });
    }

    // CORS headers
    if (securityConfig.enableCORS) {
      const origin = req.get('Origin');
      const allowedOrigin = securityConfig.allowedOrigins.includes('*') || 
                         securityConfig.allowedOrigins.includes(origin) ? 
                         origin : securityConfig.allowedOrigins[0];

      res.set({
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': securityConfig.allowedMethods.join(', '),
        'Access-Control-Allow-Headers': securityConfig.allowedHeaders.join(', '),
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400', // 24 hours
      });

      if (req.method === 'OPTIONS') {
        return res.status(204).send();
      }
    }

    // Request size limit
    res.set('Content-Security-Policy', "default-src 'self'");

    next();
  };
}

// IP validation middleware
export function createIPValidationMiddleware(rateLimitingService: RateLimitingService) {
  return async (req: Request, res: Response, next: Function) => {
    const isIPAllowed = await rateLimitingService.isIPAllowed(req);
    
    if (!isIPAllowed) {
      return res.status(403).json({
        statusCode: 403,
        message: 'Access denied',
        error: 'IP_NOT_ALLOWED',
      });
    }

    next();
  };
}

// Request size validation middleware
export function createRequestSizeMiddleware(rateLimitingService: RateLimitingService) {
  return async (req: Request, res: Response, next: Function) => {
    const isRequestSizeValid = await rateLimitingService.isRequestSizeValid(req);
    
    if (!isRequestSizeValid) {
      return res.status(413).json({
        statusCode: 413,
        message: 'Request entity too large',
        error: 'REQUEST_TOO_LARGE',
      });
    }

    next();
  };
}

// Rate limit configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // General API limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later',
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later',
  },
  
  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset attempts, please try again later',
  },
  
  // File upload
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: 'Too many file uploads, please try again later',
  },
  
  // Search endpoints
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 searches per minute
    message: 'Too many search requests, please try again later',
  },
  
  // Live streaming
  liveStreaming: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Too many live streaming requests, please try again later',
  },
  
  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per 15 minutes
    message: 'Too many admin requests, please try again later',
  },
};