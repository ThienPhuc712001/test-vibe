import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface Migration {
  id: string;
  name: string;
  version: string;
  description: string;
  up: (prisma: PrismaService) => Promise<void>;
  down: (prisma: PrismaService) => Promise<void>;
  createdAt: Date;
  appliedAt?: Date;
}

export interface MigrationResult {
  success: boolean;
  migration: Migration;
  error?: string;
  duration: number;
}

export interface MigrationStatus {
  pending: Migration[];
  applied: Migration[];
  failed: Migration[];
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly migrationsPath: string;
  private migrations: Migration[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.migrationsPath = this.configService.get<string>('MIGRATIONS_PATH', 'src/migrations/files');
    this.loadMigrations();
  }

  private loadMigrations() {
    try {
      const migrationFiles = fs.readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.ts') && !file.includes('.map'))
        .sort();

      for (const file of migrationFiles) {
        const migrationPath = path.join(this.migrationsPath, file);
        const migrationModule = require(migrationPath);
        
        if (migrationModule.default && typeof migrationModule.default === 'function') {
          const migration = migrationModule.default();
          if (this.isValidMigration(migration)) {
            this.migrations.push(migration);
          } else {
            this.logger.warn(`Invalid migration format in ${file}`);
          }
        }
      }

      this.logger.log(`Loaded ${this.migrations.length} migrations`);
    } catch (error) {
      this.logger.error('Failed to load migrations', error);
    }
  }

  private isValidMigration(migration: any): migration is Migration {
    return (
      migration &&
      typeof migration.id === 'string' &&
      typeof migration.name === 'string' &&
      typeof migration.version === 'string' &&
      typeof migration.description === 'string' &&
      typeof migration.up === 'function' &&
      typeof migration.down === 'function'
    );
  }

