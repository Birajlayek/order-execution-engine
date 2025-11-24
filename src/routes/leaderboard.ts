import { FastifyPluginAsync } from 'fastify';
import { query } from '../config/database';

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    const result = await query(`
      SELECT 
        dex_used as dex,
        COUNT(*) as total_orders,
        AVG(executed_price) as avg_price,
        MIN(executed_price) as best_price,
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / COUNT(*) as success_rate
      FROM orders
      WHERE dex_used IS NOT NULL
      GROUP BY dex_used
      ORDER BY success_rate DESC, avg_price ASC
    `);

    const leaderboard = result.rows.map((row, index) => ({
      rank: index + 1,
      dex: row.dex,
      totalOrders: parseInt(row.total_orders),
      avgPrice: parseFloat(row.avg_price),
      bestPrice: parseFloat(row.best_price),
      avgExecutionTime: parseFloat(row.avg_time),
      successRate: parseFloat(row.success_rate)
    }));

    return reply.send({ leaderboard });
  });
};
