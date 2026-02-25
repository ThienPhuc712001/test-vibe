import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MeilisearchService } from './providers/meilisearch.service';
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
  AutocompleteDto,
  TrendingSearchDto,
  PopularProductsDto
} from './dto/search.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private prisma: PrismaService,
    private meilisearchService: MeilisearchService,
  ) {}

  /**
   * Perform search across different indexes
   */
  async search(query: SearchQueryDto, userId?: string) {
    try {
      const {
        query: searchQuery,
        type = 'all',
        categories,
        brands,
        tags,
        minPrice,
        maxPrice,
        minRating,
        maxRating,
        sortBy = 'relevance',
        sortOrder = 'desc',
        page = 1,
        limit = 20,
        location,
        radius,
        filters = {},
        facets = [],
      } = query;

      // Track search analytics
      await this.trackSearchAnalytics({
        query: searchQuery,
        type,
        resultsCount: 0, // Will be updated after search
        userId: userId ? parseInt(userId) : undefined,
        filters: { categories, brands, tags, minPrice, maxPrice, minRating, maxRating, location, radius, ...filters },
      });

      const offset = (page - 1) * limit;
      const searchOptions: any = {
        limit,
        offset,
        sort: this.buildSortOptions(sortBy, sortOrder),
        facets: facets.length > 0 ? facets : ['category', 'brand', 'price', 'rating'],
        filter: this.buildFilterOptions(categories, brands, tags, minPrice, maxPrice, minRating, maxRating, location, radius, filters),
      };

      let results;

      if (type === 'all') {
        // Search across multiple indexes
        const searchQueries = [
          { indexUid: 'products', q: searchQuery, ...searchOptions },
          { indexUid: 'shops', q: searchQuery, ...searchOptions },
          { indexUid: 'categories', q: searchQuery, ...searchOptions },
          { indexUid: 'brands', q: searchQuery, ...searchOptions },
        ];

        const multiSearchResults = await this.meilisearchService.multiSearch(searchQueries);
        results = this.formatMultiSearchResults(multiSearchResults);
      } else {
        // Search specific index
        const indexUid = `${type}`;
        results = await this.meilisearchService.search(indexUid, searchQuery, searchOptions);
        results = this.formatSearchResults(results, type);
      }

      // Update analytics with actual results count
      await this.updateSearchAnalytics(searchQuery, type, results.hits.length);

      return {
        query: searchQuery,
        type,
        page,
        limit,
        total: results.estimatedTotalHits || results.hits.length,
        results: results.hits,
        facets: results.facetsDistribution || {},
        processingTimeMs: results.processingTimeMs || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to perform search: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: SearchSuggestionDto) {
    try {
      const { query: searchQuery, type = 'all', limit = 5 } = query;

      if (type === 'all') {
        // Get suggestions from multiple indexes
        const [productSuggestions, shopSuggestions, categorySuggestions] = await Promise.all([
          this.meilisearchService.getSuggestions('products', searchQuery, { limit }),
          this.meilisearchService.getSuggestions('shops', searchQuery, { limit }),
          this.meilisearchService.getSuggestions('categories', searchQuery, { limit }),
        ]);

        return {
          query: searchQuery,
          suggestions: [
            ...productSuggestions.slice(0, 3),
            ...shopSuggestions.slice(0, 1),
            ...categorySuggestions.slice(0, 1),
          ].slice(0, limit),
        };
      } else {
        const suggestions = await this.meilisearchService.getSuggestions(type, searchQuery, { limit });
        return {
          query: searchQuery,
          suggestions,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get suggestions: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions
   */
  async autocomplete(query: AutocompleteDto) {
    try {
      const { query: searchQuery, type = 'products', limit = 5 } = query;

      const suggestions = await this.meilisearchService.autocomplete(type, searchQuery, { limit });

      return {
        query: searchQuery,
        type,
        suggestions,
      };
    } catch (error) {
      this.logger.error(`Failed to get autocomplete: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(data: IndexDocumentDto) {
    try {
      const { index, id, document } = data;
      return await this.meilisearchService.addDocuments(index, [{ ...document, id }], 'id');
    } catch (error) {
      this.logger.error(`Failed to index document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Index multiple documents
   */
  async indexDocuments(data: IndexDocumentsDto) {
    try {
      const { index, documents } = data;
      return await this.meilisearchService.addDocuments(index, documents, 'id');
    } catch (error) {
      this.logger.error(`Failed to index documents: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(data: UpdateDocumentDto) {
    try {
      const { index, id, document } = data;
      return await this.meilisearchService.updateDocuments(index, [{ ...document, id }], 'id');
    } catch (error) {
      this.logger.error(`Failed to update document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(data: DeleteDocumentDto) {
    try {
      const { index, id } = data;
      return await this.meilisearchService.deleteDocument(index, id);
    } catch (error) {
      this.logger.error(`Failed to delete document: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Create a new index
   */
  async createIndex(data: CreateIndexDto) {
    try {
      const { uid, primaryKey, settings } = data;
      return await this.meilisearchService.createIndex(uid, { primaryKey, settings });
    } catch (error) {
      this.logger.error(`Failed to create index: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Update index settings
   */
  async updateIndexSettings(data: UpdateIndexSettingsDto) {
    try {
      const { uid, settings } = data;
      return await this.meilisearchService.updateIndexSettings(uid, settings);
    } catch (error) {
      this.logger.error(`Failed to update index settings: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(query: TrendingSearchDto) {
    try {
      const { type = 'products', timeRange = '7d', limit = 10, location } = query;

      const trendingSearches = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          type,
          timestamp: this.getTimeRangeDate(timeRange),
          ...(location && { metadata: { path: ['location'], equals: location } }),
        },
        _count: {
          query: true,
        },
        orderBy: {
          _count: {
            query: 'desc',
          },
        },
        take: limit,
      });

      return trendingSearches.map(t => ({
        query: t.query,
        count: t._count.query,
        type,
      }));
    } catch (error) {
      this.logger.error(`Failed to get trending searches: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get popular products
   */
  async getPopularProducts(query: PopularProductsDto) {
    try {
      const { categoryId, brandId, timeRange = '7d', limit = 20, location } = query;

      const whereClause: any = {
        status: 'active',
        createdAt: this.getTimeRangeDate(timeRange),
      };

      if (categoryId) whereClause.categoryId = categoryId;
      if (brandId) whereClause.brandId = brandId;

      const popularProducts = await this.prisma.product.findMany({
        where: whereClause,
        include: {
          shop: true,
          category: true,
          brand: true,
          reviews: {
            where: { status: 'approved' },
            take: 3,
          },
        },
        take: limit,
        orderBy: [
          { salesCount: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
        ],
      });

      return popularProducts;
    } catch (error) {
      this.logger.error(`Failed to get popular products: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Reindex all data from database
   */
  async reindexAll() {
    try {
      this.logger.log('Starting reindexing all data...');

      // Reindex products
      const products = await this.prisma.product.findMany({
        where: { status: 'active' },
        include: {
          shop: true,
          category: true,
          brand: true,
        },
      });

      await this.meilisearchService.indexProducts(products);

      // Reindex shops
      const shops = await this.prisma.shop.findMany({
        where: { status: 'active' },
        include: {
          user: true,
          category: true,
        },
      });

      await this.meilisearchService.indexShops(shops);

      // Reindex categories
      const categories = await this.prisma.category.findMany({
        where: { status: 'active' },
      });

      await this.meilisearchService.indexCategories(categories);

      // Reindex brands
      const brands = await this.prisma.brand.findMany({
        where: { status: 'active' },
      });

      await this.meilisearchService.indexBrands(brands);

      this.logger.log('Reindexing completed successfully');
      return { message: 'Reindexing completed successfully' };
    } catch (error) {
      this.logger.error(`Failed to reindex data: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
  } = {}) {
    try {
      const { startDate, endDate, type, limit = 100 } = filters;

      const whereClause: any = {};

      if (startDate) whereClause.timestamp = { gte: new Date(startDate) };
      if (endDate) whereClause.timestamp = { ...whereClause.timestamp, lte: new Date(endDate) };
      if (type) whereClause.type = type;

      const analytics = await this.prisma.searchAnalytics.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return analytics;
    } catch (error) {
      this.logger.error(`Failed to get search analytics: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Build sort options for Meilisearch
   */
  private buildSortOptions(sortBy: string, sortOrder: string): any[] {
    const sortFieldMap: Record<string, string> = {
      relevance: '',
      price: 'price',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      rating: 'rating',
      salesCount: 'salesCount',
      name: 'name',
      popularity: 'popularity',
    };

    const field = sortFieldMap[sortBy] || '';
    if (!field) return [];

    return [`${field}:${sortOrder}`];
  }

  /**
   * Build filter options for Meilisearch
   */
  private buildFilterOptions(
    categories?: string[],
    brands?: string[],
    tags?: string[],
    minPrice?: number,
    maxPrice?: number,
    minRating?: number,
    maxRating?: number,
    location?: string,
    radius?: number,
    additionalFilters?: Record<string, any>,
  ): string {
    const filters: string[] = [];

    if (categories && categories.length > 0) {
      filters.push(`categoryId IN [${categories.map(c => `'${c}'`).join(', ')}]`);
    }

    if (brands && brands.length > 0) {
      filters.push(`brandId IN [${brands.map(b => `'${b}'`).join(', ')}]`);
    }

    if (tags && tags.length > 0) {
      filters.push(`tags IN [${tags.map(t => `'${t}'`).join(', ')}]`);
    }

    if (minPrice !== undefined) {
      filters.push(`price >= ${minPrice}`);
    }

    if (maxPrice !== undefined) {
      filters.push(`price <= ${maxPrice}`);
    }

    if (minRating !== undefined) {
      filters.push(`rating >= ${minRating}`);
    }

    if (maxRating !== undefined) {
      filters.push(`rating <= ${maxRating}`);
    }

    if (location && radius) {
      // Add location-based filtering (implementation depends on your location data structure)
      filters.push(`location = '${location}' AND radius <= ${radius}`);
    }

    // Add additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        filters.push(`${key} IN [${value.map(v => `'${v}'`).join(', ')}]`);
      } else {
        filters.push(`${key} = '${value}'`);
      }
    });

    return filters.join(' AND ');
  }

  /**
   * Format multi-search results
   */
  private formatMultiSearchResults(results: any): any {
    const formattedResults = {
      hits: [],
      estimatedTotalHits: 0,
      facetsDistribution: {},
      processingTimeMs: 0,
    };

    results.results.forEach((result: any, index: number) => {
      const indexTypes = ['products', 'shops', 'categories', 'brands'];
      const type = indexTypes[index];

      result.hits = result.hits.map((hit: any) => ({
        ...hit,
        searchType: type,
      }));

      formattedResults.hits.push(...result.hits);
      formattedResults.estimatedTotalHits += result.estimatedTotalHits || 0;
      formattedResults.processingTimeMs += result.processingTimeMs || 0;

      // Merge facets
      Object.entries(result.facetsDistribution || {}).forEach(([key, value]) => {
        formattedResults.facetsDistribution[key] = value;
      });
    });

    return formattedResults;
  }

  /**
   * Format search results
   */
  private formatSearchResults(results: any, type: string): any {
    return {
      ...results,
      hits: results.hits.map((hit: any) => ({
        ...hit,
        searchType: type,
      })),
    };
  }

  /**
   * Track search analytics
   */
  private async trackSearchAnalytics(data: Partial<SearchAnalyticsDto>) {
    try {
      await this.prisma.searchAnalytics.create({
        data: {
          query: data.query!,
          type: data.type!,
          resultsCount: data.resultsCount || 0,
          userId: data.userId,
          sessionId: data.sessionId,
          filters: data.filters || {},
          userAgent: data.userAgent,
          ip: data.ip,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to track search analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Update search analytics with results count
   */
  private async updateSearchAnalytics(query: string, type: string, resultsCount: number) {
    try {
      await this.prisma.searchAnalytics.updateMany({
        where: {
          query,
          type,
          timestamp: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
        },
        data: {
          resultsCount,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update search analytics: ${(error as Error).message}`);
    }
  }

  /**
   * Get time range date
   */
  private getTimeRangeDate(timeRange: string): Date {
    const timeRangeMap: Record<string, number> = {
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const ms = timeRangeMap[timeRange] || timeRangeMap['7d'];
    return new Date(Date.now() - ms);
  }
}