//db/redis.ts
import Redis from 'ioredis';
import { CONFIG } from '../config';
import { WebSocketMessage } from '../types';

export class RedisClient {
  public client: Redis;
  public publisher: Redis;
  public subscriber: Redis;

  constructor() {
    const redisConfig = {
      host: CONFIG.REDIS.HOST,
      port: CONFIG.REDIS.PORT,
      password: CONFIG.REDIS.PASSWORD,
      maxRetriesPerRequest: null,
    };

    this.client = new Redis(redisConfig);
    this.publisher = new Redis(redisConfig);
    this.subscriber = new Redis(redisConfig);
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.client.ping(),
      this.publisher.ping(),
      this.subscriber.ping(),
    ]);
  }

  async publishOrderUpdate(message: WebSocketMessage): Promise<void> {
    await this.publisher.publish(
      `order:${message.orderId}`,
      JSON.stringify(message)
    );
  }

  async subscribeToOrder(orderId: string, callback: (message: WebSocketMessage) => void): Promise<void> {
    const channel = `order:${orderId}`;
    await this.subscriber.subscribe(channel);
    
    this.subscriber.on('message', (ch, msg) => {
      if (ch === channel) {
        callback(JSON.parse(msg));
      }
    });
  }

  async unsubscribeFromOrder(orderId: string): Promise<void> {
    await this.subscriber.unsubscribe(`order:${orderId}`);
  }

  async setActiveOrder(orderId: string, data: any): Promise<void> {
    await this.client.set(`active:${orderId}`, JSON.stringify(data), 'EX', 3600);
  }

  async getActiveOrder(orderId: string): Promise<any | null> {
    const data = await this.client.get(`active:${orderId}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteActiveOrder(orderId: string): Promise<void> {
    await this.client.del(`active:${orderId}`);
  }

  async close(): Promise<void> {
    await Promise.all([
      this.client.quit(),
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }
}

export const redisClient = new RedisClient();