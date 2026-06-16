# BrutalCalendar

A mobile-first, single-file PWA for managing the **Brutal Assault** festival band schedule on your phone — fully offline.

## Usage

Open `index.html` in any mobile (or desktop) browser. No build step, no server, no dependencies.

- 4 stage views with horizontal swipe + CSS scroll-snap: **SEA SHEPHERD**, **MARSHALL** (main), **OBSCURE**, **OCTAGON** (secondary).
- Sticky top nav — tap a stage name to jump to it.
- Add / edit / delete bands via a bottom-sheet form (name + start time required).
- Bands auto-sort by start time.
- Search across all stages and a starred **My Picks** view.
- All data saved instantly to `localStorage`; resilient to empty/corrupt storage.
- Reset button restores the default example schedule.

Everything lives in one `index.html` file — vanilla HTML/CSS/JS, no frameworks, no external CDNs/fonts/APIs.
