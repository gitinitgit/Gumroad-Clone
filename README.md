# 🛍️ Gumroad Clone

A production-grade digital marketplace for selling digital products — inspired by [Gumroad](https://gumroad.com). Built with a modern full-stack TypeScript architecture featuring React, Node.js, Express, MongoDB, and Razorpay payments.

![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?logo=razorpay&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)

---

## Features

### 🛒 Marketplace
- **Product Discovery** — Browse and search digital products with filtering
- **Product Pages** — Rich product detail pages with Markdown content support
- **Shopping Cart** — Persistent cart with Zustand state management
- **Checkout** — Secure payment processing via Razorpay
- **Digital Library** — Buyers can access purchased products from their library

### Creator Dashboard
- **Product Management** — Create, edit, and delete digital products
- **Sales Analytics** — Track revenue, orders, and product performance with Recharts
- **Order Management** — View and manage customer orders
- **Settings** — Update profile and account settings

### Authentication & Security
- **Clerk Authentication** — Social login, email/password, and session management
- **Webhook Integration** — Clerk & Razorpay webhook event processing
- **Rate Limiting** — API rate limiting to prevent abuse
- **Input Sanitization** — HTML sanitization and Zod schema validation
- **Helmet** — HTTP security headers

### Production Ready
- **Docker Compose** — One-command deployment with MongoDB, Redis, and Nginx
- **PM2 Cluster Mode** — Multi-core process management with auto-restart
- **Winston Logging** — Structured logging with file rotation
- **Redis Caching** — BullMQ job queues and caching layer
- **Cloudinary** — Cloud-based media uploads (with local fallback)

---

## Architecture

```
gumroad-clone/
├── client/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages
│   │   │   ├── auth/       # Login, Register
│   │   │   ├── checkout/   # Checkout flow
│   │   │   ├── dashboard/  # Creator dashboard
│   │   │   └── products/   # Product pages
│   │   ├── services/       # API client (Axios)
│   │   ├── store/          # Zustand state (auth, cart)
│   │   └── styles/         # Global CSS + Tailwind
│   └── vite.config.ts
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/         # Database, email, env, CORS, Redis
│   │   ├── controllers/    # Route handlers
│   │   ├── middlewares/     # Auth, error handling, rate limit, upload
│   │   ├── models/         # Mongoose schemas
│   │   │   ├── User
│   │   │   ├── Product
│   │   │   ├── Order
│   │   │   ├── Payment
│   │   │   ├── Purchase
│   │   │   └── WebhookEvent
│   │   ├── routes/         # Express route definitions
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Helpers, error classes, logger
│   │   └── validators/     # Zod request validators
│   ├── content/            # Static product Markdown files
│   └── scripts/            # Seed scripts
│
├── shared/                 # Shared TypeScript types
├── tests/                  # Performance & security tests
├── docker-compose.yml      # Docker orchestration
├── ecosystem.config.js     # PM2 production config
├── nginx.production.conf   # Nginx reverse proxy config
└── tsconfig.base.json      # Shared TypeScript config
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **npm** ≥ 10
- **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
- **Clerk** account ([dashboard.clerk.com](https://dashboard.clerk.com))
- **Razorpay** account ([dashboard.razorpay.com](https://dashboard.razorpay.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gitinitgit/Gumroad-Clone.git
   cd Gumroad-Clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your credentials:
   | Variable | Description |
   |----------|-------------|
   | `MONGO_URI` | MongoDB connection string |
   | `CLERK_SECRET_KEY` | Clerk API secret key |
   | `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
   | `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
   | `RAZORPAY_KEY_SECRET` | Razorpay key secret |
   | `VITE_CLERK_PUBLISHABLE_KEY` | Clerk key for the frontend |

4. **Start the development servers**
   ```bash
   # Start both client & server concurrently
   npm run dev

   # Or start individually
   npm run dev:server   # Backend  → http://localhost:5000
   npm run dev:client   # Frontend → http://localhost:5173
   ```

5. **(Optional) Seed the database**
   ```bash
   npm run seed              # Create admin user
   npm run seed:products     # Populate sample products
   ```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both client & server in development mode |
| `npm run dev:server` | Start backend only (tsx watch) |
| `npm run dev:client` | Start frontend only (Vite) |
| `npm run build` | Build all packages for production |
| `npm run build:server` | Build server only |
| `npm run build:client` | Build client only |
| `npm start` | Start production server |
| `npm run seed` | Seed admin user |
| `npm run lint` | Lint all packages |
| `npm run clean` | Remove all node_modules |

---

## API Routes

All API routes are prefixed with `/api/v1`.

| Route | Description |
|-------|-------------|
| `GET /health` | Health check endpoint |
| `/api/v1/auth/*` | Authentication (register, login, sessions) |
| `/api/v1/users/*` | User profile management |
| `/api/v1/products/*` | Product CRUD operations |
| `/api/v1/checkout/*` | Payment and checkout flow |
| `/api/v1/purchases/*` | Purchase history and digital library |
| `/api/v1/upload/*` | File upload (Cloudinary / local) |
| `/api/v1/analytics/*` | Sales and revenue analytics |
| `/api/v1/admin/*` | Admin-only operations |
| `/api/v1/webhooks/*` | Clerk & Razorpay webhook handlers |
| `/api/v1/notifications/*` | User notifications |

---

## Docker Deployment

Spin up the entire stack with Docker Compose:

```bash
docker-compose up -d
```

This starts:
- **MongoDB 7** on port `27017`
- **Redis 7** on port `6379`
- **API Server** on port `5000`
- **Client** (Nginx) on port `5173`

---

## Production Deployment

### With PM2

```bash
# Build all packages
npm run build

# Start with PM2 (cluster mode, all CPU cores)
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit
pm2 logs
```

### Nginx

An Nginx reverse proxy config is included at `nginx.production.conf` for:
- SSL termination
- Static file serving
- API proxying
- Gzip compression

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Recharts, Lucide Icons |
| **Backend** | Node.js, Express, TypeScript, Mongoose, Zod |
| **Auth** | Clerk (React + Express SDKs) |
| **Payments** | Razorpay |
| **Database** | MongoDB (Atlas / local) |
| **Caching** | Redis, BullMQ |
| **Email** | Nodemailer (SMTP / Ethereal for dev) |
| **Media** | Cloudinary (with local upload fallback) |
| **Logging** | Winston |
| **DevOps** | Docker, Docker Compose, PM2, Nginx |
| **Testing** | k6 load/stress tests, security test suites |

---

##  Environment Variables

See [`.env.example`](.env.example) for the full list of configuration options including:

- **App** — `NODE_ENV`, `PORT`, `CLIENT_URL`, `SERVER_URL`
- **Database** — `MONGO_URI`
- **Auth** — `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`
- **Payments** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- **Redis** — `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **Email** — `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- **Cloudinary** — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Frontend** — `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_RAZORPAY_KEY_ID`

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/gitinitgit">gitinitgit</a>
</p>
