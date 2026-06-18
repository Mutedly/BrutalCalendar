'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const config = require('./config');
const { pool } = require('./db');
const authRoutes = require('./routes/auth');
const { registerGameHandlers } = require('./socket/game');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware --------------------------------------------------------------
app.use(express.json());

// Static frontend.
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// API routes.
app.use('/api', authRoutes);

// Health check (also confirms DB connectivity).
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// Socket.IO handlers.
registerGameHandlers(io);

// Start -------------------------------------------------------------------
server.listen(config.port, () => {
  console.log(`Penguin World running at http://localhost:${config.port}`);
});

// Graceful shutdown.
function shutdown() {
  console.log('\nShutting down...');
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = { app, server, io };
