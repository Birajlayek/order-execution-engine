import { DexQuote, DexExecutionResult } from '../types/dex';
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
