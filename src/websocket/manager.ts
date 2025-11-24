import { WebSocket } from 'ws';
import { logger } from '../utils/logger';

class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  addConnection(orderId: string, socket: WebSocket) {
    if (!this.connections.has(orderId)) {
      this.connections.set(orderId, new Set());
    }
    this.connections.get(orderId)!.add(socket);
    logger.log('websocket_connected', { orderId });

    socket.on('close', () => {
      this.removeConnection(orderId, socket);
    });
  }

  removeConnection(orderId: string, socket: WebSocket) {
    const connections = this.connections.get(orderId);
    if (connections) {
      connections.delete(socket);
      if (connections.size === 0) {
        this.connections.delete(orderId);
      }
    }
    logger.log('websocket_disconnected', { orderId });
  }

  broadcast(orderId: string, message: any) {
    const connections = this.connections.get(orderId);
    if (!connections) return;

    const payload = JSON.stringify(message);
    connections.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(payload);
      }
    });
  }
}

export const websocketManager = new WebSocketManager();
