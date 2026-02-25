# Multi-Vendor Marketplace API Endpoints

## Authentication Module

### POST /auth/register
Register a new user
- **Request Body**: RegisterDto
  ```typescript
  {
    email?: string;
    phone?: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: UserRole;
  }
  ```
- **Response**: UserResponseDto
  ```typescript
  {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }
  ```

### POST /auth/login
Login user
- **Request Body**: LoginDto
  ```typescript
  {
    email?: string;
    phone?: string;
    password: string;
  }
  ```
- **Response**: UserResponseDto

### POST /auth/social
Social login (Google, Facebook, Apple)
- **Request Body**: SocialLoginDto
  ```typescript
  {
    provider: 'google' | 'facebook' | 'apple';
    token: string;
  }
  ```
- **Response**: UserResponseDto

### POST /auth/refresh
Refresh access token
- **Request Body**: RefreshTokenDto
  ```typescript
  {
    refreshToken: string;
  }
  ```
- **Response**: TokenResponseDto
  ```typescript
  {
    accessToken: string;
    refreshToken: string;
  }
  ```

### POST /auth/logout
Logout user
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

### POST /auth/forgot-password
Request password reset
- **Request Body**: ForgotPasswordDto
  ```typescript
  {
    email?: string;
    phone?: string;
  }
  ```
- **Response**: SuccessResponse

### POST /auth/reset-password
Reset password
- **Request Body**: ResetPasswordDto
  ```typescript
  {
    token: string;
    newPassword: string;
  }
  ```
- **Response**: SuccessResponse

### POST /auth/verify-email
Verify email
- **Request Body**: VerifyEmailDto
  ```typescript
  {
    token: string;
  }
  ```
- **Response**: SuccessResponse

### POST /auth/verify-phone
Verify phone with OTP
- **Request Body**: VerifyPhoneDto
  ```typescript
  {
    phone: string;
    otp: string;
  }
  ```
- **Response**: SuccessResponse

### POST /auth/send-otp
Send OTP to phone
- **Request Body**: SendOtpDto
  ```typescript
  {
    phone: string;
  }
  ```
- **Response**: SuccessResponse

## Users Module

### GET /users/profile
Get current user profile
- **Headers**: Authorization: Bearer {token}
- **Response**: UserProfileDto
  ```typescript
  {
    id: string;
    email?: string;
    phone?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: string;
    role: UserRole;
    status: UserStatus;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
  ```

### PUT /users/profile
Update user profile
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateProfileDto
  ```typescript
  {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: string;
  }
  ```
- **Response**: UserProfileDto

### POST /users/change-password
Change password
- **Headers**: Authorization: Bearer {token}
- **Request Body**: ChangePasswordDto
  ```typescript
  {
    currentPassword: string;
    newPassword: string;
  }
  ```
- **Response**: SuccessResponse

### GET /users/addresses
Get user addresses
- **Headers**: Authorization: Bearer {token}
- **Response**: AddressDto[]

### POST /users/addresses
Create new address
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateAddressDto
  ```typescript
  {
    type: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }
  ```
- **Response**: AddressDto

### PUT /users/addresses/:id
Update address
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateAddressDto
  ```typescript
  {
    type?: string;
    fullName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  }
  ```
- **Response**: AddressDto

### DELETE /users/addresses/:id
Delete address
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

### GET /users/wallet
Get user wallet
- **Headers**: Authorization: Bearer {token}
- **Response**: WalletDto
  ```typescript
  {
    id: string;
    balance: number;
    frozenBalance: number;
    currency: string;
  }
  ```

### GET /users/wallet/transactions
Get wallet transactions
- **Headers**: Authorization: Bearer {token}
- **Query**: PaginationDto
- **Response**: PaginatedResponse<WalletTransactionDto>

## Sellers Module

### POST /sellers/register
Register as seller
- **Headers**: Authorization: Bearer {token}
- **Request Body**: RegisterSellerDto
  ```typescript
  {
    shopName: string;
    shopDescription?: string;
    shopLogo?: string;
    shopBanner?: string;
    businessLicense?: string;
    taxCode?: string;
    kycDocuments?: any;
  }
  ```
