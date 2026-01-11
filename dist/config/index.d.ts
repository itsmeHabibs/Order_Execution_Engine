export declare const CONFIG: {
    PORT: number;
    NODE_ENV: string;
    REDIS: {
        HOST: string;
        PORT: number;
        PASSWORD: string | undefined;
    };
    POSTGRES: {
        HOST: string;
        PORT: number;
        DATABASE: string;
        USER: string;
        PASSWORD: string;
    };
    QUEUE: {
        MAX_CONCURRENT: number;
        MAX_RETRIES: number;
        BACKOFF_DELAY: number;
    };
    DEX: {
        QUOTE_LATENCY_MS: number;
        PRICE_VARIANCE: number;
    };
};
//# sourceMappingURL=index.d.ts.map