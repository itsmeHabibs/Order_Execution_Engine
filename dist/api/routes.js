"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const order_service_1 = require("../services/order-service");
const order_queue_1 = require("../queue/order-queue");
async function registerRoutes(fastify) {
    // Health check
    fastify.get('/health', async () => {
        return { status: 'healthy', timestamp: new Date().toISOString() };
    });
    // Execute market order
    fastify.post('/api/orders/execute', {
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
    }, async (request, reply) => {
        const orderRequest = request.body;
        // Create order
        const order = await order_service_1.orderService.createOrder(orderRequest);
        // Add to processing queue
        await order_queue_1.orderQueue.addOrder(order);
        return reply.code(201).send({ orderId: order.orderId });
    });
    // Get order status
    fastify.get('/api/orders/:orderId', async (request, reply) => {
        const { orderId } = request.params;
        const order = await order_service_1.orderService.getOrder(orderId);
        if (!order) {
            return reply.code(404).send({ error: 'Order not found' });
        }
        return order;
    });
}
//# sourceMappingURL=routes.js.map