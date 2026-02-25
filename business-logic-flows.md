# Multi-Vendor Marketplace Business Logic Flows

## 1. Order Flow

### 1.1 Customer Order Placement Flow

```
Customer Flow:
1. Customer browses products
2. Customer adds products to cart
3. Customer proceeds to checkout
4. Customer selects shipping address
5. Customer selects payment method
6. Customer applies voucher (optional)
7. Customer confirms order

System Flow:
1. Validate cart items (availability, price)
2. Calculate order total (items + tax + shipping - discount)
3. Apply voucher validation and discount
4. Create order with PENDING status
5. Create payment record with PENDING status
6. Initiate payment process
7. Update inventory (reserve items)
8. Send order confirmation to customer
9. Send new order notification to seller
10. Update analytics data
```

### 1.2 Order Status Flow

```
PENDING
├── Payment Failed → CANCELLED
├── Payment Successful → CONFIRMED
└── Customer Cancelled → CANCELLED

CONFIRMED
├── Seller Processing → PROCESSING
└── Customer Cancelled → CANCELLED

PROCESSING
├── Packed → PACKED
└── Customer Cancelled → CANCELLED

PACKED
├── Shipped → SHIPPED
└── Customer Cancelled → CANCELLED (with restocking fee)

SHIPPED
├── Delivered → DELIVERED
├── Lost in Transit → REFUNDED
└── Returned → REFUNDED

DELIVERED
├── Customer Confirmed → COMPLETED
├── Auto-confirmed (7 days) → COMPLETED
├── Customer Issue → REFUND REQUESTED
└── Return Request → RETURNED

REFUND REQUESTED
├── Approved → REFUNDED
└── Rejected → COMPLETED

REFUNDED
└── Process completed

COMPLETED
└── Order completed

CANCELLED
└── Order cancelled
```

### 1.3 Order Processing Flow

```
1. Order Created (PENDING)
   ├─ Validate inventory
   ├─ Reserve products
   └─ Create payment record

2. Payment Processing
   ├─ Initiate payment with selected method
   ├─ Handle payment gateway response
   ├─ Update payment status
   └─ Update order status

3. Order Confirmation
   ├─ Send confirmation to customer
   ├─ Send notification to seller
   ├─ Update seller dashboard
   └─ Schedule fulfillment

4. Order Fulfillment
   ├─ Seller confirms order
   ├─ Update order status to PROCESSING
   ├─ Prepare products for shipping
   ├─ Update order status to PACKED
   └─ Create shipment record

5. Shipping
   ├─ Generate shipping label
   ├─ Assign to carrier
   ├─ Update tracking information
   ├─ Update order status to SHIPPED
   └─ Send tracking to customer

6. Delivery
   ├─ Carrier updates delivery status
   ├─ System receives delivery confirmation
   ├─ Update order status to DELIVERED
   ├─ Release payment to seller (after escrow period)
   └─ Send delivery confirmation

7. Order Completion
   ├─ Auto-confirm after 7 days if no action
   ├─ Customer can confirm receipt
   ├─ Release escrow payment to seller
   ├─ Update seller analytics
   └─ Request product review
```

## 2. Payment Flow

### 2.1 Payment Processing Flow

```
1. Payment Initiation
   ├─ Customer selects payment method
   ├─ System validates payment method
   ├─ Calculate final amount
   └─ Create payment record

2. Payment Gateway Integration
   ├─ Wallet Payment
   │  ├─ Validate wallet balance
   │  ├─ Deduct amount from wallet
   │  ├─ Create wallet transaction
   │  └─ Update payment status
   ├─ Credit/Debit Card (Stripe)
   │  ├─ Create payment intent
   │  ├─ Redirect to Stripe checkout
   │  ├─ Handle Stripe webhook
   │  └─ Update payment status
   ├─ VNPay
   │  ├─ Create VNPay payment URL
   │  ├─ Redirect to VNPay gateway
   │  ├─ Handle VNPay callback
   │  └─ Update payment status
   ├─ Momo
   │  ├─ Create Momo payment request
   │  ├─ Redirect to Momo app/web
   │  ├─ Handle Momo IPN callback
   │  └─ Update payment status
   ├─ COD
   │  ├─ Mark as pending
   │  ├─ Update payment status
   │  └─ Collect on delivery
   └─ BNPL (Buy Now Pay Later)
      ├─ Create BNPL application
      ├─ Redirect to BNPL provider
      ├─ Handle BNPL approval/rejection
      └─ Update payment status

3. Payment Confirmation
   ├─ Update payment status to COMPLETED
   ├─ Update order status to CONFIRMED
   ├─ Send payment confirmation to customer
   ├─ Send payment notification to seller
   └─ Record payment in analytics

4. Payment Failure
   ├─ Update payment status to FAILED
   ├─ Update order status to CANCELLED
   ├─ Release reserved inventory
   ├─ Send failure notification to customer
   └─ Record failure reason
```

