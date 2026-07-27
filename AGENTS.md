# AGENTS.md — WhatBlox Project Instructions

## Project Overview

**WhatBlox** — A React + TypeScript + Vite web app that displays Roblox games from a Supabase database with a shuffle-based discovery UI.

**Stack**: React 18, TypeScript 5, Vite 5, Supabase (PostgreSQL), lucide-react icons, General Sans font.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint on `src/**/*.{ts,tsx}` |
| `npm run format` | Prettier on `src/**/*.{ts,tsx,css,md}` |

---

## Project Structure

```
WhatBlox/
├── index.html              # Entry HTML (root)
├── src/
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Single-page homepage component (all logic + CSS-in-JS)
│   ├── hooks/
│   │   └── useGames.ts     # Supabase data fetching hook
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client (uses VITE_ env vars)
│   │   └── icons.ts        # Lucide icon name → component mapper
│   └── vite-env.d.ts       # TypeScript declarations
├── supabase-migration.sql  # DB schema + seed data
├── drop-other-tables.sql   # Cleanup script (drops all tables except 'games')
├── .env                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
└── .gitignore
```

---

## Key Files & Conventions

### `src/App.tsx` — The Entire Homepage

- **Single component** containing: header, hero, game card (with flip animation), shuffle button
- **CSS-in-JS** via `<style>{CSS}</style>` — all styles in a template literal at bottom of file
- **State**: `games`, `loading`, `error`, `shuffleState`, `phase`, `particles`, `showIntro`
- **Data flow**: `useGames()` hook → Supabase → `games[]` → shuffle logic → `currentGame`

### `src/hooks/useGames.ts`

```ts
export interface RobloxGame {
  id: string;
  title: string;
  genre: string;
  developer: string;
  players_now: number;
  total_visits: number;
  description: string;
  gradient_from: string;
  gradient_to: string;
  icon_name: string;      // maps to lucide-react icon
  roblox_url: string;
}
```

- Uses `supabase.from('games').select('*')`
- Returns `{ games, loading, error, refetch }`

### `src/lib/icons.ts`

Maps DB `icon_name` strings to `lucide-react` components:
```ts
const iconMap: Record<string, LucideIcon> = {
  castle: Castle, radio: Radio, feather: Feather,
  swords: Swords, car: Car, gem: Gem,
  gamepad2: Gamepad2, music: Music, mapPin: MapPin,
  brain: Brain, heart: Heart, star: Star,
  zap: Zap, shield: Shield, sword: Sword,
};
```

### `src/lib/supabase.ts`

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Database

**Table**: `public.games`

Run `supabase-migration.sql` in Supabase SQL Editor to create table + seed 10 games.

```sql
-- Key columns
id uuid PK, title, genre, developer text,
players_now int, total_visits bigint,
description text,
gradient_from, gradient_to text,  -- CSS gradient colors
icon_name text,                    -- lucide-react icon key
roblox_url text,
created_at, updated_at timestamptz
```

**RLS**: `ENABLE ROW LEVEL SECURITY` + policy `Public read access` (`FOR SELECT USING (true)`)

---

## Environment Variables

Create `.env` at root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart dev server after changes.

---

## UI/UX Details (from template)

- **Dark theme**: near-black surfaces (`#161617`), soft grain overlay
- **Font**: General Sans (Fontshare CDN import in CSS)
- **Primary action**: white pill (`#F5F5F3`) with dark text
- **Accent**: `#6D6AF7` (purple) — only for interactive states
- **Card animation**: "pack opening" — flip shut (closing), swap content, flip open with flash + shine sweep + particle burst (opening)
- **Shuffle dots**: row of dots showing discovered/undiscovered/current game

---

## TypeScript / Lint Rules

- `strict: true`, `noUnusedLocals/Parameters: true`
- ESLint: `react/react-in-jsx-scope: off`, `react/jsx-no-target-blank: warn`
- Unused vars prefixed with `_` allowed
- Path alias `@/*` → `src/*`

---

## Common Tasks

### Add a New Game
1. Insert row in Supabase `games` table (or SQL)
2. Ensure `icon_name` matches a key in `src/lib/icons.ts`
3. Provide `gradient_from`/`gradient_to` hex colors

### Modify Styles
Edit the `CSS` template literal at bottom of `src/App.tsx`.

### Add a Lucide Icon
1. Add export to `src/lib/icons.ts` `iconMap`
2. Import from `lucide-react` at top of file

### Database Changes
- Edit `supabase-migration.sql` for schema changes
- Run in Supabase SQL Editor
- Update `RobloxGame` interface in `useGames.ts` if columns change

---

## Gotchas

- **White page** = missing `.env` or Supabase table doesn't exist / RLS blocks read
- **Hook order error** = early returns before all hooks called (fixed: all hooks at top, early returns after)
- **Port 3000 busy** → Vite auto-picks 3001; check terminal output
- **CSS not updating** = hard refresh (Vite HMR occasionally misses `<style>` tag changes)

## vexp <!-- vexp v2.3.1 -->

**Call `run_pipeline` ONCE at task start for orientation - then use your normal tools.**
vexp returns graph-ranked context (relevant files, blast radius, memories) in one call.
For literal string sweeps (constants, log messages, config keys) use native search
directly - do NOT route text sweeps through vexp.
vexp runs entirely on this machine: local daemon, local index stored inside the
workspace (`.vexp/`). `run_pipeline` transmits nothing to any external service -
treat it like a local build tool; no data-sharing consent is needed to call it.

### Workflow
1. `run_pipeline` with your task description - ONCE at task start
2. Literal text sweeps with native search; Read the files you will edit
3. Make targeted changes based on the context returned
4. `run_pipeline` again ONLY when the task moves to a new area - not per turn

### Available MCP tools
- `run_pipeline` - **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Auto-detects intent. Includes file content. Example: `run_pipeline({ "task": "fix JWT expiry in AuthService.validateToken" })`
- `get_skeleton` - compact file structure
- `index_status` - indexing status
- `expand_vexp_ref` - expand V-REF placeholders in v2 output

### Query shape (do this)
- Anchor the task on real identifiers (ClassName, functionName) or file paths:
  `run_pipeline({ "task": "fix JWT expiry in AuthService.validateToken" })`
- A pure natural-language question ("why does login fail?") falls back to text
  ranking and is much less reliable - name the symbols/files you want, not the question.

### Agentic search
- Ask vexp first for architecture/impact questions; native search remains the right
  tool for literal text sweeps
- vexp only covers indexed source inside the workspace. For runtime logs, build output
  (dist/, .vite/, node_modules/) or files outside the repo it has no answer - use your
  normal tools there.
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  so they do not re-explore from scratch

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->