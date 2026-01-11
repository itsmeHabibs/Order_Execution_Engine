"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderService = exports.OrderService = void 0;
const uuid_1 = require("uuid");
const postgres_1 = require("../db/postgres");
const redis_1 = require("../db/redis");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'order-service' });
class OrderService {
    async createOrder(request) {
        const order = {
            orderId: `ord_${(0, uuid_1.v4)()}`,
            ...request,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await postgres_1.postgresClient.saveOrder(order);
        await redis_1.redisClient.setActiveOrder(order.orderId, order);
        logger.info({ orderId: order.orderId }, 'Order created');
        await this.publishStatusUpdate(order, 'Order created and queued for processing');
        return order;
    }
    async updateOrderStatus(orderId, status, updates = {}) {
        const order = await postgres_1.postgresClient.getOrder(orderId);
        if (!order) {
            throw new Error(`Order ${orderId} not found`);
        }
        const updatedOrder = {
            ...order,
            status,
            ...updates,
            updatedAt: new Date(),
        };
        await postgres_1.postgresClient.saveOrder(updatedOrder);
        await redis_1.redisClient.setActiveOrder(orderId, updatedOrder);
        const message = this.getStatusMessage(status, updates);
        await this.publishStatusUpdate(updatedOrder, message);
        logger.info({ orderId, status }, 'Order status updated');
    }
    async publishStatusUpdate(order, message) {
        const wsMessage = {
            orderId: order.orderId,
            status: order.status,
            message,
            timestamp: new Date().toISOString(),
            data: {
                selectedDex: order.selectedDex,
                executedPrice: order.executedPrice,
                txHash: order.txHash,
                error: order.error,
            },
        };
        await redis_1.redisClient.publishOrderUpdate(wsMessage);
    }
    getStatusMessage(status, updates) {
        const messages = {
            pending: 'Order received and pending processing',
            routing: 'Finding best DEX route',
            building: 'Building transaction',
            submitted: 'Transaction submitted to blockchain',
            confirmed: `Order executed successfully at ${updates.executedPrice?.toFixed(2)} via ${updates.selectedDex}`,
            failed: `Order failed: ${updates.error || 'Unknown error'}`,
        };
        return messages[status];
    }
    async getOrder(orderId) {
        // Try Redis first (active orders)
        const activeOrder = await redis_1.redisClient.getActiveOrder(orderId);
        if (activeOrder)
            return activeOrder;
        // Fallback to PostgreSQL
        return postgres_1.postgresClient.getOrder(orderId);
    }
}
exports.OrderService = OrderService;
exports.orderService = new OrderService();
//# sourceMappingURL=order-service.js.map