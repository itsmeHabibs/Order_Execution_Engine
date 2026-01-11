//config/index.ts
import { config } from 'dotenv';

config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  REDIS: {
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD,
  },
  
  POSTGRES: {
    HOST: process.env.POSTGRES_HOST || 'localhost',
    PORT: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    DATABASE: process.env.POSTGRES_DB || 'orders',
    USER: process.env.POSTGRES_USER || 'postgres',
    PASSWORD: process.env.POSTGRES_PASSWORD || 'postgres',
  },
  
  QUEUE: {
    MAX_CONCURRENT: 10,
    MAX_RETRIES: 3,
    BACKOFF_DELAY: 2000, // ms
  },
  
  DEX: {
    QUOTE_LATENCY_MS: 200,
    PRICE_VARIANCE: 0.05, // 5%
  },
};