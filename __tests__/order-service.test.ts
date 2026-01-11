import { OrderService } from '../services/order-service';
import { postgresClient } from '../db/postgres';
import { redisClient } from '../db/redis';
import { OrderRequest } from '../types';

// Mock dependencies
jest.mock('../db/postgres');
jest.mock('../db/redis');

describe('OrderService', () => {
  let orderService: OrderService;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  test('should create order with correct initial state', async () => {
    const request: OrderRequest = {
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.5,
      slippage: 0.5,
    };

    (postgresClient.saveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.setActiveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.publishOrderUpdate as jest.Mock).mockResolvedValue(undefined);

    const order = await orderService.createOrder(request);

    expect(order.orderId).toMatch(/^ord_/);
    expect(order.status).toBe('pending');
    expect(order.tokenIn).toBe('SOL');
    expect(order.amount).toBe(1.5);
    expect(postgresClient.saveOrder).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending',
    }));
  });

  test('should update order status correctly', async () => {
    const orderId = 'ord_test123';
    const mockOrder = {
      orderId,
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.5,
      slippage: 0.5,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (postgresClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);
    (postgresClient.saveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.setActiveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.publishOrderUpdate as jest.Mock).mockResolvedValue(undefined);

    await orderService.updateOrderStatus(orderId, 'routing');

    expect(postgresClient.saveOrder).toHaveBeenCalledWith(expect.objectContaining({
      status: 'routing',
    }));
  });

  test('should throw error when updating non-existent order', async () => {
    (postgresClient.getOrder as jest.Mock).mockResolvedValue(null);

    await expect(
      orderService.updateOrderStatus('invalid_id', 'routing')
    ).rejects.toThrow('Order invalid_id not found');
  });

  test('should publish WebSocket updates on status change', async () => {
    const orderId = 'ord_test123';
    const mockOrder = {
      orderId,
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.5,
      slippage: 0.5,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (postgresClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);
    (postgresClient.saveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.setActiveOrder as jest.Mock).mockResolvedValue(undefined);
    (redisClient.publishOrderUpdate as jest.Mock).mockResolvedValue(undefined);

    await orderService.updateOrderStatus(orderId, 'confirmed', {
      txHash: '0xabc123',
      executedPrice: 150.5,
    });

    expect(redisClient.publishOrderUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId,
        status: 'confirmed',
        data: expect.objectContaining({
          txHash: '0xabc123',
          executedPrice: 150.5,
        }),
      })
    );
  });
});