- **Response**: SellerDto

### GET /sellers/profile
Get seller profile
- **Headers**: Authorization: Bearer {token}
- **Response**: SellerProfileDto
  ```typescript
  {
    id: string;
    userId: string;
    shopName: string;
    shopDescription?: string;
    shopLogo?: string;
    shopBanner?: string;
    kycStatus: KYCStatus;
    businessLicense?: string;
    taxCode?: string;
    commissionRate: number;
    rating: number;
    totalReviews: number;
    totalSales: number;
    isVerified: boolean;
    shop?: ShopDto;
  }
  ```

### PUT /sellers/profile
Update seller profile
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateSellerDto
  ```typescript
  {
    shopName?: string;
    shopDescription?: string;
    shopLogo?: string;
    shopBanner?: string;
    businessLicense?: string;
    taxCode?: string;
  }
  ```
- **Response**: SellerProfileDto

### GET /sellers/analytics
Get seller analytics
- **Headers**: Authorization: Bearer {token}
- **Query**: AnalyticsQueryDto
  ```typescript
  {
    startDate?: Date;
    endDate?: Date;
    period?: 'day' | 'week' | 'month' | 'year';
  }
  ```
- **Response**: SellerAnalyticsDto
  ```typescript
  {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    conversionRate: number;
    averageOrderValue: number;
    topProducts: ProductDto[];
    salesByPeriod: {
      date: string;
      revenue: number;
      orders: number;
    }[];
  }
  ```

### GET /sellers/commissions
Get seller commissions
- **Headers**: Authorization: Bearer {token}
- **Query**: PaginationDto
- **Response**: PaginatedResponse<CommissionDto>

### POST /sellers/withdrawal
Request withdrawal
- **Headers**: Authorization: Bearer {token}
- **Request Body**: WithdrawalDto
  ```typescript
  {
    amount: number;
    bankAccount: string;
    bankName: string;
    accountName: string;
  }
  ```
- **Response**: WithdrawalResponseDto

## Shops Module

### GET /shops
Get shops with pagination and filters
- **Query**: ShopQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isVerified?: boolean;
    isMall?: boolean;
    sortBy?: 'name' | 'rating' | 'totalProducts' | 'totalSales';
    sortOrder?: 'asc' | 'desc';
  }
  ```
- **Response**: PaginatedResponse<ShopDto>

### GET /shops/:id
Get shop by ID
- **Response**: ShopDetailDto
  ```typescript
  {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
    status: ShopStatus;
    rating: number;
    totalReviews: number;
    totalProducts: number;
    totalFollowers: number;
    isOfficial: boolean;
    isMall: boolean;
    seller: SellerDto;
    products?: ProductDto[];
  }
  ```

### POST /shops
Create shop (for sellers)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateShopDto
  ```typescript
  {
    name: string;
    description?: string;
    logo?: string;
    banner?: string;
  }
  ```
- **Response**: ShopDto

### PUT /shops/:id
Update shop
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateShopDto
  ```typescript
  {
    name?: string;
    description?: string;
    logo?: string;
    banner?: string;
  }
  ```
- **Response**: ShopDto

### POST /shops/:id/follow
Follow shop
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

### DELETE /shops/:id/follow
Unfollow shop
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Products Module

### GET /products
Get products with pagination and filters
- **Query**: ProductQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    brand?: string;
    shop?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    status?: ProductStatus;
    isFeatured?: boolean;
    sortBy?: 'name' | 'price' | 'rating' | 'createdAt' | 'totalSold';
    sortOrder?: 'asc' | 'desc';
  }
  ```
- **Response**: PaginatedResponse<ProductDto>

