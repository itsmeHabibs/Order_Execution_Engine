"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresClient = exports.PostgresClient = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
class PostgresClient {
    pool;
    constructor() {
        this.pool = new pg_1.Pool({
            host: config_1.CONFIG.POSTGRES.HOST,
            port: config_1.CONFIG.POSTGRES.PORT,
            database: config_1.CONFIG.POSTGRES.DATABASE,
            user: config_1.CONFIG.POSTGRES.USER,
            password: config_1.CONFIG.POSTGRES.PASSWORD,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });
    }
    async connect() {
        await this.pool.connect();
        await this.initSchema();
    }
    async initSchema() {
        const client = await this.pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          order_id VARCHAR(255) PRIMARY KEY,
          token_in VARCHAR(50) NOT NULL,
          token_out VARCHAR(50) NOT NULL,
          amount DECIMAL(20, 8) NOT NULL,
          slippage DECIMAL(5, 2) NOT NULL,
          status VARCHAR(20) NOT NULL,
          selected_dex VARCHAR(20),
          executed_price DECIMAL(20, 8),
          tx_hash VARCHAR(255),
          error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      `);
        }
        finally {
            client.release();
        }
    }
    async saveOrder(order) {
        await this.pool.query(`INSERT INTO orders (
        order_id, token_in, token_out, amount, slippage, 
        status, selected_dex, executed_price, tx_hash, error, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (order_id) 
      DO UPDATE SET
        status = $6,
        selected_dex = $7,
        executed_price = $8,
        tx_hash = $9,
        error = $10,
        updated_at = $12`, [
            order.orderId,
            order.tokenIn,
            order.tokenOut,
            order.amount,
            order.slippage,
            order.status,
            order.selectedDex,
            order.executedPrice,
            order.txHash,
            order.error,
            order.createdAt,
            order.updatedAt,
        ]);
    }
    async getOrder(orderId) {
        const result = await this.pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
        if (result.rows.length === 0)
            return null;
        const row = result.rows[0];
        return {
            orderId: row.order_id,
            tokenIn: row.token_in,
            tokenOut: row.token_out,
            amount: parseFloat(row.amount),
            slippage: parseFloat(row.slippage),
            status: row.status,
            selectedDex: row.selected_dex,
            executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
            txHash: row.tx_hash,
            error: row.error,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async close() {
        await this.pool.end();
    }
}
exports.PostgresClient = PostgresClient;
exports.postgresClient = new PostgresClient();
//# sourceMappingURL=postgres.js.map