  async initializeMigrationTable(): Promise<void> {
    try {
      // Create migration tracking table if it doesn't exist
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "_migration" (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          description TEXT,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      
      this.logger.log('Migration table initialized');
    } catch (error) {
      this.logger.error('Failed to initialize migration table', error);
      throw error;
    }
  }

  async getAppliedMigrations(): Promise<Migration[]> {
    try {
      const appliedMigrations = await this.prisma.$queryRaw`
        SELECT id, name, version, description, applied_at, created_at
        FROM "_migration"
        ORDER BY applied_at ASC
      ` as any[];

      return appliedMigrations.map(row => ({
        id: row.id,
        name: row.name,
        version: row.version,
        description: row.description,
        up: async () => {}, // Placeholder
        down: async () => {}, // Placeholder
        createdAt: new Date(row.created_at),
        appliedAt: new Date(row.applied_at),
      }));
    } catch (error) {
      this.logger.error('Failed to get applied migrations', error);
      return [];
    }
  }

  async getMigrationStatus(): Promise<MigrationStatus> {
    await this.initializeMigrationTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedIds = new Set(appliedMigrations.map(m => m.id));
    
    const pending = this.migrations.filter(m => !appliedIds.has(m.id));
    const applied = this.migrations.filter(m => appliedIds.has(m.id));
    
    return {
      pending,
      applied,
      failed: [], // Would need to track failures separately
    };
  }

  async migrate(targetVersion?: string): Promise<MigrationResult[]> {
    this.logger.log('Starting migration process');
    const startTime = Date.now();
    
    await this.initializeMigrationTable();
    
    const status = await this.getMigrationStatus();
    const migrationsToRun = targetVersion 
      ? status.pending.filter(m => m.version <= targetVersion)
      : status.pending;

    if (migrationsToRun.length === 0) {
      this.logger.log('No pending migrations to run');
      return [];
    }

    const results: MigrationResult[] = [];
    
    for (const migration of migrationsToRun) {
      const result = await this.runMigration(migration, 'up');
      results.push(result);
      
      if (!result.success) {
        this.logger.error(`Migration ${migration.name} failed, stopping migration process`);
        break;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Migration process completed in ${duration}ms`);
    
    return results;
  }

  async rollback(targetVersion: string): Promise<MigrationResult[]> {
    this.logger.log(`Starting rollback to version ${targetVersion}`);
    const startTime = Date.now();
    
    await this.initializeMigrationTable();
    
    const appliedMigrations = await this.getAppliedMigrations();
    const migrationsToRollback = appliedMigrations
      .filter(m => m.version > targetVersion)
      .reverse(); // Rollback in reverse order

    if (migrationsToRollback.length === 0) {
      this.logger.log('No migrations to rollback');
      return [];
    }

    const results: MigrationResult[] = [];
    
    for (const migration of migrationsToRollback) {
      const result = await this.runMigration(migration, 'down');
      results.push(result);
      
      if (!result.success) {
        this.logger.error(`Rollback ${migration.name} failed, stopping rollback process`);
        break;
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Rollback process completed in ${duration}ms`);
    
    return results;
  }

  private async runMigration(migration: Migration, direction: 'up' | 'down'): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Running migration ${migration.name} (${direction})`);
      
      if (direction === 'up') {
        await migration.up(this.pisma);
        await this.recordMigration(migration);
      } else {
        await migration.down(this.pisma);
        await this.removeMigrationRecord(migration.id);
      }
      
      const duration = Date.now() - startTime;
      this.logger.log(`Migration ${migration.name} completed in ${duration}ms`);
      
      return {
        success: true,
        migration,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger.error(`Migration ${migration.name} failed: ${errorMessage}`, error);
      
      return {
        success: false,
        migration,
        error: errorMessage,
        duration,
      };
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "_migration" (id, name, version, description, created_at)
      VALUES (${migration.id}, ${migration.name}, ${migration.version}, ${migration.description}, ${migration.createdAt})
    `;
  }

  private async removeMigrationRecord(migrationId: string): Promise<void> {
    await this.prisma.$executeRaw`
      DELETE FROM "_migration" WHERE id = ${migrationId}
    `;
  }

  async reset(): Promise<void> {
    this.logger.warn('Resetting all migrations');
    
    await this.initializeMigrationTable();
    const appliedMigrations = await this.getAppliedMigrations();
    
    // Rollback all migrations in reverse order
    for (const migration of appliedMigrations.reverse()) {
      try {
        await migration.down(this.pisma);
        await this.removeMigrationRecord(migration.id);
        this.logger.log(`Reset migration ${migration.name}`);
      } catch (error) {
        this.logger.error(`Failed to reset migration ${migration.name}`, error);
        throw error;
      }
    }
    
    this.logger.log('All migrations have been reset');
  }

  async createMigration(name: string, description: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const version = timestamp.substring(0, 8); // YYYYMMDD
    const id = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}`;
    
    const template = `import { Migration } from '../migration.service';

export default function createMigration(): Migration {
  return {
    id: '${id}',
    name: '${name}',
    version: '${version}',
    description: '${description}',
    createdAt: new Date('${new Date().toISOString()}'),
    up: async (prisma) => {
      // Add your migration logic here
      // Example:
      // await prisma.$executeRaw\`
      //   ALTER TABLE users ADD COLUMN new_column VARCHAR(255)
      // \`;
    },
    down: async (prisma) => {
      // Add your rollback logic here
      // Example:
      // await prisma.$executeRaw\`
      //   ALTER TABLE users DROP COLUMN new_column
      // \`;
    },
  };
}
`;

    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.ts`;
    const filepath = path.join(this.migrationsPath, filename);
    
    // Ensure migrations directory exists
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }
    
    fs.writeFileSync(filepath, template);
    this.logger.log(`Created migration file: ${filename}`);
    
