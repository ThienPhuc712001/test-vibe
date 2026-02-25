import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '../common/common.module';

export const createTestingModule = async (imports: any[] = [], providers: any[] = []) => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: ['.env.test', '.env'],
      }),
      CommonModule,
      ...imports,
    ],
    providers: [
      ...providers,
    ],
  })
  .overrideProvider(PrismaService)
  .useValue({
    // Mock PrismaService methods
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })
  .compile();

  return module;
};

export const createMockUser = (overrides: any = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockProduct = (overrides: any = {}) => ({
  id: 'test-product-id',
  name: 'Test Product',
  description: 'Test Description',
  price: 99.99,
  isActive: true,
  stock: 100,
  sellerId: 'test-seller-id',
  shopId: 'test-shop-id',
  categoryId: 'test-category-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockOrder = (overrides: any = {}) => ({
  id: 'test-order-id',
  userId: 'test-user-id',
  status: 'PENDING',
  paymentStatus: 'PENDING',
  total: 199.98,
  subtotal: 199.98,
  tax: 0,
  shippingCost: 0,
  discount: 0,
  shippingAddress: {
    recipientName: 'Test User',
    phoneNumber: '+1234567890',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockReview = (overrides: any = {}) => ({
  id: 'test-review-id',
  userId: 'test-user-id',
  type: 'PRODUCT',
  targetId: 'test-product-id',
  orderId: 'test-order-id',
  rating: 5,
  title: 'Great Product',
  content: 'This is a great product!',
  isVerifiedPurchase: true,
  isRecommended: true,
  status: 'APPROVED',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockSeller = (overrides: any = {}) => ({
  id: 'test-seller-id',
  userId: 'test-user-id',
  businessName: 'Test Business',
  description: 'Test Description',
  isActive: true,
  isVerified: true,
  averageRating: 4.5,
  reviewCount: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockShop = (overrides: any = {}) => ({
  id: 'test-shop-id',
  sellerId: 'test-seller-id',
  name: 'Test Shop',
  description: 'Test Shop Description',
  isActive: true,
  averageRating: 4.5,
  reviewCount: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCategory = (overrides: any = {}) => ({
  id: 'test-category-id',
  name: 'Test Category',
  description: 'Test Category Description',
  isActive: true,
  parentId: null,
  level: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBrand = (overrides: any = {}) => ({
  id: 'test-brand-id',
  name: 'Test Brand',
  description: 'Test Brand Description',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPayment = (overrides: any = {}) => ({
  id: 'test-payment-id',
  orderId: 'test-order-id',
  amount: 199.98,
  currency: 'USD',
  status: 'COMPLETED',
  method: 'CREDIT_CARD',
  transactionId: 'test-transaction-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockShipment = (overrides: any = {}) => ({
  id: 'test-shipment-id',
  orderId: 'test-order-id',
  trackingNumber: 'TEST123456789',
  carrier: 'Test Carrier',
  status: 'SHIPPED',
  shippingAddress: {
    recipientName: 'Test User',
    phoneNumber: '+1234567890',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockNotification = (overrides: any = {}) => ({
  id: 'test-notification-id',
  userId: 'test-user-id',
  type: 'ORDER_CONFIRMATION',
  title: 'Order Confirmation',
  message: 'Your order has been confirmed',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockLiveStream = (overrides: any = {}) => ({
  id: 'test-stream-id',
  sellerId: 'test-seller-id',
  title: 'Test Live Stream',
  description: 'Test Stream Description',
  status: 'LIVE',
  startTime: new Date(),
  endTime: null,
  viewerCount: 100,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockVoucher = (overrides: any = {}) => ({
  id: 'test-voucher-id',
  code: 'TESTVOUCHER',
  type: 'PERCENTAGE',
  value: 10,
  minimumAmount: 50,
  maximumDiscount: 20,
  isActive: true,
  usageLimit: 1000,
  usedCount: 100,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockFlashSale = (overrides: any = {}) => ({
  id: 'test-flash-sale-id',
  name: 'Test Flash Sale',
  description: 'Test Flash Sale Description',
  startTime: new Date(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockWishlist = (overrides: any = {}) => ({
  id: 'test-wishlist-id',
  userId: 'test-user-id',
  productId: 'test-product-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockCartItem = (overrides: any = {}) => ({
  id: 'test-cart-item-id',
  userId: 'test-user-id',
  productId: 'test-product-id',
  variantId: 'test-variant-id',
  quantity: 2,
  price: 99.99,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockChatMessage = (overrides: any = {}) => ({
  id: 'test-message-id',
  senderId: 'test-user-id',
  receiverId: 'test-seller-id',
  content: 'Test message',
  type: 'TEXT',
  isRead: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAnalyticsData = (overrides: any = {}) => ({
  date: new Date(),
  totalSales: 1000,
  totalRevenue: 10000,
  totalOrders: 50,
  averageOrderValue: 200,
  conversionRate: 0.05,
  uniqueVisitors: 1000,
  pageViews: 5000,
  bounceRate: 0.3,
  ...overrides,
});

// Test utilities
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const mockDate = (date: Date) => {
  const mockDate = date;
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

export const mockFileUpload = (filename: string, mimetype: string, buffer: Buffer) => ({
  fieldname: 'file',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  size: buffer.length,
  buffer,
  filename: `${Date.now()}-${filename}`,
});

export const createMockExecutionContext = (user: any = null) => ({
  switchToHttp: () => ({
    getRequest: () => ({
      user,
      headers: {},
      query: {},
      params: {},
      body: {},
    }),
    getResponse: () => ({
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }),
  }),
  switchToWs: () => ({
    getClient: () => ({
      id: 'test-client-id',
      data: {},
    }),
  }),
  switchToRpc: () => ({
    getData: () => ({}),
  }),
  getType: () => 'http',
  getHandler: () => ({}),
  getClass: () => ({}),
  getArgs: () => [],
});

export const createMockCallHandler = () => ({
  handle: jest.fn(),
});

export const createMockReflector = () => ({
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndOverride: jest.fn(),
  getAllAndMerge: jest.fn(),
});

// Database test utilities
export const setupTestDatabase = async () => {
  // Setup test database connection
  // This would typically involve creating a test database schema
  // and running migrations
};

export const cleanupTestDatabase = async () => {
  // Clean up test database
  // This would typically involve dropping all tables or data
};

// JWT test utilities
export const createMockJwtPayload = (overrides: any = {}) => ({
  sub: 'test-user-id',
  email: 'test@example.com',
  role: 'USER',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
  ...overrides,
});

export const createMockJwtToken = (payload: any = createMockJwtPayload()) => {
  return `Bearer ${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
};

// Email test utilities
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendTemplateEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendBulkEmail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
});

// Payment test utilities
export const createMockPaymentService = () => ({
  createPayment: jest.fn().mockResolvedValue({ id: 'test-payment-id', status: 'SUCCESS' }),
  capturePayment: jest.fn().mockResolvedValue({ id: 'test-payment-id', status: 'SUCCESS' }),
  refundPayment: jest.fn().mockResolvedValue({ id: 'test-refund-id', status: 'SUCCESS' }),
});

// Shipping test utilities
export const createMockShippingService = () => ({
  createShipment: jest.fn().mockResolvedValue({ id: 'test-shipment-id', trackingNumber: 'TEST123' }),
  trackShipment: jest.fn().mockResolvedValue({ status: 'DELIVERED', trackingEvents: [] }),
  calculateShippingCost: jest.fn().mockResolvedValue({ cost: 10.99 }),
});

// Notification test utilities
export const createMockNotificationService = () => ({
  sendPushNotification: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendEmailNotification: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  sendSMSNotification: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
});

// Search test utilities
export const createMockSearchService = () => ({
  indexDocument: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
  searchDocuments: jest.fn().mockResolvedValue({ hits: [], total: 0 }),
  deleteDocument: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
});

// File storage test utilities
export const createMockFileStorageService = () => ({
  uploadFile: jest.fn().mockResolvedValue({ url: 'https://example.com/test.jpg' }),
  deleteFile: jest.fn().mockResolvedValue({ success: true }),
  getFileUrl: jest.fn().mockReturnValue('https://example.com/test.jpg'),
});

// Cache test utilities
export const createMockCacheService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  flush: jest.fn(),
  keys: jest.fn().mockReturnValue([]),
});

// Rate limiting test utilities
export const createMockThrottlerStorage = () => ({
  increment: jest.fn().mockResolvedValue({ totalHits: 1, timeToExpire: 60000 }),
  reset: jest.fn().mockResolvedValue(true),
});

// WebSocket test utilities
export const createMockWebSocketServer = () => ({
  emit: jest.fn(),
  to: jest.fn().mockReturnThis(),
  broadcast: jest.fn().mockReturnThis(),
  clients: new Map(),
});

export const createMockWebSocketClient = () => ({
  id: 'test-client-id',
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  disconnect: jest.fn(),
});

// Validation test utilities
export const createMockValidationPipe = () => ({
  transform: jest.fn(),
  validate: jest.fn(),
});

// Logging test utilities
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

// Error handling test utilities
export const createMockExceptionFilter = () => ({
  catch: jest.fn(),
});

// Interceptor test utilities
export const createMockInterceptor = () => ({
  intercept: jest.fn(),
});

// Guard test utilities
export const createMockGuard = () => ({
  canActivate: jest.fn(),
});

// Decorator test utilities
export const createMockDecorator = () => jest.fn();

// Pipe test utilities
export const createMockPipe = () => ({
  transform: jest.fn(),
});

// Parameter decorator test utilities
export const createMockParamDecorator = () => jest.fn();

// Controller test utilities
export const createMockController = () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
});

// Service test utilities
export const createMockService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

// Repository test utilities
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
});

// Query builder test utilities
export const createMockQueryBuilder = () => ({
  where: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getOne: jest.fn(),
  getCount: jest.fn(),
});

// Entity manager test utilities
export const createMockEntityManager = () => ({
  createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
});

// Connection test utilities
export const createMockConnection = () => ({
  connect: jest.fn(),
  close: jest.fn(),
  query: jest.fn(),
  getRepository: jest.fn().mockReturnValue(createMockRepository()),
  createQueryBuilder: jest.fn().mockReturnValue(createMockQueryBuilder()),
});

// Configuration test utilities
export const createMockConfigService = () => ({
  get: jest.fn(),
  getOrThrow: jest.fn(),
  set: jest.fn(),
  has: jest.fn(),
});

// Environment test utilities
export const setTestEnvironment = (env: Record<string, string>) => {
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
};

export const clearTestEnvironment = () => {
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('TEST_')) {
      delete process.env[key];
    }
  });
};