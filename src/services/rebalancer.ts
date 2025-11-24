export class PortfolioRebalancer {
  async calculateRebalance(currentHoldings: any, targetAllocation: any) {
    const totalValue = Object.values(currentHoldings).reduce((a: any, b: any) => a + b, 0) as number;
    const trades: any[] = [];

    for (const [token, targetPercent] of Object.entries(targetAllocation)) {
      const currentValue = currentHoldings[token] || 0;
      const targetValue = totalValue * (targetPercent as number);
      const difference = targetValue - currentValue;

      if (Math.abs(difference) > totalValue * 0.01) { // 1% threshold
        trades.push({
          token,
          action: difference > 0 ? 'buy' : 'sell',
          amount: Math.abs(difference),
          reason: `Rebalance to ${(targetPercent as number * 100)}% allocation`
        });
      }
    }

    return {
      totalValue,
      tradesNeeded: trades.length,
      trades
    };
  }
}

export const rebalancer = new PortfolioRebalancer();
