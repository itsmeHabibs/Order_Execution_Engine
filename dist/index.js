"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const websocket_1 = __importDefault(require("@fastify/websocket"));
const config_1 = require("./config");
const postgres_1 = require("./db/postgres");
const redis_1 = require("./db/redis");
const routes_1 = require("./api/routes");
const handler_1 = require("./websocket/handler");
const pino_1 = __importDefault(require("pino"));
const logger = (0, pino_1.default)({
    level: config_1.CONFIG.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: config_1.CONFIG.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: { colorize: true },
        }
        : undefined,
});
const fastify = (0, fastify_1.default)({ logger: true });
async function start() {
    try {
        await postgres_1.postgresClient.connect();
        await redis_1.redisClient.connect();
        logger.info('Database connections established');
        await fastify.register(websocket_1.default);
        await (0, routes_1.registerRoutes)(fastify);
        await (0, handler_1.registerWebSocket)(fastify);
        await fastify.listen({ port: config_1.CONFIG.PORT, host: '0.0.0.0' });
        logger.info(`Server running on port ${config_1.CONFIG.PORT}`);
    }
    catch (error) {
        logger.error(error);
        process.exit(1);
    }
}
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await fastify.close();
    await postgres_1.postgresClient.close();
    await redis_1.redisClient.close();
    process.exit(0);
});
start();
//# sourceMappingURL=index.js.map