import { Order } from '../types/order';

export class OrderBatcher {
  private batches: Map<string, Order[]> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;

  addOrder(order: Order) {
    const key = `${order.tokenIn}-${order.tokenOut}`;
    
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }
    
    this.batches.get(key)!.push(order);

    // Execute batch after 2 seconds or 5 orders
    if (this.batches.get(key)!.length >= 5) {
      this.executeBatch(key);
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.executeBatch(key);
      }, 2000);
    }
  }

  private async executeBatch(key: string) {
    const orders = this.batches.get(key) || [];
    if (orders.length === 0) return;

    const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);
    
    console.log(`🎯 Executing batch: ${orders.length} orders, total ${totalAmount} tokens`);
    
    // Execute as single large order for better pricing
    // Then distribute results proportionally
    
    this.batches.delete(key);
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}
