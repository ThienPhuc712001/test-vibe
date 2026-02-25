# Multi-Vendor Marketplace Platform

A comprehensive e-commerce marketplace platform similar to Shopee, Lazada, and TikTok Shop, built with modern technologies and best practices.

## 🚀 Technology Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Cache & Queue**: Redis + BullMQ
- **Real-time**: Socket.io + WebSocket
- **Search**: Meilisearch
- **File Storage**: Cloudinary
- **Authentication**: Clerk

### Frontend (Web)
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query

### Mobile App
- **Framework**: React Native + Expo (SDK 52)
- **Language**: TypeScript
- **Styling**: NativeWind + Tamagui
- **Navigation**: Expo Router

### Admin Dashboard
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui

### Infrastructure
- **Monorepo**: Turborepo
- **Package Manager**: PNPM
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Web) + Expo EAS (Mobile)

## 📋 Prerequisites

- Node.js 18+ 
- PNPM 8+
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Git

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd marketplace-platform
```

### 2. Install Dependencies

```bash
# Install PNPM if not already installed
npm install -g pnpm

# Install all dependencies
pnpm install
```

### 3. Environment Setup

Create environment files for each application:

```bash
# Backend environment
cp packages/backend/.env.example packages/backend/.env

# Web environment
cp apps/web/.env.example apps/web/.env

# Mobile environment
cp apps/mobile/.env.example apps/mobile/.env

# Admin environment
cp apps/admin/.env.example apps/admin/.env
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Seed the database (optional)
pnpm db:seed
```

### 5. Start Development Servers

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
pnpm --filter @marketplace/backend dev
pnpm --filter @marketplace/web dev
pnpm --filter @marketplace/mobile dev
pnpm --filter @marketplace/admin dev
```

## 🌐 Access Points

Once all services are running:

- **Web App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **API Documentation**: http://localhost:3002/api
- **Database Studio**: `pnpm db:studio`

## 📱 Mobile App Development

### iOS Development

```bash
# Install Expo CLI
npm install -g @expo/cli

# Start the development server
pnpm --filter @marketplace/mobile dev

# Run on iOS simulator
pnpm --filter @marketplace/mobile ios
```

### Android Development

```bash
# Start the development server
pnpm --filter @marketplace/mobile dev

# Run on Android emulator
pnpm --filter @marketplace/mobile android
```

### Expo Development Build

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create development build
eas build --platform ios --profile development
eas build --platform android --profile development
```

## 🐳 Docker Development

### Development Environment

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

### Production Environment

```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🚀 Deployment

### Backend Deployment

#### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
cd packages/backend
vercel --prod
```

#### Docker Deployment

```bash
# Build Docker image
docker build -f packages/backend/Dockerfile -t marketplace-backend .

# Run container
docker run -d -p 3002:3002 --env-file packages/backend/.env marketplace-backend
```

### Web App Deployment

#### Vercel Deployment

```bash
# Deploy to Vercel
cd apps/web
vercel --prod
```

#### Manual Deployment

```bash
# Build the application
pnpm --filter @marketplace/web build

# Start the production server
pnpm --filter @marketplace/web start
```

### Mobile App Deployment

#### Expo EAS Build

```bash
# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Admin Dashboard Deployment

#### Vercel Deployment

```bash
# Deploy to Vercel
cd apps/admin
vercel --prod
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/marketplace"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# External Services
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-meilisearch-api-key"

# Payment Gateways
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
VNPAY_TMN_CODE="your-vnpay-tmn-code"
VNPAY_SECRET_KEY="your-vnpay-secret-key"
MOMO_PARTNER_CODE="your-momo-partner-code"
MOMO_SECRET_KEY="your-momo-secret-key"

# Email
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="jpg,jpeg,png,gif,mp4,mov"

# App Settings
APP_NAME="Marketplace Platform"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3002"
```

#### Web App (.env.local)

```env
NEXT_PUBLIC_API_URL="http://localhost:3002"
NEXT_PUBLIC_WS_URL="ws://localhost:3002"
NEXT_PUBLIC_APP_NAME="Marketplace Platform"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
CLERK_WEBHOOK_SECRET="your-clerk-webhook-secret"

# Analytics
NEXT_PUBLIC_GA_ID="your-google-analytics-id"
```

