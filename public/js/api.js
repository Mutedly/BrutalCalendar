'use strict';

// ---------------------------------------------------------------------------
// Tiny client-side API + auth-storage helpers.
// Exposed on window.API for the other scripts.
// ---------------------------------------------------------------------------
(function () {
  const TOKEN_KEY = 'pw_token';
  const USER_KEY = 'pw_user';

  function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (e) {
      return null;
    }
  }

  async function post(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Request failed.');
    }
    return data;
  }

  async function register(username, password, bodyColor) {
    return post('/api/register', { username, password, bodyColor });
  }

  async function login(username, password) {
    return post('/api/login', { username, password });
  }

  window.API = {
    register,
    login,
    saveSession,
    clearSession,
    getToken,
    getUser,
  };
})();
