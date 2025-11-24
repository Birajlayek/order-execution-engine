import { FastifyPluginAsync } from 'fastify';
import { Queue } from 'bullmq';
import { redis } from '../config/redis';
import { orderService } from '../services/orderService';
import { validateOrder } from '../utils/validation';
import { logger } from '../utils/logger';

const orderQueue = new Queue('orders', { connection: redis });

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // Submit order
  fastify.post('/execute', async (request, reply) => {
    try {
      const validatedData = validateOrder(request.body);
      
      const order = await orderService.createOrder(validatedData);

      await orderQueue.add('process', { orderId: order.id }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      logger.log('order_queued', { orderId: order.id });

      return reply.code(200).send({
        orderId: order.id,
        status: order.status,
        message: 'Order submitted successfully',
      });
    } catch (error) {
      logger.error('order_submission_failed', error as Error);
      return reply.code(400).send({
        error: 'Invalid order',
        message: (error as Error).message,
      });
    }
  });

  // Get order status
  fastify.get('/:orderId', async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    return reply.send(order);
  });
};
