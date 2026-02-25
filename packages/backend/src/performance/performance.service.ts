import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    heapPercentage: number;
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
  gc: {
    collections: number;
    duration: number;
    type: string;
  };
  requests: {
    total: number;
    active: number;
    averageResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    evictions: number;
  };
}

export interface PerformanceAlert {
  type: 'CPU' | 'MEMORY' | 'DISK' | 'DATABASE' | 'CACHE' | 'RESPONSE_TIME' | 'ERROR_RATE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface PerformanceThresholds {
  cpu: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number;
    critical: number;
  };
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
  diskUsage: {
    warning: number;
    critical: number;
  };
  databaseConnections: {
    warning: number;
    critical: number;
  };
}

@Injectable()
export class PerformanceService implements OnModuleInit {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly thresholds: PerformanceThresholds;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private requestMetrics: Map<string, { startTime: number; count: number }> = new Map();
  private slowQueries: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private gcStats: { collections: number; totalDuration: number; lastCollection: Date } = {
    collections: 0,
    totalDuration: 0,
    lastCollection: new Date(),
  };

  constructor(private readonly configService: ConfigService) {
    this.thresholds = this.loadThresholds();
    this.metrics = this.initializeMetrics();
  }

  onModuleInit() {
    this.startMonitoring();
    this.setupGCMonitoring();
  }

