# Multi-Vendor Marketplace Monorepo Structure

## Root Directory Structure

```
marketplace-platform/
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml              # Continuous Integration
│       ├── deploy-backend.yml  # Backend deployment
│       ├── deploy-web.yml      # Web deployment
│       └── deploy-mobile.yml   # Mobile deployment
├── .vscode/                     # VSCode settings
│   ├── extensions.json
│   ├── settings.json
│   └── launch.json
├── apps/                        # Applications
│   ├── web/                     # Next.js Web App
│   ├── mobile/                  # React Native Mobile App
│   └── admin/                   # Admin Dashboard
├── packages/                    # Shared packages
│   ├── backend/                 # NestJS Backend
│   ├── ui/                      # Shared UI Components
│   ├── db/                      # Database schema and utilities
│   ├── shared/                  # Shared types and utilities
│   ├── config/                  # Shared configuration
│   └── eslint-config/           # ESLint configuration
├── docs/                        # Documentation
│   ├── api/                     # API documentation
│   ├── deployment/              # Deployment guides
│   └── development/             # Development guides
├── docker/                      # Docker configurations
│   ├── Dockerfile.backend
│   ├── Dockerfile.web
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── scripts/                     # Utility scripts
│   ├── build.sh
│   ├── deploy.sh
│   └── setup.sh
├── .env.example                 # Environment variables example
├── .gitignore
├── .nvmrc                       # Node version
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # PNPM workspace configuration
├── turbo.json                   # Turborepo configuration
└── README.md
```

## Apps Directory Structure

### apps/web (Next.js Web App)
```
apps/web/
├── public/                      # Static assets
│   ├── icons/
│   ├── images/
│   └── locales/                 # i18n files
├── src/
│   ├── app/                     # App Router
│   │   ├── (auth)/              # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/        # Dashboard routes group
│   │   │   ├── customer/
│   │   │   ├── seller/
│   │   │   └── layout.tsx
│   │   ├── (shop)/              # Shop routes group
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── profile/
│   │   │   ├── live/
│   │   │   └── layout.tsx
│   │   ├── admin/               # Admin routes
│   │   ├── api/                 # API routes (if needed)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # Components
│   │   ├── ui/                  # Base UI components (from shadcn/ui)
│   │   ├── forms/               # Form components
│   │   ├── layout/              # Layout components
│   │   ├── product/             # Product components
│   │   ├── cart/                # Cart components
│   │   ├── checkout/            # Checkout components
│   │   ├── live/                # Live streaming components
│   │   └── common/              # Common components
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useLiveStream.ts
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth utilities
│   │   ├── utils.ts             # General utilities
│   │   ├── validations.ts       # Form validations
│   │   └── constants.ts         # Constants
│   ├── store/                   # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── productStore.ts
│   │   └── liveStreamStore.ts
│   ├── types/                   # TypeScript types
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   └── order.ts
│   └── styles/                  # Styles
│       └── globals.css
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── turbo.json
```

### apps/mobile (React Native Mobile App)
```
apps/mobile/
├── assets/                      # Static assets
│   ├── fonts/
│   ├── icons/
│   └── images/
├── src/
│   ├── app/                     # Expo Router
│   │   ├── (auth)/              # Auth routes group
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── _layout.tsx
│   │   ├── (tabs)/              # Tab navigation
│   │   │   ├── home.tsx
│   │   │   ├── explore.tsx
│   │   │   ├── cart.tsx
│   │   │   ├── orders.tsx
│   │   │   ├── profile.tsx
│   │   │   └── _layout.tsx
│   │   ├── product/
│   │   │   ├── [id].tsx
│   │   │   └── _layout.tsx
│   │   ├── live/
│   │   │   ├── [id].tsx
│   │   │   └── _layout.tsx
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── seller/
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/              # Components
│   │   ├── ui/                  # Base UI components (from NativeWind/Tamagui)
│   │   ├── forms/               # Form components
│   │   ├── product/             # Product components
│   │   ├── cart/                # Cart components
│   │   ├── live/                # Live streaming components
│   │   └── common/              # Common components
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useProducts.ts
│   │   └── useLiveStream.ts
│   ├── lib/                     # Utilities
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth utilities
│   │   ├── utils.ts             # General utilities
│   │   ├── validations.ts       # Form validations
│   │   └── constants.ts         # Constants
│   ├── store/                   # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── productStore.ts
│   │   └── liveStreamStore.ts
│   ├── types/                   # TypeScript types
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   └── order.ts
│   └── styles/                  # Styles
│       └── globals.css
├── app.json                     # Expo configuration
├── babel.config.js
├── eas.json                     # Expo EAS configuration
├── metro.config.js
├── package.json
├── tamagui.config.ts
├── tsconfig.json
└── turbo.json
```

