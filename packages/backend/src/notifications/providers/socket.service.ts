import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { 
  WebSocketMessageDto,
  NotificationType,
  NotificationPriority 
} from '../dto/notifications.dto';

interface ConnectedClient {
  id: string;
  userId?: string;
  socket: any;
  rooms: string[];
  connectedAt: Date;
  lastActivity: Date;
}

interface RoomInfo {
  name: string;
  clients: string[];
  createdAt: Date;
  type: 'user' | 'global' | 'shop' | 'product' | 'order';
  metadata?: Record<string, any>;
}

@Injectable()
export class SocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocketService.name);
  private io: SocketIOServer;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private rooms: Map<string, RoomInfo> = new Map();
  private corsOrigin: string[];

  constructor(private configService: ConfigService) {
    this.corsOrigin = this.configService.get<string[]>('SOCKET_CORS_ORIGIN') || ['*'];
  }

  onModuleInit() {
    this.logger.log('Socket service initialized');
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server: HttpServer) {
    try {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: this.corsOrigin,
          methods: ['GET', 'POST'],
          credentials: true,
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6,
        allowEIO3: true,
      });

      this.setupEventHandlers();
      this.logger.log('Socket.IO server initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Socket.IO server: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.io.on('disconnect', (socket) => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: any) {
    const clientId = socket.id;
    const client: ConnectedClient = {
      id: clientId,
      socket,
      rooms: [],
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connectedClients.set(clientId, client);
    this.logger.log(`Client connected: ${clientId}`);

    // Send welcome message
    socket.emit('connected', {
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Setup client-specific event handlers
    this.setupClientEventHandlers(socket, client);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: any) {
    const clientId = socket.id;
    const client = this.connectedClients.get(clientId);

    if (client) {
      // Leave all rooms
      client.rooms.forEach(room => {
        this.leaveRoom(clientId, room);
      });

      this.connectedClients.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }
  }

  /**
   * Setup client-specific event handlers
   */
  private setupClientEventHandlers(socket: any, client: ConnectedClient) {
    // Authentication
    socket.on('authenticate', async (data: { userId: string; token: string }) => {
      await this.handleAuthentication(socket, client, data);
    });

    // Join room
    socket.on('join_room', async (data: { room: string; metadata?: any }) => {
      await this.joinRoom(client.id, data.room, data.metadata);
    });

    // Leave room
    socket.on('leave_room', async (data: { room: string }) => {
      await this.leaveRoom(client.id, data.room);
    });

    // Send message to room
    socket.on('send_to_room', async (data: WebSocketMessageDto) => {
      await this.sendToRoom(data.room, data.event, data.data, client.id);
    });

    // Send message to user
    socket.on('send_to_user', async (data: { userId: string; event: string; data: any }) => {
      await this.sendToUser(data.userId, data.event, data.data, client.id);
    });

    // Typing indicators
    socket.on('typing_start', (data: { room: string; userId: string }) => {
      socket.to(data.room).emit('user_typing', {
        userId: data.userId,
        isTyping: true,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('typing_stop', (data: { room: string; userId: string }) => {
      socket.to(data.room).emit('user_typing', {
        userId: data.userId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      });
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      client.lastActivity = new Date();
      socket.emit('heartbeat_response', { timestamp: new Date().toISOString() });
    });

    // Error handling
    socket.on('error', (error) => {
      this.logger.error(`Socket error for client ${client.id}: ${error}`);
    });
  }

  /**
   * Handle client authentication
   */
  private async handleAuthentication(socket: any, client: ConnectedClient, data: { userId: string; token: string }) {
    try {
      // Here you would validate the token and get user info
      // For now, we'll just accept the userId
      client.userId = data.userId;
      this.connectedClients.set(client.id, client);

      // Join user-specific room
      await this.joinRoom(client.id, `user_${data.userId}`, { type: 'user' });

      socket.emit('authenticated', {
        success: true,
        userId: data.userId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Client authenticated: ${client.id} for user: ${data.userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}: ${(error as Error).message}`);
      socket.emit('authenticated', {
        success: false,
        error: 'Authentication failed',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Join room
   */
  async joinRoom(clientId: string, roomName: string, metadata?: any) {
    try {
      const client = this.connectedClients.get(clientId);
      if (!client) return;

      const socket = client.socket;

      // Leave room if already in it
      if (client.rooms.includes(roomName)) {
        return;
      }

      // Join room
      socket.join(roomName);
      client.rooms.push(roomName);
      client.lastActivity = new Date();

      // Update room info
      let room = this.rooms.get(roomName);
      if (!room) {
        room = {
          name: roomName,
          clients: [],
          createdAt: new Date(),
          type: this.getRoomType(roomName),
          metadata,
        };
        this.rooms.set(roomName, room);
      }

      if (!room.clients.includes(clientId)) {
        room.clients.push(clientId);
      }

      // Notify room
      socket.to(roomName).emit('user_joined', {
        userId: client.userId,
        clientId,
        room: roomName,
        timestamp: new Date().toISOString(),
      });

      // Send room info to client
      socket.emit('room_joined', {
        room: roomName,
        clients: room.clients.length,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Client ${clientId} joined room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to join room ${roomName}: ${(error as Error).message}`);
    }
  }

  /**
   * Leave room
   */
  async leaveRoom(clientId: string, roomName: string) {
    try {
      const client = this.connectedClients.get(clientId);
      if (!client) return;

      const socket = client.socket;
      const roomIndex = client.rooms.indexOf(roomName);
      
      if (roomIndex === -1) return;

      // Leave room
      socket.leave(roomName);
      client.rooms.splice(roomIndex, 1);
      client.lastActivity = new Date();

      // Update room info
      const room = this.rooms.get(roomName);
      if (room) {
        const clientIndex = room.clients.indexOf(clientId);
        if (clientIndex !== -1) {
          room.clients.splice(clientIndex, 1);
        }

        // Remove room if empty
        if (room.clients.length === 0) {
          this.rooms.delete(roomName);
        }
      }

      // Notify room
      socket.to(roomName).emit('user_left', {
        userId: client.userId,
        clientId,
        room: roomName,
        timestamp: new Date().toISOString(),
      });

      // Send confirmation to client
      socket.emit('room_left', {
        room: roomName,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Client ${clientId} left room: ${roomName}`);
    } catch (error) {
      this.logger.error(`Failed to leave room ${roomName}: ${(error as Error).message}`);
    }
  }

  /**
   * Send message to room
   */
  async sendToRoom(roomName: string, event: string, data: any, senderId?: string) {
    try {
      const message: WebSocketMessageDto = {
        event,
        room: roomName,
        data,
        timestamp: new Date().toISOString(),
      };

      this.io.to(roomName).emit(event, message);

      this.logger.log(`Message sent to room ${roomName}: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send message to room ${roomName}: ${(error as Error).message}`);
    }
  }

  /**
   * Send message to user
   */
  async sendToUser(userId: string, event: string, data: any, senderId?: string) {
    try {
      const userRoom = `user_${userId}`;
      const message: WebSocketMessageDto = {
        event,
        userId,
        data,
        timestamp: new Date().toISOString(),
      };

      this.io.to(userRoom).emit(event, message);

      this.logger.log(`Message sent to user ${userId}: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to send message to user ${userId}: ${(error as Error).message}`);
    }
  }

  /**
   * Send notification to user
   */
  async sendNotificationToUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority: NotificationPriority = NotificationPriority.NORMAL,
  ) {
    try {
      const userRoom = `user_${userId}`;
      const notification = {
        type,
        title,
        message,
        data,
        priority,
        timestamp: new Date().toISOString(),
      };

      this.io.to(userRoom).emit('notification', notification);

      this.logger.log(`Notification sent to user ${userId}: ${type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}: ${(error as Error).message}`);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority: NotificationPriority = NotificationPriority.NORMAL,
  ) {
    try {
      const notification = {
        type,
        title,
        message,
        data,
        priority,
        timestamp: new Date().toISOString(),
      };

      userIds.forEach(userId => {
        const userRoom = `user_${userId}`;
        this.io.to(userRoom).emit('notification', notification);
      });

      this.logger.log(`Notification sent to ${userIds.length} users: ${type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to users: ${(error as Error).message}`);
    }
  }

  /**
   * Send notification to room
   */
  async sendNotificationToRoom(
    roomName: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
    priority: NotificationPriority = NotificationPriority.NORMAL,
  ) {
    try {
      const notification = {
        type,
        title,
        message,
        data,
        priority,
        timestamp: new Date().toISOString(),
      };

      this.io.to(roomName).emit('notification', notification);

      this.logger.log(`Notification sent to room ${roomName}: ${type}`);
    } catch (error) {
      this.logger.error(`Failed to send notification to room ${roomName}: ${(error as Error).message}`);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  async broadcast(event: string, data: any) {
    try {
      const message: WebSocketMessageDto = {
        event,
        data,
        timestamp: new Date().toISOString(),
      };

      this.io.emit(event, message);

      this.logger.log(`Broadcast message sent: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to broadcast message: ${(error as Error).message}`);
    }
  }

  /**
   * Get room type from room name
   */
  private getRoomType(roomName: string): 'user' | 'global' | 'shop' | 'product' | 'order' {
    if (roomName.startsWith('user_')) return 'user';
    if (roomName.startsWith('shop_')) return 'shop';
    if (roomName.startsWith('product_')) return 'product';
    if (roomName.startsWith('order_')) return 'order';
    return 'global';
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get room info
   */
  getRoomInfo(roomName: string): RoomInfo | null {
    return this.rooms.get(roomName) || null;
  }

  /**
   * Get all rooms
   */
  getAllRooms(): RoomInfo[] {
    return Array.from(this.rooms.values());
  }

  /**
   * Get user's connected clients
   */
  getUserClients(userId: string): ConnectedClient[] {
    return Array.from(this.connectedClients.values()).filter(client => client.userId === userId);
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    this.connectedClients.forEach((client, clientId) => {
      if (now.getTime() - client.lastActivity.getTime() > inactiveThreshold) {
        client.socket.disconnect();
        this.connectedClients.delete(clientId);
        this.logger.log(`Cleaned up inactive client: ${clientId}`);
      }
    });
  }

  /**
   * Get socket statistics
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      totalRooms: this.rooms.size,
      roomsByType: Array.from(this.rooms.values()).reduce((acc, room) => {
        acc[room.type] = (acc[room.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  onModuleDestroy() {
    if (this.io) {
      this.io.close();
      this.logger.log('Socket.IO server closed');
    }
  }
}