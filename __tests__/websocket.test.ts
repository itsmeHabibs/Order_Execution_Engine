import { WebSocketMessage } from '../types';

describe('WebSocket Message Format', () => {
  test('should create valid WebSocket message', () => {
    const message: WebSocketMessage = {
      orderId: 'ord_test123',
      status: 'confirmed',
      message: 'Order executed successfully',
      timestamp: new Date().toISOString(),
      data: {
        txHash: '0xabc123',
        executedPrice: 150.5,
        selectedDex: 'raydium',
      },
    };

    expect(message.orderId).toBeDefined();
    expect(message.status).toBe('confirmed');
    expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(message.data?.txHash).toBeDefined();
  });

  test('should handle failed status with error', () => {
    const message: WebSocketMessage = {
      orderId: 'ord_test123',
      status: 'failed',
      message: 'Order failed',
      timestamp: new Date().toISOString(),
      data: {
        error: 'Insufficient liquidity',
      },
    };

    expect(message.status).toBe('failed');
    expect(message.data?.error).toBeDefined();
  });
});


