# 📚 HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY DỰ ÁN MARKETPLACE

## 🚀 TỔNG QUAN

Hướng dẫn chi tiết cài đặt và chạy dự án Multi-Vendor Marketplace Platform trên môi trường development và production.

## 📋 YÊU CẦU HỆ THỐNG

### **Phần mềm bắt buộc**
- **Node.js:** 18.x hoặc cao hơn
- **pnpm:** 8.x hoặc cao hơn (khuyến nghị)
- **Docker:** 20.x hoặc cao hơn
- **Docker Compose:** 2.x hoặc cao hơn
- **PostgreSQL:** 14.x hoặc cao hơn
- **Redis:** 6.x hoặc cao hơn
- **Git:** 2.x hoặc cao hơn

### **IDE khuyến nghị**
- **Visual Studio Code** với các extension:
  - TypeScript
  - Prisma
  - Docker
  - ESLint
  - Prettier

## 🛠️ CÀI ĐẶT MÔI TRƯỜNG

### **1. Clone dự án**
```bash
git clone <repository-url>
cd marketplace-platform
```

### **2. Cài đặt Node.js và pnpm**
```bash
# Cài đặt Node.js (nếu chưa có)
# Tải về từ: https://nodejs.org/

# Cài đặt pnpm
npm install -g pnpm

# Kiểm tra phiên bản
node --version
pnpm --version
```

### **3. Cài đặt dependencies**
```bash
# Cài đặt tất cả dependencies cho monorepo
pnpm install

# Hoặc cài đặt từng package
pnpm install --recursive
```

## 🗄️ CÀI ĐẶT DATABASE

### **1. PostgreSQL**
```bash
# Sử dụng Docker (khuyến nghị)
docker run --name postgres-marketplace \
  -e POSTGRES_DB=marketplace \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  -d postgres:14

# Hoặc cài đặt本地
# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql
brew services start postgresql

# Windows:
# Tải về từ: https://www.postgresql.org/download/windows/
```

### **2. Redis**
```bash
# Sử dụng Docker (khuyến nghị)
docker run --name redis-marketplace \
  -p 6379:6379 \
  -d redis:6-alpine

# Hoặc cài đặt本地
# Ubuntu/Debian:
sudo apt install redis-server

# macOS:
brew install redis
brew services start redis

# Windows:
# Tải về từ: https://redis.io/download
```

### **3. Meilisearch (cho search)**
```bash
# Sử dụng Docker (khuyến nghị)
docker run --name meilisearch-marketplace \
  -e MEILI_MASTER_KEY=masterKey123 \
  -p 7700:7700 \
  -d getmeili/meilisearch:v1.0

# Hoặc cài đặt本地
# Tải về từ: https://www.meilisearch.com/docs/learn/getting_started/installation
```

## ⚙️ CẤU HÌNH ENVIRONMENT

### **1. Tạo file environment**
```bash
# Copy file environment mẫu
cp .env.example .env

# Copy cho từng app
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/admin/.env.example apps/admin/.env
cp packages/backend/.env.example packages/backend/.env
```

### **2. Cấu hình file .env chính**
```env
# Database
DATABASE_URL="postgresql://admin:password123@localhost:5432/marketplace"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Clerk Authentication
CLERK_API_KEY="your-clerk-api-key"
CLERK_WEBHOOK_SECRET="your-clerk-webhook-secret"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey123"

# Firebase (Notifications)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# OneSignal
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_API_KEY="your-onesignal-api-key"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
VNPAY_TMN_CODE="your-vnpay-tmn-code"
VNPAY_SECRET_KEY="your-vnpay-secret-key"
MOMO_PARTNER_CODE="your-momo-partner-code"
MOMO_ACCESS_KEY="your-momo-access-key"
MOMO_SECRET_KEY="your-momo-secret-key"

# Shipping Providers
GHN_API_TOKEN="your-ghn-api-token"
GHN_SHOP_ID="your-ghn-shop-id"
GHTK_API_TOKEN="your-ghtk-api-token"
JNT_API_KEY="your-jnt-api-key"
JNT_USERNAME="your-jnt-username"

# Live Streaming
AGORA_APP_ID="your-agora-app-id"
AGORA_APP_CERTIFICATE="your-agora-app-certificate"
LIVEKIT_API_KEY="your-livekit-api-key"
LIVEKIT_SECRET="your-livekit-secret"
LIVEKIT_HOST="your-livekit-host"

# Email Service
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# Application
APP_NAME="Marketplace Platform"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
PORT=3001
```

### **3. Cấu hình environment cho từng app**

**apps/web/.env**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
```

**apps/mobile/.env**
```env
EXPO_PUBLIC_API_URL="http://localhost:3001"
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
```

**apps/admin/.env**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
```

## 🗄️ SETUP DATABASE

### **1. Generate Prisma Client**
```bash
cd packages/backend
pnpm prisma generate
```

### **2. Run Database Migrations**
```bash
cd packages/backend
pnpm prisma db push
# Hoặc
pnpm prisma migrate dev --name init
```

### **3. Seed Database (tùy chọn)**
```bash
cd packages/backend
pnpm prisma db seed
```

## 🚀 CHẠY DỰ ÁN

### **1. Development Mode**

**Chạy tất cả services:**
```bash
# Từ root directory
pnpm dev
```

