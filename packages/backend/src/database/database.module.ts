import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PrismaClient,
      useFactory: (configService: ConfigService) => {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: configService.get('DATABASE_URL'),
            },
          },
          log: configService.get('NODE_ENV') === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });

        // Connect to database
        prisma.$connect()
          .then(() => console.log('✅ Database connected successfully'))
          .catch((error) => console.error('❌ Database connection failed:', error));

        return prisma;
      },
      inject: [ConfigService],
    },
    PrismaService,
  ],
  exports: [PrismaClient, PrismaService],
})
export class DatabaseModule {}