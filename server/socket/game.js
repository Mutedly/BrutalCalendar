'use strict';

const { verifyToken } = require('../auth');
const { sanitizeMessage } = require('../utils/chatFilter');

// ---------------------------------------------------------------------------
// World / room configuration. There is a single shared room in this MVP.
// ---------------------------------------------------------------------------
const ROOM = 'main-room';
const WORLD = { width: 960, height: 540 };

// Simple anti-spam: minimum gap between chat messages per socket (ms).
const CHAT_COOLDOWN_MS = 700;

// In-memory state of everyone currently in the room.
// Map<socketId, player>
const players = new Map();

function randomSpawn() {
  return {
    x: 120 + Math.random() * (WORLD.width - 240),
    y: 120 + Math.random() * (WORLD.height - 240),
  };
}

function publicPlayer(p) {
  return {
    id: p.id,
    userId: p.userId,
    nickname: p.nickname,
    bodyColor: p.bodyColor,
    x: p.x,
    y: p.y,
    targetX: p.targetX,
    targetY: p.targetY,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function registerGameHandlers(io) {
  // Authenticate every socket connection using the JWT from the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required.'));
    }
    try {
      const payload = verifyToken(token);
      socket.user = payload; // { id, username }
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token.'));
    }
  });

  io.on('connection', (socket) => {
    const handshakeAvatar = socket.handshake.auth || {};
    const spawn = randomSpawn();

    const player = {
      id: socket.id,
      userId: socket.user.id,
      nickname: String(handshakeAvatar.nickname || socket.user.username).slice(
        0,
        20
      ),
      bodyColor: /^#[0-9a-fA-F]{6}$/.test(handshakeAvatar.bodyColor)
        ? handshakeAvatar.bodyColor
        : '#3498db',
      x: spawn.x,
      y: spawn.y,
      targetX: spawn.x,
      targetY: spawn.y,
      lastChatAt: 0,
    };

    players.set(socket.id, player);
    socket.join(ROOM);

    // Send the new player the world config + everyone currently present.
    socket.emit('init', {
      world: WORLD,
      self: publicPlayer(player),
      players: Array.from(players.values()).map(publicPlayer),
    });

    // Tell everyone else that a new player arrived.
    socket.to(ROOM).emit('player:joined', publicPlayer(player));

    // Broadcast updated online count.
    io.to(ROOM).emit('players:count', players.size);

    // Movement: client clicks a destination on the map.
    socket.on('player:move', (data) => {
      const p = players.get(socket.id);
      if (!p || !data) return;

      const tx = Number(data.x);
      const ty = Number(data.y);
      if (!Number.isFinite(tx) || !Number.isFinite(ty)) return;

      p.targetX = clamp(tx, 0, WORLD.width);
      p.targetY = clamp(ty, 0, WORLD.height);

      // The server keeps the authoritative target; clients animate locally.
      io.to(ROOM).emit('player:moved', {
        id: p.id,
        targetX: p.targetX,
        targetY: p.targetY,
      });
    });

    // Lightweight position sync from the client (where it actually ended up).
    socket.on('player:position', (data) => {
      const p = players.get(socket.id);
      if (!p || !data) return;
      const x = Number(data.x);
      const y = Number(data.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      p.x = clamp(x, 0, WORLD.width);
      p.y = clamp(y, 0, WORLD.height);
    });

    // Chat: validate, filter and rebroadcast.
    socket.on('chat:message', (data) => {
      const p = players.get(socket.id);
      if (!p || !data) return;

      const now = Date.now();
      if (now - p.lastChatAt < CHAT_COOLDOWN_MS) {
        socket.emit('chat:error', {
          error: 'You are sending messages too quickly.',
        });
        return;
      }

      const result = sanitizeMessage(data.text);
      if (!result.ok) {
        socket.emit('chat:error', { error: result.error });
        return;
      }

      p.lastChatAt = now;
      io.to(ROOM).emit('chat:message', {
        id: p.id,
        nickname: p.nickname,
        text: result.message,
        at: now,
      });
    });

    socket.on('disconnect', () => {
      players.delete(socket.id);
      io.to(ROOM).emit('player:left', { id: socket.id });
      io.to(ROOM).emit('players:count', players.size);
    });
  });
}

module.exports = { registerGameHandlers, ROOM, WORLD };
