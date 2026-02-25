import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  RecommendationQueryDto, 
  UserBehaviorDto, 
  TrendingSearchDto,
  PopularProductsDto,
  SimilarProductsDto 
} from './dto/search.dto';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get personalized recommendations for user
   */
  async getRecommendations(query: RecommendationQueryDto) {
    try {
      const { userId, productId, categoryId, algorithm = 'hybrid', limit = 20, excludeIds = [], context = {} } = query;

      let recommendations = [];

      switch (algorithm) {
        case 'collaborative':
          recommendations = await this.getCollaborativeRecommendations(userId, limit, excludeIds);
          break;
        case 'content_based':
          recommendations = await this.getContentBasedRecommendations(productId, categoryId, limit, excludeIds);
          break;
        case 'popular':
          recommendations = await this.getPopularProducts(categoryId, limit, excludeIds);
          break;
        case 'trending':
          recommendations = await this.getTrendingProducts(categoryId, limit, excludeIds);
          break;
        case 'hybrid':
        default:
          recommendations = await this.getHybridRecommendations(userId, productId, categoryId, limit, excludeIds, context);
          break;
      }

      return {
        algorithm,
        recommendations,
        total: recommendations.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get recommendations: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Collaborative filtering recommendations
   */
  private async getCollaborativeRecommendations(userId: string, limit: number, excludeIds: string[]) {
    try {
      // Get user's purchase history and behavior
      const userBehavior = await this.prisma.userBehavior.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      // Find similar users based on behavior
      const similarUsers = await this.findSimilarUsers(userId, userBehavior);

      // Get products liked by similar users
      const recommendedProducts = await this.prisma.product.findMany({
        where: {
          id: {
            in: await this.getProductsFromSimilarUsers(similarUsers, userId),
            notIn: excludeIds,
          },
          status: 'active',
        },
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
        orderBy: { rating: 'desc' },
      });

      return recommendedProducts;
    } catch (error) {
      this.logger.error(`Failed to get collaborative recommendations: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Content-based recommendations
   */
  private async getContentBasedRecommendations(productId?: string, categoryId?: string, limit?: number, excludeIds?: string[]) {
    try {
      let baseProduct;

      if (productId) {
        baseProduct = await this.prisma.product.findUnique({
          where: { id: productId },
          include: { category: true, brand: true, tags: true },
        });
      }

      const whereClause: any = {
        status: 'active',
        id: { notIn: excludeIds },
      };

      if (baseProduct) {
        // Find similar products based on category, brand, and tags
        whereClause.OR = [
          { categoryId: baseProduct.categoryId },
          { brandId: baseProduct.brandId },
          { tags: { hasSome: baseProduct.tags } },
        ];
      } else if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      const recommendedProducts = await this.prisma.product.findMany({
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
        orderBy: { rating: 'desc' },
      });

      return recommendedProducts;
    } catch (error) {
      this.logger.error(`Failed to get content-based recommendations: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Popular products recommendations
   */
  private async getPopularProducts(categoryId?: string, limit?: number, excludeIds?: string[]) {
    try {
      const whereClause: any = {
        status: 'active',
        id: { notIn: excludeIds },
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

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
   * Trending products recommendations
   */
  private async getTrendingProducts(categoryId?: string, limit?: number, excludeIds?: string[]) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const whereClause: any = {
        status: 'active',
        id: { notIn: excludeIds },
        createdAt: { gte: thirtyDaysAgo },
      };

      if (categoryId) {
        whereClause.categoryId = categoryId;
      }

      const trendingProducts = await this.prisma.product.findMany({
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
          { viewCount: 'desc' },
          { rating: 'desc' },
        ],
      });

      return trendingProducts;
    } catch (error) {
      this.logger.error(`Failed to get trending products: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Hybrid recommendations combining multiple algorithms
   */
  private async getHybridRecommendations(
    userId: string,
    productId?: string,
    categoryId?: string,
    limit?: number,
    excludeIds?: string[],
    context?: any,
  ) {
    try {
      const collaborativeRecs = await this.getCollaborativeRecommendations(userId, Math.ceil((limit || 20) * 0.4), excludeIds);
      const contentBasedRecs = await this.getContentBasedRecommendations(productId, categoryId, Math.ceil((limit || 20) * 0.3), excludeIds);
      const popularRecs = await this.getPopularProducts(categoryId, Math.ceil((limit || 20) * 0.3), excludeIds);

      // Combine and deduplicate recommendations
      const allRecommendations = [...collaborativeRecs, ...contentBasedRecs, ...popularRecs];
      const uniqueRecommendations = allRecommendations.filter((product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
      );

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      this.logger.error(`Failed to get hybrid recommendations: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Find similar users based on behavior
   */
  private async findSimilarUsers(userId: string, userBehavior: any[]) {
    try {
      // Get users with similar behavior patterns
      const similarUsers = await this.prisma.userBehavior.groupBy({
        by: ['userId'],
        where: {
          userId: { not: userId },
          action: { in: userBehavior.map(b => b.action) },
        },
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 50,
      });

      return similarUsers.map(u => u.userId);
    } catch (error) {
      this.logger.error(`Failed to find similar users: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get products from similar users
   */
  private async getProductsFromSimilarUsers(similarUserIds: string[], currentUserId: string) {
    try {
      const products = await this.prisma.userBehavior.findMany({
        where: {
          userId: { in: similarUserIds },
          action: { in: ['purchase', 'like', 'add_to_cart'] },
          productId: { not: null },
        },
        select: {
          productId: true,
        },
        distinct: ['productId'],
      });

      return products.map(p => p.productId).filter(Boolean);
    } catch (error) {
      this.logger.error(`Failed to get products from similar users: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Track user behavior for recommendations
   */
  async trackUserBehavior(behavior: UserBehaviorDto) {
    try {
      await this.prisma.userBehavior.create({
        data: {
          userId: behavior.userId,
          sessionId: behavior.sessionId,
          action: behavior.action,
          productId: behavior.productId,
          categoryId: behavior.categoryId,
          brandId: behavior.brandId,
          shopId: behavior.shopId,
          query: behavior.query,
          metadata: behavior.metadata || {},
          value: behavior.value,
          timestamp: behavior.timestamp ? new Date(behavior.timestamp) : new Date(),
        },
      });

      this.logger.log(`Tracked user behavior: ${behavior.action} for user: ${behavior.userId}`);
    } catch (error) {
      this.logger.error(`Failed to track user behavior: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(query: TrendingSearchDto) {
    try {
      const { type = 'products', timeRange = '7d', limit = 10, location } = query;

      const timeRangeMap: Record<string, Date> = {
        '1d': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };

      const startDate = timeRangeMap[timeRange] || timeRangeMap['7d'];

      const trendingSearches = await this.prisma.searchAnalytics.groupBy({
        by: ['query'],
        where: {
          type,
          timestamp: { gte: startDate },
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
   * Get similar products
   */
  async getSimilarProducts(query: SimilarProductsDto) {
    try {
      const { productId, limit = 10, excludeIds = [] } = query;

      const baseProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: { category: true, brand: true, tags: true },
      });

      if (!baseProduct) {
        throw new Error('Product not found');
      }

      const similarProducts = await this.prisma.product.findMany({
        where: {
          id: { notIn: [productId, ...excludeIds] },
          status: 'active',
          OR: [
            { categoryId: baseProduct.categoryId },
            { brandId: baseProduct.brandId },
            { tags: { hasSome: baseProduct.tags } },
          ],
        },
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
        orderBy: { rating: 'desc' },
      });

      return similarProducts;
    } catch (error) {
      this.logger.error(`Failed to get similar products: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get frequently bought together products
   */
  async getFrequentlyBoughtTogether(productId: string, limit: number = 10) {
    try {
      // Find orders that contain the given product
      const ordersWithProduct = await this.prisma.orderItem.findMany({
        where: { productId },
        select: { orderId: true },
        distinct: ['orderId'],
      });

      const orderIds = ordersWithProduct.map(oi => oi.orderId);

      // Find other products in the same orders
      const frequentlyBoughtProducts = await this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          orderId: { in: orderIds },
          productId: { not: productId },
        },
        _count: {
          productId: true,
        },
        orderBy: {
          _count: {
            productId: 'desc',
          },
        },
        take: limit,
      });

      const productIds = frequentlyBoughtProducts.map(p => p.productId);

      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
          status: 'active',
        },
        include: {
          shop: true,
          category: true,
          brand: true,
          reviews: {
            where: { status: 'approved' },
            take: 3,
          },
        },
      });

      // Sort by frequency
      return products.sort((a, b) => {
        const aFreq = frequentlyBoughtProducts.find(p => p.productId === a.id)?._count.productId || 0;
        const bFreq = frequentlyBoughtProducts.find(p => p.productId === b.id)?._count.productId || 0;
        return bFreq - aFreq;
      });
    } catch (error) {
      this.logger.error(`Failed to get frequently bought together: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get personalized home page recommendations
   */
  async getHomeRecommendations(userId: string) {
    try {
      const [
        personalizedProducts,
        trendingProducts,
        popularProducts,
        newProducts,
        recommendedCategories,
      ] = await Promise.all([
        this.getRecommendations({ userId, algorithm: 'hybrid', limit: 10 }),
        this.getTrendingProducts(undefined, 10, []),
        this.getPopularProducts(undefined, 10, []),
        this.getNewProducts(10),
        this.getRecommendedCategories(userId),
      ]);

      return {
        personalized: personalizedProducts.recommendations,
        trending: trendingProducts,
        popular: popularProducts,
        new: newProducts,
        categories: recommendedCategories,
      };
    } catch (error) {
      this.logger.error(`Failed to get home recommendations: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Get new products
   */
  private async getNewProducts(limit: number) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      return await this.prisma.product.findMany({
        where: {
          status: 'active',
          createdAt: { gte: sevenDaysAgo },
        },
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
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to get new products: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get recommended categories for user
   */
  private async getRecommendedCategories(userId: string) {
    try {
      const userCategories = await this.prisma.userBehavior.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          categoryId: { not: null },
          action: { in: ['view', 'click', 'purchase', 'add_to_cart'] },
        },
        _count: {
          categoryId: true,
        },
        orderBy: {
          _count: {
            categoryId: 'desc',
          },
        },
        take: 5,
      });

      const categoryIds = userCategories.map(uc => uc.categoryId).filter(Boolean);

      return await this.prisma.category.findMany({
        where: {
          id: { in: categoryIds },
          status: 'active',
        },
        include: {
          _count: {
            select: {
              products: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get recommended categories: ${(error as Error).message}`);
      return [];
    }
  }
}