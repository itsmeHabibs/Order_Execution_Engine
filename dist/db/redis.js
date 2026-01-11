"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.RedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
class RedisClient {
    client;
    publisher;
    subscriber;
    constructor() {
        const redisConfig = {
            host: config_1.CONFIG.REDIS.HOST,
            port: config_1.CONFIG.REDIS.PORT,
            password: config_1.CONFIG.REDIS.PASSWORD,
            maxRetriesPerRequest: null,
        };
        this.client = new ioredis_1.default(redisConfig);
        this.publisher = new ioredis_1.default(redisConfig);
        this.subscriber = new ioredis_1.default(redisConfig);
    }
    async connect() {
        await Promise.all([
            this.client.ping(),
            this.publisher.ping(),
            this.subscriber.ping(),
        ]);
    }
    async publishOrderUpdate(message) {
        await this.publisher.publish(`order:${message.orderId}`, JSON.stringify(message));
    }
    async subscribeToOrder(orderId, callback) {
        const channel = `order:${orderId}`;
        await this.subscriber.subscribe(channel);
        this.subscriber.on('message', (ch, msg) => {
            if (ch === channel) {
                callback(JSON.parse(msg));
            }
        });
    }
    async unsubscribeFromOrder(orderId) {
        await this.subscriber.unsubscribe(`order:${orderId}`);
    }
    async setActiveOrder(orderId, data) {
        await this.client.set(`active:${orderId}`, JSON.stringify(data), 'EX', 3600);
    }
    async getActiveOrder(orderId) {
        const data = await this.client.get(`active:${orderId}`);
        return data ? JSON.parse(data) : null;
    }
    async deleteActiveOrder(orderId) {
        await this.client.del(`active:${orderId}`);
    }
    async close() {
        await Promise.all([
            this.client.quit(),
            this.publisher.quit(),
            this.subscriber.quit(),
        ]);
    }
}
exports.RedisClient = RedisClient;
exports.redisClient = new RedisClient();
//# sourceMappingURL=redis.js.map