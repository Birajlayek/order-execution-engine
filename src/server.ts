import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyCors from '@fastify/cors';
import dotenv from 'dotenv';
import { orderRoutes } from './routes/orders';
import { websocketRoutes } from './routes/websocket';
import { analyticsRoutes } from './routes/analytics';
import { logger } from './utils/logger';

dotenv.config();

async function startServer() {
  const fastify = Fastify({
    logger: false,
  });

  // Register plugins
  await fastify.register(fastifyCors, {
    origin: true,
  });

  await fastify.register(fastifyWebsocket);

  // Register routes
  await fastify.register(orderRoutes, { prefix: '/api/orders' });
  await fastify.register(websocketRoutes);
  await fastify.register(analyticsRoutes, { prefix: '/api/analytics' });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });

  // Error handler
  fastify.setErrorHandler((error, request, reply) => {
    logger.error('request_error', error, {
      url: request.url,
      method: request.method,
    });

    reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message,
    });
  });

  // Start server
  try {
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log('');
    console.log('🚀 Server running on http://localhost:' + port);
    console.log('📊 Health check: http://localhost:' + port + '/health');
    console.log('📈 Analytics: http://localhost:' + port + '/api/analytics/summary');
    console.log('');
  } catch (err) {
    logger.error('server_start_failed', err as Error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