### apps/admin (Admin Dashboard)
```
apps/admin/
├── public/                      # Static assets
├── src/
│   ├── app/                     # App Router
│   │   ├── (auth)/              # Auth routes group
│   │   ├── dashboard/           # Dashboard routes
│   │   ├── users/               # User management
│   │   ├── sellers/             # Seller management
│   │   ├── products/            # Product management
│   │   ├── orders/              # Order management
│   │   ├── payments/            # Payment management
│   │   ├── analytics/           # Analytics
│   │   ├── settings/            # System settings
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/              # Components
│   │   ├── ui/                  # Base UI components (from shadcn/ui)
│   │   ├── forms/               # Form components
│   │   ├── tables/              # Table components
│   │   ├── charts/              # Chart components
│   │   └── layout/              # Layout components
│   ├── hooks/                   # Custom hooks
│   ├── lib/                     # Utilities
│   ├── store/                   # State management (Zustand)
│   └── types/                   # TypeScript types
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── turbo.json
```

## Packages Directory Structure

### packages/backend (NestJS Backend)
```
packages/backend/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   └── services/
│   ├── users/                   # Users module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── sellers/                 # Sellers module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── shops/                   # Shops module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── products/                # Products module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── categories/              # Categories module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── brands/                  # Brands module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── cart/                    # Cart module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── orders/                  # Orders module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── payments/                # Payments module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── services/
│   │   └── strategies/          # Payment strategies
│   ├── shipping/                # Shipping module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── vouchers/                # Vouchers module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── flash-sales/             # Flash sales module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── live-streaming/          # Live streaming module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── reviews/                 # Reviews module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── notifications/           # Notifications module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── chat/                    # Chat module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── analytics/               # Analytics module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── admin/                   # Admin module
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   └── services/
│   ├── common/                  # Common module
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   └── utils/
│   ├── config/                  # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── auth.config.ts
│   │   └── payment.config.ts
│   ├── database/                # Database
│   │   ├── migrations/
│   │   └── seeds/
│   ├── websocket/               # WebSocket
│   │   ├── gateways/
│   │   └── events/
│   ├── main.ts                  # Application entry point
│   └── app.module.ts            # Root module
├── test/                        # Tests
├── .env.example
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── turbo.json
```

### packages/ui (Shared UI Components)
```
packages/ui/
├── src/
│   ├── components/              # UI components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # Layout components
│   │   ├── product/            # Product components
│   │   ├── cart/               # Cart components
│   │   ├── checkout/           # Checkout components
│   │   ├── live/               # Live streaming components
│   │   └── common/             # Common components
│   ├── hooks/                  # Shared hooks
│   ├── lib/                    # Utilities
│   ├── styles/                 # Styles
│   └── index.ts                # Export all components
├── package.json
├── tsconfig.json
└── turbo.json
```

### packages/db (Database Schema and Utilities)
```
packages/db/
├── prisma/
│   ├── schema.prisma           # Prisma schema
│   ├── migrations/             # Database migrations
│   └── seeds/                  # Seed data
├── src/
│   ├── index.ts                # Export Prisma client
│   └── utils.ts                # Database utilities
├── package.json
├── tsconfig.json
└── turbo.json
```

### packages/shared (Shared Types and Utilities)
```
packages/shared/
├── src/
│   ├── types/                  # TypeScript types
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── utils/                  # Shared utilities
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── schemas/                # Validation schemas
│   │   ├── auth.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── index.ts
│   └── index.ts                # Export all
├── package.json
├── tsconfig.json
└── turbo.json
```

### packages/config (Shared Configuration)
```
packages/config/
├── src/
│   ├── eslint.config.js        # ESLint configuration
│   ├── prettier.config.js      # Prettier configuration
│   ├── tsconfig.base.json      # TypeScript base configuration
│   └── index.ts                # Export configurations
├── package.json
└── turbo.json
```

### packages/eslint-config (ESLint Configuration)
```
packages/eslint-config/
├── index.js                    # Base ESLint configuration
├── next.js                     # Next.js specific configuration
├── react-native.js             # React Native specific configuration
└── package.json
```

## Configuration Files

### Root package.json
```json
{
  "name": "marketplace-platform",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "db:generate": "pnpm --filter @marketplace/db db:generate",
    "db:push": "pnpm --filter @marketplace/db db:push",
    "db:migrate": "pnpm --filter @marketplace/db db:migrate",
    "db:seed": "pnpm --filter @marketplace/db db:seed"
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "turbo": "latest"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "packageManager": "pnpm@8.0.0"
}
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "clean": {
      "cache": false
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

This monorepo structure provides a scalable and maintainable foundation for our multi-vendor marketplace platform, with clear separation of concerns and shared code between applications.