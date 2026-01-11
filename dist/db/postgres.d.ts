import { Order } from '../types';
export declare class PostgresClient {
    private pool;
    constructor();
    connect(): Promise<void>;
    private initSchema;
    saveOrder(order: Order): Promise<void>;
    getOrder(orderId: string): Promise<Order | null>;
    close(): Promise<void>;
}
export declare const postgresClient: PostgresClient;
//# sourceMappingURL=postgres.d.ts.map