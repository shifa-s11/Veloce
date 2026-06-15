import { FastifyReply } from "fastify";

class SSEManager {
  private connections = new Map<string, Set<FastifyReply>>();

  addConnection(userId: string, reply: FastifyReply) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(reply);

    reply.raw.on("close", () => {
      this.removeConnection(userId, reply);
    });
  }

  removeConnection(userId: string, reply: FastifyReply) {
    const userConns = this.connections.get(userId);
    if (userConns) {
      userConns.delete(reply);
      if (userConns.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  broadcast(userId: string, event: string, data: any) {
    const userConns = this.connections.get(userId);
    if (userConns) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      userConns.forEach((reply) => {
        try {
          reply.raw.write(payload);
        } catch (error) {
          // Ignore connection errors, closed raw streams are cleaned on close event
        }
      });
    }
  }

  broadcastToAll(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.connections.forEach((userConns) => {
      userConns.forEach((reply) => {
        try {
          reply.raw.write(payload);
        } catch (error) {
          // Ignore
        }
      });
    });
  }
}

export const sseManager = new SSEManager();
