import Redis from 'ioredis';
import { WebSocketMessage } from '../types';
export declare class RedisClient {
    client: Redis;
    publisher: Redis;
    subscriber: Redis;
    constructor();
    connect(): Promise<void>;
    publishOrderUpdate(message: WebSocketMessage): Promise<void>;
    subscribeToOrder(orderId: string, callback: (message: WebSocketMessage) => void): Promise<void>;
    unsubscribeFromOrder(orderId: string): Promise<void>;
    setActiveOrder(orderId: string, data: any): Promise<void>;
    getActiveOrder(orderId: string): Promise<any | null>;
    deleteActiveOrder(orderId: string): Promise<void>;
    close(): Promise<void>;
}
export declare const redisClient: RedisClient;
//# sourceMappingURL=redis.d.ts.map