import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateReviewDto, 
  UpdateReviewDto, 
  ReviewResponseDto,
  ReviewVoteDto,
  ReviewQueryDto,
  ReviewAnalyticsDto,
  BulkReviewUpdateDto,
  ReviewExportDto,
  ReviewModerationDto,
  ReviewSummaryDto,
  ReviewStatus,
  ReviewType
} from './dto/reviews.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly searchService: SearchService,
  ) {}

  async createReview(userId: string, createReviewDto: CreateReviewDto) {
    this.logger.log(`Creating review for user: ${userId}`);

    // Check if user already reviewed this target
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        type: createReviewDto.type,
        targetId: createReviewDto.targetId,
        orderId: createReviewDto.orderId,
      },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this item');
    }

    // Verify order exists and belongs to user
    const order = await this.prisma.order.findFirst({
      where: {
        id: createReviewDto.orderId,
        userId,
        status: 'DELIVERED',
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Invalid order or order not delivered');
    }

    // Verify target exists in order
    let targetExists = false;
    if (createReviewDto.type === ReviewType.PRODUCT) {
      targetExists = order.items.some(item => item.productId === createReviewDto.targetId);
    } else if (createReviewDto.type === ReviewType.SELLER) {
      const product = order.items.find(item => item.productId);
      if (product) {
        const productDetails = await this.prisma.product.findUnique({
          where: { id: product.productId },
          select: { sellerId: true },
        });
        targetExists = productDetails?.sellerId === createReviewDto.targetId;
      }
    } else if (createReviewDto.type === ReviewType.SHOP) {
      const product = order.items.find(item => item.productId);
      if (product) {
        const productDetails = await this.prisma.product.findUnique({
          where: { id: product.productId },
          select: { shopId: true },
        });
        targetExists = productDetails?.shopId === createReviewDto.targetId;
      }
    }

    if (!targetExists) {
      throw new BadRequestException('Target not found in this order');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        userId,
        type: createReviewDto.type,
        targetId: createReviewDto.targetId,
        orderId: createReviewDto.orderId,
        rating: createReviewDto.rating,
        title: createReviewDto.title,
        content: createReviewDto.content,
        ratings: createReviewDto.ratings || [],
        media: createReviewDto.media || [],
        isVerifiedPurchase: true,
        isRecommended: createReviewDto.isRecommended,
        tags: createReviewDto.tags || [],
        pros: createReviewDto.pros || [],
        cons: createReviewDto.cons || [],
        wouldBuyAgain: createReviewDto.wouldBuyAgain,
        visibility: createReviewDto.visibility || 'PUBLIC',
        status: ReviewStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update target rating
    await this.updateTargetRating(createReviewDto.type, createReviewDto.targetId);

    // Send notifications
    await this.notificationsService.sendNewReviewNotification(review);

    // Index for search
    await this.searchService.indexReview(review);

    this.logger.log(`Review created successfully: ${review.id}`);
    return review;
  }

  async getReviews(query: ReviewQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where = this.buildReviewQuery(filters);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          responses: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          votes: {
            select: {
              id: true,
              type: true,
              userId: true,
            },
          },
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        order: {
          select: {
            id: true,
            createdAt: true,
            items: {
              select: {
                productId: true,
                productName: true,
                quantity: true,
                price: true,
              },
            },
          },
        },
        responses: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async updateReview(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    this.logger.log(`Updating review: ${id}`);

    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found or you don't have permission to update it`);
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        ...updateReviewDto,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update target rating if rating changed
    if (updateReviewDto.rating && updateReviewDto.rating !== review.rating) {
      await this.updateTargetRating(review.type, review.targetId);
    }

    // Update search index
    await this.searchService.indexReview(updatedReview);

    this.logger.log(`Review updated successfully: ${id}`);
    return updatedReview;
  }

  async deleteReview(id: string, userId: string) {
    this.logger.log(`Deleting review: ${id}`);

    const review = await this.prisma.review.findFirst({
      where: { id, userId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found or you don't have permission to delete it`);
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update target rating
    await this.updateTargetRating(review.type, review.targetId);

    // Remove from search index
    await this.searchService.removeReviewFromIndex(id);

    this.logger.log(`Review deleted successfully: ${id}`);
    return { message: 'Review deleted successfully' };
  }

  async respondToReview(id: string, userId: string, responseDto: ReviewResponseDto) {
    this.logger.log(`Adding response to review: ${id}`);

    const review = await this.getReviewById(id);

    const response = await this.prisma.reviewResponse.create({
      data: {
        reviewId: id,
        userId,
        content: responseDto.content,
        media: responseDto.media || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to review author
    await this.notificationsService.sendReviewResponseNotification(review, response);

    this.logger.log(`Response added to review: ${id}`);
    return response;
  }

  async voteOnReview(id: string, userId: string, voteDto: ReviewVoteDto) {
    this.logger.log(`Voting on review: ${id}`);

    const review = await this.getReviewById(id);

    // Check if user already voted
    const existingVote = await this.prisma.reviewVote.findFirst({
      where: {
        reviewId: id,
        userId,
      },
    });

    if (existingVote) {
      // Update existing vote
      const updatedVote = await this.prisma.reviewVote.update({
        where: { id: existingVote.id },
        data: {
          type: voteDto.type,
          reason: voteDto.reason,
        },
      });
      return updatedVote;
    } else {
      // Create new vote
      const vote = await this.prisma.reviewVote.create({
        data: {
          reviewId: id,
          userId,
          type: voteDto.type,
          reason: voteDto.reason,
        },
      });
      return vote;
    }
  }

  async getReviewAnalytics(query: ReviewAnalyticsDto) {
    const { targetId, type, startDate, endDate, groupBy = 'day' } = query;

    const where = {
      targetId,
      type,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        votes: true,
      },
    });

    const analytics = this.calculateReviewAnalytics(reviews, groupBy);

    return analytics;
  }

  async bulkUpdateReviews(bulkUpdateDto: BulkReviewUpdateDto) {
    this.logger.log(`Bulk updating ${bulkUpdateDto.reviewIds.length} reviews`);

    const results = await Promise.allSettled(
      bulkUpdateDto.reviewIds.map(reviewId =>
        this.prisma.review.update({
          where: { id: reviewId },
          data: {
            status: bulkUpdateDto.status,
            moderationNotes: bulkUpdateDto.notes,
            updatedAt: new Date(),
          },
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    this.logger.log(`Bulk update completed: ${successful} successful, ${failed} failed`);

    return {
      total: bulkUpdateDto.reviewIds.length,
      successful,
      failed,
    };
  }

  async moderateReview(moderationDto: ReviewModerationDto) {
    this.logger.log(`Moderating review: ${moderationDto.reviewId}`);

    const review = await this.getReviewById(moderationDto.reviewId);

    let updatedReview;
    switch (moderationDto.action) {
      case 'APPROVE':
        updatedReview = await this.prisma.review.update({
          where: { id: moderationDto.reviewId },
          data: {
            status: ReviewStatus.APPROVED,
            moderationNotes: moderationDto.notes,
            moderatedAt: new Date(),
          },
        });
        break;
      case 'REJECT':
        updatedReview = await this.prisma.review.update({
          where: { id: moderationDto.reviewId },
          data: {
            status: ReviewStatus.REJECTED,
            moderationNotes: moderationDto.notes,
            moderatedAt: new Date(),
          },
        });
        break;
      case 'FLAG':
        updatedReview = await this.prisma.review.update({
          where: { id: moderationDto.reviewId },
          data: {
            status: ReviewStatus.FLAGGED,
            moderationNotes: moderationDto.notes,
            moderatedAt: new Date(),
          },
        });
        break;
      case 'DELETE':
        await this.prisma.review.delete({
          where: { id: moderationDto.reviewId },
        });
        return { message: 'Review deleted successfully' };
      default:
        throw new BadRequestException('Invalid moderation action');
    }

    // Send notification if requested
    if (moderationDto.notifyReviewer) {
      await this.notificationsService.sendReviewModerationNotification(
        review,
        moderationDto.action,
        moderationDto.customMessage
      );
    }

    this.logger.log(`Review moderated successfully: ${moderationDto.reviewId}`);
    return updatedReview;
  }

  async getReviewSummary(summaryDto: ReviewSummaryDto) {
    const { targetId, type, includeRatingBreakdown = true, includeSentiment = true, includeKeywords = true, includeTrends = true } = summaryDto;

    const reviews = await this.prisma.review.findMany({
      where: {
        targetId,
        type,
        status: ReviewStatus.APPROVED,
      },
      include: {
        votes: true,
      },
    });

    const summary: any = {
      totalReviews: reviews.length,
      averageRating: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0,
      verifiedPurchaseCount: reviews.filter(r => r.isVerifiedPurchase).length,
      recommendedCount: reviews.filter(r => r.isRecommended).length,
      wouldBuyAgainCount: reviews.filter(r => r.wouldBuyAgain).length,
    };

    if (includeRatingBreakdown) {
      summary.ratingBreakdown = this.calculateRatingBreakdown(reviews);
    }

    if (includeSentiment) {
      summary.sentimentAnalysis = this.analyzeSentiment(reviews);
    }

    if (includeKeywords) {
      summary.keywordAnalysis = this.analyzeKeywords(reviews);
    }

    if (includeTrends) {
      summary.trends = this.analyzeTrends(reviews);
    }

    return summary;
  }

  async exportReviews(exportDto: ReviewExportDto) {
    const { targetId, type, status, startDate, endDate, format = 'csv', includeMedia = false, includeResponses = true, includeVotes = true } = exportDto;

    const where = {
      targetId,
      type,
      status,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const reviews = await this.prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        ...(includeResponses && { responses: true }),
        ...(includeVotes && { votes: true }),
        ...(includeMedia && { media: true }),
      },
    });

    // Export logic would go here based on format
    // For now, return the data
    return {
      data: reviews,
      format,
      count: reviews.length,
    };
  }

  private async updateTargetRating(type: ReviewType, targetId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        type,
        targetId,
        status: ReviewStatus.APPROVED,
      },
      select: { rating: true },
    });

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    // Update target based on type
    if (type === ReviewType.PRODUCT) {
      await this.prisma.product.update({
        where: { id: targetId },
        data: { 
          averageRating,
          reviewCount: reviews.length,
        },
      });
    } else if (type === ReviewType.SELLER) {
      await this.prisma.seller.update({
        where: { id: targetId },
        data: { 
          averageRating,
          reviewCount: reviews.length,
        },
      });
    } else if (type === ReviewType.SHOP) {
      await this.prisma.shop.update({
        where: { id: targetId },
        data: { 
          averageRating,
          reviewCount: reviews.length,
        },
      });
    }
  }

  private buildReviewQuery(filters: any) {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.targetId) {
      where.targetId = filters.targetId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.minRating || filters.maxRating) {
      where.rating = {};
      if (filters.minRating) {
        where.rating.gte = filters.minRating;
      }
      if (filters.maxRating) {
        where.rating.lte = filters.maxRating;
      }
    }

    if (filters.hasPhotos) {
      where.media = {
        some: {
          type: 'IMAGE',
        },
      };
    }

    if (filters.hasVideos) {
      where.media = {
        some: {
          type: 'VIDEO',
        },
      };
    }

    if (filters.isVerifiedPurchase !== undefined) {
      where.isVerifiedPurchase = filters.isVerifiedPurchase;
    }

    if (filters.isRecommended !== undefined) {
      where.isRecommended = filters.isRecommended;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return where;
  }

  private calculateReviewAnalytics(reviews: any[], groupBy: string) {
    // Group reviews by specified time period
    const grouped = reviews.reduce((acc, review) => {
      const key = this.getGroupingKey(review.createdAt, groupBy);
      if (!acc[key]) {
        acc[key] = {
          period: key,
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          helpfulVotes: 0,
          notHelpfulVotes: 0,
        };
      }
      acc[key].reviews.push(review);
      acc[key].totalReviews += 1;
      acc[key].averageRating += review.rating;
      
      review.votes.forEach((vote: any) => {
        if (vote.type === 'HELPFUL') {
          acc[key].helpfulVotes += 1;
        } else if (vote.type === 'NOT_HELPFUL') {
          acc[key].notHelpfulVotes += 1;
        }
      });
      
      return acc;
    }, {});

    // Calculate averages
    Object.values(grouped).forEach((group: any) => {
      group.averageRating = group.totalReviews > 0 ? group.averageRating / group.totalReviews : 0;
    });

    return Object.values(grouped);
  }

  private calculateRatingBreakdown(reviews: any[]) {
    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    reviews.forEach(review => {
      breakdown[review.rating as keyof typeof breakdown] += 1;
    });

    return breakdown;
  }

  private analyzeSentiment(reviews: any[]) {
    // Simple sentiment analysis - in production, use NLP service
    const positive = reviews.filter(r => r.rating >= 4).length;
    const neutral = reviews.filter(r => r.rating === 3).length;
    const negative = reviews.filter(r => r.rating <= 2).length;

    return {
      positive,
      neutral,
      negative,
      score: reviews.length > 0 ? (positive - negative) / reviews.length : 0,
    };
  }

  private analyzeKeywords(reviews: any[]) {
    // Simple keyword extraction - in production, use NLP service
    const allWords = reviews.flatMap(review => 
      review.content.toLowerCase().split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['the', 'and', 'for', 'are', 'with', 'this', 'that', 'from', 'have', 'they', 'been'].includes(word))
    );

    const wordCount = allWords.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  }

  private analyzeTrends(reviews: any[]) {
    // Analyze rating trends over time
    const sortedReviews = reviews.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const trends = {
      improving: false,
      declining: false,
      stable: false,
      recentAverage: 0,
      overallAverage: 0,
    };

    if (sortedReviews.length >= 10) {
      const recent = sortedReviews.slice(-10);
      const recentAverage = recent.reduce((sum, r) => sum + r.rating, 0) / recent.length;
      const overallAverage = sortedReviews.reduce((sum, r) => sum + r.rating, 0) / sortedReviews.length;

      trends.recentAverage = recentAverage;
      trends.overallAverage = overallAverage;

      if (recentAverage > overallAverage + 0.2) {
        trends.improving = true;
      } else if (recentAverage < overallAverage - 0.2) {
        trends.declining = true;
      } else {
        trends.stable = true;
      }
    }

    return trends;
  }

  private getGroupingKey(date: Date, groupBy: string): string {
    const d = new Date(date);
    
    switch (groupBy) {
      case 'day':
        return d.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(d.setDate(d.getDate() - d.getDay()));
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return d.getFullYear().toString();
      default:
        return d.toISOString().split('T')[0];
    }
  }
}