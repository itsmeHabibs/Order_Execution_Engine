export type OrderStatus = 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
export type DexProvider = 'raydium' | 'meteora';
export interface OrderRequest {
    tokenIn: string;
    tokenOut: string;
    amount: number;
    slippage: number;
}
export interface Order extends OrderRequest {
    orderId: string;
    status: OrderStatus;
    selectedDex?: DexProvider;
    executedPrice?: number;
    txHash?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WebSocketMessage {
    orderId: string;
    status: OrderStatus;
    message: string;
    timestamp: string;
    data?: {
        txHash?: string;
        executedPrice?: number;
        selectedDex?: DexProvider;
        error?: string;
    };
}
export interface DexQuote {
    provider: DexProvider;
    price: number;
    latency: number;
}
//# sourceMappingURL=index.d.ts.map