import { FastifyPluginAsync } from 'fastify';
import { orderService } from '../services/orderService';
import { pricePredictor } from '../services/pricePredictor';

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // Execute order
  fastify.post('/execute', async (request, reply) => {
    const orderData = request.body as any;
    
    try {
      const order = await orderService.createOrder(orderData);
      
      // Process order immediately (simplified)
      setTimeout(async () => {
        await orderService.updateOrderStatus(order.id, 'confirmed');
      }, 2000);

      return reply.send({
        orderId: order.id,
        status: 'pending',
        message: 'Order submitted successfully'
      });
    } catch (error: any) {
      return reply.code(400).send({
        error: 'Invalid order',
        message: error.message
      });
    }
  });

  // Get order status
  fastify.get('/:orderId', async (request, reply) => {
    const { orderId } = request.params as any;
    
    try {
      const order = await orderService.getOrder(orderId);

      if (!order) {
        return reply.code(404).send({ error: 'Order not found' });
      }

      return reply.send(order);
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Failed to fetch order',
        message: error.message
      });
    }
  });

  // Price prediction endpoint  
  fastify.get('/predict/:tokenIn/:tokenOut', async (request, reply) => {
    const { tokenIn, tokenOut } = request.params as any;
    
    try {
      const prediction = await pricePredictor.predictBestExecutionTime(tokenIn, tokenOut);
      return reply.send(prediction);
    } catch (error: any) {
      return reply.code(500).send({
        error: 'Prediction failed',
        message: error.message
      });
    }
  });
};
