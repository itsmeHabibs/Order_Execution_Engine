import { Order } from '../types';
export declare class OrderQueue {
    private queue;
    private worker;
    constructor();
    private setupEventHandlers;
    addOrder(order: Order): Promise<void>;
    private processOrder;
    close(): Promise<void>;
}
export declare const orderQueue: OrderQueue;
//# sourceMappingURL=order-queue.d.ts.map