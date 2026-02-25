import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SearchService } from './search.service';
import { RecommendationService } from './recommendation.service';
import { 
  SearchQueryDto, 
  SearchSuggestionDto, 
  IndexDocumentDto,
  IndexDocumentsDto,
  UpdateDocumentDto,
  DeleteDocumentDto,
  CreateIndexDto,
  UpdateIndexSettingsDto,
  SearchAnalyticsDto,
  RecommendationQueryDto,
  UserBehaviorDto,
  TrendingSearchDto,
  PopularProductsDto,
  SimilarProductsDto,
  AutocompleteDto
} from './dto/search.dto';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Perform search across different indexes' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(@Request() req, @Body() searchQueryDto: SearchQueryDto) {
    return this.searchService.search(searchQueryDto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Perform search via GET request' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async searchGet(
    @Request() req,
    @Query('query') query: string,
    @Query('type') type?: string,
    @Query('categories') categories?: string,
    @Query('brands') brands?: string,
    @Query('tags') tags?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('location') location?: string,
    @Query('radius') radius?: number,
  ) {
    const searchQueryDto: SearchQueryDto = {
      query,
      type: type as any,
      categories: categories ? categories.split(',') : undefined,
      brands: brands ? brands.split(',') : undefined,
      tags: tags ? tags.split(',') : undefined,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page,
      limit,
      location,
      radius,
    };

    return this.searchService.search(searchQueryDto, req.user?.id);
  }

  @Post('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully' })
  async getSuggestions(@Body() searchSuggestionDto: SearchSuggestionDto) {
    return this.searchService.getSuggestions(searchSuggestionDto);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions via GET request' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully' })
  async getSuggestionsGet(
    @Query('query') query: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    const searchSuggestionDto: SearchSuggestionDto = {
      query,
      type: type as any,
      limit,
    };

    return this.searchService.getSuggestions(searchSuggestionDto);
  }

  @Post('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions retrieved successfully' })
  async autocomplete(@Body() autocompleteDto: AutocompleteDto) {
    return this.searchService.autocomplete(autocompleteDto);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Get autocomplete suggestions via GET request' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions retrieved successfully' })
  async autocompleteGet(
    @Query('query') query: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    const autocompleteDto: AutocompleteDto = {
      query,
      type: type as any,
      limit,
    };

    return this.searchService.autocomplete(autocompleteDto);
  }

  @Post('trending')
  @ApiOperation({ summary: 'Get trending searches' })
  @ApiResponse({ status: 200, description: 'Trending searches retrieved successfully' })
  async getTrendingSearches(@Body() trendingSearchDto: TrendingSearchDto) {
    return this.searchService.getTrendingSearches(trendingSearchDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending searches via GET request' })
  @ApiResponse({ status: 200, description: 'Trending searches retrieved successfully' })
  async getTrendingSearchesGet(
    @Query('type') type?: string,
    @Query('timeRange') timeRange?: string,
    @Query('limit') limit?: number,
    @Query('location') location?: string,
  ) {
    const trendingSearchDto: TrendingSearchDto = {
      type: type as any,
      timeRange,
      limit,
      location,
    };

    return this.searchService.getTrendingSearches(trendingSearchDto);
  }

  @Post('popular')
  @ApiOperation({ summary: 'Get popular products' })
  @ApiResponse({ status: 200, description: 'Popular products retrieved successfully' })
  async getPopularProducts(@Body() popularProductsDto: PopularProductsDto) {
    return this.searchService.getPopularProducts(popularProductsDto);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular products via GET request' })
  @ApiResponse({ status: 200, description: 'Popular products retrieved successfully' })
  async getPopularProductsGet(
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('timeRange') timeRange?: string,
    @Query('limit') limit?: number,
    @Query('location') location?: string,
  ) {
    const popularProductsDto: PopularProductsDto = {
      categoryId,
      brandId,
      timeRange,
      limit,
      location,
    };

    return this.searchService.getPopularProducts(popularProductsDto);
  }

  @Post('recommendations')
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendations(@Request() req, @Body() recommendationQueryDto: RecommendationQueryDto) {
    return this.recommendationService.getRecommendations({
      ...recommendationQueryDto,
      userId: recommendationQueryDto.userId || req.user?.id,
    });
  }

  @Get('recommendations')
  @ApiOperation({ summary: 'Get personalized recommendations via GET request' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getRecommendationsGet(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('algorithm') algorithm?: string,
    @Query('limit') limit?: number,
  ) {
    const recommendationQueryDto: RecommendationQueryDto = {
      userId: userId || req.user?.id,
      productId,
      categoryId,
      algorithm: algorithm as any,
      limit,
    };

    return this.recommendationService.getRecommendations(recommendationQueryDto);
  }

  @Post('recommendations/home')
  @ApiOperation({ summary: 'Get personalized home page recommendations' })
  @ApiResponse({ status: 200, description: 'Home recommendations retrieved successfully' })
  async getHomeRecommendations(@Request() req) {
    return this.recommendationService.getHomeRecommendations(req.user?.id);
  }

  @Post('recommendations/similar')
  @ApiOperation({ summary: 'Get similar products' })
  @ApiResponse({ status: 200, description: 'Similar products retrieved successfully' })
  async getSimilarProducts(@Body() similarProductsDto: SimilarProductsDto) {
    return this.recommendationService.getSimilarProducts(similarProductsDto);
  }

  @Get('recommendations/similar/:productId')
  @ApiOperation({ summary: 'Get similar products via GET request' })
  @ApiResponse({ status: 200, description: 'Similar products retrieved successfully' })
  async getSimilarProductsGet(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
    @Query('excludeIds') excludeIds?: string,
  ) {
    const similarProductsDto: SimilarProductsDto = {
      productId,
      limit,
      excludeIds: excludeIds ? excludeIds.split(',') : undefined,
    };

    return this.recommendationService.getSimilarProducts(similarProductsDto);
  }

  @Post('recommendations/frequently-bought-together/:productId')
  @ApiOperation({ summary: 'Get frequently bought together products' })
  @ApiResponse({ status: 200, description: 'Frequently bought together products retrieved successfully' })
  async getFrequentlyBoughtTogether(
    @Param('productId') productId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getFrequentlyBoughtTogether(productId, limit);
  }

  @Post('behavior')
  @ApiOperation({ summary: 'Track user behavior for recommendations' })
  @ApiResponse({ status: 201, description: 'User behavior tracked successfully' })
  async trackUserBehavior(@Request() req, @Body() userBehaviorDto: UserBehaviorDto) {
    return this.recommendationService.trackUserBehavior({
      ...userBehaviorDto,
      userId: userBehaviorDto.userId || req.user?.id,
    });
  }

  @Post('index/document')
  @Roles('admin')
  @ApiOperation({ summary: 'Index a single document' })
  @ApiResponse({ status: 201, description: 'Document indexed successfully' })
  async indexDocument(@Body() indexDocumentDto: IndexDocumentDto) {
    return this.searchService.indexDocument(indexDocumentDto);
  }

  @Post('index/documents')
  @Roles('admin')
  @ApiOperation({ summary: 'Index multiple documents' })
  @ApiResponse({ status: 201, description: 'Documents indexed successfully' })
  async indexDocuments(@Body() indexDocumentsDto: IndexDocumentsDto) {
    return this.searchService.indexDocuments(indexDocumentsDto);
  }

  @Put('index/document')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  async updateDocument(@Body() updateDocumentDto: UpdateDocumentDto) {
    return this.searchService.updateDocument(updateDocumentDto);
  }

  @Delete('index/document')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  async deleteDocument(@Body() deleteDocumentDto: DeleteDocumentDto) {
    return this.searchService.deleteDocument(deleteDocumentDto);
  }

  @Post('index')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new search index' })
  @ApiResponse({ status: 201, description: 'Index created successfully' })
  async createIndex(@Body() createIndexDto: CreateIndexDto) {
    return this.searchService.createIndex(createIndexDto);
  }

  @Put('index/settings')
  @Roles('admin')
  @ApiOperation({ summary: 'Update index settings' })
  @ApiResponse({ status: 200, description: 'Index settings updated successfully' })
  async updateIndexSettings(@Body() updateIndexSettingsDto: UpdateIndexSettingsDto) {
    return this.searchService.updateIndexSettings(updateIndexSettingsDto);
  }

  @Post('reindex')
  @Roles('admin')
  @ApiOperation({ summary: 'Reindex all data from database' })
  @ApiResponse({ status: 200, description: 'Reindexing completed successfully' })
  async reindexAll() {
    return this.searchService.reindexAll();
  }

  @Get('analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Get search analytics' })
  @ApiResponse({ status: 200, description: 'Search analytics retrieved successfully' })
  async getSearchAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.getSearchAnalytics({
      startDate,
      endDate,
      type,
      limit,
    });
  }

  @Post('analytics')
  @Roles('admin')
  @ApiOperation({ summary: 'Track search analytics' })
  @ApiResponse({ status: 201, description: 'Search analytics tracked successfully' })
  async trackSearchAnalytics(@Body() searchAnalyticsDto: SearchAnalyticsDto) {
    return this.searchService.trackSearchAnalytics(searchAnalyticsDto);
  }
}