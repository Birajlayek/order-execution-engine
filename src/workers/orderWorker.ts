import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { orderService } from '../services/orderService';
import { dexRouter } from '../services/dexRouter';
import { websocketManager } from '../websocket/manager';
import { logger } from '../utils/logger';
import { CONSTANTS } from '../config/constants';

const worker = new Worker(
  'orders',
  async (job) => {
    const { orderId } = job.data;
    logger.setTraceId(orderId);

    try {
      const order = await orderService.getOrder(orderId);
      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Update: pending → routing
      await orderService.updateOrderStatus(orderId, 'routing');
      websocketManager.broadcast(orderId, {
        orderId,
        status: 'routing',
        timestamp: new Date(),
      });

      // Get optimal route
      const bestQuote = await dexRouter.getOptimalRoute(
        order.tokenIn,
        order.tokenOut,
        order.amount
      );

      // Update: routing → building
      await orderService.updateOrderStatus(orderId, 'building');
      websocketManager.broadcast(orderId, {
        orderId,
        status: 'building',
        selectedDex: bestQuote.dex,
        estimatedPrice: bestQuote.price,
        timestamp: new Date(),
      });

      // Execute swap
      const result = await dexRouter.executeSwap(bestQuote, orderId);

      // Update: building → submitted
      await orderService.updateOrderStatus(orderId, 'submitted', {
        txHash: result.txHash,
        executedPrice: result.price,
        dexUsed: result.dex,
      });

      websocketManager.broadcast(orderId, {
        orderId,
        status: 'submitted',
        txHash: result.txHash,
        timestamp: new Date(),
      });

      // Simulate confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Update: submitted → confirmed
      await orderService.updateOrderStatus(orderId, 'confirmed');
      websocketManager.broadcast(orderId, {
        orderId,
        status: 'confirmed',
        executedPrice: result.price,
        dex: result.dex,
        txHash: result.txHash,
        timestamp: new Date(),
      });

      logger.log('order_completed', { orderId });
    } catch (error) {
      logger.error('order_processing_failed', error as Error, { orderId });
      await orderService.updateOrderStatus(orderId, 'failed', {
        error: (error as Error).message,
      });
      websocketManager.broadcast(orderId, {
        orderId,
        status: 'failed',
        error: (error as Error).message,
        timestamp: new Date(),
      });
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: CONSTANTS.MAX_CONCURRENT_ORDERS,
  }
);

worker.on('completed', (job) => {
  logger.log('worker_job_completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('worker_job_failed', err, { jobId: job?.id });
});

console.log('🔄 Order worker started');

export default worker;
