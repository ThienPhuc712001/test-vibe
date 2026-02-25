import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { RecommendationService } from './recommendation.service';
import { MeilisearchService } from './providers/meilisearch.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
  ],
  controllers: [SearchController],
  providers: [
    SearchService,
    RecommendationService,
    MeilisearchService,
  ],
  exports: [
    SearchService,
    RecommendationService,
    MeilisearchService,
  ],
})
export class SearchModule {}