#### Mobile App (.env)

```env
EXPO_PUBLIC_API_URL="http://localhost:3002"
EXPO_PUBLIC_WS_URL="ws://localhost:3002"
EXPO_PUBLIC_APP_NAME="Marketplace Platform"

# Expo Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"

# Push Notifications
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY="your-push-notification-key"
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @marketplace/backend test
pnpm --filter @marketplace/web test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:cov
```

### Test Types

- **Unit Tests**: Jest + Testing Library
- **Integration Tests**: Jest + Supertest
- **E2E Tests**: Playwright
- **Mobile Tests**: Jest + React Native Testing Library

## 📊 Monitoring & Analytics

### Application Monitoring

```bash
# Install monitoring dependencies
pnpm add @sentry/node @sentry/react

# Configure Sentry
# Add Sentry DSN to environment variables
SENTRY_DSN="your-sentry-dsn"
```

### Database Monitoring

```bash
# View database queries
pnpm db:studio

# Monitor Redis
redis-cli monitor
```

## 🔒 Security

### Security Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **API Keys**: Use environment variables for all API keys
3. **Authentication**: Implement proper JWT handling
4. **Input Validation**: Validate all user inputs
5. **Rate Limiting**: Implement API rate limiting
6. **HTTPS**: Use HTTPS in production
7. **CORS**: Configure CORS properly
8. **Dependencies**: Keep dependencies updated

### Security Scanning

```bash
# Run security audit
pnpm audit

# Fix security issues
pnpm audit fix
```

## 📈 Performance Optimization

### Backend Optimization

1. **Database Indexing**: Add proper indexes
2. **Caching**: Implement Redis caching
3. **Query Optimization**: Optimize database queries
4. **Pagination**: Implement proper pagination
5. **Compression**: Enable response compression

### Frontend Optimization

1. **Code Splitting**: Implement lazy loading
2. **Image Optimization**: Optimize images
3. **Bundle Size**: Monitor and reduce bundle size
4. **Caching**: Implement browser caching
5. **CDN**: Use CDN for static assets

## 🔄 CI/CD Pipeline

### GitHub Actions

The project includes GitHub Actions workflows for:

1. **Continuous Integration**: Run tests on every push
2. **Code Quality**: Run linting and formatting checks
3. **Security**: Run security audits
4. **Deployment**: Automatic deployment to staging/production

### Workflow Files

- `.github/workflows/ci.yml`: Continuous Integration
- `.github/workflows/deploy-backend.yml`: Backend Deployment
- `.github/workflows/deploy-web.yml`: Web App Deployment
- `.github/workflows/deploy-mobile.yml`: Mobile App Deployment

## 📚 Documentation

### API Documentation

- **Swagger UI**: Available at `/api` endpoint
- **Postman Collection**: Export from Swagger UI
- **API Examples**: Check `/docs/api` directory

### Code Documentation

- **JSDoc**: Used for code documentation
- **README**: Each package has its own README
- **Architecture**: Check `/docs/architecture`

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** your changes
5. **Commit** your changes
6. **Push** to your fork
7. **Create** a Pull Request

### Code Style

- **ESLint**: Configured for consistent code style
- **Prettier**: For code formatting
- **Husky**: Git hooks for pre-commit checks
- **Conventional Commits**: For commit messages

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Check DATABASE_URL
2. **Redis Connection**: Check REDIS_URL
3. **Port Conflicts**: Check if ports are in use
4. **Dependencies**: Clear node_modules and reinstall
5. **Environment**: Check all environment variables

### Debug Commands

```bash
# Clear all caches
pnpm clean

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Reset database
pnpm db:migrate reset

# Check logs
docker-compose logs -f
```

## 📞 Support

For support and questions:

1. **Documentation**: Check this README and package READMEs
2. **Issues**: Create an issue on GitHub
3. **Discussions**: Use GitHub Discussions
4. **Email**: Contact the development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS**: For the excellent backend framework
- **Next.js**: For the amazing React framework
- **Expo**: For the great React Native platform
- **Prisma**: For the modern database toolkit
- **Vercel**: For the hosting platform
- **GitHub**: For the CI/CD platform