//queue/order-queue.ts
import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from '../db/redis';
import { orderService } from '../services/order-service';
import { mockDexRouter } from '../dex/mock-router';
import { Order } from '../types';
import { CONFIG } from '../config';
import pino from 'pino';

const logger = pino({ name: 'order-queue' });

export class OrderQueue {
  private queue: Queue;
  private worker: Worker;

  constructor() {
    const connection = {
      host: CONFIG.REDIS.HOST,
      port: CONFIG.REDIS.PORT,
      password: CONFIG.REDIS.PASSWORD,
    };

    this.queue = new Queue('orders', { connection });

    this.worker = new Worker(
      'orders',
      async (job: Job) => {
        return this.processOrder(job.data);
      },
      {
        connection,
        concurrency: CONFIG.QUEUE.MAX_CONCURRENT,
        limiter: {
          max: 100,
          duration: 60000, // 100 orders per minute
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
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

  async addOrder(order: Order): Promise<void> {
    await this.queue.add(
      'execute',
      order,
      {
        attempts: CONFIG.QUEUE.MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: CONFIG.QUEUE.BACKOFF_DELAY,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600, // 24 hours
        },
        removeOnFail: {
          count: 5000,
        },
      }
    );

    logger.info({ orderId: order.orderId }, 'Order added to queue');
  }

  private async processOrder(order: Order): Promise<void> {
    const { orderId, tokenIn, tokenOut, amount, slippage } = order;

    try {
      logger.info({ orderId }, 'Processing order');

      // Stage 1: Routing
      await orderService.updateOrderStatus(orderId, 'routing');
      const bestQuote = await mockDexRouter.getBestQuote(tokenIn, tokenOut, amount);

      // Check slippage tolerance
      const expectedMinPrice = bestQuote.price * (1 - slippage / 100);
      if (bestQuote.price < expectedMinPrice) {
        throw new Error(`Price ${bestQuote.price} exceeds slippage tolerance`);
      }

      // Stage 2: Building
      await orderService.updateOrderStatus(orderId, 'building', {
        selectedDex: bestQuote.provider,
      });

      // Stage 3: Submitted
      await orderService.updateOrderStatus(orderId, 'submitted');
      const { txHash, executedPrice } = await mockDexRouter.executeOrder(
        bestQuote.provider,
        tokenIn,
        tokenOut,
        amount,
        bestQuote.price
      );

      // Stage 4: Confirmed
      await orderService.updateOrderStatus(orderId, 'confirmed', {
        txHash,
        executedPrice,
      });

      await redisClient.deleteActiveOrder(orderId);

      logger.info({ orderId, txHash }, 'Order completed successfully');
    } catch (error: any) {
      logger.error({ orderId, error: error.message }, 'Order processing failed');

      await orderService.updateOrderStatus(orderId, 'failed', {
        error: error.message,
      });

      await redisClient.deleteActiveOrder(orderId);

      throw error; // Re-throw for retry logic
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }
}

export const orderQueue = new OrderQueue();