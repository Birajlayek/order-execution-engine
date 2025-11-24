import { orderService } from './orderService';
import { dexRouter } from './dexRouter';
import { logger } from '../utils/logger';

export class AdvancedOrderExecutor {
  private priceWatchers: Map<string, NodeJS.Timeout> = new Map();

  // Limit Order: Execute when price reaches target
  async createLimitOrder(orderId: string, targetPrice: number, side: 'buy' | 'sell') {
    logger.log('limit_order_created', { orderId, targetPrice, side });

    const watcherId = setInterval(async () => {
      const order = await orderService.getOrder(orderId);
      if (!order) {
        clearInterval(watcherId);
        return;
      }

      const quote = await dexRouter.getOptimalRoute(
        order.tokenIn,
        order.tokenOut,
        order.amount
      );

      const shouldExecute = 
        (side === 'buy' && quote.price <= targetPrice) ||
        (side === 'sell' && quote.price >= targetPrice);

      if (shouldExecute) {
        logger.log('limit_order_triggered', { 
          orderId, 
          targetPrice, 
          actualPrice: quote.price 
        });
        
        // Execute the order
        await dexRouter.executeSwap(quote, orderId);
        
        clearInterval(watcherId);
        this.priceWatchers.delete(orderId);
      }
    }, 2000); // Check every 2 seconds

    this.priceWatchers.set(orderId, watcherId);
  }

  // Stop-Loss: Auto-sell if price drops below threshold
  async createStopLoss(orderId: string, stopPrice: number) {
    logger.log('stop_loss_created', { orderId, stopPrice });

    const watcherId = setInterval(async () => {
      const order = await orderService.getOrder(orderId);
      if (!order) {
        clearInterval(watcherId);
        return;
      }

      const quote = await dexRouter.getOptimalRoute(
        order.tokenIn,
        order.tokenOut,
        order.amount
      );

      if (quote.price <= stopPrice) {
        logger.log('stop_loss_triggered', { 
          orderId, 
          stopPrice, 
          actualPrice: quote.price 
        });
        
        // Emergency sell
        await dexRouter.executeSwap(quote, orderId);
        
        clearInterval(watcherId);
        this.priceWatchers.delete(orderId);
      }
    }, 1000); // Check every second for stop-loss
  }

  cancelOrder(orderId: string) {
    const watcher = this.priceWatchers.get(orderId);
    if (watcher) {
      clearInterval(watcher);
      this.priceWatchers.delete(orderId);
      logger.log('order_cancelled', { orderId });
    }
  }
}

export const advancedOrderExecutor = new AdvancedOrderExecutor();
