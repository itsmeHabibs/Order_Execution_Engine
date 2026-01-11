import { DexProvider, DexQuote } from '../types';
export declare class MockDexRouter {
    /**
     * Fetch quotes from multiple DEXs and select the best price
     */
    getBestQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote>;
    /**
     * Mock quote fetch with simulated latency and price variance
     */
    private fetchQuote;
    private getBasePriceForPair;
    private sleep;
    /**
     * Simulate transaction execution
     */
    executeOrder(provider: DexProvider, tokenIn: string, tokenOut: string, amount: number, expectedPrice: number): Promise<{
        txHash: string;
        executedPrice: number;
    }>;
}
export declare const mockDexRouter: MockDexRouter;
//# sourceMappingURL=mock-router.d.ts.map