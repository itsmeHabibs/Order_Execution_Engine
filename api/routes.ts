//api/routes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { orderService } from '../services/order-service';
import { orderQueue } from '../queue/order-queue';
import { OrderRequest } from '../types';

interface ExecuteOrderRequest {
  Body: OrderRequest;
}

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
  });

  // Execute market order
  fastify.post<ExecuteOrderRequest>(
    '/api/orders/execute',
    {
      schema: {
        body: {
          type: 'object',
          required: ['tokenIn', 'tokenOut', 'amount', 'slippage'],
          properties: {
            tokenIn: { type: 'string' },
            tokenOut: { type: 'string' },
            amount: { type: 'number', minimum: 0 },
            slippage: { type: 'number', minimum: 0, maximum: 100 },
          },
        },
      },
    },
    async (request: FastifyRequest<ExecuteOrderRequest>, reply: FastifyReply) => {
      const orderRequest = request.body;

      // Create order
      const order = await orderService.createOrder(orderRequest);

      // Add to processing queue
      await orderQueue.addOrder(order);

      return reply.code(201).send({ orderId: order.orderId });
    }
  );

  // Get order status
  fastify.get<{ Params: { orderId: string } }>(
    '/api/orders/:orderId',
    async (request, reply) => {
      const { orderId } = request.params;
      const order = await orderService.getOrder(orderId);

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      return order;
    }
  );
}