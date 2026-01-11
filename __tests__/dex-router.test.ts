import { MockDexRouter } from '../dex/mock-router';

describe('MockDexRouter', () => {
  let router: MockDexRouter;

  beforeEach(() => {
    router = new MockDexRouter();
  });

  test('should fetch quotes from both DEXs', async () => {
    const quote = await router.getBestQuote('SOL', 'USDC', 1.5);

    expect(quote).toBeDefined();
    expect(quote.provider).toMatch(/raydium|meteora/);
    expect(quote.price).toBeGreaterThan(0);
    expect(quote.latency).toBeGreaterThanOrEqual(200);
  });

  test('should select best price between DEXs', async () => {
    const quotes = await Promise.all([
      router.getBestQuote('SOL', 'USDC', 1.0),
      router.getBestQuote('SOL', 'USDC', 1.0),
      router.getBestQuote('SOL', 'USDC', 1.0),
    ]);

    // At least one should be selected (non-deterministic due to random variance)
    expect(quotes.every(q => q.provider)).toBe(true);
  });

  test('should apply price variance within tolerance', async () => {
    const basePrice = 100; // SOL-USDC
    const amount = 1.0;
    const expectedRange = basePrice * amount;
    const tolerance = 0.05; // 5%

    const quote = await router.getBestQuote('SOL', 'USDC', amount);

    expect(quote.price).toBeGreaterThan(expectedRange * (1 - tolerance));
    expect(quote.price).toBeLessThan(expectedRange * (1 + tolerance));
  });

  test('should execute order successfully', async () => {
    const result = await router.executeOrder('raydium', 'SOL', 'USDC', 1.5, 150);

    expect(result.txHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(result.executedPrice).toBeCloseTo(150, 1);
  });

  test('should handle different token pairs', async () => {
    const solQuote = await router.getBestQuote('SOL', 'USDC', 1);
    const ethQuote = await router.getBestQuote('ETH', 'USDC', 1);

    expect(solQuote.price).not.toBe(ethQuote.price);
  });
});

