# AGENT.md — nested-directory
Annotate and organise startups while browsing the YC Directory.
---

## How to use this file
Drop this in the project root. This project previously existed as a FastAPI + HTMX
web app that tracked YC startups locally. We are now rebuilding it as a **fully
client-side Chrome extension** — no backend server, no hosted database, everything
lives in the browser. Read this whole file before writing code. Work in the
phases below, in order, and confirm the extension still builds and loads unpacked
after each phase before moving to the next one. Don't skip ahead.
 
---
 
## 1. Goal
 
A Chrome extension for personally tracking YC-directory startups: browse/filter
the full batch list, search across companies, organize startups into custom
collections (e.g. "Inspiration," "Competitors," "Idea Sourcing"), write private
notes per startup, and — the key upgrade over the old version — interact with
this directly **on ycombinator.com/companies**, via a DOM-injected selector and
in-page indicators for startups you're already tracking.
 
Everything is local-first. No account, no sync server, no telemetry. The only
network calls this extension makes are to YC's own public endpoints, to fetch
company data.
 
---
 
## 2. Tech stack (required)
 
- **TypeScript** (strict mode on)
- **React** (required to use shadcn/ui — mention this explicitly since the
  original ask only named TS/Tailwind/shadcn, but shadcn is React + Radix under
  the hood)
