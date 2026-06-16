# BrutalCalendar

A mobile-first, installable **PWA** for managing the **Brutal Assault** festival band schedule on your phone — fully offline.

All application logic lives in a single `index.html` (vanilla HTML/CSS/JS, no frameworks, no external CDNs/fonts/APIs). The few extra files are only what a real PWA needs.

## Files

- `index.html` — the entire app (HTML + CSS + JS in one file)
- `manifest.json` — PWA manifest (name, icons, theme, standalone display)
- `sw.js` — service worker (offline app-shell caching)
- `icon-192.png`, `icon-512.png` — app icons

100% static. No Node.js, npm, build tools, or server required — upload as-is to GitHub Pages or any static host.

## Usage

- **Online / hosted:** serve the folder over HTTP(S) (e.g. GitHub Pages) and you can install it to your home screen and use it offline.
- **Local file:** open `index.html` directly — it still works fully offline (the service worker simply isn't used under `file://`).

## Features

- 4 swipeable stage screens with CSS scroll-snap: **SEA SHEPHERD**, **MARSHALL** (main), **OBSCURE**, **OCTAGON** (secondary).
- Sticky top nav + hamburger menu (My Picks, Search, Settings, Reset).
- Add / edit / delete bands via a bottom-sheet form (name + start time required); bands auto-sort by time.
- Mark shows as ended (✓) — they move to an **ENDED SHOWS** section.
- Search across all stages and a starred **My Picks** view.
- Settings: hide the reset button, and define a custom rollback point.
- Multi-step custom confirmation dialogs (no native `alert`/`confirm`).
- All data saved instantly to `localStorage`; resilient to empty/corrupt storage.