### 2.2 Escrow Payment Flow

```
1. Payment Received
   ├─ Customer pays for order
   ├─ Payment held in escrow account
   ├─ Order status updated to CONFIRMED
   └─ Seller notified of payment received

2. Order Fulfillment
   ├─ Seller processes and ships order
   ├─ Customer receives order
   └─ Delivery confirmed

3. Escrow Release Conditions
   ├─ Customer confirms receipt
   ├─ Auto-confirmation after 7 days
   ├─ No disputes raised
   └─ Return period expired

4. Escrow Release
   ├─ Calculate commission fee
   ├─ Deduct platform commission
   ├─ Transfer net amount to seller wallet
   ├─ Create commission record
   └─ Send payment release notification

5. Dispute Handling
   ├─ Customer raises dispute
   ├─ Escrow payment held
   ├─ Admin reviews dispute
   ├─ Resolution determined
   ├─ Partial/Full refund if needed
   └─ Release remaining amount to seller
```

### 2.3 Wallet Transaction Flow

```
1. Wallet Top-up
   ├─ Customer initiates top-up
   ├─ Select payment method
   ├─ Process payment
   ├─ Add funds to wallet
   ├─ Create transaction record
   └─ Send confirmation

2. Wallet Payment
   ├─ Customer selects wallet payment
   ├─ Validate wallet balance
   ├─ Deduct payment amount
   ├─ Create transaction record
   ├─ Update payment status
   └─ Send confirmation

3. Wallet Withdrawal
   ├─ Seller requests withdrawal
   ├─ Validate withdrawal amount
   ├─ Check withdrawal limits
   ├─ Process bank transfer
   ├─ Deduct from wallet
   ├─ Create transaction record
   └─ Send confirmation

4. Cashback/Reward
   ├─ System calculates cashback
   ├─ Add cashback to wallet
   ├─ Create transaction record
   └─ Send notification

5. Refund to Wallet
   ├─ Order refunded
   ├─ Calculate refund amount
   ├─ Add to customer wallet
   ├─ Create transaction record
   └─ Send notification
```

## 3. Seller Onboarding Flow

### 3.1 Seller Registration Flow

```
1. Initial Registration
   ├─ User registers as seller
   ├─ Provide basic information
   │  ├─ Shop name
   │  ├─ Shop description
   │  ├─ Contact information
   │  └─ Business type
   ├─ Create seller profile
   ├─ Set status to PENDING_VERIFICATION
   └─ Send verification requirements

2. KYC (Know Your Customer) Process
   ├─ Upload required documents
   │  ├─ ID card/Passport
   │  ├─ Business license
   │  ├─ Tax certificate
   │  └─ Bank account information
   ├─ System validates documents
   ├─ Manual review by admin
   ├─ Update KYC status
   └─ Send status notification

3. Shop Setup
   ├─ Configure shop details
   │  ├─ Shop logo and banner
   │  ├─ Shop policies
   │  ├─ Shipping settings
   │  └─ Return policies
   ├─ Set up payment methods
   ├─ Configure shipping options
   └─ Complete shop profile

4. Verification Approval
   ├─ Admin reviews seller application
   ├─ Background check (if required)
   ├─ Approve or reject application
   ├─ Update seller status
   └─ Send approval/rejection notification

5. Shop Activation
   ├─ Seller status updated to ACTIVE
   ├─ Shop becomes visible
   ├─ Seller can add products
   ├─ Access to seller dashboard
   └─ Onboarding completion
```

### 3.2 Seller Product Onboarding Flow

