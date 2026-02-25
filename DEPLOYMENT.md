# Deployment Guide

This guide covers the deployment of the Multi-Vendor Marketplace platform built with NestJS, Next.js, React Native, and various third-party integrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Admin Dashboard Deployment](#admin-dashboard-deployment)
8. [Third-Party Services Setup](#third-party-services-setup)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Docker & Docker Compose
- Node.js 18.x or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- Nginx (for production)
- kubectl (for Kubernetes deployment)
- Git

### Required Accounts
- GitHub account (for CI/CD)
- Docker Hub account or GitHub Container Registry
- Cloud provider account (AWS, Google Cloud, Azure, etc.)
- Domain name and SSL certificates

### System Requirements
- Minimum 4GB RAM
- Minimum 2 CPU cores
- Minimum 20GB storage
- Ubuntu 20.04+ or CentOS 8+ recommended

## Environment Configuration

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace
DB_USER=postgres
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/marketplace

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:your_redis_password@localhost:6379

# Application
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# Clerk Authentication
CLERK_API_KEY=sk_test_your_clerk_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Payment Providers
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VNPAY_TMN_CODE=YOUR_VNPAY_TMN_CODE
VNPAY_HASH_SECRET=YOUR_VNPAY_HASH_SECRET
VNPAY_API_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
MOMO_PARTNER_CODE=YOUR_MOMO_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_MOMO_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_MOMO_SECRET_KEY
MOMO_API_URL=https://test-payment.momo.vn/gw_payment/transactionProcessor

# Shipping Providers
GHN_API_TOKEN=YOUR_GHN_API_TOKEN
GHN_API_URL=https://dev-online-gateway.ghn.vn/shiip/public-api/master
GHTK_API_TOKEN=YOUR_GHTK_API_TOKEN
GHTK_API_URL=https://services.giaohangtktk.vn/services/ship/order
JNT_API_TOKEN=YOUR_JNT_API_TOKEN
JNT_API_URL=https://api.jtexpress.vn/jnt/v1

# Live Streaming
AGORA_APP_ID=YOUR_AGORA_APP_ID
AGORA_APP_CERTIFICATE=YOUR_AGORA_APP_CERTIFICATE
LIVEKIT_API_KEY=YOUR_LIVEKIT_API_KEY
LIVEKIT_API_SECRET=YOUR_LIVEKIT_API_SECRET
LIVEKIT_HOST=your-livekit-host.com

# Search Engine
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_meilisearch_master_key

# Firebase/OneSignal
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@xxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_EMAIL_USER=your-email@gmail.com
FIREBASE_EMAIL_PASSWORD=your-app-password
FIREBASE_EMAIL_FROM=noreply@yourdomain.com
ONESIGNAL_APP_ID=YOUR_ONESIGNAL_APP_ID
ONESIGNAL_API_KEY=YOUR_ONESIGNAL_API_KEY

# File Storage
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your-s3-bucket-name

# URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## Database Setup

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install -y postgresql-server postgresql-contrib
```

### Database Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database
CREATE DATABASE marketplace;
CREATE USER marketplace_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE marketplace TO marketplace_user;
```

### Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

## Backend Deployment

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/marketplace.git
cd marketplace

# Copy environment file
cp .env.example .env.production

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Manual Deployment

```bash
# Install dependencies
cd packages/backend
npm ci --production

# Build application
npm run build

# Start application
NODE_ENV=production npm start
```

### Option 3: Kubernetes Deployment

```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marketplace-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: marketplace-backend
  template:
    metadata:
      labels:
        app: marketplace-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/your-org/marketplace-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: marketplace-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: marketplace-backend-service
spec:
  selector:
    app: marketplace-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## Frontend Deployment

### Option 1: Docker Compose

```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d --build web
```

### Option 2: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Option 3: Static Hosting with Nginx

```bash
# Build static files
cd apps/web
npm run build

# Copy to Nginx directory
sudo cp -r out/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

## Mobile App Deployment

### Option 1: Expo Application Services

```bash
# Install Expo CLI
npm i -g @expo/cli

# Build and deploy
cd apps/mobile
expo build:android --release-channel production
expo build:ios --release-channel production

# Submit to app stores
expo submit --platform android
expo submit --platform ios
```

### Option 2: Custom Build Pipeline

```bash
# Build APK
cd apps/mobile
expo build:android --type apk

# Build IPA
expo build:ios --type archive

# Distribute
expo upload:android --release-channel production
expo upload:ios --release-channel production
```

## Admin Dashboard Deployment

### Option 1: Docker Compose

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d --build admin
```

### Option 2: Vercel

```bash
cd apps/admin
vercel --prod
```

## Third-Party Services Setup

### Clerk Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create new application
3. Configure webhook URLs:
   - `https://api.yourdomain.com/auth/clerk/webhook`
4. Copy API keys to environment variables

### Payment Providers

#### Stripe
1. Create account at [Stripe Dashboard](https://dashboard.stripe.com)
2. Configure webhooks:
   - Payment succeeded
   - Payment failed
3. Enable relevant payment methods for your region

#### VNPay
1. Register at [VNPay Portal](https://merchant.vnpay.vn)
2. Configure return URL: `https://api.yourdomain.com/payments/vnpay/return`
3. Test with sandbox environment first

#### MoMo
1. Register at [MoMo for Business](https://business.momo.vn)
2. Configure IP whitelist and callback URLs
3. Test API integration

### Shipping Providers

#### GHN
1. Register at [GHN Portal](https://donhang.ghn.vn)
2. Configure shop information and services
3. Set up webhook URLs

#### GHTK
1. Register at [GHTK Portal](https://donhang.ghn.vn)
2. Configure shipping services and pricing
3. Test API integration

### Live Streaming

#### Agora
1. Create account at [Agora Console](https://console.agora.io)
2. Enable video calling and interactive live streaming
3. Configure project and acquire App ID/Certificate

#### LiveKit
1. Set up LiveKit server or use cloud service
2. Configure API keys and rooms
3. Test streaming functionality

### Search Engine

#### Meilisearch
1. Deploy Meilisearch instance
2. Configure master key and API endpoints
3. Set up indexes and search settings

### Notifications

#### Firebase
1. Create Firebase project
2. Configure Cloud Messaging
3. Set up FCM server key and certificates

#### OneSignal
1. Create OneSignal account
2. Configure app and platforms
3. Set up segments and user targeting

## Monitoring and Logging

### Application Monitoring

```bash
# Install monitoring tools
npm install -g @sentry/cli

# Configure Sentry
sentry-cli releases new \
  --org your-org \
  --project your-project \
  --version $(git rev-parse HEAD)
```

### Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/marketplace

# View logs
docker-compose logs -f backend
docker-compose logs -f web
```

### Health Checks

```bash
# Backend health
curl https://api.yourdomain.com/health

# Database health
docker exec marketplace-postgres pg_isready

# Redis health
docker exec marketplace-redis redis-cli ping
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is configured in `.github/workflows/ci.yml` with the following stages:

1. **Test**: Run unit and integration tests
2. **Build**: Build Docker images for all services
3. **Deploy Staging**: Deploy to staging environment on develop branch
4. **Deploy Production**: Deploy to production on main branch

### Manual Deployment Commands

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production

# Rollback deployment
npm run rollback:production
```

## Security Considerations

### SSL/TLS Configuration

```bash
# Generate SSL certificates (Let's Encrypt)
sudo certbot --nginx certonly -d yourdomain.com

# Configure Nginx with SSL
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

### Firewall Configuration

```bash
# Open required ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 3000  # Backend API
sudo ufw allow 5432  # PostgreSQL
sudo ufw allow 6379  # Redis
sudo ufw allow 7700  # Meilisearch
```

### Environment Security

```bash
# Set proper file permissions
chmod 600 .env.production
chmod 700 scripts/

# Use non-root user
useradd -m -s /bin/bash marketplace
sudo -u marketplace -H docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U marketplace_user -d marketplace -c "SELECT 1;"

# View logs
sudo tail -f /var/log/postgresql/postgresql.log
```

#### Docker Issues
```bash
# Check container status
docker ps -a

# View container logs
docker logs marketplace-backend

# Restart services
docker-compose restart backend
```

#### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check memory usage
free -h

# Check disk usage
df -h
```

### Health Check Scripts

```bash
#!/bin/bash
# health-check.sh

echo "Checking service health..."

# Check backend
if curl -f http://localhost:3000/health > /dev/null; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend is unhealthy"
fi

# Check database
if docker exec marketplace-postgres pg_isready > /dev/null; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is unhealthy"
fi

# Check Redis
if docker exec marketplace-redis redis-cli ping > /dev/null; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis is unhealthy"
fi
```

### Backup Scripts

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
docker exec marketplace-postgres pg_dump -U marketplace_user marketplace > $BACKUP_DIR/database.sql

# File backup
tar -czf $BACKUP_DIR/files.tar.gz uploads/

# Upload to cloud storage (AWS S3 example)
aws s3 cp $BACKUP_DIR/database.sql s3://your-backup-bucket/database-$DATE.sql
aws s3 cp $BACKUP_DIR/files.tar.gz s3://your-backup-bucket/files-$DATE.tar.gz

echo "Backup completed: $BACKUP_DIR"
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_products_category_id ON products(category_id);
CREATE INDEX CONCURRENTLY idx_products_seller_id ON products(seller_id);
CREATE INDEX CONCURRENTLY idx_products_status ON products(status);
CREATE INDEX CONCURRENTLY idx_products_created_at ON products(created_at);

-- Partition large tables if needed
CREATE TABLE orders_2024 PARTITION OF orders
FOR VALUES FROM ('2024-01-01') TO ('2024-12-31');
```

### Caching Strategy

```javascript
// Redis caching example
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache product data
async function cacheProduct(productId, productData) {
  await client.setex(`product:${productId}`, 3600, JSON.stringify(productData));
}

// Get cached product
async function getCachedProduct(productId) {
  const cached = await client.get(`product:${productId}`);
  return cached ? JSON.parse(cached) : null;
}
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: marketplace-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketplace-backend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing

```nginx
# Upstream configuration for multiple backend instances
upstream backend_cluster {
    least_conn;
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}
```

This deployment guide provides comprehensive instructions for deploying the Multi-Vendor Marketplace platform across different environments and scaling scenarios.