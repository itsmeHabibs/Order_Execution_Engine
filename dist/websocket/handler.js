"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWebSocket = registerWebSocket;
const redis_1 = require("../db/redis");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'websocket' });
async function registerWebSocket(fastify) {
    fastify.get('/ws/orders/:orderId', { websocket: true }, (connection, request) => {
        const { orderId } = request.params;
        logger.info({ orderId }, 'WebSocket connection established');
        // Subscribe to order updates
        const handleMessage = (message) => {
            connection.socket.send(JSON.stringify(message));
        };
        redis_1.redisClient.subscribeToOrder(orderId, handleMessage);
        // Handle disconnection
        connection.socket.on('close', async () => {
            logger.info({ orderId }, 'WebSocket connection closed');
            await redis_1.redisClient.unsubscribeFromOrder(orderId);
        });
        connection.socket.on('error', (error) => {
            logger.error({ orderId, error }, 'WebSocket error');
        });
        // Send initial connection message
        connection.socket.send(JSON.stringify({
            orderId,
            status: 'connected',
            message: 'WebSocket connection established',
            timestamp: new Date().toISOString(),
        }));
    });
}
//# sourceMappingURL=handler.js.map