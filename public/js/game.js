'use strict';

// ---------------------------------------------------------------------------
// Canvas rendering + Socket.IO client for the shared room.
// Exposed on window.Game.
// ---------------------------------------------------------------------------
(function () {
  const MOVE_SPEED = 140; // pixels per second
  const PLAYER_RADIUS = 18;
  const BUBBLE_MS = 5000; // how long a chat bubble stays visible

  let canvas;
  let ctx;
  let socket = null;
  let world = { width: 960, height: 540 };

  // Map<id, player>; each player: {id, nickname, bodyColor, x, y, targetX, targetY, bubble}
  const players = new Map();
  let selfId = null;

  let rafId = null;
  let lastTime = 0;

  const callbacks = {
    onCount: function () {},
    onChat: function () {},
    onChatError: function () {},
    onDisconnect: function () {},
  };

  // --- Rendering ---------------------------------------------------------
  function drawBackground() {
    // Simple placeholder world: snowy ground + a frozen pond.
    ctx.fillStyle = '#bfe3ff';
    ctx.fillRect(0, 0, world.width, world.height);

    // Ground band
    ctx.fillStyle = '#eaf6ff';
    ctx.fillRect(0, world.height * 0.62, world.width, world.height * 0.38);

    // Pond
    ctx.fillStyle = '#9fd0ff';
    ctx.beginPath();
    ctx.ellipse(
      world.width * 0.5,
      world.height * 0.45,
      170,
      90,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // A few decorative "trees".
    drawTree(90, world.height * 0.6);
    drawTree(world.width - 110, world.height * 0.58);
    drawTree(world.width * 0.78, world.height * 0.72);
  }

  function drawTree(x, baseY) {
    ctx.fillStyle = '#7a5230';
    ctx.fillRect(x - 6, baseY - 30, 12, 40);
    ctx.fillStyle = '#3aa76d';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, baseY - 90 + i * 24);
      ctx.lineTo(x - 30 + i * 6, baseY - 40 + i * 24);
      ctx.lineTo(x + 30 - i * 6, baseY - 40 + i * 24);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawPlayer(p) {
    // Body
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = p.bodyColor;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.stroke();

    // Belly
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 3, 9, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1c2b3a';
    ctx.beginPath();
    ctx.arc(p.x - 5, p.y - 5, 2.2, 0, Math.PI * 2);
    ctx.arc(p.x + 5, p.y - 5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Nickname
    ctx.font = '700 13px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeText(p.nickname, p.x, p.y - PLAYER_RADIUS - 8);
    ctx.fillStyle = '#1c2b3a';
    ctx.fillText(p.nickname, p.x, p.y - PLAYER_RADIUS - 8);

    // Chat bubble
    if (p.bubble && Date.now() - p.bubble.at < BUBBLE_MS) {
      drawBubble(p, p.bubble.text);
    }
  }

  function drawBubble(p, text) {
    ctx.font = '600 12px Nunito, sans-serif';
    const padding = 8;
    const metrics = ctx.measureText(text);
    const w = Math.min(metrics.width + padding * 2, 220);
    const h = 26;
    const x = p.x - w / 2;
    const y = p.y - PLAYER_RADIUS - 46;

    roundRect(x, y, w, h, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Tail
    ctx.beginPath();
    ctx.moveTo(p.x - 6, y + h);
    ctx.lineTo(p.x + 6, y + h);
    ctx.lineTo(p.x, y + h + 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fill();

    ctx.fillStyle = '#1c2b3a';
    ctx.textAlign = 'center';
    ctx.fillText(text, p.x, y + 17, w - padding * 2);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // --- Update loop -------------------------------------------------------
  function step(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1) || 0;
    lastTime = timestamp;

    players.forEach((p) => {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        const move = MOVE_SPEED * dt;
        if (move >= dist) {
          p.x = p.targetX;
          p.y = p.targetY;
        } else {
          p.x += (dx / dist) * move;
          p.y += (dy / dist) * move;
        }
      }
    });

    ctx.clearRect(0, 0, world.width, world.height);
    drawBackground();
    // Draw players sorted by Y so lower ones overlap correctly.
    Array.from(players.values())
      .sort((a, b) => a.y - b.y)
      .forEach(drawPlayer);

    rafId = requestAnimationFrame(step);
  }

  // --- Socket wiring -----------------------------------------------------
  function connect(token, avatar) {
    socket = io({ auth: { token: token, nickname: avatar.nickname, bodyColor: avatar.bodyColor } });

    socket.on('init', (data) => {
      world = data.world;
      selfId = data.self.id;
      players.clear();
      data.players.forEach((p) => players.set(p.id, normalize(p)));
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(step);
      }
    });

    socket.on('player:joined', (p) => {
      players.set(p.id, normalize(p));
    });

    socket.on('player:moved', (data) => {
      const p = players.get(data.id);
      if (p) {
        p.targetX = data.targetX;
        p.targetY = data.targetY;
      }
    });

    socket.on('player:left', (data) => {
      players.delete(data.id);
    });

    socket.on('players:count', (count) => {
      callbacks.onCount(count);
    });

    socket.on('chat:message', (msg) => {
      const p = players.get(msg.id);
      if (p) {
        p.bubble = { text: msg.text, at: Date.now() };
      }
      callbacks.onChat(msg, msg.id === selfId);
    });

    socket.on('chat:error', (data) => {
      callbacks.onChatError(data.error);
    });

    socket.on('connect_error', (err) => {
      callbacks.onChatError(err.message);
    });

    socket.on('disconnect', () => {
      callbacks.onDisconnect();
    });
  }

  function normalize(p) {
    return {
      id: p.id,
      nickname: p.nickname,
      bodyColor: p.bodyColor,
      x: p.x,
      y: p.y,
      targetX: p.targetX != null ? p.targetX : p.x,
      targetY: p.targetY != null ? p.targetY : p.y,
      bubble: null,
    };
  }

  // --- Public API --------------------------------------------------------
  function init(handlers) {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    Object.assign(callbacks, handlers);

    canvas.addEventListener('click', (e) => {
      if (!socket) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      socket.emit('player:move', { x: x, y: y });
    });
  }

  function sendChat(text) {
    if (socket) socket.emit('chat:message', { text: text });
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    players.clear();
  }

  window.Game = { init, connect, sendChat, disconnect };
})();
