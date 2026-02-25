import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { 
  CreateOrderDto, 
  UpdateOrderDto, 
  CancelOrderDto, 
  RefundOrderDto, 
  ReturnOrderDto,
  TrackOrderDto,
  OrderQueryDto,
  OrderAnalyticsDto,
  BulkOrderUpdateDto,
  OrderExportDto,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  ShippingMethod
} from './dto/orders.dto';
import { PaymentsService } from '../payments/payments.service';
import { ShippingService } from '../shipping/shipping.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly shippingService: ShippingService,
    private readonly notificationsService: NotificationsService,
    private readonly searchService: SearchService,
  ) {}

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    this.logger.log(`Creating order for user: ${userId}`);

    // Validate products and calculate totals
    const orderItems = await this.validateOrderItems(createOrderDto.items);
    const subtotal = this.calculateSubtotal(orderItems);
    const shippingCost = await this.calculateShippingCost(createOrderDto.shippingMethod, createOrderDto.shippingAddress);
    const tax = this.calculateTax(subtotal + shippingCost);
    const discount = await this.calculateDiscount(createOrderDto.couponCode, subtotal);
    const total = subtotal + shippingCost + tax - discount;

    // Check inventory
    await this.checkInventory(orderItems);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: createOrderDto.paymentMethod,
        shippingMethod: createOrderDto.shippingMethod || ShippingMethod.STANDARD,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        shippingAddress: createOrderDto.shippingAddress,
        billingAddress: createOrderDto.billingAddress,
        notes: createOrderDto.notes,
        estimatedDelivery: createOrderDto.estimatedDelivery,
        giftMessage: createOrderDto.giftMessage,
        giftWrapping: createOrderDto.giftWrapping || false,
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount || 0,
            productSnapshot: item.productSnapshot,
          })),
        },
      },
      include: {
        items: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update inventory
    await this.updateInventory(orderItems, -1);

    // Create payment intent
    if (createOrderDto.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      await this.paymentsService.createPaymentIntent({
        orderId: order.id,
        amount: total,
        currency: 'USD',
        paymentMethod: createOrderDto.paymentMethod,
        customerId: userId,
      });
    }

    // Create shipping label
    await this.shippingService.createShipment({
      orderId: order.id,
      shippingAddress: createOrderDto.shippingAddress,
      shippingMethod: createOrderDto.shippingMethod || ShippingMethod.STANDARD,
      items: orderItems,
    });

    // Send notifications
    await this.notificationsService.sendOrderConfirmation(order);

    // Index for search
    await this.searchService.indexOrder(order);

    this.logger.log(`Order created successfully: ${order.id}`);
    return order;
  }

  async getOrders(query: OrderQueryDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where = this.buildOrderQuery(filters);

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          payment: true,
          shipment: true,
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        payment: true,
        shipment: true,
        reviews: true,
        refunds: true,
        returns: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateOrder(id: string, updateOrderDto: UpdateOrderDto) {
    this.logger.log(`Updating order: ${id}`);

    const order = await this.getOrderById(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        updatedAt: new Date(),
      },
      include: {
        items: true,
        user: true,
      },
    });

    // Send status update notification
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.notificationsService.sendOrderStatusUpdate(updatedOrder);
    }

    // Update search index
    await this.searchService.indexOrder(updatedOrder);

    this.logger.log(`Order updated successfully: ${id}`);
    return updatedOrder;
  }

  async cancelOrder(id: string, cancelOrderDto: CancelOrderDto) {
    this.logger.log(`Cancelling order: ${id}`);

    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        cancellationReason: cancelOrderDto.reason,
        cancellationDetails: cancelOrderDto.details,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Restore inventory
    await this.updateInventory(order.items, 1);

    // Process refund if requested
    if (cancelOrderDto.refundRequested) {
      await this.processRefund(id, {
        reason: cancelOrderDto.reason,
        amount: cancelOrderDto.refundAmount || order.total,
        refundMethod: 'ORIGINAL',
        details: cancelOrderDto.details,
      });
    }

    // Send notifications
    await this.notificationsService.sendOrderCancellation(updatedOrder);

    // Update search index
    await this.searchService.indexOrder(updatedOrder);

    this.logger.log(`Order cancelled successfully: ${id}`);
    return updatedOrder;
  }

  async refundOrder(id: string, refundOrderDto: RefundOrderDto) {
    this.logger.log(`Processing refund for order: ${id}`);

    const order = await this.getOrderById(id);

    if (order.paymentStatus !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Order payment must be completed to process refund');
    }

    const refund = await this.processRefund(id, refundOrderDto);

    // Update order payment status
    await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        updatedAt: new Date(),
      },
    });

    // Send notifications
    await this.notificationsService.sendRefundConfirmation(order, refund);

    this.logger.log(`Refund processed successfully for order: ${id}`);
    return refund;
  }

  async returnOrder(id: string, returnOrderDto: ReturnOrderDto) {
    this.logger.log(`Processing return for order: ${id}`);

    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order must be delivered to process return');
    }

    const returnRecord = await this.prisma.return.create({
      data: {
        orderId: id,
        reason: returnOrderDto.reason,
        condition: returnOrderDto.condition,
        photos: returnOrderDto.photos || [],
        notes: returnOrderDto.notes,
        refundRequested: returnOrderDto.refundRequested || false,
        exchangeRequested: returnOrderDto.exchangeRequested || false,
        status: 'PENDING',
        items: {
          create: returnOrderDto.items.map(itemId => ({
            orderItemId: itemId,
          })),
        },
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.RETURNED,
        updatedAt: new Date(),
      },
    });

    // Send notifications
    await this.notificationsService.sendReturnConfirmation(order, returnRecord);

    this.logger.log(`Return processed successfully for order: ${id}`);
    return returnRecord;
  }

  async trackOrder(id: string) {
    const order = await this.getOrderById(id);

    if (!order.shipment) {
      throw new NotFoundException('No shipment found for this order');
    }

    const tracking = await this.shippingService.trackShipment(order.shipment.trackingNumber);

    return {
      order,
      tracking,
    };
  }

  async getOrderAnalytics(query: OrderAnalyticsDto) {
    const { startDate, endDate, groupBy = 'day', sellerId, shopId } = query;

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(sellerId && { items: { some: { product: { sellerId } } } }),
      ...(shopId && { items: { some: { product: { shopId } } } } }),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const analytics = this.calculateOrderAnalytics(orders, groupBy);

    return analytics;
  }

  async bulkUpdateOrders(bulkUpdateDto: BulkOrderUpdateDto) {
    this.logger.log(`Bulk updating ${bulkUpdateDto.orderIds.length} orders`);

    const results = await Promise.allSettled(
      bulkUpdateDto.orderIds.map(orderId =>
        this.updateOrder(orderId, {
          status: bulkUpdateDto.status,
          notes: bulkUpdateDto.notes,
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    this.logger.log(`Bulk update completed: ${successful} successful, ${failed} failed`);

    return {
      total: bulkUpdateDto.orderIds.length,
      successful,
      failed,
    };
  }

  async exportOrders(exportDto: OrderExportDto) {
    const { startDate, endDate, status, format = 'csv', includeItems = true, includeCustomerInfo = true } = exportDto;

    const where = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      ...(status && { status }),
    };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        ...(includeItems && { items: true }),
        ...(includeCustomerInfo && { user: true }),
      },
    });

    // Export logic would go here based on format
    // For now, return the data
    return {
      data: orders,
      format,
      count: orders.length,
    };
  }

  private async validateOrderItems(items: any[]) {
    const validatedItems = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      if (!product.isActive) {
        throw new BadRequestException(`Product ${product.name} is not active`);
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        throw new NotFoundException(`Product variant with ID ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product ${product.name}`);
      }

      validatedItems.push({
        ...item,
        price: variant.price,
        productSnapshot: {
          id: product.id,
          name: product.name,
          images: product.images,
          sku: variant.sku,
        },
      });
    }

    return validatedItems;
  }

  private calculateSubtotal(items: any[]) {
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  private async calculateShippingCost(shippingMethod?: ShippingMethod, address?: any) {
    // This would integrate with shipping service to calculate actual cost
    const baseCosts = {
      [ShippingMethod.STANDARD]: 5.99,
      [ShippingMethod.EXPRESS]: 12.99,
      [ShippingMethod.OVERNIGHT]: 24.99,
      [ShippingMethod.SAME_DAY]: 34.99,
      [ShippingMethod.PICKUP]: 0,
    };

    return baseCosts[shippingMethod || ShippingMethod.STANDARD] || 5.99;
  }

  private calculateTax(amount: number) {
    // Tax calculation logic (e.g., 10% tax)
    return amount * 0.1;
  }

  private async calculateDiscount(couponCode?: string, subtotal?: number) {
    if (!couponCode || !subtotal) return 0;

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
      throw new BadRequestException(`Minimum order amount of ${coupon.minimumAmount} required for this coupon`);
    }

    const discount = coupon.type === 'PERCENTAGE' 
      ? subtotal * (coupon.value / 100)
      : coupon.value;

    return Math.min(discount, coupon.maximumDiscount || discount);
  }

  private async checkInventory(items: any[]) {
    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });

      if (!variant || variant.stock < item.quantity) {
        throw new BadRequestException(`Insufficient inventory for item ${item.productId}`);
      }
    }
  }

  private async updateInventory(items: any[], adjustment: number) {
    for (const item of items) {
      await this.prisma.productVariant.update({
        where: { id: item.variantId },
        data: {
          stock: {
            increment: adjustment * item.quantity,
          },
        },
      });
    }
  }

  private async processRefund(orderId: string, refundDto: RefundOrderDto) {
    return await this.prisma.refund.create({
      data: {
        orderId,
        amount: refundDto.amount,
        reason: refundDto.reason,
        refundMethod: refundDto.refundMethod || 'ORIGINAL',
        details: refundDto.details,
        status: 'PENDING',
        items: refundDto.items ? {
          create: refundDto.items.map(item => ({
            orderItemId: item,
          })),
        } : undefined,
      },
    });
  }

  private buildOrderQuery(filters: any) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.shippingMethod) {
      where.shippingMethod = filters.shippingMethod;
    }

    if (filters.customerId) {
      where.userId = filters.customerId;
    }

    if (filters.sellerId) {
      where.items = {
        some: {
          product: {
            sellerId: filters.sellerId,
          },
        },
      };
    }

    if (filters.shopId) {
      where.items = {
        some: {
          product: {
            shopId: filters.shopId,
          },
        },
      };
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

    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { items: { some: { product: { name: { contains: filters.search, mode: 'insensitive' } } } } },
      ];
    }

    return where;
  }

  private calculateOrderAnalytics(orders: any[], groupBy: string) {
    // Group orders by specified time period
    const grouped = orders.reduce((acc, order) => {
      const key = this.getGroupingKey(order.createdAt, groupBy);
      if (!acc[key]) {
        acc[key] = {
          period: key,
          orders: [],
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
        };
      }
      acc[key].orders.push(order);
      acc[key].totalRevenue += order.total;
      acc[key].totalOrders += 1;
      return acc;
    }, {});

    // Calculate averages
    Object.values(grouped).forEach((group: any) => {
      group.averageOrderValue = group.totalOrders > 0 ? group.totalRevenue / group.totalOrders : 0;
    });

    return Object.values(grouped);
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