- **Tailwind CSS** for styling
- **shadcn/ui** components (generate into `src/components/ui`, use the standard
  `cn()` utility, don't hand-roll versions of things shadcn already provides)
- **Vite** as the bundler, with **@crxjs/vite-plugin** for Manifest V3 support
  (hot-reload during dev is important for extension DX — set this up early)
- **Manifest V3**
- **IndexedDB** (via the `idb` library) for the startup dataset (this can be a
  few thousand records — don't put this in `chrome.storage.local`)
- **chrome.storage.local** for personal data: collections, notes, tags, settings
  (small, needs to survive extension updates, doesn't need IndexedDB's query
  power)
- **Fuse.js** (or similar lightweight lib) for fuzzy client-side search across
  name / one-liner / tags
---
 
## 3. Extension architecture
 
Three surfaces + one background worker:
 
- **Side panel** (`chrome.sidePanel` API) — the primary UI. This is the main
  app: batch list, filters, search, notes, collections. Preferred over popup
  because it stays open while browsing, which matters for research workflows.
- **Popup** — secondary, lightweight. Quick actions only: "add current YC page's
  startup," jump-to-search. Don't duplicate the full side panel UI here.
- **Content script** — injected on `https://www.ycombinator.com/companies*`.
  Adds a selection affordance to company cards and renders indicator badges for
  startups already in a collection or with a note attached.
- **Background service worker** — message broker between content script and
  side panel, and owner of the data-refresh logic (fetching/caching YC company
  data).
`manifest.json` needs: `storage`, `unlimitedStorage`, `scripting`,
`sidePanel` permissions, and `host_permissions` scoped to
`https://www.ycombinator.com/*` (and whatever data-source domain you land on
in Phase 1 — see below).
 
---
 
## 4. Data model
 
```ts
interface Startup {
  id: string;              // stable YC identifier or slug
  name: string;
  oneLiner: string;
  description?: string;
  batch: string;            // e.g. "W24"
  industries: string[];     // YC's own tags, for filtering
  website?: string;
  logoUrl?: string;
  ycUrl: string;
  teamSize?: number;
  location?: string;
  status?: string;          // active / acquired / inactive, if YC exposes it
}
 
interface Collection {
  id: string;
  name: string;
  color: string;
  description?: string;
  startupIds: string[];
}
 
interface Note {
  id: string;
  startupId: string;
  content: string;   // plain text or simple markdown, your call
  createdAt: number;
  updatedAt: number;
}
 
interface StartupUserTag {
  id: string;
  startupId: string;
  label: string;      // freeform, e.g. "why I'm watching this"
  color?: string;
}
```
 
Seed three default collections on first install: **Inspiration**,
**Competitors**, **Idea Sourcing** — matching the actual use case described for
this tool. User can rename/delete/add more freely; these are just sane
defaults, not hardcoded categories.
 
A startup can belong to multiple collections and have multiple tags/notes —
model these as separate stores keyed by `startupId`, not nested inside
`Startup` itself, so the read-only company dataset stays clean and easy to
refresh independently of user data.
 
---
 
## 5. Data acquisition (no server — read this carefully)
 
This is the part most likely to need adaptation, so don't guess blindly:
 
**First step of Phase 1: inspect the existing FastAPI project's code and find
out exactly how it currently sources YC startup data** (scraping HTML,
hitting an internal API, hitting YC's Algolia search index, etc). Port that
logic into TypeScript rather than reinventing it — it already works.
 
If that inspection doesn't turn up a clear answer, here are three viable
approaches, in recommended combination:
 
1. **Bulk fetch on install / manual refresh** — the background service worker
   fetches the company dataset from whatever endpoint the old app used and
   caches it into IndexedDB. Add a "Refresh Data" button in settings since this
   data goes stale as new batches launch.
2. **Passive content-script capture** — while the user browses
   `ycombinator.com/companies`, the content script reads whatever's already
   rendered in the DOM and merges it into the local cache. This is a good
   fallback if the bulk endpoint changes or gets rate-limited, and guarantees
   freshness for whatever the user is actively looking at.
3. **Static seed file** — ship a one-time exported JSON snapshot as a fallback
   so the extension isn't empty on first install before any fetch/capture has
   run.
Recommend implementing 1 + 2 together, with 3 as a bootstrap fallback.
 
---
 
## 6. Features → build phases
 
### Phase 0 — Scaffold
- Vite + `@crxjs/vite-plugin` + React + TS + Tailwind + shadcn init
- Manifest V3 skeleton: side panel entry, popup entry, background worker,
  content script entry
- Confirm `npm run build` produces a loadable unpacked extension, and dev mode
  hot-reloads
### Phase 1 — Data layer
- IndexedDB wrapper (`idb`) + repositories for Startup
- `chrome.storage.local` repositories for Collection, Note, StartupUserTag
- Data refresh logic (see §5) ported from the FastAPI project
- Import/export as JSON (personal data backup — important since this is
  local-only with no server, so the user's only backup path is manual export)
### Phase 2 — Side panel core
- Batch list view
- Multi-select filter: **Batch** and **Industry**, both as multi-select
  (shadcn `Command` + `Popover` with checkboxes is a good fit)
- Search bar layered on top of active filters, fuzzy-matching name / one-liner
  / industries / user tags
- Startup card: logo, name, one-liner, batch badge, industry badges, quick
  actions (add to collection, add note, open on ycombinator.com)
- Startup detail view (shadcn `Sheet` or `Dialog`) with full info + its notes
  + its collections
### Phase 3 — Notes
- Per-startup note editor, accessible from the card and the detail view
- A dedicated Notes tab: all notes across all startups, searchable, sorted by
  last updated
### Phase 4 — Collections
- Create / rename / recolor / delete collections
- Add/remove a startup to one or more collections from the card or detail view
- Collections tab: browse startups grouped by collection; also usable as a
  filter on the main list
### Phase 5 — On-page integration (ycombinator.com/companies*)
- `MutationObserver` on the companies page (it's client-rendered, so cards
  appear/change after initial load — don't rely on a single DOMContentLoaded
  pass)
- Hover affordance on each company card: a small button to "select this
  startup" → sends it to the side panel (open + focused on that startup) and/or
  pops a small in-page quick-action menu (add to collection / add note) without
  leaving the YC page
- Indicator badge injected onto cards that are **already tracked** — e.g. a
  colored dot matching the collection's color, or a small note icon if a note
  exists — so previously-tracked startups are recognizable at a glance while
  browsing YC directly
- Be defensive: feature-detect DOM structure, don't assume YC's markup is
  stable, and never break the underlying page's own functionality
### Phase 6 — Polish
- Settings: manual data refresh, export/import backup, clear-all-data
- Dark mode (Tailwind class strategy, matching shadcn theming)
- Empty / loading / error states throughout
- Optional: keyboard shortcut to open the side panel
---
 
## 7. Suggested folder structure
 
```
extension/
  manifest.json
  src/
    background/index.ts
    content/
      ycCompanies.ts
      styles.css
    sidepanel/
      main.tsx
      App.tsx
      components/
      hooks/
    popup/
      main.tsx
      App.tsx
    lib/
      db.ts                # IndexedDB wrapper
      storage.ts            # chrome.storage.local wrapper
      repositories/
      search.ts
      types.ts
    components/ui/          # shadcn-generated components
  tailwind.config.ts
  vite.config.ts
  package.json
  tsconfig.json
```
 
---
 
## 8. Constraints for the agent
 
- No backend server. No network calls other than to YC's own data source(s).
- All personal data (notes, collections, tags) never leaves the browser.
- Strict TypeScript; avoid `any` unless genuinely unavoidable.
- Build UI from shadcn primitives; don't hand-roll components shadcn already
  covers.
- Work phase-by-phase. After each phase, build and confirm the extension loads
  unpacked in Chrome before continuing.
- If a decision in this doc turns out to be wrong once you've seen the actual
  FastAPI code or YC's actual page structure, flag it and propose the
  adjustment — don't silently work around it.
---
 
## 9. First task
 
Start with **Phase 0**. Before writing any data-fetching code, inspect the
existing FastAPI project to see exactly how it currently sources YC startup
data, and port that approach into the TypeScript background worker rather than
building a new scraper/fetcher from scratch.