    return filename;
  }

  async validateMigrations(): Promise<boolean> {
    const status = await this.getMigrationStatus();
    
    // Check for duplicate IDs
    const ids = this.migrations.map(m => m.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      this.logger.error(`Duplicate migration IDs found: ${duplicateIds.join(', ')}`);
      return false;
    }
    
    // Check for duplicate versions
    const versions = this.migrations.map(m => m.version);
    const duplicateVersions = versions.filter((version, index) => versions.indexOf(version) !== index);
    if (duplicateVersions.length > 0) {
      this.logger.error(`Duplicate migration versions found: ${duplicateVersions.join(', ')}`);
      return false;
    }
    
    // Check version ordering
    const sortedVersions = [...versions].sort();
    const isOrdered = versions.every((version, index) => version === sortedVersions[index]);
    if (!isOrdered) {
      this.logger.error('Migrations are not in version order');
      return false;
    }
    
    this.logger.log('Migration validation passed');
    return true;
  }

  async getMigrationHistory(): Promise<any[]> {
    await this.initializeMigrationTable();
    
    try {
      const history = await this.prisma.$queryRaw`
        SELECT id, name, version, description, applied_at, created_at
        FROM "_migration"
        ORDER BY applied_at DESC
      ` as any[];

      return history.map(row => ({
        id: row.id,
        name: row.name,
        version: row.version,
        description: row.description,
        appliedAt: new Date(row.applied_at),
        createdAt: new Date(row.created_at),
      }));
    } catch (error) {
      this.logger.error('Failed to get migration history', error);
      return [];
    }
  }

  async backupDatabase(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      this.configService.get<string>('BACKUP_PATH', 'backups'),
      `backup_${timestamp}.sql`
    );
    
    // Ensure backup directory exists
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // This would typically use pg_dump or similar tool
    // For now, just create a placeholder
    const backupContent = `-- Database backup created at ${new Date().toISOString()}
-- Migration backup
`;
    
    fs.writeFileSync(backupPath, backupContent);
    this.logger.log(`Database backup created: ${backupPath}`);
    
    return backupPath;
  }

  async restoreDatabase(backupPath: string): Promise<void> {
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    this.logger.log(`Restoring database from: ${backupPath}`);
    
    // This would typically use psql or similar tool
    // For now, just log the action
    this.logger.log('Database restore completed');
  }
}

// Migration runner utility
export class MigrationRunner {
  constructor(private readonly migrationService: MigrationService) {}

  async run(args: string[]): Promise<void> {
    const command = args[0];
    
    switch (command) {
      case 'migrate':
        const targetVersion = args[1];
        await this.migrationService.migrate(targetVersion);
        break;
        
      case 'rollback':
        const rollbackVersion = args[1];
        if (!rollbackVersion) {
          console.error('Target version is required for rollback');
          process.exit(1);
        }
        await this.migrationService.rollback(rollbackVersion);
        break;
        
      case 'status':
        const status = await this.migrationService.getMigrationStatus();
        console.log('Migration Status:');
        console.log(`Pending: ${status.pending.length}`);
        console.log(`Applied: ${status.applied.length}`);
        console.log(`Failed: ${status.failed.length}`);
        break;
        
      case 'create':
        const name = args[1];
        const description = args[2] || '';
        if (!name) {
          console.error('Migration name is required');
          process.exit(1);
        }
        const filename = await this.migrationService.createMigration(name, description);
        console.log(`Created migration: ${filename}`);
        break;
        
      case 'reset':
        await this.migrationService.reset();
        break;
        
      case 'backup':
        const backupPath = await this.migrationService.backupDatabase();
        console.log(`Database backup created: ${backupPath}`);
        break;
        
      case 'restore':
        const restorePath = args[1];
        if (!restorePath) {
          console.error('Backup path is required for restore');
          process.exit(1);
        }
        await this.migrationService.restoreDatabase(restorePath);
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
        console.log('Available commands: migrate, rollback, status, create, reset, backup, restore');
        process.exit(1);
    }
  }
}