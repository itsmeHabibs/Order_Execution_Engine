import { Order, OrderRequest, OrderStatus } from '../types';
export declare class OrderService {
    createOrder(request: OrderRequest): Promise<Order>;
    updateOrderStatus(orderId: string, status: OrderStatus, updates?: Partial<Order>): Promise<void>;
    private publishStatusUpdate;
    private getStatusMessage;
    getOrder(orderId: string): Promise<Order | null>;
}
export declare const orderService: OrderService;
//# sourceMappingURL=order-service.d.ts.map