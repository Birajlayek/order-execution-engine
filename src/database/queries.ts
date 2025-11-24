export const QUERIES = {
  CREATE_ORDER: `
    INSERT INTO orders (id, user_id, token_in, token_out, amount, order_type, status, side, limit_price, target_token, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,
  
  GET_ORDER: 'SELECT * FROM orders WHERE id = $1',
  
  UPDATE_ORDER_STATUS: 'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
  
  GET_USER_ORDERS: 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
  
  SAVE_QUOTE: `
    INSERT INTO dex_quotes (order_id, dex, price, fee, liquidity, estimated_output)
    VALUES ($1, $2, $3, $4, $5, $6)
  `,
  
  LOG_EXECUTION: `
    INSERT INTO execution_logs (order_id, event, data)
    VALUES ($1, $2, $3)
  `,
};
