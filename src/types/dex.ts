export type DexName = 'raydium' | 'meteora';

export interface DexQuote {
  dex: DexName;
  price: number;
  fee: number;
  liquidity: number;
  estimatedOutput: number;
  timestamp: Date;
}

export interface DexExecutionResult {
  txHash: string;
  price: number;
  amount: number;
  dex: DexName;
  gasUsed: number;
}

export interface PricePoint {
  dex: DexName;
  price: number;
  timestamp: Date;
}
