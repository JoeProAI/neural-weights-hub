import { Server } from 'socket.io';
import { verifyIdToken } from '../../../lib/auth';

const collaborationSessions = new Map();

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/ws/collaborate',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  res.socket.server.io = io;

  io.on('connection', async (socket) => {
    console.log('WebSocket connection established:', socket.id);

    // Authenticate user
    socket.on('authenticate', async (data) => {
      try {
        const { token, sandboxId } = data;
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;
        const userName = decodedToken.name || decodedToken.email;

        socket.userId = userId;
        socket.userName = userName;
        socket.sandboxId = sandboxId;

        // Join sandbox room
        socket.join(sandboxId);

        // Add to collaboration session
        if (!collaborationSessions.has(sandboxId)) {
          collaborationSessions.set(sandboxId, new Map());
        }
        
        const session = collaborationSessions.get(sandboxId);
        session.set(userId, {
          id: userId,
          name: userName,
          socketId: socket.id,
          joinedAt: Date.now()
        });

        // Notify others
        socket.to(sandboxId).emit('collaborator_joined', {
          user: { id: userId, name: userName },
          timestamp: Date.now()
        });

        // Send current collaborators
        const collaborators = Array.from(session.values())
          .filter(c => c.id !== userId);
        
        socket.emit('collaboration_ready', {
          collaborators,
          sandboxId
        });

        console.log(`User ${userName} joined sandbox ${sandboxId}`);

      } catch (error) {
        console.error('Authentication failed:', error);
        socket.emit('auth_error', { error: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle code updates
    socket.on('code_update', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      // Broadcast to other collaborators in the same sandbox
      socket.to(socket.sandboxId).emit('code_update', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Handle cursor position updates
    socket.on('cursor_update', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      socket.to(socket.sandboxId).emit('cursor_update', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Handle execution results
    socket.on('execution_result', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      socket.to(socket.sandboxId).emit('execution_result', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Handle AI suggestions
    socket.on('ai_suggestion', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      socket.to(socket.sandboxId).emit('ai_suggestion', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Handle chat messages
    socket.on('chat_message', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      const message = {
        id: Date.now().toString(),
        userId: socket.userId,
        userName: socket.userName,
        message: data.message,
        timestamp: Date.now()
      };

      // Broadcast to all in sandbox including sender
      io.to(socket.sandboxId).emit('chat_message', message);
    });

    // Handle project save notifications
    socket.on('project_saved', (data) => {
      if (!socket.sandboxId || !socket.userId) return;

      socket.to(socket.sandboxId).emit('project_saved', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: Date.now()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('WebSocket disconnected:', socket.id);

      if (socket.sandboxId && socket.userId) {
        const session = collaborationSessions.get(socket.sandboxId);
        if (session) {
          session.delete(socket.userId);
          
          // Clean up empty sessions
          if (session.size === 0) {
            collaborationSessions.delete(socket.sandboxId);
          }
        }

        // Notify others
        socket.to(socket.sandboxId).emit('collaborator_left', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: Date.now()
        });
      }
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
  });

  res.end();
}

// Disable body parsing for WebSocket
export const config = {
  api: {
    bodyParser: false,
  },
};
