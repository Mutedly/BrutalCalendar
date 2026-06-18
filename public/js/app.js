'use strict';

// ---------------------------------------------------------------------------
// Screen management + form handling. Glues API + Game together.
// ---------------------------------------------------------------------------
(function () {
  const screens = {
    login: document.getElementById('screen-login'),
    register: document.getElementById('screen-register'),
    game: document.getElementById('screen-game'),
  };

  function show(name) {
    Object.values(screens).forEach((s) => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // --- Navigation links (login <-> register) ----------------------------
  document.querySelectorAll('[data-goto]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      show(link.getAttribute('data-goto'));
    });
  });

  // --- Color preview on register ----------------------------------------
  const colorInput = document.querySelector(
    '#form-register input[name="bodyColor"]'
  );
  const colorPreview = document.getElementById('color-preview');
  if (colorInput) {
    colorInput.addEventListener('input', () => {
      colorPreview.style.background = colorInput.value;
    });
  }

  // --- Game wiring -------------------------------------------------------
  Game.init({
    onCount: (count) => {
      document.getElementById('online-count').textContent = count;
    },
    onChat: (msg) => {
      showChatHint(`${msg.nickname}: ${msg.text}`);
    },
    onChatError: (error) => {
      showChatHint(error, true);
    },
    onDisconnect: () => {
      showChatHint('Disconnected from the server.', true);
    },
  });

  let hintTimer = null;
  function showChatHint(text, isError) {
    const hint = document.getElementById('chat-hint');
    hint.textContent = text;
    hint.style.color = isError ? 'var(--danger)' : 'var(--accent)';
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => {
      hint.textContent = '';
    }, 4000);
  }

  function enterGame(user) {
    document.getElementById('me-pill').textContent = `You: ${user.nickname}`;
    show('game');
    Game.connect(API.getToken(), {
      nickname: user.nickname,
      bodyColor: user.bodyColor,
    });
  }

  // --- Login form --------------------------------------------------------
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.textContent = '';
    const form = e.target;
    try {
      const data = await API.login(
        form.username.value.trim(),
        form.password.value
      );
      API.saveSession(data.token, data.user);
      form.reset();
      enterGame(data.user);
    } catch (err) {
      errEl.textContent = err.message;
    }
  });

  // --- Register form -----------------------------------------------------
  document
    .getElementById('form-register')
    .addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('register-error');
      errEl.textContent = '';
      const form = e.target;
      try {
        const data = await API.register(
          form.username.value.trim(),
          form.password.value,
          form.bodyColor.value
        );
        API.saveSession(data.token, data.user);
        form.reset();
        enterGame(data.user);
      } catch (err) {
        errEl.textContent = err.message;
      }
    });

  // --- Chat form ---------------------------------------------------------
  document.getElementById('form-chat').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    Game.sendChat(text);
    input.value = '';
  });

  // --- Logout ------------------------------------------------------------
  document.getElementById('btn-logout').addEventListener('click', () => {
    Game.disconnect();
    API.clearSession();
    show('login');
  });

  // --- Auto-resume session ----------------------------------------------
  const existingUser = API.getUser();
  if (API.getToken() && existingUser) {
    enterGame(existingUser);
  } else {
    show('login');
  }
})();
