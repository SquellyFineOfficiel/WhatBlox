# Styling Guide

All app-wide styles are centralized in this folder for easy modification.

## Structure

- **globals.css** – Global Tailwind directives and base styles
  - Tailwind utilities (`@tailwind`)
  - Root variables and color scheme
  - Base element styling (body, img, etc.)

## How to Customize

### Global Colors & Spacing
Edit `globals.css` or modify `tailwind.config.ts` in the project root for theme configuration.

### Component Styles
Component styles use Tailwind utility classes directly in TSX files (e.g., `className="rounded-lg bg-white"`). This keeps styles co-located with components.

### Adding New Global Styles
1. Add CSS rules to `globals.css`
2. Use `@apply` directive to compose Tailwind classes if needed
3. Rebuild: `npm run build`

## Build & Development

- **Dev:** `npm run dev` – Live reload with Turbopack
- **Build:** `npm run build` – Production-optimized build
- **Lint:** `npm run lint` – Check code quality

Styles are automatically processed via Tailwind CSS and PostCSS pipeline.