  private loadThresholds(): PerformanceThresholds {
    return {
      cpu: {
        warning: this.configService.get<number>('PERFORMANCE_CPU_WARNING', 70),
        critical: this.configService.get<number>('PERFORMANCE_CPU_CRITICAL', 90),
      },
      memory: {
        warning: this.configService.get<number>('PERFORMANCE_MEMORY_WARNING', 80),
        critical: this.configService.get<number>('PERFORMANCE_MEMORY_CRITICAL', 95),
      },
      responseTime: {
        warning: this.configService.get<number>('PERFORMANCE_RESPONSE_TIME_WARNING', 1000),
        critical: this.configService.get<number>('PERFORMANCE_RESPONSE_TIME_CRITICAL', 3000),
      },
      errorRate: {
        warning: this.configService.get<number>('PERFORMANCE_ERROR_RATE_WARNING', 5),
        critical: this.configService.get<number>('PERFORMANCE_ERROR_RATE_CRITICAL', 10),
      },
      diskUsage: {
        warning: this.configService.get<number>('PERFORMANCE_DISK_WARNING', 80),
        critical: this.configService.get<number>('PERFORMANCE_DISK_CRITICAL', 90),
      },
      databaseConnections: {
        warning: this.configService.get<number>('PERFORMANCE_DB_CONNECTIONS_WARNING', 80),
        critical: this.configService.get<number>('PERFORMANCE_DB_CONNECTIONS_CRITICAL', 95),
      },
    };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cpu: { usage: 0, loadAverage: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0, heapUsed: 0, heapTotal: 0, heapPercentage: 0 },
      eventLoop: { delay: 0, utilization: 0 },
      gc: { collections: 0, duration: 0, type: '' },
      requests: { total: 0, active: 0, averageResponseTime: 0, errorRate: 0 },
      database: { connections: 0, activeQueries: 0, averageQueryTime: 0, slowQueries: 0 },
      cache: { hitRate: 0, missRate: 0, size: 0, evictions: 0 },
    };
  }

  private startMonitoring() {
    const interval = this.configService.get<number>('PERFORMANCE_MONITORING_INTERVAL', 30000); // 30 seconds
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.cleanupOldData();
    }, interval);

    this.logger.log(`Performance monitoring started with ${interval}ms interval`);
  }

  private async collectMetrics() {
    try {
      // CPU metrics
      this.metrics.cpu = await this.getCPUMetrics();
      
      // Memory metrics
      this.metrics.memory = this.getMemoryMetrics();
      
      // Event loop metrics
      this.metrics.eventLoop = this.getEventLoopMetrics();
      
      // GC metrics
      this.metrics.gc = this.getGCMetrics();
      
      // Request metrics
      this.metrics.requests = this.getRequestMetrics();
      
      // Database metrics
      this.metrics.database = await this.getDatabaseMetrics();
      
      // Cache metrics
      this.metrics.cache = await this.getCacheMetrics();
      
      this.logger.debug('Performance metrics collected', this.metrics);
    } catch (error) {
      this.logger.error('Failed to collect performance metrics', error);
    }
  }

  private async getCPUMetrics() {
    const cpus = require('os').cpus();
    const loadAvg = require('os').loadavg();
    
    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const usage = 100 - (totalIdle / totalTick) * 100;
    
    return {
      usage: Math.round(usage * 100) / 100,
      loadAverage: loadAvg,
    };
  }

  private getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    
    return {
      used: usedMem,
      total: totalMem,
      percentage: Math.round((usedMem / totalMem) * 100),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      heapPercentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };
  }

  private getEventLoopMetrics() {
    const start = process.hrtime();
    return new Promise(resolve => {
      setImmediate(() => {
        const delay = process.hrtime(start)[1] / 1000000; // Convert to milliseconds
        resolve({
          delay: Math.round(delay * 100) / 100,
          utilization: Math.min(100, Math.round((delay / 10) * 100) / 100),
        });
      });
    });
  }

  private getGCMetrics() {
    return {
      collections: this.gcStats.collections,
      duration: this.gcStats.totalDuration,
      type: this.gcStats.collections > 0 ? 'automatic' : 'none',
    };
  }

  private getRequestMetrics() {
    const now = Date.now();
    let totalRequests = 0;
    let totalResponseTime = 0;
    let activeRequests = 0;
    let errors = 0;

    for (const [id, metric] of this.requestMetrics) {
      totalRequests += metric.count;
      activeRequests += now - metric.startTime < 30000 ? 1 : 0; // Active if less than 30s
    }

    // Calculate average response time and error rate (simplified)
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    return {
      total: totalRequests,
      active: activeRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  private async getDatabaseMetrics() {
    // This would integrate with your database monitoring
    // For now, return mock data
    return {
      connections: 10,
      activeQueries: 3,
      averageQueryTime: 50,
      slowQueries: this.slowQueries.length,
    };
  }

  private async getCacheMetrics() {
    // This would integrate with your cache monitoring
    // For now, return mock data
    return {
      hitRate: 85,
      missRate: 15,
      size: 1000000, // bytes
      evictions: 100,
    };
  }

  private checkThresholds() {
    const alerts: PerformanceAlert[] = [];

    // Check CPU
    if (this.metrics.cpu.usage > this.thresholds.cpu.critical) {
      alerts.push({
        type: 'CPU',
        severity: 'CRITICAL',
        message: `CPU usage is critically high: ${this.metrics.cpu.usage}%`,
        value: this.metrics.cpu.usage,
        threshold: this.thresholds.cpu.critical,
        timestamp: new Date(),
      });
    } else if (this.metrics.cpu.usage > this.thresholds.cpu.warning) {
      alerts.push({
        type: 'CPU',
        severity: 'MEDIUM',
        message: `CPU usage is high: ${this.metrics.cpu.usage}%`,
        value: this.metrics.cpu.usage,
        threshold: this.thresholds.cpu.warning,
        timestamp: new Date(),
      });
    }

    // Check Memory
    if (this.metrics.memory.percentage > this.thresholds.memory.critical) {
      alerts.push({
        type: 'MEMORY',
        severity: 'CRITICAL',
        message: `Memory usage is critically high: ${this.metrics.memory.percentage}%`,
        value: this.metrics.memory.percentage,
        threshold: this.thresholds.memory.critical,
        timestamp: new Date(),
      });
    } else if (this.metrics.memory.percentage > this.thresholds.memory.warning) {
      alerts.push({
        type: 'MEMORY',
        severity: 'MEDIUM',
        message: `Memory usage is high: ${this.metrics.memory.percentage}%`,
        value: this.metrics.memory.percentage,
        threshold: this.thresholds.memory.warning,
        timestamp: new Date(),
      });
    }

    // Check Response Time
    if (this.metrics.requests.averageResponseTime > this.thresholds.responseTime.critical) {
      alerts.push({
        type: 'RESPONSE_TIME',
        severity: 'CRITICAL',
        message: `Average response time is critically high: ${this.metrics.requests.averageResponseTime}ms`,
        value: this.metrics.requests.averageResponseTime,
        threshold: this.thresholds.responseTime.critical,
        timestamp: new Date(),
      });
    } else if (this.metrics.requests.averageResponseTime > this.thresholds.responseTime.warning) {
      alerts.push({
        type: 'RESPONSE_TIME',
        severity: 'MEDIUM',
        message: `Average response time is high: ${this.metrics.requests.averageResponseTime}ms`,
        value: this.metrics.requests.averageResponseTime,
        threshold: this.thresholds.responseTime.warning,
        timestamp: new Date(),
      });
    }

    // Check Error Rate
    if (this.metrics.requests.errorRate > this.thresholds.errorRate.critical) {
      alerts.push({
        type: 'ERROR_RATE',
        severity: 'CRITICAL',
        message: `Error rate is critically high: ${this.metrics.requests.errorRate}%`,
        value: this.metrics.requests.errorRate,
        threshold: this.thresholds.errorRate.critical,
        timestamp: new Date(),
      });
    } else if (this.metrics.requests.errorRate > this.thresholds.errorRate.warning) {
      alerts.push({
        type: 'ERROR_RATE',
        severity: 'MEDIUM',
        message: `Error rate is high: ${this.metrics.requests.errorRate}%`,
        value: this.metrics.requests.errorRate,
        threshold: this.thresholds.errorRate.warning,
        timestamp: new Date(),
      });
    }

    // Check Database Connections
    if (this.metrics.database.connections > this.thresholds.databaseConnections.critical) {
      alerts.push({
        type: 'DATABASE',
        severity: 'CRITICAL',
        message: `Database connections are critically high: ${this.metrics.database.connections}`,
        value: this.metrics.database.connections,
        threshold: this.thresholds.databaseConnections.critical,
        timestamp: new Date(),
      });
    } else if (this.metrics.database.connections > this.thresholds.databaseConnections.warning) {
      alerts.push({
        type: 'DATABASE',
        severity: 'MEDIUM',
        message: `Database connections are high: ${this.metrics.database.connections}`,
        value: this.metrics.database.connections,
        threshold: this.thresholds.databaseConnections.warning,
        timestamp: new Date(),
      });
    }

    // Store and log alerts
    if (alerts.length > 0) {
      this.alerts.push(...alerts);
      alerts.forEach(alert => {
        this.logger.warn(`Performance Alert [${alert.severity}]: ${alert.message}`, {
          type: alert.type,
          value: alert.value,
          threshold: alert.threshold,
        });
      });
    }
  }

  private cleanupOldData() {
    const now = Date.now();
    
    // Clean up old request metrics
    for (const [id, metric] of this.requestMetrics) {
      if (now - metric.startTime > 300000) { // 5 minutes
        this.requestMetrics.delete(id);
      }
    }
    
    // Clean up old slow queries
    this.slowQueries = this.slowQueries.filter(
      query => now - query.timestamp.getTime() < 3600000 // 1 hour
    );
    
    // Clean up old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  private setupGCMonitoring() {
    if (global.gc) {
      const originalGC = global.gc;
      
      global.gc = () => {
        const start = process.hrtime();
        originalGC();
        const duration = process.hrtime(start)[1] / 1000000; // Convert to milliseconds
        
        this.gcStats.collections++;
        this.gcStats.totalDuration += duration;
        this.gcStats.lastCollection = new Date();
      };
    }
  }

  // Public methods for manual tracking
  startRequestTracking(requestId: string): void {
    this.requestMetrics.set(requestId, {
      startTime: Date.now(),
      count: 1,
    });
  }

  endRequestTracking(requestId: string, responseTime: number, isError: boolean = false): void {
    const metric = this.requestMetrics.get(requestId);
    if (metric) {
      metric.count++;
      // Update metrics would go here
      this.requestMetrics.delete(requestId);
    }
  }

  trackSlowQuery(query: string, duration: number): void {
    this.slowQueries.push({
      query,
      duration,
      timestamp: new Date(),
    });
    
    this.logger.warn(`Slow query detected: ${duration}ms`, { query });
  }

  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getAlerts(limit: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  getThresholds(): PerformanceThresholds {
    return { ...this.thresholds };
  }

  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    Object.assign(this.thresholds, newThresholds);
    this.logger.log('Performance thresholds updated', this.thresholds);
  }

  async generatePerformanceReport(): Promise<string> {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.alerts.slice(-10),
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations(),
    };

    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.cpu.usage > this.thresholds.cpu.warning) {
      recommendations.push('Consider scaling up CPU resources or optimizing CPU-intensive operations');
    }

    if (this.metrics.memory.percentage > this.thresholds.memory.warning) {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }

    if (this.metrics.requests.averageResponseTime > this.thresholds.responseTime.warning) {
      recommendations.push('Optimize slow endpoints and consider implementing caching');
    }

    if (this.metrics.requests.errorRate > this.thresholds.errorRate.warning) {
      recommendations.push('Investigate and fix error-prone endpoints');
    }

    if (this.metrics.database.slowQueries > 10) {
      recommendations.push('Optimize database queries and add proper indexes');
    }

    if (this.metrics.cache.hitRate < 80) {
      recommendations.push('Review caching strategy and increase cache hit rate');
    }

    return recommendations;
  }

  async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      alerts: this.getAlerts(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['timestamp', 'cpu_usage', 'memory_percentage', 'avg_response_time', 'error_rate'];
      const values = [
        data.timestamp,
        this.metrics.cpu.usage,
        this.metrics.memory.percentage,
        this.metrics.requests.averageResponseTime,
        this.metrics.requests.errorRate,
      ];
      return [headers.join(','), values.join(',')].join('\n');
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.logger.log('Performance monitoring stopped');
  }
}

// Performance monitoring decorator
export function MonitorPerformance(operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const opName = operation || `${target.constructor.name}.${propertyName}`;
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        // Track performance if service is available
        if (this.performanceService) {
          this.performanceService.endRequestTracking(opName, duration, false);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        if (this.performanceService) {
          this.performanceService.endRequestTracking(opName, duration, true);
        }
        
        throw error;
      }
    };

    return descriptor;
  };
}

// Slow query monitoring decorator
export function MonitorSlowQueries(threshold: number = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        if (duration > threshold && this.performanceService) {
          this.performanceService.trackSlowQuery(
            `${target.constructor.name}.${propertyName}`,
            duration
          );
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        if (this.performanceService) {
          this.performanceService.trackSlowQuery(
            `${target.constructor.name}.${propertyName} (ERROR)`,
            duration
          );
        }
        
        throw error;
      }
    };

    return descriptor;
  };
}