```
1. Product Creation
   ├─ Seller adds new product
   ├─ Fill product details
   │  ├─ Product name and description
   │  ├─ Product images and videos
   │  ├─ Product variants (size, color, etc.)
   │  ├─ Pricing information
   │  ├─ Inventory details
   │  └─ SEO information
   ├─ Select product category
   ├─ Set shipping options
   └─ Submit for review

2. Product Review
   ├─ System validates product information
   ├─ Check for policy compliance
   ├─ Manual review (if required)
   ├─ Approve or reject product
   └─ Send status notification

3. Product Activation
   ├─ Approved products become active
   ├─ Products appear in search results
   ├─ Products visible to customers
   └─ Inventory tracking starts

4. Product Management
   ├─ Update product information
   ├─ Manage inventory levels
   ├─ Update pricing
   ├─ Handle product variants
   └─ Monitor product performance
```

## 4. Live Streaming Shopping Flow

### 4.1 Live Stream Setup Flow

```
1. Stream Planning
   ├─ Seller plans live stream
   ├─ Select products to feature
   ├─ Set stream schedule
   ├─ Create stream title and description
   └─ Prepare promotional materials

2. Stream Configuration
   ├─ Set up streaming equipment
   ├─ Configure stream settings
   ├─ Test audio/video quality
   ├─ Create stream key
   └─ Set up chat moderation

3. Stream Promotion
   ├─ Announce upcoming stream
   ├─ Send notifications to followers
   ├─ Create promotional banners
   ├─ Schedule social media posts
   └─ Set up stream reminders

4. Stream Launch
   ├─ Start streaming
   ├─ Enable live chat
   ├─ Display featured products
   ├─ Monitor viewer engagement
   └─ Track sales in real-time

5. Stream Completion
   ├─ End streaming
   ├─ Save stream recording
   ├─ Generate stream analytics
   ├─ Follow up with viewers
   └─ Process stream orders
```

### 4.2 Live Shopping Purchase Flow

```
1. Product Discovery
   ├─ Customer joins live stream
   ├─ View product demonstrations
   ├─ Interact with seller
   └─ Ask product questions

2. Purchase Decision
   ├─ Customer decides to buy
   ├─ Click on product in stream
   ├─ View product details
   └─ Select product options

3. Quick Checkout
   ├─ Stream-optimized checkout
   ├─ Pre-filled customer information
   ├─ Express payment options
   └─ One-click purchase

4. Order Processing
   ├─ Order created immediately
   ├─ Priority processing for live orders
   ├─ Special live stream packaging
   └─ Expedited shipping options

5. Post-Purchase
   ├─ Order confirmation
   ├─ Live stream exclusive offers
   ├─ Follow-up messages
   └─ Review requests
```

## 5. Flash Sale Flow

### 5.1 Flash Sale Creation Flow

```
1. Flash Sale Planning
   ├─ Seller plans flash sale
   ├─ Select participating products
   ├─ Set discount rates
   ├─ Determine sale duration
   └─ Allocate inventory

2. Flash Sale Configuration
   ├─ Set sale start/end times
   ├─ Configure pricing rules
   ├─ Set purchase limits
   ├─ Create promotional banners
   └─ Set up notifications

3. Flash Sale Approval
   ├─ Admin review (if required)
   ├─ Compliance check
   ├─ Final approval
   └─ Schedule activation

4. Flash Sale Activation
   ├─ System activates sale at scheduled time
   ├─ Updates product prices
   ├─ Sends notifications
   ├─ Updates homepage banners
   └─ Begins inventory tracking

5. Flash Sale Monitoring
   ├─ Real-time sales tracking
   ├─ Inventory monitoring
   ├─ Performance analytics
   ├─ Customer engagement metrics
   └─ System load monitoring
```

### 5.2 Flash Sale Purchase Flow

```
1. Customer Discovery
   ├─ Customer sees flash sale banner
   ├─ Receives flash sale notification
   ├─ Browse flash sale products
   └─ View countdown timer

2. Product Selection
   ├─ Customer selects product
   ├─ View discounted price
   ├─ Check remaining stock
   ├─ View purchase limit
   └─ Add to cart quickly

3. Checkout Process
   ├─ Expedited checkout
   ├─ Flash sale pricing applied
   ├─ Inventory reservation
   ├─ Payment processing
   └─ Order confirmation

4. Inventory Management
   ├─ Real-time inventory update
   ├─ Stock level monitoring
   ├─ Automatic stock-out handling
   ├─ Backorder management
   └─ Sales analytics

5. Post-Sale
   ├─ Flash sale summary
   ├─ Performance report
   ├─ Customer analytics
   ├─ Revenue tracking
   └─ Follow-up marketing
```

