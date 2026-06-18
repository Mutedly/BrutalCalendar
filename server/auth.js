'use strict';

const jwt = require('jsonwebtoken');
const config = require('./config');

// Create a signed token for a given user.
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// Verify a token string, returning the decoded payload or throwing.
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

// Express middleware that protects HTTP routes.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authentication token.' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = { signToken, verifyToken, requireAuth };
