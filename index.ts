import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { CONFIG } from './config';
import { postgresClient } from './db/postgres';
import { redisClient } from './db/redis';
import { registerRoutes } from './api/routes';
import { registerWebSocket } from './websocket/handler';
import pino from 'pino';

const logger = pino({
  level: CONFIG.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: CONFIG.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: { colorize: true },
      }
    : undefined,
});

const fastify = Fastify({ logger: true });

async function start() {
  try {
    await postgresClient.connect();
    await redisClient.connect();
    logger.info('Database connections established');

    await fastify.register(websocket);

    await registerRoutes(fastify);
    await registerWebSocket(fastify);

    await fastify.listen({ port: CONFIG.PORT, host: '0.0.0.0' });
    logger.info(`Server running on port ${CONFIG.PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await fastify.close();
  await postgresClient.close();
  await redisClient.close();
  process.exit(0);
});

start();
