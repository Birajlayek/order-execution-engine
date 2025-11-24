export type OrderType = 'market' | 'limit' | 'sniper';
export type OrderStatus = 'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';
export type OrderSide = 'buy' | 'sell';

export interface Order {
  id: string;
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  orderType: OrderType;
  status: OrderStatus;
  side?: OrderSide;
  limitPrice?: number;
  targetToken?: string;
  executedPrice?: number;
  executedAmount?: number;
  dexUsed?: string;
  txHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDTO {
  userId: string;
  tokenIn: string;
  tokenOut: string;
  amount: number;
  orderType: OrderType;
  side?: OrderSide;
  limitPrice?: number;
  targetToken?: string;
}
