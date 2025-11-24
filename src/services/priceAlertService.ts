import { dexRouter } from './dexRouter';
import { logger } from '../utils/logger';

interface PriceAlert {
  tokenPair: string;
  targetPrice: number;
  condition: 'above' | 'below';
  callback: (currentPrice: number) => void;
}

export class PriceAlertService {
  private alerts: Map<string, PriceAlert[]> = new Map();

  addAlert(alert: PriceAlert) {
    const key = alert.tokenPair;
    if (!this.alerts.has(key)) {
      this.alerts.set(key, []);
    }
    this.alerts.get(key)!.push(alert);
    logger.log('price_alert_added', { tokenPair: alert.tokenPair, targetPrice: alert.targetPrice });
  }

  async checkAlerts(tokenIn: string, tokenOut: string) {
    const key = `${tokenIn}-${tokenOut}`;
    const alerts = this.alerts.get(key) || [];

    const quote = await dexRouter.getOptimalRoute(tokenIn, tokenOut, 1);
    const currentPrice = quote.price;

    alerts.forEach(alert => {
      const triggered = 
        (alert.condition === 'above' && currentPrice > alert.targetPrice) ||
        (alert.condition === 'below' && currentPrice < alert.targetPrice);

      if (triggered) {
        logger.log('price_alert_triggered', { 
          tokenPair: key, 
          targetPrice: alert.targetPrice,
          currentPrice 
        });
        alert.callback(currentPrice);
      }
    });
  }
}

export const priceAlertService = new PriceAlertService();
