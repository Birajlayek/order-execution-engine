import os

files = {
    "src/services/circuitBreaker.ts": '''import { logger } from '../utils/logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private name: string, private failureThreshold = 5, private recoveryTimeout = 60000) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.log('circuit_breaker_open', { name: this.name });
    }
  }

  getState() { return this.state; }
}
''',

    "src/services/dexRouter.ts": '''import { DexQuote, DexExecutionResult } from '../types/dex';
import { CircuitBreaker } from './circuitBreaker';
import { logger } from '../utils/logger';

export class SmartDexRouter {
  private raydiumBreaker = new CircuitBreaker('raydium');
  private meteoraBreaker = new CircuitBreaker('meteora');

  async getOptimalRoute(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    const quotes = await this.getQuotes(tokenIn, tokenOut, amount);
    quotes.sort((a, b) => b.estimatedOutput - a.estimatedOutput);
    logger.log('route_selected', { selectedDex: quotes[0].dex });
    return quotes[0];
  }

  private async getQuotes(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote[]> {
    const quotes: DexQuote[] = [];
    try {
      const raydiumQuote = await this.raydiumBreaker.execute(() => 
        this.getRaydiumQuote(tokenIn, tokenOut, amount)
      );
      quotes.push(raydiumQuote);
    } catch (error) {
      logger.error('raydium_quote_failed', error as Error);
    }

    try {
      const meteoraQuote = await this.meteoraBreaker.execute(() => 
        this.getMeteorQuote(tokenIn, tokenOut, amount)
      );
      quotes.push(meteoraQuote);
    } catch (error) {
      logger.error('meteora_quote_failed', error as Error);
    }

    if (quotes.length === 0) throw new Error('No DEX quotes available');
    return quotes;
  }

  private async getRaydiumQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await this.sleep(100 + Math.random() * 200);
    const price = 100 * (0.98 + Math.random() * 0.04);
    return {
      dex: 'raydium',
      price,
      fee: 0.003,
      liquidity: 1000000,
      estimatedOutput: amount * price * (1 - 0.003),
      timestamp: new Date(),
    };
  }

  private async getMeteorQuote(tokenIn: string, tokenOut: string, amount: number): Promise<DexQuote> {
    await this.sleep(100 + Math.random() * 200);
    const price = 100 * (0.97 + Math.random() * 0.05);
    return {
      dex: 'meteora',
      price,
      fee: 0.002,
      liquidity: 800000,
      estimatedOutput: amount * price * (1 - 0.002),
      timestamp: new Date(),
    };
  }

  async executeSwap(quote: DexQuote, orderId: string): Promise<DexExecutionResult> {
    await this.sleep(2000 + Math.random() * 1000);
    return {
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      price: quote.price,
      amount: quote.estimatedOutput,
      dex: quote.dex,
      gasUsed: 5000,
    };
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const dexRouter = new SmartDexRouter();
''',

    "src/services/orderService.ts": '''import { v4 as uuidv4 } from 'uuid';
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
'''
}

for filepath, content in files.items():
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"✓ Created {filepath}")

print("\n✅ Service files created!")
