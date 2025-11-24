import { FastifyPluginAsync } from 'fastify';
import { query } from '../config/database';

export const analyticsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/summary', async (request, reply) => {
    try {
      const totalOrders = await query('SELECT COUNT(*) as count FROM orders');
      
      const successfulOrders = await query(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'"
      );

      const avgExecutionTime = await query(`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time
        FROM orders 
        WHERE status = 'confirmed'
      `);

      const dexPerformance = await query(`
        SELECT 
          dex_used,
          COUNT(*) as orders_executed,
          AVG(executed_price) as avg_price
        FROM orders
        WHERE status = 'confirmed' AND dex_used IS NOT NULL
        GROUP BY dex_used
      `);

      const total = parseInt(totalOrders.rows[0].count) || 1;
      const successful = parseInt(successfulOrders.rows[0].count) || 0;

      return reply.send({
        totalOrders: total,
        successfulOrders: successful,
        successRate: successful / total,
        averageExecutionTime: parseFloat(avgExecutionTime.rows[0]?.avg_time || '0'),
        dexPerformance: dexPerformance.rows,
      });
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch analytics' });
    }
  });
};