### GET /products/:id
Get product by ID
- **Response**: ProductDetailDto
  ```typescript
  {
    id: string;
    shopId: string;
    categoryId: string;
    brandId?: string;
    sku: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    images: string[];
    videos?: string[];
    status: ProductStatus;
    price: number;
    compareAtPrice?: number;
    inventory: number;
    minOrder: number;
    maxOrder?: number;
    rating: number;
    totalReviews: number;
    totalSold: number;
    viewCount: number;
    isFeatured: boolean;
    isDigital: boolean;
    tags: string[];
    shop: ShopDto;
    category: CategoryDto;
    brand?: BrandDto;
    variants?: ProductVariantDto[];
    reviews?: ReviewDto[];
  }
  ```

### POST /products
Create product (for sellers)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateProductDto
  ```typescript
  {
    categoryId: string;
    brandId?: string;
    name: string;
    description?: string;
    shortDescription?: string;
    images: string[];
    videos?: string[];
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    weight?: number;
    dimensions?: any;
    inventory: number;
    minOrder?: number;
    maxOrder?: number;
    isFeatured?: boolean;
    isDigital?: boolean;
    tags: string[];
    seoTitle?: string;
    seoDescription?: string;
    attributes?: any;
    variants?: CreateProductVariantDto[];
  }
  ```
- **Response**: ProductDto

### PUT /products/:id
Update product (for sellers)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateProductDto
- **Response**: ProductDto

### DELETE /products/:id
Delete product (for sellers)
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

### GET /products/featured
Get featured products
- **Query**: PaginationDto
- **Response**: PaginatedResponse<ProductDto>

### GET /products/recommendations
Get product recommendations
- **Headers**: Authorization: Bearer {token}
- **Query**: RecommendationQueryDto
  ```typescript
  {
    type?: 'similar' | 'trending' | 'new' | 'personalized';
    productId?: string;
    limit?: number;
  }
  ```
- **Response**: ProductDto[]

### POST /products/:id/views
Track product view
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Categories Module

### GET /categories
Get categories with hierarchy
- **Query**: CategoryQueryDto
  ```typescript
  {
    parentId?: string;
    level?: number;
    isActive?: boolean;
    includeChildren?: boolean;
  }
  ```
- **Response**: CategoryDto[]

### GET /categories/:id
Get category by ID
- **Response**: CategoryDetailDto
  ```typescript
  {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    icon?: string;
    parentId?: string;
    level: number;
    sortOrder: number;
    isActive: boolean;
    parent?: CategoryDto;
    children?: CategoryDto[];
    products?: ProductDto[];
  }
  ```