**Chạy từng service riêng:**
```bash
# Backend API
cd packages/backend
pnpm dev

# Web Frontend
cd apps/web
pnpm dev

# Admin Dashboard
cd apps/admin
pnpm dev

# Mobile App (cần Expo CLI)
cd apps/mobile
npx expo start
```

### **2. Production Mode với Docker**

**Sử dụng Docker Compose:**
```bash
# Build và chạy tất cả services
docker-compose -f docker-compose.prod.yml up --build

# Chạy ở background
docker-compose -f docker-compose.prod.yml up -d --build

# Xem logs
docker-compose -f docker-compose.prod.yml logs -f

# Dừng services
docker-compose -f docker-compose.prod.yml down
```

**Build riêng từng service:**
```bash
# Build backend
docker build -t marketplace-backend ./packages/backend

# Build web frontend
docker build -t marketplace-web ./apps/web

# Build admin dashboard
docker build -t marketplace-admin ./apps/admin
```

## 🌐 TRUY CẬP ỨNG DỤNG

Sau khi chạy thành công, bạn có thể truy cập:

- **Web Frontend:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **Backend API:** http://localhost:3002
- **API Documentation:** http://localhost:3002/api-docs
- **Meilisearch:** http://localhost:7700
- **Mobile App:** Mở Expo Go app và quét QR code

## 🧪 TESTING

### **1. Run Tests**
```bash
# Test tất cả packages
pnpm test

# Test backend
cd packages/backend
pnpm test

# Test với coverage
pnpm test --coverage

# Test trong watch mode
pnpm test --watch
```

### **2. E2E Testing**
```bash
# Install Playwright
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e
```

## 🔧 TROUBLESHOOTING

### **1. Common Issues**

**Port conflicts:**
```bash
# Kiểm tra port đang sử dụng
netstat -tulpn | grep :3000

# Kill process
sudo kill -9 <PID>
```

**Database connection errors:**
```bash
# Kiểm tra PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Kiểm tra connection
psql -h localhost -U admin -d marketplace
```

**Redis connection errors:**
```bash
# Kiểm tra Redis status
redis-cli ping

# Restart Redis
sudo systemctl restart redis
```

**Permission errors:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
chmod -R 755 .
```

### **2. Debug Mode**

**Backend debug:**
```bash
cd packages/backend
pnpm dev:debug
```

**Enable verbose logging:**
```bash
# Set environment variable
export DEBUG=*
pnpm dev
```

## 📱 MOBILE APP SETUP

### **1. Expo CLI Setup**
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Login vào Expo
npx expo login

# Start development server
cd apps/mobile
npx expo start
```

### **2. Build Mobile App**
```bash
# Build cho Android
npx expo build:android

# Build cho iOS
npx expo build:ios

# Build với EAS (khuyến nghị)
npx eas build --platform android
npx eas build --platform ios
```

### **3. Run trên Device**
```bash
# Install Expo Go app trên điện thoại
# Quét QR code từ terminal
# Hoặc:
npx expo install --fix
npx expo start --clear
```

## 🚀 DEPLOYMENT

### **1. Production Deployment**

**Sử dụng Docker Compose:**
```bash
# Setup production environment
cp .env.example .env.production

# Edit production variables
nano .env.production

# Deploy
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d
```

**Manual Deployment:**
```bash
# Build production
pnpm build

# Start production server
pnpm start
```

### **2. CI/CD với GitHub Actions**

```bash
# Setup GitHub secrets
# - DATABASE_URL
# - JWT_SECRET
# - CLERK_API_KEY
# - etc.

# Push code để trigger CI/CD
git add .
git commit -m "Deploy to production"
git push origin main
```

## 📊 MONITORING

### **1. Health Check**
```bash
# Backend health
curl http://localhost:3002/health

# Database health
curl http://localhost:3002/health/db

# Redis health
curl http://localhost:3002/health/redis
```

### **2. Logs**
```bash
# View application logs
docker-compose logs -f backend

# View specific service logs
docker-compose logs -f web
docker-compose logs -f admin
```

### **3. Performance Monitoring**
```bash
# Access metrics dashboard
http://localhost:3002/metrics

# View performance stats
curl http://localhost:3002/performance/stats
```

## 🔄 MAINTENANCE

### **1. Database Backup**
```bash
# Backup database
pg_dump -h localhost -U admin marketplace > backup.sql

# Restore database
psql -h localhost -U admin marketplace < backup.sql
```

### **2. Update Dependencies**
```bash
# Check for updates
pnpm outdated

# Update all packages
pnpm update

# Update specific package
pnpm update package-name
```

### **3. Security Updates**
```bash
# Audit for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix
```

## 📞 SUPPORT

### **1. Documentation**
- API Documentation: http://localhost:3002/api-docs
- Architecture Guide: `docs/architecture.md`
- API Reference: `docs/api.md`

### **2. Common Issues**
- Check `TROUBLESHOOTING.md` for common problems
- Review logs for error details
- Check environment configuration

### **3. Getting Help**
- Create issue on GitHub repository
- Check existing issues and discussions
- Review documentation and examples

---

## 🎉 HOÀN THÀNH!

Sau khi làm theo hướng dẫn này, bạn sẽ có:
- ✅ Marketplace platform đầy đủ chức năng
- ✅ Môi trường development và production
- ✅ Tất cả services đang chạy
- ✅ Database được setup và seeded
- ✅ Mobile app sẵn sàng để test

Chúc bạn thành công với dự án Marketplace Platform! 🚀