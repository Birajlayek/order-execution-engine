import { query } from '../config/database';

export class PricePredictor {
  async predictBestExecutionTime(tokenIn: string, tokenOut: string): Promise<{
    recommendation: string;
    confidence: number;
    reasoning: string;
  }> {
    // Get historical price data
    const history = await query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        AVG(executed_price) as avg_price,
        STDDEV(executed_price) as price_volatility,
        COUNT(*) as sample_size
      FROM orders
      WHERE token_in = $1 AND token_out = $2 AND status = 'confirmed'
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `, [tokenIn, tokenOut]);

    if (history.rows.length < 3) {
      return {
        recommendation: 'execute_now',
        confidence: 0.5,
        reasoning: 'Insufficient historical data. Execute immediately.'
      };
    }

    const currentHour = new Date().getHours();
    const currentData = history.rows.find(r => parseInt(r.hour) === currentHour);
    
    if (!currentData) {
      return {
        recommendation: 'execute_now',
        confidence: 0.6,
        reasoning: 'No data for current hour. Execute with caution.'
      };
    }

    // Find best hour (lowest average price)
    const bestHour = history.rows.reduce((best, row) => 
      parseFloat(row.avg_price) < parseFloat(best.avg_price) ? row : best
    );

    const currentPrice = parseFloat(currentData.avg_price);
    const bestPrice = parseFloat(bestHour.avg_price);
    const priceDiff = ((currentPrice - bestPrice) / bestPrice) * 100;

    if (Math.abs(priceDiff) < 2) {
      return {
        recommendation: 'execute_now',
        confidence: 0.85,
        reasoning: `Current price within 2% of optimal. Good time to execute.`
      };
    }

    if (priceDiff > 2) {
      return {
        recommendation: 'wait',
        confidence: 0.75,
        reasoning: `Price ${priceDiff.toFixed(2)}% higher than average. Consider waiting for hour ${bestHour.hour}.`
      };
    }

    return {
      recommendation: 'execute_now',
      confidence: 0.9,
      reasoning: `Price ${Math.abs(priceDiff).toFixed(2)}% better than average. Execute immediately!`
    };
  }
}

export const pricePredictor = new PricePredictor();
