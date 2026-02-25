import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as StackTrace from 'stacktrace-js';

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    this.initializeLogger();
  }

  setContext(context: string) {
    this.context = context;
  }

  private initializeLogger() {
    const logLevel = this.configService.get<string>('LOG_LEVEL', 'info');
    const logDir = this.configService.get<string>('LOG_DIR', 'logs');
    const enableConsole = this.configService.get<boolean>('LOG_CONSOLE', true);
    const enableFile = this.configService.get<boolean>('LOG_FILE', true);
    const enableJson = this.configService.get<boolean>('LOG_JSON', false);

    const transports: winston.transport[] = [];

    // Console transport
    if (enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
              const contextStr = context || this.context || 'Application';
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              const traceStr = trace ? `\n${trace}` : '';
              return `${timestamp} [${level}] [${contextStr}] ${message}${metaStr}${traceStr}`;
            }),
          ),
        }),
      );
    }

    // File transports
    if (enableFile) {
      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/combined-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      );

      // Performance logs
      transports.push(
        new DailyRotateFile({
          filename: `${logDir}/performance-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          maxSize: '20m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: logLevel,
      transports,
      exitOnError: false,
      handleExceptions: true,
      handleRejections: true,
    });

    // Add custom format for structured logging
    if (enableJson) {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      );
    }
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { 
      context: context || this.context,
      trace,
      stack: trace || this.getStackTrace(),
    });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, metadata?: any) {
    this.logger.info(`Performance: ${operation}`, {
      context: 'Performance',
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  // API request logging
  logRequest(req: any, res: any, duration: number) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    };

    this.logger.info('API Request', {
      context: 'API',
      ...logData,
    });
  }

  // Database query logging
  logQuery(query: string, duration: number, parameters?: any) {
    this.logger.debug('Database Query', {
      context: 'Database',
      query,
      duration,
      parameters,
      timestamp: new Date().toISOString(),
    });
  }

  // Security event logging
  logSecurityEvent(event: string, details: any) {
    this.logger.warn(`Security Event: ${event}`, {
      context: 'Security',
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Business event logging
  logBusinessEvent(event: string, details: any) {
    this.logger.info(`Business Event: ${event}`, {
      context: 'Business',
      event,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Error tracking
  logError(error: Error, context?: string, metadata?: any) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: context || this.context,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.logger.error('Application Error', errorData);
  }

  // Custom logging with structured data
  logStructured(level: LogLevel, message: string, data: any) {
    this.logger.log(level, message, {
      context: this.context,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Health check logging
  logHealthCheck(service: string, status: 'healthy' | 'unhealthy', details?: any) {
    this.logger.info(`Health Check: ${service}`, {
      context: 'Health',
      service,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Audit logging
  logAudit(action: string, userId: string, resource: string, details?: any) {
    this.logger.info(`Audit: ${action}`, {
      context: 'Audit',
      action,
      userId,
      resource,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  // Metrics logging
  logMetric(name: string, value: number, tags?: Record<string, string>) {
    this.logger.info(`Metric: ${name}`, {
      context: 'Metrics',
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    });
  }

  // Get stack trace for error reporting
  private getStackTrace(): string {
    try {
      throw new Error();
    } catch (e) {
      return e.stack || '';
    }
  }

  // Async stack trace for better error reporting
  async getAsyncStackTrace(): Promise<string> {
    try {
      const stack = await StackTrace.get();
      return stack.map(frame => frame.toString()).join('\n');
    } catch (e) {
      return this.getStackTrace();
    }
  }

  // Log rotation and cleanup
  async rotateLogs() {
    // This would be called by a scheduled job
    this.logger.info('Log rotation initiated', {
      context: 'Maintenance',
      timestamp: new Date().toISOString(),
    });
  }

  // Get logger statistics
  getStats() {
    return {
      level: this.logger.level,
      transports: this.logger.transports.length,
      timestamp: new Date().toISOString(),
    };
  }

  // Change log level dynamically
  setLevel(level: string) {
    this.logger.level = level;
    this.logger.info(`Log level changed to ${level}`, {
      context: 'Configuration',
      timestamp: new Date().toISOString(),
    });
  }

  // Add custom transport
  addTransport(transport: winston.transport) {
    this.logger.add(transport);
  }

  // Remove transport
  removeTransport(transport: winston.transport) {
    this.logger.remove(transport);
  }

  // Close logger
  close() {
    this.logger.close();
  }
}

// Custom formatter for structured logging
export class StructuredFormatter {
  static format(info: any) {
    const { timestamp, level, message, context, ...meta } = info;
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      context,
      ...meta,
    });
  }
}

// Performance monitoring decorator
export function LogPerformance(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const opName = operation || `${target.constructor.name}.${propertyName}`;
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        if (this.logger) {
          this.logger.logPerformance(opName, duration, {
            args: args.length,
            success: true,
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        if (this.logger) {
          this.logger.logPerformance(opName, duration, {
            args: args.length,
            success: false,
            error: error.message,
          });
        }
        
        throw error;
      }
    };

    return descriptor;
  };
}

// Error logging decorator
export function LogErrors(context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        if (this.logger) {
          this.logger.logError(error, context || `${target.constructor.name}.${propertyName}`, {
            args,
          });
        }
        throw error;
      }
    };

    return descriptor;
  };
}

// Request logging middleware
export function RequestLogger(logger: LoggingService) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.logRequest(req, res, duration);
    });
    
    next();
  };
}

// Error handling middleware
export function ErrorLogger(logger: LoggingService) {
  return (error: Error, req: any, res: any, next: any) => {
    logger.logError(error, 'Middleware', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next(error);
  };
}