### POST /categories
Create category (for admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateCategoryDto
  ```typescript
  {
    name: string;
    description?: string;
    image?: string;
    icon?: string;
    parentId?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
  ```
- **Response**: CategoryDto

### PUT /categories/:id
Update category (for admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateCategoryDto
- **Response**: CategoryDto

### DELETE /categories/:id
Delete category (for admins)
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Brands Module

### GET /brands
Get brands with pagination
- **Query**: PaginationDto
- **Response**: PaginatedResponse<BrandDto>

### GET /brands/:id
Get brand by ID
- **Response**: BrandDetailDto
  ```typescript
  {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logo?: string;
    isActive: boolean;
    products?: ProductDto[];
  }
  ```

### POST /brands
Create brand (for admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateBrandDto
  ```typescript
  {
    name: string;
    description?: string;
    logo?: string;
    isActive?: boolean;
  }
  ```
- **Response**: BrandDto

### PUT /brands/:id
Update brand (for admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateBrandDto
- **Response**: BrandDto

### DELETE /brands/:id
Delete brand (for admins)
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Cart Module

### GET /cart
Get user cart
- **Headers**: Authorization: Bearer {token}
- **Response**: CartDto
  ```typescript
  {
    id: string;
    items: CartItemDto[];
    subtotal: number;
    total: number;
  }
  ```

### POST /cart/items
Add item to cart
- **Headers**: Authorization: Bearer {token}
- **Request Body**: AddToCartDto
  ```typescript
  {
    productId: string;
    variantId?: string;
    quantity: number;
  }
  ```
- **Response**: CartDto

### PUT /cart/items/:id
Update cart item quantity
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateCartItemDto
  ```typescript
  {
    quantity: number;
  }
  ```
- **Response**: CartDto

### DELETE /cart/items/:id
Remove item from cart
- **Headers**: Authorization: Bearer {token}
- **Response**: CartDto

### DELETE /cart
Clear cart
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Orders Module

### GET /orders
Get user orders with pagination
- **Headers**: Authorization: Bearer {token}
- **Query**: OrderQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }
  ```
- **Response**: PaginatedResponse<OrderDto>

### GET /orders/:id
Get order by ID
- **Headers**: Authorization: Bearer {token}
- **Response**: OrderDetailDto
  ```typescript
  {
    id: string;
    orderNumber: string;
    userId: string;
    shopId: string;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    currency: string;
    subtotal: number;
    tax: number;
    shippingFee: number;
    discount: number;
    total: number;
    notes?: string;
    shippingAddress: any;
    billingAddress?: any;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
    user: UserDto;
    shop: ShopDto;
    items: OrderItemDto[];
    payment?: PaymentDto;
    shipments: ShipmentDto[];
    reviews: ReviewDto[];
  }
  ```

### POST /orders
Create order
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateOrderDto
  ```typescript
  {
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[];
    shippingAddress: any;
    billingAddress?: any;
    paymentMethod: PaymentMethod;
    notes?: string;
    voucherCode?: string;
  }
  ```
- **Response**: OrderDto

### PUT /orders/:id/cancel
Cancel order
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CancelOrderDto
  ```typescript
  {
    reason: string;
  }
  ```
- **Response**: OrderDto

### PUT /orders/:id/confirm
Confirm order received
- **Headers**: Authorization: Bearer {token}
- **Response**: OrderDto

## Payments Module

### GET /payments/methods
Get available payment methods
- **Response**: PaymentMethodDto[]

### POST /payments/process
Process payment
- **Headers**: Authorization: Bearer {token}
- **Request Body**: ProcessPaymentDto
  ```typescript
  {
    orderId: string;
    method: PaymentMethod;
    paymentDetails?: any;
  }
  ```
- **Response**: PaymentResponseDto
  ```typescript
  {
    payment: PaymentDto;
    redirectUrl?: string;
    qrCode?: string;
  }
  ```

### POST /payments/webhook/:provider
Payment webhook (for external providers)
- **Request Body**: any (provider-specific)
- **Response**: SuccessResponse

### GET /payments/:id
Get payment by ID
- **Headers**: Authorization: Bearer {token}
- **Response**: PaymentDto

## Shipping Module

### GET /shipping/carriers
Get available shipping carriers
- **Response**: CarrierDto[]

### POST /shipping/calculate
Calculate shipping fee
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CalculateShippingDto
  ```typescript
  {
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
    }[];
    shippingAddress: any;
    carrierId?: string;
  }
  ```
- **Response**: ShippingCalculationDto
  ```typescript
  {
    carrier: CarrierDto;
    service: string;
    fee: number;
    estimatedDelivery: Date;
  }
  ```

### GET /shipping/track/:trackingNumber
Track shipment
- **Response**: TrackingDto
  ```typescript
  {
    trackingNumber: string;
    status: ShippingStatus;
    carrier: CarrierDto;
    events: TrackingEventDto[];
  }
  ```

## Vouchers Module

### GET /vouchers
Get available vouchers
- **Headers**: Authorization: Bearer {token}
- **Query**: VoucherQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    scope?: VoucherScope;
    shopId?: string;
    categoryId?: string;
    minOrderValue?: number;
  }
  ```
- **Response**: PaginatedResponse<VoucherDto>

### GET /vouchers/:code
Get voucher by code
- **Headers**: Authorization: Bearer {token}
- **Response**: VoucherDto

### POST /vouchers
Create voucher (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateVoucherDto
  ```typescript
  {
    code: string;
    name: string;
    description?: string;
    type: VoucherType;
    scope: VoucherScope;
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    usageLimit?: number;
    usageLimitPerUser?: number;
    applicableProducts?: string[];
    applicableCategories?: string[];
    applicableShops?: string[];
    startsAt: Date;
    endsAt: Date;
  }
  ```
- **Response**: VoucherDto

### PUT /vouchers/:id
Update voucher (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateVoucherDto
- **Response**: VoucherDto

### DELETE /vouchers/:id
Delete voucher (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Flash Sales Module

### GET /flash-sales
Get active and upcoming flash sales
- **Query**: FlashSaleQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    status?: FlashSaleStatus;
    shopId?: string;
  }
  ```
- **Response**: PaginatedResponse<FlashSaleDto>

### GET /flash-sales/:id
Get flash sale by ID
- **Response**: FlashSaleDetailDto
  ```typescript
  {
    id: string;
    shopId?: string;
    name: string;
    description?: string;
    banner?: string;
    status: FlashSaleStatus;
    startsAt: Date;
    endsAt: Date;
    shop?: ShopDto;
    items: FlashSaleItemDto[];
  }
  ```

### POST /flash-sales
Create flash sale (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateFlashSaleDto
  ```typescript
  {
    name: string;
    description?: string;
    banner?: string;
    startsAt: Date;
    endsAt: Date;
    items: {
      productId: string;
      variantId?: string;
      salePrice: number;
      stock: number;
      maxOrderPerUser?: number;
    }[];
  }
  ```
- **Response**: FlashSaleDto

### PUT /flash-sales/:id
Update flash sale (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateFlashSaleDto
- **Response**: FlashSaleDto

### DELETE /flash-sales/:id
Delete flash sale (for sellers/admins)
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Live Streaming Module

### GET /live-streams
Get live streams
- **Query**: LiveStreamQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    status?: LiveStreamStatus;
    shopId?: string;
  }
  ```
- **Response**: PaginatedResponse<LiveStreamDto>

### GET /live-streams/:id
Get live stream by ID
- **Response**: LiveStreamDetailDto
  ```typescript
  {
    id: string;
    shopId: string;
    sellerId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    streamKey?: string;
    streamUrl?: string;
    status: LiveStreamStatus;
    scheduledAt: Date;
    startedAt?: Date;
    endedAt?: Date;
    viewerCount: number;
    maxViewerCount: number;
    duration?: number;
    shop: ShopDto;
    seller: SellerDto;
    items: LiveStreamItemDto[];
  }
  ```

### POST /live-streams
Create live stream (for sellers)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateLiveStreamDto
  ```typescript
  {
    title: string;
    description?: string;
    thumbnail?: string;
    scheduledAt: Date;
    items: {
      productId: string;
      variantId?: string;
      price: number;
      stock: number;
    }[];
  }
  ```
- **Response**: LiveStreamDto

### PUT /live-streams/:id/start
Start live stream
- **Headers**: Authorization: Bearer {token}
- **Response**: LiveStreamDto

### PUT /live-streams/:id/end
End live stream
- **Headers**: Authorization: Bearer {token}
- **Response**: LiveStreamDto

### POST /live-streams/:id/join
Join live stream
- **Headers**: Authorization: Bearer {token}
- **Response**: JoinStreamResponseDto
  ```typescript
  {
    streamUrl: string;
    chatToken: string;
  }
  ```

## Reviews Module

### GET /reviews
Get reviews with pagination
- **Query**: ReviewQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    productId?: string;
    shopId?: string;
    rating?: number;
    status?: ReviewStatus;
  }
  ```
- **Response**: PaginatedResponse<ReviewDto>

### GET /reviews/:id
Get review by ID
- **Response**: ReviewDetailDto
  ```typescript
  {
    id: string;
    userId: string;
    productId: string;
    orderId?: string;
    variantId?: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    videos?: string[];
    isVerified: boolean;
    isRecommended: boolean;
    helpfulCount: number;
    status: ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
    user: UserDto;
    product: ProductDto;
    variant?: ProductVariantDto;
  }
  ```

### POST /reviews
Create review
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateReviewDto
  ```typescript
  {
    productId: string;
    orderId?: string;
    variantId?: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    videos?: string[];
    isRecommended?: boolean;
  }
  ```
- **Response**: ReviewDto

### PUT /reviews/:id/helpful
Mark review as helpful
- **Headers**: Authorization: Bearer {token}
- **Response**: ReviewDto

## Notifications Module

### GET /notifications
Get user notifications
- **Headers**: Authorization: Bearer {token}
- **Query**: NotificationQueryDto
  ```typescript
  {
    page?: number;
    limit?: number;
    type?: NotificationType;
    isRead?: boolean;
  }
  ```
- **Response**: PaginatedResponse<NotificationDto>

### PUT /notifications/:id/read
Mark notification as read
- **Headers**: Authorization: Bearer {token}
- **Response**: NotificationDto

### PUT /notifications/read-all
Mark all notifications as read
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

### DELETE /notifications/:id
Delete notification
- **Headers**: Authorization: Bearer {token}
- **Response**: SuccessResponse

## Chat Module

### GET /chat/conversations
Get user conversations
- **Headers**: Authorization: Bearer {token}
- **Query**: PaginationDto
- **Response**: PaginatedResponse<ConversationDto>

### GET /chat/conversations/:id/messages
Get conversation messages
- **Headers**: Authorization: Bearer {token}
- **Query**: PaginationDto
- **Response**: PaginatedResponse<ChatMessageDto>

### POST /chat/conversations
Create new conversation
- **Headers**: Authorization: Bearer {token}
- **Request Body**: CreateConversationDto
  ```typescript
  {
    participantId: string;
    initialMessage?: string;
  }
  ```
- **Response**: ConversationDto

### POST /chat/conversations/:id/messages
Send message
- **Headers**: Authorization: Bearer {token}
- **Request Body**: SendMessageDto
  ```typescript
  {
    message: string;
    type?: string;
    attachments?: string[];
  }
  ```
- **Response**: ChatMessageDto

## Wishlist Module

### GET /wishlist
Get user wishlist
- **Headers**: Authorization: Bearer {token}
- **Response**: WishlistDto
  ```typescript
  {
    id: string;
    name: string;
    isPublic: boolean;
    items: WishlistItemDto[];
  }
  ```

### POST /wishlist/items
Add item to wishlist
- **Headers**: Authorization: Bearer {token}
- **Request Body**: AddToWishlistDto
  ```typescript
  {
    productId: string;
    variantId?: string;
  }
  ```
- **Response**: WishlistDto

### DELETE /wishlist/items/:id
Remove item from wishlist
- **Headers**: Authorization: Bearer {token}
- **Response**: WishlistDto

## Admin Module

### GET /admin/dashboard
Get admin dashboard data
- **Headers**: Authorization: Bearer {token}
- **Response**: AdminDashboardDto
  ```typescript
  {
    totalUsers: number;
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: OrderDto[];
    topProducts: ProductDto[];
    topSellers: SellerDto[];
    salesByPeriod: {
      date: string;
      revenue: number;
      orders: number;
    }[];
  }
  ```

### GET /admin/users
Get all users (admin)
- **Headers**: Authorization: Bearer {token}
- **Query**: AdminUserQueryDto
- **Response**: PaginatedResponse<UserDto>

### PUT /admin/users/:id/status
Update user status (admin)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: UpdateUserStatusDto
  ```typescript
  {
    status: UserStatus;
  }
  ```
- **Response**: UserDto

### GET /admin/sellers
Get all sellers (admin)
- **Headers**: Authorization: Bearer {token}
- **Query**: AdminSellerQueryDto
- **Response**: PaginatedResponse<SellerDto>

### PUT /admin/sellers/:id/approve
Approve seller (admin)
- **Headers**: Authorization: Bearer {token}
- **Response**: SellerDto

### PUT /admin/sellers/:id/reject
Reject seller (admin)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: RejectSellerDto
  ```typescript
  {
    reason: string;
  }
  ```
- **Response**: SellerDto

### GET /admin/products
Get all products (admin)
- **Headers**: Authorization: Bearer {token}
- **Query**: AdminProductQueryDto
- **Response**: PaginatedResponse<ProductDto>

### PUT /admin/products/:id/approve
Approve product (admin)
- **Headers**: Authorization: Bearer {token}
- **Response**: ProductDto

### PUT /admin/products/:id/ban
Ban product (admin)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: BanProductDto
  ```typescript
  {
    reason: string;
  }
  ```
- **Response**: ProductDto

### GET /admin/orders
Get all orders (admin)
- **Headers**: Authorization: Bearer {token}
- **Query**: AdminOrderQueryDto
- **Response**: PaginatedResponse<OrderDto>

### GET /admin/tickets
Get all support tickets (admin)
- **Headers**: Authorization: Bearer {token}
- **Query**: AdminTicketQueryDto
- **Response**: PaginatedResponse<TicketDto>

### PUT /admin/tickets/:id/assign
Assign ticket to admin (admin)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: AssignTicketDto
  ```typescript
  {
    assignedTo: string;
  }
  ```
- **Response**: TicketDto

### PUT /admin/tickets/:id/resolve
Resolve ticket (admin)
- **Headers**: Authorization: Bearer {token}
- **Request Body**: ResolveTicketDto
  ```typescript
  {
    resolution: string;
  }
  ```
- **Response**: TicketDto

## WebSocket Events

### Connection Events

#### connect
Client connects to WebSocket
- **Client sends**: 
  ```typescript
  {
    token: string;
  }
  ```
- **Server responds**: 
  ```typescript
  {
    userId: string;
    connected: true;
  }
  ```

#### disconnect
Client disconnects from WebSocket

### Chat Events

#### join_room
Join a chat room
- **Client sends**: 
  ```typescript
  {
    roomId: string;
  }
  ```
- **Server broadcasts**: 
  ```typescript
  {
    type: 'user_joined';
    userId: string;
    roomId: string;
  }
  ```

#### leave_room
Leave a chat room
- **Client sends**: 
  ```typescript
  {
    roomId: string;
  }
  ```
- **Server broadcasts**: 
  ```typescript
  {
    type: 'user_left';
    userId: string;
    roomId: string;
  }
  ```

#### send_message
Send a chat message
- **Client sends**: 
  ```typescript
  {
    roomId: string;
    message: string;
    type?: string;
    attachments?: string[];
  }
  ```
- **Server broadcasts**: 
  ```typescript
  {
    type: 'new_message';
    message: ChatMessageDto;
  }
  ```

### Live Stream Events

#### join_stream
Join a live stream
- **Client sends**: 
  ```typescript
  {
    streamId: string;
  }
  ```
- **Server responds**: 
  ```typescript
  {
    type: 'stream_joined';
    streamId: string;
    viewerCount: number;
  }
  ```

#### leave_stream
Leave a live stream
- **Client sends**: 
  ```typescript
  {
    streamId: string;
  }
  ```

#### stream_message
Send a message in live stream
- **Client sends**: 
  ```typescript
  {
    streamId: string;
    message: string;
  }
  ```
- **Server broadcasts**: 
  ```typescript
  {
    type: 'stream_message';
    streamId: string;
    message: ChatMessageDto;
  }
  ```

#### stream_viewer_count
Update viewer count (server broadcasts)
- **Server broadcasts**: 
  ```typescript
  {
    type: 'viewer_count_updated';
    streamId: string;
    viewerCount: number;
  }
  ```

### Order Events

#### order_status_update
Order status update (server broadcasts to relevant users)
- **Server broadcasts**: 
  ```typescript
  {
    type: 'order_status_update';
    orderId: string;
    status: OrderStatus;
    timestamp: Date;
  }
  ```

### Notification Events

#### new_notification
New notification (server broadcasts to user)
- **Server broadcasts**: 
  ```typescript
  {
    type: 'new_notification';
    notification: NotificationDto;
  }
  ```

## Common DTOs

### PaginationDto
```typescript
{
  page?: number;
  limit?: number;
}
```

### PaginatedResponse<T>
```typescript
{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### SuccessResponse
```typescript
{
  success: true;
  message: string;
}
```

### ErrorResponse
```typescript
{
  success: false;
  message: string;
  error?: string;
  details?: any;
}