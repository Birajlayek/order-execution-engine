import { v4 as uuidv4 } from 'uuid';
import { Order, CreateOrderDTO, OrderStatus } from '../types/order';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export class OrderService {
  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const order: Order = {
      id: uuidv4(),
      ...dto,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await query(
      `INSERT INTO orders (id, user_id, token_in, token_out, amount, order_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [order.id, order.userId, order.tokenIn, order.tokenOut, order.amount, order.orderType, order.status, order.createdAt, order.updatedAt]
    );

    logger.log('order_created', { orderId: order.id });
    return order;
  }

  async getOrder(orderId: string): Promise<Order | null> {
    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    return result.rows[0] || null;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, updates: Partial<Order> = {}): Promise<void> {
    const fields = ['status = $2', 'updated_at = $3'];
    const values: any[] = [orderId, status, new Date()];
    let idx = 4;

    if (updates.executedPrice) {
      fields.push(`executed_price = $${idx++}`);
      values.push(updates.executedPrice);
    }
    if (updates.dexUsed) {
      fields.push(`dex_used = $${idx++}`);
      values.push(updates.dexUsed);
    }
    if (updates.txHash) {
      fields.push(`tx_hash = $${idx++}`);
      values.push(updates.txHash);
    }
    if (updates.error) {
      fields.push(`error = $${idx++}`);
      values.push(updates.error);
    }

    await query(`UPDATE orders SET ${fields.join(', ')} WHERE id = $1`, values);
    logger.log('order_status_updated', { orderId, status });
  }
}

export const orderService = new OrderService();
