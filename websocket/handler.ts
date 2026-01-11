//websocket/handler.ts
import { FastifyInstance } from 'fastify';
import { redisClient } from '../db/redis';
import { WebSocketMessage } from '../types';
import pino from 'pino';

const logger = pino({ name: 'websocket' });

export async function registerWebSocket(fastify: FastifyInstance) {
  fastify.get(
    '/ws/orders/:orderId',
    { websocket: true },
    (connection, request) => {
      const { orderId } = request.params as { orderId: string };

      logger.info({ orderId }, 'WebSocket connection established');

      // Subscribe to order updates
      const handleMessage = (message: WebSocketMessage) => {
        connection.socket.send(JSON.stringify(message));
      };

      redisClient.subscribeToOrder(orderId, handleMessage);

      // Handle disconnection
      connection.socket.on('close', async () => {
        logger.info({ orderId }, 'WebSocket connection closed');
        await redisClient.unsubscribeFromOrder(orderId);
      });

      connection.socket.on('error', (error:Error) => {
        logger.error({ orderId, error }, 'WebSocket error');
      });

      // Send initial connection message
      connection.socket.send(
        JSON.stringify({
          orderId,
          status: 'connected',
          message: 'WebSocket connection established',
          timestamp: new Date().toISOString(),
        })
      );
    }
  );
}