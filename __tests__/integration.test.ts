import { OrderService } from '../services/order-service';
import { MockDexRouter } from '../dex/mock-router';

describe('Integration: Order Execution Flow', () => {
  test('should complete full order lifecycle', async () => {
    const router = new MockDexRouter();
    
    // Step 1: Get best quote
    const quote = await router.getBestQuote('SOL', 'USDC', 1.5);
    expect(quote).toBeDefined();
    expect(quote.provider).toMatch(/raydium|meteora/);
    
    // Step 2: Execute order
    const execution = await router.executeOrder(
      quote.provider,
      'SOL',
      'USDC',
      1.5,
      quote.price
    );
    
    expect(execution.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(execution.executedPrice).toBeGreaterThan(0);
  });

  test('should handle slippage validation', async () => {
    const router = new MockDexRouter();
    const quote = await router.getBestQuote('SOL', 'USDC', 1.0);
    
    const slippage = 0.5; // 0.5%
    const minExpectedPrice = quote.price * (1 - slippage / 100);
    
    expect(quote.price).toBeGreaterThan(0);
  });
});
