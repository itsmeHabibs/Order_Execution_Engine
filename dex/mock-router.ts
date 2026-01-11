//dex/mock-router.ts
import { DexProvider, DexQuote } from '../types';
import { CONFIG } from '../config';
import pino from 'pino';

const logger = pino({ name: 'dex-router' });

export class MockDexRouter {
  /**
   * Fetch quotes from multiple DEXs and select the best price
   */
  async getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    logger.info({ tokenIn, tokenOut, amount }, '[ROUTER] Fetching quotes from DEXs');

    // Fetch quotes in parallel
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.fetchQuote('raydium', tokenIn, tokenOut, amount),
      this.fetchQuote('meteora', tokenIn, tokenOut, amount),
    ]);

    logger.info(
      `[ROUTER] Raydium price: ${raydiumQuote.price.toFixed(2)} | Meteora price: ${meteoraQuote.price.toFixed(2)}`
    );

    // Select best price (highest for sell, lowest for buy)
    const bestQuote = raydiumQuote.price > meteoraQuote.price ? raydiumQuote : meteoraQuote;
    
    logger.info(`[ROUTER] Selected ${bestQuote.provider} (best price: ${bestQuote.price.toFixed(2)})`);

    return bestQuote;
  }

  /**
   * Mock quote fetch with simulated latency and price variance
   */
  private async fetchQuote(
    provider: DexProvider,
    tokenIn: string,
    tokenOut: string,
    amount: number
  ): Promise<DexQuote> {
    const startTime = Date.now();

    // Simulate network latency
    await this.sleep(CONFIG.DEX.QUOTE_LATENCY_MS);

    // Mock base price (SOL/USDC example: ~$100)
    const basePrice = this.getBasePriceForPair(tokenIn, tokenOut);
    
    // Add random variance (-5% to +5%)
    const variance = (Math.random() * 2 - 1) * CONFIG.DEX.PRICE_VARIANCE;
    const price = basePrice * amount * (1 + variance);

    const latency = Date.now() - startTime;

    return { provider, price, latency };
  }

  private getBasePriceForPair(tokenIn: string, tokenOut: string): number {
    // Mock price mapping
    const priceMap: Record<string, number> = {
      'SOL-USDC': 100,
      'SOL-USDT': 100,
      'ETH-USDC': 2500,
      'BTC-USDC': 45000,
    };

    const pair = `${tokenIn}-${tokenOut}`;
    return priceMap[pair] || 1;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simulate transaction execution
   */
  async executeOrder(
    provider: DexProvider,
    tokenIn: string,
    tokenOut: string,
    amount: number,
    expectedPrice: number
  ): Promise<{ txHash: string; executedPrice: number }> {
    logger.info({ provider, tokenIn, tokenOut, amount }, '[ROUTER] Executing order on DEX');

    // Simulate execution time
    await this.sleep(300);

    // Mock transaction hash
    const txHash = `0x${Math.random().toString(16).substring(2, 66)}`;
    
    // Executed price might slightly differ due to slippage
    const slippageVariance = (Math.random() * 2 - 1) * 0.002; // ±0.2%
    const executedPrice = expectedPrice * (1 + slippageVariance);

    logger.info({ txHash, executedPrice }, '[ROUTER] Order executed successfully');

    return { txHash, executedPrice };
  }
}

export const mockDexRouter = new MockDexRouter();