# Penguin World

A small browser-based 2D virtual world MVP inspired by classic worlds like
Mikmak / Club Penguin — but with original characters, maps and assets.

Register an account, log in, drop into one shared room, see other online
players, walk around by clicking, and chat in real time.

---

## Features

- **Authentication** — register / login, passwords hashed with `bcrypt`,
  users stored in MySQL, JWT-based sessions.
- **Main room** — a single 2D map with a placeholder background, click-to-move
  with smooth movement, username shown above each character.
- **Multiplayer** — Socket.IO keeps everyone in the same room in sync; players
  appear/disappear as they connect/disconnect; live online count.
- **Chat** — public room chat, message bubbles above the speaker, basic
  profanity masking and anti-spam cooldown, chat box at the bottom.
- **Simple avatar** — each user picks a body color + nickname.

---

## Tech stack

HTML · CSS · JavaScript · Node.js · Express · Socket.IO · MySQL

---

## Project structure

```
.
├── db/
│   └── schema.sql            # MySQL schema (users + avatars)
├── public/                   # Frontend (served statically)
│   ├── index.html            # Login / Register / Game screens
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js            # fetch + session helpers
│       ├── game.js           # canvas rendering + Socket.IO client
│       └── app.js            # screen flow & form wiring
├── server/                   # Backend
│   ├── index.js              # Express + Socket.IO bootstrap
│   ├── config.js             # env-based config
│   ├── db.js                 # MySQL connection pool
│   ├── auth.js               # JWT sign/verify + middleware
│   ├── routes/
│   │   └── auth.js           # /api/register, /api/login, /api/me
│   ├── socket/
│   │   └── game.js           # Socket.IO room/movement/chat handlers
│   ├── utils/
│   │   └── chatFilter.js     # profanity mask + message sanitizing
│   └── scripts/
│       └── initDb.js         # applies db/schema.sql
├── .env.example
└── package.json
```

---

## Installation

### 1. Prerequisites

- Node.js 18+ (tested on Node 22)
- A running MySQL server (5.7+ / 8.x)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at least `DB_USER`, `DB_PASSWORD`, and a strong
`JWT_SECRET`.

### 4. Create the database

Either run the helper script (uses your `.env`):

```bash
npm run init-db
```

…or apply the schema manually:

```bash
mysql -u root -p < db/schema.sql
```

### 5. Start the server

```bash
npm start        # or: npm run dev  (auto-restart on changes)
```

Open <http://localhost:3000> in two browser windows to see multiplayer in
action.

---

## Socket.IO events

Auth: every socket connects with `auth: { token, nickname, bodyColor }`.
The server verifies the JWT before allowing the connection.

### Server → Client

| Event            | Payload                                             | Meaning                                   |
| ---------------- | --------------------------------------------------- | ----------------------------------------- |
| `init`           | `{ world, self, players[] }`                        | Sent once on join: world size + roster    |
| `player:joined`  | `{ id, userId, nickname, bodyColor, x, y, ... }`    | A new player entered the room             |
| `player:moved`   | `{ id, targetX, targetY }`                          | A player picked a new destination         |
| `player:left`    | `{ id }`                                             | A player disconnected                     |
| `players:count`  | `number`                                            | Updated online count                      |
| `chat:message`   | `{ id, nickname, text, at }`                        | A chat message to display                 |
| `chat:error`     | `{ error }`                                          | Message rejected (spam/empty/etc.)        |

### Client → Server

| Event             | Payload          | Meaning                              |
| ----------------- | ---------------- | ------------------------------------ |
| `player:move`     | `{ x, y }`       | Player clicked a destination         |
| `player:position` | `{ x, y }`       | Optional position sync from client   |
| `chat:message`    | `{ text }`       | Send a chat message                  |

---

## Database tables

- **users** — `id`, `username` (unique), `password_hash`, `created_at`
- **avatars** — `id`, `user_id` (FK → users), `nickname`, `body_color`,
  `created_at`

---

## Extending later

- Add more rooms by making `ROOM` dynamic in `server/socket/game.js`.
- Store avatar items/clothing as extra columns or a new table.
- Persist last position in `avatars` on disconnect.
- Swap the canvas placeholder art for real sprites/tilemaps.

---

## License

MIT
