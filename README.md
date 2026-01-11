# Market Order Execution Engine

A production-grade, low-latency crypto market order execution engine with real-time WebSocket updates, queue-based processing, and DEX routing.

## 🏗️ Architecture Overview
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/orders/execute
       │
       ▼
┌─────────────────────────────────────┐
│         Fastify API Server          │
│  ┌──────────────┐  ┌─────────────┐ │
│  │  HTTP Route  │  │  WebSocket  │ │
│  └──────┬───────┘  └──────▲──────┘ │
└─────────┼──────────────────┼────────┘
          │                  │
          ▼                  │
┌─────────────────────┐     │
│    BullMQ Queue     │     │
│   (Redis-backed)    │     │
│  • Max 10 concurrent│     │
│  • 100 orders/min   │     │
│  • 3 retries        │     │
└──────────┬──────────┘     │
           │                 │
           ▼                 │
┌─────────────────────┐     │
│   Order Processor   │     │
│                     │     │
│  1. Routing         │     │
│  2. Building        │     │
│  3. Submission      │     │
│  4. Confirmation    │     │
└──────────┬──────────┘     │
           │                 │
           ▼                 │
┌─────────────────────┐     │
│   DEX Router        │     │
│  • Raydium (mock)   │     │
│  • Meteora (mock)   │     │
└──────────┬──────────┘     │
           │                 │
           ▼                 │
┌─────────────────────┐     │
│   Redis Pub/Sub     │─────┘
│  (Real-time updates)│
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│    PostgreSQL       │
│  (Order History)    │
└─────────────────────┘
```

## 🚀 Features

✅ **Market Order Execution** - Immediate execution at best available price  
✅ **DEX Routing** - Automated best-price selection between Raydium & Meteora  
✅ **Real-time Updates** - WebSocket lifecycle events for every order  
✅ **Queue-based Processing** - BullMQ with 10 concurrent workers  
✅ **Retry Logic** - 3 attempts with exponential backoff  
✅ **Persistence** - PostgreSQL for history, Redis for active orders  

## 📊 Order Lifecycle States
```
pending → routing → building → submitted → confirmed
   │                                          ↓
   └─────────────────► failed ◄──────────────┘
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Installation Steps
```bash
# 1. Clone repository
git clone <repo-url>
cd order-execution-engine

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Start infrastructure (Redis + PostgreSQL)
docker-compose up -d

# 5. Start development server
npm run dev
```

The server will start on `http://localhost:3000`

## 🧪 Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📦 Deployment

### Using Docker
```bash
# Build and run everything
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Deploy to Render/Railway/Fly.io

1. Connect your GitHub repository
2. Set environment variables from `.env.example`
3. Deploy from `main` branch

## 🔍 API Usage

### 1. Execute Market Order
```bash
POST http://localhost:3000/api/orders/execute
Content-Type: application/json

{
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amount": 1.5,
  "slippage": 0.5
}
```

**Response:**
```json
{
  "orderId": "ord_a1b2c3d4"
}
```

### 2. Connect to WebSocket for Real-time Updates
```javascript
// Using browser WebSocket API
const ws = new WebSocket('ws://localhost:3000/ws/orders/ord_a1b2c3d4');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log(update);
  // {"orderId": "ord_a1b2c3d4", "status": "pending", ...}
  // {"orderId": "ord_a1b2c3d4", "status": "routing", ...}
  // {"orderId": "ord_a1b2c3d4", "status": "confirmed", ...}
};
```

### 3. Get Order Status
```bash
GET http://localhost:3000/api/orders/ord_a1b2c3d4
```

## 📈 Extending to Limit & Sniper Orders

### Limit Orders
Add a `limitPrice` field and modify execution logic to:
1. Store limit orders in Redis sorted set (by price)
2. Create a price monitoring worker
3. Execute when market price crosses limit threshold

### Sniper Orders
Implement a mempool monitoring service that:
1. Subscribes to pending Solana transactions
2. Detects high-value liquidity events
3. Triggers immediate execution with priority fees

## 📁 Environment Variables

See `.env.example` for all configuration options.
```bash
NODE_ENV=development
PORT=3000
REDIS_HOST=localhost
POSTGRES_HOST=localhost
# ... etc
```

## 🎯 Performance

- **Throughput**: 100 orders/minute
- **Concurrency**: 10 simultaneous executions
- **Latency**: ~500ms end-to-end
- **Retry**: 3 attempts with exponential backoff

## 📝 License

MIT
```

Created by : Ashutosh Swain
mail id: ashutosh.ooes8@gmail.com

---

# File Structure
```
order-execution-engine/
├── src/
│   ├── api/
│   │   └── routes.ts
│   ├── websocket/
│   │   └── handler.ts
│   ├── queue/
│   │   └── order-queue.ts
│   ├── dex/
│   │   └── mock-router.ts
│   ├── services/
│   │   └── order-service.ts
│   ├── db/
│   │   ├── postgres.ts
│   │   └── redis.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── dex-router.test.ts
│   │   ├── order-service.test.ts
│   │   ├── order-queue.test.ts
│   │   ├── websocket.test.ts
│   │   └── integration.test.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── postman_collection.json
└── README.md