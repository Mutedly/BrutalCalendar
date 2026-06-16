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
- **Date + time per show.** Each stage is split into **ACTIVE NOW / UPCOMING / ENDED** sections, derived live from the device's date and clock.
- Live **Next Up / On Now** banner with countdown (across days); overlapping slots show the starred band first with a **+N MORE** popup.
- **Export to Calendar** — one-tap `.ics` export of the **entire** schedule. On iPhone it opens the share sheet (Web Share API) so you can add all events straight to iOS Calendar; your calendar then sends the notifications, with a configurable reminder lead time (5–50 min). Stable per-band UID + incrementing SEQUENCE so re-adding updates events.
- Sticky top nav + hamburger menu (My Picks, Search, Settings, Reset).
- Add / edit / delete bands via a bottom-sheet form (name + date + start time required); bands auto-sort by date+time.
- Mark shows as ended (✓) manually — overrides the automatic clock-based status.
- **Overlap detection** — clashing shows get a ⚠ OVERLAP badge (tap to see what they clash with); a Settings "Schedule Check" lists every overlapping pair.
- **Per-stage sorting** — order each stage by start time, A–Z, or starred-first.
- Search across all stages and a starred **My Picks** view.
- Settings: hide the reset button, export to calendar (.ics, one-tap on iPhone), switch layout (swipe vs stacked), export/import the schedule as JSON, and define a custom rollback point.
- Multi-step custom confirmation dialogs (no native `alert`/`confirm`).
- All data saved instantly to `localStorage`; resilient to empty/corrupt storage.
