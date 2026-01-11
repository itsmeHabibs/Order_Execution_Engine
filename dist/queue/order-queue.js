"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderQueue = exports.OrderQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../db/redis");
const order_service_1 = require("../services/order-service");
const mock_router_1 = require("../dex/mock-router");
const config_1 = require("../config");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({ name: 'order-queue' });
class OrderQueue {
    queue;
    worker;
    constructor() {
        const connection = {
            host: config_1.CONFIG.REDIS.HOST,
            port: config_1.CONFIG.REDIS.PORT,
            password: config_1.CONFIG.REDIS.PASSWORD,
        };
        this.queue = new bullmq_1.Queue('orders', { connection });
        this.worker = new bullmq_1.Worker('orders', async (job) => {
            return this.processOrder(job.data);
        }, {
            connection,
            concurrency: config_1.CONFIG.QUEUE.MAX_CONCURRENT,
            limiter: {
                max: 100,
                duration: 60000, // 100 orders per minute
            },
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.worker.on('completed', (job) => {
            logger.info({ jobId: job.id }, 'Job completed successfully');
        });
        this.worker.on('failed', (job, err) => {
            logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
        });
        this.worker.on('error', (err) => {
            logger.error({ error: err.message }, 'Worker error');
        });
    }
    async addOrder(order) {
        await this.queue.add('execute', order, {
            attempts: config_1.CONFIG.QUEUE.MAX_RETRIES,
            backoff: {
                type: 'exponential',
                delay: config_1.CONFIG.QUEUE.BACKOFF_DELAY,
            },
            removeOnComplete: {
                count: 1000,
                age: 24 * 3600, // 24 hours
            },
            removeOnFail: {
                count: 5000,
            },
        });
        logger.info({ orderId: order.orderId }, 'Order added to queue');
    }
    async processOrder(order) {
        const { orderId, tokenIn, tokenOut, amount, slippage } = order;
        try {
            logger.info({ orderId }, 'Processing order');
            // Stage 1: Routing
            await order_service_1.orderService.updateOrderStatus(orderId, 'routing');
            const bestQuote = await mock_router_1.mockDexRouter.getBestQuote(tokenIn, tokenOut, amount);
            // Check slippage tolerance
            const expectedMinPrice = bestQuote.price * (1 - slippage / 100);
            if (bestQuote.price < expectedMinPrice) {
                throw new Error(`Price ${bestQuote.price} exceeds slippage tolerance`);
            }
            // Stage 2: Building
            await order_service_1.orderService.updateOrderStatus(orderId, 'building', {
                selectedDex: bestQuote.provider,
            });
            // Stage 3: Submitted
            await order_service_1.orderService.updateOrderStatus(orderId, 'submitted');
            const { txHash, executedPrice } = await mock_router_1.mockDexRouter.executeOrder(bestQuote.provider, tokenIn, tokenOut, amount, bestQuote.price);
            // Stage 4: Confirmed
            await order_service_1.orderService.updateOrderStatus(orderId, 'confirmed', {
                txHash,
                executedPrice,
            });
            await redis_1.redisClient.deleteActiveOrder(orderId);
            logger.info({ orderId, txHash }, 'Order completed successfully');
        }
        catch (error) {
            logger.error({ orderId, error: error.message }, 'Order processing failed');
            await order_service_1.orderService.updateOrderStatus(orderId, 'failed', {
                error: error.message,
            });
            await redis_1.redisClient.deleteActiveOrder(orderId);
            throw error; // Re-throw for retry logic
        }
    }
    async close() {
        await this.worker.close();
        await this.queue.close();
    }
}
exports.OrderQueue = OrderQueue;
exports.orderQueue = new OrderQueue();
//# sourceMappingURL=order-queue.js.map