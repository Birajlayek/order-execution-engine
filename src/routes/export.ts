import { FastifyPluginAsync } from 'fastify';
import { query } from '../config/database';

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/csv', async (request, reply) => {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    
    const csv = [
      'ID,User ID,Token In,Token Out,Amount,Order Type,Status,DEX Used,Executed Price,Created At',
      ...result.rows.map(row => 
        `${row.id},${row.user_id},${row.token_in},${row.token_out},${row.amount},${row.order_type},${row.status},${row.dex_used || 'N/A'},${row.executed_price || 'N/A'},${row.created_at}`
      )
    ].join('\n');

    reply
      .header('Content-Type', 'text/csv')
      .header('Content-Disposition', 'attachment; filename=orders.csv')
      .send(csv);
  });

  fastify.get('/json', async (request, reply) => {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename=orders.json')
      .send(result.rows);
  });
};
