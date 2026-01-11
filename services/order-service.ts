//services/order-service.ts
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderRequest, OrderStatus, WebSocketMessage } from '../types';
import { postgresClient } from '../db/postgres';
import { redisClient } from '../db/redis';
import pino from 'pino';

const logger = pino({ name: 'order-service' });

export class OrderService {
  async createOrder(request: OrderRequest): Promise<Order> {
    const order: Order = {
      orderId: `ord_${uuidv4()}`,
      ...request,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await postgresClient.saveOrder(order);
    await redisClient.setActiveOrder(order.orderId, order);

    logger.info({ orderId: order.orderId }, 'Order created');

    await this.publishStatusUpdate(order, 'Order created and queued for processing');

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updates: Partial<Order> = {}
  ): Promise<void> {
    const order = await postgresClient.getOrder(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const updatedOrder: Order = {
      ...order,
      status,
      ...updates,
      updatedAt: new Date(),
    };

    await postgresClient.saveOrder(updatedOrder);
    await redisClient.setActiveOrder(orderId, updatedOrder);

    const message = this.getStatusMessage(status, updates);
    await this.publishStatusUpdate(updatedOrder, message);

    logger.info({ orderId, status }, 'Order status updated');
  }

  private async publishStatusUpdate(order: Order, message: string): Promise<void> {
    const wsMessage: WebSocketMessage = {
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

    await redisClient.publishOrderUpdate(wsMessage);
  }

  private getStatusMessage(status: OrderStatus, updates: Partial<Order>): string {
    const messages: Record<OrderStatus, string> = {
      pending: 'Order received and pending processing',
      routing: 'Finding best DEX route',
      building: 'Building transaction',
      submitted: 'Transaction submitted to blockchain',
      confirmed: `Order executed successfully at ${updates.executedPrice?.toFixed(2)} via ${updates.selectedDex}`,
      failed: `Order failed: ${updates.error || 'Unknown error'}`,
    };

    return messages[status];
  }

  async getOrder(orderId: string): Promise<Order | null> {
    // Try Redis first (active orders)
    const activeOrder = await redisClient.getActiveOrder(orderId);
    if (activeOrder) return activeOrder;

    // Fallback to PostgreSQL
    return postgresClient.getOrder(orderId);
  }
}

export const orderService = new OrderService();