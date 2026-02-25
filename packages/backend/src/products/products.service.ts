import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, userId: string, files: Express.Multer.File[]) {
    // Get user's shop
    const shop = await this.prisma.shop.findFirst({
      where: { userId },
    });

    if (!shop) {
      throw new ForbiddenException('User does not have a shop');
    }

    // Process images
    const images = files.map(file => ({
      url: `/uploads/products/${file.filename}`,
      alt: createProductDto.name,
      isPrimary: false,
    }));

    if (images.length > 0) {
      images[0].isPrimary = true;
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        shopId: shop.id,
        images: {
          create: images,
        },
        variants: {
          create: createProductDto.variants || [],
        },
      },
      include: {
        images: true,
        variants: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return product;
  }

  async findAll(query: any) {
    const {
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: true,
          shop: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: true,
          _count: {
            select: {
              reviews: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findFeatured() {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        isFeatured: true,
      },
      take: 20,
      include: {
        images: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        _count: {
          select: {
            reviews: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findTrending() {
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: 20,
      include: {
        images: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        _count: {
          select: {
            reviews: true,
            likes: true,
            orderItems: true,
          },
        },
      },
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
    });
  }

  async search(query: string, filters: any) {
    const where: any = {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    };

    if (filters.category) {
      where.categoryId = filters.category;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    return this.prisma.product.findMany({
      where,
      take: 50,
      include: {
        images: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: true,
        _count: {
          select: {
            reviews: true,
            likes: true,
          },
        },
      },
      orderBy: {
        _relevance: {
          fields: ['name', 'description'],
          search: query,
          sort: 'desc',
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
            rating: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            reviews: true,
            likes: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByShop(shopId: string, query: any) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          shopId,
          status: 'ACTIVE',
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: true,
          category: true,
          _count: {
            select: {
              reviews: true,
              likes: true,
              orderItems: true,
            },
          },
        },
      }),
      this.prisma.product.count({
        where: {
          shopId,
          status: 'ACTIVE',
        },
      }),
    ]);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByCategory(categoryId: string, query: any) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
    } = query;

    const skip = (page - 1) * limit;
    const where: any = {
      categoryId,
      status: 'ACTIVE',
    };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          images: true,
          shop: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              likes: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    // Check if user owns the product
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        shop: {
          userId,
        },
      },
    });

    if (!product) {
      throw new ForbiddenException('You can only update your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        images: true,
        variants: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    // Check if user owns the product
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        shop: {
          userId,
        },
      },
    });

    if (!product) {
      throw new ForbiddenException('You can only delete your own products');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  async createReview(productId: string, reviewData: any, userId: string) {
    // Check if user has purchased the product
    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    });

    if (!hasPurchased) {
      throw new ForbiddenException('You can only review products you have purchased');
    }

    // Check if user has already reviewed
    const existingReview = await this.prisma.review.findFirst({
      where: {
        productId,
        userId,
      },
    });

    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this product');
    }

    return this.prisma.review.create({
      data: {
        ...reviewData,
        productId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getProductReviews(productId: string, query: any) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);

    return {
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async likeProduct(productId: string, userId: string) {
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (existingLike) {
      throw new ForbiddenException('You have already liked this product');
    }

    return this.prisma.productLike.create({
      data: {
        productId,
        userId,
      },
    });
  }

  async unlikeProduct(productId: string, userId: string) {
    const existingLike = await this.prisma.productLike.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });

    if (!existingLike) {
      throw new ForbiddenException('You have not liked this product');
    }

    return this.prisma.productLike.delete({
      where: {
        productId_userId: {
          productId,
          userId,
        },
      },
    });
  }

  async incrementView(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }
}