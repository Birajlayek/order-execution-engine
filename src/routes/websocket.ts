import { FastifyPluginAsync } from 'fastify';
import { websocketManager } from '../websocket/manager';

export const websocketRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/ws/:orderId',
    { websocket: true },
    (connection, request) => {
      const { orderId } = request.params as { orderId: string };
      websocketManager.addConnection(orderId, connection.socket);

      connection.socket.on('message', (message) => {
        console.log('Received:', message.toString());
      });
    }
  );
};
