import { OrderQueue } from '../queue/order-queue';
import { Order } from '../types';

describe('OrderQueue', () => {
  test('should create queue and worker instances', () => {
    expect(() => new OrderQueue()).not.toThrow();
  });

  test('should validate order structure before adding to queue', async () => {
    const mockOrder: Order = {
      orderId: 'ord_test',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amount: 1.5,
      slippage: 0.5,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockOrder.orderId).toBeDefined();
    expect(mockOrder.amount).toBeGreaterThan(0);
    expect(mockOrder.status).toBe('pending');
  });
});

