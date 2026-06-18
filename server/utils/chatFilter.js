'use strict';

// ---------------------------------------------------------------------------
// Very small, dependency-free chat moderation helpers.
// Keep the lists short and obvious so they're easy to extend later.
// ---------------------------------------------------------------------------

const MAX_MESSAGE_LENGTH = 120;

// A tiny starter blocklist. Extend as needed.
const BANNED_WORDS = [
  'badword1',
  'badword2',
  'shit',
  'fuck',
  'asshole',
  'bitch',
];

// Build a single case-insensitive regex that matches any banned word.
const bannedRegex = new RegExp(
  `\\b(${BANNED_WORDS.map(escapeRegex).join('|')})\\b`,
  'gi'
);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Replace banned words with asterisks.
function maskProfanity(text) {
  return text.replace(bannedRegex, (match) => '*'.repeat(match.length));
}

// Clean and validate a raw chat message.
// Returns { ok: true, message } or { ok: false, error }.
function sanitizeMessage(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Message must be text.' };
  }

  // Collapse whitespace and trim.
  let text = raw.replace(/\s+/g, ' ').trim();

  if (!text) {
    return { ok: false, error: 'Message is empty.' };
  }

  if (text.length > MAX_MESSAGE_LENGTH) {
    text = text.slice(0, MAX_MESSAGE_LENGTH);
  }

  text = maskProfanity(text);

  return { ok: true, message: text };
}

module.exports = { sanitizeMessage, maskProfanity, MAX_MESSAGE_LENGTH };