## 6. Review and Rating Flow

### 6.1 Review Submission Flow

```
1. Review Trigger
   ├─ Order delivered
   ├─ Customer receives product
   ├─ System sends review request
   └─ Customer navigates to review page

2. Review Creation
   ├─ Customer selects product rating
   ├─ Writes review title
   ├─ Composes review content
   ├─ Uploads photos/videos
   ├─ Tags product features
   └─ Submits review

3. Review Processing
   ├─ System validates review
   ├─ Check for inappropriate content
   ├─ Filter spam reviews
   ├─ Moderate language
   └─ Queue for approval

4. Review Approval
   ├─ Manual review (if required)
   ├─ Automated approval
   ├─ Update product rating
   ├─ Update seller rating
   └─ Publish review

5. Review Display
   ├─ Review appears on product page
   ├─ Review appears in seller profile
   ├─ Update search rankings
   ├─ Send review confirmation
   └─ Award loyalty points
```

### 6.2 Review Management Flow

```
1. Review Monitoring
   ├─ System monitors new reviews
   ├─ Flag inappropriate content
   ├─ Detect fake reviews
   ├─ Track review patterns
   └─ Generate review reports

2. Review Moderation
   ├─ Admin reviews flagged content
   ├─ Removes inappropriate reviews
   ├─ Responds to customer complaints
   ├─ Handles review disputes
   └─ Updates review policies

3. Review Analytics
   ├─ Analyze review trends
   ├─ Track customer satisfaction
   ├─ Monitor product quality
   ├─ Identify improvement areas
   └─ Generate insights

4. Review Incentives
   ├─ Reward quality reviews
   ├─ Offer review bonuses
   ├─ Gamify review process
   ├─ Recognize top reviewers
   └─ Build review community
```

## 7. Customer Support Flow

### 7.1 Ticket Creation Flow

```
1. Issue Identification
   ├─ Customer encounters problem
   ├─ Navigates to support center
   ├─ Selects issue category
   ├─ Describes the problem
   └─ Attaches supporting documents

2. Ticket Creation
   ├─ System creates support ticket
   ├─ Assigns ticket ID
   ├─ Categorizes ticket type
   ├─ Sets priority level
   └─ Sends confirmation

3. Ticket Routing
   ├─ System routes to appropriate department
   ├─ Assigns to available agent
   ├─ Sets SLA based on priority
   ├─ Notifies assigned agent
   └─ Tracks response time

4. Initial Response
   ├─ Agent acknowledges ticket
   ├─ Requests additional information
   ├─ Provides initial guidance
   ├─ Sets expectations
   └─ Updates ticket status

5. Ticket Resolution
   ├─ Agent investigates issue
   ├─ Provides solution
   ├─ Customer confirms resolution
   ├─ Agent closes ticket
   └─ System sends satisfaction survey
```

### 7.2 Escalation Flow

```
1. Escalation Triggers
   ├─ First-level resolution fails
   ├─ Customer requests escalation
   ├─ SLA breach imminent
   ├─ High-priority issue
   └─ Complex technical problem

2. Escalation Process
   ├─ Agent initiates escalation
   ├─ Provides context and history
   ├─ Transfers to specialist team
   ├─ Updates customer on status
   └─ Sets new SLA

3. Specialist Handling
   ├─ Specialist reviews case
   ├─ Conducts deeper investigation
   ├─ Consults with other teams
   ├─ Develops comprehensive solution
   └─ Implements fix

4. Resolution Communication
   ├─ Specialist communicates solution
   ├─ Explains technical details
   ├─ Provides prevention tips
   ├─ Documents resolution
   └─ Updates knowledge base

5. Follow-up
   ├─ Schedule follow-up contact
   ├─ Monitor issue resolution
   ├─ Gather customer feedback
   ├─ Identify process improvements
   └─ Update escalation procedures
```

These business logic flows provide a comprehensive foundation for implementing the core functionality of our multi-vendor marketplace platform. Each flow includes detailed steps, decision points, and system interactions that will guide the development process.